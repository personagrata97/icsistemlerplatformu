-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kaynakTuru" TEXT NOT NULL,
    "kaynakId" TEXT NOT NULL,
    "dosyaId" TEXT,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "kanitTuru" TEXT NOT NULL,
    "eldeEdilmeYontemi" TEXT,
    "eldeEdilmeTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kaynagi" TEXT,
    "yukleyenId" TEXT NOT NULL,
    "dogrulandiMi" BOOLEAN NOT NULL DEFAULT false,
    "dogrulayanId" TEXT,
    "dogrulamaTarihi" DATETIME,
    "gecersizMi" BOOLEAN NOT NULL DEFAULT false,
    "gecersizlikGerekcesi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "evidence_yukleyenId_fkey" FOREIGN KEY ("yukleyenId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "evidence_dogrulayanId_fkey" FOREIGN KEY ("dogrulayanId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "tur" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "versiyon" TEXT NOT NULL DEFAULT '1.0',
    "yururlukTarihi" DATETIME NOT NULL,
    "sorumluBirimId" TEXT,
    "dosyaId" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'Yürürlükte',
    "sonGozdenGecirmeTarihi" DATETIME,
    "gozdenGecirmePeriyodu" INTEGER NOT NULL DEFAULT 12,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "document_reference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dokumanId" TEXT NOT NULL,
    "kaynakTuru" TEXT NOT NULL,
    "kaynakId" TEXT NOT NULL,
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_reference_dokumanId_fkey" FOREIGN KEY ("dokumanId") REFERENCES "company_document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "evidence_kaynakTuru_kaynakId_idx" ON "evidence"("kaynakTuru", "kaynakId");

-- CreateIndex
CREATE INDEX "evidence_yukleyenId_idx" ON "evidence"("yukleyenId");

-- CreateIndex
CREATE INDEX "evidence_dogrulayanId_idx" ON "evidence"("dogrulayanId");

-- CreateIndex
CREATE INDEX "company_document_kod_idx" ON "company_document"("kod");

-- CreateIndex
CREATE INDEX "company_document_durum_idx" ON "company_document"("durum");

-- CreateIndex
CREATE INDEX "document_reference_dokumanId_idx" ON "document_reference"("dokumanId");

-- CreateIndex
CREATE INDEX "document_reference_kaynakTuru_kaynakId_idx" ON "document_reference"("kaynakTuru", "kaynakId");
