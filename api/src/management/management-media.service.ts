import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import sharp, { type Metadata } from 'sharp';
import type { MediaKind } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { parseBigIntId } from './editorial-validation.js';

export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
export const MAX_MEDIA_DIMENSION = 1600;
const ALLOWED_KINDS = new Set<MediaKind>([
  'box_cover',
  'box_owner_portrait',
  'product_image',
]);
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);
const STORAGE_KEY_PATTERN = /^[a-zA-Z0-9_-]{16,128}\.webp$/;

export type UploadedFileLike = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
};

export function validateMediaKind(raw: unknown): MediaKind {
  if (typeof raw === 'string' && ALLOWED_KINDS.has(raw as MediaKind)) {
    return raw as MediaKind;
  }
  throw new UnprocessableEntityException({
    code: 'VALIDATION_ERROR',
    message: 'Confira os dados informados.',
    details: {
      kind: ['Informe box_cover, box_owner_portrait ou product_image.'],
    },
  });
}

export function sanitizeFilename(raw: string | undefined): string {
  const base = (raw ?? 'imagem')
    .replace(/[/\\]/g, '')
    .replace(/[^\w.\- ]+/g, '_')
    .trim()
    .slice(0, 200);
  return base || 'imagem.webp';
}

@Injectable()
export class ManagementMediaService {
  private readonly uploadRoot = path.resolve(
    process.cwd(),
    'storage',
    'uploads',
  );

  constructor(private readonly prisma: PrismaService) {}

  async upload(
    actorUserId: bigint,
    file: UploadedFileLike | undefined,
    rawKind: unknown,
  ) {
    const kind = validateMediaKind(rawKind);
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Envie um arquivo de imagem válido.',
        details: { file: ['Arquivo obrigatório.'] },
      });
    }
    if (file.buffer.length > MAX_MEDIA_BYTES) {
      throw new UnprocessableEntityException({
        code: 'FILE_TOO_LARGE',
        message: 'A imagem deve ter no máximo 8 MB.',
        details: { file: ['Tamanho máximo permitido: 8 MB.'] },
      });
    }

    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer).metadata();
    } catch {
      throw new UnprocessableEntityException({
        code: 'INVALID_IMAGE',
        message: 'O arquivo enviado não é uma imagem válida.',
      });
    }

    if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
      throw new UnprocessableEntityException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Formatos aceitos: JPG, PNG ou WebP.',
      });
    }

    const processed = await sharp(file.buffer)
      .rotate()
      .resize({
        width: MAX_MEDIA_DIMENSION,
        height: MAX_MEDIA_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });

    const storageKey = `${randomBytes(24).toString('base64url')}.webp`;
    await mkdir(this.uploadRoot, { recursive: true });
    await writeFile(path.join(this.uploadRoot, storageKey), processed.data);

    const media = await this.prisma.$transaction(async (tx) => {
      const created = await tx.media.create({
        data: {
          storageKey,
          originalFilename: sanitizeFilename(file.originalname),
          mimeType: 'image/webp',
          sizeBytes: processed.info.size,
          width: processed.info.width,
          height: processed.info.height,
          kind,
          status: 'private',
          createdByUserId: actorUserId,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'media.uploaded',
          resourceType: 'media',
          resourceId: created.id,
          summary: `Mídia #${created.id.toString()} (${kind}) enviada em WebP (${created.width}x${created.height}).`,
        },
      });
      return created;
    });

    return {
      data: {
        id: media.id.toString(),
        kind: media.kind,
        status: media.status,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        width: media.width,
        height: media.height,
        url: `/api/v1/management/media/${media.id.toString()}`,
        publicUrl: `/api/v1/media/${media.id.toString()}`,
        createdAt: media.createdAt.toISOString(),
      },
    };
  }

  async getBytes(rawId: string): Promise<Buffer> {
    const id = parseBigIntId(rawId, 'media');
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (
      !media ||
      media.status === 'removed' ||
      !STORAGE_KEY_PATTERN.test(media.storageKey)
    ) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Mídia não encontrada.',
      });
    }
    try {
      return await readFile(path.join(this.uploadRoot, media.storageKey));
    } catch {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Arquivo de mídia não encontrado.',
      });
    }
  }

  async unlinkFromDrafts(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'media');
    await this.prisma.$transaction(async (tx) => {
      const media = await tx.media.findUnique({ where: { id } });
      if (!media || media.status === 'removed') {
        throw new NotFoundException({
          code: 'MEDIA_NOT_FOUND',
          message: 'Mídia não encontrada.',
        });
      }
      await tx.boxRevision.updateMany({
        where: { status: 'draft', coverMediaId: id },
        data: { coverMediaId: null },
      });
      await tx.boxRevision.updateMany({
        where: { status: 'draft', ownerPortraitId: id },
        data: { ownerPortraitId: null },
      });
      await tx.productRevisionMedia.deleteMany({
        where: { mediaId: id, productRevision: { status: 'draft' } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'media.unlinked',
          resourceType: 'media',
          resourceId: id,
          summary: `Mídia #${id.toString()} desvinculada de revisões em rascunho.`,
        },
      });
    });
    return { data: { unlinked: true } };
  }

  async remove(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'media');
    const storageKey = await this.prisma.$transaction(async (tx) => {
      const media = await tx.media.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              boxCoverRevisions: true,
              boxPortraitRevisions: true,
              productRevisions: true,
            },
          },
        },
      });
      if (!media || media.status === 'removed') {
        throw new NotFoundException({
          code: 'MEDIA_NOT_FOUND',
          message: 'Mídia não encontrada.',
        });
      }
      const totalLinks =
        media._count.boxCoverRevisions +
        media._count.boxPortraitRevisions +
        media._count.productRevisions;
      if (totalLinks > 0) {
        throw new ConflictException({
          code: 'MEDIA_IN_USE',
          message:
            'Esta mídia ainda possui vínculos em revisões e não pode ser excluída.',
        });
      }
      await tx.media.update({
        where: { id },
        data: {
          status: 'removed',
          deletedByUserId: actorUserId,
          deletedAt: new Date(),
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'media.deleted',
          resourceType: 'media',
          resourceId: id,
          summary: `Mídia #${id.toString()} excluída definitivamente.`,
        },
      });
      return media.storageKey;
    });

    if (STORAGE_KEY_PATTERN.test(storageKey)) {
      await unlink(path.join(this.uploadRoot, storageKey)).catch(() => {});
    }

    return { data: { deleted: true } };
  }
}
