const fs = require('fs');

const content = fs.readFileSync('frontend/app/audit/fast-track/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (/bg-(slate|gray)-(900|950)|bg-black/.test(line)) {
        console.log(`Line ${idx + 1}:`, line.trim());
    }
});
