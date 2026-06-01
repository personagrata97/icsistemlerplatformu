const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNames() {
  try {
    await prisma.user.update({
      where: { username: 'mufettis' },
      data: { displayName: 'Selim Kaya (Müfettiş)' }
    });

    await prisma.user.update({
      where: { username: 'gozetmen' },
      data: { displayName: 'Yasin Köktaş (Gözetmen)' }
    });
    console.log("Names fixed");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
fixNames();
