-- CreateTable
CREATE TABLE "MediaFile" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaFile_sha256_key" ON "MediaFile"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFile_key_key" ON "MediaFile"("key");

-- CreateIndex
CREATE INDEX "MediaFile_createdAt_idx" ON "MediaFile"("createdAt");
