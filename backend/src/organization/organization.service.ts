import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class OrganizationService {
    private readonly logger = new Logger(OrganizationService.name);

    constructor(private prisma: PrismaService) { }

    // Build hierarchical tree from flat AuditableUnit records
    async getTree() {
        const units = await this.prisma.auditableUnit.findMany({
            orderBy: { name: 'asc' }
        });

        // Convert flat list to tree structure
        const nodeMap = new Map<string, any>();
        const roots: any[] = [];

        // First pass: create node objects
        for (const unit of units) {
            nodeMap.set(unit.id, {
                id: unit.id,
                name: unit.name,
                type: unit.type,
                parentId: unit.parentId,
                manager: unit.manager,
                riskScore: unit.riskScore,
                auditCycle: unit.auditCycle ? `${unit.auditCycle} yıl` : null,
                isActive: unit.status === 'Aktif',
                children: []
            });
        }

        // Second pass: build parent-child relationships
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

    async createNode(data: any) {
        // Parse auditCycle from string like "3 yıl" to number
        let auditCycleNum: number | null = null;
        if (data.auditCycle) {
            const match = String(data.auditCycle).match(/(\d+)/);
            if (match) auditCycleNum = parseInt(match[1]);
        }

        const unit = await this.prisma.auditableUnit.create({
            data: {
                name: data.name,
                type: data.type || 'Birim',
                parentId: data.parentId || null,
                manager: data.manager || null,
                riskLevel: 'Orta',
                riskScore: data.riskScore || null,
                auditCycle: auditCycleNum,
                status: data.isActive === false ? 'Pasif' : 'Aktif',
            }
        });

        this.logger.log(`Organization node created: ${unit.id} - ${unit.name}`);
        return {
            id: unit.id,
            name: unit.name,
            type: unit.type,
            parentId: unit.parentId,
            manager: unit.manager,
            riskScore: unit.riskScore,
            auditCycle: unit.auditCycle ? `${unit.auditCycle} yıl` : null,
            isActive: unit.status === 'Aktif',
            children: []
        };
    }

    async updateNode(id: string, data: any) {
        let auditCycleNum: number | undefined = undefined;
        if (data.auditCycle !== undefined) {
            const match = String(data.auditCycle).match(/(\d+)/);
            auditCycleNum = match ? parseInt(match[1]) : undefined;
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
        if (data.manager !== undefined) updateData.manager = data.manager;
        if (data.riskScore !== undefined) updateData.riskScore = data.riskScore;
        if (auditCycleNum !== undefined) updateData.auditCycle = auditCycleNum;
        if (data.isActive !== undefined) updateData.status = data.isActive ? 'Aktif' : 'Pasif';

        const unit = await this.prisma.auditableUnit.update({
            where: { id },
            data: updateData
        });

        this.logger.log(`Organization node updated: ${unit.id} - ${unit.name}`);
        return {
            id: unit.id,
            name: unit.name,
            type: unit.type,
            parentId: unit.parentId,
            manager: unit.manager,
            riskScore: unit.riskScore,
            auditCycle: unit.auditCycle ? `${unit.auditCycle} yıl` : null,
            isActive: unit.status === 'Aktif',
        };
    }

    async deleteNode(id: string) {
        // First, re-parent children to this node's parent
        const node = await this.prisma.auditableUnit.findUnique({ where: { id } });
        if (!node) throw new Error('Birim bulunamadı');

        await this.prisma.auditableUnit.updateMany({
            where: { parentId: id },
            data: { parentId: node.parentId }
        });

        await this.prisma.auditableUnit.delete({ where: { id } });
        this.logger.log(`Organization node deleted: ${id}`);
        return { success: true, message: 'Birim silindi' };
    }
}
