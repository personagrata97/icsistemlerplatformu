'use client';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';


import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable from '@/components/ui/DataTable';
import { DateDisplay } from '@/components/ui/DateDisplay';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { Download, FileText, Calendar, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { sanctionApi } from '@/lib/sanction-api';

function SanctionReportsPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getReports();
            setReports(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('Raporlar yüklenemedi', 'error');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredReports = reports.filter(r => {
        const ad = r.ad || r.title || '';
        const tur = r.tur || r.type || '';
        if (typeFilter !== 'ALL' && !tur.includes(typeFilter)) return false;
        if (searchTerm && !ad.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const handleRefresh = async () => {
        await loadData();
        showToast('Rapor listesi tazelendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Yaptırım Raporları" subtitle="MASAK bildirim belgeleri, eşleşme istatistikleri ve dönemsel yaptırım uyum raporları" />
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


export default function SanctionReportsPage() {
    return (
        <RequireRole allowedRoles={['UYUM_GOREVLISI', 'UYUM_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <SanctionReportsPageContent />
        </RequireRole>
    );
}
