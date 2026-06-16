const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const findingsRes = await prisma.finding.updateMany({
    where: { status: 'Çözüldü' },
    data: { status: 'Kapalı' }
  });
  console.log('Findings Updated:', findingsRes);

  const followUpRes = await prisma.auditFollowUp.updateMany({
    where: { status: 'Çözüldü' },
    data: { status: 'Kapalı' }
  });
  console.log('FollowUps Updated:', followUpRes);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
