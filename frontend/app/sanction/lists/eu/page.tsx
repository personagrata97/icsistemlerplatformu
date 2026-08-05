'use client';
import PageHeader from '@/components/ui/PageHeader';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import RequireRole from '@/components/auth/RequireRole';


import PageToolbar from '@/components/ui/PageToolbar';
import Pagination from '@/components/ui/Pagination';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { RefreshCw, Calendar, Building2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { sanctionApi } from '@/lib/sanction-api';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';

function EuListPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getListEntities('EU_CONSOLIDATED', searchTerm);
            setRecords(Array.isArray(data) ? data.map((d: any) => ({
                id: d.id,
                euId: d.externalId || d.id,
                adSoyad: d.adSoyad,
                tur: d.tur || 'GERCEK',
                reg: d.aciklama || 'EU CONSOLIDATED',
                tarih: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : formatDate(new Date())
            })) : []);
        } catch (e) {
            showToast('AB listesi verileri yüklenemedi', 'error');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchTerm]);

    const filteredRecords = records.filter(r =>
        (r.adSoyad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.euId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.reg || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await sanctionApi.syncList('EU_CONSOLIDATED');
            await loadData();
            showToast('AB Konsolide Yaptırım Listesi güncellendi.', 'success');
        } catch (e) {
            showToast('Senkronizasyon başarısız', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Avrupa Birliği (EU) Listesi" subtitle="AB Konseyi mali yaptırım ve kısıtlayıcı tedbirler konsolide listesi" />
            <PageToolbar
                searchPlaceholder="EU ID, İsim veya Regülasyon Kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                rightActions={
                    <Button variant="primary" isLoading={loading} leftIcon={<RefreshCw size={16} />} onClick={handleRefresh}>
                        EU Senkronize Et
                    </Button>
                }
            />
            <DataTable
                columns={[
                    {
                        key: 'euId',
                        header: 'EU ID',
                        width: '130px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                                {item.euId}
                            </code>
                        )
                    },
                    {
                        key: 'adSoyad',
                        header: 'İsim / Kuruluş',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
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
                    { key: 'reg', header: 'AB Regülasyon Kodu' },
                    {
                        key: 'tarih',
                        header: 'Güncelleme Tarihi',
                        width: '150px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{formatDate(item.tarih)}</span>
                            </div>
                        )
                    },
                ]}
                data={filteredRecords}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}


export default function EuListPage() {
    return (
        <RequireRole allowedRoles={['UYUM_GOREVLISI', 'UYUM_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <EuListPageContent />
        </RequireRole>
    );
}
