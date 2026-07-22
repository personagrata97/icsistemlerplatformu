'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import { Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function CustomListPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const records = [
        { id: '1', musteriAd: 'Sahte Belge Düzenleyen A.Ş.', tckn: '998234120', gerekce: 'Teftiş Kurulu Soruşturma Raporu İSR.2.2025', ekleyen: 'Selim KAYA', tarih: '2025-11-10' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Kurum İçi Özel Kara Liste"
                subtitle="Emlak Katılım Teftiş ve Uyum Tarafından Tanımlanan Dahili Yasaklı Listesi"
            />
            <PageToolbar
                searchPlaceholder="Dahili kara listede ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                showAddButton={true}
                onAddClick={() => showToast('Yeni dahili yasaklı kaydı ekleme penceresi açıldı.', 'info')}
                addButtonText="Yeni Kayıt Ekle"
            />
            <DataTable columns={[{ key: 'musteriAd', header: 'Kişi / Kurum Adı' }, { key: 'tckn', header: 'TCKN / VKN', width: '140px' }, { key: 'gerekce', header: 'Yasaklama Gerekçesi' }, { key: 'ekleyen', header: 'Ekleme Yapan', width: '140px' }, { key: 'tarih', header: 'Tarih', width: '120px' }]} data={records} rowKey="id" />
        </div>
    );
}
