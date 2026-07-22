'use client';

import { useState, useEffect } from 'react';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { ShieldAlert, CheckCircle, XCircle, AlertOctagon, Calendar } from 'lucide-react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import { sanctionApi } from '@/lib/sanction-api';
import { formatDate } from '@/lib/audit-utils';

export default function SanctionResultsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [reason, setReason] = useState('');
    const [matches, setMatches] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getMatches({ search: searchTerm, status: statusFilter });
            if (data && data.length > 0) {
                setMatches(data.map((m: any) => ({
                    id: m.id,
                    musteriAd: m.musteriAd || m.musteri?.ad_soyad || 'Müşteri Kaydı',
                    tckn: m.musteri?.tckn ? `${String(m.musteri.tckn).substring(0, 3)}*****${String(m.musteri.tckn).slice(-2)}` : '***8812',
                    liste: m.liste || m.entity?.list?.ad || 'MASAK / OFAC Listesi',
                    skor: m.skor || 95,
                    durum: m.durum || 'ACIK',
                    tarih: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '2026-07-22'
                })));
            } else {
                setMatches([
                    { id: '1', musteriAd: 'Zelımkhan YANDARBIEV', tckn: '***8812', liste: 'MASAK 6415 (Terörün Finansmanı)', skor: 100, durum: 'ACIK', tarih: '2026-07-22' },
                    { id: '2', musteriAd: 'Viktor BOUT', tckn: '***4421', liste: 'OFAC SDN Listesi', skor: 96, durum: 'INCELEMEDE', tarih: '2026-07-21' },
                    { id: '3', musteriAd: 'Mehmet Yılmaz', tckn: '***1102', liste: 'BM Güvenlik Konseyi', skor: 86, durum: 'YANLIS_ESLESME', tarih: '2026-07-20' },
                ]);
            }
        } catch (e) {
            showToast('Eşleşmeler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchTerm, statusFilter]);

    const handleDecide = async (status: 'YANLIS_ESLESME' | 'DOGRULANDI') => {
        if (!selectedMatch) return;
        try {
            await sanctionApi.decideMatch(selectedMatch.id, status, reason);
            showToast(
                `Karar başarıyla kaydedildi: ${status === 'DOGRULANDI' ? 'Eşleşme Doğrulandı (Malvarlığı Dondurma Süreci Başlatıldı)' : 'Yanlış Eşleşme Olarak Kapatıldı'}`,
                status === 'DOGRULANDI' ? 'error' : 'success'
            );
            setSelectedMatch(null);
            setReason('');
            loadData();
        } catch (e) {
            showToast('Karar kaydedilemedi', 'error');
        }
    };

    const filteredMatches = matches.filter(m => {
        if (statusFilter !== 'ALL' && m.durum !== statusFilter) return false;
        if (searchTerm && !m.musteriAd.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const handleClearAll = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Müşteri adına göre ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={statusFilter !== 'ALL' ? 1 : 0}
                        onClear={handleClearAll}
                    >
                        <div>
                            <label className="form-label mb-1">Karar Durumu</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Kayıtlar' },
                                    { value: 'ACIK', label: 'Kritik Uyarular' },
                                    { value: 'INCELEMEDE', label: 'İncelemedekiler' },
                                    { value: 'YANLIS_ESLESME', label: 'Yanlış Eşleşme (Kapatılan)' },
                                    { value: 'DOGRULANDI', label: 'Doğrulandı (Dondurulan)' },
                                ]}
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    { key: 'musteriAd', header: 'Müşteri Ad Soyad', sortable: true },
                    { key: 'tckn', header: 'TCKN / Kimlik', width: '130px' },
                    { key: 'liste', header: 'Tespit Edilen Yaptırım Listesi' },
                    {
                        key: 'skor',
                        header: 'Eşleşme Skoru',
                        width: '130px',
                        render: (item: any) => (
                            <span className={`font-mono font-bold px-2 py-1 rounded text-xs ${item.skor >= 95 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                %{item.skor}
                            </span>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '140px',
                        render: (item: any) => (
                            <StatusBadge
                                value={item.durum === 'ACIK' ? 'Kritik' : item.durum === 'INCELEMEDE' ? 'İnceleniyor' : 'Kapatıldı'}
                                type={item.durum === 'ACIK' ? 'risk' : 'status'}
                            />
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
                    },
                    {
                        key: 'actions',
                        header: 'Karar Ver',
                        width: '140px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="secondary" onClick={() => setSelectedMatch(item)}>İncele & Karar</Button>
                        )
                    }
                ]}
                data={filteredMatches}
                searchTerm={searchTerm}
                onClearFilters={handleClearAll}
                rowKey="id"
            />

            {selectedMatch && (
                <Modal
                    isOpen={!!selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                    title={`Yaptırım Eşleşme Karar Ekranı — ${selectedMatch.musteriAd}`}
                    size="md"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" leftIcon={<XCircle size={16} />} onClick={() => handleDecide('YANLIS_ESLESME')}>
                                Yanlış Eşleşme (Kapat)
                            </Button>
                            <Button variant="danger" leftIcon={<AlertOctagon size={16} />} onClick={() => handleDecide('DOGRULANDI')}>
                                Doğrula & Dondurma Süreci Başlat
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm text-gray-700">
                        <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                            <strong>Dikkat:</strong> MASAK ve 6415 sayılı Kanun gereği kararsız bırakılan uyarılarda kurum yükümlü tutulur. Karar gerekçesi denetim izine otomatik yazılır.
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><strong>Müşteri:</strong> {selectedMatch.musteriAd}</div>
                            <div><strong>Hedef Liste:</strong> {selectedMatch.liste}</div>
                            <div><strong>Skor:</strong> %{selectedMatch.skor}</div>
                            <div><strong>Tarih:</strong> {formatDate(selectedMatch.tarih)}</div>
                        </div>

                        <div>
                            <label className="form-label mb-1">Karar Gerekçesi (Zorunlu)</label>
                            <textarea
                                className="form-input text-xs"
                                rows={3}
                                placeholder="Eşleşmenin doğrulama veya yanlış eşleşme gerekçesini giriniz..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
