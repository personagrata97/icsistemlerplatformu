const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    
    await prisma.user.updateMany({
      where: { username: 'admin' },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null }
    });

    console.log('Admin password updated successfully');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
seed();
