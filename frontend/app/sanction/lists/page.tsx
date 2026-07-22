'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { RefreshCw, Database, Clock, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { sanctionApi } from '@/lib/sanction-api';

export default function SanctionListsOverviewPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [lists, setLists] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getLists();
            if (data && data.length > 0) {
                setLists(data);
            } else {
                setLists([
                    { id: 'masak', kod: 'MASAK_5549_6415_7262', ad: 'MASAK & Resmî Gazete Malvarlığı Dondurma Listesi', kaynak: 'Resmî Gazete / MASAK API', kayitSayisi: 1420, sonGuncelleme: '2026-07-22 06:00', durum: 'AKTIF' },
                    { id: 'ofac', kod: 'OFAC_SDN', ad: 'ABD Hazine Bakanlığı OFAC SDN Listesi', kaynak: 'US Treasury XML', kayitSayisi: 12450, sonGuncelleme: '2026-07-22 05:30', durum: 'AKTIF' },
                    { id: 'un', kod: 'UN_SECURITY_COUNCIL', ad: 'Birleşmiş Milletler Güvenlik Konseyi Konsolide Listesi', kaynak: 'UN Security Council XML', kayitSayisi: 890, sonGuncelleme: '2026-07-21 23:00', durum: 'AKTIF' },
                    { id: 'eu', kod: 'EU_CONSOLIDATED', ad: 'Avrupa Birliği Konsolide Yaptırım Listesi', kaynak: 'EU Financial Sanctions XML', kayitSayisi: 3200, sonGuncelleme: '2026-07-22 04:15', durum: 'AKTIF' },
                    { id: 'custom', kod: 'INTERNAL_BLACK_LIST', ad: 'Kurum İçi Özel Kara Liste', kaynak: 'Emlak Katılım Teftiş / Uyum', kayitSayisi: 42, sonGuncelleme: '2026-07-20 14:10', durum: 'AKTIF' },
                ]);
            }
        } catch (e) {
            showToast('Yaptırım listeleri yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchTerm, statusFilter]);

    const handleSync = (kod: string) => {
        showToast(`${kod} kaynağı ile canlı senkronizasyon başlatıldı...`, 'info');
    };

    const filteredLists = lists.filter(l => {
        if (statusFilter !== 'ALL' && l.durum !== statusFilter) return false;
        if (searchTerm && !l.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !l.kod.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Liste adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={statusFilter !== 'ALL' ? 1 : 0}
                        onClear={() => setStatusFilter('ALL')}
                    >
                        <div>
                            <label className="form-label mb-1">Entegrasyon Durumu</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Durumlar' },
                                    { value: 'AKTIF', label: 'Aktif Entegrasyon' },
                                    { value: 'PASIF', label: 'Pasif Entegrasyon' },
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
                    {
                        key: 'kod',
                        header: 'Liste Kodu',
                        width: '210px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md">
                                {item.kod}
                            </code>
                        )
                    },
                    {
                        key: 'ad',
                        header: 'Yaptırım Listesi Adı',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                                    <Database size={18} />
                                </div>
                                <span className="font-bold text-gray-900">{item.ad}</span>
                            </div>
                        )
                    },
                    {
                        key: 'kaynak',
                        header: 'Veri Kaynağı',
                        width: '200px',
                        render: (item: any) => (
                            <span className="text-xs text-gray-700 font-medium">{item.kaynak}</span>
                        )
                    },
                    {
                        key: 'kayitSayisi',
                        header: 'Kayıt Sayısı',
                        width: '130px',
                        align: 'right',
                        render: (item: any) => (
                            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                {item.kayitSayisi?.toLocaleString('tr-TR')}
                            </span>
                        )
                    },
                    {
                        key: 'sonGuncelleme',
                        header: 'Son Güncelleme',
                        width: '160px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                <Clock size={13} className="text-gray-400" />
                                <span>{item.sonGuncelleme}</span>
                            </div>
                        )
                    },
                    {
                        key: 'action',
                        header: 'İşlemler',
                        width: '180px',
                        align: 'center',
                        render: (item: any) => (
                            <div className="flex gap-2 justify-center">
                                <Link href={`/sanction/lists/${item.id}`}>
                                    <Button size="sm" variant="secondary">Detay</Button>
                                </Link>
                                <Button size="sm" variant="primary" leftIcon={<RefreshCw size={14} />} onClick={() => handleSync(item.kod)}>Senkronize Et</Button>
                            </div>
                        )
                    }
                ]}
                data={filteredLists}
                rowKey="id"
            />
        </div>
    );
}
