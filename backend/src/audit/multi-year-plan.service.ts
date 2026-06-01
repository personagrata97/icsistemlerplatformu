import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MultiYearPlan, MultiYearPlanItem } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MultiYearPlanService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<MultiYearPlan[]> {
        return this.prisma.multiYearPlan.findMany({
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async findOne(id: string): Promise<MultiYearPlan & { items: (MultiYearPlanItem & { unit: { name: string; riskLevel: string } })[] }> {
        const plan = await this.prisma.multiYearPlan.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        unit: {
                            select: {
                                name: true,
                                riskLevel: true
                            }
                        }
                    },
                    orderBy: { year: 'asc' }
                }
            }
        });

        if (!plan) throw new NotFoundException('Çok yıllık plan bulunamadı');
        return plan;
    }

    async create(data: any): Promise<MultiYearPlan> {
        // data: title, startYear, endYear, description
        return this.prisma.multiYearPlan.create({
            data: {
                title: data.title,
                startYear: data.startYear,
                endYear: data.endYear,
                description: data.description,
                status: 'Taslak'
            }
        });
    }

    async update(id: string, data: any, user?: any): Promise<MultiYearPlan> {
        const approverName = user?.displayName || user?.username || 'Bilinmeyen Kullanıcı';
        return this.prisma.multiYearPlan.update({
            where: { id },
            data: {
                title: data.title,
                startYear: data.startYear,
                endYear: data.endYear,
                description: data.description,
                status: data.status,
                approvedBy: data.status === 'Onaylandı' ? approverName : undefined,
                approvedAt: data.status === 'Onaylandı' ? new Date() : undefined
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.multiYearPlan.delete({ where: { id } });
    }

    async addItem(planId: string, data: any): Promise<MultiYearPlanItem> {
        return this.prisma.multiYearPlanItem.create({
            data: {
                planId,
                unitId: data.unitId,
                year: data.year,
                quarter: data.quarter,
                priority: data.priority,
                estimatedDays: data.estimatedDays,
                notes: data.notes
            }
        });
    }

    async updateItem(itemId: string, data: any): Promise<MultiYearPlanItem> {
        return this.prisma.multiYearPlanItem.update({
            where: { id: itemId },
            data: {
                year: data.year,
                quarter: data.quarter,
                priority: data.priority,
                estimatedDays: data.estimatedDays,
                notes: data.notes,
                status: data.status
            }
        });
    }

    async deleteItem(itemId: string): Promise<void> {
        await this.prisma.multiYearPlanItem.delete({ where: { id: itemId } });
    }

    async approve(id: string, user: any): Promise<MultiYearPlan> {
        return this.prisma.multiYearPlan.update({
            where: { id },
            data: {
                status: 'Onaylandı',
                approvedBy: user?.displayName || 'Sistem Yöneticisi',
                approvedAt: new Date()
            }
        });
    }

    async exportToExcel(id: string): Promise<string> {
        const plan = await this.findOne(id);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Çok Yıllık Plan');

        // Headers
        worksheet.columns = [
            { header: 'Denetim Birimi', key: 'unit', width: 30 },
            { header: 'Risk Seviyesi', key: 'risk', width: 15 },
            { header: 'Yıl', key: 'year', width: 10 },
            { header: 'Çeyrek', key: 'quarter', width: 10 },
            { header: 'Öncelik', key: 'priority', width: 15 },
            { header: 'Tahmini Gün', key: 'days', width: 15 },
            { header: 'Notlar', key: 'notes', width: 40 }
        ];

        // Content
        plan.items.forEach(item => {
            worksheet.addRow({
                unit: item.unit.name,
                risk: item.unit.riskLevel,
                year: item.year,
                quarter: item.quarter,
                priority: item.priority,
                days: item.estimatedDays,
                notes: item.notes
            });
        });

        // Styling
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF009C45' } // Brand Green
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        const uploadDir = path.join(process.cwd(), 'uploads', 'plans');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const filename = `PLAN_${id}_${Date.now()}.xlsx`;
        const filePath = path.join(uploadDir, filename);
        await workbook.xlsx.writeFile(filePath);

        return filename;
    }
}
