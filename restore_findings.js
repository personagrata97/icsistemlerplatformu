const { execSync } = require('child_process');
const fs = require('fs');

const commits = ['b6aaece', '56102c1', '85359df', '00c9c9a', '09a1faf'];

for (const commit of commits) {
    try {
        const content = execSync(`git show ${commit}:frontend/app/audit/findings/[id]/page.tsx`).toString();
        fs.writeFileSync('frontend/app/audit/findings/[id]/page.tsx', content);
        console.log(`Trying commit ${commit}...`);
        try {
            execSync('npx tsc --noEmit', { cwd: 'frontend', stdio: 'pipe' });
            console.log(`SUCCESS! Commit ${commit} passes tsc!`);
            break;
        } catch (e) {
            console.log(`Commit ${commit} failed tsc`);
        }
    } catch (err) {
        console.log(`Could not get file from ${commit}`);
    }
}
