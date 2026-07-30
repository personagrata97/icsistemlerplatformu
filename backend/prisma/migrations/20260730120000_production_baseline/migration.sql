-- CreateTable
CREATE TABLE "musteri" (
    "musteri_id" TEXT NOT NULL PRIMARY KEY,
    "ad_soyad" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "bolge" TEXT NOT NULL,
    "sube" TEXT NOT NULL,
    "tckn" TEXT,
    "dogumTarihi" DATETIME,
    "uyruk" TEXT DEFAULT 'TR',
    "pasaportNo" TEXT,
    "vergiNo" TEXT,
    "musteriTuru" TEXT NOT NULL DEFAULT 'GERCEK',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sanction_list" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "kaynakUrl" TEXT,
    "sonGuncelleme" DATETIME,
    "kayitSayisi" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sanction_entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "tur" TEXT NOT NULL DEFAULT 'GERCEK',
    "adSoyad" TEXT NOT NULL,
    "normalizedAd" TEXT NOT NULL,
    "takmaAdlar" TEXT,
    "dogumTarihi" DATETIME,
    "uyruk" TEXT,
    "kimlikNo" TEXT,
    "pasaportNo" TEXT,
    "adres" TEXT,
    "listeyeGirisTarihi" DATETIME,
    "kararNo" TEXT,
    "aciklama" TEXT,
    "ham" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sanction_entity_listId_fkey" FOREIGN KEY ("listId") REFERENCES "sanction_list" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sanction_screening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tetikleyici" TEXT NOT NULL,
    "baslangic" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitis" DATETIME,
    "tarananKayitSayisi" INTEGER NOT NULL DEFAULT 0,
    "eslesmeSayisi" INTEGER NOT NULL DEFAULT 0,
    "calistiran" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "sanction_match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "screeningId" TEXT,
    "musteriId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "skor" INTEGER NOT NULL,
    "eslesmeTuru" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'ACIK',
    "karar" TEXT,
    "karariVeren" TEXT,
    "kararTarihi" DATETIME,
    "gerekce" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sanction_match_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "sanction_screening" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sanction_match_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "sanction_entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sanction_match_musteriId_fkey" FOREIGN KEY ("musteriId") REFERENCES "musteri" ("musteri_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sozlesme" (
    "sozlesme_id" TEXT NOT NULL PRIMARY KEY,
    "musteri_id" TEXT NOT NULL,
    "toplam_tutar" DECIMAL NOT NULL,
    "vade" INTEGER NOT NULL,
    "taksit_tutari" DECIMAL NOT NULL,
    "baslangic_tarihi" DATETIME NOT NULL,
    "teslim_tarihi_planlanan" DATETIME,
    "teslim_tarihi_gerceklesen" DATETIME,
    "durum" TEXT NOT NULL,
    "iptal_durumu" BOOLEAN NOT NULL DEFAULT false,
    "iptal_tarihi" DATETIME,
    "iptal_nedeni" TEXT,
    "fesihTalepTarihi" DATETIME,
    "fesihTalepEden" TEXT,
    "devirVarMi" BOOLEAN NOT NULL DEFAULT false,
    "devirTarihi" DATETIME,
    "devralanTckn" TEXT,
    "devralanAdSoyad" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sozlesme_musteri_id_fkey" FOREIGN KEY ("musteri_id") REFERENCES "musteri" ("musteri_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "odeme_hareketi" (
    "hareket_id" TEXT NOT NULL PRIMARY KEY,
    "sozlesme_id" TEXT NOT NULL,
    "tarih" DATETIME NOT NULL,
    "tutar" DECIMAL NOT NULL,
    "tip" TEXT NOT NULL,
    "gecikme_gun" INTEGER NOT NULL DEFAULT 0,
    "odemeYonu" TEXT NOT NULL DEFAULT 'CIKIS',
    "alacakliTuru" TEXT NOT NULL DEFAULT 'MUSTERI',
    "alacakliAdSoyad" TEXT,
    "alacakliVknTckn" TEXT,
    "alacakliIban" TEXT,
    "ibanSahipligiDogrulandi" BOOLEAN NOT NULL DEFAULT false,
    "yonlendirmeGerekcesi" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "odeme_hareketi_sozlesme_id_fkey" FOREIGN KEY ("sozlesme_id") REFERENCES "sozlesme" ("sozlesme_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teslimat" (
    "teslimat_id" TEXT NOT NULL PRIMARY KEY,
    "sozlesme_id" TEXT NOT NULL,
    "teslim_tarihi" DATETIME NOT NULL,
    "teslim_tutar" DECIMAL NOT NULL,
    "teslim_tipi" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teslimat_sozlesme_id_fkey" FOREIGN KEY ("sozlesme_id") REFERENCES "sozlesme" ("sozlesme_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "likidite_pozisyonu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarih" DATETIME NOT NULL,
    "nakit" DECIMAL NOT NULL,
    "likit_varlik" DECIMAL NOT NULL,
    "kisa_vadeli_yukumluluk" DECIMAL NOT NULL,
    "teslimat_yukumlulugu_30gun" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "risk_kpi" (
    "kpi_kodu" TEXT NOT NULL PRIMARY KEY,
    "aciklama" TEXT NOT NULL,
    "birim" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "risk_limit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpi_kodu" TEXT NOT NULL,
    "esik_deger" DECIMAL NOT NULL,
    "karsilastirma" TEXT NOT NULL,
    "seviye" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_limit_kpi_kodu_fkey" FOREIGN KEY ("kpi_kodu") REFERENCES "risk_kpi" ("kpi_kodu") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "senaryo" (
    "senaryo_kodu" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "parametreler" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "gunluk_risk_ozet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarih" DATETIME NOT NULL,
    "senaryo_kodu" TEXT NOT NULL,
    "kpi_kodu" TEXT NOT NULL,
    "deger" DECIMAL NOT NULL,
    "risk_seviyesi" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gunluk_risk_ozet_kpi_kodu_fkey" FOREIGN KEY ("kpi_kodu") REFERENCES "risk_kpi" ("kpi_kodu") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gunluk_risk_ozet_senaryo_kodu_fkey" FOREIGN KEY ("senaryo_kodu") REFERENCES "senaryo" ("senaryo_kodu") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "uyari" (
    "uyari_id" TEXT NOT NULL PRIMARY KEY,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kpi_kodu" TEXT NOT NULL,
    "senaryo_kodu" TEXT NOT NULL,
    "esik_deger" DECIMAL NOT NULL,
    "gerceklesen_deger" DECIMAL NOT NULL,
    "risk_seviyesi" TEXT NOT NULL,
    "durum" TEXT NOT NULL,
    "mesaj" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uyari_senaryo_kodu_fkey" FOREIGN KEY ("senaryo_kodu") REFERENCES "senaryo" ("senaryo_kodu") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "uyari_kpi_kodu_fkey" FOREIGN KEY ("kpi_kodu") REFERENCES "risk_kpi" ("kpi_kodu") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "likidite_stres_sonucu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senaryo_ad" TEXT NOT NULL,
    "lcr_deger" DECIMAL NOT NULL,
    "risk_seviyesi" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Resmi Tatil',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "team" TEXT,
    "supervisor" TEXT,
    "supervisorId" TEXT,
    "auditCode" TEXT,
    "department" TEXT,
    "creatorId" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "scope" TEXT,
    "objective" TEXT,
    "methodology" TEXT,
    "criteria" TEXT,
    "period" TEXT,
    "description" TEXT,
    "opinion" TEXT,
    "riskLevel" TEXT,
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "unitId" TEXT,
    "processId" TEXT,
    "deletionComment" TEXT,
    "deletionReason" TEXT,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "confidentialityNote" TEXT,
    "fraudType" TEXT,
    "financialImpact" DECIMAL,
    "currency" TEXT DEFAULT 'TRY',
    "disciplinaryAction" TEXT,
    "involvedParties" TEXT,
    "investigationSummary" TEXT,
    "investigationFindings" TEXT,
    "investigationOpinion" TEXT,
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "auditableUnitId" TEXT,
    CONSTRAINT "audit_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_auditableUnitId_fkey" FOREIGN KEY ("auditableUnitId") REFERENCES "auditable_unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL,
    "dueDate" DATETIME,
    "description" TEXT,
    "evidence" TEXT,
    "financialImpact" DECIMAL,
    "departmentResponse" TEXT,
    "department" TEXT,
    "criteria" TEXT,
    "rootCause" TEXT,
    "recommendation" TEXT,
    "actionPlan" TEXT,
    "isAgreed" BOOLEAN,
    "disagreementReason" TEXT,
    "closingRemarks" TEXT,
    "reviewerId" TEXT,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "assignedUserId" TEXT,
    "notificationDate" DATETIME,
    "responseDate" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "lastEditedAt" DATETIME,
    "isRiskAccepted" BOOLEAN DEFAULT false,
    "riskAcceptanceJustification" TEXT,
    "riskAcceptedBy" TEXT,
    "riskAcceptedAt" DATETIME,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "supervisorId" TEXT,
    "processId" TEXT,
    "riskId" TEXT,
    "controlId" TEXT,
    "linkedEthicsReportId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFindingId" TEXT,
    "recurringNote" TEXT,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "confidentialityNote" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "auditTestId" TEXT,
    "workpaperId" TEXT,
    "deletionComment" TEXT,
    "deletionReason" TEXT,
    CONSTRAINT "finding_auditTestId_fkey" FOREIGN KEY ("auditTestId") REFERENCES "audit_test" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_workpaperId_fkey" FOREIGN KEY ("workpaperId") REFERENCES "audit_workpaper" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "finding_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_linkedEthicsReportId_fkey" FOREIGN KEY ("linkedEthicsReportId") REFERENCES "ethics_report" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'Genel',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "auditId" TEXT,
    "changeData" TEXT,
    "ipAddress" TEXT,
    "previousHash" TEXT,
    "hash" TEXT
);

-- CreateTable
CREATE TABLE "audit_plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "priority" TEXT NOT NULL,
    "assignedTo" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "signedDocumentPath" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "auditable_unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "riskLevel" TEXT NOT NULL,
    "description" TEXT,
    "manager" TEXT,
    "location" TEXT,
    "employeeCount" INTEGER,
    "transactionVolume" TEXT,
    "financialImpact" TEXT,
    "riskScore" INTEGER,
    "impactScore" INTEGER DEFAULT 1,
    "likelihoodScore" INTEGER DEFAULT 1,
    "residualRiskScore" INTEGER,
    "auditCycle" INTEGER,
    "lastAuditDate" TEXT,
    "lastAuditId" TEXT,
    "nextAuditDate" TEXT,
    "estimatedDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "notes" TEXT,
    "strategicAlignment" TEXT,
    "businessCriticality" TEXT,
    "regulations" TEXT,
    "mandatoryAudit" BOOLEAN,
    "lastAuditResult" TEXT,
    "openFindingsCount" INTEGER DEFAULT 0,
    "inherentRisk" TEXT,
    "controlEffectiveness" TEXT,
    "changeRisk" BOOLEAN DEFAULT false,
    "requiredExpertise" TEXT,
    "previousAuditDays" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "process" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "process_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "auditable_unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "risk_processId_fkey" FOREIGN KEY ("processId") REFERENCES "process" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "control" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riskId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "type" TEXT,
    "frequency" TEXT,
    "source" TEXT,
    "method" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "control_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "risk" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT,
    "procedure" TEXT,
    "sampleSize" INTEGER,
    "designEffectiveness" TEXT,
    "operatingEffectiveness" TEXT,
    "testResult" TEXT,
    "testedBy" TEXT,
    "testDate" DATETIME,
    "supervisorId" TEXT,
    "supervisorApprovedAt" DATETIME,
    "evidence" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Taslak',
    "reviewerId" TEXT,
    "reviewedAt" DATETIME,
    CONSTRAINT "audit_test_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_test_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "control" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_test_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_test_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_test_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_education" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "attendees" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "participantList" TEXT
);

-- CreateTable
CREATE TABLE "audit_follow_up" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT,
    "action" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Açık',
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "lastEscalatedAt" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audit_follow_up_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_conciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Bekliyor',
    "response" TEXT,
    "responseDate" TEXT,
    "isAgreed" BOOLEAN,
    "disagreementReason" TEXT,
    "rootCause" TEXT,
    "actionPlan" TEXT,
    "evidencePath" TEXT,
    "digitalSeal" TEXT,
    "signedBy" TEXT,
    "signedAt" DATETIME,
    "signedIp" TEXT,
    "magicToken" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audit_conciliation_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conciliation_message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAgreed" BOOLEAN,
    "actionPlan" TEXT,
    "evidencePath" TEXT,
    "status" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conciliation_message_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "extension_request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "followUpId" TEXT,
    "currentDeadline" TEXT NOT NULL,
    "requestedDeadline" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Beklemede',
    "notes" TEXT,
    "requestorId" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "extension_request_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_extension_request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "currentEndDate" DATETIME NOT NULL,
    "requestedEndDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Beklemede',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "audit_extension_request_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_extension_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_extension_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sanction_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sanction_scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanType" TEXT NOT NULL,
    "scanSource" TEXT NOT NULL,
    "query" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Tamamlandı',
    "user" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sanction_scan_result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "matchName" TEXT NOT NULL,
    "matchSource" TEXT NOT NULL,
    "matchScore" REAL NOT NULL,
    "details" TEXT,
    CONSTRAINT "sanction_scan_result_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "sanction_scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suspicious_transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerId" TEXT,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Beklemede',
    "user" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletionReason" TEXT,
    "isAdUser" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "certifications" TEXT,
    "jobStartDate" TEXT,
    "departureDate" TEXT,
    "separationReason" TEXT,
    "phoneNumber" TEXT,
    "registerNumber" TEXT,
    "title" TEXT,
    "photoUrl" TEXT,
    "summary" TEXT,
    "skills" TEXT,
    "jobDescription" TEXT
);

-- CreateTable
CREATE TABLE "audit_timesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "auditId" TEXT,
    "date" TEXT NOT NULL,
    "hours" DECIMAL NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Taslak',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audit_timesheet_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_timesheet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" DATETIME,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "rootId" TEXT,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "storedFileName" TEXT
);

-- CreateTable
CREATE TABLE "document_chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT,
    "text" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ai_document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,
    "storedFileName" TEXT,
    CONSTRAINT "document_history_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ai_document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_workpaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Taslak',
    "version" INTEGER NOT NULL DEFAULT 1,
    "preparerId" TEXT,
    "preparedAt" DATETIME,
    "reviewerId" TEXT,
    "reviewedAt" DATETIME,
    "lockedById" TEXT,
    "lockedAt" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletionReason" TEXT,
    "supervisorId" TEXT,
    "supervisorApprovedAt" DATETIME,
    CONSTRAINT "audit_workpaper_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_workpaper_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_workpaper_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_workpaper_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_workpaper_preparerId_fkey" FOREIGN KEY ("preparerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_workpaper_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_workpaper_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workpaperId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "storedFileName" TEXT,
    "changeReason" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_workpaper_history_workpaperId_fkey" FOREIGN KEY ("workpaperId") REFERENCES "audit_workpaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_metric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "target" DECIMAL NOT NULL,
    "actual" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "status" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletionReason" TEXT
);

-- CreateTable
CREATE TABLE "quality_assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "assessor" TEXT NOT NULL,
    "assessorOrg" TEXT,
    "assessorTitle" TEXT,
    "assessorCertifications" TEXT,
    "assessorExperience" TEXT,
    "result" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "nextDueDate" DATETIME,
    "reportPath" TEXT,
    "findings" TEXT,
    "actionItems" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletionReason" TEXT
);

-- CreateTable
CREATE TABLE "quality_action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Açık',
    "priority" TEXT NOT NULL,
    "completedAt" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletionReason" TEXT,
    CONSTRAINT "quality_action_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "quality_assessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "independence_declaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "auditId" TEXT,
    "year" INTEGER,
    "declarationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Bekliyor',
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "hasFinancialLink" BOOLEAN NOT NULL DEFAULT false,
    "financialDetails" TEXT,
    "hasFamilyLink" BOOLEAN NOT NULL DEFAULT false,
    "familyDetails" TEXT,
    "hasPreviousRole" BOOLEAN NOT NULL DEFAULT false,
    "previousRoleDetails" TEXT,
    "hasOtherIssue" BOOLEAN NOT NULL DEFAULT false,
    "otherIssueDetails" TEXT,
    "declaredAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "signaturePath" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "independence_declaration_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "independence_declaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_sample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "populationSize" INTEGER NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "confidenceLevel" DECIMAL,
    "errorRate" DECIMAL,
    "expectedErrorRate" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "samplingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedItems" TEXT,
    "testResult" TEXT,
    "deviationsFound" INTEGER DEFAULT 0,
    "conclusions" TEXT,
    "notes" TEXT,
    "observedDeviationRate" DECIMAL,
    "upperDeviationRate" DECIMAL,
    "precisionRate" DECIMAL,
    "confidenceIntervalLower" DECIMAL,
    "confidenceIntervalUpper" DECIMAL,
    "projectedPopulationErrors" INTEGER,
    "sampleAdequacy" TEXT,
    "findingId" TEXT,
    "populationWorkpaperId" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "creatorId" TEXT,
    "creatorName" TEXT,
    CONSTRAINT "audit_sample_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_sample_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ethics_report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Beklemede',
    "source" TEXT DEFAULT 'Web Form',
    "trackingCode" TEXT NOT NULL,
    "reporterId" TEXT,
    "reporterName" TEXT,
    "assigneeId" TEXT,
    "assignedAt" DATETIME,
    "internalNotes" TEXT,
    "slaDeadline" DATETIME,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "escalatedAt" DATETIME,
    "investigationOutcome" TEXT,
    "closingSummary" TEXT,
    "disciplinaryAction" BOOLEAN,
    "closedAt" DATETIME,
    "closedById" TEXT,
    "assigneeConflictDeclared" BOOLEAN NOT NULL DEFAULT false,
    "linkedFindingId" TEXT,
    "targetUnitId" TEXT,
    "emailMessageId" TEXT,
    "emailThreadId" TEXT,
    "emailOriginalContent" TEXT,
    "disciplinaryActionDetails" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ethics_report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ethics_report_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ethics_report_targetUnitId_fkey" FOREIGN KEY ("targetUnitId") REFERENCES "auditable_unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ethics_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "uploadedBy" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ethics_evidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ethics_report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ethics_message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "senderId" TEXT,
    "isFromReporter" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ethics_message_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ethics_report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ethics_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ethics_investigation_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ethics_investigation_note_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ethics_report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ethics_investigation_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ethics_ip_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashedIp" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ethics_ip_log_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ethics_report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "multi_year_plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Taslak',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "multi_year_plan_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" TEXT,
    "priority" TEXT NOT NULL,
    "estimatedDays" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "multi_year_plan_item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "auditable_unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "multi_year_plan_item_planId_fkey" FOREIGN KEY ("planId") REFERENCES "multi_year_plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "templatePath" TEXT,
    "sections" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "generated_report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parameters" TEXT,
    CONSTRAINT "generated_report_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sira" INTEGER NOT NULL,
    "numara" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "hedefBirimIds" TEXT,
    "gizlilikDerecesi" TEXT NOT NULL DEFAULT 'HASSAS',
    "kismiCiktidaYerAlir" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "report_finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "sectionId" TEXT,
    "bulguNo" TEXT NOT NULL,
    "hedefBirimId" TEXT,
    "onemDuzeyi" TEXT NOT NULL,
    "tespit" TEXT NOT NULL,
    "birimCevabi" TEXT,
    "oneri" TEXT,
    "kapatmaTarihi" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "report_issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "tur" TEXT NOT NULL,
    "hedefBirimId" TEXT,
    "sectionIds" TEXT,
    "turevNo" TEXT NOT NULL,
    "olusturanId" TEXT NOT NULL,
    "olusturmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dosyaId" TEXT
);

-- CreateTable
CREATE TABLE "workpaper_template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "templatePath" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_training" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "hours" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_training_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_training_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "training_batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "training_batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "hours" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "cancellationNotes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_promotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "previousTitle" TEXT,
    "department" TEXT,
    "type" TEXT DEFAULT 'Terfi',
    "passiveReason" TEXT,
    "promotionDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_promotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_experience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "description" TEXT,
    "careerPaths" TEXT DEFAULT '[]',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_experience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_education" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "faculty" TEXT,
    "department" TEXT NOT NULL,
    "degree" TEXT,
    "graduationYear" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "date" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "findingId" TEXT,
    "testId" TEXT,
    "workpaperId" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_note_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_note_testId_fkey" FOREIGN KEY ("testId") REFERENCES "audit_test" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_note_workpaperId_fkey" FOREIGN KEY ("workpaperId") REFERENCES "audit_workpaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_communication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Taslak',
    "sentAt" DATETIME,
    "sentById" TEXT,
    "readAt" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audit_communication_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_communication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "meetingDate" DATETIME,
    "location" TEXT,
    "agenda" TEXT,
    "minutes" TEXT,
    "attendees" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audit_meeting_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_leave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planlandı',
    "proxyUserId" TEXT,
    "description" TEXT,
    "managerNote" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_leave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_leave_proxyUserId_fkey" FOREIGN KEY ("proxyUserId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_retention_policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataCategory" TEXT NOT NULL,
    "dataDescription" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "retentionPeriod" INTEGER NOT NULL,
    "destructionMethod" TEXT NOT NULL,
    "responsibleUnit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "lastReviewDate" DATETIME,
    "nextReviewDate" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data_subject_request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestCode" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantIdentity" TEXT,
    "applicantContact" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestDetails" TEXT NOT NULL,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "responseDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Alındı',
    "response" TEXT,
    "assignedTo" TEXT,
    "assignedToName" TEXT,
    "legalBasis" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reputation_signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musteriId" TEXT NOT NULL,
    "sozlesmeId" TEXT,
    "kuralKodu" TEXT NOT NULL,
    "kuralAd" TEXT NOT NULL,
    "riskPuani" INTEGER NOT NULL,
    "onemDuzeyi" TEXT NOT NULL,
    "tetiklenmeSebebi" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'ACIK',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "enhanced_due_diligence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musteriId" TEXT NOT NULL,
    "signalId" TEXT,
    "iddiaTuru" TEXT NOT NULL,
    "iddiaAsamasi" TEXT NOT NULL,
    "kaynakAd" TEXT NOT NULL,
    "kaynakTarih" DATETIME,
    "guvenilirlikSkoru" TEXT NOT NULL,
    "ticaretSicilKontrol" BOOLEAN NOT NULL DEFAULT false,
    "resmiGazeteKontrol" BOOLEAN NOT NULL DEFAULT false,
    "tmsfKontrol" BOOLEAN NOT NULL DEFAULT false,
    "acikKaynakKontrol" BOOLEAN NOT NULL DEFAULT false,
    "kurumIciKontrol" BOOLEAN NOT NULL DEFAULT false,
    "kanitDosyaUrl" TEXT,
    "kaynakBaglantisi" TEXT,
    "karar" TEXT NOT NULL DEFAULT 'ISLEME_DEVAM',
    "kararGerekcesi" TEXT NOT NULL,
    "ustOnayGerekli" BOOLEAN NOT NULL DEFAULT false,
    "ustOnayDurumu" TEXT,
    "inceleyenUser" TEXT NOT NULL,
    "onaylayanUser" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "finding_action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "aksiyonTanimi" TEXT NOT NULL,
    "sorumluId" TEXT NOT NULL,
    "terminTarihi" DATETIME NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'ACIK',
    "tamamlanmaTarihi" DATETIME,
    "olusturanId" TEXT NOT NULL,
    "notlar" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "finding_action_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "finding_action_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "finding_action_olusturanId_fkey" FOREIGN KEY ("olusturanId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "action_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aksiyonId" TEXT NOT NULL,
    "dosyaAdi" TEXT NOT NULL,
    "dosyaYolu" TEXT,
    "aciklama" TEXT,
    "yukleyenId" TEXT NOT NULL,
    "yuklemeTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onayDurumu" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "onaylayanId" TEXT,
    "onayTarihi" DATETIME,
    "redGerekce" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "action_evidence_aksiyonId_fkey" FOREIGN KEY ("aksiyonId") REFERENCES "finding_action" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "action_evidence_yukleyenId_fkey" FOREIGN KEY ("yukleyenId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "action_evidence_onaylayanId_fkey" FOREIGN KEY ("onaylayanId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "finding_objection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "itirazEdenId" TEXT NOT NULL,
    "itirazTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itirazGerekce" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "mufettisGorusu" TEXT,
    "kararVerenId" TEXT,
    "kararTarihi" DATETIME,
    "kararGerekce" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "finding_objection_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "finding_objection_itirazEdenId_fkey" FOREIGN KEY ("itirazEdenId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "finding_objection_kararVerenId_fkey" FOREIGN KEY ("kararVerenId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "control_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "processName" TEXT,
    "riskTitle" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Önleyici',
    "method" TEXT NOT NULL DEFAULT 'Otomatik',
    "frequency" TEXT NOT NULL DEFAULT 'Sürekli',
    "owner" TEXT,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "creatorId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "control_test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "controlId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "testMethod" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "testerId" TEXT,
    "testerName" TEXT,
    "testDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" TEXT NOT NULL DEFAULT 'ETKIN',
    "deviationCount" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "control_test_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "control_item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "control_deficiency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "controlId" TEXT NOT NULL,
    "testId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'Orta',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "responsibleUnit" TEXT,
    "actionPlan" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Taslak',
    "closedAt" DATETIME,
    "sentToUnitAt" DATETIME,
    "sentToUnitById" TEXT,
    "replyDeadline" DATETIME,
    "unitResponse" TEXT,
    "unitResponseReason" TEXT,
    "unitResponseById" TEXT,
    "unitRespondedAt" DATETIME,
    "conciliationStatus" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "evaluationReason" TEXT,
    "evaluatedById" TEXT,
    "notifiedAt" DATETIME,
    "notifiedById" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "control_deficiency_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "control_item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "control_deficiency_testId_fkey" FOREIGN KEY ("testId") REFERENCES "control_test" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "control_action_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deficiencyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalStatus" TEXT NOT NULL DEFAULT 'BEKLEMEDE',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "control_action_evidence_deficiencyId_fkey" FOREIGN KEY ("deficiencyId") REFERENCES "control_deficiency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "control_self_assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "department" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "selfRating" TEXT NOT NULL DEFAULT 'Etkin',
    "justification" TEXT,
    "verifierId" TEXT,
    "verifierName" TEXT,
    "verificationResult" TEXT,
    "verifiedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deleteReason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "control_self_assessment_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "control_item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AuditToEthics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AuditToEthics_A_fkey" FOREIGN KEY ("A") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AuditToEthics_B_fkey" FOREIGN KEY ("B") REFERENCES "ethics_report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sanction_list_kod_key" ON "sanction_list"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "likidite_pozisyonu_tarih_key" ON "likidite_pozisyonu"("tarih");

-- CreateIndex
CREATE UNIQUE INDEX "gunluk_risk_ozet_tarih_senaryo_kodu_kpi_kodu_key" ON "gunluk_risk_ozet"("tarih", "senaryo_kodu", "kpi_kodu");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_date_key" ON "holiday"("date");

-- CreateIndex
CREATE INDEX "audit_auditCode_idx" ON "audit"("auditCode");

-- CreateIndex
CREATE INDEX "audit_creatorId_idx" ON "audit"("creatorId");

-- CreateIndex
CREATE INDEX "audit_unitId_idx" ON "audit"("unitId");

-- CreateIndex
CREATE INDEX "audit_status_idx" ON "audit"("status");

-- CreateIndex
CREATE INDEX "audit_isDeleted_idx" ON "audit"("isDeleted");

-- CreateIndex
CREATE INDEX "audit_department_idx" ON "audit"("department");

-- CreateIndex
CREATE INDEX "audit_created_at_idx" ON "audit"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "finding_code_key" ON "finding"("code");

-- CreateIndex
CREATE INDEX "finding_auditId_idx" ON "finding"("auditId");

-- CreateIndex
CREATE INDEX "finding_status_idx" ON "finding"("status");

-- CreateIndex
CREATE INDEX "finding_risk_idx" ON "finding"("risk");

-- CreateIndex
CREATE INDEX "finding_department_idx" ON "finding"("department");

-- CreateIndex
CREATE INDEX "finding_dueDate_idx" ON "finding"("dueDate");

-- CreateIndex
CREATE INDEX "finding_created_at_idx" ON "finding"("created_at");

-- CreateIndex
CREATE INDEX "finding_isDeleted_idx" ON "finding"("isDeleted");

-- CreateIndex
CREATE INDEX "finding_assignedUserId_idx" ON "finding"("assignedUserId");

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_isRead_idx" ON "notification"("isRead");

-- CreateIndex
CREATE INDEX "audit_log_targetType_targetId_idx" ON "audit_log"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_log_auditId_idx" ON "audit_log"("auditId");

-- CreateIndex
CREATE INDEX "audit_plan_status_idx" ON "audit_plan"("status");

-- CreateIndex
CREATE INDEX "audit_plan_year_idx" ON "audit_plan"("year");

-- CreateIndex
CREATE INDEX "audit_plan_created_at_idx" ON "audit_plan"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audit_conciliation_findingId_key" ON "audit_conciliation"("findingId");

-- CreateIndex
CREATE UNIQUE INDEX "suspicious_transaction_trackingCode_key" ON "suspicious_transaction"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "audit_timesheet_userId_date_idx" ON "audit_timesheet"("userId", "date");

-- CreateIndex
CREATE INDEX "audit_timesheet_status_idx" ON "audit_timesheet"("status");

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

-- CreateIndex
CREATE INDEX "ai_document_rootId_version_idx" ON "ai_document"("rootId", "version");

-- CreateIndex
CREATE INDEX "document_chunk_documentId_idx" ON "document_chunk"("documentId");

-- CreateIndex
CREATE INDEX "document_chunk_source_idx" ON "document_chunk"("source");

-- CreateIndex
CREATE INDEX "document_chunk_category_idx" ON "document_chunk"("category");

-- CreateIndex
CREATE INDEX "audit_workpaper_auditId_idx" ON "audit_workpaper"("auditId");

-- CreateIndex
CREATE INDEX "audit_workpaper_status_idx" ON "audit_workpaper"("status");

-- CreateIndex
CREATE INDEX "audit_workpaper_created_at_idx" ON "audit_workpaper"("created_at");

-- CreateIndex
CREATE INDEX "audit_workpaper_isDeleted_idx" ON "audit_workpaper"("isDeleted");

-- CreateIndex
CREATE INDEX "audit_workpaper_history_workpaperId_version_idx" ON "audit_workpaper_history"("workpaperId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ethics_report_trackingCode_key" ON "ethics_report"("trackingCode");

-- CreateIndex
CREATE INDEX "ethics_ip_log_hashedIp_createdAt_idx" ON "ethics_ip_log"("hashedIp", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "multi_year_plan_item_planId_unitId_year_key" ON "multi_year_plan_item"("planId", "unitId", "year");

-- CreateIndex
CREATE INDEX "user_training_isDeleted_idx" ON "user_training"("isDeleted");

-- CreateIndex
CREATE INDEX "user_promotion_isDeleted_idx" ON "user_promotion"("isDeleted");

-- CreateIndex
CREATE INDEX "user_experience_isDeleted_idx" ON "user_experience"("isDeleted");

-- CreateIndex
CREATE INDEX "user_education_isDeleted_idx" ON "user_education"("isDeleted");

-- CreateIndex
CREATE INDEX "user_certificate_isDeleted_idx" ON "user_certificate"("isDeleted");

-- CreateIndex
CREATE INDEX "review_note_findingId_idx" ON "review_note"("findingId");

-- CreateIndex
CREATE INDEX "review_note_testId_idx" ON "review_note"("testId");

-- CreateIndex
CREATE INDEX "review_note_workpaperId_idx" ON "review_note"("workpaperId");

-- CreateIndex
CREATE INDEX "audit_communication_auditId_idx" ON "audit_communication"("auditId");

-- CreateIndex
CREATE INDEX "audit_meeting_auditId_idx" ON "audit_meeting"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "data_subject_request_requestCode_key" ON "data_subject_request"("requestCode");

-- CreateIndex
CREATE INDEX "data_subject_request_status_idx" ON "data_subject_request"("status");

-- CreateIndex
CREATE INDEX "data_subject_request_requestCode_idx" ON "data_subject_request"("requestCode");

-- CreateIndex
CREATE INDEX "finding_action_findingId_idx" ON "finding_action"("findingId");

-- CreateIndex
CREATE INDEX "finding_action_sorumluId_idx" ON "finding_action"("sorumluId");

-- CreateIndex
CREATE INDEX "finding_action_durum_idx" ON "finding_action"("durum");

-- CreateIndex
CREATE INDEX "finding_action_terminTarihi_idx" ON "finding_action"("terminTarihi");

-- CreateIndex
CREATE INDEX "action_evidence_aksiyonId_idx" ON "action_evidence"("aksiyonId");

-- CreateIndex
CREATE INDEX "action_evidence_onayDurumu_idx" ON "action_evidence"("onayDurumu");

-- CreateIndex
CREATE INDEX "finding_objection_findingId_idx" ON "finding_objection"("findingId");

-- CreateIndex
CREATE INDEX "finding_objection_durum_idx" ON "finding_objection"("durum");

-- CreateIndex
CREATE UNIQUE INDEX "control_item_code_key" ON "control_item"("code");

-- CreateIndex
CREATE INDEX "control_item_department_idx" ON "control_item"("department");

-- CreateIndex
CREATE INDEX "control_item_status_idx" ON "control_item"("status");

-- CreateIndex
CREATE INDEX "control_item_isDeleted_idx" ON "control_item"("isDeleted");

-- CreateIndex
CREATE INDEX "control_test_controlId_idx" ON "control_test"("controlId");

-- CreateIndex
CREATE INDEX "control_test_result_idx" ON "control_test"("result");

-- CreateIndex
CREATE INDEX "control_test_isDeleted_idx" ON "control_test"("isDeleted");

-- CreateIndex
CREATE INDEX "control_deficiency_controlId_idx" ON "control_deficiency"("controlId");

-- CreateIndex
CREATE INDEX "control_deficiency_status_idx" ON "control_deficiency"("status");

-- CreateIndex
CREATE INDEX "control_deficiency_severity_idx" ON "control_deficiency"("severity");

-- CreateIndex
CREATE INDEX "control_deficiency_isDeleted_idx" ON "control_deficiency"("isDeleted");

-- CreateIndex
CREATE INDEX "control_action_evidence_deficiencyId_idx" ON "control_action_evidence"("deficiencyId");

-- CreateIndex
CREATE INDEX "control_action_evidence_approvalStatus_idx" ON "control_action_evidence"("approvalStatus");

-- CreateIndex
CREATE INDEX "control_self_assessment_controlId_idx" ON "control_self_assessment"("controlId");

-- CreateIndex
CREATE INDEX "control_self_assessment_department_idx" ON "control_self_assessment"("department");

-- CreateIndex
CREATE INDEX "control_self_assessment_isDeleted_idx" ON "control_self_assessment"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "_AuditToEthics_AB_unique" ON "_AuditToEthics"("A", "B");

-- CreateIndex
CREATE INDEX "_AuditToEthics_B_index" ON "_AuditToEthics"("B");

