
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

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

  let result = '';
  if (users.length === 0) {
    result = 'No matching users found.';
  } else {
    users.forEach(u => {
      result += `User: ${u.username}, Roles: ${u.roles.map(r => r.role.code).join(', ')}\n`;
    });
  }
  fs.writeFileSync('user_check_result.txt', result);
  console.log('Results written to user_check_result.txt');
}

main()
  .catch((e) => {
    fs.writeFileSync('user_check_result.txt', 'Error: ' + e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
