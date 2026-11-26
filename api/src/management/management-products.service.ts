import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { generateUniqueSlug } from './editorial-slug.js';
import {
  type FieldErrors,
  type JsonBody,
  addFieldError,
  normalizeSearch,
  parseBigIntId,
  parseManagementPagination,
  parseOptionalBigInt,
  parseOptionalString,
  parsePositiveInt,
  parseReturnComment,
  throwIfValidationErrors,
} from './editorial-validation.js';

const WORKING_STATUSES = ['draft', 'in_review', 'ready'] as const;

const productDetailInclude = {
  revisions: {
    orderBy: { number: 'desc' as const },
    include: {
      category: true,
      box: true,
      media: { orderBy: { position: 'asc' as const } },
    },
  },
} as const;

type ProductWithRevisions = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;
type ProductRevisionWithRelations = ProductWithRevisions['revisions'][number];

function serializeProductRevision(rev: ProductRevisionWithRelations) {
  return {
    id: rev.id.toString(),
    number: rev.number,
    version: rev.version,
    status: rev.status,
    name: rev.name,
    slug: rev.slug,
    boxId: rev.boxId ? rev.boxId.toString() : null,
    categoryId: rev.categoryId ? rev.categoryId.toString() : null,
    description: rev.description,
    priceCents: rev.priceCents,
    media: rev.media.map((m) => ({
      mediaId: m.mediaId.toString(),
      position: m.position,
      isCover: m.isCover,
    })),
    createdAt: rev.createdAt.toISOString(),
    updatedAt: rev.updatedAt.toISOString(),
    publishedAt: rev.publishedAt ? rev.publishedAt.toISOString() : null,
    supersededAt: rev.supersededAt ? rev.supersededAt.toISOString() : null,
  };
}

function serializeProduct(product: ProductWithRevisions) {
  const publishedRevision =
    product.revisions.find((r) => r.status === 'published') ?? null;
  const workingRevision =
    product.revisions.find((r) =>
      (WORKING_STATUSES as readonly string[]).includes(r.status),
    ) ?? null;
  return {
    id: product.id.toString(),
    status: product.status,
    version: product.version,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    publishedAt: product.publishedAt
      ? product.publishedAt.toISOString()
      : null,
    inactivatedAt: product.inactivatedAt
      ? product.inactivatedAt.toISOString()
      : null,
    publishedRevision: publishedRevision
      ? serializeProductRevision(publishedRevision)
      : null,
    workingRevision: workingRevision
      ? serializeProductRevision(workingRevision)
      : null,
  };
}

type ParsedMediaInput = {
  mediaId: bigint;
  position: number;
  isCover: boolean;
};

type ParsedProductFields = {
  name?: string | null;
  boxId?: bigint | null;
  categoryId?: bigint | null;
  description?: string | null;
  priceCents?: number | null;
  media?: ParsedMediaInput[];
};

