import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EvidenceService {
    constructor(private prisma: PrismaService) {}

    async attachEvidence(data: {
        kaynakTuru: string;
        kaynakId: string;
        dosyaId?: string;
        ad: string;
        aciklama?: string;
        kanitTuru: string;
        eldeEdilmeYontemi?: string;
        eldeEdilmeTarihi?: Date | string;
        kaynagi?: string;
    }, userId: string) {
        if (!data.ad || !data.kaynakTuru || !data.kaynakId || !data.kanitTuru) {
            throw new BadRequestException('Kanıt adı, kaynak türü, kaynak ID ve kanıt türü zorunludur.');
        }

        return this.prisma.evidence.create({
            data: {
                kaynakTuru: data.kaynakTuru,
                kaynakId: data.kaynakId,
                dosyaId: data.dosyaId,
                ad: data.ad,
                aciklama: data.aciklama,
                kanitTuru: data.kanitTuru,
                eldeEdilmeYontemi: data.eldeEdilmeYontemi,
                eldeEdilmeTarihi: data.eldeEdilmeTarihi ? new Date(data.eldeEdilmeTarihi) : new Date(),
                kaynagi: data.kaynagi,
                yukleyenId: userId
            },
            include: {
                yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
            }
        });
    }

    async verifyEvidence(id: string, userId: string) {
        const evidence = await this.prisma.evidence.findUnique({ where: { id } });
        if (!evidence) {
            throw new NotFoundException('Kanıt kaydı bulunamadı.');
        }

        if (evidence.yukleyenId === userId) {
            throw new ForbiddenException('Kanıtı yükleyen kişi kendi yüklediği kanıtı doğrulayamaz.');
        }

        if (evidence.gecersizMi) {
            throw new BadRequestException('Geçersiz kılınmış bir kanıt doğrulanamaz.');
        }

        return this.prisma.evidence.update({
            where: { id },
            data: {
                dogrulandiMi: true,
                dogrulayanId: userId,
                dogrulamaTarihi: new Date()
            },
            include: {
                yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
            }
        });
    }

    async invalidateEvidence(id: string, gerekce: string, userId: string) {
        const evidence = await this.prisma.evidence.findUnique({ where: { id } });
        if (!evidence) {
            throw new NotFoundException('Kanıt kaydı bulunamadı.');
        }

        if (!gerekce || gerekce.trim().length === 0) {
            throw new BadRequestException('Kanıtı geçersiz kılmak için bir gerekçe belirtilmelidir.');
        }

        return this.prisma.evidence.update({
            where: { id },
            data: {
                gecersizMi: true,
                gecersizlikGerekcesi: gerekce.trim(),
                dogrulandiMi: false
            },
            include: {
                yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
            }
        });
    }

    async getEvidenceByEntity(kaynakTuru: string, kaynakId: string) {
        return this.prisma.evidence.findMany({
            where: { kaynakTuru, kaynakId },
            include: {
                yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getEvidenceChain(bulguId: string) {
        const finding = await this.prisma.finding.findUnique({
            where: { id: bulguId },
            include: {
                findingActions: true
            }
        });

        if (!finding) {
            throw new NotFoundException('Bulgu bulunamadı.');
        }

        // Direct finding evidence
        const directEvidences = await this.prisma.evidence.findMany({
            where: { kaynakTuru: 'BULGU', kaynakId: bulguId },
            include: {
                yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Action evidences
        const actionIds = (finding.findingActions || []).map(a => a.id);
        const actionEvidences = actionIds.length > 0 ? await this.prisma.evidence.findMany({
            where: { kaynakTuru: 'AKSIYON', kaynakId: { in: actionIds } },
            include: {
                yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        }) : [];

        // Audit program step evidences if finding has auditId
        let programStepEvidences: any[] = [];
        if (finding.auditId) {
            const steps = await this.prisma.auditProgramStep.findMany({
                where: { program: { auditId: finding.auditId } }
            });
            const stepIds = steps.map(s => s.id);
            if (stepIds.length > 0) {
                programStepEvidences = await this.prisma.evidence.findMany({
                    where: { kaynakTuru: 'PROGRAM_ADIMI', kaynakId: { in: stepIds } },
                    include: {
                        yukleyen: { select: { id: true, displayName: true, email: true, title: true } },
                        dogrulayan: { select: { id: true, displayName: true, email: true, title: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }
        }

        return {
            findingId: bulguId,
            findingTitle: finding.title,
            findingCode: finding.code || finding.id,
            directEvidences,
            actionEvidences,
            programStepEvidences,
            totalCount: directEvidences.length + actionEvidences.length + programStepEvidences.length
        };
    }
}
