
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

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
