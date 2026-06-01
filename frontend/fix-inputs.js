const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function fixInputs(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace inputs with explicit focus:ring logic and tailwind borders
    content = content.replace(/className="w-full(?: h-full)?(?: min-h-\[[^\]]+\])? border-gray-\d+(?:\/\d+)? rounded-[a-z]+ p-\d+(?:\.\d+)?(?: text-[a-z]+)?(?: font-[a-z]+)?(?: text-gray-\d+)?(?: focus:ring-\d+ focus:ring-[a-z]+\/\d+ focus:border-[a-z]+)?(?: transition-all)?(?: resize-none)?(?: bg-[a-z]+-\d+(?:\/\d+)?)?(?: animate-[a-z]+ fade-[a-z]+ slide-[a-z]+-from-[a-z]+-\d+)?(?: shadow-[a-z]+)?"/g, (match) => {
        let newClasses = ['form-input'];
        
        if (match.includes('bg-gray-100/50')) newClasses.push('bg-gray-100/50');
        if (match.includes('bg-gray-50/50')) newClasses.push('bg-gray-50/50');
        if (match.includes('bg-gray-50/30')) newClasses.push('bg-gray-50/30');
        if (match.includes('bg-emerald-50/10')) newClasses.push('bg-emerald-50/10');
        if (match.includes('font-bold')) newClasses.push('font-bold');
        if (match.includes('text-xs')) newClasses.push('text-xs');
        if (match.includes('p-4 text-base')) newClasses.push('p-4 text-base');
        if (match.includes('min-h-[110px]')) newClasses.push('min-h-[110px]');
        if (match.includes('min-h-[120px]')) newClasses.push('min-h-[120px]');
        if (match.includes('min-h-[100px]')) newClasses.push('min-h-[100px]');
        if (match.includes('h-full')) newClasses.push('h-full');
        if (match.includes('resize-none')) newClasses.push('resize-none');
        if (match.includes('animate-in')) newClasses.push('animate-in fade-in slide-in-from-top-1');
        if (match.includes('shadow-sm')) newClasses.push('shadow-sm');

        return `className="${newClasses.join(' ')}"`;
    });

    // Also fix some specific ones like `className="form-input w-full border border-gray-300 rounded-lg p-2"`
    content = content.replace(/className="form-input w-full border border-gray-300 rounded-[a-z]+ p-\d+"/g, 'className="form-input"');
    
    // TestSteps.tsx has some specific ones
    content = content.replace(/className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"/g, 'className="form-input"');
    
    // AuditTimesheetTab.tsx
    content = content.replace(/className="w-full border border-gray-300 rounded p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"/g, 'className="form-input"');
    content = content.replace(/className="w-full border border-gray-300 rounded p-2 text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"/g, 'className="form-input text-center"');

    // Remove `focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary` etc if mixed randomly
    content = content.replace(/className="w-full border-gray-200 rounded-lg p-2\.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-gray-50\/30 focus:bg-white"/g, 'className="form-input text-xs bg-gray-50/30"');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir('./components', fixInputs);
walkDir('./app', fixInputs);
console.log('Done.');
