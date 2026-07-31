const { execSync } = require('child_process');
const fs = require('fs');
const content = execSync('git show HEAD:frontend/app/settings/organization/page.tsx', { encoding: 'utf8' });
fs.writeFileSync('frontend/app/settings/organization/page.tsx', content, 'utf8');
