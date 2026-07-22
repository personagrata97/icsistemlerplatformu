'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function SanctionReportsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const reports = [
        { id: '1', ad: 'MASAK Yıllık Uyum Denetim Raporu 2026', tur: 'MASAK UYUM', tarih: '2026-07-01', olusturan: 'Sistem' },
        { id: '2', ad: 'Aylık Yaptırım Taraması İstatistik Raporu', tur: 'İSTATİSTİK', tarih: '2026-07-15', olusturan: 'Selim KAYA' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Yaptırım ve MASAK Uyum Raporları"
                subtitle="Denetim Kurulu ve Uyum Başkanlığı için Üretilen Yaptırım Raporları"
            />
            <PageToolbar searchPlaceholder="Rapor ara..." searchValue={searchTerm} onSearchChange={setSearchTerm} />
            <DataTable columns={[{ key: 'ad', header: 'Rapor Adı' }, { key: 'tur', header: 'Rapor Türü', width: '160px' }, { key: 'tarih', header: 'Tarih', width: '120px' }, { key: 'olusturan', header: 'Oluşturan', width: '140px' }, { key: 'act', header: 'İndir', width: '100px', align: 'center', render: (item: any) => <Button size="sm" variant="secondary" leftIcon={<Download size={14} />} onClick={() => showToast('Rapor indiriliyor...', 'info')}>PDF</Button> }]} data={reports} rowKey="id" />
        </div>
    );
}
