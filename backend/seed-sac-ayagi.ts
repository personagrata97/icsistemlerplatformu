const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Sac ayağı tam bir kapsamlı denetim raporu oluşturuluyor...');

    // Get any existing process to link risk control
    let unit = await prisma.auditableUnit.findFirst();
    if (!unit) {
        unit = await prisma.auditableUnit.create({
            data: {
                name: 'Gaziantep Şubesi',
                type: 'Şube',
                riskScore: 8,
                lastAuditDate: new Date(),
                auditFrequency: 12
            }
        });
    }

    let process = await prisma.process.findFirst();
    if (!process) {
        process = await prisma.process.create({
            data: {
                name: 'Şube Gişe Operasyonları',
                unitId: unit.id,
                riskScore: 8,
                status: 'Aktif'
            }
        });
    }

    let risk = await prisma.risk.findFirst({ where: { processId: process.id } });
    if (!risk) {
        risk = await prisma.risk.create({
            data: {
                processId: process.id,
                name: 'Nakit Noksanı veya Suistimal',
                category: 'Operasyonel',
                level: 'Yüksek'
            }
        });
    }

    const control1 = await prisma.control.create({
        data: {
            riskId: risk.id,
            name: 'Sürpriz Kasa Sayımı',
            type: 'Önleyici',
            frequency: 'Günlük',
            method: 'Manuel'
        }
    });

    const control2 = await prisma.control.create({
        data: {
            riskId: risk.id,
            name: 'Kredi Dosyası Ekspertiz Kontrolü',
            type: 'Tespit Edici',
            frequency: 'İşlem Bazlı',
            method: 'Sistem'
        }
    });


    // 1. Create a flagship Audit
    const audit = await prisma.audit.create({
        data: {
            title: 'Gaziantep Şubesi Kapsamlı Operasyonel Denetimi',
            type: 'Şube Denetimi',
            status: 'Devam Ediyor',
            progress: 80,
            startDate: '2026-06-01T00:00:00Z',
            endDate: '2026-06-15T00:00:00Z',
            team: JSON.stringify([
                { id: 'mock-1', name: 'Selim Kaya', role: 'Başmüfettiş' },
                { id: 'mock-2', name: 'Sema Yöner', role: 'Müfettiş' }
            ]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'ŞT.04.2026',
            department: 'Gaziantep Şubesi',
            objective: 'Gaziantep Şubesi gişe, operasyon, kredi ve fiziksel güvenlik süreçlerinin tam kapsamlı yerinde denetimi.',
            scope: '01.01.2026 - 31.05.2026 tarihleri arasındaki tüm ticari ve bireysel işlemler ile şube kasası.',
            methodology: 'Örneklem usulü belge incelemesi, personel mülakatları ve sürpriz kasa sayımı.'
        }
    });

    // 2. Create Audit Tests (Test Adımları)
    await prisma.auditTest.createMany({
        data: [
            {
                auditId: audit.id,
                controlId: control1.id,
                title: 'Gişe Nakit Kasa Sayımı',
                procedure: 'Şube açılış saatinde sürpriz kasa sayımı yapılması ve sistem bakiyesi ile fiziki bakiyenin eşleştirilmesi.',
                sampleSize: 1,
                designEffectiveness: 'Etkin',
                operatingEffectiveness: 'Etkin Değil',
                testResult: 'Fiziki sayımda 12.500 TL kasa noksanı tespit edilmiştir.',
                testedBy: 'Selim Kaya',
                testDate: new Date('2026-06-02T08:45:00Z'),
                evidence: 'Kasa_Sayim_Tutanagi.pdf'
            },
            {
                auditId: audit.id,
                controlId: control2.id,
                title: 'Ticari Kredi Dosyaları Ekspertiz Kontrolü',
                procedure: 'Kullandırılan ticari kredilerde ipotek alınan gayrimenkullerin ekspertiz raporu tarihlerinin kredi onayından önce olup olmadığının kontrolü.',
                sampleSize: 15,
                designEffectiveness: 'Etkin',
                operatingEffectiveness: 'Etkin',
                testResult: 'İncelenen 15 dosyanın tamamında ekspertiz raporları kredi tahsis tarihinden önce alınmış olup mevzuata uygundur.',
                testedBy: 'Sema Yöner',
                testDate: new Date('2026-06-04T14:30:00Z'),
                evidence: 'Kredi_Orneklem_Tablosu.xlsx'
            }
        ]
    });

    // 3. Create Audit Workpapers (Çalışma Kağıtları)
    await prisma.auditWorkpaper.createMany({
        data: [
            {
                auditId: audit.id,
                title: '01-Acilis_Toplantisi_Tutanagi',
                fileUrl: 'workpapers/01-Acilis_Toplantisi_Tutanagi.pdf',
                fileType: 'application/pdf',
                category: 'Toplantı Tutanakları',
                status: 'Onaylandı',
                preparerId: 'Selim Kaya'
            },
            {
                auditId: audit.id,
                title: '02-Kasa_Sayim_Foyu',
                fileUrl: 'workpapers/02-Kasa_Sayim_Foyu.xlsx',
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                category: 'Saha Çalışması',
                status: 'Taslak',
                preparerId: 'Selim Kaya'
            },
            {
                auditId: audit.id,
                title: '03-Kredi_Tahsis_Orneklem',
                fileUrl: 'workpapers/03-Kredi_Tahsis_Orneklem.xlsx',
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                category: 'Analiz ve Örneklem',
                status: 'Onaylandı',
                preparerId: 'Sema Yöner'
            }
        ]
    });

    // 4. Create Findings (Bulgular) and Follow-ups
    const finding1 = await prisma.finding.create({
        data: {
            auditId: audit.id,
            title: 'Kasa Noksanı ve Mutabakatsızlık',
            description: '02.06.2026 tarihinde yapılan sürpriz kasa sayımında, 1 No.lu gişe görevlisinin kasasında 12.500 TL noksan olduğu, gün sonu devirlerinin iki gündür manuel müdahale ile tutturulduğu tespit edilmiştir.',
            risk: 'Yüksek',
            category: 'Operasyonel',
            department: 'Gaziantep Şubesi',
            status: 'Takip Ediliyor',
            code: 'BUL-GAZ-01',
            financialImpact: 12500,
            rootCause: 'Gişe görevlisinin EFT işlemlerinde mükerrer işlem yapması ve şube yetkilisi kontrolünün zafiyeti.',
            recommendation: 'Noksan tutarın ilgili personelden tahsili ve gün sonu mutabakatlarında Şube Müdür Yardımcısı ikili onayının zorunlu hale getirilmesi.',
            actionPlan: 'Tutar 05.06.2026 tarihinde tahsil edilmiş olup, sistemsel maker-checker kuralı tanımlanmıştır.',
            isAgreed: true,
            evidence: 'Kasa_Sayim_Tutanagi.pdf,EFT_Loglari.pdf',
            departmentResponse: 'Bulguya iştirak edilmekte olup, ilgili tutar rızaen tahsil edilmiş ve onay süreçleri sıkılaştırılmıştır.'
        }
    });

    await prisma.auditFollowUp.create({
        data: {
            findingId: finding1.id,
            action: 'Noksan tutarın tahsilat dekontunun Teftiş Kuruluna iletilmesi',
            deadline: new Date('2026-06-10T00:00:00Z').toISOString(),
            assignee: 'Şube Müdürü',
            priority: 'Yüksek',
            status: 'Kapalı',
            completionDate: new Date('2026-06-05T00:00:00Z').toISOString()
        }
    });

    await prisma.finding.create({
        data: {
            auditId: audit.id,
            title: 'Fiziki Güvenlik Zafiyeti - Yangın Tüpleri',
            description: 'Şube arşiv odasında bulunan yangın söndürme tüplerinin son kullanma tarihlerinin 6 ay geçmiş olduğu görülmüştür.',
            risk: 'Orta',
            category: 'İSG ve Güvenlik',
            department: 'Gaziantep Şubesi',
            status: 'Açık',
            code: 'BUL-GAZ-02',
            rootCause: 'İdari işler sorumlusunun periyodik bakım takvimine uymaması.',
            recommendation: 'Tüm şube envanterindeki tüplerin ivedilikle yenilenmesi.',
            isAgreed: true,
            evidence: 'Foto_ArsivOda.jpg'
        }
    });

    console.log('Sac ayagi denetim basariyla olusturuldu!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
