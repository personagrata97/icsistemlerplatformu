import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const batch = await prisma.trainingBatch.create({
            data: {
                name: 'Test2',
                provider: 'Test2',
                startDate: new Date(),
                endDate: new Date()
            }
        });
        const users = await prisma.user.findMany({ take: 1 });
        const user = users[0];
        if (!user) return console.log('no user');

        const training = await prisma.userTraining.create({
            data: {
                userId: user.id,
                batchId: batch.id,
                name: batch.name,
                provider: batch.provider,
                startDate: new Date(),
                endDate: new Date(),
                status: 'Planlandı'
            }
        });
        console.log(training);
    } catch(e) {
        console.error(e);
    }
}
main();
