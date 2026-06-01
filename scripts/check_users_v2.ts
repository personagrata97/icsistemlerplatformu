
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      username: { in: ['admin', 'mudur', 'selim.kaya', 'yasin.koktas'] }
    },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (users.length === 0) {
    console.log('No matching users found.');
  } else {
    users.forEach(u => {
      console.log(`User: ${u.username}, Roles: ${u.roles.map(r => r.role.code).join(', ')}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
