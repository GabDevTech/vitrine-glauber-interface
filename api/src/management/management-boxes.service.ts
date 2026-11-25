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

const boxDetailInclude = {
  revisions: {
    orderBy: { number: 'desc' as const },
    include: {
      categories: { include: { category: true } },
    },
  },
} as const;

type BoxWithRevisions = Prisma.BoxGetPayload<{
  include: typeof boxDetailInclude;
}>;
type BoxRevisionWithCategories = BoxWithRevisions['revisions'][number];

function serializeBoxRevision(rev: BoxRevisionWithCategories) {
  return {
    id: rev.id.toString(),
    number: rev.number,
    version: rev.version,
    status: rev.status,
    name: rev.name,
    slug: rev.slug,
    ownerName: rev.ownerName,
    boxNumber: rev.boxNumber,
    location: rev.location,
    openingHours: rev.openingHours,
    description: rev.description,
    story: rev.story,
    whatsapp: rev.whatsapp,
    allowPublicContact: rev.allowPublicContact,
    coverMediaId: rev.coverMediaId ? rev.coverMediaId.toString() : null,
    ownerPortraitId: rev.ownerPortraitId ? rev.ownerPortraitId.toString() : null,
    categoryIds: rev.categories.map((c) => c.categoryId.toString()),
    categories: rev.categories.map((c) => ({
      id: c.category.id.toString(),
      code: c.category.code,
      name: c.category.name,
      active: c.category.active,
    })),
    createdAt: rev.createdAt.toISOString(),
    updatedAt: rev.updatedAt.toISOString(),
    publishedAt: rev.publishedAt ? rev.publishedAt.toISOString() : null,
    supersededAt: rev.supersededAt ? rev.supersededAt.toISOString() : null,
  };
}

function serializeBox(box: BoxWithRevisions) {
  const publishedRevision =
    box.revisions.find((r) => r.status === 'published') ?? null;
  const workingRevision =
    box.revisions.find((r) =>
      (WORKING_STATUSES as readonly string[]).includes(r.status),
    ) ?? null;
  return {
    id: box.id.toString(),
    boxNumber: box.boxNumber,
    status: box.status,
    version: box.version,
    createdAt: box.createdAt.toISOString(),
    updatedAt: box.updatedAt.toISOString(),
    publishedAt: box.publishedAt ? box.publishedAt.toISOString() : null,
    inactivatedAt: box.inactivatedAt ? box.inactivatedAt.toISOString() : null,
    publishedRevision: publishedRevision
      ? serializeBoxRevision(publishedRevision)
      : null,
    workingRevision: workingRevision
      ? serializeBoxRevision(workingRevision)
      : null,
  };
}

type ParsedBoxFields = {
  name?: string | null;
  ownerName?: string | null;
  boxNumber?: number | null;
  location?: string | null;
  openingHours?: string | null;
  description?: string | null;
  story?: string | null;
  whatsapp?: string | null;
  allowPublicContact?: boolean;
  coverMediaId?: bigint | null;
  ownerPortraitId?: bigint | null;
  categoryIds?: bigint[];
};

