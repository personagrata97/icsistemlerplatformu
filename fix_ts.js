const fs = require('fs');

// Fix 1: audit-risk.service.ts
let ar = fs.readFileSync('backend/src/audit/audit-risk.service.ts', 'utf8');
ar = ar.replace('let riskAlertPenalty = redIndicators.length * riskPenaltyWeight;\n\n            // Eski uyarı log kontrolünü', 'let riskAlertPenalty = redIndicators.length * riskPenaltyWeight;\n\n            // Eski uyarı log kontrolünü');
// wait, the error says redeclared. Let's see the redeclaration.
ar = ar.replace('let riskAlertPenalty = 0;', '');
fs.writeFileSync('backend/src/audit/audit-risk.service.ts', ar, 'utf8');

// Fix 2: audit.controller.ts
let ac = fs.readFileSync('backend/src/audit/audit.controller.ts', 'utf8');
ac = ac.replace("@RequirePermissions('VIEW_AUDIT_PLAN')", "@RequirePermissions({ module: 'AUDIT', action: 'VIEW' })");
fs.writeFileSync('backend/src/audit/audit.controller.ts', ac, 'utf8');

// Fix 3: audit.service.ts
let as = fs.readFileSync('backend/src/audit/audit.service.ts', 'utf8');
as = as.replace('where: { isActive: true },', 'where: { isDeleted: false },');
fs.writeFileSync('backend/src/audit/audit.service.ts', as, 'utf8');

// Fix 4: sanction.service.ts
let ss = fs.readFileSync('backend/src/sanction/sanction.service.ts', 'utf8');
ss = ss.replace(/match\.musteriAd \|\| /g, '');
ss = ss.replace(/match\.liste \|\| /g, '');
fs.writeFileSync('backend/src/sanction/sanction.service.ts', ss, 'utf8');
