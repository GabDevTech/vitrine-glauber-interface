ALTER TYPE "ContentStatus" RENAME VALUE 'archived' TO 'inactive';
ALTER TABLE "boxes" RENAME COLUMN "archivedAt" TO "inactivatedAt";
ALTER TABLE "products" RENAME COLUMN "archivedAt" TO "inactivatedAt";
