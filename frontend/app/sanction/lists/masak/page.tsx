'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function MasakListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const records = [
        { id: '1', adSoyad: 'Zelımkhan YANDARBIEV', tur: 'GERCEK', kararNo: '2024/12', RGNo: '32412', kanun: '6415 S.K. m.5', tarih: '2024-01-15' },
        { id: '2', adSoyad: 'Al-Furqan Medya Vakfı', tur: 'TUZEL', kararNo: '2024/44', RGNo: '32488', kanun: '7262 S.K. m.3', tarih: '2024-03-22' },
        { id: '3', adSoyad: 'Tariq Anwar AL-SAYED', tur: 'GERCEK', kararNo: '2025/08', RGNo: '32710', kanun: '6415 S.K. m.7', tarih: '2025-05-10' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="MASAK & Resmî Gazete Yaptırım Listesi (6415 / 7262 S.K.)"
                subtitle="Terörizmin Finansmanı ve Kitle İmha Silahlarının Yayılmasının Önlenmesi Resmî Gazete Kararları"
            />

            <PageToolbar
                searchPlaceholder="Kişi veya kurum ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={() => showToast('Resmî Gazete API canlı senkronizasyonu tamamlandı.', 'success')}>
                        Resmî Gazete API Güncelle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'adSoyad', header: 'Kişi / Kurum Adı', sortable: true },
                    { key: 'tur', header: 'Tür', width: '100px' },
                    { key: 'kanun', header: 'Kanun Maddesi', width: '150px' },
                    { key: 'kararNo', header: 'Cumhurbaşkanı Karar No', width: '180px' },
                    { key: 'RGNo', header: 'Resmî Gazete Sayısı', width: '160px' },
                    { key: 'tarih', header: 'Yayın Tarihi', width: '120px' }
                ]}
                data={records}
                rowKey="id"
            />
        </div>
    );
}
