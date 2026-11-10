import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { boxes, categories, products } from '../../src/data/catalog.js';
import { editorialStatus } from '../../gestao/src/data/editorialStatus.js';

const apiRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.dirname(apiRoot);
const publicRoot = path.join(projectRoot, 'public');
const uploadRoot = path.join(apiRoot, 'storage', 'uploads');
const maxSourceBytes = 8 * 1024 * 1024;
const workStatuses = {
  'em-revisao': 'in_review',
  rascunho: 'draft',
  pronto: 'ready',
};

sharp.cache(false);
sharp.concurrency(1);

function requireCondition(condition, message) {
  if (!condition) throw new Error(`Seed demonstrativo: ${message}`);
}

function unique(values, label) {
  requireCondition(
    new Set(values).size === values.length,
    `${label} duplicado`,
  );
}

function assetPath(publicUrl) {
  requireCondition(
    typeof publicUrl === 'string' &&
      /^\/images\/[a-z0-9/-]+\.(jpg|png|webp)$/.test(publicUrl),
    `imagem inválida: ${publicUrl}`,
  );
  const fullPath = path.resolve(publicRoot, `.${publicUrl}`);
  requireCondition(
    fullPath.startsWith(`${publicRoot}${path.sep}`),
    `imagem fora de public/: ${publicUrl}`,
  );
  return fullPath;
}

function boxNumber(value) {
  const match = /^Box (0*[1-9]\d*)$/.exec(value);
  requireCondition(match, `número de box inválido: ${value}`);
  return Number(match[1]);
}

function priceCents(value) {
  requireCondition(
    typeof value === 'number' && Number.isFinite(value) && value >= 0,
    `preço inválido: ${value}`,
  );
  const cents = Math.round(value * 100);
  requireCondition(
    Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) < 1e-6,
    `preço com fração de centavo: ${value}`,
  );
  return cents;
}

async function checkSource() {
  const realCategories = categories.filter(
    (category) => category.id !== 'todos',
  );
  requireCondition(
    realCategories.length === 4 && boxes.length === 5 && products.length === 8,
    'contagem do catálogo mudou; revise o seed',
  );
  unique(
    realCategories.map((item) => item.id),
    'código de categoria',
  );
  unique(
    boxes.map((item) => item.id),
    'ID de box',
  );
  unique(
    boxes.map((item) => item.slug),
    'slug de box',
  );
  unique(
    boxes.map((item) => boxNumber(item.number)),
    'número de box',
  );
  unique(
    products.map((item) => item.id),
    'ID de produto',
  );
  unique(
    products.map((item) => item.slug),
    'slug de produto',
  );

  const categoryCodes = new Set(realCategories.map((item) => item.id));
  const boxIds = new Set(boxes.map((item) => item.id));
  for (const box of boxes) {
    requireCondition(
      categoryCodes.has(box.category),
      `categoria desconhecida do box ${box.slug}`,
    );
    requireCondition(
      typeof box.name === 'string' && typeof box.owner === 'string',
      `dados incompletos do box ${box.slug}`,
    );
  }
  for (const product of products) {
    requireCondition(
      boxIds.has(product.boxId),
      `box desconhecido do produto ${product.slug}`,
    );
    requireCondition(
      categoryCodes.has(product.category),
      `categoria desconhecida do produto ${product.slug}`,
    );
    priceCents(product.price);
  }
  const expectedStatuses = new Map([
    ['box:1', 'em-revisao'],
    ['box:2', 'rascunho'],
    ['product:2', 'em-revisao'],
    ['product:5', 'pronto'],
  ]);
  requireCondition(
    Object.keys(editorialStatus).length === expectedStatuses.size,
    'estados editoriais mudaram; revise o seed',
  );
  for (const [key, status] of expectedStatuses) {
    requireCondition(
      editorialStatus[key] === status,
      `estado editorial inesperado: ${key}`,
    );
  }

  const images = new Set([...boxes, ...products].map((item) => item.image));
  for (const image of images) {
    const file = assetPath(image);
    const fileStat = await stat(file);
    requireCondition(
      fileStat.isFile() && fileStat.size > 0 && fileStat.size <= maxSourceBytes,
      `arquivo inválido: ${image}`,
    );
    const metadata = await sharp(file).metadata();
    requireCondition(
      ['jpeg', 'png', 'webp'].includes(metadata.format) &&
        metadata.width > 0 &&
        metadata.height > 0,
      `formato ou dimensões inválidas: ${image}`,
    );
  }
  return realCategories;
}

