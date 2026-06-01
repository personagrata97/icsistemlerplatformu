import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seed işlemi başlatılıyor...');

    // 0. Temizlik (Bağımlılık sırasına göre)
    console.log('🧹 Eski veriler temizleniyor...');

    // Auth tabloları
    await prisma.refreshToken.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // Risk tabloları
    await prisma.uyari.deleteMany();
    await prisma.gunlukRiskOzet.deleteMany();
    await prisma.riskLimit.deleteMany();
    await prisma.riskKpi.deleteMany();
    await prisma.senaryo.deleteMany();
    await prisma.teslimat.deleteMany();
    await prisma.odemeHareketi.deleteMany();
    await prisma.sozlesme.deleteMany();
    await prisma.musteri.deleteMany();
    await prisma.likiditePozisyonu.deleteMany();

    // ============================================
    // KULLANICI VE YETKİ SİSTEMİ SEED
    // ============================================

    console.log('🔐 Yetkiler oluşturuluyor...');
    const modules = ['RISK', 'AUDIT', 'SANCTION', 'COMPLIANCE', 'ADMIN'];
    const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'];

    const permissions: { module: string; action: string; description: string }[] = [];
    for (const module of modules) {
        for (const action of actions) {
            permissions.push({
                module,
                action,
                description: `${module} modülünde ${action} yetkisi`,
            });
        }
    }
    // ALL yetkisi (admin için)
    permissions.push({ module: 'ALL', action: 'ALL', description: 'Tüm modüllerde tüm yetkiler' });

    await prisma.permission.createMany({ data: permissions });
    const allPermissions = await prisma.permission.findMany();

    console.log('👤 Roller oluşturuluyor...');
    const roles = await Promise.all([
        prisma.role.create({
            data: {
                code: 'ADMIN',
                name: 'Sistem Yöneticisi',
                description: 'Tüm modüllere tam erişim',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'RISK_ADMIN',
                name: 'Risk Yöneticisi',
                description: 'Risk modülüne tam erişim',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'RISK_VIEWER',
                name: 'Risk Görüntüleyici',
                description: 'Risk modülünde sadece görüntüleme',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'AUDIT_ADMIN',
                name: 'Denetim Yöneticisi',
                description: 'Denetim modülüne tam erişim',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'AUDIT_INSPECTOR',
                name: 'Müfettiş',
                description: 'Denetim yapabilir, bulgu ekleyebilir',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'AUDIT_UNIT',
                name: 'Birim Kullanıcısı',
                description: 'Kendi birimine ait denetimleri görüntüleyebilir',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'SANCTION_ADMIN',
                name: 'Yaptırım Tarama Yöneticisi',
                description: 'Yaptırım tarama modülüne tam erişim',
                isSystem: true,
            },
        }),
        prisma.role.create({
            data: {
                code: 'COMPLIANCE_ADMIN',
                name: 'Uyum Yöneticisi',
                description: 'Uyum modülüne tam erişim',
                isSystem: true,
            },
        }),
    ]);

    // Rol-yetki eşleştirmesi
    console.log('🔗 Rol-yetki eşleştirmesi yapılıyor...');
    const rolePermissionData: { roleId: string; permissionId: string; scope?: string }[] = [];

    // ADMIN: ALL:ALL
    const adminRole = roles.find(r => r.code === 'ADMIN')!;
    const allAllPerm = allPermissions.find(p => p.module === 'ALL' && p.action === 'ALL')!;
    rolePermissionData.push({ roleId: adminRole.id, permissionId: allAllPerm.id });

    // RISK_ADMIN: RISK:*
    const riskAdminRole = roles.find(r => r.code === 'RISK_ADMIN')!;
    allPermissions.filter(p => p.module === 'RISK').forEach(p => {
        rolePermissionData.push({ roleId: riskAdminRole.id, permissionId: p.id });
    });

    // RISK_VIEWER: RISK:VIEW
    const riskViewerRole = roles.find(r => r.code === 'RISK_VIEWER')!;
    const riskViewPerm = allPermissions.find(p => p.module === 'RISK' && p.action === 'VIEW')!;
    rolePermissionData.push({ roleId: riskViewerRole.id, permissionId: riskViewPerm.id });

    // AUDIT_ADMIN: AUDIT:*
    const auditAdminRole = roles.find(r => r.code === 'AUDIT_ADMIN')!;
    allPermissions.filter(p => p.module === 'AUDIT').forEach(p => {
        rolePermissionData.push({ roleId: auditAdminRole.id, permissionId: p.id });
    });

    // AUDIT_INSPECTOR: AUDIT:VIEW (OWN), CREATE (ALL), EDIT (ALL)
    const auditInspectorRole = roles.find(r => r.code === 'AUDIT_INSPECTOR')!;
    const auditViewPermForInspector = allPermissions.find(p => p.module === 'AUDIT' && p.action === 'VIEW')!;
    rolePermissionData.push({
        roleId: auditInspectorRole.id,
        permissionId: auditViewPermForInspector.id,
        scope: 'OWN' // Sadece kendi bulgularını görebilir
    });

    ['CREATE', 'EDIT'].forEach(action => {
        const perm = allPermissions.find(p => p.module === 'AUDIT' && p.action === action)!;
        rolePermissionData.push({
            roleId: auditInspectorRole.id,
            permissionId: perm.id,
            scope: 'ALL' // Tüm denetimlerde çalışabilir
        });
    });

    // AUDIT_UNIT: AUDIT:VIEW (DEPARTMENT)
    const auditUnitRole = roles.find(r => r.code === 'AUDIT_UNIT')!;
    const auditViewPerm = allPermissions.find(p => p.module === 'AUDIT' && p.action === 'VIEW')!;
    rolePermissionData.push({
        roleId: auditUnitRole.id,
        permissionId: auditViewPerm.id,
        scope: 'DEPARTMENT' // Sadece kendi birimine ait kayıtları gör
    });

    // SANCTION_ADMIN: SANCTION:*
    const sanctionAdminRole = roles.find(r => r.code === 'SANCTION_ADMIN')!;
    allPermissions.filter(p => p.module === 'SANCTION').forEach(p => {
        rolePermissionData.push({ roleId: sanctionAdminRole.id, permissionId: p.id });
    });

    // COMPLIANCE_ADMIN: COMPLIANCE:*
    const complianceAdminRole = roles.find(r => r.code === 'COMPLIANCE_ADMIN')!;
    allPermissions.filter(p => p.module === 'COMPLIANCE').forEach(p => {
        rolePermissionData.push({ roleId: complianceAdminRole.id, permissionId: p.id });
    });

    await prisma.rolePermission.createMany({ data: rolePermissionData });

    // Kullanıcılar
    console.log('👥 Kullanıcılar oluşturuluyor...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const testPassword = await bcrypt.hash('Test123!', 10);

    const adminUser = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@emlakkatilimtfs.com.tr',
            passwordHash: adminPassword,
            displayName: 'Sistem Yöneticisi',
            department: 'Bilgi Teknolojileri',
            isActive: true,
            isAdUser: false,
            roles: {
                create: { roleId: adminRole.id },
            },
            // Staff Fields for Admin (Acting as Manager)
            registerNumber: '1000',
            title: 'Başmüfettiş',
            jobStartDate: '2020-01-01',
            certifications: JSON.stringify(['CISA', 'CRISC']),
            phoneNumber: '05321234567',
        },
    });

    // Test kullanıcıları
    await prisma.user.create({
        data: {
            username: 'risk_user',
            email: 'risk@emlakkatilimtfs.com.tr',
            passwordHash: testPassword,
            displayName: 'Risk Uzmanı',
            department: 'Risk Yönetimi',
            isActive: true,
            isAdUser: false,
            roles: {
                create: { roleId: riskAdminRole.id },
            },
        },
    });

    const auditUser = await prisma.user.create({
        data: {
            username: 'audit_user',
            email: 'audit@emlakkatilimtfs.com.tr',
            passwordHash: testPassword,
            displayName: 'Müfettiş',
            department: 'İç Denetim',
            isActive: true,
            isAdUser: false,
            // Staff Fields
            registerNumber: '1001',
            title: 'Müfettiş',
            jobStartDate: '2023-01-01',
            certifications: JSON.stringify(['CIA', 'CISA']),
            phoneNumber: '05551234567',
            roles: {
                create: { roleId: auditInspectorRole.id },
            },
        },
    });

    await prisma.user.create({
        data: {
            username: 'compliance_user',
            email: 'compliance@emlakkatilimtfs.com.tr',
            passwordHash: testPassword,
            displayName: 'Uyum Uzmanı',
            department: 'Uyum',
            isActive: true,
            isAdUser: false,
            roles: {
                create: { roleId: complianceAdminRole.id },
            },
        },
    });


    console.log('✅ Kullanıcı ve yetki sistemi seed tamamlandı!');
    console.log('   - Admin kullanıcı: admin / Admin123!');
    console.log('   - Test kullanıcıları: risk_user, audit_user, compliance_user / Test123!');

    // 1. KPI Tanımları
    console.log('📊 KPI tanımları oluşturuluyor...');
    await prisma.riskKpi.createMany({
        data: [
            { kpi_kodu: 'NPL', aciklama: 'Takipteki Sözleşme Oranı', birim: 'YUZDE' },
            { kpi_kodu: 'LCR', aciklama: 'Likidite Oranı', birim: 'ORAN' },
            { kpi_kodu: 'TESLIMAT_BASKI', aciklama: 'Teslimat Baskısı', birim: 'ORAN' },
            { kpi_kodu: 'KONSANTRASYON_BOLGE', aciklama: 'Bölge Konsantrasyonu', birim: 'YUZDE' },
            { kpi_kodu: 'KONSANTRASYON_VADE', aciklama: 'Vade Konsantrasyonu', birim: 'YUZDE' },
            { kpi_kodu: 'DPD_DAGILIM', aciklama: 'Gecikme Dağılımı (90+ Gün Oranı)', birim: 'YUZDE' },
            { kpi_kodu: 'TESLIMAT_YUKUMLULUGU', aciklama: 'Teslimat Yükümlülüğü (30 Gün)', birim: 'TUTAR' },
            { kpi_kodu: 'IPTAL_ORANI', aciklama: 'İptal Oranı', birim: 'YUZDE' },
        ],
    });

    // 2. Risk Limitleri
    console.log('⚠️ Risk limitleri oluşturuluyor...');
    await prisma.riskLimit.createMany({
        data: [
            // NPL limitleri
            { kpi_kodu: 'NPL', esik_deger: 0.05, karsilastirma: 'GT', seviye: 'YELLOW' },
            { kpi_kodu: 'NPL', esik_deger: 0.10, karsilastirma: 'GT', seviye: 'RED' },

            // LCR limitleri
            { kpi_kodu: 'LCR', esik_deger: 1.0, karsilastirma: 'LT', seviye: 'YELLOW' },
            { kpi_kodu: 'LCR', esik_deger: 0.8, karsilastirma: 'LT', seviye: 'RED' },

            // Teslimat Baskısı limitleri
            { kpi_kodu: 'TESLIMAT_BASKI', esik_deger: 1.0, karsilastirma: 'GT', seviye: 'YELLOW' },
            { kpi_kodu: 'TESLIMAT_BASKI', esik_deger: 1.5, karsilastirma: 'GT', seviye: 'RED' },

            // DPD limitleri
            { kpi_kodu: 'DPD_DAGILIM', esik_deger: 0.10, karsilastirma: 'GT', seviye: 'YELLOW' },
            { kpi_kodu: 'DPD_DAGILIM', esik_deger: 0.20, karsilastirma: 'GT', seviye: 'RED' },

            // Teslimat Yükümlülüğü limitleri
            { kpi_kodu: 'TESLIMAT_YUKUMLULUGU', esik_deger: 5000000, karsilastirma: 'GT', seviye: 'YELLOW' },
            { kpi_kodu: 'TESLIMAT_YUKUMLULUGU', esik_deger: 7500000, karsilastirma: 'GT', seviye: 'RED' },

            // İptal Oranı limitleri
            { kpi_kodu: 'IPTAL_ORANI', esik_deger: 5, karsilastirma: 'LT', seviye: 'GREEN' },
            { kpi_kodu: 'IPTAL_ORANI', esik_deger: 10, karsilastirma: 'GE', seviye: 'YELLOW' },
            { kpi_kodu: 'IPTAL_ORANI', esik_deger: 15, karsilastirma: 'GT', seviye: 'RED' },
        ],
    });

    // 3. Senaryolar
    console.log('🎯 Senaryolar oluşturuluyor...');
    await prisma.senaryo.createMany({
        data: [
            {
                senaryo_kodu: 'BAZ',
                ad: 'Baz Senaryo',
                parametreler: JSON.stringify({
                    iptal_artis: 0,
                    gecikme_artis: 0,
                    teslimat_artis: 0,
                    likidite_dusus: 0,
                }),
            },
            {
                senaryo_kodu: 'OLUMSUZ',
                ad: 'Olumsuz Senaryo',
                parametreler: JSON.stringify({
                    iptal_artis: 0.20,
                    gecikme_artis: 0.15,
                    teslimat_artis: 0.10,
                    likidite_dusus: 0.12,
                }),
            },
            {
                senaryo_kodu: 'OLUMLU',
                ad: 'Olumlu Senaryo',
                parametreler: JSON.stringify({
                    iptal_artis: -0.10,
                    gecikme_artis: -0.08,
                    teslimat_artis: -0.05,
                    likidite_artis: 0.12,
                }),
            },
        ],
    });

    // 4. Örnek Müşteriler (15 adet)
    console.log('👥 Müşteriler oluşturuluyor...');
    const musteriler = [];
    const bolgeler = ['MARMARA', 'EGE', 'AKDENIZ', 'IC_ANADOLU', 'KARADENIZ'];
    const segmentler = ['BIREYSEL', 'TICARI', 'KURUMSAL'];

    for (let i = 0; i < 15; i++) {
        const musteri = await prisma.musteri.create({
            data: {
                ad_soyad: `Müşteri ${i + 1}`,
                segment: segmentler[i % 3],
                bolge: bolgeler[i % 5],
                sube: `SUBE_${(i % 5) + 1}`,
            },
        });
        musteriler.push(musteri);
    }

    // 5. Örnek Sözleşmeler (40 adet)
    console.log('📝 Sözleşmeler oluşturuluyor...');
    const durumlar = ['AKTIF', 'TAKIPTE', 'TAMAMLANDI', 'IPTAL'];
    const sozlesmeler = [];

    for (let i = 0; i < 40; i++) {
        const musteri = musteriler[i % 15];
        const baslangicTarihi = new Date();
        baslangicTarihi.setMonth(baslangicTarihi.getMonth() - Math.floor(Math.random() * 24));

        const vade = [12, 24, 36, 48, 60][Math.floor(Math.random() * 5)];
        const toplamTutar = 10000 + Math.random() * 90000;
        const taksitTutari = toplamTutar / vade;

        const teslimTarihiPlanlanan = new Date(baslangicTarihi);
        teslimTarihiPlanlanan.setMonth(teslimTarihiPlanlanan.getMonth() + vade);

        // İlk 5 sözleşme TAKIPTE olsun, diğerleri dağınık
        const durum = i < 5 ? 'TAKIPTE' : durumlar[i % 4];

        const sozlesme = await prisma.sozlesme.create({
            data: {
                musteri_id: musteri.musteri_id,
                toplam_tutar: toplamTutar,
                vade,
                taksit_tutari: taksitTutari,
                baslangic_tarihi: baslangicTarihi,
                teslim_tarihi_planlanan: teslimTarihiPlanlanan,
                durum,
            },
        });
        sozlesmeler.push(sozlesme);
    }

    // 6. Örnek Ödeme Hareketleri
    console.log('💰 Ödeme hareketleri oluşturuluyor...');
    for (const sozlesme of sozlesmeler) {
        // Rastgele 1-10 arası hareket
        const hareketSayisi = Math.floor(Math.random() * 5) + 1;

        for (let j = 0; j < hareketSayisi; j++) {
            const tarih = new Date(sozlesme.baslangic_tarihi);
            tarih.setMonth(tarih.getMonth() + j);

            // Takipteki sözleşmelerde yüksek gecikme olsun
            let gecikmeGun = 0;
            if (sozlesme.durum === 'TAKIPTE') {
                gecikmeGun = 90 + Math.floor(Math.random() * 60); // 90-150 gün
            } else {
                gecikmeGun = Math.random() > 0.8 ? Math.floor(Math.random() * 20) : 0;
            }

            await prisma.odemeHareketi.create({
                data: {
                    sozlesme_id: sozlesme.sozlesme_id,
                    tarih,
                    tutar: Number(sozlesme.taksit_tutari),
                    tip: 'ODEME',
                    gecikme_gun: gecikmeGun,
                },
            });
        }

        // Teslimat verileri (5-10 arası rastgele)
        if (Math.random() > 0.7) { // Sözleşmelerin %30'una teslimat ekle
            await prisma.teslimat.create({
                data: {
                    sozlesme_id: sozlesme.sozlesme_id,
                    teslim_tarihi: new Date(),
                    teslim_tutar: Number(sozlesme.toplam_tutar) * 0.5,
                    teslim_tipi: 'NAKIT'
                }
            });
        }
    }

    // 7. Likidite Pozisyonu (Son 3 gün)
    console.log('💵 Likidite pozisyonu oluşturuluyor...');
    const bugun = new Date();
    for (let i = 0; i < 3; i++) {
        const tarih = new Date(bugun);
        tarih.setDate(tarih.getDate() - i);

        await prisma.likiditePozisyonu.create({
            data: {
                tarih: tarih,
                nakit: 5000000 + (Math.random() * 1000000),
                likit_varlik: 3000000 + (Math.random() * 500000),
                kisa_vadeli_yukumluluk: 4000000 + (Math.random() * 200000),
                teslimat_yukumlulugu_30gun: 2500000 + (Math.random() * 100000),
            },
        });
    }


    // 8. Denetim ve Bulgu Verileri
    console.log('🔍 Denetim ve bulgu verileri oluşturuluyor...');

    // Temizlik
    await prisma.finding.deleteMany();
    await prisma.audit.deleteMany();

    const audit_1 = await prisma.audit.create({
        data: {
            auditCode: 'DEN-2024-001',
            title: 'Bilgi Teknolojileri Genel Kontrolleri',
            type: 'IT',
            status: 'Devam Ediyor',
            startDate: '2024-01-15',
            endDate: '2024-02-15',
            team: 'Selim Kaya, Yasin Köktaş',
            supervisor: 'Ahmet Yılmaz',
            progress: 45,
            department: 'Bilgi Teknolojileri',
            creatorId: adminUser.id
        }
    });

    const audit_2 = await prisma.audit.create({
        data: {
            auditCode: 'DEN-2024-002',
            title: 'Şube Operasyonları Denetimi - Kadıköy',
            type: 'Şube',
            status: 'Planlandı',
            startDate: '2024-03-01',
            endDate: '2024-03-15',
            team: 'Ayşe Demir',
            supervisor: 'Ahmet Yılmaz',
            progress: 0,
            department: 'Operasyon',
            creatorId: adminUser.id
        }
    });

    await prisma.finding.createMany({
        data: [
            {
                auditId: audit_1.id,
                title: 'Parola Politikası Yetersizliği',
                risk: 'Yüksek',
                status: 'Açık',
                dueDate: '2024-06-01',
                description: 'Sistemlerde karmaşık parola politikası zorunlu tutulmamaktadır.',
                department: 'Bilgi Teknolojileri',
                assignedUserId: auditUser.id // audit_user'a atandı
            },
            {
                auditId: audit_1.id,
                title: 'Yedekleme Testlerinin Eksikliği',
                risk: 'Orta',
                status: 'Kapalı',
                dueDate: '2024-03-01',
                description: 'Kritik sistemlerin yedekleme testleri düzenli yapılmamaktadır.',
                department: 'Bilgi Teknolojileri',
                assignedUserId: adminUser.id // admin'e atandı
            },
            {
                auditId: audit_2.id,
                title: 'Kasa Mutabakat Farkları',
                risk: 'Kritik',
                status: 'Açık',
                dueDate: '2024-04-01',
                description: 'Günlük kasa mutabakatlarında açıklanamayan farklar tespit edilmiştir.',
                department: 'Operasyon',
                assignedUserId: auditUser.id // audit_user'a atandı
            }
        ]
    });


    console.log('✅ Seed işlemi tamamlandı!');
}

main()
    .catch((e) => {
        console.error('❌ Seed hatası:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