function parseBoxFields(body: JsonBody): ParsedBoxFields {
  const errors: FieldErrors = {};
  const result: ParsedBoxFields = {};

  const name = parseOptionalString(body.name, 'name', 2, 130, errors);
  if (name !== undefined) result.name = name;

  const ownerName = parseOptionalString(
    body.ownerName,
    'ownerName',
    2,
    130,
    errors,
  );
  if (ownerName !== undefined) result.ownerName = ownerName;

  if (body.boxNumber !== undefined) {
    if (body.boxNumber === null || body.boxNumber === '') {
      result.boxNumber = null;
    } else {
      const num = parsePositiveInt(body.boxNumber, 'boxNumber', errors);
      if (num !== undefined) result.boxNumber = num;
    }
  }

  const location = parseOptionalString(
    body.location,
    'location',
    1,
    180,
    errors,
  );
  if (location !== undefined) result.location = location;

  const openingHours = parseOptionalString(
    body.openingHours,
    'openingHours',
    1,
    180,
    errors,
  );
  if (openingHours !== undefined) result.openingHours = openingHours;

  const description = parseOptionalString(
    body.description,
    'description',
    1,
    2000,
    errors,
  );
  if (description !== undefined) result.description = description;

  const story = parseOptionalString(body.story, 'story', 1, 5000, errors);
  if (story !== undefined) result.story = story;

  const whatsapp = parseOptionalString(
    body.whatsapp,
    'whatsapp',
    8,
    30,
    errors,
  );
  if (whatsapp !== undefined) result.whatsapp = whatsapp;

  if (body.allowPublicContact !== undefined) {
    if (typeof body.allowPublicContact !== 'boolean') {
      addFieldError(
        errors,
        'allowPublicContact',
        'Informe verdadeiro ou falso.',
      );
    } else {
      result.allowPublicContact = body.allowPublicContact;
    }
  }

  const coverMediaId = parseOptionalBigInt(
    body.coverMediaId,
    'coverMediaId',
    errors,
  );
  if (coverMediaId !== undefined) result.coverMediaId = coverMediaId;

  const ownerPortraitId = parseOptionalBigInt(
    body.ownerPortraitId,
    'ownerPortraitId',
    errors,
  );
  if (ownerPortraitId !== undefined) result.ownerPortraitId = ownerPortraitId;

  if (body.categoryIds !== undefined) {
    if (!Array.isArray(body.categoryIds)) {
      addFieldError(errors, 'categoryIds', 'Informe uma lista de categorias.');
    } else {
      const ids: bigint[] = [];
      for (const item of body.categoryIds) {
        const parsed = parseOptionalBigInt(item, 'categoryIds', errors);
        if (parsed) ids.push(parsed);
      }
      result.categoryIds = [...new Set(ids)];
    }
  }

  throwIfValidationErrors(errors);
  return result;
}

@Injectable()
export class ManagementBoxesService {
  constructor(private readonly prisma: PrismaService) {}

