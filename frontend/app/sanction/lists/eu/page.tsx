'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function EuListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const records = [
        { id: '1', euId: 'EU.8841', adSoyad: 'CONSOLIDATED LIST OF FINANCIAL SANCTIONS TARGETS', tur: 'TUZEL', reg: 'EU 2024/771', tarih: '2024-05-01' },
        { id: '2', euId: 'EU.9102', adSoyad: 'Sergei Vladimirovich KOROLEV', tur: 'GERCEK', reg: 'EU 2024/890', tarih: '2024-06-12' },
    ];

    const filteredRecords = records.filter(r =>
        r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.euId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reg.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        setLoading(true);
        showToast('AB Konsolide Yaptırım Listesi senkronize ediliyor...', 'info');
        await new Promise(res => setTimeout(res, 600));
        setLoading(false);
        showToast('AB Listesi başarıyla güncellendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Avrupa Birliği Konsolide Yaptırım Listesi"
                subtitle="EU Financial Sanctions Consolidated List"
            />
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
                    { key: 'euId', header: 'EU ID', width: '120px' },
                    { key: 'adSoyad', header: 'İsim / Kuruluş', sortable: true },
                    { key: 'tur', header: 'Tür', width: '100px' },
                    { key: 'reg', header: 'AB Regülasyon Kodu' },
                    { key: 'tarih', header: 'Güncelleme Tarihi', width: '150px' },
                ]}
                data={filteredRecords}
                rowKey="id"
            />
        </div>
    );
}
