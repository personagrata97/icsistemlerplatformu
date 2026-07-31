const fs = require('fs');
const cp = require('child_process');

try {
  const original = cp.execSync('git show HEAD:frontend/app/audit/plan/page.tsx', { encoding: 'utf8' });
  fs.writeFileSync('frontend/app/audit/plan/page.tsx', original, 'utf8');
  console.log('Restored frontend/app/audit/plan/page.tsx');
} catch (e) {
  console.error(e);
}
