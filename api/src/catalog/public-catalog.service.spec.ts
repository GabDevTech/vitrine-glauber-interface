import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PublicCatalogService } from './public-catalog.service.js';

describe('Public media access', () => {
  it('does not serve a private media record', async () => {
    const prisma = {
      media: {
        findUnique: async () => ({
          id: 1n,
          status: 'private',
          deletedAt: null,
          mimeType: 'image/webp',
          kind: 'box_cover',
        }),
      },
    } as unknown as PrismaService;
    await expect(
      new PublicCatalogService(prisma).media('1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not serve media without a currently visible revision', async () => {
    const prisma = {
      media: {
        findUnique: async () => ({
          id: 1n,
          status: 'linked',
          deletedAt: null,
          mimeType: 'image/webp',
          kind: 'box_cover',
        }),
      },
      boxRevision: { findFirst: async () => null },
    } as unknown as PrismaService;
    await expect(
      new PublicCatalogService(prisma).media('1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
