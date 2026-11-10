import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  CatalogQuery,
  matchesSearch,
  paginate,
  positiveBigIntId,
  publicNotFound,
} from './public-query.js';

const categorySelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  icon: true,
  tone: true,
} as const;

const mediaSelect = {
  id: true,
  kind: true,
  status: true,
  deletedAt: true,
} as const;

const visibleBoxRevisionWhere = {
  status: 'published',
  categories: { some: { category: { is: { active: true } } } },
  coverMedia: {
    is: { kind: 'box_cover', status: 'linked', deletedAt: null },
  },
} satisfies Prisma.BoxRevisionWhereInput;

const publicBoxWhere = {
  ...visibleBoxRevisionWhere,
  box: { is: { status: 'published' } },
} satisfies Prisma.BoxRevisionWhereInput;

const publicProductWhere = {
  status: 'published',
  product: { is: { status: 'published' } },
  box: {
    is: {
      status: 'published',
      revisions: { some: visibleBoxRevisionWhere },
    },
  },
  category: { is: { active: true } },
  media: {
    some: {
      media: {
        is: { kind: 'product_image', status: 'linked', deletedAt: null },
      },
    },
  },
} satisfies Prisma.ProductRevisionWhereInput;

const boxSelect = {
  boxId: true,
  slug: true,
  name: true,
  ownerName: true,
  boxNumber: true,
  location: true,
  openingHours: true,
  description: true,
  story: true,
  whatsapp: true,
  allowPublicContact: true,
  coverMedia: { select: mediaSelect },
  ownerPortrait: { select: mediaSelect },
  categories: {
    where: { category: { is: { active: true } } },
    select: { category: { select: categorySelect } },
  },
} as const;

const productSelect = {
  productId: true,
  slug: true,
  name: true,
  description: true,
  priceCents: true,
  category: { select: categorySelect },
  box: {
    select: {
      id: true,
      revisions: {
        where: { status: 'published' },
        take: 1,
        select: { slug: true, name: true },
      },
    },
  },
  media: {
    orderBy: { position: 'asc' },
    select: { position: true, isCover: true, media: { select: mediaSelect } },
  },
} as const;

type BoxRow = Prisma.BoxRevisionGetPayload<{ select: typeof boxSelect }>;
type ProductRow = Prisma.ProductRevisionGetPayload<{
  select: typeof productSelect;
}>;

function mediaReference(id: bigint) {
  return { id: id.toString(), url: `/api/v1/media/${id}` };
}

function publicCategory(
  row: Prisma.CategoryGetPayload<{ select: typeof categorySelect }>,
) {
  return { ...row, id: row.id.toString() };
}

function publicBox(row: BoxRow) {
  if (!row.coverMedia || !row.slug || !row.name) return null;
  const portrait = row.ownerPortrait;
  return {
    id: row.boxId.toString(),
    slug: row.slug,
    name: row.name,
    ownerName: row.ownerName,
    boxNumber: row.boxNumber,
    location: row.location,
    openingHours: row.openingHours,
    description: row.description,
    story: row.story,
    whatsapp: row.allowPublicContact ? row.whatsapp : null,
    categories: row.categories.map(({ category }) => publicCategory(category)),
    cover: mediaReference(row.coverMedia.id),
    ownerPortrait:
      portrait?.status === 'linked' &&
      portrait.kind === 'box_owner_portrait' &&
      portrait.deletedAt === null
        ? mediaReference(portrait.id)
        : null,
  };
}

function publicProduct(row: ProductRow) {
  const boxRevision = row.box?.revisions[0];
  if (!row.slug || !row.name || !row.category || !row.box || !boxRevision?.slug)
    return null;
  const images = row.media
    .filter(
      ({ media }) =>
        media.status === 'linked' &&
        media.kind === 'product_image' &&
        media.deletedAt === null,
    )
    .map(({ media, isCover, position }) => ({
      ...mediaReference(media.id),
      isCover,
      position,
    }));
  if (!images.length) return null;
  return {
    id: row.productId.toString(),
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    currency: 'BRL' as const,
    box: {
      id: row.box.id.toString(),
      slug: boxRevision.slug,
      name: boxRevision.name,
    },
    category: publicCategory(row.category),
    images,
    cover: images.find((image) => image.isCover) ?? images[0],
  };
}

function byId(left: bigint, right: bigint): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

const nameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const uploadRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'storage',
  'uploads',
);

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async categories(query: CatalogQuery) {
    const rows = await this.prisma.category.findMany({
      where: { active: true },
      select: categorySelect,
      orderBy: { name: 'asc' },
    });
    return paginate(rows.map(publicCategory), query.page, query.perPage);
  }

  async boxes(query: CatalogQuery) {
    const rows = await this.prisma.boxRevision.findMany({
      where: publicBoxWhere,
      select: boxSelect,
    });
    const visible = rows.filter((row) => {
      if (
        query.category &&
        !row.categories.some(({ category }) => category.code === query.category)
      )
        return false;
      const number = row.boxNumber;
      return matchesSearch(query.q, [
        row.name,
        row.ownerName,
        number === null ? null : String(number),
        number === null ? null : String(number).padStart(2, '0'),
        ...row.categories.map(({ category }) => category.name),
      ]);
    });
    visible.sort((a, b) =>
      query.sort === 'name'
        ? nameCollator.compare(a.name ?? '', b.name ?? '') ||
          byId(a.boxId, b.boxId)
        : byId(a.boxId, b.boxId),
    );
    const mapped = visible
      .map(publicBox)
      .filter((row): row is NonNullable<typeof row> => row !== null);
    return paginate(mapped, query.page, query.perPage);
  }

  async box(slug: string) {
    const row = await this.prisma.boxRevision.findFirst({
      where: { ...publicBoxWhere, slug },
      select: boxSelect,
    });
    const data = row && publicBox(row);
    if (!data) throw publicNotFound();
    return { data };
  }

  async products(query: CatalogQuery) {
    const rows = await this.prisma.productRevision.findMany({
      where: publicProductWhere,
      select: productSelect,
    });
    const visible = rows.filter((row) => {
      if (query.category && row.category?.code !== query.category) return false;
      const boxRevision = row.box?.revisions[0];
      if (query.box && boxRevision?.slug !== query.box) return false;
      return matchesSearch(query.q, [
        row.name,
        boxRevision?.name,
        row.category?.name,
      ]);
    });
    visible.sort((a, b) => {
      if (query.sort === 'name') {
        return (
          nameCollator.compare(a.name ?? '', b.name ?? '') ||
          byId(a.productId, b.productId)
        );
      }
      if (query.sort === 'price_asc' || query.sort === 'price_desc') {
        if (a.priceCents === null)
          return b.priceCents === null ? byId(a.productId, b.productId) : 1;
        if (b.priceCents === null) return -1;
        const difference = a.priceCents - b.priceCents;
        return (
          (query.sort === 'price_asc' ? difference : -difference) ||
          byId(a.productId, b.productId)
        );
      }
      return byId(a.productId, b.productId);
    });
    const mapped = visible
      .map(publicProduct)
      .filter((row): row is NonNullable<typeof row> => row !== null);
    return paginate(mapped, query.page, query.perPage);
  }

  async product(slug: string) {
    const row = await this.prisma.productRevision.findFirst({
      where: { ...publicProductWhere, slug },
      select: productSelect,
    });
    const data = row && publicProduct(row);
    if (!data) throw publicNotFound();
    return { data };
  }

  async media(idText: string): Promise<Buffer> {
    const id = positiveBigIntId(idText);
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (
      !media ||
      media.status !== 'linked' ||
      media.deletedAt ||
      media.mimeType !== 'image/webp'
    )
      throw publicNotFound();
    let visible = false;
    if (media.kind === 'box_cover' || media.kind === 'box_owner_portrait') {
      visible = !!(await this.prisma.boxRevision.findFirst({
        where: {
          ...publicBoxWhere,
          ...(media.kind === 'box_cover'
            ? { coverMediaId: id }
            : { ownerPortraitId: id }),
        },
        select: { id: true },
      }));
    } else if (media.kind === 'product_image') {
      visible = !!(await this.prisma.productRevisionMedia.findFirst({
        where: { mediaId: id, productRevision: { is: publicProductWhere } },
        select: { mediaId: true },
      }));
    }
    if (!visible || !/^[a-zA-Z0-9_-]{16,128}\.webp$/.test(media.storageKey))
      throw publicNotFound();
    try {
      return await readFile(path.join(uploadRoot, media.storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw publicNotFound();
      throw error;
    }
  }
}
