import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        await this.$connect();

        // WORM (Write Once Read Many) - Blockchain-like AuditLog Middleware
        // Hash formülü: SHA-256(previousHash + JSON.stringify(logData))
        // Bu formül verifyLogIntegrity() ile BİREBİR AYNI olmalıdır.
        this.$use(async (params, next) => {
            if (params.model === 'AuditLog' && params.action === 'create') {
                try {
                    // Önceki kaydın hash'ini al (zincirleme)
                    const previousLog = await this.auditLog.findFirst({
                        orderBy: { id: 'desc' },
                        select: { hash: true }
                    });
                    
                    const previousHash = previousLog?.hash || '0';
                    const data = params.args.data;
                    
                    // Tekrarlanabilir hash şeması — verifyLogIntegrity() ile birebir aynı sıra
                    const logData = {
                        user: data.user || 'System',
                        action: data.action,
                        details: data.details,
                        targetType: data.targetType || 'General',
                        targetId: data.targetId,
                        auditId: data.auditId,
                        changeData: data.changeData,
                        ipAddress: data.ipAddress
                    };
                    
                    // Hash input: previousHash + logData (timestamp dahil ETMİYORUZ çünkü doğrulama sırasında tekrarlanamaz)
                    const hashInput = previousHash + JSON.stringify(logData);
                    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
                    
                    params.args.data = {
                        ...params.args.data,
                        previousHash,
                        hash
                    };
                } catch (e) {
                    this.logger.error('WORM Hash hesaplama hatası:', e);
                }
            }
            return next(params);
        });
        // Global CRUD Audit Trail Middleware (Merkezi İz Yönetimi)
        this.$use(async (params, next) => {
            const result = await next(params);
            
            // Eğer işlem kayıt edilecek bir CRUD işlemi ise Orijinal İşlemi bozmadan asenkron logla
            const isCrudAction = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert'].includes(params.action);
            const isNotAuditLog = !['AuditLog', 'Notification', 'SanctionLog', 'RefreshToken', 'VerificationToken'].includes(params.model || ''); // Ignore noise tables
            
            if (isCrudAction && isNotAuditLog && params.model) {
                try {
                    const actionMap: Record<string, string> = {
                        create: 'YENİ KAYIT',
                        update: 'GÜNCELLEME',
                        delete: 'SİLME',
                        createMany: 'TOPLU KAYIT',
                        updateMany: 'TOPLU GÜNCELLEME',
                        deleteMany: 'TOPLU SİLME',
                        upsert: 'KAYIT/GÜNCELLEME'
                    };

                    const actionVerbMap: Record<string, string> = {
                        create: 'oluşturuldu',
                        update: 'güncellendi',
                        delete: 'silindi',
                        createMany: 'toplu olarak oluşturuldu',
                        updateMany: 'toplu olarak güncellendi',
                        deleteMany: 'toplu olarak silindi',
                        upsert: 'kaydedildi'
                    };

                    const modelTranslator: Record<string, string> = {
                        Audit: 'Denetim planı',
                        Finding: 'Bulgu',
                        Action: 'Aksiyon planı',
                        AuditableUnit: 'Denetim birimi',
                        Process: 'Süreç',
                        Risk: 'Risk',
                        Control: 'Kontrol',
                        User: 'Kullanıcı hesabı',
                        Role: 'Kullanıcı rolü',
                        Document: 'Doküman',
                        Questionnaire: 'Soru formu',
                        Sample: 'Örneklem'
                    };

                    const trModel = modelTranslator[params.model as string] || params.model || 'Sistem';
                    const verb = actionVerbMap[params.action] || 'işlem gördü';

                    let targetId = params.args?.where?.id || result?.id || null;
                    if (!targetId && params.args?.data?.id) targetId = params.args.data.id;
                    
                    // Veriden güncelleyen/yaratan kişiyi bulmaya çalış
                    let actionUser = 'Sistem';
                    if (params.args?.data?.updatedBy) actionUser = params.args.data.updatedBy;
                    else if (params.args?.data?.createdBy) actionUser = params.args.data.createdBy;
                    else if (params.args?.data?.userId) actionUser = params.args.data.userId;
                    else if (params.args?.data?.deletedById) actionUser = params.args.data.deletedById;

                    // Şifre veya hassasiyet içeren alanları sansürle
                    const rawData = { ...(params.args?.data || {}) };
                    if (rawData.password) rawData.password = '***';
                    if (rawData.passwordHash) rawData.passwordHash = '***';
                    
                    const changeDataStr = params.action.includes('delete') ? null : JSON.stringify(rawData);

                    // AuditLog oluştur (Geçerli hashleme bu tabloda tetiklenecek WORM middleware ile kendi çalışacak)
                    await this.auditLog.create({
                        data: {
                            user: actionUser,
                            action: actionMap[params.action] || params.action.toUpperCase(),
                            details: `${trModel} ${verb}.`,
                            targetType: params.model,

                            targetId: targetId ? String(targetId) : null,
                            changeData: changeDataStr !== '{}' && changeDataStr !== 'null' ? changeDataStr : null
                        }
                    });
                } catch (e) {
                    this.logger.error('Global Audit Trail (CRUD Loglama) hatası:', e);
                }
            }
            
            return result;
        });

        this.logger.log('Veritabanı bağlantısı kuruldu. Mevzuat Uyumu ve Global İz (CRUD) Middleware aktif.');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
