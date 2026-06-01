import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CommunicationService {
    private readonly logger = new Logger(CommunicationService.name);

    constructor(private prisma: PrismaService) {}

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
        return this.prisma.auditCommunication.create({
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
    }

    async updateCommunication(id: string, userId: string, data: any) {
        return this.prisma.auditCommunication.update({
            where: { id },
            data: {
                subject: data.subject,
                content: data.content,
                status: data.status,
                sentById: data.status === 'Gönderildi' ? userId : undefined,
                sentAt: data.status === 'Gönderildi' ? new Date() : undefined,
            }
        });
    }

    async deleteCommunication(id: string) {
        return this.prisma.auditCommunication.delete({
            where: { id }
        });
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
        return this.prisma.auditMeeting.create({
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
    }

    async updateMeeting(id: string, data: any) {
        return this.prisma.auditMeeting.update({
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
    }

    async deleteMeeting(id: string) {
        return this.prisma.auditMeeting.delete({
            where: { id }
        });
    }
}
