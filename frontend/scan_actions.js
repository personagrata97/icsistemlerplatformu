const fs = require('fs');
const glob = require('glob');
const files = glob.sync('c:/Users/sk36/.gemini/antigravity/scratch/icsistemler-platformu/frontend/**/*.{ts,tsx}', { nodir: true });
let findings = [];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if(content.includes('key: \\'actions\\'') || content.includes('key: \"actions\"') || content.includes("key: 'actions'")) {
     const matches = [...content.matchAll(/key:\s*['"]actions['"].*?render:\s*\([^)]*\)\s*=>\s*([^}]+)/gs)];
     matches.forEach(m => {
       const body = m[1];
       if(!body.includes('ActionMenu') && !body.includes('FindingActionButtons') && !body.includes('AuditActionButtons')) {
          findings.push(file + ' does NOT use ActionMenu in actions column. Uses: ' + body.substring(0, 150).replace(/\n/g, ' '));
       }
     });
  }
});
console.log(findings.join('\n'));
