const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && f !== 'node_modules' && f !== '.next') {
            walkDir(dirPath, callback);
        } else if (!isDirectory && (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts'))) {
            callback(path.join(dir, f));
        }
    });
}

let findings = [];
walkDir('c:/Users/sk36/.gemini/antigravity/scratch/icsistemler-platformu/frontend', file => {
  const content = fs.readFileSync(file, 'utf8').split('\n');
  content.forEach((line, i) => {
    if(line.includes("key: 'actions'")) {
        const snippet = content.slice(i, i+25).join('\n');
        if(!snippet.includes('ActionMenu') && !snippet.includes('FindingActionButtons') && !snippet.includes('AuditActionButtons')) {
            findings.push("--- " + file + " ---");
            findings.push(snippet);
        }
    }
  });
});
console.log(findings.join('\n'));
