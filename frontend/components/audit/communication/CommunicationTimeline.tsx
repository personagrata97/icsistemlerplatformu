'use client';

import React from 'react';
import { Mail, Calendar, CheckCircle2, Send, FileText, FileSignature, Presentation, FolderOpen, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import ActionMenu from '@/components/ui/ActionMenu';
import StatusBadge from '@/components/ui/StatusBadge';

interface CommunicationTimelineProps {
    communications: any[];
    meetings: any[];
    onNewCommunication: () => void;
    onNewMeeting: () => void;
    onEditCommunication?: (comm: any) => void;
    onDeleteCommunication?: (comm: any) => void;
    onEditMeeting?: (meeting: any) => void;
    onDeleteMeeting?: (meeting: any) => void;
}

export default function CommunicationTimeline({ 
    communications, 
    meetings, 
    onNewCommunication, 
    onNewMeeting, 
    onEditCommunication, 
    onDeleteCommunication,
    onEditMeeting,
    onDeleteMeeting
}: CommunicationTimelineProps) {
    // Merge and sort timeline
    const allEvents = [
        ...communications.map(c => ({
            ...c,
            _model: 'communication',
            date: c.sentAt || c.created_at || c.createdAt || new Date().toISOString(),
        })),
        ...meetings.map(m => ({
            ...m,
            _model: 'meeting',
            date: m.meetingDate || m.created_at || m.createdAt || new Date().toISOString(),
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getEventTitle = (event: any) => {
        if (event._model === 'meeting') {
            return event.title || `${event.type === 'OPENING' ? 'Açılış' : event.type === 'CLOSING' ? 'Kapanış' : 'Ara'} Toplantısı`;
        }
        return event.subject;
    };

    const columns: Column<any>[] = [
        {
            key: 'type',
            header: 'Tür',
            width: '150px',
            render: (event) => (
                <div className="flex items-center gap-2">
                    {event._model === 'meeting' ? (
                        <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                            <Presentation size={14} />
                            <span className="text-xs font-semibold">Toplantı</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                            <Mail size={14} />
                            <span className="text-xs font-semibold">İletişim</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'title',
            header: 'Konu / Başlık',
            sortable: true,
            align: 'left',
            render: (event) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{getEventTitle(event)}</span>
                    <span className="text-xs text-gray-500 truncate max-w-md">
                        {event._model === 'meeting' ? event.location || 'Konum belirtilmemiş' : event.content}
                    </span>
                </div>
            )
        },
        {
            key: 'date',
            header: 'Tarih',
            sortable: true,
            type: 'datetime'
        },
        {
            key: 'status',
            header: 'Durum',
            width: '120px',
            render: (event) => (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${event.status === 'Planlandı' || event.status === 'Taslak' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {event.status}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '80px',
            align: 'center',
            render: (event) => {
                const isComm = event._model === 'communication';
                const canEdit = isComm ? (event.status === 'Taslak' && onEditCommunication) : onEditMeeting;
                const canDelete = isComm ? (event.status === 'Taslak' && onDeleteCommunication) : onDeleteMeeting;
                
                if (!canEdit && !canDelete) return null;

                const items = [];
                if (canEdit) {
                    items.push({
                        label: isComm ? 'Düzenle/Gönder' : 'Düzenle',
                        icon: Edit,
                        onClick: () => isComm ? onEditCommunication!(event) : onEditMeeting!(event)
                    });
                }
                if (canDelete) {
                    items.push({
                        label: 'Sil',
                        icon: Trash2,
                        variant: 'danger' as const,
                        onClick: () => isComm ? onDeleteCommunication!(event) : onDeleteMeeting!(event)
                    });
                }

                return <ActionMenu items={items} variant="ghost" />;
            }
        }
    ];

    return (
        <div className="card !p-0 shadow-sm border border-gray-100">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Presentation size={20} className="text-primary" /> İletişim & Toplantılar
                </h3>
                <div className="flex gap-2">
                    <Button
                        onClick={onNewMeeting}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1.5"
                    >
                        <Calendar size={15} />
                        Toplantı Ekle
                    </Button>
                    <Button
                        onClick={onNewCommunication}
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-1.5"
                    >
                        <Mail size={15} />
                        Mail Gönder
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={allEvents}
                rowKey={(item) => `${item._model}-${item.id}`}
                emptyIcon={FolderOpen}
                emptyTitle="Kayıt Bulunamadı"
                emptyDescription="Henüz bir iletişim veya toplantı kaydı bulunmuyor."
                className="border-none shadow-none rounded-none"
            />
        </div>
    );
}
