const fs = require('fs');

const content = fs.readFileSync('frontend/app/audit/fast-track/page.tsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('input')) {
        console.log(`Line ${idx + 1}:`, line.trim());
    }
});
