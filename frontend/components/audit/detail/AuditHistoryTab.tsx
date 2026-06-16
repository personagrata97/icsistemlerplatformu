'use client';

import React from 'react';
import { formatDateTime } from '@/lib/audit-utils';
import Timeline, { TimelineEvent, TimelineActionType } from '@/components/ui/Timeline';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight, Clock } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    user: string;
    details: string;
    targetType?: string;
    createdAt?: string;
    date?: string;
    changeData?: string | any;
}

interface AuditHistoryTabProps {
    auditLogs: AuditLog[];
}

const AuditHistoryTab: React.FC<AuditHistoryTabProps> = ({
    auditLogs
}) => {
    // Backend'den gelen teknik işlem adlarını kullanıcı dostu formata çevir
    const formatActionName = (action: string) => {
        const map: Record<string, string> = {
            'YENİ KAYIT': 'Oluşturdu',
            'YENI KAYIT': 'Oluşturdu',
            'YENİ KAYIT EKLENDİ': 'Oluşturdu',
            'YENI KAYIT EKLENDI': 'Oluşturdu',
            'CREATE': 'Oluşturdu',
            'GÜNCELLEME': 'Güncelledi',
            'UPDATE': 'Güncelledi',
            'SİLME': 'Sildi',
            'SİLİNME': 'Sildi',
            'DELETE': 'Sildi',
            'TEAM MEMBER REMOVED': 'Ekip Üyesi Çıkardı',
            'TEAM MEMBER ADDED': 'Ekip Üyesi Ekledi',
            'STATUS CHANGED': 'Durum Güncelledi'
        };
        
        const mapped = map[action.toUpperCase()];
        if (mapped) return mapped;
        
        return action.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };



    const renderChangesList = (parsedChanges: any) => {
        if (!parsedChanges || Object.keys(parsedChanges).length === 0) return null;

        return (
            <div className="mt-3 bg-white p-3 rounded border border-slate-100">
                <ul className="space-y-2">
                    {Object.entries(parsedChanges).map(([key, val]) => {
                        if (key === 'createdAt' || key === 'updatedAt' || key === 'id') return null;
                        
                        let displayVal = String(val);
                        let parsedVal = val;
                        
                        if (typeof val === 'string') {
                            const trimmed = val.trim();
                            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                                try { parsedVal = JSON.parse(trimmed); } catch(e) {}
                            }
                        }

                        if (typeof parsedVal === 'object' && parsedVal !== null) {
                            if ('old' in parsedVal || 'new' in parsedVal) {
                                const formatSide = (sideVal: any) => {
                                    if (sideVal === null || sideVal === undefined || sideVal === '' || sideVal === '[]') return 'Yok';
                                    
                                    const extractNames = (arr: any[]) => {
                                        if (arr.length === 0) return 'Yok';
                                        if (typeof arr[0] === 'object' && arr[0] !== null) {
                                            const names = arr.map((item: any) => item.name || item.displayName || item.title || item.code || item.id || 'İsimsiz Kayıt');
                                            return names.join(', ');
                                        }
                                        return arr.join(', ');
                                    };

                                    if (Array.isArray(sideVal)) return extractNames(sideVal);
                                    
                                    if (typeof sideVal === 'string' && sideVal.startsWith('[')) {
                                        try {
                                            const parsedArray = JSON.parse(sideVal);
                                            if (Array.isArray(parsedArray)) return extractNames(parsedArray);
                                        } catch(e) {}
                                    }

                                    if (typeof sideVal === 'object' && sideVal !== null) {
                                        return sideVal.name || sideVal.displayName || sideVal.title || sideVal.code || 'Bilinmeyen Kayıt';
                                    }

                                    return String(sideVal);
                                };
                                const oldStr = formatSide((parsedVal as any).old);
                                const newStr = formatSide((parsedVal as any).new);
                                
                                return (
                                    <li key={key} className="flex flex-col gap-1 mt-1">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{translateLogKey(key)}</span>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-100 line-through decoration-rose-300 opacity-80">
                                                {oldStr}
                                            </span>
                                            <ArrowRight size={14} className="text-slate-300" />
                                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200 font-semibold shadow-sm">
                                                {newStr}
                                            </span>
                                        </div>
                                    </li>
                                );
                            } else if (Array.isArray(parsedVal)) {
                                const extractNames = (arr: any[]) => {
                                    if (arr.length === 0) return 'Yok';
                                    if (typeof arr[0] === 'object' && arr[0] !== null) {
                                        const names = arr.map((item: any) => item.name || item.displayName || item.title || item.code || item.id || 'İsimsiz Kayıt');
                                        return names.join(', ');
                                    }
                                    return arr.join(', ');
                                };
                                displayVal = extractNames(parsedVal);
                            } else {
                                displayVal = JSON.stringify(parsedVal);
                            }
                        } else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                            try {
                                const dateObj = new Date(val);
                                displayVal = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            } catch(e) {}
                        } else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const parts = val.split('-');
                            displayVal = `${parts[2]}.${parts[1]}.${parts[0]}`;
                        }
                        if (displayVal.length > 150) displayVal = displayVal.substring(0, 150) + '...';
                        
                        return (
                            <li key={key} className="flex flex-col gap-1 mt-1">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{translateLogKey(key)}</span>
                                <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 w-fit">{displayVal}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    const timelineEvents: TimelineEvent[] = auditLogs.map((log) => {
        let parsedChanges = null;
        if (log.changeData) {
            try {
                parsedChanges = typeof log.changeData === 'string' ? JSON.parse(log.changeData) : log.changeData;
            } catch (e) { }
        }

        const actionStr = log.action.toUpperCase();
        let actionType: TimelineActionType = 'default';
        if (actionStr.includes('CREATE') || actionStr.includes('YENİ') || actionStr.includes('YENI')) actionType = 'create';
        else if (actionStr.includes('DELETE') || actionStr.includes('SİL')) actionType = 'delete';
        else if (actionStr.includes('UPDATE') || actionStr.includes('GÜNCEL')) actionType = 'update';
        else if (actionStr.includes('STATUS')) actionType = 'status_change';

        const title = `${formatTargetType(log.targetType || '')} ${formatActionName(log.action)}`.trim();

        return {
            id: log.id,
            timestamp: formatDateTime(log.createdAt || log.date),
            user: log.user,
            title: title,
            actionType: actionType,
            description: (
                <div>
                    <div className="leading-relaxed">{renderSmartText(formatLogDetails(log.details))}</div>
                    {parsedChanges && renderChangesList(parsedChanges)}
                </div>
            )
        };
    });

    return (
        <div className="card !p-0 shadow-sm border border-gray-100 overflow-hidden">
            <SectionHeader title="Süreç Geçmişi" icon={Clock} />
            
            {/* Tab Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
                <Timeline 
                    events={timelineEvents} 
                    emptyStateMessage="Bu denetim üzerinde yapılan tüm değişiklikler burada listelenir. Henüz bir kayıt bulunmuyor." 
                />
            </div>
        </div>
    );
};

export default AuditHistoryTab;
