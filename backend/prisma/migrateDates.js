const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const findings = await prisma.finding.findMany();
  let updated = 0;
  for (const f of findings) {
    if (f.dueDate && typeof f.dueDate === 'string') {
      let d = new Date(f.dueDate);
      if(isNaN(d.getTime())) d = new Date();
      // Y-m-d H:i:s format required by SQLite DateTime, but Prisma handles Date objects natively via raw params.
      await prisma.$executeRawUnsafe(`UPDATE Finding SET dueDate = '${d.toISOString()}' WHERE id = '${f.id}'`);
      updated++;
    }
  }
  console.log(`Fixed ${updated} findings`);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
