import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Sözleşmelerin %10 unu iptal durumuna getiriyorum...');

    const contracts = await prisma.sozlesme.findMany({
        take: 20, // İlk 20 taneden
        where: { durum: 'AKTIF' }
    });

    for (const contract of contracts.slice(0, 5)) { // 5 tanesini iptal et
        await prisma.sozlesme.update({
            where: { sozlesme_id: contract.sozlesme_id },
            data: {
                durum: 'IPTAL',
                iptal_durumu: true,
                iptal_tarihi: new Date(),
                iptal_nedeni: 'Müşteri vazgeçti (Simülasyon)'
            }
        });
        console.log(`Sözleşme ${contract.sozlesme_id} iptal edildi.`);
    }

    console.log('Tamamlandı.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
