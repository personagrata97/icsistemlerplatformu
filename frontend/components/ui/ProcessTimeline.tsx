import React from 'react';
import {
    FileText,
    ExternalLink,
    CheckCircle,
    UserPlus,
    Edit2,
    Send,
    AlertTriangle,
    Paperclip,
    History,
    Eye
} from 'lucide-react';
import { formatDateTime } from '@/lib/audit-utils';

interface TimelineItem {
    id: string;
    action: string;
    date: string | Date;
    user: string;
    details: string;
    [key: string]: any;
}

interface ProcessTimelineProps {
    items: TimelineItem[];
    emptyMessage?: string;
}

export default function ProcessTimeline({ items, emptyMessage = "Süreç kaydı bulunamadı." }: ProcessTimelineProps) {
    const getActionDetails = (action: string) => {
        const act = action?.toUpperCase() || '';
        
        // Match specific ethics and generic audit platform actions dynamically
        switch (act) {
            case 'ETHICS_SUBMITTED':
            case 'SUBMITTED':
            case 'CREATE':
            case 'CREATED':
            case 'YENİ KAYIT':
            case 'BULGU OLUŞTURULDU':
            case 'OLUŞTURULDU':
                return { label: act.includes('ETHICS') ? 'Bildirim Oluşturuldu' : 'Kayıt Oluşturuldu', icon: <FileText size={16} />, color: 'bg-emerald-500 text-white', textColor: 'text-emerald-700' };
            case 'ETHICS_QUERY':
            case 'QUERY':
            case 'QUERIED':
                return { label: 'Sorgulama Yapıldı', icon: <ExternalLink size={16} />, color: 'bg-blue-100 text-blue-600', textColor: 'text-blue-600' };
            case 'ETHICS_CLOSED':
            case 'CLOSED':
            case 'APPROVE':
            case 'APPROVED':
            case 'COMPLETED':
            case 'TAMAMLANDI':
            case 'ONAYLANDI':
            case 'KAPATILDI':
                return { label: act.includes('ETHICS') ? 'Bildirim Kapatıldı' : 'İşlem Tamamlandı', icon: <CheckCircle size={16} />, color: 'bg-green-500 text-white', textColor: 'text-green-700' };
            case 'ASSIGNMENT':
            case 'ASSIGN':
            case 'ASSIGNED':
            case 'ATANDI':
                return { label: 'Görevlendirme Yapıldı', icon: <UserPlus size={16} />, color: 'bg-amber-500 text-white', textColor: 'text-amber-700' };
            case 'STATUS_CHANGE':
            case 'UPDATE':
            case 'UPDATED':
            case 'EDITED':
            case 'GÜNCELLEME':
            case 'DÜZENLENDİ':
            case 'REVİZYON':
                return { label: 'Durum Güncellendi', icon: <Edit2 size={16} />, color: 'bg-purple-500 text-white', textColor: 'text-purple-700' };
            case 'MESSAGE_SENT':
            case 'MESSAGE':
            case 'SENT':
            case 'MESAJ':
                return { label: 'Mesaj Gönderildi', icon: <Send size={16} />, color: 'bg-indigo-500 text-white', textColor: 'text-indigo-700' };
            case 'EVIDENCE_UPLOADED':
            case 'UPLOAD':
            case 'UPLOADED':
            case 'KANIT YÜKLENDİ':
                return { label: 'Kanıt / Ek Yüklendi', icon: <Paperclip size={16} />, color: 'bg-teal-500 text-white', textColor: 'text-teal-700' };
            case 'INTERNAL_NOTES_UPDATED':
            case 'NOTE_ADDED':
                return { label: 'Not Eklendi', icon: <Edit2 size={16} />, color: 'bg-sky-400 text-white', textColor: 'text-sky-600' };
            case 'REASSIGNMENT':
            case 'REASSIGNED':
                return { label: 'Görev Devri', icon: <UserPlus size={16} />, color: 'bg-orange-500 text-white', textColor: 'text-orange-700' };
            case 'ETHICS_VIEWED':
            case 'VIEWED':
            case 'READ':
                return { label: 'Kayıt İncelendi', icon: <Eye size={16} />, color: 'bg-slate-400 text-white', textColor: 'text-slate-600' };
            case 'REJECT':
            case 'REJECTED':
            case 'CANCEL':
            case 'CANCELLED':
            case 'İPTAL':
            case 'REDDEDİLDİ':
                return { label: 'İptal / Reddedildi', icon: <AlertTriangle size={16} />, color: 'bg-red-500 text-white', textColor: 'text-red-700' };
            default:
                return { label: action, icon: <AlertTriangle size={16} />, color: 'bg-gray-300 text-gray-700', textColor: 'text-gray-700' };
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <History size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium italic">{emptyMessage}</p>
            </div>
        );
    }

    const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="font-poppins">
            <div className="relative pl-7 space-y-3.5">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />

                {sortedItems.map((log, index) => {
                    const details = getActionDetails(log.action);
                    const userDisplay = (log.user === 'ANONYMOUS' || log.user === 'SYSTEM_ANONYMOUS') ? 'GİZLİ' : log.user;

                    return (
                        <div key={log.id} className="relative group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                            {/* Bullet */}
                            <div className={`absolute -left-[28px] top-0.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${details.color}`}>
                                {details.icon}
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100/80 rounded-xl p-3 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all group-hover:border-slate-200/80">
                                <div className="flex justify-between items-start mb-1.5 gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${details.textColor}`}>
                                            {details.label}
                                        </span>
                                        <span className="text-[9px] text-slate-300 hidden sm:inline">•</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                            {userDisplay}
                                        </span>
                                    </div>
                                    <span className="text-[8.5px] font-mono font-bold text-slate-400 bg-slate-100/80 px-1.5 py-0.5 rounded shrink-0">
                                        {formatDateTime(log.date)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic break-words">
                                    {log.details}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
