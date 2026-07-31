const fs = require('fs');

// 1. AuditSidebar.tsx
let as = fs.readFileSync('frontend/components/audit/AuditSidebar.tsx', 'utf8');
// It complains about syntax error at `); }` at line 215. Let's see the end of the file.
// It seems there's an extra `}` or unclosed tag. The error showed `</div>` inside `<aside>`.
as = as.replace('            </div>\n        </aside>\n    );\n}', '        </aside>\n    );\n}');
fs.writeFileSync('frontend/components/audit/AuditSidebar.tsx', as, 'utf8');

// 2. QualityMetrics.tsx
let qm = fs.readFileSync('frontend/components/audit/QualityMetrics.tsx', 'utf8');
// "Unexpected token `div`. Expected jsx identifier" at `<div className="space-y-6 ...`
// This usually means there's a missing return keyword or it's outside a component body, or an extra brace.
// The error snippet: `} return ( <div className="...`
qm = qm.replace('    }\n\n    return (\n        <div className="space-y-6', '    return (\n        <div className="space-y-6');
fs.writeFileSync('frontend/components/audit/QualityMetrics.tsx', qm, 'utf8');

// 3. DataUploadModal.tsx
let dum = fs.readFileSync('frontend/components/risk/DataUploadModal.tsx', 'utf8');
dum = dum.replace("import FormInput from '@/components/ui/FormInput';\n'use client';", "'use client';\nimport FormInput from '@/components/ui/FormInput';");
fs.writeFileSync('frontend/components/risk/DataUploadModal.tsx', dum, 'utf8');

// 4. RiskLimitsModal.tsx
let rlm = fs.readFileSync('frontend/components/risk/RiskLimitsModal.tsx', 'utf8');
rlm = rlm.replace("import FormInput from '@/components/ui/FormInput';\n'use client';", "'use client';\nimport FormInput from '@/components/ui/FormInput';");
fs.writeFileSync('frontend/components/risk/RiskLimitsModal.tsx', rlm, 'utf8');

// 5. RiskSidebar.tsx
let rs = fs.readFileSync('frontend/components/risk/RiskSidebar.tsx', 'utf8');
rs = rs.replace('    const isActive = (path: string) => pathname === path || (path !== \'/risk\' && pathname.startsWith(path));\n\n    const isActive = (path: string) => pathname === path || (path !== \'/risk\' && pathname.startsWith(path));', '    const isActive = (path: string) => pathname === path || (path !== \'/risk\' && pathname.startsWith(path));');
fs.writeFileSync('frontend/components/risk/RiskSidebar.tsx', rs, 'utf8');
