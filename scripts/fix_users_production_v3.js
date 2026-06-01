
const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'backend', 'node_modules', '@prisma/client'));
const bcrypt = require(path.join(process.cwd(), 'backend', 'node_modules', 'bcrypt'));

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const roleAdmin = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const roleManager = await prisma.role.findUnique({ where: { code: 'AUDIT_MANAGER' } });
  const roleInspector = await prisma.role.findUnique({ where: { code: 'AUDIT_INSPECTOR' } });

  if (!roleAdmin || !roleManager || !roleInspector) {
    console.error('Roles missing.');
    process.exit(1);
  }

  const users = [
    { username: 'admin', roleId: roleAdmin.id, title: 'Sistem Yöneticisi', displayName: 'Sistem Yöneticisi' },
    { username: 'mudur', roleId: roleManager.id, title: 'Teftiş Kurulu Müdürü', displayName: 'Teftiş Kurulu Müdürü' },
    { username: 'selim.kaya', roleId: roleInspector.id, title: 'Müfettiş', displayName: 'Selim Kaya' },
    { username: 'yasin.koktas', roleId: roleInspector.id, title: 'Müfettiş', displayName: 'Yasin Köktaş' }
  ];

  for (const u of users) {
    console.log(`Fixing ${u.username}...`);
    const dbUser = await prisma.user.upsert({
      where: { username: u.username },
      update: { title: u.title, displayName: u.displayName, isActive: true, isDeleted: false },
      create: { 
        username: u.username, 
        displayName: u.displayName, 
        title: u.title, 
        passwordHash, 
        department: 'Teftiş Kurulu', 
        isActive: true 
      }
    });

    await prisma.userRole.deleteMany({ where: { userId: dbUser.id } });
    await prisma.userRole.create({ data: { userId: dbUser.id, roleId: u.roleId } });
  }

  console.log('User fix done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
