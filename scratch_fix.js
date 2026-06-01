const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'audit', 'audit.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const brokenBlock = `        const previousStatus = (audit as any).previousStatus || 'Planlandı';
        await this.prisma.audit.update({
            where: { id },
            data: {
                status: previousStatus,
                deletionReason: null,
                deletionComment: null
            }
                preparerId: user.id,
                preparedAt: new Date(),
            }
        });
    }`;

const fixedBlock = `        const previousStatus = (audit as any).previousStatus || 'Planlandı';
        await this.prisma.audit.update({
            where: { id },
            data: {
                status: previousStatus,
                deletionReason: null,
                deletionComment: null
            }
        });

        await this.auditLogService.createLog({ 
            user: user.displayName || user.username,
            action: 'Silme Talebi Reddedildi',
            details: \`Denetim "\${audit.auditCode || audit.title}" silme talebi reddedildi. Durum "\${previousStatus}" olarak geri alındı.\`,
            targetType: 'Audit',
            targetId: id
        });

        return { success: true, message: 'Denetim silme talebi reddedildi.' };
    }

    async uploadWorkpaper(auditId: string, file: any, category: string, user: any) {
        if (!file) throw new Error('Dosya yüklenmedi');

        const audit = await this.prisma.audit.findUnique({ where: { id: auditId } });
        if (!audit) throw new Error('Denetim bulunamadı');

        const uploadDir = path.join(process.cwd(), 'uploads', 'workpapers', auditId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const safeFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filePath = path.join(uploadDir, safeFilename);

        fs.writeFileSync(filePath, file.buffer);

        try {
            if (safeFilename.match(/\\.(pdf|docx|txt)$/i)) {
                this.logger.log(\`[Auditron AI] Oto-Aktarım başlatılıyor: \${safeFilename}\`);
                this.auditronService.processDocument(file.buffer, safeFilename, file.mimetype)
                    .then(res => this.logger.log(\`[Auditron AI Okundu]: \${res}\`))
                    .catch(e => this.logger.warn(\`[Auditron AI Başarısız]: \${e.message}\`));
            }
        } catch (e) {
            this.logger.warn(\`Auditron AI entegrasyonunda hata olustu ancak dosya yuklendi: \${e.message}\`);
        }

        return this.prisma.auditWorkpaper.create({
            data: {
                auditId: auditId,
                title: safeFilename,
                fileUrl: \`/secure-files/workpapers/\${auditId}/\${safeFilename}\`,
                fileType: safeFilename.split('.').pop()?.toUpperCase() || 'FILE',
                category: category || 'Genel',
                status: 'Taslak',
                version: 1,
                preparerId: user.id,
                preparedAt: new Date(),
            }
        });
    }`;

if (content.includes(brokenBlock)) {
    content = content.replace(brokenBlock, fixedBlock);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully fixed audit.service.ts!");
} else {
    // Try with normalized newlines
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedBroken = brokenBlock.replace(/\r\n/g, '\n');
    const normalizedFixed = fixedBlock.replace(/\r\n/g, '\n');
    
    if (normalizedContent.includes(normalizedBroken)) {
        const fixedContent = normalizedContent.replace(normalizedBroken, normalizedFixed);
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log("Successfully fixed audit.service.ts using normalization!");
    } else {
        console.log("Could not find the broken block in audit.service.ts");
    }
}
