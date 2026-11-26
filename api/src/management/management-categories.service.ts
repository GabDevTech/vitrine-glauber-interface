import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { generateUniqueSlug } from './editorial-slug.js';
import {
  type FieldErrors,
  type JsonBody,
  addFieldError,
  parseBigIntId,
  parseOptionalString,
  parsePositiveInt,
  throwIfValidationErrors,
} from './editorial-validation.js';

const ACTIVE_REVISION_STATUSES = [
  'draft',
  'in_review',
  'ready',
  'published',
] as const;

type CategoryRecord = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: { boxRevisionCategories: true; productRevisions: true };
    };
  };
}>;

function serializeCategory(cat: CategoryRecord) {
  return {
    id: cat.id.toString(),
    name: cat.name,
    code: cat.code,
    description: cat.description,
    icon: cat.icon,
    tone: cat.tone,
    active: cat.active,
    version: cat.version,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  };
}

@Injectable()
export class ManagementCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async isCodeTaken(
    tx: Prisma.TransactionClient,
    code: string,
    ownId?: bigint,
  ): Promise<boolean> {
    const existing = await tx.category.findFirst({
      where: { code, ...(ownId ? { id: { not: ownId } } : {}) },
      select: { id: true },
    });
    return Boolean(existing);
  }

  async list() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { boxRevisionCategories: true, productRevisions: true },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return { data: categories.map(serializeCategory) };
  }

  async create(actorUserId: bigint, body: JsonBody) {
    const errors: FieldErrors = {};
    const name = parseOptionalString(body.name, 'name', 2, 80, errors);
    if (!name) addFieldError(errors, 'name', 'Informe entre 2 e 80 caracteres.');
    const description = parseOptionalString(
      body.description,
      'description',
      1,
      500,
      errors,
    );
    const icon = parseOptionalString(body.icon, 'icon', 1, 80, errors);
    const tone = parseOptionalString(body.tone, 'tone', 1, 30, errors);
    throwIfValidationErrors(errors);

    const created = await this.prisma.$transaction(async (tx) => {
      const code = await generateUniqueSlug(name!, (c) =>
        this.isCodeTaken(tx, c),
      );
      const category = await tx.category.create({
        data: {
          name: name!,
          code,
          description: description ?? null,
          icon: icon ?? null,
          tone: tone ?? null,
          active: true,
          createdByUserId: actorUserId,
        },
        include: {
          _count: {
            select: { boxRevisionCategories: true, productRevisions: true },
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'category.created',
          resourceType: 'category',
          resourceId: category.id,
          summary: `Categoria "${category.name}" (${category.code}) criada.`,
        },
      });
      return category;
    });

    return { data: serializeCategory(created) };
  }

  async update(actorUserId: bigint, rawId: string, body: JsonBody) {
    const id = parseBigIntId(rawId, 'category');
    const errors: FieldErrors = {};
    const expectedVersion = parsePositiveInt(body.version, 'version', errors);
    const name = parseOptionalString(body.name, 'name', 2, 80, errors);
    const description = parseOptionalString(
      body.description,
      'description',
      1,
      500,
      errors,
    );
    const icon = parseOptionalString(body.icon, 'icon', 1, 80, errors);
    const tone = parseOptionalString(body.tone, 'tone', 1, 30, errors);
    throwIfValidationErrors(errors);

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id } });
      if (!current) {
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoria não encontrada.',
        });
      }
      if (current.version !== expectedVersion) {
        throw new ConflictException({
          code: 'VERSION_CONFLICT',
          message:
            'A categoria foi alterada por outra ação. Atualize e tente novamente.',
        });
      }
      const nextCode =
        name && name !== current.name
          ? await generateUniqueSlug(name, (c) =>
              this.isCodeTaken(tx, c, current.id),
            )
          : current.code;

      const category = await tx.category.update({
        where: { id: current.id },
        data: {
          version: { increment: 1 },
          ...(name !== undefined && name !== null
            ? { name, code: nextCode }
            : {}),
          ...(description !== undefined ? { description } : {}),
          ...(icon !== undefined ? { icon } : {}),
          ...(tone !== undefined ? { tone } : {}),
        },
        include: {
          _count: {
            select: { boxRevisionCategories: true, productRevisions: true },
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'category.updated',
          resourceType: 'category',
          resourceId: category.id,
          summary: `Categoria #${category.id.toString()} ("${category.name}") atualizada.`,
        },
      });
      return category;
    });

    return { data: serializeCategory(updated) };
  }

  async deactivate(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'category');
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id } });
      if (!current) {
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoria não encontrada.',
        });
      }
      const [activeBoxLinks, activeProductLinks] = await Promise.all([
        tx.boxRevisionCategory.count({
          where: {
            categoryId: id,
            boxRevision: {
              status: { in: [...ACTIVE_REVISION_STATUSES] },
              box: { status: { not: 'inactive' } },
            },
          },
        }),
        tx.productRevision.count({
          where: {
            categoryId: id,
            status: { in: [...ACTIVE_REVISION_STATUSES] },
            product: { status: { not: 'inactive' } },
          },
        }),
      ]);
      if (activeBoxLinks > 0 || activeProductLinks > 0) {
        throw new ConflictException({
          code: 'CATEGORY_IN_USE',
          message:
            'Retire ou substitua os vínculos atuais desta categoria em boxes e produtos antes de desativar.',
        });
      }
      const category = await tx.category.update({
        where: { id },
        data: { active: false, version: { increment: 1 } },
        include: {
          _count: {
            select: { boxRevisionCategories: true, productRevisions: true },
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'category.deactivated',
          resourceType: 'category',
          resourceId: category.id,
          summary: `Categoria #${category.id.toString()} ("${category.name}") desativada.`,
        },
      });
      return category;
    });

    return { data: serializeCategory(updated) };
  }

  async activate(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'category');
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id } });
      if (!current) {
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoria não encontrada.',
        });
      }
      const category = await tx.category.update({
        where: { id },
        data: { active: true, version: { increment: 1 } },
        include: {
          _count: {
            select: { boxRevisionCategories: true, productRevisions: true },
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'category.activated',
          resourceType: 'category',
          resourceId: category.id,
          summary: `Categoria #${category.id.toString()} ("${category.name}") ativada.`,
        },
      });
      return category;
    });

    return { data: serializeCategory(updated) };
  }

  async remove(actorUserId: bigint, rawId: string) {
    const id = parseBigIntId(rawId, 'category');
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { boxRevisionCategories: true, productRevisions: true },
          },
        },
      });
      if (!current) {
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoria não encontrada.',
        });
      }
      if (
        current._count.boxRevisionCategories > 0 ||
        current._count.productRevisions > 0
      ) {
        throw new ConflictException({
          code: 'CATEGORY_HAS_HISTORY',
          message:
            'Esta categoria possui vínculos preservados no histórico e não pode ser excluída fisicamente.',
        });
      }
      await tx.category.delete({ where: { id } });
      await tx.auditEvent.create({
        data: {
          actorUserId,
          action: 'category.deleted',
          resourceType: 'category',
          resourceId: id,
          summary: `Categoria #${id.toString()} ("${current.name}") excluída.`,
        },
      });
    });

    return { data: { deleted: true } };
  }
}