function parseProductFields(body: JsonBody): ParsedProductFields {
  const errors: FieldErrors = {};
  const result: ParsedProductFields = {};

  const name = parseOptionalString(body.name, 'name', 2, 130, errors);
  if (name !== undefined) result.name = name;

  const boxId = parseOptionalBigInt(body.boxId, 'boxId', errors);
  if (boxId !== undefined) result.boxId = boxId;

  const categoryId = parseOptionalBigInt(body.categoryId, 'categoryId', errors);
  if (categoryId !== undefined) result.categoryId = categoryId;

  const description = parseOptionalString(
    body.description,
    'description',
    1,
    2000,
    errors,
  );
  if (description !== undefined) result.description = description;

  if (body.priceCents !== undefined) {
    if (body.priceCents === null || body.priceCents === '') {
      result.priceCents = null;
    } else if (
      typeof body.priceCents === 'number' &&
      Number.isInteger(body.priceCents) &&
      body.priceCents >= 0
    ) {
      result.priceCents = body.priceCents;
    } else {
      addFieldError(
        errors,
        'priceCents',
        'Informe um valor inteiro em centavos (maior ou igual a 0).',
      );
    }
  }

  if (body.media !== undefined) {
    if (!Array.isArray(body.media)) {
      addFieldError(errors, 'media', 'Informe uma lista de mídias.');
    } else if (body.media.length > 5) {
      addFieldError(errors, 'media', 'Informe no máximo 5 mídias por produto.');
    } else {
      const seen = new Set<string>();
      const parsedMedia: ParsedMediaInput[] = [];
      let coverCount = 0;
      body.media.forEach((entry, index) => {
        if (!entry || typeof entry !== 'object') {
          addFieldError(errors, 'media', 'Entrada de mídia inválida.');
          return;
        }
        const record = entry as Record<string, unknown>;
        const mediaId = parseOptionalBigInt(record.mediaId, 'media', errors);
        if (!mediaId) {
          addFieldError(errors, 'media', 'Informe um mediaId válido.');
          return;
        }
        const key = mediaId.toString();
        if (seen.has(key)) {
          addFieldError(errors, 'media', 'Não repita a mesma mídia.');
          return;
        }
        seen.add(key);
        const isCover = Boolean(record.isCover);
        if (isCover) coverCount++;
        const position =
          typeof record.position === 'number' &&
          Number.isInteger(record.position) &&
          record.position >= 1
            ? record.position
            : index + 1;
        parsedMedia.push({ mediaId, position, isCover });
      });
      if (parsedMedia.length > 0 && coverCount === 0) {
        parsedMedia[0].isCover = true;
      } else if (coverCount > 1) {
        addFieldError(errors, 'media', 'Selecione apenas uma mídia de capa.');
      }
      result.media = parsedMedia;
    }
  }

  throwIfValidationErrors(errors);
  return result;
}

