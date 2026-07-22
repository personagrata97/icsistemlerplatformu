'use client';

import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { useState } from 'react';

export default function SanctionHistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const history = [
        { id: '1', tetikleyici: 'PERİYODİK (OTOMATİK)', taranan: 14250, eslesme: 2, baslangic: '2026-07-22 06:00', sure: '3.4s', calistiran: 'Cron Job' },
        { id: '2', tetikleyici: 'YENİ MÜŞTERİ KAYDI', taranan: 1, eslesme: 0, baslangic: '2026-07-22 09:12', sure: '0.12s', calistiran: 'Gişe Sistemi' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Yaptırım Tarama Geçmişi ve Denetim İzi"
                subtitle="Sistem Tarafından Yürütülen Tüm Otomatik ve Anlık Tarama Günlükleri"
            />
            <PageToolbar searchPlaceholder="Tarama geçmişinde ara..." searchValue={searchTerm} onSearchChange={setSearchTerm} />
            <DataTable columns={[{ key: 'tetikleyici', header: 'Tetikleyici Türü' }, { key: 'taranan', header: 'Taranan Kayıt', width: '120px', align: 'right' }, { key: 'eslesme', header: 'Eşleşme Sayısı', width: '130px', align: 'right', render: (item: any) => <span className={item.eslesme > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{item.eslesme}</span> }, { key: 'baslangic', header: 'Zaman Stamp' }, { key: 'sure', header: 'İşlem Süresi', width: '100px' }, { key: 'calistiran', header: 'Çalıştıran' }]} data={history} rowKey="id" />
        </div>
    );
}
