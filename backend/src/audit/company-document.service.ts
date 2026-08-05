import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CompanyDocumentService {
    constructor(private prisma: PrismaService) {}

    async createDocument(data: {
        ad: string;
        tur: string;
        kod: string;
        versiyon?: string;
        yururlukTarihi: Date | string;
        sorumluBirimId?: string;
        dosyaId?: string;
        durum?: string;
        sonGozdenGecirmeTarihi?: Date | string;
        gozdenGecirmePeriyodu?: number;
    }) {
        if (!data.ad || !data.tur || !data.kod || !data.yururlukTarihi) {
            throw new BadRequestException('Doküman adı, türü, kodu ve yürürlük tarihi zorunludur.');
        }

        // Check unique code
        const existing = await this.prisma.companyDocument.findFirst({
            where: { kod: data.kod }
        });
        if (existing) {
            throw new BadRequestException(`"${data.kod}" kodlu şirket dokümanı zaten mevcut.`);
        }

        return this.prisma.companyDocument.create({
            data: {
                ad: data.ad,
                tur: data.tur,
                kod: data.kod,
                versiyon: data.versiyon || '1.0',
                yururlukTarihi: new Date(data.yururlukTarihi),
                sorumluBirimId: data.sorumluBirimId,
                dosyaId: data.dosyaId,
                durum: data.durum || 'Yürürlükte',
                sonGozdenGecirmeTarihi: data.sonGozdenGecirmeTarihi ? new Date(data.sonGozdenGecirmeTarihi) : new Date(data.yururlukTarihi),
                gozdenGecirmePeriyodu: data.gozdenGecirmePeriyodu || 12
            },
            include: {
                references: true
            }
        });
    }

    async updateVersion(id: string, data: {
        versiyon: string;
        ad?: string;
        durum?: string;
        sonGozdenGecirmeTarihi?: Date | string;
        dosyaId?: string;
        aciklama?: string;
    }) {
        const doc = await this.prisma.companyDocument.findUnique({ where: { id } });
        if (!doc) {
            throw new NotFoundException('Şirket dokümanı bulunamadı.');
        }

        return this.prisma.companyDocument.update({
            where: { id },
            data: {
                versiyon: data.versiyon,
                ad: data.ad || doc.ad,
                durum: data.durum || doc.durum,
                sonGozdenGecirmeTarihi: data.sonGozdenGecirmeTarihi ? new Date(data.sonGozdenGecirmeTarihi) : new Date(),
                dosyaId: data.dosyaId || doc.dosyaId
            },
            include: {
                references: true
            }
        });
    }

    async linkToFinding(data: {
        dokumanId: string;
        kaynakTuru: string; // BULGU, DENETIM, KONTROL
        kaynakId: string;
        aciklama?: string;
    }) {
        const doc = await this.prisma.companyDocument.findUnique({ where: { id: data.dokumanId } });
        if (!doc) {
            throw new NotFoundException('Atıf yapılacak şirket dokümanı bulunamadı.');
        }

        return this.prisma.documentReference.create({
            data: {
                dokumanId: data.dokumanId,
                kaynakTuru: data.kaynakTuru || 'BULGU',
                kaynakId: data.kaynakId,
                aciklama: data.aciklama
            },
            include: {
                dokuman: true
            }
        });
    }

    async getExpiringDocuments() {
        const allDocs = await this.prisma.companyDocument.findMany({
            where: { durum: 'Yürürlükte' },
            include: {
                references: true
            }
        });

        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return allDocs.filter(doc => {
            const baseDate = doc.sonGozdenGecirmeTarihi || doc.yururlukTarihi;
            const periodMonths = doc.gozdenGecirmePeriyodu || 12;
            const dueDate = new Date(baseDate);
            dueDate.setMonth(dueDate.getMonth() + periodMonths);

            return dueDate <= thirtyDaysLater;
        });
    }

    async getDocumentsByUnit(sorumluBirimId?: string) {
        const where: any = {};
        if (sorumluBirimId) {
            where.sorumluBirimId = sorumluBirimId;
        }

        return this.prisma.companyDocument.findMany({
            where,
            include: {
                references: true
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async getDocuments(params?: { tur?: string; durum?: string; search?: string }) {
        const where: any = {};
        if (params?.tur) where.tur = params.tur;
        if (params?.durum) where.durum = params.durum;
        if (params?.search) {
            where.OR = [
                { ad: { contains: params.search } },
                { kod: { contains: params.search } }
            ];
        }

        return this.prisma.companyDocument.findMany({
            where,
            include: {
                references: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getDocumentById(id: string) {
        const doc = await this.prisma.companyDocument.findUnique({
            where: { id },
            include: {
                references: true
            }
        });

        if (!doc) {
            throw new NotFoundException('Şirket dokümanı bulunamadı.');
        }

        return doc;
    }

    async getReferencesByEntity(kaynakTuru: string, kaynakId: string) {
        return this.prisma.documentReference.findMany({
            where: { kaynakTuru, kaynakId },
            include: {
                dokuman: true
            }
        });
    }
}
