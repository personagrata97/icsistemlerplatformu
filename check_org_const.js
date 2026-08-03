const fs = require('fs');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const path = dir + '/' + file;
        const stat = fs.statSync(path);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(path));
        } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
            results.push(path);
        }
    });
    return results;
}

const files = getFiles('frontend');
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('organization-constants')) {
        console.log('FOUND:', f);
    }
});
