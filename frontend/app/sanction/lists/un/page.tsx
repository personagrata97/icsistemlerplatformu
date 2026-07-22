'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function UnListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const records = [
        { id: '1', unId: 'QDi.001', adSoyad: 'AL-QAIDA CONSOLIDATED LIST', tur: 'TUZEL', organ: 'UN Security Council 1267', tarih: '2024-01-01' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Birleşmiş Milletler Güvenlik Konseyi Yaptırım Listesi"
                subtitle="UN Security Council Consolidated Sanctions List"
            />
            <PageToolbar searchPlaceholder="UN ID veya İsim ara..." searchValue={searchTerm} onSearchChange={setSearchTerm} rightActions={<Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={() => showToast('UNSC XML güncellendi.', 'success')}>UNSC Senkronize Et</Button>} />
            <DataTable columns={[{ key: 'unId', header: 'UN Ref No', width: '120px' }, { key: 'adSoyad', header: 'İsim / Kuruluş' }, { key: 'tur', header: 'Tür', width: '100px' }, { key: 'organ', header: 'BM Karar Komitesi' }]} data={records} rowKey="id" />
        </div>
    );
}
