'use client';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';


import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import DataTable from '@/components/ui/DataTable';
import { DateDisplay } from '@/components/ui/DateDisplay';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import { ShieldAlert, RefreshCw, Calendar, User, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { sanctionApi } from '@/lib/sanction-api';
import Pagination from '@/components/ui/Pagination';

function MasakListPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [lawFilter, setLawFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getListEntities('MASAK_6415_7262', searchTerm, { page, pageSize });
            const items = data?.items || (Array.isArray(data) ? data : []);
            setTotal(data?.total || items.length || 0);
            setRecords(items.map((d: any) => ({
                id: d.id,
                adSoyad: d.adSoyad,
                tur: d.tur || 'GERCEK',
                kararNo: d.externalId || '2026/01',
                RGNo: d.kimlikNo || '33100',
                kanun: d.aciklama || 'MASAK 6415 S.K.',
                tarih: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : formatDate(new Date())
            })));
        } catch (e) {
            showToast('MASAK verileri yüklenemedi', 'error');
            setRecords([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchTerm, page]);

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
        try {
            await sanctionApi.syncList('MASAK_6415_7262');
            await loadData();
            showToast('MASAK ve Resmî Gazete verileri güncellendi.', 'success');
        } catch (e) {
            showToast('Senkronizasyon başarısız', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="MASAK & Ulusal Listeler" subtitle="Mali Suçları Araştırma Kurulu ve Türkiye Cumhuriyeti resmi dondurma kararları" />
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
            <Pagination
                currentPage={page}
                totalItems={total || filteredRecords.length}
                itemsPerPage={pageSize}
                onPageChange={setPage}
            />
        </div>
    );
}


export default function MasakListPage() {
    return (
        <RequireRole allowedRoles={['UYUM_GOREVLISI', 'UYUM_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <MasakListPageContent />
        </RequireRole>
    );
}
