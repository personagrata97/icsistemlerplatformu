const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.auditLog.findMany({ take: 5 });
    console.log('--- DIRECT PRISMA DB DATA ---');
    console.log(JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Prisma Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
