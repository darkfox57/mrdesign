-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "translationKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "year" INTEGER,
    "lines" TEXT[],
    "summary" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "metrics" JSONB,
    "stack" TEXT[],
    "websiteUrl" TEXT,
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "gallery" JSONB,
    "clientAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Case_locale_status_publishedAt_idx" ON "Case"("locale", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Case_locale_slug_key" ON "Case"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Case_translationKey_locale_key" ON "Case"("translationKey", "locale");
