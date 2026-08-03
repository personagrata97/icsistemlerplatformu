const fs = require('fs');

const content = fs.readFileSync('frontend/app/audit/fast-track/page.tsx', 'utf8');

const darks = content.match(/bg-slate-900[^\s"']*|bg-gray-900[^\s"']*|bg-black[^\s"']*/g) || [];
console.log('Dark BGs found:', darks);

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('<input')) {
        console.log(`Raw input at line ${idx + 1}:`, line.trim());
    }
});

const sidebar = fs.readFileSync('frontend/components/audit/AuditSidebar.tsx', 'utf8');
const pageTitles = sidebar.match(/PAGE_TITLES/g) || [];
console.log('PAGE_TITLES in AuditSidebar:', pageTitles.length);
