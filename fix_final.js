const { execSync } = require('child_process');
const fs = require('fs');
const content = execSync('git show HEAD:frontend/app/audit/universe/[unitId]/page.tsx', { encoding: 'utf8' });
// FIX duplicate PageHeader
const fixedContent = content.replace(/import PageHeader from '@\/components\/ui\/PageHeader';\nimport FormTextarea from/, 'import FormTextarea from');
fs.writeFileSync('frontend/app/audit/universe/[unitId]/page.tsx', fixedContent, 'utf8');

const edd = fs.readFileSync('frontend/app/sanction/edd/page.tsx', 'utf8');
const fixedEdd = edd.replace(/import PageHeader from '@\/components\/ui\/PageHeader';\nimport RequireRole from/, 'import RequireRole from');
fs.writeFileSync('frontend/app/sanction/edd/page.tsx', fixedEdd, 'utf8');
