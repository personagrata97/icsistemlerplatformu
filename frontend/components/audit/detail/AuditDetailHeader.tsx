'use client';

import React from 'react';
import { Activity, User, Trash2, RotateCcw, Download, Edit2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { DateDisplay } from '@/components/ui/DateDisplay';

interface AuditDetailHeaderProps {
    auditData: any;
    backUrl: string;
    isDeleted: boolean;
    canDelete: boolean;
    onEdit?: () => void;
    onExport: () => void;
    onDelete: () => Promise<void>;
    onRestore: () => Promise<void>;
}

const AuditDetailHeader: React.FC<AuditDetailHeaderProps> = ({
    auditData,
    backUrl,
    isDeleted,
    canDelete,
    onEdit,
    onExport,
    onDelete,
    onRestore
}) => {
    if (!auditData) return null;

    const getPerformers = () => {
        let teamList: any[] = [];
        try {
            if (Array.isArray(auditData.team)) {
                teamList = auditData.team;
            } else if (typeof auditData.team === 'string') {
                teamList = JSON.parse(auditData.team);
            }
        } catch (e) {
            teamList = [];
        }

        const names = teamList
            .filter((member: any) => member && member.name)
            .map((member: any) => member.name);

        if (names.length > 0) {
            return names.join(', ');
        }
        
        if (Array.isArray(auditData.auditors) && auditData.auditors.length > 0) {
            return auditData.auditors.join(', ');
        }

        return 'Atanmamış';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
                <BackButton href={backUrl} label="Denetimlere Dön" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pt-4 border-t border-gray-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{auditData?.title}</h1>
                        {auditData.code && (
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                {auditData.code}
                            </span>
                        )}
                        {isDeleted && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                SİLİNMİŞ
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 min-w-fit">
                            <Activity size={16} className="text-gray-400" />
                            {auditData.type}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {!isDeleted && onEdit && (
                        <Button variant="secondary" onClick={onEdit}>
                            <Edit2 size={18} /> Düzenle
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onExport}>
                        <Download size={18} /> {
                            auditData.status === 'Taslak' || auditData.status === 'Planlandı'
                                ? 'Denetim Bildirimi PDF'
                                : auditData.status === 'Devam Ediyor' || auditData.status === 'Gözden Geçirme'
                                    ? 'Çalışma Planı PDF'
                                    : 'Denetim Planı PDF'
                        }
                    </Button>
                    
                    {isDeleted ? (
                        <Button variant="primary" onClick={onRestore}>
                            <RotateCcw size={18} /> Geri Yükle
                        </Button>
                    ) : (
                        canDelete && (
                            <Button variant="danger" onClick={onDelete}>
                                <Trash2 size={18} /> Sil
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditDetailHeader;
