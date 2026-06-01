-- CreateTable
CREATE TABLE "musteri" (
    "musteri_id" TEXT NOT NULL,
    "ad_soyad" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "bolge" TEXT NOT NULL,
    "sube" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "musteri_pkey" PRIMARY KEY ("musteri_id")
);

-- CreateTable
CREATE TABLE "sozlesme" (
    "sozlesme_id" TEXT NOT NULL,
    "musteri_id" TEXT NOT NULL,
    "toplam_tutar" DECIMAL(65,30) NOT NULL,
    "vade" INTEGER NOT NULL,
    "taksit_tutari" DECIMAL(65,30) NOT NULL,
    "baslangic_tarihi" TIMESTAMP(3) NOT NULL,
    "teslim_tarihi_planlanan" TIMESTAMP(3),
    "teslim_tarihi_gerceklesen" TIMESTAMP(3),
    "durum" TEXT NOT NULL,
    "iptal_durumu" BOOLEAN NOT NULL DEFAULT false,
    "iptal_tarihi" TIMESTAMP(3),
    "iptal_nedeni" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sozlesme_pkey" PRIMARY KEY ("sozlesme_id")
);

-- CreateTable
CREATE TABLE "odeme_hareketi" (
    "hareket_id" TEXT NOT NULL,
    "sozlesme_id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "tutar" DECIMAL(65,30) NOT NULL,
    "tip" TEXT NOT NULL,
    "gecikme_gun" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "odeme_hareketi_pkey" PRIMARY KEY ("hareket_id")
);

-- CreateTable
CREATE TABLE "teslimat" (
    "teslimat_id" TEXT NOT NULL,
    "sozlesme_id" TEXT NOT NULL,
    "teslim_tarihi" TIMESTAMP(3) NOT NULL,
    "teslim_tutar" DECIMAL(65,30) NOT NULL,
    "teslim_tipi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teslimat_pkey" PRIMARY KEY ("teslimat_id")
);

-- CreateTable
CREATE TABLE "likidite_pozisyonu" (
    "id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "nakit" DECIMAL(65,30) NOT NULL,
    "likit_varlik" DECIMAL(65,30) NOT NULL,
    "kisa_vadeli_yukumluluk" DECIMAL(65,30) NOT NULL,
    "teslimat_yukumlulugu_30gun" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likidite_pozisyonu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_kpi" (
    "kpi_kodu" TEXT NOT NULL,
    "aciklama" TEXT NOT NULL,
    "birim" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_kpi_pkey" PRIMARY KEY ("kpi_kodu")
);

-- CreateTable
CREATE TABLE "risk_limit" (
    "id" TEXT NOT NULL,
    "kpi_kodu" TEXT NOT NULL,
    "esik_deger" DECIMAL(65,30) NOT NULL,
    "karsilastirma" TEXT NOT NULL,
    "seviye" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senaryo" (
    "senaryo_kodu" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "parametreler" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senaryo_pkey" PRIMARY KEY ("senaryo_kodu")
);

-- CreateTable
CREATE TABLE "gunluk_risk_ozet" (
    "id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "senaryo_kodu" TEXT NOT NULL,
    "kpi_kodu" TEXT NOT NULL,
    "deger" DECIMAL(65,30) NOT NULL,
    "risk_seviyesi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gunluk_risk_ozet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uyari" (
    "uyari_id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kpi_kodu" TEXT NOT NULL,
    "senaryo_kodu" TEXT NOT NULL,
    "esik_deger" DECIMAL(65,30) NOT NULL,
    "gerceklesen_deger" DECIMAL(65,30) NOT NULL,
    "risk_seviyesi" TEXT NOT NULL,
    "durum" TEXT NOT NULL,
    "mesaj" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uyari_pkey" PRIMARY KEY ("uyari_id")
);

-- CreateTable
CREATE TABLE "likidite_stres_sonucu" (
    "id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senaryo_ad" TEXT NOT NULL,
    "lcr_deger" DECIMAL(65,30) NOT NULL,
    "risk_seviyesi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likidite_stres_sonucu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "team" TEXT,
    "supervisor" TEXT,
    "auditCode" TEXT,
    "department" TEXT,
    "creatorId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TEXT,
    "description" TEXT,
    "evidence" TEXT,
    "departmentResponse" TEXT,
    "department" TEXT,
    "assignedUserId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "changeData" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanction_log" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanction_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdUser" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL',

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" TIMESTAMP(3),
    "chunkCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "likidite_pozisyonu_tarih_key" ON "likidite_pozisyonu"("tarih");

-- CreateIndex
CREATE UNIQUE INDEX "gunluk_risk_ozet_tarih_senaryo_kodu_kpi_kodu_key" ON "gunluk_risk_ozet"("tarih", "senaryo_kodu", "kpi_kodu");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "role_code_key" ON "role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_userId_roleId_key" ON "user_role"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "permission_module_action_key" ON "permission"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_roleId_permissionId_key" ON "role_permission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- AddForeignKey
ALTER TABLE "sozlesme" ADD CONSTRAINT "sozlesme_musteri_id_fkey" FOREIGN KEY ("musteri_id") REFERENCES "musteri"("musteri_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odeme_hareketi" ADD CONSTRAINT "odeme_hareketi_sozlesme_id_fkey" FOREIGN KEY ("sozlesme_id") REFERENCES "sozlesme"("sozlesme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teslimat" ADD CONSTRAINT "teslimat_sozlesme_id_fkey" FOREIGN KEY ("sozlesme_id") REFERENCES "sozlesme"("sozlesme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_limit" ADD CONSTRAINT "risk_limit_kpi_kodu_fkey" FOREIGN KEY ("kpi_kodu") REFERENCES "risk_kpi"("kpi_kodu") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gunluk_risk_ozet" ADD CONSTRAINT "gunluk_risk_ozet_senaryo_kodu_fkey" FOREIGN KEY ("senaryo_kodu") REFERENCES "senaryo"("senaryo_kodu") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gunluk_risk_ozet" ADD CONSTRAINT "gunluk_risk_ozet_kpi_kodu_fkey" FOREIGN KEY ("kpi_kodu") REFERENCES "risk_kpi"("kpi_kodu") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyari" ADD CONSTRAINT "uyari_kpi_kodu_fkey" FOREIGN KEY ("kpi_kodu") REFERENCES "risk_kpi"("kpi_kodu") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uyari" ADD CONSTRAINT "uyari_senaryo_kodu_fkey" FOREIGN KEY ("senaryo_kodu") REFERENCES "senaryo"("senaryo_kodu") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding" ADD CONSTRAINT "finding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
