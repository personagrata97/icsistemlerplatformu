
const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'backend', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true, title: true, isDeleted: true },
    where: { isDeleted: false }
  });
  users.forEach(u => {
    console.log(`ID: ${u.id} | UN: ${u.username} | NAME: ${u.displayName} | TITLE: ${u.title}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
