const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    
    await prisma.role.upsert({
      where: { code: 'AUDIT_ADMIN' },
      update: {},
      create: { code: 'AUDIT_ADMIN', name: 'AUDIT_ADMIN', description: 'Teftiş Kurulu Başkanı (CAE)' }
    });

    const adminRole = await prisma.role.findUnique({ where: { code: 'AUDIT_ADMIN' } });

    await prisma.user.upsert({
      where: { username: 'mudur' },
      update: { passwordHash },
      create: {
        username: 'mudur',
        passwordHash,
        displayName: 'Kerem Yılmaz (Teftiş Kurulu Müdürü)',
        email: 'mudur@banka.com.tr',
        department: 'Teftiş Kurulu',
        isActive: true,
        isAdUser: false
      }
    });

    const uUser = await prisma.user.findUnique({ where: { username: 'mudur' }});
    await prisma.userRole.deleteMany({ where: { userId: uUser.id }});
    await prisma.userRole.create({ data: { userId: uUser.id, roleId: adminRole.id }});

    console.log('Mudur seeded successfully');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
seed();