@Injectable()
export class ManagementProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async isProductSlugTaken(
    tx: Prisma.TransactionClient,
    slug: string,
    ownProductId?: bigint,
  ): Promise<boolean> {
    const reserved = await tx.productSlug.findUnique({ where: { slug } });
    if (reserved && reserved.productId !== ownProductId) return true;
    const activeRevision = await tx.productRevision.findFirst({
      where: {
        slug,
        status: { in: ['draft', 'in_review', 'ready', 'published'] },
        ...(ownProductId ? { productId: { not: ownProductId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(activeRevision);
  }

  private async loadProductOrThrow(id: bigint): Promise<ProductWithRevisions> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produto não encontrado.',
      });
    }
    return product;
  }

  async list(query: Record<string, unknown>) {
    const { page, perPage, q, status } = parseManagementPagination(query);
    const products = await this.prisma.product.findMany({
      include: productDetailInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
    const search = normalizeSearch(q);
    const filtered = products.filter((product) => {
      if (status && product.status !== status) return false;
      if (!search) return true;
      const rev =
        product.revisions.find((r) =>
          (WORKING_STATUSES as readonly string[]).includes(r.status),
        ) ?? product.revisions[0];
      const haystack = normalizeSearch(
        [rev?.name ?? '', rev?.category?.name ?? ''].join(' '),
      );
      return haystack.includes(search);
    });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const slice = filtered.slice((page - 1) * perPage, page * perPage);
    return {
      data: slice.map(serializeProduct),
      meta: { page, perPage, total, totalPages },
    };
  }

  async getById(rawId: string) {
    const id = parseBigIntId(rawId, 'product');
    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async create(actorUserId: bigint, body: JsonBody) {
    const fields = parseProductFields(body);
    const createdId = await this.prisma.$transaction(async (tx) => {
      const slug = fields.name
        ? await generateUniqueSlug(fields.name, (c) =>
            this.isProductSlugTaken(tx, c),
          )
        : null;
      const product = await tx.product.create({
        data: {
          status: 'unpublished',
          createdByUserId: actorUserId,
        },
      });
      const revision = await tx.productRevision.create({
        data: {
          productId: product.id,
          number: 1,
          status: 'draft',
          name: fields.name ?? null,
          slug,
          boxId: fields.boxId ?? null,
          categoryId: fields.categoryId ?? null,
          description: fields.description ?? null,
          priceCents: fields.priceCents ?? null,
          createdByUserId: actorUserId,
          ...(fields.media && fields.media.length > 0
            ? {
                media: {
                  create: fields.media.map((m) => ({
                    mediaId: m.mediaId,
                    position: m.position,
                    isCover: m.isCover,
                  })),
                },
              }
            : {}),
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.created',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Produto #${product.id.toString()} criado em rascunho (revisão ${revision.number}).`,
        },
      });
      return product.id;
    });
    return { data: serializeProduct(await this.loadProductOrThrow(createdId)) };
  }

  async updateRevision(actorUserId: bigint, rawId: string, body: JsonBody) {
    const id = parseBigIntId(rawId, 'product');
    const errors: FieldErrors = {};
    const expectedVersion = parsePositiveInt(body.version, 'version', errors);
    throwIfValidationErrors(errors);
    const fields = parseProductFields(body);

    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }

      let working = product.revisions.find((r) =>
        (WORKING_STATUSES as readonly string[]).includes(r.status),
      );

      if (!working) {
        if (product.version !== expectedVersion) {
          throw new ConflictException({
            code: 'VERSION_CONFLICT',
            message:
              'O registro foi alterado por outra ação. Atualize e tente novamente.',
          });
        }
        const base = product.revisions.find((r) => r.status === 'published');
        const nextNumber = (product.revisions[0]?.number ?? 0) + 1;
        const nextName =
          fields.name !== undefined ? fields.name : (base?.name ?? null);
        const slug = nextName
          ? await generateUniqueSlug(nextName, (c) =>
              this.isProductSlugTaken(tx, c, product.id),
            )
          : null;
        const mediaItems =
          fields.media ??
          base?.media.map((m) => ({
            mediaId: m.mediaId,
            position: m.position,
            isCover: m.isCover,
          })) ??
          [];
        working = await tx.productRevision.create({
          data: {
            productId: product.id,
            number: nextNumber,
            status: 'draft',
            name: nextName,
            slug,
            boxId:
              fields.boxId !== undefined ? fields.boxId : (base?.boxId ?? null),
            categoryId:
              fields.categoryId !== undefined
                ? fields.categoryId
                : (base?.categoryId ?? null),
            description:
              fields.description !== undefined
                ? fields.description
                : (base?.description ?? null),
            priceCents:
              fields.priceCents !== undefined
                ? fields.priceCents
                : (base?.priceCents ?? null),
            createdByUserId: actorUserId,
            ...(mediaItems.length > 0
              ? {
                  media: {
                    create: mediaItems.map((m) => ({
                      mediaId: m.mediaId,
                      position: m.position,
                      isCover: m.isCover,
                    })),
                  },
                }
              : {}),
          },
          include: {
            category: true,
            box: true,
            media: { orderBy: { position: 'asc' } },
          },
        });
      } else {
        if (working.version !== expectedVersion) {
          throw new ConflictException({
            code: 'VERSION_CONFLICT',
            message:
              'A revisão foi alterada por outra ação. Atualize e tente novamente.',
          });
        }
        const nextName =
          fields.name !== undefined ? fields.name : working.name;
        const slug =
          fields.name !== undefined
            ? nextName
              ? await generateUniqueSlug(nextName, (c) =>
                  this.isProductSlugTaken(tx, c, product.id),
                )
              : null
            : working.slug;

        if (fields.media !== undefined) {
          await tx.productRevisionMedia.deleteMany({
            where: { productRevisionId: working.id },
          });
        }
        await tx.productRevision.update({
          where: { id: working.id },
          data: {
            status: 'draft',
            version: { increment: 1 },
            ...(fields.name !== undefined ? { name: fields.name, slug } : {}),
            ...(fields.boxId !== undefined ? { boxId: fields.boxId } : {}),
            ...(fields.categoryId !== undefined
              ? { categoryId: fields.categoryId }
              : {}),
            ...(fields.description !== undefined
              ? { description: fields.description }
              : {}),
            ...(fields.priceCents !== undefined
              ? { priceCents: fields.priceCents }
              : {}),
            ...(fields.media && fields.media.length > 0
              ? {
                  media: {
                    create: fields.media.map((m) => ({
                      mediaId: m.mediaId,
                      position: m.position,
                      isCover: m.isCover,
                    })),
                  },
                }
              : {}),
          },
        });
      }

      if (product.status === 'inactive') {
        await tx.product.update({
          where: { id: product.id },
          data: {
            status: 'unpublished',
            inactivatedAt: null,
            version: { increment: 1 },
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.revision_updated',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Revisão ${working.number} do produto #${product.id.toString()} atualizada.`,
        },
      });
    });

    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async submitReview(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'product');
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }
      const working = product.revisions.find((r) => r.status === 'draft');
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Não há revisão em rascunho para enviar à revisão.',
        });
      }
      await tx.productRevision.update({
        where: { id: working.id },
        data: { status: 'in_review', version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.submitted_for_review',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Revisão ${working.number} do produto #${product.id.toString()} enviada para revisão.`,
        },
      });
    });
    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async approve(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'product');
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }
      const working = product.revisions.find((r) => r.status === 'in_review');
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Não há revisão aguardando aprovação.',
        });
      }
      await tx.productRevision.update({
        where: { id: working.id },
        data: { status: 'ready', version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.approved',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Revisão ${working.number} do produto #${product.id.toString()} aprovada.`,
        },
      });
    });
    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async returnRevision(actorUserId: bigint, rawId: string, body: JsonBody) {
    const id = parseBigIntId(rawId, 'product');
    const comment = parseReturnComment(body);
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }
      const working = product.revisions.find(
        (r) => r.status === 'in_review' || r.status === 'ready',
      );
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Não há revisão em análise para devolver.',
        });
      }
      await tx.productRevision.update({
        where: { id: working.id },
        data: { status: 'draft', version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.returned',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Revisão ${working.number} do produto #${product.id.toString()} devolvida para rascunho.`,
          reason: comment,
        },
      });
    });
    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async publish(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'product');
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }
      const working = product.revisions.find((r) => r.status === 'ready');
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Somente revisões prontas podem ser publicadas.',
        });
      }

      const errors: FieldErrors = {};
      if (!working.name) addFieldError(errors, 'name', 'Nome é obrigatório.');
      if (!working.boxId || !working.box) {
        addFieldError(errors, 'boxId', 'Box vinculado é obrigatório.');
      } else if (working.box.status !== 'published') {
        addFieldError(
          errors,
          'boxId',
          'O box vinculado precisa estar publicado para publicar este produto.',
        );
      }
      if (!working.categoryId || !working.category || !working.category.active) {
        addFieldError(
          errors,
          'categoryId',
          'Vincule uma categoria ativa.',
        );
      }
      if (working.media.length < 1 || working.media.length > 5) {
        addFieldError(
          errors,
          'media',
          'O produto precisa ter entre 1 e 5 mídias para publicar.',
        );
      }
      throwIfValidationErrors(errors);

      const finalSlug = await generateUniqueSlug(working.name!, (c) =>
        this.isProductSlugTaken(tx, c, product.id),
      );
      const now = new Date();

      const previousPublished = product.revisions.find(
        (r) => r.status === 'published',
      );
      if (previousPublished) {
        await tx.productRevision.update({
          where: { id: previousPublished.id },
          data: { status: 'superseded', supersededAt: now },
        });
      }

      await tx.productRevision.update({
        where: { id: working.id },
        data: {
          status: 'published',
          slug: finalSlug,
          publishedAt: now,
          version: { increment: 1 },
        },
      });

      const mediaIds = working.media.map((m) => m.mediaId);
      if (mediaIds.length > 0) {
        await tx.media.updateMany({
          where: { id: { in: mediaIds }, status: 'private' },
          data: { status: 'linked' },
        });
      }

      await tx.productSlug.upsert({
        where: { slug: finalSlug },
        update: {},
        create: { slug: finalSlug, productId: product.id, firstPublishedAt: now },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          status: 'published',
          publishedAt: product.publishedAt ?? now,
          inactivatedAt: null,
          version: { increment: 1 },
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.published',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Produto #${product.id.toString()} publicado (revisão ${working.number}, slug ${finalSlug}).`,
        },
      });
    });

    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async deactivate(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'product');
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }
      if (product.status === 'inactive') {
        throw new UnprocessableEntityException({
          code: 'ALREADY_INACTIVE',
          message: 'Este produto já está inativado.',
        });
      }
      const existingWorking = product.revisions.find((r) =>
        (WORKING_STATUSES as readonly string[]).includes(r.status),
      );
      if (existingWorking) {
        if (existingWorking.status !== 'ready') {
          await tx.productRevision.update({
            where: { id: existingWorking.id },
            data: { status: 'ready', version: { increment: 1 } },
          });
        }
      } else {
        const base = product.revisions.find((r) => r.status === 'published');
        if (base) {
          const nextNumber = (product.revisions[0]?.number ?? 0) + 1;
          await tx.productRevision.create({
            data: {
              productId: product.id,
              number: nextNumber,
              status: 'ready',
              name: base.name,
              slug: base.slug,
              boxId: base.boxId,
              categoryId: base.categoryId,
              description: base.description,
              priceCents: base.priceCents,
              createdByUserId: actorUserId,
              ...(base.media.length > 0
                ? {
                    media: {
                      create: base.media.map((m) => ({
                        mediaId: m.mediaId,
                        position: m.position,
                        isCover: m.isCover,
                      })),
                    },
                  }
                : {}),
            },
          });
        }
      }
      await tx.product.update({
        where: { id: product.id },
        data: {
          status: 'inactive',
          inactivatedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.deactivated',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Produto #${product.id.toString()} inativado e mantido pronto para reativação.`,
        },
      });
    });
    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }

  async reactivate(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'product');
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: productDetailInclude,
      });
      if (!product) {
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
        });
      }
      if (product.status !== 'inactive') {
        throw new ConflictException({
          code: 'INVALID_CONTENT_STATE',
          message: 'Somente produtos inativados podem ser reativados.',
        });
      }
      const now = new Date();
      const readyRevision = product.revisions.find((r) => r.status === 'ready');
      if (readyRevision) {
        const previousPublished = product.revisions.find(
          (r) => r.status === 'published',
        );
        if (previousPublished) {
          await tx.productRevision.update({
            where: { id: previousPublished.id },
            data: { status: 'superseded', supersededAt: now },
          });
        }
        await tx.productRevision.update({
          where: { id: readyRevision.id },
          data: {
            status: 'published',
            publishedAt: now,
            version: { increment: 1 },
          },
        });
        const mediaIds = readyRevision.media.map((m) => m.mediaId);
        if (mediaIds.length > 0) {
          await tx.media.updateMany({
            where: { id: { in: mediaIds }, status: 'private' },
            data: { status: 'linked' },
          });
        }
      }
      await tx.product.update({
        where: { id: product.id },
        data: {
          status: 'published',
          publishedAt: product.publishedAt ?? now,
          inactivatedAt: null,
          version: { increment: 1 },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'product.reactivated',
          resourceType: 'product',
          resourceId: product.id,
          summary: `Produto #${product.id.toString()} reativado na vitrine pública.`,
        },
      });
    });
    return { data: serializeProduct(await this.loadProductOrThrow(id)) };
  }
}
