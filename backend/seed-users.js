const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    
    // Create Role if not exists
    const rolesToCreate = ['AUDIT_INSPECTOR', 'AUDIT_SUPERVISOR', 'STANDARD_EMPLOYEE'];
    for (const r of rolesToCreate) {
       await prisma.role.upsert({
         where: { code: r },
         update: {},
         create: { code: r, name: r, description: r }
       });
    }

    // Role IDs
    const inspectorRole = await prisma.role.findUnique({ where: { code: 'AUDIT_INSPECTOR' } });
    const supervisorRole = await prisma.role.findUnique({ where: { code: 'AUDIT_SUPERVISOR' } });

    // Müfettiş
    await prisma.user.upsert({
      where: { username: 'mufettis' },
      update: { passwordHash },
      create: {
        username: 'mufettis',
        passwordHash,
        displayName: 'Ayla Yılmaz (Müfettiş)',
        email: 'mufettis@banka.com.tr',
        department: 'Teftiş Kurulu',
        isActive: true,
        isAdUser: false
      }
    });

    const mUser = await prisma.user.findUnique({ where: { username: 'mufettis' }});
    await prisma.userRole.deleteMany({ where: { userId: mUser.id }});
    await prisma.userRole.create({ data: { userId: mUser.id, roleId: inspectorRole.id }});

    // Gözetmen
    await prisma.user.upsert({
      where: { username: 'gozetmen' },
      update: { passwordHash },
      create: {
        username: 'gozetmen',
        passwordHash,
        displayName: 'Burak Kaya (Gözetim Sorumlusu)',
        email: 'gozetmen@banka.com.tr',
        department: 'Teftiş Kurulu Merkezi',
        isActive: true,
        isAdUser: false
      }
    });

    const gUser = await prisma.user.findUnique({ where: { username: 'gozetmen' }});
    await prisma.userRole.deleteMany({ where: { userId: gUser.id }});
    await prisma.userRole.create({ data: { userId: gUser.id, roleId: supervisorRole.id }});

    console.log('Seed successful');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
