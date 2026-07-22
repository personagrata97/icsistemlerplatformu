const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Kapsamlı Seed Operasyonu Başlıyor...');
  try {
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    
    // 1. Rolleri Tanımla
    const roles = [
      { code: 'AUDIT_ADMIN', name: 'Sistem Yöneticisi', description: 'God Mode: Tüm yetkilere sahip teknik admin.' },
      { code: 'AUDIT_CAE', name: 'Teftiş Kurulu Müdürü', description: 'İş Birimi Başkanı: Onay ve stratejik yönetim yetkileri.' },
      { code: 'AUDIT_SUPERVISOR', name: 'Gözetmen', description: 'Denetim inceleme ve gözetim sorumlusu.' },
      { code: 'AUDIT_INSPECTOR', name: 'Müfettiş', description: 'Denetim operasyonlarını yürüten saha personeli.' }
    ];

    for (const r of roles) {
      await prisma.role.upsert({
        where: { code: r.code },
        update: { name: r.name, description: r.description },
        create: r
      });
    }

    const roleModels = {};
    for (const r of roles) {
      roleModels[r.code] = await prisma.role.findUnique({ where: { code: r.code } });
    }

    // 2. Kullanıcıları Tanımla
    const users = [
      {
        username: 'admin',
        displayName: 'Sistem Yöneticisi (Admin)',
        email: 'admin@emlakkatilim.com.tr',
        roleCode: 'AUDIT_ADMIN',
        title: 'BT Denetim ve Sistem Yöneticisi',
        department: 'Bilgi Teknolojileri'
      },
      {
        username: 'mudur',
        displayName: 'Kerem Yılmaz (CAE)',
        email: 'mudur@emlakkatilim.com.tr',
        roleCode: 'AUDIT_CAE',
        title: 'Teftiş Kurulu Müdürü',
        department: 'Teftiş Kurulu'
      },
      {
        username: 'gozetmen',
        displayName: 'Burak Kaya',
        email: 'gozetmen@emlakkatilim.com.tr',
        roleCode: 'AUDIT_SUPERVISOR',
        title: 'Gözetim Sorumlusu',
        department: 'Teftiş Kurulu'
      },
      {
        username: 'mufettis',
        displayName: 'Ayla Yılmaz',
        email: 'mufettis@emlakkatilim.com.tr',
        roleCode: 'AUDIT_INSPECTOR',
        title: 'Müfettiş',
        department: 'Teftiş Kurulu'
      }
    ];

    for (const u of users) {
      const user = await prisma.user.upsert({
        where: { username: u.username },
        update: { 
          passwordHash, 
          displayName: u.displayName, 
          isActive: true,
          title: u.title,
          department: u.department,
          email: u.email
        },
        create: {
          username: u.username,
          passwordHash,
          displayName: u.displayName,
          email: u.email,
          department: u.department,
          title: u.title,
          isActive: true,
          isAdUser: false
        }
      });

      // Rollerini eşle (Eskileri silip yeniyi ekle)
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleModels[u.roleCode].id
        }
      });
      
      console.log(`✅ Kullanıcı Hazır: ${u.username} (${u.roleCode})`);
    }

    console.log('\n✨ Tüm kullanıcılar ve roller başarıyla veritabanına işlendi.');
  } catch(e) {
    console.error('❌ Seed hatası:', e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
