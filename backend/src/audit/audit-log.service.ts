import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(private prisma: PrismaService) { }

    async getLogs() {
        const logs = await this.prisma.auditLog.findMany({
            orderBy: { date: 'desc' },
            take: 100
        });

        // Tüm kullanıcıları alarak bir eşleme (ID -> İsim) oluştur
        const users = await this.prisma.user.findMany({
            select: { id: true, displayName: true, username: true }
        });
        const userMap = new Map(users.map(u => [u.id, u.displayName || u.username]));
        
        // Transform dates and resolve user names
        return logs.map(log => ({
            ...log,
            user: userMap.get(log.user) || log.user, // ID varsa resolves, yoksa (eski log ise) olduğu gibi kalır
            date: log.date ? log.date.toISOString() : null
        }));
    }

    async getNotifications() {
        try {
            const logs = await this.prisma.auditLog.findMany({
                orderBy: { date: 'desc' },
                take: 20
            });

            // Kategori eşleme tablosu
            const categoryMap: { [key: string]: string } = {
                'STAFF': 'PERSONEL',
                'AUTH': 'GİRİŞ',
                'AUDIT': 'DENETİM',
                'GENERAL': 'GENEL',
                'FINDING': 'BULGU',
                'REPORT': 'RAPOR',
                'ETHICS': 'ETİK',
                'SYSTEM': 'SİSTEM'
            };

            // Eylem/Başlık eşleme tablosu
            const actionMap: { [key: string]: string } = {
                'ETHICS_VIEWED': 'Etik Bildirim İncelendi',
                'LOGIN_SUCCESS': 'Sisteme Giriş Başarılı',
                'LOGIN_FAILURE': 'Hatalı Giriş Denemesi',
                'STAFF_CREATED': 'Yeni Personel Eklendi',
                'STAFF_UPDATED': 'Personel Güncellendi',
                'STAFF_DELETED': 'Personel Silindi',
                'AUDIT_CREATED': 'Yeni Denetim Başlatıldı',
                'AUDIT_UPDATED': 'Denetim Güncellendi'
            };

            return logs.map(log => ({
                id: log.id.toString(),
                title: actionMap[log.action || ''] || log.action || 'Sistem Aksiyonu',
                description: log.details || `${log.user} tarafından ${categoryMap[log.targetType?.toUpperCase()] || log.targetType} üzerinde işlem yapıldı.`,
                type: (log.action?.includes('SİL') || log.action?.includes('DELETE') || log.action?.includes('FAILURE')) ? 'warning' : 
                      (log.action?.includes('GÜNCELLE') || log.action?.includes('UPDATE') || log.action?.includes('VIEWED')) ? 'info' : 'success',
                time: log.date,
                date: log.date.toISOString().split('T')[0],
                isRead: false,
                category: categoryMap[log.targetType?.toUpperCase()] || log.targetType || 'GENEL'
            }));
        } catch (e) {
            this.logger.error('Bildirimler alinamadi', e);
            return [];
        }
    }

    /**
     * Immutable Audit Log: Zincirleme SHA-256 hash ile değiştirme tespiti.
     * Hash hesaplama PrismaService WORM middleware tarafından otomatik yapılır.
     * Bu metot sadece log verisini hazırlar ve veritabanına kaydeder.
     */
    async createLog(data: any) {
        try {
            let resolvedAuditId = data.auditId;

            // Güçlü Merkeziyetçilik: Eğer auditId verilmemişse, target ilişkisinden bul
            if (!resolvedAuditId && data.targetId && data.targetType) {
                const entityId = String(data.targetId);
                if (data.targetType === 'Audit') {
                    resolvedAuditId = entityId;
                } else if (data.targetType === 'Finding') {
                    const res = await this.prisma.finding.findUnique({ where: { id: entityId }, select: { auditId: true } });
                    if (res) resolvedAuditId = res.auditId;
                } else if (data.targetType === 'Timesheet') {
                    const res = await this.prisma.auditTimesheet.findUnique({ where: { id: entityId }, select: { auditId: true } });
                    if (res) resolvedAuditId = res.auditId;
                } else if (data.targetType === 'Workpaper' || data.targetType === 'File') {
                    const res = await this.prisma.auditWorkpaper.findUnique({ where: { id: entityId }, select: { auditId: true } });
                    if (res) resolvedAuditId = res.auditId;
                } else if (data.targetType === 'Risk') {
                    // Risk doğrudan bir denetime bağlı olmayabilir (Process'e bağlıdır)
                    resolvedAuditId = null;
                }
            }

            const logData = {
                user: data.user || 'System',
                action: data.action,
                details: data.details,
                targetType: data.targetType || 'General',
                targetId: data.targetId,
                auditId: resolvedAuditId,
                changeData: typeof data.changeData === 'object' ? JSON.stringify(data.changeData) : data.changeData,
                ipAddress: data.ipAddress
            };

            // Hash hesaplama PrismaService WORM middleware'ine bırakılır (tek merkezi nokta)
            return await this.prisma.auditLog.create({
                data: logData
            });
        } catch (error) {
            this.logger.error('Failed to create log:', error);
            return null;
        }
    }

    /**
     * Log bütünlük doğrulaması: Zincirleme hash'ler tutarlı mı kontrol eder.
     * Herhangi bir log değiştirilmişse, sonraki tüm hash'ler bozulur.
     * 
     * ÖNEMLI: Hash formülü PrismaService WORM middleware ile BİREBİR AYNI olmalıdır:
     *   hashInput = previousHash + JSON.stringify(logData)
     */
    async verifyLogIntegrity(): Promise<{ valid: boolean; brokenAt?: string; totalChecked: number; skippedLegacy: number }> {
        const logs = await this.prisma.auditLog.findMany({
            orderBy: { id: 'asc' },
        });

        let previousHash = '0';
        let totalChecked = 0;
        let skippedLegacy = 0;

        for (const log of logs) {
            if (!log.hash || log.hash === '0') {
                // Hash'siz eski kayıtları atla
                skippedLegacy++;
                continue;
            }

            // previousHash doğrulaması: kaydedilen previousHash, beklenen previousHash ile eşleşmeli
            if (log.previousHash && log.previousHash !== previousHash) {
                this.logger.error(`Log zinciri kopuk: ID ${log.id}, beklenen previousHash: ${previousHash.substring(0, 8)}..., kayıtlı: ${log.previousHash?.substring(0, 8)}...`);
                return { valid: false, brokenAt: log.id, totalChecked, skippedLegacy };
            }

            // WORM middleware ile BİREBİR AYNI logData yapısı
            const logData = {
                user: log.user || 'System',
                action: log.action,
                details: log.details,
                targetType: log.targetType || 'General',
                targetId: log.targetId,
                auditId: log.auditId,
                changeData: log.changeData,
                ipAddress: log.ipAddress
            };

            // WORM middleware ile BİREBİR AYNI hash formülü
            const hashInput = previousHash + JSON.stringify(logData);
            const calculatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

            if (calculatedHash !== log.hash) {
                this.logger.error(`Log bütünlüğü bozuk: ID ${log.id}. Hesaplanan: ${calculatedHash.substring(0, 8)}..., kayıtlı: ${log.hash.substring(0, 8)}...`);
                return { valid: false, brokenAt: log.id, totalChecked, skippedLegacy };
            }

            previousHash = log.hash;
            totalChecked++;
        }

        this.logger.log(`Log bütünlük doğrulaması tamamlandı: ${totalChecked} kayıt kontrol edildi, ${skippedLegacy} eski kayıt atlandı.`);
        return { valid: true, totalChecked, skippedLegacy };
    }

    /**
     * Kırılmış log zincirini onarır.
     * Tüm logların hash'lerini sıfırdan yeniden hesaplar ve günceller.
     * WORM middleware ile BİREBİR AYNI formül kullanılır.
     */
    async repairLogChain(): Promise<{ repaired: number; total: number }> {
        const logs = await this.prisma.auditLog.findMany({
            orderBy: { id: 'asc' },
        });

        let previousHash = '0';
        let repaired = 0;

        for (const log of logs) {
            const logData = {
                user: log.user || 'System',
                action: log.action,
                details: log.details,
                targetType: log.targetType || 'General',
                targetId: log.targetId,
                auditId: log.auditId,
                changeData: log.changeData,
                ipAddress: log.ipAddress
            };

            const hashInput = previousHash + JSON.stringify(logData);
            const calculatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

            // Eğer mevcut hash yanlışsa veya yoksa, düzelt
            if (log.hash !== calculatedHash || log.previousHash !== previousHash) {
                await this.prisma.auditLog.update({
                    where: { id: log.id },
                    data: {
                        hash: calculatedHash,
                        previousHash: previousHash
                    }
                });
                repaired++;
            }

            previousHash = calculatedHash;
        }

        this.logger.log(`Log zinciri onarıldı: ${repaired}/${logs.length} kayıt düzeltildi.`);
        return { repaired, total: logs.length };
    }
    async getAuditHistory(auditId: string) {
        return this.prisma.auditLog.findMany({
            where: {
                OR: [
                    { auditId: auditId },
                    { targetType: 'Audit', targetId: auditId }
                ]
            },
            orderBy: {
                date: 'desc'
            }
        });
    }
}
