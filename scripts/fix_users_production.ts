
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const roleAdmin = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const roleManager = await prisma.role.findUnique({ where: { code: 'AUDIT_MANAGER' } });
  const roleInspector = await prisma.role.findUnique({ where: { code: 'AUDIT_INSPECTOR' } });

  if (!roleAdmin || !roleManager || !roleInspector) {
    throw new Error('Gerekli roller veritabanında bulunamadı. Lütfen önce rolleri oluşturun.');
  }

  const usersToFix = [
    { username: 'admin', roleId: roleAdmin.id, title: 'Sistem Yöneticisi', displayName: 'Sistem Yöneticisı' },
    { username: 'mudur', roleId: roleManager.id, title: 'Teftiş Kurulu Müdürü', displayName: 'Teftiş Kurulu Müdürü' },
    { username: 'selim.kaya', roleId: roleInspector.id, title: 'Müfettiş', displayName: 'Selim Kaya' },
    { username: 'yasin.koktas', roleId: roleInspector.id, title: 'Müfettiş', displayName: 'Yasin Köktaş' }
  ];

  for (const u of usersToFix) {
    console.log(`İşleniyor: ${u.username}...`);
    
    let user = await prisma.user.findUnique({ where: { username: u.username } });
    
    if (user) {
      // Update existing
      await prisma.user.update({
        where: { id: user.id },
        data: {
          title: u.title,
          displayName: u.displayName,
          isActive: true,
          isDeleted: false
        }
      });
      // Update role
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({ data: { userId: user.id, roleId: u.roleId } });
      console.log(`Güncellendi: ${u.username}`);
    } else {
      // Create new
      const newUser = await prisma.user.create({
        data: {
          username: u.username,
          displayName: u.displayName,
          title: u.title,
          passwordHash, // Default pass for new accounts
          department: 'Teftiş Kurulu',
          isActive: true
        }
      });
      await prisma.userRole.create({ data: { userId: newUser.id, roleId: u.roleId } });
      console.log(`Oluşturuldu: ${u.username}`);
    }
  }

  console.log('Tüm kullanıcı düzeltmeleri başarıyla tamamlandı.');
}

main()
  .catch((e) => {
    console.error('Kritik Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
