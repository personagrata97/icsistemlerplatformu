import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DataRetentionService {
    private readonly logger = new Logger(DataRetentionService.name);

    constructor(private prisma: PrismaService) { }

    // Her gece yarısı çalışarak süresi dolmuş veya soft-delete edilmiş verileri fiziksel olarak anonimleştirir/siler
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDataRetention() {
        this.logger.log('KVKK Data Retention cron job started.');
        try {
            // KVKK Madde 7 Gereği: Soft delete üzerinden 30 gün geçmiş verileri fiziksel sil.
            // ZAFİYET YAMASI: P2003 Foreign Key Constraint çökmesini engellemek için SİLME İŞLEMİ AŞAĞIDAN YUKARIYA (Bottom-Up) yapılmalıdır.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Önce eski Logları Temizle (Böylece TargetId'ler silinince yetim kalmaz)
            const tenYearsAgo = new Date();
            tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

            const oldLogs = await this.prisma.auditLog.deleteMany({
                where: { date: { lte: tenYearsAgo } }
            });
            if (oldLogs.count > 0) this.logger.log(`[Retention] 10 yıldan eski log temizliği: ${oldLogs.count}`);

            // 1.5 Etik ve İhbar - IP Hash Temizliği (30 gün) KVKK Uyumu (Abuse Detection döngüsü ile senkronize)
            const thirtyDaysAgoIp = new Date();
            thirtyDaysAgoIp.setDate(thirtyDaysAgoIp.getDate() - 30);
            const deletedIpLogs = await this.prisma.ethicsIpLog.deleteMany({
                where: { createdAt: { lte: thirtyDaysAgoIp } }
            });
            if (deletedIpLogs.count > 0) this.logger.log(`[Retention] KVKK Etik Ihbar IP Hash temizliği (30 gün): ${deletedIpLogs.count}`);

            // 2. Silinecek Bulguları Tespit Et
            const findingsToDelete = await this.prisma.finding.findMany({
                where: { isDeleted: true, deletedAt: { lte: thirtyDaysAgo } },
                select: { id: true }
            });

            if (findingsToDelete.length > 0) {
                const findingIds = findingsToDelete.map(f => f.id);

                // Alt Tabloları Manuel Sil (Orphan Data Prevention)
                await this.prisma.auditFollowUp.deleteMany({ where: { findingId: { in: findingIds } } });
                await this.prisma.conciliationMessage.deleteMany({ where: { findingId: { in: findingIds } } });
                await this.prisma.auditConciliation.deleteMany({ where: { findingId: { in: findingIds } } });
                await this.prisma.extensionRequest.deleteMany({ where: { findingId: { in: findingIds } } });
                await this.prisma.auditLog.deleteMany({ where: { targetType: 'Finding', targetId: { in: findingIds } } });

                // Üst Tabloyu Sil (Findngs)
                const deletedFindings = await this.prisma.finding.deleteMany({
                    where: { id: { in: findingIds } }
                });
                this.logger.log(`[Retention] Fiziksel silinen bulgu sayısı (ve alt kayıtları): ${deletedFindings.count}`);
            }

            // 3. Silinecek Testleri Tespit Et ve Sil
            const testsToDelete = await this.prisma.auditTest.findMany({
                where: { isDeleted: true, deletedAt: { lte: thirtyDaysAgo } },
                select: { id: true }
            });

            if (testsToDelete.length > 0) {
                const testIds = testsToDelete.map(t => t.id);
                // Testin alt kayıtları (örneğin ona bağlı audit log varsa vs. ileride eklenebilir)
                await this.prisma.auditLog.deleteMany({ where: { targetType: 'Test', targetId: { in: testIds } } });

                const deletedTests = await this.prisma.auditTest.deleteMany({
                    where: { id: { in: testIds } }
                });
                this.logger.log(`[Retention] Fiziksel silinen test sayısı: ${deletedTests.count}`);
            }

            // 4. Silinmiş Çalışma Kağıtları (Fiziksel Dosyalar ile Birlikte)
            const workpapersToDelete = await this.prisma.auditWorkpaper.findMany({
                where: { isDeleted: true, deletedAt: { lte: thirtyDaysAgo } },
                select: { id: true, fileUrl: true, auditId: true }
            });

            if (workpapersToDelete.length > 0) {
                const fsPromises = require('fs').promises;
                const path = require('path');
                let deletedFileCount = 0;

                for (const wp of workpapersToDelete) {
                    if (wp.fileUrl && wp.fileUrl.includes('/secure-files/workpapers/')) {
                        try {
                            const fileName = wp.fileUrl.split('/').pop();
                            if (fileName) {
                                const fullPath = path.join(process.cwd(), 'uploads', 'workpapers', wp.auditId, fileName);
                                await fsPromises.unlink(fullPath);
                                deletedFileCount++;
                            }
                        } catch (err: any) {
                            if (err.code !== 'ENOENT') {
                                this.logger.warn(`Çalışma kağıdı fiziksel dosyası silinemedi: ${wp.fileUrl} - Error: ${err.message}`);
                            }
                        }
                    }
                }

                // Veritabanı kayıtlarını sil
                const deletedWorkpaperDb = await this.prisma.auditWorkpaper.deleteMany({
                    where: { id: { in: workpapersToDelete.map(w => w.id) } }
                });

                this.logger.log(`[Retention] Fiziksel silinen çalışma kağıdı dosyası (Disk): ${deletedFileCount}, DB kaydı: ${deletedWorkpaperDb.count}`);
            }

            this.logger.log('KVKK Data Retention cron job finished successfully.');
        } catch (error) {
            this.logger.error('Error in KVKK Data Retention cron job', error);
        }
    }
}
