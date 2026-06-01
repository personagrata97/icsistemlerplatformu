import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WorkpaperTemplate } from '@prisma/client';

@Injectable()
export class WorkpaperTemplateService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<WorkpaperTemplate[]> {
        return this.prisma.workpaperTemplate.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }

    async findOne(id: string): Promise<WorkpaperTemplate> {
        const template = await this.prisma.workpaperTemplate.findUnique({
            where: { id }
        });
        if (!template) throw new NotFoundException('Şablon bulunamadı');
        return template;
    }

    async create(data: any): Promise<WorkpaperTemplate> {
        return this.prisma.workpaperTemplate.create({
            data: {
                name: data.name,
                code: data.code,
                category: data.category,
                description: data.description,
                templatePath: data.templatePath,
                format: data.format,
                isActive: true
            }
        });
    }

    async update(id: string, data: any): Promise<WorkpaperTemplate> {
        return this.prisma.workpaperTemplate.update({
            where: { id },
            data
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.workpaperTemplate.delete({ where: { id } });
    }

    // Seed initial templates if none exist
    async seedTemplates() {
        const count = await this.prisma.workpaperTemplate.count();
        if (count > 0) return;

        const templates = [
            { name: 'Nakit Sayım Tutanağı', code: 'WP-CASH-01', category: 'Varlıklar', format: 'XLSX', templatePath: '/templates/cash_count.xlsx' },
            { name: 'Kasa Denetim Formu', code: 'WP-CASH-02', category: 'Varlıklar', format: 'XLSX', templatePath: '/templates/vault_audit.xlsx' },
            { name: 'Mudi Hesapları Doğrulama', code: 'WP-DEP-01', category: 'Yükümlülükler', format: 'DOCX', templatePath: '/templates/dep_confirm.docx' },
            { name: 'Kredi Dosya İnceleme', code: 'WP-LOAN-01', category: 'Aktif İşlemler', format: 'XLSX', templatePath: '/templates/loan_review.xlsx' },
        ];

        for (const t of templates) {
            await this.create(t);
        }
    }
}
