'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { RefreshCw, Calendar, Building2, User } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';

export default function EuListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const [records, setRecords] = useState<any[]>([
        { id: '1', euId: 'EU.8841', adSoyad: 'CONSOLIDATED LIST OF FINANCIAL SANCTIONS TARGETS', tur: 'TUZEL', reg: 'EU 2024/771', tarih: '2026-05-01' },
        { id: '2', euId: 'EU.9102', adSoyad: 'Sergei Vladimirovich KOROLEV', tur: 'GERCEK', reg: 'EU 2024/890', tarih: '2026-06-12' },
    ]);

    const filteredRecords = records.filter(r =>
        r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.euId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reg.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        setLoading(true);
        showToast('AB Konsolide Yaptırım Listesi canlı senkronize ediliyor...', 'info');
        await new Promise(res => setTimeout(res, 800));

        const freshRecord = {
            id: String(Date.now()),
            euId: `EU.${Math.floor(9000 + Math.random() * 1000)}`,
            adSoyad: 'NEWLY ADDED SANCTIONED ENTITY (EU 2026/1044)',
            tur: 'TUZEL',
            reg: 'EU 2026/1044',
            tarih: '2026-07-22',
        };
        setRecords(prev => [freshRecord, ...prev]);
        setLoading(false);
        showToast('AB Listesi başarıyla güncellendi (1 yeni kayıt eklendi).', 'success');
    };

    return (
        <div className="space-y-6">
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
