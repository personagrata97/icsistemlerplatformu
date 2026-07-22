'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function MasakListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const records = [
        { id: '1', adSoyad: 'Zelımkhan YANDARBIEV', tur: 'GERCEK', kararNo: '2024/12', RGNo: '32412', kanun: '6415 S.K. m.5', tarih: '2024-01-15' },
        { id: '2', adSoyad: 'Al-Furqan Medya Vakfı', tur: 'TUZEL', kararNo: '2024/44', RGNo: '32488', kanun: '7262 S.K. m.3', tarih: '2024-03-22' },
        { id: '3', adSoyad: 'Tariq Anwar AL-SAYED', tur: 'GERCEK', kararNo: '2025/08', RGNo: '32710', kanun: '6415 S.K. m.7', tarih: '2025-05-10' },
    ];

    const filteredRecords = records.filter(r =>
        r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.kararNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.kanun.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        setLoading(true);
        showToast('Resmî Gazete & MASAK listesi güncelleniyor...', 'info');
        await new Promise(res => setTimeout(res, 600));
        setLoading(false);
        showToast('MASAK listesi başarıyla güncellendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="MASAK & Resmî Gazete Yaptırım Listesi (6415 / 7262 S.K.)"
                subtitle="Terörizmin Finansmanı ve Kitle İmha Silahlarının Yayılmasının Önlenmesi Resmî Gazete Kararları"
            />
            <PageToolbar
                searchPlaceholder="Kişi, kurum veya karar no ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                rightActions={
                    <Button variant="primary" isLoading={loading} leftIcon={<RefreshCw size={16} />} onClick={handleRefresh}>
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
                data={filteredRecords}
                rowKey="id"
            />
        </div>
    );
}
