const fs = require('fs');
const glob = require('glob'); // Make sure glob is available or I'll just use a recursive function.

// Recursive function to get files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      getFiles(dir + '/' + file, fileList);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        fileList.push(dir + '/' + file);
      }
    }
  }
  return fileList;
}

const allFiles = [...getFiles('app'), ...getFiles('components')];

let fixCount = 0;
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Find if 'use client'; is not at the start but exists
  if (content.includes("'use client';")) {
    const lines = content.split('\n');
    let useClientIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "'use client';") {
            useClientIndex = i;
            break;
        }
    }
    
    // If 'use client'; is found and it is not on the very first non-empty line
    if (useClientIndex > 0) {
        // Remove it from where it is
        lines.splice(useClientIndex, 1);
        // Put it at the top
        lines.unshift("'use client';");
        content = lines.join('\n');
        changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    fixCount++;
    console.log(`Fixed use client in ${file}`);
  }
}

console.log(`Fixed ${fixCount} files for use client.`);

// Fix AuditSidebar.tsx specifically
try {
  let as = fs.readFileSync('components/audit/AuditSidebar.tsx', 'utf8');
  // I need to ensure it has `return (` before `<aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">`
  if (!as.includes('return (\n        <aside')) {
      as = as.replace('<aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">', 'return (\n        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">');
      fs.writeFileSync('components/audit/AuditSidebar.tsx', as, 'utf8');
      console.log('Fixed AuditSidebar.tsx return statement.');
  }
} catch (e) {
  console.log('Error fixing AuditSidebar.tsx:', e);
}

