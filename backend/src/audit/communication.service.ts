import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class CommunicationService {
    private readonly logger = new Logger(CommunicationService.name);

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) {}

    // ===========================
    // COMMUNICATIONS (Mektuplar vs)
    // ===========================
    async getCommunications(auditId: string) {
        return this.prisma.auditCommunication.findMany({
            where: { auditId },
            include: {
                sentBy: { select: { id: true, displayName: true, title: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getCommunicationById(id: string) {
        return this.prisma.auditCommunication.findUnique({
            where: { id },
            include: {
                sentBy: { select: { id: true, displayName: true, title: true } },
                audit: { select: { id: true, title: true, auditCode: true } }
            }
        });
    }

    async createCommunication(auditId: string, userId: string, data: any) {
        const result = await this.prisma.auditCommunication.create({
            data: {
                auditId,
                type: data.type,
                subject: data.subject,
                content: data.content,
                status: data.status || 'Taslak',
                sentById: data.status === 'Gönderildi' ? userId : null,
                sentAt: data.status === 'Gönderildi' ? new Date() : null,
            },
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'Resmi Yazışma Oluşturuldu',
            details: `Denetim ${auditId} için ${data.type || 'Resmi Yazı'} oluşturuldu: "${data.subject}"`,
            targetType: 'Audit',
            targetId: auditId,
        });

        return result;
    }

    async updateCommunication(id: string, userId: string, data: any) {
        const result = await this.prisma.auditCommunication.update({
            where: { id },
            data: {
                subject: data.subject,
                content: data.content,
                status: data.status,
                sentById: data.status === 'Gönderildi' ? userId : undefined,
                sentAt: data.status === 'Gönderildi' ? new Date() : undefined,
            }
        });

        await this.auditLogService.createLog({
            user: userId || 'SYSTEM',
            action: 'Resmi Yazışma Güncellendi',
            details: `Yazışma ${id} güncellendi — Durum: ${data.status}`,
            targetType: 'Audit',
            targetId: result.auditId,
        });

        return result;
    }

    async deleteCommunication(id: string) {
        const comm = await this.prisma.auditCommunication.findUnique({ where: { id } });
        const result = await this.prisma.auditCommunication.delete({
            where: { id }
        });

        if (comm) {
            await this.auditLogService.createLog({
                user: 'SYSTEM',
                action: 'Resmi Yazışma Silindi',
                details: `Yazışma ${id} (${comm.subject}) silindi`,
                targetType: 'Audit',
                targetId: comm.auditId,
            });
        }

        return result;
    }

    // ===========================
    // MEETINGS (Açılış/Kapanış)
    // ===========================
    async getMeetings(auditId: string) {
        return this.prisma.auditMeeting.findMany({
            where: { auditId },
            orderBy: { meetingDate: 'asc' }
        });
    }

    async createMeeting(auditId: string, data: any) {
        const result = await this.prisma.auditMeeting.create({
            data: {
                auditId,
                type: data.type,
                title: data.title,
                meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
                location: data.location,
                agenda: data.agenda,
                minutes: data.minutes,
                attendees: data.attendees,
                status: data.status || 'Planlandı'
            }
        });

        await this.auditLogService.createLog({
            user: 'SYSTEM',
            action: 'Toplantı Kaydı Oluşturuldu',
            details: `Denetim ${auditId} için ${data.type || 'Toplantı'} kaydı eklendi: "${data.title}"`,
            targetType: 'Audit',
            targetId: auditId,
        });

        return result;
    }

    async updateMeeting(id: string, data: any) {
        const result = await this.prisma.auditMeeting.update({
            where: { id },
            data: {
                type: data.type,
                title: data.title,
                meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
                location: data.location,
                agenda: data.agenda,
                minutes: data.minutes,
                attendees: data.attendees,
                status: data.status,
            }
        });

        await this.auditLogService.createLog({
            user: 'SYSTEM',
            action: 'Toplantı Kaydı Güncellendi',
            details: `Toplantı ${id} tutanağı/durumu güncellendi`,
            targetType: 'Audit',
            targetId: result.auditId,
        });

        return result;
    }

    async deleteMeeting(id: string) {
        const meeting = await this.prisma.auditMeeting.findUnique({ where: { id } });
        const result = await this.prisma.auditMeeting.delete({
            where: { id }
        });

        if (meeting) {
            await this.auditLogService.createLog({
                user: 'SYSTEM',
                action: 'Toplantı Kaydı Silindi',
                details: `Toplantı ${id} (${meeting.title}) silindi`,
                targetType: 'Audit',
                targetId: meeting.auditId,
            });
        }

        return result;
    }
}
