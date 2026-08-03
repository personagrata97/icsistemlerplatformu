-- CreateTable
CREATE TABLE "sanction_parameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "deger" TEXT NOT NULL,
    "birim" TEXT NOT NULL,
    "minVal" REAL,
    "maxVal" REAL,
    "varsayilan" TEXT NOT NULL,
    "aciklama" TEXT,
    "guncelleyen" TEXT NOT NULL DEFAULT 'Sistem Yöneticisi',
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditParameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "org_unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "org_unit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "org_unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_title" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "cadre" INTEGER NOT NULL DEFAULT 1,
    "unitId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "job_title_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "org_unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auditable_unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "orgUnitId" TEXT,
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
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "auditable_unit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_auditable_unit" ("auditCycle", "businessCriticality", "changeRisk", "code", "controlEffectiveness", "created_at", "description", "employeeCount", "estimatedDays", "financialImpact", "id", "impactScore", "inherentRisk", "lastAuditDate", "lastAuditId", "lastAuditResult", "likelihoodScore", "location", "manager", "mandatoryAudit", "name", "nextAuditDate", "notes", "openFindingsCount", "parentId", "previousAuditDays", "regulations", "requiredExpertise", "residualRiskScore", "riskLevel", "riskScore", "status", "strategicAlignment", "transactionVolume", "type", "updated_at") SELECT "auditCycle", "businessCriticality", "changeRisk", "code", "controlEffectiveness", "created_at", "description", "employeeCount", "estimatedDays", "financialImpact", "id", "impactScore", "inherentRisk", "lastAuditDate", "lastAuditId", "lastAuditResult", "likelihoodScore", "location", "manager", "mandatoryAudit", "name", "nextAuditDate", "notes", "openFindingsCount", "parentId", "previousAuditDays", "regulations", "requiredExpertise", "residualRiskScore", "riskLevel", "riskScore", "status", "strategicAlignment", "transactionVolume", "type", "updated_at" FROM "auditable_unit";
DROP TABLE "auditable_unit";
ALTER TABLE "new_auditable_unit" RENAME TO "auditable_unit";
CREATE TABLE "new_notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'Genel',
    "module" TEXT NOT NULL DEFAULT 'audit',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notification" ("category", "createdAt", "description", "id", "isRead", "link", "title", "type", "userId") SELECT "category", "createdAt", "description", "id", "isRead", "link", "title", "type", "userId" FROM "notification";
DROP TABLE "notification";
ALTER TABLE "new_notification" RENAME TO "notification";
CREATE INDEX "notification_userId_idx" ON "notification"("userId");
CREATE INDEX "notification_isRead_idx" ON "notification"("isRead");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sanction_parameter_kod_key" ON "sanction_parameter"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "AuditParameter_code_key" ON "AuditParameter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "org_unit_code_key" ON "org_unit"("code");
