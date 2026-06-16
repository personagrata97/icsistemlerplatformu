const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Adding remaining audit types and updating previous ones...');

    // Update İzleme to Takip Denetimi
    await prisma.audit.updateMany({
        where: { type: 'İzleme' },
        data: { type: 'Takip Denetimi' }
    });

    // 5. Süreç Denetimi
    await prisma.audit.create({
        data: {
            title: 'Kredi Tahsis ve Kullandırım Süreç Denetimi',
            type: 'Süreç Denetimi',
            status: 'Devam Ediyor',
            progress: 45,
            startDate: '2026-05-10T00:00:00Z',
            team: JSON.stringify([
                { id: 'mock-1', name: 'Selim Kaya', role: 'Müfettiş' },
                { id: 'mock-3', name: 'Ayşe Yılmaz', role: 'Müfettiş Yardımcısı' }
            ]),
            supervisor: 'Başmüfettiş X',
            auditCode: 'SÜR.01.2026',
            department: 'Kredi Tahsis Müdürlüğü',
            objective: 'Kredi tahsis süreçlerinin BDDK regülasyonlarına ve kurum politikalarına uygunluğunun denetlenmesi.'
        }
    });

    // 6. Birim Denetimi
    await prisma.audit.create({
        data: {
            title: 'İnsan Kaynakları Birim Denetimi',
            type: 'Birim Denetimi',
            status: 'Planlandı',
            progress: 0,
            startDate: '2026-07-01T00:00:00Z',
            team: JSON.stringify([{ id: 'mock-2', name: 'Sema Yöner', role: 'Müfettiş' }]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'BİR.02.2026',
            department: 'İnsan Kaynakları Müdürlüğü',
            objective: 'İşe alım, performans değerlendirme ve özlük hakları süreçlerinin birim bazında denetlenmesi.'
        }
    });

    // 7. Danışmanlık Denetimi
    await prisma.audit.create({
        data: {
            title: 'Yeni Dijital Bankacılık Uygulaması Danışmanlık Faaliyeti',
            type: 'Danışmanlık Denetimi',
            status: 'Raporlandı',
            progress: 100,
            startDate: '2026-03-15T00:00:00Z',
            endDate: '2026-04-20T00:00:00Z',
            team: JSON.stringify([{ id: 'mock-1', name: 'Selim Kaya', role: 'Müfettiş' }]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'DAN.01.2026',
            department: 'Dijital Bankacılık Müdürlüğü',
            objective: 'Yeni devreye alınacak mobil uygulamanın güvenlik ve kontrol mimarisine danışmanlık verilmesi.'
        }
    });

    console.log('Eksik denetim türleri eklendi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
