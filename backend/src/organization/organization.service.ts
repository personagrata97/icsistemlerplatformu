import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class OrganizationService implements OnModuleInit {
    private readonly logger = new Logger(OrganizationService.name);

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.seedInitialOrgUnits();
        await this.seedInitialJobTitles();
    }

    private async seedInitialOrgUnits() {
        const count = await this.prisma.orgUnit.count();
        if (count > 0) return;

        this.logger.log('Seeding initial OrgUnits...');
        const yk = await this.prisma.orgUnit.create({
            data: { code: 'YK', name: 'Yönetim Kurulu', type: 'Genel Müdürlük', level: 1, sortOrder: 1 }
        });

        await this.prisma.orgUnit.createMany({
            data: [
                { code: 'TEFTIS', name: 'Teftiş Kurulu Müdürlüğü', type: 'Müdürlük', parentId: yk.id, level: 2, sortOrder: 1 },
                { code: 'IC_KONTROL', name: 'İç Kontrol ve Uyum Müdürlüğü', type: 'Müdürlük', parentId: yk.id, level: 2, sortOrder: 2 },
                { code: 'RISK_YONETIMI', name: 'Risk Yönetimi Müdürlüğü', type: 'Müdürlük', parentId: yk.id, level: 2, sortOrder: 3 },
            ]
        });

        const gm = await this.prisma.orgUnit.create({
            data: { code: 'GM', name: 'Genel Müdürlük', type: 'Genel Müdürlük', level: 1, sortOrder: 2 }
        });

        const hazine = await this.prisma.orgUnit.create({
            data: { code: 'HAZINE_GMY', name: 'Hazine ve Mali İşler Genel Müdür Yardımcılığı', type: 'Direktörlük', parentId: gm.id, level: 2, sortOrder: 1 }
        });

        const mali = await this.prisma.orgUnit.create({
            data: { code: 'MALI_DIR', name: 'Mali İşler Direktörlüğü', type: 'Direktörlük', parentId: hazine.id, level: 3, sortOrder: 1 }
        });

        await this.prisma.orgUnit.createMany({
            data: [
                { code: 'MUHASEBE_SRV', name: 'Muhasebe Servisi', type: 'Servis', parentId: mali.id, level: 4, sortOrder: 1 },
                { code: 'BUTCE_SRV', name: 'Bütçe ve Raporlama Servisi', type: 'Servis', parentId: mali.id, level: 4, sortOrder: 2 },
                { code: 'FINANS_SRV', name: 'Finans Servisi', type: 'Servis', parentId: mali.id, level: 4, sortOrder: 3 },
            ]
        });

        const ops = await this.prisma.orgUnit.create({
            data: { code: 'OPS_GMY', name: 'Operasyon Genel Müdür Yardımcılığı', type: 'Direktörlük', parentId: gm.id, level: 2, sortOrder: 2 }
        });

        await this.prisma.orgUnit.createMany({
            data: [
                { code: 'OPS_SRV', name: 'Operasyon Servisi', type: 'Servis', parentId: ops.id, level: 3, sortOrder: 1 },
                { code: 'TAHSISAT_SRV', name: 'Tahsisat Servisi', type: 'Servis', parentId: ops.id, level: 3, sortOrder: 2 },
            ]
        });

        const bt = await this.prisma.orgUnit.create({
            data: { code: 'BT_MUD', name: 'Bilgi Teknolojileri Müdürlüğü', type: 'Müdürlük', parentId: gm.id, level: 2, sortOrder: 3 }
        });

        await this.prisma.orgUnit.create({
            data: { code: 'BT_SRV', name: 'Bilgi Teknolojileri Servisi', type: 'Servis', parentId: bt.id, level: 3, sortOrder: 1 }
        });
    }

    private async seedInitialJobTitles() {
        const count = await this.prisma.jobTitle.count();
        if (count > 0) return;

        this.logger.log('Seeding initial JobTitles...');
        await this.prisma.jobTitle.createMany({
            data: [
                // Audit
                { name: 'Müfettiş Yardımcısı', module: 'audit', cadre: 1 },
                { name: 'Müfettiş', module: 'audit', cadre: 2 },
                { name: 'Başmüfettiş', module: 'audit', cadre: 3 },
                { name: 'Teftiş Kurulu Müdürü', module: 'audit', cadre: 4 },
                // Control
                { name: 'Denetçi Yardımcısı', module: 'control', cadre: 1 },
                { name: 'Yetkili Denetçi Yardımcısı', module: 'control', cadre: 2 },
                { name: 'Denetçi', module: 'control', cadre: 3 },
                { name: 'Başdenetçi', module: 'control', cadre: 4 },
                { name: 'İç Kontrol Müdürü', module: 'control', cadre: 5 },
                // Risk
                { name: 'Risk Yönetimi Uzman Yardımcısı', module: 'risk', cadre: 1 },
                { name: 'Risk Yönetimi Uzmanı', module: 'risk', cadre: 2 },
                { name: 'Risk Yönetimi Yönetmen Yardımcısı', module: 'risk', cadre: 3 },
                { name: 'Risk Yönetimi Yönetmeni', module: 'risk', cadre: 4 },
                { name: 'Risk Yönetimi Müdürü', module: 'risk', cadre: 5 },
                // Sanction / Uyum
                { name: 'Uyum Uzman Yardımcısı', module: 'sanction', cadre: 1 },
                { name: 'Uyum Uzmanı', module: 'sanction', cadre: 2 },
                { name: 'Uyum Görevlisi / Müdürü', module: 'sanction', cadre: 3 },
                // Genel
                { name: 'Uzman Yardımcısı', module: 'genel', cadre: 1 },
                { name: 'Uzman', module: 'genel', cadre: 2 },
                { name: 'Yönetmen', module: 'genel', cadre: 3 },
                { name: 'Müdür', module: 'genel', cadre: 4 },
                { name: 'Direktör', module: 'genel', cadre: 5 },
                { name: 'Genel Müdür Yardımcısı', module: 'genel', cadre: 6 },
            ]
        });
    }

    // --- OrgUnit methods ---
    async getTree() {
        const units = await this.prisma.orgUnit.findMany({
            orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
        });

        const nodeMap = new Map<string, any>();
        const roots: any[] = [];

        for (const unit of units) {
            nodeMap.set(unit.id, {
                ...unit,
                title: unit.name,
                children: []
            });
        }

        for (const unit of units) {
            const node = nodeMap.get(unit.id);
            if (unit.parentId && nodeMap.has(unit.parentId)) {
                nodeMap.get(unit.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        }

        return roots;
    }

    async getUnits() {
        return this.prisma.orgUnit.findMany({
            orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
        });
    }

    async createNode(data: any) {
        const code = data.code || `ORG_${Date.now()}`;
        let level = 1;
        if (data.parentId) {
            const parent = await this.prisma.orgUnit.findUnique({ where: { id: data.parentId } });
            if (parent) level = parent.level + 1;
        }

        return this.prisma.orgUnit.create({
            data: {
                code,
                name: data.name,
                type: data.type || 'Müdürlük',
                parentId: data.parentId || null,
                level,
                sortOrder: data.sortOrder ? parseInt(data.sortOrder) : 0,
                isActive: data.isActive !== false,
            }
        });
    }

    async updateNode(id: string, data: any) {
        let level = data.level;
        if (data.parentId) {
            const parent = await this.prisma.orgUnit.findUnique({ where: { id: data.parentId } });
            if (parent) level = parent.level + 1;
        }

        return this.prisma.orgUnit.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.code && { code: data.code }),
                ...(data.type && { type: data.type }),
                ...(data.parentId !== undefined && { parentId: data.parentId || null }),
                ...(level !== undefined && { level }),
                ...(data.sortOrder !== undefined && { sortOrder: parseInt(data.sortOrder) }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            }
        });
    }

    async deleteNode(id: string) {
        return this.prisma.orgUnit.update({
            where: { id },
            data: { isActive: false }
        });
    }

    // --- JobTitle methods ---
    async getJobTitles(module?: string) {
        return this.prisma.jobTitle.findMany({
            where: module ? { module } : undefined,
            orderBy: [{ module: 'asc' }, { cadre: 'asc' }, { name: 'asc' }],
            include: { unit: true }
        });
    }

    async createJobTitle(data: any) {
        return this.prisma.jobTitle.create({
            data: {
                name: data.name,
                module: data.module || 'genel',
                cadre: data.cadre ? parseInt(data.cadre) : 1,
                unitId: data.unitId || null,
                isActive: data.isActive !== false,
            }
        });
    }

    async updateJobTitle(id: string, data: any) {
        return this.prisma.jobTitle.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.module && { module: data.module }),
                ...(data.cadre !== undefined && { cadre: parseInt(data.cadre) }),
                ...(data.unitId !== undefined && { unitId: data.unitId || null }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            }
        });
    }

    async deleteJobTitle(id: string) {
        return this.prisma.jobTitle.update({
            where: { id },
            data: { isActive: false }
        });
    }
}
