const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const audits = await prisma.audit.findMany({
        where: { isDeleted: false },
        select: { title: true, supervisor: true, supervisorUser: { select: { displayName: true } } }
    });
    console.log(JSON.stringify(audits, null, 2));
}
run();
