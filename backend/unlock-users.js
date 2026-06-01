const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlockUsers() {
  try {
    const testUsers = ['mufettis', 'gozetmen', 'mudur', 'admin'];
    
    const result = await prisma.user.updateMany({
      where: { username: { in: testUsers } },
      data: { 
        isActive: true, 
        failedLoginAttempts: 0, 
        lockedUntil: null 
      }
    });

    console.log(`Unlocked and activated ${result.count} users successfully.`);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
unlockUsers();
