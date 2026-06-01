
const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'backend', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true, title: true, isDeleted: true },
    where: { isDeleted: false }
  });
  console.log("---USER_LIST_START---");
  users.forEach(u => {
    console.log(`${u.id}|${u.username}|${u.displayName}|${u.title}`);
  });
  console.log("---USER_LIST_END---");
}

main().catch(console.error).finally(() => prisma.$disconnect());
