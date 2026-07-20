import React from 'react';
import { ShieldAlert, User, Clock, Database, Activity, FileText, X, Lock, ArrowLeft, Info, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/lib/audit-utils';

export interface AuditLog {
    id: string;
    action: string;
    type: string;
    date: string;
    user: string;
    entity?: string;
    entityId?: string;
    ipAddress?: string;
    details?: string;
    changeData?: any;
}

export function formatLogDetails(details: string): string {
    if (!details) return '-';
    return details;
}

export function renderSmartText(text: string): React.ReactNode {
    return text;
}

// Internal Audit Standard Colors
export const TYPE_COLORS: Record<string, string> = {
    create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    update: 'bg-blue-100 text-blue-800 border-blue-200',
    delete: 'bg-red-100 text-red-800 border-red-200',
    status: 'bg-amber-100 text-amber-800 border-amber-200',
    login: 'bg-purple-100 text-purple-800 border-purple-200',
    system: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const TYPE_ICONS: Record<string, React.ReactNode> = {
    create: <CheckCircle size={14} />,
    update: <FileText size={14} />,
    delete: <X size={14} />,
    status: <Activity size={14} />,
    login: <User size={14} />,
    system: <Database size={14} />
};

import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';

export function StatCard({ title, value, icon, color, bg, onClick, className }: any) {
    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) return icon;
        const Icon: any = icon;
        return <Icon className={color} size={24} />;
    };

    return (
        <div onClick={onClick} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 ${className || ''}`}>
            <div className={`p-3 rounded-lg ${bg}`}>
                {renderIcon()}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

export function AccessDenied() {
    const { hasRole } = useAuth();
    const isUnit = checkRole(hasRole, ROLES.UNIT);
    const returnUrl = isUnit ? '/audit/unit' : '/audit';
    const returnLabel = isUnit ? "Birim Portalı'na Dön" : "Ana Panele Dön";

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-slate-200/90 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* Top Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <Lock size={12} className="text-amber-600" />
                    <span>Erişim Kısıtlı • 403</span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 shadow-inner">
                    <ShieldAlert size={36} />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Erişim Yetkisi Kısıtlandı</h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
                        Bu sayfaya erişim yetki matrisi kuralları gereğince kısıtlanmıştır. Erişim talepleriniz için lütfen Yetki Yöneticiniz ile iletişime geçiniz.
                    </p>
                </div>

                {/* Action */}
                <div className="pt-2">
                    <Link href={returnUrl}>
                        <Button variant="primary" size="md" leftIcon={<ArrowLeft size={16} />} className="shadow-md font-bold px-6">
                            {returnLabel}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
export function InfoItem({ label, value, icon }: any) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="p-2 bg-gray-50 rounded-md text-gray-500">
                {icon && (React.isValidElement(icon) ? icon : (() => { const Icon: any = icon; return <Icon size={14} />; })())}
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

export function DiffViewer({ data }: { data: any }) {
    if (!data || typeof data !== 'object') return null;

    const entries = Object.entries(data);
    const isDiff = entries.every(([_, val]: [any, any]) =>
        val && typeof val === 'object' && ('old' in val || 'new' in val)
    );

    if (!isDiff) {
        return (
            <div className="bg-slate-900 rounded-2xl overflow-hidden text-[11px] font-mono shadow-inner border border-slate-800">
                <div className="p-4 text-emerald-400 max-h-80 overflow-auto custom-scrollbar">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
            <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase">Alan</th>
                        <th className="px-3 py-2 text-left font-bold text-red-500 uppercase">Eski</th>
                        <th className="px-3 py-2 text-left font-bold text-emerald-600 uppercase">Yeni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                    {entries.map(([field, values]: [string, any]) => (
                        <tr key={field} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 font-semibold text-gray-600 capitalize">
                                {field === 'title' ? 'Başlık' : field === 'status' ? 'Durum' : field}
                            </td>
                            <td className="px-3 py-2 text-red-500 bg-red-50/30">
                                {typeof values.old === 'object' ? '...' : (values.old || '-')}
                            </td>
                            <td className="px-3 py-2 text-emerald-700 bg-emerald-50/30">
                                {typeof values.new === 'object' ? '...' : (values.new || '-')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function DetailModal({ log, onClose }: { log: AuditLog, onClose: () => void }) {
    if (!log) return null;
    return (
        <Modal
            isOpen={!!log}
            onClose={onClose}
            size="lg"
            title={
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shadow-sm ${TYPE_COLORS[log.type]}`}>
                        {TYPE_ICONS[log.type]}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{log.action === 'ETHICS_QUERY' ? 'Etik Sorgulama' : String(log.action || '-')}</h3>
                        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Sistem İşlem Günlüğü</p>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Zaman" value={formatDateTime(log.date)} icon={<Clock size={14} />} />
                    <InfoItem label="Kullanıcı" value={log.user} icon={<User size={14} />} />
                    <InfoItem label="İlgili Varlık" value={`${log.entity || '-'} ${log.entityId ? '#' + log.entityId : ''}`} icon={<Database size={14} />} />
                    <InfoItem label="IP Adresi" value={log.ipAddress || 'Sistem İçi'} icon={<Activity size={14} />} />
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-primary" />
                        İşlem Özeti
                    </h4>
                    <div className="bg-gray-50/80 p-5 rounded-2xl text-sm text-gray-700 leading-relaxed border border-gray-200/50">
                        {renderSmartText(formatLogDetails(String(log.details || '-')))}
                    </div>
                </div>

                {/* Change Data (Diff) - Enhanced View */}
                {log.changeData && (
                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" />
                            Değişiklik Detayları
                        </h4>
                        <DiffViewer data={log.changeData} />
                    </div>
                )}
            </div>
        </Modal>
    );
}
