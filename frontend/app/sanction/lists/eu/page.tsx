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

    const records = [
        { id: '1', euId: 'EU.8841', adSoyad: 'CONSOLIDATED LIST OF FINANCIAL SANCTIONS TARGETS', tur: 'TUZEL', reg: 'EU 2024/771', tarih: '2024-05-01' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Avrupa Birliği Konsolide Yaptırım Listesi"
                subtitle="EU Financial Sanctions Consolidated List"
            />
            <PageToolbar searchPlaceholder="EU ID veya İsim ara..." searchValue={searchTerm} onSearchChange={setSearchTerm} rightActions={<Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={() => showToast('EU Sanctions XML güncellendi.', 'success')}>EU Senkronize Et</Button>} />
            <DataTable columns={[{ key: 'euId', header: 'EU ID', width: '120px' }, { key: 'adSoyad', header: 'İsim / Kuruluş' }, { key: 'tur', header: 'Tür', width: '100px' }, { key: 'reg', header: 'AB Regülasyon Kodu' }]} data={records} rowKey="id" />
        </div>
    );
}
