const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unmask() {
  try {
    const affected = await prisma.user.updateMany({
      where: { displayName: { contains: 'Selim' } },
      data: {
        email: 'selim.kaya@emlakkatilim.com.tr'
      }
    });
    console.log(`Unmasked ${affected.count} users in User table.`);

    // If there is an AuditStaff or Staff table, fix it too. Let's see what tables exist in schema.
    if (prisma.staff) {
       const staffAff = await prisma.staff.updateMany({
         where: { name: { contains: 'Selim' } },
         data: { email: 'selim.kaya@emlakkatilim.com.tr', phone: '05351234567'}
       });
       console.log(`Unmasked ${staffAff.count} users in Staff table.`);
    }

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
unmask();
