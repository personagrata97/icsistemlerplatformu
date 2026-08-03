const fs = require('fs');

let file = fs.readFileSync('frontend/app/audit/fast-track/page.tsx', 'utf8');

// Replace dark container backgrounds
file = file.replace(/from-slate-950 via-slate-900 to-slate-950/g, 'from-slate-50 via-white to-slate-50');
file = file.replace(/bg-slate-950 flex/g, 'bg-slate-50 flex');
file = file.replace(/bg-slate-900\/80 backdrop-blur-xl border border-slate-800/g, 'bg-white border border-slate-200');
file = file.replace(/bg-slate-900 border border-red-500\/30/g, 'bg-white border border-red-200');
file = file.replace(/bg-slate-950 p-4 rounded-xl border border-slate-800/g, 'bg-slate-50 p-4 rounded-xl border border-slate-200');
file = file.replace(/bg-slate-950 border border-slate-800/g, 'bg-slate-50 border border-slate-200');
file = file.replace(/bg-slate-950 p-4 rounded-2xl border border-slate-800\/80/g, 'bg-slate-50 p-4 rounded-2xl border border-slate-200');
file = file.replace(/bg-slate-950 p-5 rounded-2xl border border-slate-800\/80/g, 'bg-slate-50 p-5 rounded-2xl border border-slate-200');
file = file.replace(/bg-slate-950 p-4 rounded-2xl border border-slate-800/g, 'bg-slate-50 p-4 rounded-2xl border border-slate-200');
file = file.replace(/bg-slate-950/g, 'bg-slate-50');
file = file.replace(/bg-slate-900/g, 'bg-white');
file = file.replace(/bg-gray-900/g, 'bg-white');
file = file.replace(/bg-black/g, 'bg-white');
file = file.replace(/border-slate-800/g, 'border-slate-200');
file = file.replace(/border-slate-900/g, 'border-slate-200');

// Replace dark text colors for light theme contrast
file = file.replace(/text-slate-100/g, 'text-slate-900');
file = file.replace(/text-slate-200/g, 'text-slate-800');
file = file.replace(/text-white/g, 'text-slate-900');

fs.writeFileSync('frontend/app/audit/fast-track/page.tsx', file, 'utf8');
console.log('Fast-track page converted to light theme');
