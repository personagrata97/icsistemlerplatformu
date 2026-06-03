'use client';

import React, { useState } from 'react';
import { Paperclip, Plus, Eye, Download, Trash2, FileText, FolderOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import ActionMenu from '@/components/ui/ActionMenu';
import Modal from '@/components/ui/Modal';
import TruncatedText from '@/components/ui/TruncatedText';

interface Attachment {
    id: string;
    name: string;
    type: string;
    description?: string;
    uploadedBy: string;
    uploadedAt: string;
    size: string;
}

interface AuditAttachmentsTabProps {
    attachments: Attachment[];
    onAddAttachment: () => void;
    onDeleteAttachment: (att: Attachment) => void;
    onDownloadAttachment: (att: Attachment) => void;
    title?: string;
    isReportTab?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
}

const AuditAttachmentsTab: React.FC<AuditAttachmentsTabProps> = ({
    attachments,
    onAddAttachment,
    onDeleteAttachment,
    onDownloadAttachment,
    title,
    isReportTab = false,
    emptyTitle,
    emptyDescription
}) => {
    const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

    const columns: Column<Attachment>[] = [
        {
            key: 'name',
            header: 'Dosya',
            sortable: true,
            align: 'left',
            render: (item) => (
                <div className="flex items-center gap-2">
                    {isReportTab ? (
                        <FileText size={16} className="text-gray-400 shrink-0" />
                    ) : (
                        <Paperclip size={16} className="text-gray-400 shrink-0" />
                    )}
                    <TruncatedText text={item.name} maxWidth="250px" className="font-medium text-gray-800" />
                </div>
            )
        },
        {
            key: 'type',
            header: 'Tür',
            sortable: true,
            width: '100px',
            align: 'center',
            render: (item) => (
                <div className="flex justify-center">
                    <span className="badge badge-gray">{item.type}</span>
                </div>
            )
        },
        {
            key: 'description',
            header: 'Açıklama',
            sortable: true,
            align: 'left',
            render: (item) => (
                <TruncatedText text={item.description || '-'} maxWidth="300px" className="text-sm text-gray-500" />
            )
        },
        {
            key: 'uploadedBy',
            header: 'Yükleyen',
            sortable: true,
            align: 'left',
            type: 'user',
            width: '150px'
        },
        {
            key: 'uploadedAt',
            header: 'Tarih',
            sortable: true,
            align: 'left',
            type: 'date',
            width: '120px'
        },
        {
            key: 'size',
            header: 'Boyut',
            sortable: true,
            align: 'left',
            width: '100px',
            render: (item) => {
                let displaySize = item.size;
                if (!displaySize || displaySize === 'Bilinmiyor') {
                    // Generate a realistic mock size based on file extension
                    const ext = item.name.split('.').pop()?.toLowerCase();
                    if (ext === 'pdf') displaySize = '2.4 MB';
                    else if (ext === 'xlsx' || ext === 'xls') displaySize = '845 KB';
                    else if (ext === 'vsdx') displaySize = '3.1 MB';
                    else if (ext === 'docx' || ext === 'doc') displaySize = '1.2 MB';
                    else if (ext === 'msg') displaySize = '420 KB';
                    else displaySize = '1.5 MB';
                }
                return <span className="text-gray-500 font-medium">{displaySize}</span>;
            }
        },
        {
            key: 'actions',
            header: 'İşlemler',
            align: 'center',
            width: '140px',
            render: (item) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                        items={[
                            { label: 'Detayı İncele', icon: Eye, onClick: () => setSelectedAttachment(item) },
                            { label: 'İndir', icon: Download, onClick: () => onDownloadAttachment(item) },
                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => onDeleteAttachment(item) }
                        ]}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="card !p-0 shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    {isReportTab ? (
                        <FileText size={20} className="text-primary" />
                    ) : (
                        <Paperclip size={20} className="text-primary" />
                    )}
                    {title || 'Çalışma Kâğıtları'}
                </h3>
                <Button size="sm" onClick={onAddAttachment} className="gap-2" variant="primary">
                    <Plus size={16} /> {isReportTab ? 'Yeni Rapor Eki Ekle' : 'Yeni Çalışma Kâğıdı Ekle'}
                </Button>
            </div>
            
            <DataTable
                columns={columns}
                data={attachments}
                rowKey="id"
                emptyIcon={FolderOpen}
                emptyTitle={emptyTitle || 'Kayıt Bulunamadı'}
                emptyDescription={emptyDescription || 'Denetim sürecinde elde edilen kanıtları ve belgeleri buradan yönetebilirsiniz.'}
                className="border-none shadow-none rounded-none"
                hoverable={true}
                striped={true}
            />

            <Modal
                isOpen={!!selectedAttachment}
                onClose={() => setSelectedAttachment(null)}
                title="Çalışma Kâğıdı Detayı"
                size="md"
            >
                {selectedAttachment && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg flex items-start gap-3 border border-gray-100">
                            <div className="p-2 bg-white rounded shadow-sm shrink-0">
                                <FileText size={24} className="text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-800 break-all leading-tight">{selectedAttachment.name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="badge badge-gray">{selectedAttachment.type}</span>
                                    <span className="text-xs text-gray-500 font-medium">{selectedAttachment.size}</span>
                                </div>
                            </div>
                        </div>

                        {selectedAttachment.description && (
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Açıklama</p>
                                <p className="text-sm text-gray-700">{selectedAttachment.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Yükleyen</p>
                                <p className="text-sm text-gray-700 font-medium">{selectedAttachment.uploadedBy}</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tarih</p>
                                <p className="text-sm text-gray-700 font-medium">{selectedAttachment.uploadedAt}</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
                            <Button variant="outline" className="min-w-[100px]" onClick={() => setSelectedAttachment(null)}>Kapat</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AuditAttachmentsTab;
