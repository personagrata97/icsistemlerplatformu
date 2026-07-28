'use client';

import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Eye, ShieldX } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import ActionMenu from '@/components/ui/ActionMenu';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import Checkbox from '@/components/ui/Checkbox';
import { useToast } from '@/components/Toast';
import RequireRole from '@/components/auth/RequireRole';

type TrashItemType = 'limit' | 'senaryo' | 'sozlesme' | 'dokuman';

interface TrashItem {
    id: string;
    type: TrashItemType;
    title: string;
    deletedBy: string;
    deletedAt: string;
    reason: string;
    originalStatus: string;
}

const TYPE_LABELS: Record<TrashItemType, string> = {
    limit: 'Risk Limit Aşımı',
    senaryo: 'Stres Testi Senaryosu',
    sozlesme: 'Sözleşme Analiz Kaydı',
    dokuman: 'Mevzuat & Yöntem Dokümanı'
};

const TYPE_COLORS: Record<TrashItemType, string> = {
    limit: 'bg-rose-100 text-rose-800',
    senaryo: 'bg-amber-100 text-amber-800',
    sozlesme: 'bg-blue-100 text-blue-800',
    dokuman: 'bg-purple-100 text-purple-800'
};

function RiskTrashPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
    const [confirmRestore, setConfirmRestore] = useState<{ isOpen: boolean; item: TrashItem | null }>({ isOpen: false, item: null });
    const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{ isOpen: boolean; item: TrashItem | null }>({ isOpen: false, item: null });

    const [trashItems, setTrashItems] = useState<TrashItem[]>([
        {
            id: 'RSK-LMT-999', type: 'limit', title: 'Test Likidite Eşik Aşımı Kaydı (Sehven)',
            deletedBy: 'Mehmet Öz', deletedAt: '2026-07-20T11:00:00', reason: 'Test Amaçlı Oluşturuldu', originalStatus: 'PASİF'
        },
        {
            id: 'RSK-SNR-012', type: 'senaryo', title: '2025 Q3 Faiz Şoku Stres Testi Simülasyonu',
            deletedBy: 'Ayşe Şahin', deletedAt: '2026-07-12T15:20:00', reason: 'Mükerrer Simülasyon', originalStatus: 'TAMAMLANDI'
        },
        {
            id: 'RSK-SZL-004', type: 'sozlesme', title: 'Eski Dönem Portföy Teminat İncelemesi',
            deletedBy: 'Mehmet Öz', deletedAt: '2026-06-30T10:00:00', reason: 'Geçersiz Veri', originalStatus: 'ARŞİVLENDİ'
        }
    ]);

    const handleRestore = (item: TrashItem) => {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        setConfirmRestore({ isOpen: false, item: null });
        showToast(`${item.id} — ${TYPE_LABELS[item.type]} başarıyla geri yüklendi`, 'success');
    };

    const handlePermanentDelete = (item: TrashItem) => {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        setConfirmPermanentDelete({ isOpen: false, item: null });
        showToast(`${item.id} kalıcı olarak silindi (geri alınamaz)`, 'success');
    };

    const handleEmptyTrash = () => {
        setTrashItems([]);
        showToast('Risk Çöp Kutusu tamamen boşaltıldı', 'success');
    };

    const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

    const filteredItems = trashItems.filter(item => {
        if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && !item.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterType.length > 0 && !filterType.includes(item.type)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Silinen Kayıt" value={trashItems.length} icon={Trash2} color="rose" />
                <StatCard title="Limit Aşımları" value={trashItems.filter(t => t.type === 'limit').length} icon={ShieldX} color="rose" />
                <StatCard title="Senaryo Kayıtları" value={trashItems.filter(t => t.type === 'senaryo').length} icon={Trash2} color="amber" />
                <StatCard title="Sözleşme Kayıtları" value={trashItems.filter(t => t.type === 'sozlesme').length} icon={AlertTriangle} color="blue" />
            </div>

            <PageToolbar
                searchPlaceholder="Risk kayıt adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown
                        label="Kayıt Türü"
                        activeCount={filterType.length}
                        onClear={() => setFilterType([])}
                    >
                        <div className="space-y-2">
                            {typeOptions.map(opt => (
                                <Checkbox
                                    key={opt.value}
                                    id={`risk-trash-filter-${opt.value}`}
                                    label={opt.label}
                                    checked={filterType.includes(opt.value)}
                                    onChange={(checked) => {
                                        setFilterType(prev => checked ? [...prev, opt.value] : prev.filter(v => v !== opt.value));
                                    }}
                                />
                            ))}
                        </div>
                    </FilterDropdown>
                }
                rightActions={
                    <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={handleEmptyTrash} disabled={trashItems.length === 0}>
                        Çöp Kutusunu Boşalt
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Kayıt Kodu', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'type', header: 'Tür', width: '170px', render: (item: any) => (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${TYPE_COLORS[item.type as TrashItemType] || 'bg-slate-100 text-slate-700'}`}>
                            {TYPE_LABELS[item.type as TrashItemType] || item.type}
                        </span>
                    ) },
                    { key: 'title', header: 'Kayıt Başlığı & Silme Nedeni', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Neden: {item.reason} • Silen: {item.deletedBy}</div>
                        </div>
                    ) },
                    { key: 'deletedAt', header: 'Silinme Tarihi', type: 'date' as any, width: '160px' },
                    { key: 'actions', header: 'İşlemler', width: '130px', render: (item: any) => (
                        <ActionMenu
                            items={[
                                { label: 'Detayları Görüntüle', icon: <Eye size={14} />, onClick: () => setSelectedItem(item) },
                                { label: 'Geri Yükle', icon: <RotateCcw size={14} />, onClick: () => setConfirmRestore({ isOpen: true, item }) },
                                { label: 'Kalıcı Sil', icon: <Trash2 size={14} />, onClick: () => setConfirmPermanentDelete({ isOpen: true, item }), variant: 'danger' as any }
                            ]}
                        />
                    ) }
                ]}
                data={filteredItems}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setFilterType([]); }}
                rowKey="id"
            />

            {selectedItem && (
                <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={`Silinen Risk Kaydı Detayı — ${selectedItem.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 space-y-2">
                            <h4 className="font-bold text-sm text-slate-900">{selectedItem.title}</h4>
                            <p className="text-slate-500 font-medium mt-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[selectedItem.type]}`}>
                                    {TYPE_LABELS[selectedItem.type]}
                                </span>
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Silen Kullanıcı</span>
                                <span className="font-bold text-slate-900">{selectedItem.deletedBy}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Silme Nedeni</span>
                                <span className="font-bold text-slate-900">{selectedItem.reason}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Orijinal Durum</span>
                                <StatusBadge value={selectedItem.originalStatus} type="status" />
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Silinme Tarihi</span>
                                <span className="font-bold text-slate-900">{new Date(selectedItem.deletedAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedItem(null)}>Kapat</Button>
                            <Button variant="primary" leftIcon={<RotateCcw size={14} />} onClick={() => { setConfirmRestore({ isOpen: true, item: selectedItem }); setSelectedItem(null); }}>Geri Yükle</Button>
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmModal
                isOpen={confirmRestore.isOpen}
                onClose={() => setConfirmRestore({ isOpen: false, item: null })}
                title="Kaydı Geri Yükle"
                message={`"${confirmRestore.item?.title}" kaydını geri yüklemek istediğinize emin misiniz?`}
                confirmText="Geri Yükle"
                type="success"
                onConfirm={() => confirmRestore.item && handleRestore(confirmRestore.item)}
            />

            <ConfirmModal
                isOpen={confirmPermanentDelete.isOpen}
                onClose={() => setConfirmPermanentDelete({ isOpen: false, item: null })}
                title="Kalıcı Silme"
                message={`"${confirmPermanentDelete.item?.title}" kaydını kalıcı olarak silmek istediğinize emin misiniz?`}
                confirmText="Kalıcı Sil"
                variant="danger"
                onConfirm={() => confirmPermanentDelete.item && handlePermanentDelete(confirmPermanentDelete.item)}
            />
        </div>
    );
}

export default function RiskTrashPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'RISK_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'SUPER_ADMIN']}>
            <RiskTrashPageContent />
        </RequireRole>
    );
}
