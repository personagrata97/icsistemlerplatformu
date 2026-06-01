const fs = require('fs');
const glob = require('glob');
const files = glob.sync('c:/Users/sk36/.gemini/antigravity/scratch/icsistemler-platformu/frontend/**/*.{ts,tsx}', { nodir: true });
let findings = [];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8').split('\n');
  content.forEach((line, i) => {
    if(line.includes("key: 'actions'")) {
        const snippet = content.slice(i, i+15).join('\n');
        if(!snippet.includes('ActionMenu') && !snippet.includes('FindingActionButtons') && !snippet.includes('AuditActionButtons')) {
            findings.push("--- " + file + " ---");
            findings.push(snippet);
        }
    }
  });
});
console.log(findings.join('\n'));
