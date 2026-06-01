
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const roleAdmin = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const roleManager = await prisma.role.findUnique({ where: { code: 'AUDIT_MANAGER' } });
  const roleInspector = await prisma.role.findUnique({ where: { code: 'AUDIT_INSPECTOR' } });

  if (!roleAdmin || !roleManager || !roleInspector) {
    console.error('Roles not found. Available roles:', await prisma.role.findMany({ select: { code: true } }));
    throw new Error('Required roles missing in database.');
  }

  const usersToFix = [
    { username: 'admin', roleId: roleAdmin.id, title: 'Sistem Yöneticisi', displayName: 'Sistem Yöneticisi' },
    { username: 'mudur', roleId: roleManager.id, title: 'Teftiş Kurulu Müdürü', displayName: 'Teftiş Kurulu Müdürü' },
    { username: 'selim.kaya', roleId: roleInspector.id, title: 'Müfettiş', displayName: 'Selim Kaya' },
    { username: 'yasin.koktas', roleId: roleInspector.id, title: 'Müfettiş', displayName: 'Yasin Köktaş' }
  ];

  for (const u of usersToFix) {
    console.log(`Processing: ${u.username}...`);
    
    let user = await prisma.user.findUnique({ where: { username: u.username } });
    
    if (user) {
      // Update existing
      await prisma.user.update({
        where: { id: user.id },
        data: {
          title: u.title,
          displayName: u.displayName,
          isActive: true,
          isDeleted: false
        }
      });
      // Update role
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({ data: { userId: user.id, roleId: u.roleId } });
      console.log(`Updated: ${u.username}`);
    } else {
      // Create new
      const newUser = await prisma.user.create({
        data: {
          username: u.username,
          displayName: u.displayName,
          title: u.title,
          passwordHash,
          department: 'Teftiş Kurulu',
          isActive: true
        }
      });
      await prisma.userRole.create({ data: { userId: newUser.id, roleId: u.roleId } });
      console.log(`Created: ${u.username}`);
    }
  }

  console.log('All user fixes completed successfully.');
}

main()
  .catch((e) => {
    console.error('Critical Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
