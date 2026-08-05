'use client';
import PageHeader from '@/components/ui/PageHeader';

import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Eye, ShieldX } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import DateDisplay from '@/components/ui/DateDisplay';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import Checkbox from '@/components/ui/Checkbox';
import { useToast } from '@/components/Toast';
import RequireRole from '@/components/auth/RequireRole';

type TrashItemType = 'kontrol' | 'test' | 'eksiklik' | 'rapor' | 'dokuman';

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
    kontrol: 'Kontrol Noktası',
    test: 'Kontrol Testi',
    eksiklik: 'Eksiklik Kaydı',
    rapor: 'Dönem Raporu',
    dokuman: 'Bilgi Bankası Dokümanı'
};

const TYPE_COLORS: Record<TrashItemType, string> = {
    kontrol: 'bg-blue-100 text-blue-800',
    test: 'bg-emerald-100 text-emerald-800',
    eksiklik: 'bg-rose-100 text-rose-800',
    rapor: 'bg-purple-100 text-purple-800',
    dokuman: 'bg-amber-100 text-amber-800'
};

function ControlTrashPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
    const [confirmRestore, setConfirmRestore] = useState<{ isOpen: boolean; item: TrashItem | null }>({ isOpen: false, item: null });
    const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{ isOpen: boolean; item: TrashItem | null }>({ isOpen: false, item: null });

    const [trashItems, setTrashItems] = useState<TrashItem[]>([
        {
            id: 'KNT-TEST-999', type: 'kontrol', title: 'Test Amaçlı Kontrol Noktası (Sehven Kayıt)',
            deletedBy: 'Ahmet Yılmaz', deletedAt: '2026-07-19T12:00:00', reason: 'Sehven Oluşturuldu', originalStatus: 'TASLAK'
        },
        {
            id: 'TST-2025-045', type: 'test', title: 'Eski Dönem Kredi Onay Süreci Testi (Mükerrer)',
            deletedBy: 'Canan Öztürk', deletedAt: '2026-07-10T14:30:00', reason: 'Mükerrer Kayıt', originalStatus: 'TAMAMLANDI'
        },
        {
            id: 'EKS-2025-008', type: 'eksiklik', title: 'Eski Dönem Hazine Limitler Eksikliği (Kapatıldı & Arşivlendi)',
            deletedBy: 'Ahmet Yılmaz', deletedAt: '2026-06-28T09:00:00', reason: 'Artık Geçerli Değil', originalStatus: 'KAPATILDI'
        },
        {
            id: 'RPR-2025-Q4', type: 'rapor', title: '2025 Q4 Dönemsel İç Kontrol Raporu (Revize Edildi)',
            deletedBy: 'Zeynep Kaya', deletedAt: '2026-06-15T16:00:00', reason: 'Yanlış Veri Girişi', originalStatus: 'TASLAK'
        },
        {
            id: 'DOK-IK-OLD-003', type: 'dokuman', title: 'Eski BDDK İç Kontrol Standartları Rehberi v1.0',
            deletedBy: 'Sistem', deletedAt: '2026-06-01T08:00:00', reason: 'Güncel Versiyon Yüklendi', originalStatus: 'YÜRÜRLÜKTEN_KALDIRILDI'
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
        showToast('Çöp kutusu tamamen boşaltıldı', 'success');
    };

    const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

    const filteredItems = trashItems.filter(item => {
        if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && !item.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterType.length > 0 && !filterType.includes(item.type)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Çöp Kutusu" subtitle="Silinen kontrol kayıtları ve geri yükleme merkezi" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Silinen Kayıt" value={trashItems.length} icon={Trash2} color="rose" />
                <StatCard title="Kontrol Noktaları" value={trashItems.filter(t => t.type === 'kontrol').length} icon={ShieldX} color="blue" />
                <StatCard title="Test Kayıtları" value={trashItems.filter(t => t.type === 'test').length} icon={Trash2} color="emerald" />
                <StatCard title="Eksiklik Kayıtları" value={trashItems.filter(t => t.type === 'eksiklik').length} icon={AlertTriangle} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Kayıt adı veya kodu ile ara..."
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
                                    id={`trash-filter-${opt.value}`}
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
                        <TableActions
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

            {/* Detail Modal */}
            {selectedItem && (
                <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={`Silinen Kayıt Detayı — ${selectedItem.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedItem.title}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">
                                        <StatusBadge value={TYPE_LABELS[selectedItem.type]} type="status" />
                                    </p>
                                </div>
                            </div>
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
                                <DateDisplay value={selectedItem.deletedAt} format="datetime" className="font-bold text-slate-900" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedItem(null)}>Kapat</Button>
                            <Button variant="primary" leftIcon={<RotateCcw size={14} />} onClick={() => { setConfirmRestore({ isOpen: true, item: selectedItem }); setSelectedItem(null); }}>Geri Yükle</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Restore Confirm Modal */}
            <ConfirmModal
                isOpen={confirmRestore.isOpen}
                onClose={() => setConfirmRestore({ isOpen: false, item: null })}
                title="Kaydı Geri Yükle"
                message={`"${confirmRestore.item?.title}" kaydını geri yüklemek istediğinize emin misiniz? Kayıt orijinal konumuna iade edilecektir.`}
                confirmText="Geri Yükle"
                type="success"
                onConfirm={() => confirmRestore.item && handleRestore(confirmRestore.item)}
            />

            {/* Permanent Delete Confirm Modal */}
            <ConfirmModal
                isOpen={confirmPermanentDelete.isOpen}
                onClose={() => setConfirmPermanentDelete({ isOpen: false, item: null })}
                title="Kalıcı Silme (Geri Alınamaz)"
                message={`"${confirmPermanentDelete.item?.title}" kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`}
                confirmText="Kalıcı Sil"
                variant="danger"
                onConfirm={() => confirmPermanentDelete.item && handlePermanentDelete(confirmPermanentDelete.item)}
            />
        </div>
    );
}

export default function ControlTrashPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'CONTROL_ADMIN', 'CONTROL_OFFICER', 'CONTROL_MANAGER', 'SUPER_ADMIN']}>
            <ControlTrashPageContent />
        </RequireRole>
    );
}
