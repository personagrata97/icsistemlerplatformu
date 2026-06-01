'use client';

import React, { useState } from 'react';
import { Clock, FolderOpen, Activity, ArrowRight, Eye, List } from 'lucide-react';
import { formatDateTime } from '@/lib/audit-utils';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';

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
    const [selectedLogDetails, setSelectedLogDetails] = useState<any | null>(null);
    // Backend'den gelen teknik işlem adlarını kullanıcı dostu formata çevir
    const formatActionName = (action: string) => {
        const map: Record<string, string> = {
            'YENİ KAYIT': 'Oluşturuldu',
            'YENI KAYIT': 'Oluşturuldu',
            'YENİ KAYIT EKLENDİ': 'Oluşturuldu',
            'YENI KAYIT EKLENDI': 'Oluşturuldu',
            'CREATE': 'Oluşturuldu',
            'GÜNCELLEME': 'Güncellendi',
            'UPDATE': 'Güncellendi',
            'SİLME': 'Silindi',
            'SİLİNME': 'Silindi',
            'DELETE': 'Silindi',
            'TEAM MEMBER REMOVED': 'Ekip Üyesi Çıkarıldı',
            'TEAM MEMBER ADDED': 'Ekip Üyesi Eklendi',
            'STATUS CHANGED': 'Durum Güncellendi'
        };
        
        // Return mapped string, or convert raw string to Title Case as fallback
        const mapped = map[action.toUpperCase()];
        if (mapped) return mapped;
        
        return action.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    const formatTargetType = (type: string) => {
        if (!type) return '';
        const map: Record<string, string> = {
            'Audit': 'Denetim',
            'Finding': 'Bulgu',
            'Action': 'Aksiyon',
            'User': 'Kullanıcı',
            'Report': 'Rapor'
        };
        return map[type] || type;
    };

    const formatDetails = (details: string) => {
        if (!details) return '';
        let formatted = details;
        
        // Ortak backend mesajlarını Türkçeleştir
        formatted = formatted.replace(/Audit updated/gi, 'Denetim bilgileri güncellendi');
        formatted = formatted.replace(/Audit created/gi, 'Yeni denetim oluşturuldu');
        formatted = formatted.replace(/Meeting scheduled/gi, 'Yeni toplantı planlandı');
        formatted = formatted.replace(/Meeting updated/gi, 'Toplantı güncellendi');
        formatted = formatted.replace(/Communication added/gi, 'Yeni iletişim kaydı eklendi');
        formatted = formatted.replace(/Team member added/gi, 'Ekibe yeni üye eklendi');
        formatted = formatted.replace(/Team member removed/gi, 'Ekip üyesi çıkarıldı');
        formatted = formatted.replace(/Attachment added/gi, 'Çalışma kâğıdı eklendi');
        formatted = formatted.replace(/Target updated: (.*)/gi, '$1 güncellendi');
        formatted = formatted.replace(/Değişiklikler: (.*)/gi, (match, p1) => {
            const translatedFields = p1.split(',').map((f: string) => translateKey(f.trim())).join(', ');
            return `Güncellenen alanlar: ${translatedFields}`;
        });
        
        // Robotik sistem mesajlarını sadeleştir
        formatted = formatted.replace(/Sistem üzerinde (.*?) nesnesine yönelik veri (.*?) işlemi yapıldı\./gi, (match, p1, p2) => {
            const turkceHedef = formatTargetType(p1.trim());
            return `${turkceHedef} modülünde başarıyla ${p2} işlemi gerçekleştirildi.`;
        });
        
        // Undefined yazısını düzelt
        formatted = formatted.replace(/undefined ekipten çıkarıldı/gi, 'Belirtilmeyen bir kişi ekipten çıkarıldı');
        formatted = formatted.replace(/undefined/gi, 'Bilinmeyen Veri');

        return formatted;
    };

    // İngilizce key'leri Türkçeleştiren fonksiyon
    const translateKey = (key: string) => {
        const dictionary: Record<string, string> = {
            title: 'Başlık',
            status: 'Durum',
            code: 'Denetim No',
            type: 'Tür',
            period: 'Dönem',
            objective: 'Amaç',
            scope: 'Kapsam',
            methodology: 'Yöntem',
            criteria: 'Kriter',
            riskLevel: 'Risk Seviyesi',
            plannedStartDate: 'Planlanan Başlangıç',
            plannedEndDate: 'Planlanan Bitiş',
            department: 'Departman/Birim',
            supervisorId: 'Gözetmen ID',
            supervisor: 'Gözetmen',
            auditors: 'Müfettişler',
            team: 'Denetim Ekibi',
            createdAt: 'Oluşturulma Tarihi',
            updatedAt: 'Güncellenme Tarihi',
            startDate: 'Başlangıç Tarihi',
            endDate: 'Bitiş Tarihi',
            auditCode: 'Denetim Kodu',
            creatorId: 'Oluşturan ID',
            isDeleted: 'Silinme Durumu',
            description: 'Açıklama',
            name: 'İsim'
        };
        return dictionary[key] || key;
    };



    const renderChangesList = (parsedChanges: any) => {
        return (
            <ul className="space-y-2.5">
                {Object.entries(parsedChanges).map(([key, val]) => {
                    if (key === 'createdAt' || key === 'updatedAt' || key === 'id') return null;
                    
                    let displayVal = String(val);
                    let parsedVal = val;
                    
                    if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
                        try { parsedVal = JSON.parse(val); } catch(e) {}
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
                                <li key={key} className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0 mt-1">
                                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{translateKey(key)}</span>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 line-through decoration-red-300 opacity-80">
                                            {oldStr}
                                        </span>
                                        <ArrowRight size={14} className="text-gray-400" />
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
                        <li key={key} className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0 mt-1">
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{translateKey(key)}</span>
                            <span className="text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 w-fit">{displayVal}</span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    const columns: Column<AuditLog>[] = [
        {
            key: 'createdAt',
            header: 'Tarih',
            sortable: true,
            align: 'left',
            width: '150px',
            type: 'datetime'
        },
        {
            key: 'action',
            header: 'İşlem Tipi',
            sortable: true,
            align: 'left',
            width: '180px',
            render: (log) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{formatActionName(log.action)}</span>
                    {log.targetType && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {formatTargetType(log.targetType)}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'user',
            header: 'İşlem Yapan',
            sortable: true,
            align: 'left',
            width: '200px',
            type: 'user'
        },
        {
            key: 'details',
            header: 'İşlem Detayları',
            align: 'left',
            render: (log) => (
                <div className="flex items-center">
                    <span className="cell-title whitespace-normal max-w-[500px]">
                        {formatDetails(log.details)}
                    </span>
                </div>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '120px',
            align: 'center',
            render: (log) => {
                let parsedChanges = null;
                if (log.changeData) {
                    try {
                        parsedChanges = typeof log.changeData === 'string' ? JSON.parse(log.changeData) : log.changeData;
                    } catch (e) { }
                }

                return (
                    <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                        <ActionMenu 
                            items={[
                                { label: 'Detayları İncele', icon: Eye, onClick: () => setSelectedLogDetails({ log, parsedChanges }) }
                            ]}
                        />
                    </div>
                );
            }
        }
    ];

    return (
        <div className="card !p-0 shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Clock size={20} className="text-primary" /> Süreç Geçmişi
                </h3>
            </div>
            
            <DataTable
                columns={columns}
                data={auditLogs.map(log => ({
                    ...log,
                    createdAt: log.date || log.createdAt
                }))}
                rowKey="id"
                emptyIcon={FolderOpen}
                emptyTitle="Kayıt Bulunamadı"
                emptyDescription="Bu denetim üzerinde yapılan tüm değişiklikler burada listelenir."
                className="border-none shadow-none rounded-none"
            />
            
            <Modal
                isOpen={!!selectedLogDetails}
                onClose={() => setSelectedLogDetails(null)}
                title="Süreç Değişiklik Detayları"
                size="lg"
            >
                {selectedLogDetails && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                            <Activity className="text-primary" size={24} />
                            <div>
                                <h4 className="font-semibold text-gray-800">{formatActionName(selectedLogDetails.log.action)}</h4>
                                <p className="text-sm text-gray-600">{formatDetails(selectedLogDetails.log.details)}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-sm text-gray-800 space-y-4">
                            <h5 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
                                <List size={16} className="text-slate-500" /> İşlem Kartı Bilgileri
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İşlem Yapan</span>
                                    <p className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 w-fit">
                                        {selectedLogDetails.log.user}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İşlem Zamanı</span>
                                    <p className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 w-fit">
                                        {formatDateTime(selectedLogDetails.log.createdAt || selectedLogDetails.log.date)}
                                    </p>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Süreç Kategorisi</span>
                                    <p className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 w-fit">
                                        {formatTargetType(selectedLogDetails.log.targetType || 'Genel')}
                                    </p>
                                </div>
                            </div>

                            {selectedLogDetails.parsedChanges && Object.keys(selectedLogDetails.parsedChanges).length > 0 ? (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <ArrowRight size={16} className="text-slate-500" /> Detaylı Değişiklikler
                                    </h5>
                                    {renderChangesList(selectedLogDetails.parsedChanges)}
                                </div>
                            ) : (
                                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                                    Bu işlem tipi için veri tabanı seviyesinde teknik alan değişikliği kaydı bulunmamaktadır.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AuditHistoryTab;
