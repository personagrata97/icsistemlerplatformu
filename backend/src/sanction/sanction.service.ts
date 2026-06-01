import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SanctionService {
    private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'icsistemler-platformu-secure-key-1234567890';
    private readonly IV_LENGTH = 16;
    private readonly logger = new Logger(SanctionService.name);

    private encrypt(text: string | null | undefined): string | null {
        if (!text) return null;
        try {
            const crypto = require('crypto');
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        } catch (e) {
            this.logger.error('Sanction Şifreleme hatası', e);
            throw new Error('Veri güvenliği ihlali: Şifreleme başarısız.');
        }
    }

    private decrypt(text: string | null | undefined): string | null {
        if (!text) return null;
        if (!text.includes(':')) return text; 
        try {
            const crypto = require('crypto');
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift()!, 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        } catch (e) {
            this.logger.error('Sanction Deşifre hatası', e);
            return '*** ŞİFRELİ VERİ (DEŞİFRE EDİLEMEDİ) ***';
        }
    }

    constructor(private prisma: PrismaService) { }

    async getLogs() {
        const logs = await this.prisma.sanctionLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });

        return logs.map((log: any) => ({
            ...log,
            details: this.decrypt(log.details)
        }));
    }

    async createLog(data: any) {
        return this.prisma.sanctionLog.create({
            data: {
                user: data.user,
                category: data.category,
                action: data.action,
                details: this.encrypt(data.details),
            }
        });
    }
}
