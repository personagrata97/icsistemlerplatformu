-- CreateTable
CREATE TABLE "finding_approval_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userRole" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "finding_approval_log_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "finding_approval_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_finding" (
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
    "submittedToSupervisorAt" DATETIME,
    "submittedById" TEXT,
    "supervisorReviewAt" DATETIME,
    "supervisorDecision" TEXT,
    "supervisorNote" TEXT,
    "managerApprovalAt" DATETIME,
    "managerId" TEXT,
    "managerDecision" TEXT,
    "managerNote" TEXT,
    CONSTRAINT "finding_auditTestId_fkey" FOREIGN KEY ("auditTestId") REFERENCES "audit_test" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_workpaperId_fkey" FOREIGN KEY ("workpaperId") REFERENCES "audit_workpaper" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "finding_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_linkedEthicsReportId_fkey" FOREIGN KEY ("linkedEthicsReportId") REFERENCES "ethics_report" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "finding_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_finding" ("actionPlan", "assignedUserId", "auditId", "auditTestId", "category", "closingRemarks", "code", "confidentialityNote", "controlId", "created_at", "criteria", "deletedAt", "deletedById", "deletionComment", "deletionReason", "department", "departmentResponse", "description", "disagreementReason", "dueDate", "escalationLevel", "evidence", "financialImpact", "id", "isAgreed", "isConfidential", "isDeleted", "isRecurring", "isRiskAccepted", "lastEditedAt", "linkedEthicsReportId", "notificationDate", "processId", "recommendation", "recurringFindingId", "recurringNote", "responseDate", "reviewerId", "risk", "riskAcceptanceJustification", "riskAcceptedAt", "riskAcceptedBy", "riskId", "rootCause", "status", "supervisorId", "title", "updated_at", "verifiedAt", "verifiedBy", "workpaperId") SELECT "actionPlan", "assignedUserId", "auditId", "auditTestId", "category", "closingRemarks", "code", "confidentialityNote", "controlId", "created_at", "criteria", "deletedAt", "deletedById", "deletionComment", "deletionReason", "department", "departmentResponse", "description", "disagreementReason", "dueDate", "escalationLevel", "evidence", "financialImpact", "id", "isAgreed", "isConfidential", "isDeleted", "isRecurring", "isRiskAccepted", "lastEditedAt", "linkedEthicsReportId", "notificationDate", "processId", "recommendation", "recurringFindingId", "recurringNote", "responseDate", "reviewerId", "risk", "riskAcceptanceJustification", "riskAcceptedAt", "riskAcceptedBy", "riskId", "rootCause", "status", "supervisorId", "title", "updated_at", "verifiedAt", "verifiedBy", "workpaperId" FROM "finding";
DROP TABLE "finding";
ALTER TABLE "new_finding" RENAME TO "finding";
CREATE UNIQUE INDEX "finding_code_key" ON "finding"("code");
CREATE INDEX "finding_auditId_idx" ON "finding"("auditId");
CREATE INDEX "finding_status_idx" ON "finding"("status");
CREATE INDEX "finding_risk_idx" ON "finding"("risk");
CREATE INDEX "finding_department_idx" ON "finding"("department");
CREATE INDEX "finding_dueDate_idx" ON "finding"("dueDate");
CREATE INDEX "finding_created_at_idx" ON "finding"("created_at");
CREATE INDEX "finding_isDeleted_idx" ON "finding"("isDeleted");
CREATE INDEX "finding_assignedUserId_idx" ON "finding"("assignedUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "finding_approval_log_findingId_idx" ON "finding_approval_log"("findingId");

-- CreateIndex
CREATE INDEX "finding_approval_log_userId_idx" ON "finding_approval_log"("userId");
