import React, { useState } from 'react';
import { Clock, User, ArrowRight, Activity, Edit2, AlertCircle, CheckCircle, Upload, Trash2, ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export type TimelineActionType = 'create' | 'update' | 'delete' | 'status_change' | 'comment' | 'upload' | 'default';

export interface TimelineEvent {
    id: string | number;
    timestamp: string; // e.g. "09.06.2026 15:30"
    user: string;
    title: string; // Action title
    actionType?: TimelineActionType;
    details?: {
        oldValue?: string;
        newValue?: string;
        label?: string; // e.g. "Puan Değişimi" or "Durum"
    };
    description?: React.ReactNode | string; // Gerekçe veya detaylı açıklama
}

interface TimelineProps {
    events: TimelineEvent[];
    emptyStateMessage?: string;
}

const getActionConfig = (type?: TimelineActionType): { icon: LucideIcon, colorClass: string, bgColorClass: string, dotColorClass: string } => {
    switch (type) {
        case 'create':
            return { icon: CheckCircle, colorClass: 'text-emerald-600', bgColorClass: 'bg-emerald-50 border-emerald-100', dotColorClass: 'border-emerald-500' };
        case 'update':
            return { icon: Edit2, colorClass: 'text-indigo-600', bgColorClass: 'bg-indigo-50 border-indigo-100', dotColorClass: 'border-indigo-500' };
        case 'delete':
            return { icon: Trash2, colorClass: 'text-rose-600', bgColorClass: 'bg-rose-50 border-rose-100', dotColorClass: 'border-rose-500' };
        case 'status_change':
            return { icon: Activity, colorClass: 'text-amber-600', bgColorClass: 'bg-amber-50 border-amber-100', dotColorClass: 'border-amber-500' };
        case 'upload':
            return { icon: Upload, colorClass: 'text-blue-600', bgColorClass: 'bg-blue-50 border-blue-100', dotColorClass: 'border-blue-500' };
        case 'comment':
            return { icon: AlertCircle, colorClass: 'text-slate-600', bgColorClass: 'bg-slate-100 border-slate-200', dotColorClass: 'border-slate-500' };
        default:
            return { icon: Activity, colorClass: 'text-indigo-600', bgColorClass: 'bg-indigo-50 border-indigo-100', dotColorClass: 'border-indigo-500' };
    }
};

const TimelineGroupComponent = ({ group, config }: { group: any, config: any }) => {
    const [expanded, setExpanded] = useState(false);
    const event = group.mainEvent;
    const Icon = config.icon;

    return (
        <div className="relative pl-6">
            {/* Timeline Dot */}
            <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white border-2 ${config.dotColorClass} shadow-sm z-10`}></div>
            
            {/* Event Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 group">
                
                {/* Header: User, Action, Time */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.bgColorClass} ${config.colorClass}`}>
                            <Icon size={16} />
                        </div>
                        <div>
                            <div className="flex items-center flex-wrap text-[14px] leading-snug">
                                <span className="font-bold text-slate-900">{event.user}</span>
                                <span className="text-slate-300 mx-2">—</span>
                                <span className="font-bold text-indigo-700">{event.title}</span>
                            </div>
                            <div className="text-[12px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                <Clock size={12}/> {event.timestamp}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:gap-6 gap-3">
                    {/* Value Change Block (if exists) */}
                    {event.details && (event.details.oldValue || event.details.newValue) && (
                        <div className="flex flex-col items-center gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 shrink-0 min-w-[120px]">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {event.details.label || 'Değişim'}
                            </span>
                            <div className="flex items-center gap-2 font-bold text-[15px]">
                                {event.details.oldValue && (
                                    <span className="text-slate-400">{event.details.oldValue}</span>
                                )}
                                {event.details.oldValue && event.details.newValue && (
                                    <ArrowRight size={14} className="text-indigo-400" />
                                )}
                                {event.details.newValue && (
                                    <span className={config.colorClass}>{event.details.newValue}</span>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Description / Justification Block (if exists) */}
                    {event.description && (
                        <div className={`flex-1 text-[13px] font-medium p-3 rounded-lg border relative leading-relaxed w-full ${event.details ? 'bg-indigo-50/40 border-indigo-100/50 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {event.details && (
                                <div className="absolute -left-1.5 top-4 w-3 h-3 bg-indigo-50/40 border-t border-l border-indigo-100/50 transform -rotate-45 hidden sm:block"></div>
                            )}
                            {event.details && (
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Gerekçe / Açıklama</span>
                            )}
                            {event.description}
                        </div>
                    )}
                </div>

                {/* Smart Grouping Accordion for Technical Sub-Events */}
                {group.subEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            {expanded ? 'Sistem Loglarını Gizle' : `+ ${group.subEvents.length} İlgili Sistem Logu`}
                        </button>
                        
                        {expanded && (
                            <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                {group.subEvents.map((sub: TimelineEvent, idx: number) => {
                                    const subConfig = getActionConfig(sub.actionType);
                                    const SubIcon = subConfig.icon;
                                    
                                    return (
                                        <div key={sub.id || idx} className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${subConfig.bgColorClass} ${subConfig.colorClass}`}>
                                                <SubIcon size={12} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] text-slate-700 leading-snug">
                                                    <span className="font-semibold">{sub.user}</span> <span className="text-slate-500">{sub.title}</span>
                                                </div>
                                                
                                                {/* Details Line */}
                                                {sub.details && (sub.details.oldValue || sub.details.newValue) && (
                                                    <div className="mt-2 flex items-center flex-wrap gap-2 text-[12px]">
                                                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-200/50 px-2 py-0.5 rounded">
                                                            {sub.details.label || 'Değişim'}
                                                        </span>
                                                        {sub.details.oldValue && (
                                                            <span className="text-slate-400 line-through">{sub.details.oldValue}</span>
                                                        )}
                                                        {sub.details.oldValue && sub.details.newValue && (
                                                            <ArrowRight size={12} className="text-slate-300" />
                                                        )}
                                                        {sub.details.newValue && (
                                                            <span className="font-semibold text-indigo-600">{sub.details.newValue}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {sub.description && (
                                                    <div className="mt-2 text-[12px] text-slate-600 font-medium">
                                                        {sub.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Timeline({ events, emptyStateMessage = "Geçmiş kaydı bulunmamaktadır." }: TimelineProps) {
    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed text-center">
                <History className="text-slate-300 w-12 h-12 mb-3" />
                <h4 className="text-slate-700 font-bold mb-1">Tarihçe Bulunamadı</h4>
                <p className="text-sm text-slate-500">{emptyStateMessage}</p>
            </div>
        );
    }

    // Smart Grouping Logic: 
    // We group automatic 'System Logs' under the manual 'Human Log' that triggered them.
    const groupedEvents: { id: string, timestamp: string; mainEvent: TimelineEvent, subEvents: TimelineEvent[] }[] = [];
    
    events.forEach(event => {
        const lastGroup = groupedEvents[groupedEvents.length - 1];
        
        // A log is considered a 'System Log' if it's generated by 'Sistem' or it's a generic table update.
        const isSystemLog = event.user === 'Sistem' || event.title.includes('Güncellendi') || event.title.includes('Güncelledi');
        
        // We only group a system log if it falls in the exact same minute as the last group.
        const isSameTime = lastGroup && lastGroup.timestamp === event.timestamp;
        
        if (isSameTime && isSystemLog) {
            // It's a system log that belongs to the current timeline action.
            lastGroup.subEvents.push(event);
        } else {
            // It's a Human log (like "Taha eklendi", "Selim çıkarıldı"), OR a log at a different time.
            // Create a completely new bubble.
            groupedEvents.push({ 
                id: event.id.toString(), 
                timestamp: event.timestamp, 
                mainEvent: event, 
                subEvents: [] 
            });
        }
    });

    // Post-processing: Remove redundant "Sistem" logs if we already have better detailed logs in the same group
    groupedEvents.forEach(group => {
        if (group.subEvents.length > 1) {
            // If there are detailed logs attributed to the actual user, hide the purely automated "Sistem" triggers
            const detailedLogs = group.subEvents.filter(e => e.user !== 'Sistem');
            // If we have at least one detailed log, we can safely discard the redundant "Sistem" ones visually
            if (detailedLogs.length > 0) {
                // Furthermore, if we have duplicate titles in detailedLogs, keep only the first one
                const uniqueLogs = [];
                const seenTitles = new Set();
                detailedLogs.forEach(log => {
                    // Extract a simplified title string to catch similar logs
                    const simplifiedTitle = typeof log.title === 'string' ? log.title.replace(/Sistem Yöneticisi \(Admin\)|adlı kullanıcı|tarafından/gi, '').trim() : '';
                    if (!seenTitles.has(simplifiedTitle)) {
                        seenTitles.add(simplifiedTitle);
                        uniqueLogs.push(log);
                    }
                });
                
                group.subEvents = uniqueLogs.length > 0 ? uniqueLogs : detailedLogs;
            }
        }
    });

    return (
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4 pt-2">
            {groupedEvents.map((group, index) => {
                const config = getActionConfig(group.mainEvent.actionType);
                return <TimelineGroupComponent key={group.id || index} group={group} config={config} />;
            })}
        </div>
    );
}

// Need to import History for empty state
import { History } from 'lucide-react';
