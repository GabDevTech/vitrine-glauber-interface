-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending_invitation', 'active', 'blocked', 'invitation_expired', 'removed');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('editor', 'moderator', 'admin');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('system', 'light', 'dark');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('unpublished', 'published', 'archived');

-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('draft', 'in_review', 'ready', 'published', 'superseded');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('box_cover', 'box_owner_portrait', 'product_image');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('private', 'linked', 'removed');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(30),
    "realName" VARCHAR(130) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'pending_invitation',
    "lastActivityAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "activatedAt" TIMESTAMPTZ(3),
    "blockedAt" TIMESTAMPTZ(3),
    "removedAt" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "code" "RoleCode" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" BIGINT NOT NULL,
    "roleId" BIGINT NOT NULL,
    "grantedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "userId" BIGINT NOT NULL,
    "theme" "ThemePreference" NOT NULL DEFAULT 'system',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "textSize" INTEGER NOT NULL DEFAULT 100,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "revocationReason" VARCHAR(80),
    "ipHash" VARCHAR(128),
    "userAgentSummary" VARCHAR(180),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "code" VARCHAR(160) NOT NULL,
    "description" VARCHAR(500),
    "icon" VARCHAR(80),
    "tone" VARCHAR(30),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" BIGSERIAL NOT NULL,
    "boxNumber" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'unpublished',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_slugs" (
    "slug" VARCHAR(160) NOT NULL,
    "boxId" BIGINT NOT NULL,
    "firstPublishedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "box_slugs_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "box_revisions" (
    "id" BIGSERIAL NOT NULL,
    "boxId" BIGINT NOT NULL,
    "number" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RevisionStatus" NOT NULL DEFAULT 'draft',
    "name" VARCHAR(130),
    "slug" VARCHAR(160),
    "ownerName" VARCHAR(130),
    "boxNumber" INTEGER,
    "location" VARCHAR(180),
    "openingHours" VARCHAR(180),
    "description" TEXT,
    "story" TEXT,
    "whatsapp" VARCHAR(30),
    "allowPublicContact" BOOLEAN NOT NULL DEFAULT false,
    "coverMediaId" BIGINT,
    "ownerPortraitId" BIGINT,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "supersededAt" TIMESTAMPTZ(3),

    CONSTRAINT "box_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_revision_categories" (
    "boxRevisionId" BIGINT NOT NULL,
    "categoryId" BIGINT NOT NULL,

    CONSTRAINT "box_revision_categories_pkey" PRIMARY KEY ("boxRevisionId","categoryId")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'unpublished',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_slugs" (
    "slug" VARCHAR(160) NOT NULL,
    "productId" BIGINT NOT NULL,
    "firstPublishedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_slugs_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "product_revisions" (
    "id" BIGSERIAL NOT NULL,
    "productId" BIGINT NOT NULL,
    "number" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RevisionStatus" NOT NULL DEFAULT 'draft',
    "name" VARCHAR(130),
    "slug" VARCHAR(160),
    "boxId" BIGINT,
    "categoryId" BIGINT,
    "description" TEXT,
    "priceCents" INTEGER,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "supersededAt" TIMESTAMPTZ(3),

    CONSTRAINT "product_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_revision_media" (
    "productRevisionId" BIGINT NOT NULL,
    "mediaId" BIGINT NOT NULL,
    "position" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_revision_media_pkey" PRIMARY KEY ("productRevisionId","mediaId")
);

-- CreateTable
CREATE TABLE "media" (
    "id" BIGSERIAL NOT NULL,
    "storageKey" VARCHAR(255) NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(80) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'private',
    "createdByUserId" BIGINT,
    "deletedByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" BIGSERIAL NOT NULL,
    "actorUserId" BIGINT,
    "action" VARCHAR(80) NOT NULL,
    "resourceType" VARCHAR(40) NOT NULL,
    "resourceId" BIGINT,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" VARCHAR(80),
    "summary" TEXT NOT NULL,
    "changes" JSONB,
    "reason" TEXT,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "recipientUserId" BIGINT NOT NULL,
    "actorUserId" BIGINT,
    "type" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "message" TEXT NOT NULL,
    "resourceType" VARCHAR(40),
    "resourceId" BIGINT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMPTZ(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "invitations_userId_expiresAt_idx" ON "invitations"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_idleExpiresAt_idx" ON "sessions"("userId", "revokedAt", "idleExpiresAt");

-- CreateIndex
CREATE INDEX "sessions_absoluteExpiresAt_idx" ON "sessions"("absoluteExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "categories_active_name_idx" ON "categories"("active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "boxes_boxNumber_key" ON "boxes"("boxNumber");

-- CreateIndex
CREATE INDEX "boxes_status_updatedAt_idx" ON "boxes"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "box_slugs_boxId_idx" ON "box_slugs"("boxId");

-- CreateIndex
CREATE INDEX "box_revisions_boxId_status_idx" ON "box_revisions"("boxId", "status");

-- CreateIndex
CREATE INDEX "box_revisions_slug_idx" ON "box_revisions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "box_revisions_boxId_number_key" ON "box_revisions"("boxId", "number");

-- CreateIndex
CREATE INDEX "box_revision_categories_categoryId_idx" ON "box_revision_categories"("categoryId");

-- CreateIndex
CREATE INDEX "products_status_updatedAt_idx" ON "products"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "product_slugs_productId_idx" ON "product_slugs"("productId");

-- CreateIndex
CREATE INDEX "product_revisions_productId_status_idx" ON "product_revisions"("productId", "status");

-- CreateIndex
CREATE INDEX "product_revisions_slug_idx" ON "product_revisions"("slug");

-- CreateIndex
CREATE INDEX "product_revisions_boxId_idx" ON "product_revisions"("boxId");

-- CreateIndex
CREATE INDEX "product_revisions_categoryId_idx" ON "product_revisions"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_revisions_productId_number_key" ON "product_revisions"("productId", "number");

-- CreateIndex
CREATE INDEX "product_revision_media_mediaId_idx" ON "product_revision_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "product_revision_media_productRevisionId_position_key" ON "product_revision_media"("productRevisionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "media_storageKey_key" ON "media"("storageKey");

-- CreateIndex
CREATE INDEX "media_status_createdAt_idx" ON "media"("status", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_occurredAt_idx" ON "audit_events"("occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_resourceType_resourceId_occurredAt_idx" ON "audit_events"("resourceType", "resourceId", "occurredAt");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_readAt_createdAt_idx" ON "notifications"("recipientUserId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_slugs" ADD CONSTRAINT "box_slugs_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_ownerPortraitId_fkey" FOREIGN KEY ("ownerPortraitId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_revision_categories" ADD CONSTRAINT "box_revision_categories_boxRevisionId_fkey" FOREIGN KEY ("boxRevisionId") REFERENCES "box_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_revision_categories" ADD CONSTRAINT "box_revision_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_slugs" ADD CONSTRAINT "product_slugs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revision_media" ADD CONSTRAINT "product_revision_media_productRevisionId_fkey" FOREIGN KEY ("productRevisionId") REFERENCES "product_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_revision_media" ADD CONSTRAINT "product_revision_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma cannot model expression indexes, partial indexes or CHECK constraints.
-- Keep the case-sensitive indexes above for Prisma's declared @unique fields;
-- these indexes additionally reject case-only duplicates.
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (lower("email"));
CREATE UNIQUE INDEX "users_username_lower_key" ON "users" (lower("username")) WHERE "username" IS NOT NULL;

-- Historical revisions may repeat slugs and states. Only the current published
-- and current working revision are unique per item. Proposed slugs cannot be
-- shared by different current working revisions of the same resource type.
CREATE UNIQUE INDEX "box_revisions_one_published_per_box" ON "box_revisions" ("boxId") WHERE "status" = 'published';
CREATE UNIQUE INDEX "box_revisions_one_work_per_box" ON "box_revisions" ("boxId") WHERE "status" IN ('draft', 'in_review', 'ready');
CREATE UNIQUE INDEX "box_revisions_work_slug_key" ON "box_revisions" ("slug") WHERE "slug" IS NOT NULL AND "status" IN ('draft', 'in_review', 'ready');
CREATE UNIQUE INDEX "product_revisions_one_published_per_product" ON "product_revisions" ("productId") WHERE "status" = 'published';
CREATE UNIQUE INDEX "product_revisions_one_work_per_product" ON "product_revisions" ("productId") WHERE "status" IN ('draft', 'in_review', 'ready');
CREATE UNIQUE INDEX "product_revisions_work_slug_key" ON "product_revisions" ("slug") WHERE "slug" IS NOT NULL AND "status" IN ('draft', 'in_review', 'ready');
CREATE UNIQUE INDEX "product_revision_media_one_cover" ON "product_revision_media" ("productRevisionId") WHERE "isCover" = true;

ALTER TABLE "categories" ADD CONSTRAINT "categories_version_positive" CHECK ("version" >= 1);
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_version_positive" CHECK ("version" >= 1);
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_box_number_positive" CHECK ("boxNumber" IS NULL OR "boxNumber" > 0);
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_number_positive" CHECK ("number" >= 1);
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_version_positive" CHECK ("version" >= 1);
ALTER TABLE "box_revisions" ADD CONSTRAINT "box_revisions_box_number_positive" CHECK ("boxNumber" IS NULL OR "boxNumber" > 0);
ALTER TABLE "products" ADD CONSTRAINT "products_version_positive" CHECK ("version" >= 1);
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_number_positive" CHECK ("number" >= 1);
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_version_positive" CHECK ("version" >= 1);
ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_price_nonnegative" CHECK ("priceCents" IS NULL OR "priceCents" >= 0);
ALTER TABLE "product_revision_media" ADD CONSTRAINT "product_revision_media_position_nonnegative" CHECK ("position" >= 0);
ALTER TABLE "media" ADD CONSTRAINT "media_dimensions_positive" CHECK ("width" > 0 AND "height" > 0 AND "sizeBytes" > 0);
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_attempt_count_nonnegative" CHECK ("attemptCount" >= 0);

-- The audit log is append-only, including against TRUNCATE, which bypasses row
-- DELETE triggers. Migration/backup administrators must preserve it as well.
CREATE FUNCTION "reject_audit_event_mutation"() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is append-only' USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_events_no_update_delete"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "reject_audit_event_mutation"();

CREATE TRIGGER "audit_events_no_truncate"
BEFORE TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION "reject_audit_event_mutation"();
