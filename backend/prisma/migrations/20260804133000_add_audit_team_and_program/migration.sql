-- CreateTable
CREATE TABLE "audit_team_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "atanmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planlananGun" INTEGER NOT NULL DEFAULT 0,
    "gerceklesenGun" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "audit_team_member_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 1,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT,
    "sorumluId" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'Planlandı',
    "planlananGun" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "audit_program_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_program_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_program_step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 1,
    "testAdimi" TEXT NOT NULL,
    "yontem" TEXT,
    "beklenenKanit" TEXT,
    "sorumluId" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'Planlandı',
    "sonuc" TEXT,
    "notlar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "audit_program_step_programId_fkey" FOREIGN KEY ("programId") REFERENCES "audit_program" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_program_step_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "audit_team_member_auditId_idx" ON "audit_team_member"("auditId");

-- CreateIndex
CREATE INDEX "audit_team_member_userId_idx" ON "audit_team_member"("userId");

-- CreateIndex
CREATE INDEX "audit_program_auditId_idx" ON "audit_program"("auditId");

-- CreateIndex
CREATE INDEX "audit_program_sorumluId_idx" ON "audit_program"("sorumluId");

-- CreateIndex
CREATE INDEX "audit_program_step_programId_idx" ON "audit_program_step"("programId");

-- CreateIndex
CREATE INDEX "audit_program_step_sorumluId_idx" ON "audit_program_step"("sorumluId");
