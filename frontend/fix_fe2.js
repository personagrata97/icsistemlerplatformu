const fs = require('fs');

try {
// 1. AuditSidebar.tsx
let as = fs.readFileSync('components/audit/AuditSidebar.tsx', 'utf8');
// Fix the `return (` that is broken.
// Error: `Return statement is not allowed here` at line 45.
// Ah, `import FormInput` might be badly injected? Let's check.
as = as.replace("import FormInput from '@/components/ui/FormInput';\n'use client';", "'use client';\nimport FormInput from '@/components/ui/FormInput';");
// It has:
// ,->     return (
// `->         <aside
// Let's replace the whole file content that contains that.
// But wait, the error is probably due to a stray `}` or something before `return`.
// Let's just fix the previous replacement that went wrong.
} catch (e) {}

try {
// 2. QualityMetrics.tsx
let qm = fs.readFileSync('components/audit/QualityMetrics.tsx', 'utf8');
qm = qm.replace("import FormInput from '@/components/ui/FormInput';\n'use client';", "'use client';\nimport FormInput from '@/components/ui/FormInput';");
fs.writeFileSync('components/audit/QualityMetrics.tsx', qm, 'utf8');
} catch (e) {}

try {
// 3. CustomSelect.tsx
let cs = fs.readFileSync('components/ui/CustomSelect.tsx', 'utf8');
cs = cs.replace("import FormInput from '@/components/ui/FormInput';\n'use client';", "'use client';\nimport FormInput from '@/components/ui/FormInput';");
fs.writeFileSync('components/ui/CustomSelect.tsx', cs, 'utf8');
} catch (e) {}

try {
// 4. DataTable.tsx
let dt = fs.readFileSync('components/ui/DataTable.tsx', 'utf8');
dt = dt.replace("import FormInput from '@/components/ui/FormInput';\n'use client';", "'use client';\nimport FormInput from '@/components/ui/FormInput';");
fs.writeFileSync('components/ui/DataTable.tsx', dt, 'utf8');
} catch (e) {}

try {
// 5. [id]/page.tsx
let ap = fs.readFileSync('app/audit/audits/[id]/page.tsx', 'utf8');
ap = ap.replace("return () =>\n            <PageHeader title=\"Denetim Görev Detayı\" subtitle=\"Seçili denetim görevinin çalışma kağıtları, bulguları ve ilerleme takibi\" /> {", "return () => {");
fs.writeFileSync('app/audit/audits/[id]/page.tsx', ap, 'utf8');
} catch (e) {}
