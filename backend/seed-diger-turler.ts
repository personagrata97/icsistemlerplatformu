const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Farklı türlerde (İnceleme/Soruşturma ve BT Denetimi) kapsamlı raporlar oluşturuluyor...');

    // Get any existing process to link risk control
    let unit = await prisma.auditableUnit.findFirst();
    if (!unit) {
        unit = await prisma.auditableUnit.create({
            data: {
                name: 'Genel Müdürlük',
                type: 'Merkez',
                riskScore: 9,
                lastAuditDate: new Date(),
                auditFrequency: 12
            }
        });
    }

    let process = await prisma.process.findFirst();
    if (!process) {
        process = await prisma.process.create({
            data: {
                name: 'Bilgi Teknolojileri İşletimi',
                unitId: unit.id,
                riskScore: 9,
                status: 'Aktif'
            }
        });
    }

    let risk = await prisma.risk.findFirst({ where: { processId: process.id } });
    if (!risk) {
        risk = await prisma.risk.create({
            data: {
                processId: process.id,
                name: 'Siber Saldırı veya Veri Sızıntısı',
                category: 'BT Güvenliği',
                level: 'Kritik'
            }
        });
    }

    const control1 = await prisma.control.create({
        data: {
            riskId: risk.id,
            name: 'Ağ Sızma Testi (Pentest)',
            type: 'Tespit Edici',
            frequency: 'Yıllık',
            method: 'Dış Hizmet'
        }
    });

    const control2 = await prisma.control.create({
        data: {
            riskId: risk.id,
            name: 'Sunucu Yama Yönetimi (Patching)',
            type: 'Önleyici',
            frequency: 'Aylık',
            method: 'Otomatik'
        }
    });


    // --- AUDIT 1: BİLGİ TEKNOLOJİLERİ DENETİMİ ---
    const auditBT = await prisma.audit.create({
        data: {
            title: 'Bilgi Sistemleri Güvenlik ve Sızma Testi Denetimi',
            type: 'Süreç Denetimi',
            status: 'Tamamlandı',
            progress: 100,
            startDate: '2025-11-01T00:00:00Z',
            endDate: '2025-12-15T00:00:00Z',
            team: JSON.stringify([
                { id: 'mock-3', name: 'Ahmet Yılmaz', role: 'Başmüfettiş' },
                { id: 'mock-4', name: 'Zeynep Ak', role: 'BT Denetçisi' }
            ]),
            supervisor: 'Selim Kaya',
            auditCode: 'BT.01.2025',
            department: 'Bilgi Teknolojileri',
            objective: 'Kurum dış ağ ve iç ağ sistemlerinin siber güvenlik zafiyetlerinin değerlendirilmesi.',
            scope: 'DMZ sunucuları, veri tabanı erişim logları ve dış hizmet ağ bileşenleri.',
            methodology: 'Sızma testi raporlarının analizi, konfigürasyon incelemeleri.'
        }
    });

    await prisma.auditTest.createMany({
        data: [
            {
                auditId: auditBT.id,
                controlId: control1.id,
                title: 'Dış Ağ Sızma Testi Bulguları Teyidi',
                procedure: 'Bağımsız denetim firması tarafından yapılan sızma testindeki (pentest) kritik bulguların kapatılıp kapatılmadığının teyidi.',
                sampleSize: 5,
                designEffectiveness: 'Etkin',
                operatingEffectiveness: 'Etkin',
                testResult: 'Başarılı',
                testedBy: 'Zeynep Ak',
                testDate: new Date('2025-11-10T08:45:00Z'),
                evidence: JSON.stringify([
                    { name: "Pentest_Raporu.pdf", url: "/dummy-url" },
                    { name: "Yama_Kanitlari.pdf", url: "/dummy-url" }
                ])
            }
        ]
    });

    await prisma.auditWorkpaper.createMany({
        data: [
            {
                auditId: auditBT.id,
                title: 'BT-Ağ-Mimarisi',
                fileUrl: 'workpapers/BT_Ag_Mimarisi.vsdx',
                fileType: 'application/vnd.visio',
                category: 'Sistem Belgeleri',
                status: 'Onaylandı'
            }
        ]
    });

    await prisma.finding.create({
        data: {
            auditId: auditBT.id,
            title: 'Veri Tabanı Sunucularında Kritik Güvenlik Yaması Eksikliği',
            description: 'Müşteri verilerinin tutulduğu Oracle veri tabanı sunucularında, yayınlanmasının üzerinden 3 ay geçmesine rağmen CVE-2025-XYZ zafiyetini gideren yamanın uygulanmadığı tespit edilmiştir.',
            risk: 'Kritik',
            category: 'BT Güvenliği',
            department: 'Bilgi Teknolojileri',
            status: 'Kapalı',
            code: 'BUL-BT-01',
            rootCause: 'Yama yönetim sistemindeki (WSUS/SCCM) otomasyon arızası ve manuel kontrollerin yapılmaması.',
            recommendation: 'Yamaların acilen geçilmesi ve yama kontrol sürecine çift kademeli doğrulama eklenmesi.',
            actionPlan: 'Yama aynı gün geçilmiş olup, Nessus taramaları periyodu sıklaştırılmıştır.',
            isAgreed: true,
            evidence: 'Nessus_Tarama_Sonucu.pdf',
            departmentResponse: 'Bulgu kabul edilmiştir. Gerekli yamalar acil koduyla deploy edilmiştir.'
        }
    });

    // Fetch an existing user for timesheets
    let adminUser = await prisma.user.findFirst();

    if (adminUser) {
        await prisma.auditTimesheet.create({
            data: {
                auditId: auditBT.id,
                userId: adminUser.id,
                date: '2025-11-15T00:00:00Z',
                hours: 8,
                activityType: 'Saha Çalışması',
                description: 'Pentest raporlarının incelenmesi ve sistem yöneticileri ile mülakat.'
            }
        });
    }


    // --- AUDIT 2: SORUŞTURMA (INVESTIGATION) ---
    const auditSorgu = await prisma.audit.create({
        data: {
            title: 'Kredi Tahsis Süreçlerinde Usulsüzlük İddiası',
            type: 'Soruşturma',
            status: 'G�zden Ge�irme',
            progress: 90,
            startDate: '2026-05-01T00:00:00Z',
            endDate: '2026-06-30T00:00:00Z',
            team: JSON.stringify([
                { id: 'mock-1', name: 'Selim Kaya', role: 'Soruşturmacı' }
            ]),
            supervisor: 'Ahmet Yılmaz',
            auditCode: 'SR.02.2026',
            department: 'Kredi Tahsis',
            objective: 'İhbar hattına gelen "sahte ekspertiz raporu ile usulsüz kredi kullandırımı" iddialarının soruşturulması.',
            scope: '2025 yılı içerisinde Eskişehir Şubesi üzerinden kullandırılan teminatlı ticari krediler.',
            methodology: 'İfadelere başvurulması, e-posta loglarının incelenmesi, geriye dönük ekspertiz raporu doğrulaması.'
        }
    });

    await prisma.auditTest.createMany({
        data: [
            {
                auditId: auditSorgu.id,
                controlId: control2.id, // Reusing control for simplicity
                title: 'E-posta İletişim Logları Analizi',
                procedure: 'İncelenen personelin ilgili ekspertiz firması yetkilileri ile yaptığı e-posta yazışmalarının DLP sistemi üzerinden incelenmesi.',
                sampleSize: 100,
                designEffectiveness: 'Uygulanabilir Değil',
                operatingEffectiveness: 'Uygulanabilir Değil',
                testResult: 'İnceleme sonucunda, ekspertiz değerlerinin şube müdürü talebi doğrultusunda şişirildiğine dair yazışmalar tespit edilmiştir.',
                testedBy: 'Selim Kaya',
                testDate: new Date('2026-05-20T10:00:00Z'),
                evidence: JSON.stringify([{ name: "Eposta_Loglari.pdf", url: "/dummy" }])
            }
        ]
    });

    await prisma.auditWorkpaper.createMany({
        data: [
            {
                auditId: auditSorgu.id,
                title: '01-Ihbarci_Ifade_Tutanagi',
                fileUrl: 'workpapers/01_Ihbarci_Ifade.pdf',
                fileType: 'application/pdf',
                category: 'İfade Tutanakları',
                status: 'Onaylandı'
            },
            {
                auditId: auditSorgu.id,
                title: '02-Ekspertiz_Firma_Yazismalari',
                fileUrl: 'workpapers/02_Yazismalar.msg',
                fileType: 'application/vnd.ms-outlook',
                category: 'Kanıt ve Belgeler',
                status: 'Taslak'
            }
        ]
    });

    await prisma.finding.create({
        data: {
            auditId: auditSorgu.id,
            title: 'Sahte/Şişirilmiş Ekspertiz ile Kredi Kullandırımı',
            description: 'İncelenen 4 adet ticari kredi dosyasında, teminat olarak alınan gayrimenkullerin değerlerinin bağımsız ekspertiz firmasına baskı yapılarak piyasa değerinin %40 üzerinde gösterildiği ve bu yolla fazladan limit tahsis edildiği saptanmıştır.',
            risk: 'Kritik',
            category: 'Suistimal (Fraud)',
            department: 'Eskişehir Şubesi',
            status: 'Açık',
            code: 'SRG-ESK-01',
            financialImpact: 2500000,
            rootCause: 'Şube Müdürünün satış hedeflerini tutturmak amacıyla yetkisini kötüye kullanması.',
            recommendation: 'İlgili Şube Müdürü ve tahsis yetkilisinin disiplin kuruluna sevk edilmesi ve kredilerin ivedilikle geri çağrılması/teminat tamamlama istenmesi.',
            isAgreed: false,
            evidence: 'Eposta_Yazismalari.pdf, Sahte_Ekspertiz.pdf'
        }
    });

    if (adminUser) {
        await prisma.auditTimesheet.create({
            data: {
                auditId: auditSorgu.id,
                userId: adminUser.id,
                date: '2026-05-15T00:00:00Z',
                hours: 4,
                activityType: 'İfade Alma',
                description: 'İhbarcı ve ilgili uzman personel ile yüz yüze mülakat.'
            }
        });
    }

    console.log('Her türden (BT ve Soruşturma) kapsamlı denetim raporları veri tabanına başarıyla eklendi!');
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
