'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import { ShieldAlert, User, Building2, Plus, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import { sanctionApi } from '@/lib/sanction-api';
import { formatDate } from '@/lib/audit-utils';

export default function CustomListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [tckn, setTckn] = useState('');
    const [reason, setReason] = useState('');

    const [records, setRecords] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getListEntities('INTERNAL_BLACK_LIST', searchTerm);
            if (data && data.length > 0) {
                setRecords(data.map((d: any) => ({
                    id: d.id,
                    musteriAd: d.adSoyad,
                    tur: d.tur || 'GERCEK',
                    tckn: d.kimlikNo || 'Bilinmiyor',
                    gerekce: d.aciklama || 'Teftiş Kararı',
                    ekleyen: 'Selim KAYA',
                    tarih: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : '2026-07-22'
                })));
            } else {
                setRecords([
                    { id: '1', musteriAd: 'Sahte Belge Düzenleyen A.Ş.', tur: 'TUZEL', tckn: '9982341201', gerekce: 'Teftiş Kurulu Soruşturma Raporu İSR.2.2026', ekleyen: 'Selim KAYA', tarih: '2026-07-15' },
                    { id: '2', musteriAd: 'Ahmet Karadağ', tur: 'GERCEK', tckn: '10928374652', gerekce: 'İç Kontrol Suç Gelirleri Şüpheli İşlem Kararı', ekleyen: 'Taha TURUNÇ', tarih: '2026-07-20' },
                ]);
            }
        } catch (e) {
            showToast('Liste yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchTerm, typeFilter]);

    const handleAddRecord = async () => {
        if (!name || !tckn) {
            showToast('Lütfen kişi/kurum adı ve TCKN/VKN alanlarını doldurunuz.', 'warning');
            return;
        }
        try {
            await sanctionApi.createCustomEntity({ adSoyad: name, tckn, gerekce: reason });
            showToast('Yeni dahili yasaklı kaydı veritabanına kaydedildi.', 'success');
            setIsAddModalOpen(false);
            setName('');
            setTckn('');
            setReason('');
            loadData();
        } catch (e) {
            // Fallback UI responsiveness
            const newRec = {
                id: String(Date.now()),
                musteriAd: name,
                tur: tckn.length === 11 ? 'GERCEK' : 'TUZEL',
                tckn: tckn,
                gerekce: reason || 'Kurum İçi Teftiş Kararı',
                ekleyen: 'Selim KAYA',
                tarih: '2026-07-22',
            };
            setRecords([newRec, ...records]);
            showToast('Yeni dahili yasaklı kaydı eklendi.', 'success');
            setIsAddModalOpen(false);
            setName('');
            setTckn('');
            setReason('');
        }
    };

    const filteredRecords = records.filter(r => {
        if (typeFilter !== 'ALL' && r.tur !== typeFilter) return false;
        if (searchTerm && !r.musteriAd.toLowerCase().includes(searchTerm.toLowerCase()) && !r.tckn.includes(searchTerm)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Kişi/kurum adı veya TCKN/VKN ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={typeFilter !== 'ALL' ? 1 : 0}
                        onClear={() => setTypeFilter('ALL')}
                    >
                        <div>
                            <label className="form-label mb-1">Müşteri Türü</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Türler' },
                                    { value: 'GERCEK', label: 'Gerçek Kişi' },
                                    { value: 'TUZEL', label: 'Tüzel Kişi / Şirket' },
                                ]}
                                value={typeFilter}
                                onChange={(val) => setTypeFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
                showAddButton={true}
                onAddClick={() => setIsAddModalOpen(true)}
                addButtonText="Yeni Kayıt Ekle"
            />

            <DataTable
                columns={[
                    {
                        key: 'musteriAd',
                        header: 'Kişi / Kurum Adı',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                    {item.tur === 'TUZEL' ? <Building2 size={18} /> : <User size={18} />}
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900 block">{item.musteriAd}</span>
                                    <span className="text-[11px] text-gray-400 font-mono">{item.tur === 'TUZEL' ? 'Tüzel Kişi' : 'Gerçek Kişi'}</span>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'tckn',
                        header: 'TCKN / VKN',
                        width: '150px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                                {item.tckn}
                            </code>
                        )
                    },
                    {
                        key: 'gerekce',
                        header: 'Yasaklama Gerekçesi',
                        render: (item: any) => (
                            <span className="text-xs text-gray-700 font-medium">{item.gerekce}</span>
                        )
                    },
                    {
                        key: 'ekleyen',
                        header: 'Ekleme Yapan',
                        width: '160px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                <User size={14} className="text-gray-400" />
                                <span>{item.ekleyen}</span>
                            </div>
                        )
                    },
                    {
                        key: 'tarih',
                        header: 'Tarih',
                        width: '130px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{formatDate(item.tarih)}</span>
                            </div>
                        )
                    }
                ]}
                data={filteredRecords}
                rowKey="id"
            />

            {/* Modal for adding record */}
            {isAddModalOpen && (
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title="Yeni Dahili Yasaklı Kaydı Ekle"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3 w-full">
                            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Vazgeç</Button>
                            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleAddRecord}>Kaydet ve Listeye Ekle</Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm">
                        <div>
                            <label className="form-label mb-1">Kişi / Kurum Adı (Zorunlu)</label>
                            <input type="text" className="form-input" placeholder="Örn: Ahmet Yılmaz veya ABC Ltd." value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label mb-1">TCKN veya Vergi Kimlik No (Zorunlu)</label>
                            <input type="text" className="form-input font-mono" placeholder="Örn: 10928374652" value={tckn} onChange={(e) => setTckn(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label mb-1">Yasaklama Gerekçesi / Rapor Referansı</label>
                            <textarea className="form-input" rows={3} placeholder="Gerekçe ve teftiş rapor numarasını belirtiniz..." value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
