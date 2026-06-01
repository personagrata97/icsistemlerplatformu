import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking RiskKpi...');
    const kpis = await prisma.riskKpi.findMany();
    console.log('KPIs:', kpis.map(k => k.kpi_kodu));

    console.log('Checking GunlukRiskOzet for BAZ - IPTAL_ORANI...');
    const ozet = await prisma.gunlukRiskOzet.findMany({
        where: {
            senaryo_kodu: 'BAZ',
            kpi_kodu: 'IPTAL_ORANI'
        },
        orderBy: { tarih: 'desc' },
        take: 5
    });
    console.log('Total Count:', ozet.length);
    ozet.forEach(o => {
        console.log(`[${o.tarih.toISOString()}] ${o.senaryo_kodu} - ${o.kpi_kodu}: ${o.deger}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
