const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/app/audit');

const replaceRoles = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceRoles(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            const replacements = [
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_MANAGER'\)/g,
                    replace: "checkRole(hasRole, ROLES.DASHBOARD_MANAGER)"
                },
                {
                    regex: /hasRole\('AUDIT_UNIT'\)\s*\|\|\s*hasRole\('AUDIT_VIEWER'\)/g,
                    replace: "checkRole(hasRole, ROLES.UNIT)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)\s*\|\|\s*hasRole\('Admin'\)\s*\|\|\s*hasRole\('Yönetici'\)/g,
                    replace: "checkRole(hasRole, ROLES.UNIVERSE_MANAGER)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('MANAGER'\)\s*\|\|\s*hasRole\('AUDIT_MANAGER'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)\s*\|\|\s*hasRole\('Teftiş Kurulu Müdürü'\)\s*\|\|\s*hasRole\('AUDIT_SUPERVISOR'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)\s*\|\|\s*hasRole\('Yönetici'\)/g,
                    replace: "checkRole(hasRole, ROLES.AUDIT_SUPERVISOR)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)\s*\|\|\s*hasRole\('Teftiş Kurulu Müdürü'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)/g,
                    replace: "checkRole(hasRole, ROLES.STAFF_STATUS_MANAGER)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_SUPERVISOR'\)\s*\|\|\s*hasRole\('AUDIT_MANAGER'\)/g,
                    replace: "checkRole(hasRole, ROLES.EXECUTIVE)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_MANAGER'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)/g,
                    replace: "checkRole(hasRole, ROLES.LOGS_ADMIN)"
                },
                {
                    regex: /hasRole\('AUDIT_ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_SUPERVISOR'\)\s*\|\|\s*hasRole\('AUDIT_MANAGER'\)/g,
                    replace: "checkRole(hasRole, ROLES.FINDING_SUPERVISOR)"
                },
                {
                    regex: /hasRole\('AUDIT_MANAGER'\)\s*\|\|\s*hasRole\('ADMIN'\)/g,
                    replace: "checkRole(hasRole, ROLES.FINDING_MANAGER)"
                },
                {
                    regex: /hasRole\('MANAGER'\)\s*\|\|\s*hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)/g,
                    replace: "checkRole(hasRole, ROLES.AUDIT_DELETE)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('SYSTEM_ADMIN'\)/g,
                    replace: "checkRole(hasRole, ROLES.ADMIN)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('AUDIT_ADMIN'\)/g,
                    replace: "checkRole(hasRole, ROLES.TRASH_MANAGER)"
                },
                {
                    regex: /hasRole\('ADMIN'\)\s*\|\|\s*hasRole\('MANAGER'\)/g,
                    replace: "checkRole(hasRole, ROLES.BASIC_MANAGER)"
                }
            ];

            replacements.forEach(({regex, replace}) => {
                content = content.replace(regex, replace);
            });

            if (content !== originalContent) {
                // Check if import is missing
                if (content.includes('checkRole(hasRole') && !content.includes('checkRole, ROLES')) {
                    if (content.includes("import { useAuth } from '@/context/AuthContext';")) {
                        content = content.replace(
                            "import { useAuth } from '@/context/AuthContext';", 
                            "import { useAuth } from '@/context/AuthContext';\nimport { checkRole, ROLES } from '@/lib/auth-constants';"
                        );
                    } else if (content.includes("import React")) {
                        content = content.replace(
                            /(import React.*?;\n)/, 
                            "$1import { checkRole, ROLES } from '@/lib/auth-constants';\n"
                        );
                    } else {
                        content = "import { checkRole, ROLES } from '@/lib/auth-constants';\n" + content;
                    }
                }
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated ' + file);
            }
        }
    });
};

replaceRoles(directoryPath);
