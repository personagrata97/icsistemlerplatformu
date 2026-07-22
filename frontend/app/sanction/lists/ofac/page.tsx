'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import { Globe, RefreshCw, Calendar, User, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function OfacListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [programFilter, setProgramFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);

    const records = [
        { id: '1', sdnId: '9841', adSoyad: 'Viktor Anatolyevich BOUT', tur: 'GERCEK', program: 'SDGT (Terör)', pasaportNo: 'RU-992144', tarih: '2026-06-15' },
        { id: '2', sdnId: '12401', adSoyad: 'Rosneft Trading S.A.', tur: 'TUZEL', program: 'VENEZUELA', pasaportNo: '-', tarih: '2026-05-20' },
        { id: '3', sdnId: '14802', adSoyad: 'Evgeny Viktorovich PRIGOZHIN', tur: 'GERCEK', program: 'RUSSIA-EO14024', pasaportNo: 'RU-102938', tarih: '2026-07-01' },
    ];

    const filteredRecords = records.filter(r => {
        if (programFilter !== 'ALL' && !r.program.includes(programFilter)) return false;
        if (typeFilter !== 'ALL' && r.tur !== typeFilter) return false;
        if (searchTerm && !r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) && !r.sdnId.includes(searchTerm) && !r.program.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const activeFilterCount = (programFilter !== 'ALL' ? 1 : 0) + (typeFilter !== 'ALL' ? 1 : 0);

    const handleRefresh = async () => {
        setLoading(true);
        showToast('ABD OFAC SDN Listesi XML canlı senkronize ediliyor...', 'info');
        await new Promise(res => setTimeout(res, 600));
        setLoading(false);
        showToast('OFAC SDN Listesi güncellendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="SDN ID, İsim veya Program Kodu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={activeFilterCount}
                        onClear={() => { setProgramFilter('ALL'); setTypeFilter('ALL'); }}
                    >
                        <div>
                            <label className="form-label mb-1">Yaptırım Programı</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Programlar' },
                                    { value: 'SDGT', label: 'SDGT (Küresel Terörizm)' },
                                    { value: 'RUSSIA', label: 'RUSSIA-EO (Rusya Yaptırımları)' },
                                    { value: 'VENEZUELA', label: 'VENEZUELA (Venezuela Yaptırımları)' },
                                ]}
                                value={programFilter}
                                onChange={(val) => setProgramFilter(val as string)}
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
                        OFAC XML Senkronize Et
                    </Button>
                }
            />
            <DataTable
                columns={[
                    {
                        key: 'sdnId',
                        header: 'SDN ID',
                        width: '110px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                                #{item.sdnId}
                            </code>
                        )
                    },
                    {
                        key: 'adSoyad',
                        header: 'Kişi / Kurum Adı',
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
                    {
                        key: 'program',
                        header: 'Yaptırım Programı',
                        width: '180px',
                        render: (item: any) => (
                            <StatusBadge value={item.program} type="risk" />
                        )
                    },
                    {
                        key: 'pasaportNo',
                        header: 'Pasaport / Kimlik No',
                        width: '150px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-gray-600">{item.pasaportNo}</span>
                        )
                    },
                    {
                        key: 'tarih',
                        header: 'Listeye Giriş Tarihi',
                        width: '140px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{item.tarih}</span>
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
