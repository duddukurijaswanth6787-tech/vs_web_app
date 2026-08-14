-- CreateTable
CREATE TABLE IF NOT EXISTS "media_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DECIMAL(65,30),
    "folderId" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "checksum" TEXT,
    "storageProvider" TEXT NOT NULL DEFAULT 's3',
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mediumUrl" TEXT,
    "largeUrl" TEXT,
    "uploadedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "media_folders_parentId_idx" ON "media_folders"("parentId");
CREATE INDEX IF NOT EXISTS "media_folders_createdBy_idx" ON "media_folders"("createdBy");
CREATE INDEX IF NOT EXISTS "media_folderId_idx" ON "media"("folderId");
CREATE INDEX IF NOT EXISTS "media_mimeType_idx" ON "media"("mimeType");
CREATE INDEX IF NOT EXISTS "media_checksum_idx" ON "media"("checksum");
CREATE INDEX IF NOT EXISTS "media_uploadedBy_idx" ON "media"("uploadedBy");
CREATE INDEX IF NOT EXISTS "media_isDeleted_idx" ON "media"("isDeleted");
CREATE INDEX IF NOT EXISTS "media_createdAt_idx" ON "media"("createdAt");

-- AddForeignKey
ALTER TABLE "media_folders" DROP CONSTRAINT IF EXISTS "media_folders_parentId_fkey";
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_folderId_fkey";
ALTER TABLE "media" ADD CONSTRAINT "media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
