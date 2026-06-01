import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WorkpaperService {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService
    ) { }

    async getWorkpapers(auditId: string) {
        const wps = await this.prisma.auditWorkpaper.findMany({
            where: { auditId, isDeleted: false },
            include: {
                preparer: { select: { id: true, displayName: true, title: true } },
                reviewer: { select: { id: true, displayName: true, title: true } },
                lockedBy: { select: { id: true, displayName: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        return Promise.all(wps.map(async (wp) => {
            let size = 0;
            try {
                const filePath = await this.getWorkpaperAbsolutePath(wp);
                if (fs.existsSync(filePath)) {
                    size = fs.statSync(filePath).size;
                }
            } catch (e) {
                console.error('File size error:', e);
            }
            const plainWp = JSON.parse(JSON.stringify(wp));
            return { ...plainWp, size };
        }));
    }

    async createWorkpaper(auditId: string, userId: string, data: any) {
        return this.prisma.auditWorkpaper.create({
            data: {
                auditId,
                title: data.title,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                category: data.category,
                status: 'Taslak',
                version: 1,
                preparerId: userId,
                preparedAt: new Date()
            }
        });
    }

    async uploadAndCreateWorkpaper(auditId: string, userId: string, file: any, category: string) {
        if (!file) throw new Error('Dosya yüklenmedi');

        const uploadDir = path.join(process.cwd(), 'uploads', 'workpapers', auditId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeFilename = `${Date.now()}_${Buffer.from(file.originalname, 'latin1').toString('utf8')}`;
        const filePath = path.join(uploadDir, safeFilename);

        fs.writeFileSync(filePath, file.buffer);

        // Dosya türünü belirle
        const ext = path.extname(safeFilename).toLowerCase();
        let fileType = 'Diğer';
        if (['.pdf'].includes(ext)) fileType = 'PDF';
        else if (['.doc', '.docx'].includes(ext)) fileType = 'Word';
        else if (['.xls', '.xlsx'].includes(ext)) fileType = 'Excel';
        else if (['.jpg', '.png', '.jpeg'].includes(ext)) fileType = 'Resim';

        const wp = await this.prisma.auditWorkpaper.create({
            data: {
                auditId,
                title: Buffer.from(file.originalname, 'latin1').toString('utf8'),
                fileUrl: `/secure-files/workpapers/${auditId}/${safeFilename}`,
                fileType: fileType,
                category: category || 'Genel',
                status: 'Taslak',
                version: 1,
                preparerId: userId,
                preparedAt: new Date()
            },
            include: {
                preparer: { select: { id: true, displayName: true, title: true } }
            }
        });

        const plainWp = JSON.parse(JSON.stringify(wp));
        let size = 0;
        try {
            if (fs.existsSync(filePath)) {
                size = fs.statSync(filePath).size;
            } else if (file.buffer) {
                size = file.buffer.length;
            }
        } catch (e) {
            if (file.buffer) size = file.buffer.length;
        }

        return { ...plainWp, size };
    }

    // ============================================
    // VERSİYON GEÇMİŞİ (AuditWorkpaperHistory)
    // ============================================

    async getWorkpaperHistory(id: string) {
        return this.prisma.auditWorkpaperHistory.findMany({
            where: { workpaperId: id },
            orderBy: { version: 'desc' }
        });
    }

    async updateWorkpaperFile(id: string, userId: string, file: any) {
        if (!file) throw new Error('Dosya yüklenmedi');

        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı.');

        // 1. Kilit kontrolü: Kilitliyse sadece kilitleyen kişi güncelleyebilir
        if (wp.lockedById && wp.lockedById !== userId) {
            throw new Error('Bu çalışma kağıdı başka bir kullanıcı tarafından kilitlenmiş.');
        }

        // 2. Mevcut versiyonu History tablosuna kopyala (Geçmiş versiyonlama yaklaşımı)
        await this.prisma.auditWorkpaperHistory.create({
            data: {
                workpaperId: wp.id,
                version: wp.version,
                fileUrl: wp.fileUrl,
                fileType: wp.fileType,
                storedFileName: wp.title,
                changeReason: 'Yeni versiyon yüklendi',
                createdBy: userId
            }
        });

        // 3. Yeni dosyayı diske kaydet
        const uploadDir = path.join(process.cwd(), 'uploads', 'workpapers', wp.auditId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeFilename = `${Date.now()}_${Buffer.from(file.originalname, 'latin1').toString('utf8')}`;
        const filePath = path.join(uploadDir, safeFilename);
        fs.writeFileSync(filePath, file.buffer);

        // Dosya türünü belirle
        const ext = path.extname(safeFilename).toLowerCase();
        let fileType = 'Diğer';
        if (['.pdf'].includes(ext)) fileType = 'PDF';
        else if (['.doc', '.docx'].includes(ext)) fileType = 'Word';
        else if (['.xls', '.xlsx'].includes(ext)) fileType = 'Excel';
        else if (['.jpg', '.png', '.jpeg'].includes(ext)) fileType = 'Resim';

        // 4. Ana çalışma kağıdını (şimdiki zamanı) güncelle
        return this.prisma.auditWorkpaper.update({
            where: { id },
            data: {
                title: Buffer.from(file.originalname, 'latin1').toString('utf8'),
                fileUrl: `/secure-files/workpapers/${wp.auditId}/${safeFilename}`,
                fileType: fileType,
                version: { increment: 1 },
                status: 'Taslak' // Yeni dosya yüklendiğinde taslağa döner
            }
        });
    }

    // ============================================
    // KİLİTLEME MEKANİZMASI (Check-out / Check-in)
    // ============================================

    /**
     * Çalışma kağıdını kilitle (Check-out).
     * Başka bir kullanıcı kilitliyken üzerinde değişiklik yapılamaz.
     */
    async lockWorkpaper(id: string, userId: string) {
        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı.');

        if (wp.lockedById && wp.lockedById !== userId) {
            throw new Error('Bu çalışma kağıdı başka bir kullanıcı tarafından düzenlenmektedir. Lütfen kilidi kaldırmasını bekleyin.');
        }

        return this.prisma.auditWorkpaper.update({
            where: { id },
            data: {
                lockedById: userId,
                lockedAt: new Date()
            },
            include: {
                lockedBy: { select: { id: true, displayName: true } }
            }
        });
    }

    /**
     * Çalışma kağıdının kilidini kaldır (Check-in).
     * Yalnızca kilitleyen kişi veya yöneticiler kaldırabilir.
     */
    async unlockWorkpaper(id: string, userId: string, isAdmin: boolean = false) {
        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı.');

        if (wp.lockedById && wp.lockedById !== userId && !isAdmin) {
            throw new Error('Bu çalışma kağıdının kilidini yalnızca kilitleyen kişi veya yöneticiler kaldırabilir.');
        }

        return this.prisma.auditWorkpaper.update({
            where: { id },
            data: {
                lockedById: null,
                lockedAt: null,
                version: { increment: 1 } // Her kilit kaldırma işlemini yeni bir versiyon olarak say
            }
        });
    }

    // ============================================
    // GÖZDEN GEÇİRME (Sign-Off / Review)
    // ============================================

    async signOffWorkpaper(id: string, userId: string, role: 'REVIEWER' | 'SUPERVISOR') {
        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı');

        // Kilitli bir çalışma kağıdı onaylanamaz
        if (wp.lockedById) {
            throw new Error('Düzenleme kilidi bulunan bir çalışma kağıdı gözden geçirilemez. Önce kilidi kaldırılmalıdır.');
        }

        if (role === 'REVIEWER') {
            // Gözden geçirme — Taslak veya Revizyon Bekliyor → Gözden Geçirildi
            if (wp.status !== 'Taslak' && wp.status !== 'Revizyon Bekliyor') {
                throw new Error(`Gözden geçirme yalnızca "Taslak" veya "Revizyon Bekliyor" durumundaki çalışma kağıtlarına yapılabilir. Mevcut durum: ${wp.status}`);
            }
            return this.prisma.auditWorkpaper.update({
                where: { id },
                data: {
                    status: 'Gözden Geçirildi',
                    reviewerId: userId,
                    reviewedAt: new Date()
                }
            });
        }

        if (role === 'SUPERVISOR') {
            // Üst kademe onay — Gözden Geçirildi → Onaylandı
            if (wp.status !== 'Gözden Geçirildi') {
                throw new Error('Supervisor onayı yalnızca gözden geçirme tamamlanmış çalışma kağıtlarına yapılabilir. Önce gözden geçirme (REVIEWER) imzası gereklidir.');
            }
            // Supervisor kendisi reviewer olamaz
            if (wp.reviewerId === userId) {
                throw new Error('Gözden geçiren ve onaylayan aynı kişi olamaz. Bu kural, denetim bağımsızlığını korumak içindir.');
            }
            return this.prisma.auditWorkpaper.update({
                where: { id },
                data: {
                    status: 'Onaylandı',
                    supervisorId: userId,
                    supervisorApprovedAt: new Date()
                }
            });
        }
    }

    /**
     * Revizyon Notu ile Geri Gönder.
     * Gözden geçiren kişi eksiklik tespit ederse, çalışma kağıdını "Revizyon Bekliyor" 
     * statüsüne çeker ve denetçiye not bırakır. Versiyon artırılır.
     */
    async requestRevision(id: string, reviewerId: string, revisionNotes: string) {
        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı.');

        // Add revision note as ReviewNote
        await this.prisma.reviewNote.create({
            data: {
                text: revisionNotes,
                authorId: reviewerId,
                authorName: 'Sistem / Reviewer', 
                type: 'CALISMA_KAGIDI',
                workpaperId: wp.id
            }
        });

        return this.prisma.auditWorkpaper.update({
            where: { id },
            data: {
                status: 'Revizyon Bekliyor',
                reviewerId: reviewerId,
                version: { increment: 1 }
            }
        });
    }

    // ============================================
    // SİLME KORUMASI
    // ============================================

    async deleteWorkpaper(id: string, userId?: string) {
        const wp = await this.prisma.auditWorkpaper.findUnique({ where: { id } });
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı.');

        // Gözden geçirilmiş veya Onaylanmış belgelerin silinmesini engelle
        if (wp.status === 'Gözden Geçirildi' || wp.status === 'Onaylandı') {
            throw new Error('Gözden geçirme tamamlanmış veya onaylanmış çalışma kağıtları silinemez. Lütfen yöneticinize başvurun.');
        }

        // Kilitli çalışma kağıdı silinemez
        if (wp.lockedById) {
            throw new Error('Düzenleme kilidi bulunan bir çalışma kağıdı silinemez. Önce kilidi kaldırın.');
        }

        // Kalıcı silme yerine "Soft Delete" kullan
        return this.prisma.auditWorkpaper.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: userId || null,
                deletionReason: 'Kullanıcı tarafından silindi'
            }
        });
    }

    // ============================================
    // ŞABLONDAN OLUŞTURMA
    // ============================================

    async createFromTemplate(auditId: string, userId: string, templateId: string) {
        const template = await this.prisma.workpaperTemplate.findUnique({
            where: { id: templateId }
        });
        if (!template) throw new Error('Şablon bulunamadı');

        return this.prisma.auditWorkpaper.create({
            data: {
                auditId,
                title: template.name,
                fileUrl: template.templatePath,
                fileType: template.format,
                category: template.category,
                status: 'Taslak',
                version: 1,
                preparerId: userId,
                preparedAt: new Date()
            }
        });
    }

    async getWorkpaperById(id: string) {
        return this.prisma.auditWorkpaper.findUnique({
            where: { id }
        });
    }

    /**
     * Çalışma kağıdının sunucudaki tam yolunu döner.
     */
    async getWorkpaperAbsolutePath(wp: any): Promise<string> {
        // fileUrl formatı: /secure-files/workpapers/[auditId]/[filename]
        // Not: Eğer şablon ise fileUrl farklı olabilir.
        if (wp.fileUrl.startsWith('/secure-files/workpapers/')) {
            const parts = wp.fileUrl.split('/');
            const filename = parts[parts.length - 1];
            const auditId = wp.auditId;
            return path.join(process.cwd(), 'uploads', 'workpapers', auditId, filename);
        }
        
        // Eğer uploads altındaysa (statik)
        if (wp.fileUrl.startsWith('/uploads/')) {
             return path.join(process.cwd(), wp.fileUrl.replace('/uploads/', 'uploads/'));
        }

        return path.join(process.cwd(), wp.fileUrl);
    }

    async logDownload(wp: any, user: any) {
        await this.auditLogService.createLog({
            user: user?.displayName || user?.username || 'Sistem',
            action: 'ÇALIŞMA_KAĞIDI_İNDİRİLDİ',
            details: `Çalışma kağıdı dosyası indirildi: ${wp.title} (${wp.fileUrl})`,
            targetType: 'Workpaper',
            targetId: wp.id,
            auditId: wp.auditId
        });
    }
}
