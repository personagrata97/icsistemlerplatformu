const cp = require('child_process');
const fs = require('fs');

const filesToRestore = [
    'components/audit/AuditSidebar.tsx',
    'components/audit/QualityMetrics.tsx',
    'app/audit/fast-track/page.tsx',
    'app/audit/follow-up/page.tsx',
    'app/audit/unit/findings/page.tsx'
];

for (const file of filesToRestore) {
    try {
        console.log(`Restoring ${file}...`);
        const content = cp.execSync(`git show HEAD:frontend/${file}`, { encoding: 'utf8' });
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Restored ${file}`);
    } catch (e) {
        console.error(`Failed to restore ${file}:`, e.message);
    }
}
