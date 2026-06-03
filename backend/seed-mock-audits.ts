const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding mock audits with institutional language...');

    // 1. Soruşturma Raporu
    const sorusturma = await prisma.audit.create({
        data: {
            title: 'Eskişehir Şubesi - İmza Mutabakatsızlığı Şikayetinin İncelenmesi',
            type: 'Soruşturma',
            status: 'Raporlandı',
            progress: 100,
            startDate: '2026-01-12T00:00:00Z',
            endDate: '2026-01-20T00:00:00Z',
            team: JSON.stringify([{ id: 'mock-1', name: 'Selim Kaya', role: 'Soruşturmacı Müfettiş' }]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'İS.2.2026',
            department: 'Eskişehir Şubesi',
            fraudType: 'Operasyonel Hata',
            financialImpact: 0,
            currency: 'TRY',
            disciplinaryAction: 'İş Akdi Fesih',
            involvedParties: JSON.stringify([
                { name: 'Ahmet Veli', title: 'Şube Çalışanı', role: 'İncelenen' },
                { name: 'Müşteri (321 No.lu)', title: 'Müşteri', role: 'İhbarcı' }
            ])
        }
    });

    // 2. İnceleme Raporu
    const inceleme = await prisma.audit.create({
        data: {
            title: 'CRM Uygulaması Yetki ve Onay Mekanizmasının İncelenmesi',
            type: 'İnceleme',
            status: 'Raporlandı',
            progress: 100,
            startDate: '2026-02-05T00:00:00Z',
            endDate: '2026-02-15T00:00:00Z',
            team: JSON.stringify([{ id: 'mock-2', name: 'Sema Yöner', role: 'İncelemeci Müfettiş' }]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'İS.1.2026',
            department: 'Bilgi Teknolojileri Müdürlüğü',
            objective: 'CRM uygulamamız üzerindeki yetki ve onay mekanizmasının sağlıklı işleyip işlemediğinin değerlendirilmesi.',
            scope: 'CRM uygulaması yetki matrisi, aktif 50 kullanıcı, log ve telefon numarası değişiklik işlemleri.'
        }
    });

    // 3. Şube Denetimi
    const sube = await prisma.audit.create({
        data: {
            title: 'Aydın Şubesi 2024 Yılı Olağan Denetimi',
            type: 'Şube Denetimi',
            status: 'Raporlandı',
            progress: 100,
            startDate: '2024-06-24T00:00:00Z',
            endDate: '2024-06-28T00:00:00Z',
            team: JSON.stringify([
                { id: 'mock-1', name: 'Selim Kaya', role: 'Müfettiş' },
                { id: 'mock-2', name: 'Sema Yöner', role: 'Müfettiş' }
            ]),
            supervisor: 'Başmüfettiş X',
            auditCode: 'ŞT.03.2024',
            department: 'Aydın Şubesi'
        }
    });

    // 4. İzleme (Follow-up) - This goes into Findings and AuditFollowUps actually, but we can create an Audit for it if they track it as an Audit.
    // In their system, 'İzleme' could be a specific audit type or just follow-up tasks. Let's create an Audit of type 'İzleme'.
    const izleme = await prisma.audit.create({
        data: {
            title: 'Aydın Şubesi Bulguları - İzleme Faaliyeti',
            type: 'İzleme',
            status: 'Raporlandı',
            progress: 100,
            startDate: '2024-09-09T00:00:00Z',
            endDate: '2024-09-16T00:00:00Z',
            team: JSON.stringify([{ id: 'mock-1', name: 'Selim Kaya', role: 'Müfettiş' }]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'İR.03.2024',
            department: 'Aydın Şubesi',
            objective: 'ŞT.03.2024 nolu rapor bulgularının eksikliklerinin tamamlanma durumlarının takibi.'
        }
    });

    // Let's create some Findings (Bulgular) for the Aydın Şubesi Audit so they can be followed up
    const finding1 = await prisma.finding.create({
        data: {
            auditId: sube.id,
            title: 'Sözleşme İmzalarında Eksiklik',
            description: '5 adet sözleşmede müşteri imzalarının eksik olduğu görülmüştür.',
            risk: 'Orta',
            category: 'Sözleşme',
            department: 'Aydın Şubesi',
            status: 'Takip Ediliyor',
            code: 'BUL-001'
        }
    });

    const finding2 = await prisma.finding.create({
        data: {
            auditId: sube.id,
            title: 'Kasa Nakit Fazlası',
            description: 'Gişe işlemlerinde kasa sayım fazlası tespit edilmiştir.',
            risk: 'Yüksek',
            category: 'Operasyonel',
            department: 'Aydın Şubesi',
            status: 'Çözüldü',
            code: 'BUL-002'
        }
    });

    console.log('Mock veriler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
