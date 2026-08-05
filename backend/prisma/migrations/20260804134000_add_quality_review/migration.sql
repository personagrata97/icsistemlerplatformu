-- CreateTable
CREATE TABLE "quality_review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "tur" TEXT NOT NULL,
    "gozdenGecirenId" TEXT NOT NULL,
    "baslangicTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitisTarihi" DATETIME,
    "durum" TEXT NOT NULL DEFAULT 'Planlandı',
    "genelSonuc" TEXT,
    "ozet" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_review_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quality_review_gozdenGecirenId_fkey" FOREIGN KEY ("gozdenGecirenId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_review_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "kontrolBasligi" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "sonuc" TEXT,
    "bulgu" TEXT,
    "oneri" TEXT,
    "sorumluId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_review_item_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "quality_review" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quality_review_item_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_checklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "kontrolMetni" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 1,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "quality_review_auditId_idx" ON "quality_review"("auditId");

-- CreateIndex
CREATE INDEX "quality_review_gozdenGecirenId_idx" ON "quality_review"("gozdenGecirenId");

-- CreateIndex
CREATE INDEX "quality_review_item_reviewId_idx" ON "quality_review_item"("reviewId");

-- CreateIndex
CREATE INDEX "quality_review_item_sorumluId_idx" ON "quality_review_item"("sorumluId");
