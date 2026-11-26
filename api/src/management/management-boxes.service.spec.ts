import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../database/prisma.service.js';
import { ManagementBoxesController } from './management-boxes.controller.js';
import type { ManagementRequest } from './management-access.guard.js';
import { ManagementBoxesService } from './management-boxes.service.js';
import { ROLES_KEY } from './roles.decorator.js';

function createTransactionMock(options: {
  box: Record<string, unknown> | null;
  linkedProductRevisions?: Array<{ id: bigint; productId: bigint }>;
}) {
  const callOrder: string[] = [];
  const tx = {
    box: {
      findUnique: jest.fn(async () => {
        callOrder.push('box.findUnique');
        return options.box;
      }),
      delete: jest.fn(async () => {
        callOrder.push('box.delete');
        return {};
      }),
    },
    productRevision: {
      findMany: jest.fn(async () => {
        callOrder.push('productRevision.findMany');
        return options.linkedProductRevisions ?? [];
      }),
      deleteMany: jest.fn(async () => {
        callOrder.push('productRevision.deleteMany');
        return { count: 0 };
      }),
    },
    productRevisionMedia: {
      deleteMany: jest.fn(async () => {
        callOrder.push('productRevisionMedia.deleteMany');
        return { count: 0 };
      }),
    },
    productSlug: {
      deleteMany: jest.fn(async () => {
        callOrder.push('productSlug.deleteMany');
        return { count: 0 };
      }),
    },
    product: {
      deleteMany: jest.fn(async () => {
        callOrder.push('product.deleteMany');
        return { count: 0 };
      }),
    },
    boxRevisionCategory: {
      deleteMany: jest.fn(async () => {
        callOrder.push('boxRevisionCategory.deleteMany');
        return { count: 0 };
      }),
    },
    boxRevision: {
      deleteMany: jest.fn(async () => {
        callOrder.push('boxRevision.deleteMany');
        return { count: 0 };
      }),
    },
    boxSlug: {
      deleteMany: jest.fn(async () => {
        callOrder.push('boxSlug.deleteMany');
        return { count: 0 };
      }),
    },
    auditEvent: {
      create: jest.fn(async () => {
        callOrder.push('auditEvent.create');
        return {};
      }),
    },
  };

  const prisma = {
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  } as unknown as PrismaService;

  return { prisma, tx, callOrder };
}

