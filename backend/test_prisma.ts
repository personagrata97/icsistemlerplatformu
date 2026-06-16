import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB tests...");
  const whereAudit: any = { isDeleted: false };
  const whereFinding: any = { isDeleted: false };

  try {
    console.log("1. Audit Stats");
    await prisma.audit.count({ where: whereAudit });
    await prisma.audit.count({ where: { ...whereAudit, status: 'Devam Ediyor' } });
    await prisma.audit.count({ where: { ...whereAudit, status: 'Tamamlandı' } });

    console.log("2. Finding Stats");
    await prisma.finding.count({ where: whereFinding });
    await prisma.finding.count({ where: { ...whereFinding, risk: 'Kritik' } });
    await prisma.finding.count({ where: { ...whereFinding, risk: 'Yüksek' } });
    await prisma.finding.count({ where: { ...whereFinding, status: { notIn: ['Kapalı', 'Taslak', 'İptal'] } } });

    console.log("3. Workflow Stats");
    await prisma.finding.count({ where: { ...whereFinding, status: 'Onay Bekliyor' } });
    await prisma.finding.count({ where: { ...whereFinding, status: { in: ['Tebliğ Edildi', 'Birim Yanıtladı'] } } });
    await prisma.finding.count({ where: { ...whereFinding, status: 'Doğrulama Bekliyor' } });
    await prisma.finding.count({ where: { ...whereFinding, status: 'Revizyon Gerekli' } });
    await prisma.audit.count({ where: { ...whereAudit, status: 'Revizyon Gerekli' } });

    console.log("4. Pending Deletions");
    await prisma.audit.findMany({ where: { status: 'Silinme Onayı Bekliyor' }, select: { id: true, auditCode: true, title: true, deletionReason: true, deletionComment: true } });
    await prisma.finding.findMany({ where: { status: 'Silinme Onayı Bekliyor' }, select: { id: true, code: true, title: true, deletionReason: true, deletionComment: true } });

    console.log("5. Recent Records");
    await prisma.audit.findMany({ where: { ...whereAudit, status: 'Devam Ediyor' }, take: 5, orderBy: { created_at: 'desc' }, include: { AuditableUnit: true } });
    await prisma.finding.findMany({ where: whereFinding, take: 5, orderBy: { created_at: 'desc' } });

    console.log("6. Action Stats");
    await prisma.auditFollowUp.findMany({ where: { finding: whereFinding } });

    console.log("7. Staff");
    await prisma.user.findMany({
      where: { isDeleted: false },
      include: { education: true, certificates: true, experiences: true }
    });

    console.log("7.5 Recent Logs");
    await prisma.auditLog.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      select: { id: true, action: true, user: true, date: true, targetId: true, targetType: true, details: true }
    });

    console.log("8. Monthly Trend");
    const monthStart = new Date(2026, 0, 1);
    const monthEnd = new Date(2026, 1, 0);
    await prisma.finding.count({
      where: {
        isDeleted: false,
        created_at: { gte: monthStart, lte: monthEnd },
        status: { notIn: ['Kapalı', 'Kapalı (Mutabık Değil)', 'Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'] }
      }
    });
    await prisma.finding.count({
      where: {
        isDeleted: false,
        OR: [
          { responseDate: { gte: monthStart, lte: monthEnd } },
          { updated_at: { gte: monthStart, lte: monthEnd } }
        ],
        status: { in: ['Kapalı', 'Kapalı (Mutabık Değil)', 'Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'] }
      }
    });

    console.log("9. Average Audit Duration");
    await prisma.audit.findMany({
      where: { ...whereAudit, status: 'Tamamlandı', endDate: { not: null } },
      select: { startDate: true, endDate: true }
    });
    
    await prisma.audit.findMany({
      where: { ...whereAudit, status: { notIn: ['İptal'] } },
      select: { startDate: true, endDate: true }
    });

    console.log("ALL QUERIES PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("ERROR CAUGHT:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
