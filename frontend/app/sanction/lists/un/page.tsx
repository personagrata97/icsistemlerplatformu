'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import { Database, RefreshCw, Calendar, User, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';

export default function UnListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [committeeFilter, setCommitteeFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);

    const [records, setRecords] = useState<any[]>([
        { id: '1', unId: 'QDi.001', adSoyad: 'AL-QAIDA CONSOLIDATED LIST', tur: 'TUZEL', organ: 'UNSC 1267/1989/2253 Komitesi', tarih: '2026-07-01' },
        { id: '2', unId: 'TAi.014', adSoyad: 'Mullah Mohammad OMAR', tur: 'GERCEK', organ: 'UNSC 1988 Komitesi (Taliban)', tarih: '2026-06-18' },
    ]);

    const filteredRecords = records.filter(r => {
        if (committeeFilter !== 'ALL' && !r.organ.includes(committeeFilter)) return false;
        if (typeFilter !== 'ALL' && r.tur !== typeFilter) return false;
        if (searchTerm && !r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) && !r.unId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const activeFilterCount = (committeeFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);

    const handleRefresh = async () => {
        setLoading(true);
        showToast('BM Güvenlik Konseyi Konsolide XML canlı senkronize ediliyor...', 'info');
        await new Promise(res => setTimeout(res, 800));

        const freshRecord = {
            id: String(Date.now()),
            unId: `QDi.${Math.floor(100 + Math.random() * 900)}`,
            adSoyad: 'NEWLY LISTED UNSC SANCTION TARGET',
            tur: 'GERCEK',
            organ: 'UNSC 1267 Komitesi',
            tarih: '2026-07-22',
        };
        setRecords(prev => [freshRecord, ...prev]);
        setLoading(false);
        showToast('UNSC Yaptırım Listesi güncellendi (1 yeni kayıt eklendi).', 'success');
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="UN Ref No veya İsim ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={activeFilterCount}
                        onClear={() => { setCommitteeFilter('ALL'); setTypeFilter('ALL'); }}
                    >
                        <div>
                            <label className="form-label mb-1">BM Karar Komitesi</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Komiteler' },
                                    { value: '1267', label: 'UNSC 1267 (Al-Qaida/ISIL)' },
                                    { value: '1988', label: 'UNSC 1988 (Taliban)' },
                                ]}
                                value={committeeFilter}
                                onChange={(val) => setCommitteeFilter(val as string)}
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
                        UNSC XML Senkronize Et
                    </Button>
                }
            />
            <DataTable
                columns={[
                    {
                        key: 'unId',
                        header: 'UN Ref No',
                        width: '120px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                                {item.unId}
                            </code>
                        )
                    },
                    {
                        key: 'adSoyad',
                        header: 'İsim / Kuruluş',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
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
                        key: 'organ',
                        header: 'BM Karar Komitesi',
                        render: (item: any) => (
                            <StatusBadge value={item.organ} type="status" />
                        )
                    },
                    {
                        key: 'tarih',
                        header: 'BM Karar Tarihi',
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
                rowKey="id"
            />
        </div>
    );
}
