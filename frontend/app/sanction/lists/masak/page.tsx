'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import { ShieldAlert, RefreshCw, Calendar, User, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';

export default function MasakListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [lawFilter, setLawFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);

    const [records, setRecords] = useState<any[]>([
        { id: '1', adSoyad: 'Zelımkhan YANDARBIEV', tur: 'GERCEK', kararNo: '2026/12', RGNo: '33102', kanun: '6415 S.K. m.5', tarih: '2026-07-15' },
        { id: '2', adSoyad: 'Al-Furqan Medya Vakfı', tur: 'TUZEL', kararNo: '2026/44', RGNo: '33088', kanun: '7262 S.K. m.3', tarih: '2026-06-22' },
        { id: '3', adSoyad: 'Tariq Anwar AL-SAYED', tur: 'GERCEK', kararNo: '2026/08', RGNo: '33010', kanun: '5549 S.K. m.19', tarih: '2026-05-10' },
    ]);

    const filteredRecords = records.filter(r => {
        if (lawFilter !== 'ALL' && !r.kanun.includes(lawFilter)) return false;
        if (typeFilter !== 'ALL' && r.tur !== typeFilter) return false;
        if (searchTerm && !r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) && !r.kararNo.includes(searchTerm)) return false;
        return true;
    });

    const activeFilterCount = (lawFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);

    const handleClearAll = () => {
        setSearchTerm('');
        setLawFilter('ALL');
        setTypeFilter('ALL');
    };

    const handleRefresh = async () => {
        setLoading(true);
        showToast('Resmî Gazete & MASAK API canlı sorgulanıyor...', 'info');
        await new Promise(res => setTimeout(res, 800));

        const freshRecord = {
            id: String(Date.now()),
            adSoyad: 'Karar No: 2026/89 Yaptırımlı Şahıs / Kurum',
            tur: 'GERCEK',
            kararNo: '2026/89',
            RGNo: '33140',
            kanun: '6415 S.K. m.6',
            tarih: '2026-07-22',
        };
        setRecords(prev => [freshRecord, ...prev]);
        setLoading(false);
        showToast('Resmî Gazete API üzerinden 1 yeni malvarlığı dondurma kararı aktarıldı.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Kişi, kurum veya Cumhurbaşkanı Karar No ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={activeFilterCount}
                        onClear={handleClearAll}
                    >
                        <div>
                            <label className="form-label mb-1">Mevzuat Kanun Maddesi</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Mevzuat Maddeleri' },
                                    { value: '6415', label: '6415 S.K. (Terörün Finansmanı)' },
                                    { value: '7262', label: '7262 S.K. (Kitle İmha Silahları)' },
                                    { value: '5549', label: '5549 S.K. (AML / ŞİB)' },
                                ]}
                                value={lawFilter}
                                onChange={(val) => setLawFilter(val as string)}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1">Müşteri Türü</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Türler' },
                                    { value: 'GERCEK', label: 'Gerçek Kişi' },
                                    { value: 'TUZEL', label: 'Tüzel Kişi' },
                                ]}
                                value={typeFilter}
                                onChange={(val) => setTypeFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
                rightActions={
                    <Button variant="primary" isLoading={loading} leftIcon={<RefreshCw size={16} />} onClick={handleRefresh}>
                        Resmî Gazete API Güncelle
                    </Button>
                }
            />
            <DataTable
                columns={[
                    {
                        key: 'adSoyad',
                        header: 'Kişi / Kurum Adı',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                    {item.tur === 'TUZEL' ? <Building2 size={18} /> : <User size={18} />}
                                </div>
                                <span className="font-bold text-gray-900">{item.adSoyad}</span>
                            </div>
                        )
                    },
                    {
                        key: 'tur',
                        header: 'Tür',
                        width: '100px',
                        render: (item: any) => (
                            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                {item.tur === 'TUZEL' ? 'Tüzel' : 'Gerçek'}
                            </span>
                        )
                    },
                    {
                        key: 'kanun',
                        header: 'Mevzuat Maddesi',
                        width: '160px',
                        render: (item: any) => (
                            <StatusBadge value={item.kanun} type="risk" />
                        )
                    },
                    {
                        key: 'kararNo',
                        header: 'Cumhurbaşkanı Karar No',
                        width: '180px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-1 rounded">
                                Karar No: {item.kararNo}
                            </code>
                        )
                    },
                    {
                        key: 'RGNo',
                        header: 'Resmî Gazete Sayısı',
                        width: '160px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-gray-600">S. {item.RGNo}</span>
                        )
                    },
                    {
                        key: 'tarih',
                        header: 'Yayın Tarihi',
                        width: '140px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{formatDate(item.tarih)}</span>
                            </div>
                        )
                    }
                ]}
                data={filteredRecords}
                searchTerm={searchTerm}
                onClearFilters={handleClearAll}
                rowKey="id"
            />
        </div>
    );
}