describe('ManagementBoxesService.remove', () => {
  it('rejeita identificador inválido com 400 INVALID_ID', async () => {
    const { prisma } = createTransactionMock({ box: null });
    const service = new ManagementBoxesService(prisma);

    await expect(service.remove(7n, 'abc')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.remove(7n, '0')).rejects.toThrow(BadRequestException);
  });

  it('retorna 404 BOX_NOT_FOUND quando o box não existe', async () => {
    const { prisma, tx } = createTransactionMock({ box: null });
    const service = new ManagementBoxesService(prisma);

    try {
      await service.remove(7n, '42');
      throw new Error('Era esperado lançar NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).getResponse()).toMatchObject({
        code: 'BOX_NOT_FOUND',
      });
    }
    expect(tx.box.delete).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('bloqueia com 409 BOX_MUST_BE_INACTIVE quando o box está publicado', async () => {
    const { prisma, tx } = createTransactionMock({
      box: {
        id: 42n,
        status: 'published',
        revisions: [{ id: 1n, number: 1, status: 'published', name: 'Box 01' }],
      },
    });
    const service = new ManagementBoxesService(prisma);

    try {
      await service.remove(7n, '42');
      throw new Error('Era esperado lançar ConflictException');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: 'BOX_MUST_BE_INACTIVE',
      });
    }
    expect(tx.productRevision.findMany).not.toHaveBeenCalled();
    expect(tx.box.delete).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('exclui definitivamente box inativado e seus produtos vinculados em cascata com auditoria', async () => {
    const { prisma, tx, callOrder } = createTransactionMock({
      box: {
        id: 42n,
        status: 'inactive',
        revisions: [
          { id: 11n, number: 2, status: 'ready', name: 'Barro da Serra' },
          { id: 10n, number: 1, status: 'published', name: 'Barro Antigo' },
        ],
      },
      linkedProductRevisions: [
        { id: 201n, productId: 101n },
        { id: 202n, productId: 101n },
        { id: 203n, productId: 102n },
      ],
    });
    const service = new ManagementBoxesService(prisma);

    const result = await service.remove(7n, '42');

    expect(result).toEqual({
      data: {
        deleted: true,
        id: '42',
        deletedProductIds: ['101', '102'],
      },
    });

    expect(tx.productRevision.findMany).toHaveBeenCalledWith({
      where: { boxId: 42n },
      select: { id: true, productId: true },
    });
    expect(tx.productRevisionMedia.deleteMany).toHaveBeenCalledWith({
      where: { productRevision: { productId: { in: [101n, 102n] } } },
    });
    expect(tx.productRevision.deleteMany).toHaveBeenCalledWith({
      where: { productId: { in: [101n, 102n] } },
    });
    expect(tx.productSlug.deleteMany).toHaveBeenCalledWith({
      where: { productId: { in: [101n, 102n] } },
    });
    expect(tx.product.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [101n, 102n] } },
    });

    expect(tx.boxRevisionCategory.deleteMany).toHaveBeenCalledWith({
      where: { boxRevision: { boxId: 42n } },
    });
    expect(tx.boxRevision.deleteMany).toHaveBeenCalledWith({
      where: { boxId: 42n },
    });
    expect(tx.boxSlug.deleteMany).toHaveBeenCalledWith({
      where: { boxId: 42n },
    });
    expect(tx.box.delete).toHaveBeenCalledWith({ where: { id: 42n } });

    expect(callOrder.indexOf('productRevisionMedia.deleteMany')).toBeLessThan(
      callOrder.indexOf('productRevision.deleteMany'),
    );
    expect(callOrder.indexOf('productRevision.deleteMany')).toBeLessThan(
      callOrder.indexOf('product.deleteMany'),
    );
    expect(callOrder.indexOf('productSlug.deleteMany')).toBeLessThan(
      callOrder.indexOf('product.deleteMany'),
    );
    expect(callOrder.indexOf('product.deleteMany')).toBeLessThan(
      callOrder.indexOf('box.delete'),
    );
    expect(callOrder.indexOf('boxRevisionCategory.deleteMany')).toBeLessThan(
      callOrder.indexOf('boxRevision.deleteMany'),
    );
    expect(callOrder.indexOf('boxRevision.deleteMany')).toBeLessThan(
      callOrder.indexOf('box.delete'),
    );
    expect(callOrder.indexOf('boxSlug.deleteMany')).toBeLessThan(
      callOrder.indexOf('box.delete'),
    );

    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: 7n,
        action: 'box.deleted',
        resourceType: 'box',
        resourceId: 42n,
        summary: expect.stringMatching(
          /Box #42 \("Barro da Serra"\).*2 produto\(s\) vinculado\(s\)/,
        ),
      },
    });
  });

  it('exclui definitivamente box não publicado sem produtos vinculados', async () => {
    const { prisma, tx } = createTransactionMock({
      box: {
        id: 99n,
        status: 'unpublished',
        revisions: [{ id: 12n, number: 1, status: 'draft', name: null }],
      },
      linkedProductRevisions: [],
    });
    const service = new ManagementBoxesService(prisma);

    const result = await service.remove(15n, '99');

    expect(result).toEqual({
      data: {
        deleted: true,
        id: '99',
        deletedProductIds: [],
      },
    });
    expect(tx.productRevisionMedia.deleteMany).not.toHaveBeenCalled();
    expect(tx.productRevision.deleteMany).not.toHaveBeenCalled();
    expect(tx.productSlug.deleteMany).not.toHaveBeenCalled();
    expect(tx.product.deleteMany).not.toHaveBeenCalled();
    expect(tx.boxRevisionCategory.deleteMany).toHaveBeenCalledWith({
      where: { boxRevision: { boxId: 99n } },
    });
    expect(tx.boxRevision.deleteMany).toHaveBeenCalledWith({
      where: { boxId: 99n },
    });
    expect(tx.boxSlug.deleteMany).toHaveBeenCalledWith({
      where: { boxId: 99n },
    });
    expect(tx.box.delete).toHaveBeenCalledWith({ where: { id: 99n } });
    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorUserId: 15n,
        action: 'box.deleted',
        resourceType: 'box',
        resourceId: 99n,
        summary: expect.stringMatching(
          /Box #99.*0 produto\(s\) vinculado\(s\)/,
        ),
      },
    });
  });
});

describe('ManagementBoxesController.remove', () => {
  it('exige papel moderator ou admin e delega ao serviço', async () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      ManagementBoxesController.prototype.remove,
    );
    expect(roles).toEqual(['moderator', 'admin']);

    const mockRemove = jest.fn(async () => ({
      data: { deleted: true, id: '42', deletedProductIds: [] },
    }));
    const controller = new ManagementBoxesController({
      remove: mockRemove,
    } as unknown as ManagementBoxesService);

    const request = {
      managementUser: { id: '7' },
    } as unknown as ManagementRequest;

    const result = await controller.remove(request, '42');
    expect(mockRemove).toHaveBeenCalledWith(7n, '42');
    expect(result).toEqual({
      data: { deleted: true, id: '42', deletedProductIds: [] },
    });
  });
});
