const fs = require('fs');
const cp = require('child_process');

try {
  // Let's get the original file back using git from the frontend dir, but not executing checkout.
  // Instead I'll just read from HEAD directly!
  const original = cp.execSync('git show HEAD:frontend/app/audit/audits/[id]/page.tsx', { encoding: 'utf8' });
  
  // Now modify it in memory safely
  let content = original;
  content = content.replace("return () =>\n            <PageHeader title=\"Denetim Görev Detayı\" subtitle=\"Seçili denetim görevinin çalışma kağıtları, bulguları ve ilerleme takibi\" /> {\n            window.removeEventListener('openFindingModalFromInvestigation', handleOpenFindingModal);\n        };", "return () => {\n            window.removeEventListener('openFindingModalFromInvestigation', handleOpenFindingModal);\n        };");
  
  // Write back
  fs.writeFileSync('app/audit/audits/[id]/page.tsx', content, 'utf8');
  console.log('Restored and patched [id]/page.tsx successfully.');
} catch (e) {
  console.error(e);
}
