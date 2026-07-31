const fs = require('fs');

try {
  let as = fs.readFileSync('components/audit/AuditSidebar.tsx', 'utf8');
  as = as.replace('    return (\n        return (\n        <aside', '    return (\n        <aside');
  fs.writeFileSync('components/audit/AuditSidebar.tsx', as, 'utf8');
} catch(e){}

try {
  let qm = fs.readFileSync('components/audit/QualityMetrics.tsx', 'utf8');
  qm = qm.replace('            </div>\n        );\n    return (\n        <div className="space-y-6', '            </div>\n        );\n    }\n\n    return (\n        <div className="space-y-6');
  fs.writeFileSync('components/audit/QualityMetrics.tsx', qm, 'utf8');
} catch(e){}

try {
  let ft = fs.readFileSync('app/audit/fast-track/page.tsx', 'utf8');
  ft = ft.replace('return () =>\n            <PageHeader title="Hızlı Denetim (Fast-Track)" subtitle="Acil ve kritik konularda hızlı denetim görevi oluşturma ve yürütme" /> { activeTimer = false; };', 'return () => { activeTimer = false; };');
  fs.writeFileSync('app/audit/fast-track/page.tsx', ft, 'utf8');
} catch(e){}

try {
  let uf = fs.readFileSync('app/audit/universe/[unitId]/page.tsx', 'utf8');
  uf = uf.replace('import PageHeader from \'@/components/ui/PageHeader\';\nimport FormTextarea from', 'import FormTextarea from');
  fs.writeFileSync('app/audit/universe/[unitId]/page.tsx', uf, 'utf8');
} catch(e){}

try {
  let kb = fs.readFileSync('app/control/knowledge-base/page.tsx', 'utf8');
  kb = kb.replace('import PageHeader from \'@/components/ui/PageHeader\';\nimport RequireRole from', 'import RequireRole from');
  fs.writeFileSync('app/control/knowledge-base/page.tsx', kb, 'utf8');
} catch(e){}
