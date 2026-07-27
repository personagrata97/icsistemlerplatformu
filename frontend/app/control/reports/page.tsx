'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/audit/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { FileBarChart, CheckCircle2, Download, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlReportsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const reports = [
        { id: 'RPR-2026-Q2', ad: '2026 Q2 Dönemsel İç Kontrol Değerlendirme Raporu', birim: 'İç Kontrol Merkezi', tarih: '2026-07-20', durum: 'ONAYLANDI', yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)' },
        { id: 'RPR-2026-KRE', ad: 'Kredi Operasyonları Süreç İçi Kontrol Etkinlik Raporu', birim: 'Kredi Operasyonları Müdürlüğü', tarih: '2026-07-15', durum: 'ONAYLANDI', yazar: 'Canan Öztürk (Kıdemli Kontrolör)' },
        { id: 'RPR-2026-KVKK', ad: 'Müşteri Hakları ve KVKK Kontrol Uyum Raporu', birim: 'Müşteri İlişkileri', tarih: '2026-07-10', durum: 'TASLAK', yazar: 'Zeynep Kaya (İç Kontrolör)' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="İç Kontrol Raporları"
                subtitle="Üst Yönetim ve Denetim Komitesi sunumuna hazır İç Kontrol Dönem Raporları"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Yayınlanan Dönem Raporu" value={3} icon={FileBarChart} color="blue" />
                <StatCard title="Onaylanan Raporlar" value={2} icon={CheckCircle2} color="emerald" />
                <StatCard title="Taslak Raporlar" value={1} icon={FileBarChart} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Rapor adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => showToast('Yeni İç Kontrol Rapor Taslağı Oluşturuldu', 'info')}
                    >
                        Yeni Rapor Oluştur
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Rapor Kodu', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Rapor Tanımı', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Birim: {item.birim} • Hazırlayan: {item.yazar}</div>
                        </div>
                    ) },
                    { key: 'durum', header: 'Durum', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Rapor Tarihi', width: '150px', render: (item: any) => <DateDisplay date={item.tarih} /> },
                    { key: 'actions', header: 'İşlem', width: '120px', render: () => (
                        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={() => showToast('Rapor PDF olarak indiriliyor', 'success')}>
                            İndir
                        </Button>
                    ) }
                ]}
                data={reports}
                rowKey="id"
            />
        </div>
    );
}
