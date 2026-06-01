
const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'backend', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

async function main() {
    const namesFixed = ['Selim Kaya', 'Yasin Köktaş'];
    const inspectorRole = await prisma.role.findUnique({ where: { code: 'AUDIT_INSPECTOR' } });
    
    for (const name of namesFixed) {
        const matches = await prisma.user.findMany({
            where: {
                displayName: { contains: name },
                isDeleted: false
            },
            include: { roles: true }
        });

        if (matches.length > 1) {
            console.log(`Duplicate found for: ${name}`);
            // My script added users with dots: selim.kaya, yasin.koktas
            const myUser = matches.find(u => u.username.includes('.'));
            const originalUser = matches.find(u => u.username && !u.username.includes('.'));

            if (myUser && originalUser) {
                console.log(`Deleting duplicate I created: ${myUser.username} (ID: ${myUser.id})`);
                await prisma.userRole.deleteMany({ where: { userId: myUser.id } });
                await prisma.user.delete({ where: { id: myUser.id } });

                console.log(`Updating original user: ${originalUser.username} (ID: ${originalUser.id})`);
                await prisma.user.update({
                    where: { id: originalUser.id },
                    data: { title: 'Müfettiş', department: 'Teftiş Kurulu' }
                });

                // Ensure role is AUDIT_INSPECTOR
                await prisma.userRole.deleteMany({ where: { userId: originalUser.id } });
                await prisma.userRole.create({ data: { userId: originalUser.id, roleId: inspectorRole.id } });
            }
        } else {
            console.log(`No clear duplicate found for ${name} or only one entry exists.`);
            // Even if only one exists, ensure it has the right role/title
            if (matches.length === 1) {
                await prisma.user.update({
                    where: { id: matches[0].id },
                    data: { title: 'Müfettiş', department: 'Teftiş Kurulu' }
                });
                await prisma.userRole.deleteMany({ where: { userId: matches[0].id } });
                await prisma.userRole.create({ data: { userId: matches[0].id, roleId: inspectorRole.id } });
            }
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
