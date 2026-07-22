'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { Download, FileText, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function SanctionReportsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);

    const reports = [
        { id: '1', ad: 'MASAK Yıllık Uyum Denetim Raporu 2026', tur: 'MASAK UYUM', tarih: '2026-07-01', olusturan: 'Sistem' },
        { id: '2', ad: 'Aylık Yaptırım Taraması İstatistik Raporu', tur: 'İSTATİSTİK', tarih: '2026-07-15', olusturan: 'Selim KAYA' },
        { id: '3', ad: 'OFAC & BM Karaliste Taramaları Özeti', tur: 'YAPTIRIM', tarih: '2026-07-20', olusturan: 'Taha TURUNÇ' },
    ];

    const filteredReports = reports.filter(r => {
        if (typeFilter !== 'ALL' && r.tur !== typeFilter) return false;
        if (searchTerm && !r.ad.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const handleRefresh = async () => {
        setLoading(true);
        showToast('Yaptırım raporları güncelleniyor...', 'info');
        await new Promise(res => setTimeout(res, 500));
        setLoading(false);
        showToast('Rapor listesi tazeledi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Rapor adı ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={typeFilter !== 'ALL' ? 1 : 0}
                        onClear={() => setTypeFilter('ALL')}
                    >
                        <div>
                            <label className="form-label mb-1">Rapor Türü</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Rapor Türleri' },
                                    { value: 'MASAK UYUM', label: 'MASAK Uyum Raporları' },
                                    { value: 'İSTATİSTİK', label: 'İstatistik Raporları' },
                                    { value: 'YAPTIRIM', label: 'Yaptırım Özeti' },
                                ]}
                                value={typeFilter}
                                onChange={(val) => setTypeFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'ad',
                        header: 'Rapor Adı',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                                    <FileText size={18} />
                                </div>
                                <span className="font-bold text-gray-900">{item.ad}</span>
                            </div>
                        )
                    },
                    {
                        key: 'tur',
                        header: 'Rapor Türü',
                        width: '180px',
                        render: (item: any) => (
                            <StatusBadge value={item.tur} type="status" />
                        )
                    },
                    {
                        key: 'tarih',
                        header: 'Tarih',
                        width: '140px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{item.tarih}</span>
                            </div>
                        )
                    },
                    {
                        key: 'olusturan',
                        header: 'Oluşturan',
                        width: '160px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                <User size={14} className="text-gray-400" />
                                <span>{item.olusturan}</span>
                            </div>
                        )
                    },
                    {
                        key: 'act',
                        header: 'İndir',
                        width: '110px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="secondary" leftIcon={<Download size={14} />} onClick={() => showToast(`${item.ad} PDF olarak indiriliyor...`, 'info')}>
                                PDF
                            </Button>
                        )
                    }
                ]}
                data={filteredReports}
                rowKey="id"
            />
        </div>
    );
}
