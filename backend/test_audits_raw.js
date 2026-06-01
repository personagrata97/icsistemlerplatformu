const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const audits = await prisma.audit.findMany({
        where: { isDeleted: false }
    });
    console.log(JSON.stringify(audits.map(a => ({t: a.title, s: a.supervisor})), null, 2));
}
run();
