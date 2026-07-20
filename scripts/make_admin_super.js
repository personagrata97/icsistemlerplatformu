const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'backend', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  if (!adminUser) {
    console.log("Admin user not found.");
    return;
  }
  
  // Find or create the ADMIN role
  let adminRole = await prisma.role.findUnique({
    where: { code: 'ADMIN' }
  });
  
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        code: 'ADMIN',
        name: 'Sistem Yöneticisi',
        description: 'Tüm yetkilere sahip en üst düzey yönetici role'
      }
    });
  }
  
  // Update admin's role
  await prisma.userRole.deleteMany({ where: { userId: adminUser.id } });
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });
  console.log("Admin user successfully promoted to super administrator (ADMIN role).");
}

main().catch(console.error).finally(() => prisma.$disconnect());
