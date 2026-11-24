-- CreateTable
CREATE TABLE "Landing" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "translationKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB,
    "draftBlocks" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Landing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Landing_locale_status_idx" ON "Landing"("locale", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Landing_locale_slug_key" ON "Landing"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Landing_translationKey_locale_key" ON "Landing"("translationKey", "locale");
