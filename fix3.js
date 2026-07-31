const fs = require('fs');

let uni = fs.readFileSync('frontend/app/audit/universe/[unitId]/page.tsx', 'utf8');
uni = uni.replace(/^import FormTextarea from '@\/components\/ui\/FormTextarea';\n'use client';\n/, "'use client';\nimport FormTextarea from '@/components/ui/FormTextarea';\n");
fs.writeFileSync('frontend/app/audit/universe/[unitId]/page.tsx', uni, 'utf8');

const { execSync } = require('child_process');
const originalOrg = execSync('git show HEAD:frontend/app/settings/organization/page.tsx', { encoding: 'utf8' });
fs.writeFileSync('frontend/app/settings/organization/page.tsx', originalOrg, 'utf8');
