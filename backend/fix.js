const fs = require('fs');
let buf = fs.readFileSync('prisma/schema.prisma');
let str = buf.toString('utf8');
const idx = str.indexOf('model ControlSelfAssessment');
if (idx !== -1) {
    let good = str.substring(0, idx);
    let newContent = good + `model ControlSelfAssessment {
  id              String         @id @default(cuid())
  department      String
  period          String         // örn: 2026-Yıllık
  controlId       String
  selfRating      String         @default("Etkin") // Etkin, Kısmen Etkin, Etkin Değil
  justification   String?
  verifierId      String?
  verifierName    String?
  verificationResult String?      // Onaylandı, Revize İste, Reddedildi
  verifiedAt      DateTime?
  isDeleted       Boolean        @default(false)
  deletedAt       DateTime?
  deletedById     String?
  deleteReason    String?
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  control         ControlItem    @relation(fields: [controlId], references: [id], onDelete: Cascade)

  @@index([controlId])
  @@index([department])
  @@index([isDeleted])
  @@map("control_self_assessment")
}

model AuditParameter {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  value       String
  description String?
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}
`;
    fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');
}