  private async isBoxSlugTaken(
    tx: Prisma.TransactionClient,
    slug: string,
    ownBoxId?: bigint,
  ): Promise<boolean> {
    const reserved = await tx.boxSlug.findUnique({ where: { slug } });
    if (reserved && reserved.boxId !== ownBoxId) return true;
    const activeRevision = await tx.boxRevision.findFirst({
      where: {
        slug,
        status: { in: ['draft', 'in_review', 'ready', 'published'] },
        ...(ownBoxId ? { boxId: { not: ownBoxId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(activeRevision);
  }

  private async assertBoxNumberAvailable(
    tx: Prisma.TransactionClient,
    boxNumber: number | null | undefined,
    ownBoxId?: bigint,
  ): Promise<void> {
    if (!boxNumber) return;
    const conflict = await tx.box.findFirst({
      where: {
        boxNumber,
        ...(ownBoxId ? { id: { not: ownBoxId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException({
        code: 'BOX_NUMBER_CONFLICT',
        message: 'Já existe outro box cadastrado com este número.',
      });
    }
  }

  private async loadBoxOrThrow(id: bigint): Promise<BoxWithRevisions> {
    const box = await this.prisma.box.findUnique({
      where: { id },
      include: boxDetailInclude,
    });
    if (!box) {
      throw new NotFoundException({
        code: 'BOX_NOT_FOUND',
        message: 'Box não encontrado.',
      });
    }
    return box;
  }

  async list(query: Record<string, unknown>) {
    const { page, perPage, q, status } = parseManagementPagination(query);
    const boxes = await this.prisma.box.findMany({
      include: boxDetailInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
    const search = normalizeSearch(q);
    const filtered = boxes.filter((box) => {
      if (status && box.status !== status) return false;
      if (!search) return true;
      const rev =
        box.revisions.find((r) =>
          (WORKING_STATUSES as readonly string[]).includes(r.status),
        ) ?? box.revisions[0];
      const haystack = normalizeSearch(
        [
          rev?.name ?? '',
          rev?.ownerName ?? '',
          String(rev?.boxNumber ?? box.boxNumber ?? ''),
        ].join(' '),
      );
      return haystack.includes(search);
    });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const slice = filtered.slice((page - 1) * perPage, page * perPage);
    return {
      data: slice.map(serializeBox),
      meta: { page, perPage, total, totalPages },
    };
  }

  async getById(rawId: string) {
    const id = parseBigIntId(rawId, 'box');
    const box = await this.loadBoxOrThrow(id);
    return { data: serializeBox(box) };
  }

  async create(actorUserId: bigint, body: JsonBody) {
    const fields = parseBoxFields(body);
    const createdId = await this.prisma.$transaction(async (tx) => {
      await this.assertBoxNumberAvailable(tx, fields.boxNumber);
      const slug = fields.name
        ? await generateUniqueSlug(fields.name, (c) =>
            this.isBoxSlugTaken(tx, c),
          )
        : null;
      const box = await tx.box.create({
        data: {
          boxNumber: fields.boxNumber ?? null,
          status: 'unpublished',
          createdByUserId: actorUserId,
        },
      });
      const revision = await tx.boxRevision.create({
        data: {
          boxId: box.id,
          number: 1,
          status: 'draft',
          name: fields.name ?? null,
          slug,
          ownerName: fields.ownerName ?? null,
          boxNumber: fields.boxNumber ?? null,
          location: fields.location ?? null,
          openingHours: fields.openingHours ?? null,
          description: fields.description ?? null,
          story: fields.story ?? null,
          whatsapp: fields.whatsapp ?? null,
          allowPublicContact: fields.allowPublicContact ?? false,
          coverMediaId: fields.coverMediaId ?? null,
          ownerPortraitId: fields.ownerPortraitId ?? null,
          createdByUserId: actorUserId,
          ...(fields.categoryIds && fields.categoryIds.length > 0
            ? {
                categories: {
                  create: fields.categoryIds.map((categoryId) => ({
                    categoryId,
                  })),
                },
              }
            : {}),
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.created',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Box #${box.id.toString()} criado em rascunho (revisão ${revision.number}).`,
        },
      });
      return box.id;
    });
    const box = await this.loadBoxOrThrow(createdId);
    return { data: serializeBox(box) };
  }

  async updateRevision(actorUserId: bigint, rawId: string, body: JsonBody) {
    const id = parseBigIntId(rawId, 'box');
    const errors: FieldErrors = {};
    const expectedVersion = parsePositiveInt(body.version, 'version', errors);
    throwIfValidationErrors(errors);
    const fields = parseBoxFields(body);

    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      await this.assertBoxNumberAvailable(tx, fields.boxNumber, box.id);

      let working = box.revisions.find((r) =>
        (WORKING_STATUSES as readonly string[]).includes(r.status),
      );

      if (!working) {
        if (box.version !== expectedVersion) {
          throw new ConflictException({
            code: 'VERSION_CONFLICT',
            message:
              'O registro foi alterado por outra ação. Atualize e tente novamente.',
          });
        }
        const base = box.revisions.find((r) => r.status === 'published');
        const nextNumber = (box.revisions[0]?.number ?? 0) + 1;
        const nextName =
          fields.name !== undefined ? fields.name : (base?.name ?? null);
        const slug = nextName
          ? await generateUniqueSlug(nextName, (c) =>
              this.isBoxSlugTaken(tx, c, box.id),
            )
          : null;
        const categoryIds =
          fields.categoryIds ?? base?.categories.map((c) => c.categoryId) ?? [];
        working = await tx.boxRevision.create({
          data: {
            boxId: box.id,
            number: nextNumber,
            status: 'draft',
            name: nextName,
            slug,
            ownerName:
              fields.ownerName !== undefined
                ? fields.ownerName
                : (base?.ownerName ?? null),
            boxNumber:
              fields.boxNumber !== undefined
                ? fields.boxNumber
                : (base?.boxNumber ?? box.boxNumber),
            location:
              fields.location !== undefined
                ? fields.location
                : (base?.location ?? null),
            openingHours:
              fields.openingHours !== undefined
                ? fields.openingHours
                : (base?.openingHours ?? null),
            description:
              fields.description !== undefined
                ? fields.description
                : (base?.description ?? null),
            story:
              fields.story !== undefined ? fields.story : (base?.story ?? null),
            whatsapp:
              fields.whatsapp !== undefined
                ? fields.whatsapp
                : (base?.whatsapp ?? null),
            allowPublicContact:
              fields.allowPublicContact !== undefined
                ? fields.allowPublicContact
                : (base?.allowPublicContact ?? false),
            coverMediaId:
              fields.coverMediaId !== undefined
                ? fields.coverMediaId
                : (base?.coverMediaId ?? null),
            ownerPortraitId:
              fields.ownerPortraitId !== undefined
                ? fields.ownerPortraitId
                : (base?.ownerPortraitId ?? null),
            createdByUserId: actorUserId,
            ...(categoryIds.length > 0
              ? {
                  categories: {
                    create: categoryIds.map((categoryId) => ({ categoryId })),
                  },
                }
              : {}),
          },
          include: { categories: { include: { category: true } } },
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
                  this.isBoxSlugTaken(tx, c, box.id),
                )
              : null
            : working.slug;

        if (fields.categoryIds !== undefined) {
          await tx.boxRevisionCategory.deleteMany({
            where: { boxRevisionId: working.id },
          });
        }
        await tx.boxRevision.update({
          where: { id: working.id },
          data: {
            status: 'draft',
            version: { increment: 1 },
            ...(fields.name !== undefined ? { name: fields.name, slug } : {}),
            ...(fields.ownerName !== undefined
              ? { ownerName: fields.ownerName }
              : {}),
            ...(fields.boxNumber !== undefined
              ? { boxNumber: fields.boxNumber }
              : {}),
            ...(fields.location !== undefined
              ? { location: fields.location }
              : {}),
            ...(fields.openingHours !== undefined
              ? { openingHours: fields.openingHours }
              : {}),
            ...(fields.description !== undefined
              ? { description: fields.description }
              : {}),
            ...(fields.story !== undefined ? { story: fields.story } : {}),
            ...(fields.whatsapp !== undefined
              ? { whatsapp: fields.whatsapp }
              : {}),
            ...(fields.allowPublicContact !== undefined
              ? { allowPublicContact: fields.allowPublicContact }
              : {}),
            ...(fields.coverMediaId !== undefined
              ? { coverMediaId: fields.coverMediaId }
              : {}),
            ...(fields.ownerPortraitId !== undefined
              ? { ownerPortraitId: fields.ownerPortraitId }
              : {}),
            ...(fields.categoryIds && fields.categoryIds.length > 0
              ? {
                  categories: {
                    create: fields.categoryIds.map((categoryId) => ({
                      categoryId,
                    })),
                  },
                }
              : {}),
          },
        });
      }

      if (
        (fields.boxNumber !== undefined && box.status !== 'published') ||
        box.status === 'inactive'
      ) {
        await tx.box.update({
          where: { id: box.id },
          data: {
            ...(fields.boxNumber !== undefined
              ? { boxNumber: fields.boxNumber }
              : {}),
            ...(box.status === 'inactive'
              ? { status: 'unpublished', inactivatedAt: null }
              : {}),
            version: { increment: 1 },
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.revision_updated',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Revisão ${working.number} do box #${box.id.toString()} atualizada.`,
        },
      });
    });

    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }

  async submitReview(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'box');
    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      const working = box.revisions.find((r) => r.status === 'draft');
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Não há revisão em rascunho para enviar à revisão.',
        });
      }
      await tx.boxRevision.update({
        where: { id: working.id },
        data: { status: 'in_review', version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.submitted_for_review',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Revisão ${working.number} do box #${box.id.toString()} enviada para revisão.`,
        },
      });
    });
    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }

  async approve(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'box');
    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      const working = box.revisions.find((r) => r.status === 'in_review');
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Não há revisão aguardando aprovação.',
        });
      }
      await tx.boxRevision.update({
        where: { id: working.id },
        data: { status: 'ready', version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.approved',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Revisão ${working.number} do box #${box.id.toString()} aprovada.`,
        },
      });
    });
    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }

  async returnRevision(actorUserId: bigint, rawId: string, body: JsonBody) {
    const id = parseBigIntId(rawId, 'box');
    const comment = parseReturnComment(body);
    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      const working = box.revisions.find(
        (r) => r.status === 'in_review' || r.status === 'ready',
      );
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Não há revisão em análise para devolver.',
        });
      }
      await tx.boxRevision.update({
        where: { id: working.id },
        data: { status: 'draft', version: { increment: 1 } },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.returned',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Revisão ${working.number} do box #${box.id.toString()} devolvida para rascunho.`,
          reason: comment,
        },
      });
    });
    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }

  async publish(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'box');
    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      const working = box.revisions.find((r) => r.status === 'ready');
      if (!working) {
        throw new ConflictException({
          code: 'INVALID_REVISION_STATE',
          message: 'Somente revisões prontas podem ser publicadas.',
        });
      }

      const errors: FieldErrors = {};
      if (!working.name) addFieldError(errors, 'name', 'Nome é obrigatório.');
      if (!working.ownerName)
        addFieldError(errors, 'ownerName', 'Responsável é obrigatório.');
      if (!working.boxNumber)
        addFieldError(errors, 'boxNumber', 'Número do box é obrigatório.');
      if (!working.coverMediaId)
        addFieldError(errors, 'coverMediaId', 'Capa é obrigatória para publicar.');
      const activeCategories = working.categories.filter(
        (c) => c.category.active,
      );
      if (activeCategories.length === 0) {
        addFieldError(
          errors,
          'categoryIds',
          'Vincule pelo menos uma categoria ativa.',
        );
      }
      throwIfValidationErrors(errors);

      await this.assertBoxNumberAvailable(tx, working.boxNumber, box.id);

      const finalSlug = await generateUniqueSlug(working.name!, (c) =>
        this.isBoxSlugTaken(tx, c, box.id),
      );
      const now = new Date();

      const previousPublished = box.revisions.find(
        (r) => r.status === 'published',
      );
      if (previousPublished) {
        await tx.boxRevision.update({
          where: { id: previousPublished.id },
          data: { status: 'superseded', supersededAt: now },
        });
      }

      await tx.boxRevision.update({
        where: { id: working.id },
        data: {
          status: 'published',
          slug: finalSlug,
          publishedAt: now,
          version: { increment: 1 },
        },
      });

      const mediaIds = [working.coverMediaId, working.ownerPortraitId].filter(
        (m): m is bigint => m !== null,
      );
      if (mediaIds.length > 0) {
        await tx.media.updateMany({
          where: { id: { in: mediaIds }, status: 'private' },
          data: { status: 'linked' },
        });
      }

      await tx.boxSlug.upsert({
        where: { slug: finalSlug },
        update: {},
        create: { slug: finalSlug, boxId: box.id, firstPublishedAt: now },
      });

      await tx.box.update({
        where: { id: box.id },
        data: {
          status: 'published',
          boxNumber: working.boxNumber,
          publishedAt: box.publishedAt ?? now,
          inactivatedAt: null,
          version: { increment: 1 },
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.published',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Box #${box.id.toString()} publicado (revisão ${working.number}, slug ${finalSlug}).`,
        },
      });
    });

    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }

  async deactivate(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'box');
    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      if (box.status === 'inactive') {
        throw new UnprocessableEntityException({
          code: 'ALREADY_INACTIVE',
          message: 'Este box já está inativado.',
        });
      }
      const existingWorking = box.revisions.find((r) =>
        (WORKING_STATUSES as readonly string[]).includes(r.status),
      );
      if (existingWorking) {
        if (existingWorking.status !== 'ready') {
          await tx.boxRevision.update({
            where: { id: existingWorking.id },
            data: { status: 'ready', version: { increment: 1 } },
          });
        }
      } else {
        const base = box.revisions.find((r) => r.status === 'published');
        if (base) {
          const nextNumber = (box.revisions[0]?.number ?? 0) + 1;
          await tx.boxRevision.create({
            data: {
              boxId: box.id,
              number: nextNumber,
              status: 'ready',
              name: base.name,
              slug: base.slug,
              ownerName: base.ownerName,
              boxNumber: base.boxNumber ?? box.boxNumber,
              location: base.location,
              openingHours: base.openingHours,
              description: base.description,
              story: base.story,
              whatsapp: base.whatsapp,
              allowPublicContact: base.allowPublicContact,
              coverMediaId: base.coverMediaId,
              ownerPortraitId: base.ownerPortraitId,
              createdByUserId: actorUserId,
              ...(base.categories.length > 0
                ? {
                    categories: {
                      create: base.categories.map((c) => ({
                        categoryId: c.categoryId,
                      })),
                    },
                  }
                : {}),
            },
          });
        }
      }
      await tx.box.update({
        where: { id: box.id },
        data: {
          status: 'inactive',
          inactivatedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.deactivated',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Box #${box.id.toString()} inativado e mantido pronto para reativação.`,
        },
      });
    });
    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }

  async reactivate(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'box');
    await this.prisma.$transaction(async (tx) => {
      const box = await tx.box.findUnique({
        where: { id },
        include: boxDetailInclude,
      });
      if (!box) {
        throw new NotFoundException({
          code: 'BOX_NOT_FOUND',
          message: 'Box não encontrado.',
        });
      }
      if (box.status !== 'inactive') {
        throw new ConflictException({
          code: 'INVALID_CONTENT_STATE',
          message: 'Somente boxes inativados podem ser reativados.',
        });
      }
      const now = new Date();
      const readyRevision = box.revisions.find((r) => r.status === 'ready');
      if (readyRevision) {
        const previousPublished = box.revisions.find(
          (r) => r.status === 'published',
        );
        if (previousPublished) {
          await tx.boxRevision.update({
            where: { id: previousPublished.id },
            data: { status: 'superseded', supersededAt: now },
          });
        }
        await tx.boxRevision.update({
          where: { id: readyRevision.id },
          data: {
            status: 'published',
            publishedAt: now,
            version: { increment: 1 },
          },
        });
        const mediaIds = [
          readyRevision.coverMediaId,
          readyRevision.ownerPortraitId,
        ].filter((m): m is bigint => m !== null);
        if (mediaIds.length > 0) {
          await tx.media.updateMany({
            where: { id: { in: mediaIds }, status: 'private' },
            data: { status: 'linked' },
          });
        }
      }
      await tx.box.update({
        where: { id: box.id },
        data: {
          status: 'published',
          publishedAt: box.publishedAt ?? now,
          inactivatedAt: null,
          version: { increment: 1 },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'box.reactivated',
          resourceType: 'box',
          resourceId: box.id,
          summary: `Box #${box.id.toString()} reativado na vitrine pública.`,
        },
      });
    });
    return { data: serializeBox(await this.loadBoxOrThrow(id)) };
  }
}
