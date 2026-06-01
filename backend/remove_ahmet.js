const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    await prisma.audit.deleteMany({
        where: { supervisor: 'Ahmet Yýlmaz' }
    });
    console.log('Ahmet Yýlmaz atamalý eski test denetimleri silindi.');
}
run();
