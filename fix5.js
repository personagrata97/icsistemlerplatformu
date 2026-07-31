const fs = require('fs');
let ar = fs.readFileSync('backend/src/audit/audit-risk.service.ts', 'utf8');
ar = ar.replace('                    riskAlertPenalty += 15;\n                }\n            }\n                    riskAlertPenalty += 15;\n                }\n            }', '                    riskAlertPenalty += 15;\n                }\n            }');
fs.writeFileSync('backend/src/audit/audit-risk.service.ts', ar, 'utf8');
