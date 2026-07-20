const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'backend', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });
  users.forEach(u => {
    const rolesList = u.roles.map(ur => ur.role.code).join(', ');
    console.log(`${u.username} (${u.displayName}): Title=[${u.title}], Roles=[${rolesList}]`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
