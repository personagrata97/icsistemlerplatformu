import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Calendar as CalendarIcon, Save, FolderOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import DataTable, { Column } from '@/components/ui/DataTable';
import ActionMenu from '@/components/ui/ActionMenu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

import { useAuth } from '@/context/AuthContext';
import { auditApi } from '@/lib/audit-api';
import ConfirmModal from '@/components/ConfirmModal';

interface AuditTimesheetTabProps {
    auditId: string;
}

export default function AuditTimesheetTab({ auditId }: AuditTimesheetTabProps) {
    const { user, hasRole } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [entries, setEntries] = useState<any[]>([]);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const isManager = hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('SYSTEM_ADMIN');

    useEffect(() => {
        loadTimesheets();
    }, [auditId]);

    const loadTimesheets = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getTimesheetsByAudit(auditId);
            const rawList = Array.isArray(data) ? data : [];
            // Segregation of Duties: Non-managers only see their own timesheets
            const filtered = isManager ? rawList : rawList.filter((e: any) => e.userId === user?.id || e.user?.id === user?.id);
            setEntries(filtered);
        } catch (error) {
            console.error('Failed to load timesheets:', error);
            showToast('Efor kayıtları yüklenemedi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = () => {
        const newEntry = {
            id: `new-${Date.now()}`,
            isNew: true,
            date: new Date().toISOString().split('T')[0],
            hours: 0,
            activityType: '',
            userId: user?.id,
            auditId
        };
        setEntries([newEntry, ...entries]);
    };

    const handleUpdateEntry = (id: string, field: string, value: any) => {
        setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
    };

    const handleDeleteEntry = (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        // Segregation of Duties: Users cannot delete other users' timesheets
        const isEditable = isManager || entry.userId === user?.id || entry.isNew;
        if (!isEditable) {
            showToast('Bu kaydı silme yetkiniz bulunmamaktadır.', 'warning');
            return;
        }

        if (entry.isNew) {
            setEntries(prev => prev.filter(e => e.id !== id));
            return;
        }

        setDeleteTargetId(id);
        setShowConfirmDelete(true);
    };

    const confirmDeleteTimesheet = async () => {
        if (!deleteTargetId) return;
        try {
            await auditApi.deleteTimesheet(deleteTargetId);
            setEntries(prev => prev.filter(e => e.id !== deleteTargetId));
            showToast('Kayıt silindi.', 'success');
        } catch (error) {
            console.error('Delete timesheet error:', error);
            showToast('Silinemedi.', 'error');
        } finally {
            setShowConfirmDelete(false);
            setDeleteTargetId(null);
        }
    };

    const handleSave = async () => {
        const incomplete = entries.some(e => !e.activityType?.trim() || !e.date || Number(e.hours) <= 0);
        if (incomplete) {
            showToast('Lütfen tüm efor satırlarında tarih, görev açıklaması ve süreyi (>0) eksiksiz giriniz.', 'warning');
            return;
        }

        setSaving(true);
        try {
            for (const entry of entries) {
                // Skip if not editable by the logged-in user under Segregation of Duties
                const isEditable = isManager || entry.userId === user?.id || entry.isNew;
                if (!isEditable) continue;

                const payload = {
                    auditId,
                    userId: entry.userId || user?.id,
                    date: entry.date,
                    hours: Number(entry.hours),
                    activityType: entry.activityType,
                    status: 'Taslak'
                };

                if (entry.isNew) {
                    await auditApi.createTimesheet(payload);
                } else {
                    await auditApi.updateTimesheet(entry.id, payload);
                }
            }
            showToast('Efor kayıtları başarıyla kaydedildi.', 'success');
            await loadTimesheets(); // Reload to get real IDs for new entries
        } catch (error) {
            console.error('Save timesheets error:', error);
            showToast('Kaydedilirken hata oluştu.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<any>[] = [];

    if (isManager) {
        columns.push({
            key: 'user',
            header: 'Müfettiş / Personel',
            sortable: true,
            width: '180px',
            render: (row: any) => (
                <span className="inline-block text-center font-bold text-slate-700 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 leading-normal max-w-full">
                    {row.user?.displayName || row.user?.username || 'Belirtilmemiş'}
                </span>
            )
        });
    }

    columns.push(
        {
            key: 'date',
            header: 'Tarih',
            sortable: true,
            width: '160px',
            render: (row: any) => {
                const isEditable = isManager || row.userId === user?.id || row.isNew;
                return isEditable ? (
                    <input type="date" className="form-input" 
                        value={row.date} 
                        onChange={(e) => handleUpdateEntry(row.id, 'date', e.target.value)} 
                    />
                ) : (
                    <span className="text-slate-700 text-sm font-medium pl-2">{row.date}</span>
                );
            }
        },
        {
            key: 'activityType',
            header: 'Açıklama / Görev',
            sortable: true,
            render: (row: any) => {
                const isEditable = isManager || row.userId === user?.id || row.isNew;
                return isEditable ? (
                    <input type="text" className="form-input" 
                        placeholder="Görev veya harcanan efor detayı"
                        value={row.activityType || ''} 
                        onChange={(e) => handleUpdateEntry(row.id, 'activityType', e.target.value)} 
                    />
                ) : (
                    <span className="text-slate-700 text-sm font-medium pl-2">{row.activityType || ''}</span>
                );
            }
        },
        {
            key: 'hours',
            header: 'Süre (Saat)',
            sortable: true,
            width: '120px',
            align: 'center' as const,
            render: (row: any) => {
                const isEditable = isManager || row.userId === user?.id || row.isNew;
                return isEditable ? (
                    <input type="number" min="0" step="0.5" className="form-input text-center" 
                        value={row.hours} 
                        onChange={(e) => handleUpdateEntry(row.id, 'hours', e.target.value)} 
                    />
                ) : (
                    <span className="text-slate-700 text-sm font-semibold">{row.hours}</span>
                );
            }
        },
        {
            key: 'actions',
            header: 'İşlem',
            width: '80px',
            align: 'center' as const,
            render: (row: any) => {
                const isEditable = isManager || row.userId === user?.id || row.isNew;
                return isEditable ? (
                    <ActionMenu variant="ghost" items={[
                        { label: 'Satırı Sil', icon: Trash2, onClick: () => handleDeleteEntry(row.id), variant: 'danger' }
                    ]} />
                ) : null;
            }
        }
    );

    // Calculate person-based aggregated hours
    const personSummary = entries.reduce((acc: Record<string, { name: string; hours: number; entryCount: number }>, entry) => {
        let displayName = 'Belirtilmemiş';
        if (entry.user) {
            displayName = entry.user.displayName || entry.user.username || displayName;
        } else if (entry.userId === user?.id) {
            displayName = user?.displayName || user?.username || displayName;
        } else {
            displayName = 'Sistem Yöneticisi (Admin)';
        }
        
        if (!acc[displayName]) {
            acc[displayName] = { name: displayName, hours: 0, entryCount: 0 };
        }
        acc[displayName].hours += Number(entry.hours || 0);
        acc[displayName].entryCount += 1;
        return acc;
    }, {});

    const personSummaryArray = Object.values(personSummary);

    return (
        <div className="card !p-0 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Clock size={20} className="text-primary" /> Efor Çizelgesi
                </h3>
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddEntry} leftIcon={<Plus size={16} />}>
                        Yeni Efor Ekle
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<Save size={16} />}>
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </div>

            {personSummaryArray.length > 0 && (
                <div className="p-4 bg-slate-50/50 border-b border-gray-100">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Kişi Bazlı Efor Dağılımı
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {personSummaryArray.map((summary: any, idx: number) => {
                            const days = (summary.hours / 8).toFixed(1).replace('.0', '');
                            return (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0">
                                        {summary.name ? summary.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-800 text-xs truncate leading-tight mb-1">{summary.name}</p>
                                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-indigo-600">{summary.hours} saat</span>
                                            <span>•</span>
                                            <span className="font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                                                {days} Gün
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <DataTable
                columns={columns}
                data={entries}
                rowKey="id"
                loading={loading}
                emptyIcon={FolderOpen}
                emptyTitle="Kayıt Bulunamadı"
                emptyDescription="Yeni efor satırı ekleyerek başlayabilirsiniz."
                className="border-none shadow-none rounded-none"
            />

            <ConfirmModal
                isOpen={showConfirmDelete}
                onClose={() => {
                    setShowConfirmDelete(false);
                    setDeleteTargetId(null);
                }}
                onConfirm={confirmDeleteTimesheet}
                title="Efor Kaydı Sil"
                message="Bu efor kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="Vazgeç"
                type="danger"
            />
        </div>
    );
}

