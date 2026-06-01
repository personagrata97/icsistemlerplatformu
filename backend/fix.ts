import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPwd = await bcrypt.hash('admin123', 10);
  
  let adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'Sistem Yöneticisi', code: 'ADMIN', description: 'Tam yetkili' } });
  }

  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { username: 'admin' },
      data: { isActive: true, isDeleted: false, failedLoginAttempts: 0 }
    });
    console.log('Admin user updated.');
    
    // ensure admin has the ADMIN role
    const hasAdminRole = await prisma.userRole.findFirst({
        where: { userId: existingAdmin.id, roleId: adminRole.id }
    });
    if (!hasAdminRole) {
        await prisma.userRole.create({ data: { userId: existingAdmin.id, roleId: adminRole.id } });
    }
  } else {
    await prisma.user.create({
      data: {
         username: 'admin',
         passwordHash: adminPwd,
         displayName: 'Sistem Yöneticisi',
         email: 'admin@platform.local',
         isActive: true,
         roles: { create: { roleId: adminRole.id } }
      }
    });
    console.log('Admin user created.');
  }

  let managerRole = await prisma.role.findUnique({ where: { code: 'AUDIT_MANAGER' } });
  if (!managerRole) {
    managerRole = await prisma.role.create({ data: { name: 'Denetim Yöneticisi', code: 'AUDIT_MANAGER', description: 'Müdür' } });
  }

  const yasin = await prisma.user.findUnique({ where: { username: 'ykoktas' } });
  if (yasin) {
     await prisma.userRole.deleteMany({ where: { userId: yasin.id } });
     await prisma.userRole.create({ data: { userId: yasin.id, roleId: managerRole.id } });
     await prisma.user.update({
        where: { id: yasin.id },
        data: { title: 'Müdür' }
     });
     console.log('Yasin Koktas updated to AUDIT_MANAGER with title Müdür.');
  } else {
     // If Yasin Koktas somehow is deleted or missing, recreate
     await prisma.user.create({
        data: {
           username: 'ykoktas',
           passwordHash: await bcrypt.hash('123456', 10),
           displayName: 'Yasin Köktaş',
           email: 'ykoktas@platform.local',
           title: 'Müdür',
           isActive: true,
           roles: { create: { roleId: managerRole.id } }
        }
     });
     console.log('Yasin Koktas created as AUDIT_MANAGER with title Müdür.');
  }

  console.log('DB updates injected successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