async function createMedia(tx, publicUrl, kind, createdFiles) {
  const source = assetPath(publicUrl);
  const storageKey = `${randomUUID()}.webp`;
  const destination = path.join(uploadRoot, storageKey);
  const { data, info } = await sharp(source)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 2 })
    .toBuffer({ resolveWithObject: true });
  await writeFile(destination, data, { flag: 'wx' });
  createdFiles.push(destination);
  return tx.media.create({
    data: {
      storageKey,
      originalFilename: path.basename(source),
      mimeType: 'image/webp',
      sizeBytes: info.size,
      width: info.width,
      height: info.height,
      kind,
      status: 'linked',
    },
  });
}

async function seed() {
  const realCategories = await checkSource();
  if (process.argv.includes('--check')) {
    console.log(
      `Fonte validada: ${realCategories.length} categorias, ${boxes.length} boxes, ${products.length} produtos e 4 revisões de trabalho. Banco não acessado.`,
    );
    return;
  }
  requireCondition(
    process.env.NODE_ENV !== 'production',
    'não execute o seed demonstrativo em produção',
  );
  requireCondition(
    process.env.SEED_DEMO_CONFIRM === 'vitrine-glauber',
    'defina SEED_DEMO_CONFIRM=vitrine-glauber para executar',
  );
  requireCondition(process.env.DATABASE_URL, 'DATABASE_URL ausente');

  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import('../dist/generated/prisma/client.js'),
    import('@prisma/adapter-pg'),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    }),
  });
  const createdFiles = [];
  const counts = {
    categories: 0,
    boxes: 0,
    products: 0,
    media: 0,
    workingRevisions: 0,
  };
  try {
    await prisma.$connect();
    await mkdir(uploadRoot, { recursive: true });
    await prisma.$transaction(
      async (tx) => {
        const [categoryCount, boxCount, productCount] = await Promise.all([
          tx.category.count(),
          tx.box.count(),
          tx.product.count(),
        ]);
        if (categoryCount || boxCount || productCount) {
          // An interrupted seed cannot leave partial rows: all database writes are
          // in one transaction. Refuse a different or later-edited catalog instead
          // of recreating a category whose code was changed by management.
          for (const category of realCategories) {
            requireCondition(
              await tx.category.findUnique({ where: { code: category.id } }),
              `catálogo existente não corresponde ao seed: categoria ${category.id}`,
            );
          }
          for (const box of boxes) {
            requireCondition(
              await tx.boxSlug.findUnique({ where: { slug: box.slug } }),
              `catálogo existente não corresponde ao seed: box ${box.slug}`,
            );
          }
          for (const product of products) {
            requireCondition(
              await tx.productSlug.findUnique({
                where: { slug: product.slug },
              }),
              `catálogo existente não corresponde ao seed: produto ${product.slug}`,
            );
          }
        }
        const categoryIds = new Map();
        for (const category of realCategories) {
          let row = await tx.category.findUnique({
            where: { code: category.id },
          });
          if (!row) {
            row = await tx.category.create({
              data: {
                code: category.id,
                name: category.label,
                description: category.description ?? null,
                icon: category.icon,
                tone: category.tone ?? null,
              },
            });
            counts.categories++;
          }
          categoryIds.set(category.id, row.id);
        }
        for (const code of ['editor', 'moderator', 'admin']) {
          await tx.role.upsert({
            where: { code },
            create: { code },
            update: {},
          });
        }

        const boxIds = new Map();
        for (const source of boxes) {
          const existing = await tx.boxSlug.findUnique({
            where: { slug: source.slug },
          });
          if (existing) {
            boxIds.set(source.id, existing.boxId);
            continue;
          }
          requireCondition(
            !(await tx.box.findUnique({
              where: { boxNumber: boxNumber(source.number) },
            })),
            `número de box já pertence a outro registro: ${source.number}`,
          );
          const publishedAt = new Date();
          const box = await tx.box.create({
            data: {
              boxNumber: boxNumber(source.number),
              status: 'published',
              publishedAt,
            },
          });
          const cover = await createMedia(
            tx,
            source.image,
            'box_cover',
            createdFiles,
          );
          counts.media++;
          const revisionData = {
            name: source.name,
            slug: source.slug,
            ownerName: source.owner,
            boxNumber: boxNumber(source.number),
            location: source.location,
            openingHours: source.hours,
            description: source.description ?? null,
            story: source.story ?? null,
            whatsapp: source.whatsapp ?? null,
            allowPublicContact: false,
            coverMediaId: cover.id,
          };
          const publishedRevision = await tx.boxRevision.create({
            data: {
              boxId: box.id,
              number: 1,
              status: 'published',
              publishedAt,
              ...revisionData,
            },
          });
          await tx.boxRevisionCategory.create({
            data: {
              boxRevisionId: publishedRevision.id,
              categoryId: categoryIds.get(source.category),
            },
          });
          await tx.boxSlug.create({
            data: {
              slug: source.slug,
              boxId: box.id,
              firstPublishedAt: publishedAt,
            },
          });
          const workStatus = workStatuses[editorialStatus[`box:${source.id}`]];
          if (workStatus) {
            const workRevision = await tx.boxRevision.create({
              data: {
                boxId: box.id,
                number: 2,
                status: workStatus,
                ...revisionData,
              },
            });
            await tx.boxRevisionCategory.create({
              data: {
                boxRevisionId: workRevision.id,
                categoryId: categoryIds.get(source.category),
              },
            });
            counts.workingRevisions++;
          }
          boxIds.set(source.id, box.id);
          counts.boxes++;
        }

        for (const source of products) {
          if (await tx.productSlug.findUnique({ where: { slug: source.slug } }))
            continue;
          const publishedAt = new Date();
          const product = await tx.product.create({
            data: { status: 'published', publishedAt },
          });
          const cover = await createMedia(
            tx,
            source.image,
            'product_image',
            createdFiles,
          );
          counts.media++;
          const revisionData = {
            name: source.name,
            slug: source.slug,
            boxId: boxIds.get(source.boxId),
            categoryId: categoryIds.get(source.category),
            description: source.description ?? null,
            priceCents: priceCents(source.price),
          };
          const publishedRevision = await tx.productRevision.create({
            data: {
              productId: product.id,
              number: 1,
              status: 'published',
              publishedAt,
              ...revisionData,
            },
          });
          await tx.productRevisionMedia.create({
            data: {
              productRevisionId: publishedRevision.id,
              mediaId: cover.id,
              position: 0,
              isCover: true,
            },
          });
          await tx.productSlug.create({
            data: {
              slug: source.slug,
              productId: product.id,
              firstPublishedAt: publishedAt,
            },
          });
          const workStatus =
            workStatuses[editorialStatus[`product:${source.id}`]];
          if (workStatus) {
            const workRevision = await tx.productRevision.create({
              data: {
                productId: product.id,
                number: 2,
                status: workStatus,
                ...revisionData,
              },
            });
            await tx.productRevisionMedia.create({
              data: {
                productRevisionId: workRevision.id,
                mediaId: cover.id,
                position: 0,
                isCover: true,
              },
            });
            counts.workingRevisions++;
          }
          counts.products++;
        }
      },
      { timeout: 60000, maxWait: 10000 },
    );
    console.log(
      `Seed concluído. Criados: ${counts.categories} categorias, ${counts.boxes} boxes, ${counts.products} produtos, ${counts.media} mídias e ${counts.workingRevisions} revisões de trabalho. Registros existentes foram preservados.`,
    );
  } catch (error) {
    await Promise.all(createdFiles.map((file) => unlink(file).catch(() => {})));
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
