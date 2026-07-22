'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function OfacListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const records = [
        { id: '1', sdnId: '9841', adSoyad: 'Viktor Anatolyevich BOUT', tur: 'GERCEK', program: 'SDGT', pasaportNo: 'RU-992144', tarih: '2024-02-10' },
        { id: '2', sdnId: '12401', adSoyad: 'Rosneft Trading S.A.', tur: 'TUZEL', program: 'VENEZUELA', pasaportNo: '-', tarih: '2023-11-05' },
    ];

    const filteredRecords = records.filter(r =>
        r.adSoyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sdnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.program.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        setLoading(true);
        showToast('ABD OFAC SDN Listesi XML senkronize ediliyor...', 'info');
        await new Promise(res => setTimeout(res, 600));
        setLoading(false);
        showToast('OFAC SDN Listesi güncellendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="ABD OFAC SDN Yaptırım Listesi"
                subtitle="Office of Foreign Assets Control Specially Designated Nationals List"
            />
            <PageToolbar
                searchPlaceholder="SDN ID, İsim veya Program Kodu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={handleRefresh}
                rightActions={
                    <Button variant="primary" isLoading={loading} leftIcon={<RefreshCw size={16} />} onClick={handleRefresh}>
                        OFAC XML Senkronize Et
                    </Button>
                }
            />
            <DataTable
                columns={[
                    { key: 'sdnId', header: 'SDN ID', width: '100px' },
                    { key: 'adSoyad', header: 'Kişi / Kurum Adı', sortable: true },
                    { key: 'tur', header: 'Tür', width: '100px' },
                    { key: 'program', header: 'Yaptırım Programı', width: '160px' },
                    { key: 'pasaportNo', header: 'Pasaport / ID', width: '140px' },
                    { key: 'tarih', header: 'Listeye Giriş Tarihi', width: '140px' }
                ]}
                data={filteredRecords}
                rowKey="id"
            />
        </div>
    );
}
