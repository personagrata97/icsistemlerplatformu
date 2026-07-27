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
import { FileCheck, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlRCSAPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const selfAssessments = [
        { id: 'KÖD-2026-Q2-01', birim: 'Kredi Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 92, tarih: '2026-07-15', sorumlusu: 'Mehmet Demir (BKS)' },
        { id: 'KÖD-2026-Q2-02', birim: 'Hazine ve Fon Yönetimi', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 96, tarih: '2026-07-18', sorumlusu: 'Ayşe Şahin (BKS)' },
        { id: 'KÖD-2026-Q2-03', birim: 'Şube Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'DEĞERLENDİRMEDE', skor: 78, tarih: '2026-07-20', sorumlusu: 'Zeynep Kaya (İç Kontrolör)' },
        { id: 'KÖD-2026-Q2-04', birim: 'Bilgi Teknolojileri ve Altyapı', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 94, tarih: '2026-07-22', sorumlusu: 'Canan Öztürk (Kıdemli Kontrolör)' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Birim Öz Değerlendirmeleri (KÖD)"
                subtitle="İş birimlerinin kendi süreç içi kontrollerini dönemsel değerlendirdiği öz değerlendirme modülü"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Aktif Dönem Formları" value={4} icon={FileCheck} color="blue" />
                <StatCard title="Tamamlanma Oranı" value="%88" icon={CheckCircle2} color="emerald" />
                <StatCard title="Ortalama Birim Skoru" value="%90" icon={CheckCircle2} color="purple" />
                <StatCard title="Değerlendirmede" value={1} icon={Clock} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Birim veya dönem ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => showToast('Yeni Dönem Öz Değerlendirme (KÖD) Formu Başlatıldı', 'info')}
                    >
                        Yeni Dönem Başlat
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Form Kodu', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'birim', header: 'Değerlendirilen Birim', sortable: true },
                    { key: 'donem', header: 'Dönem', width: '120px' },
                    { key: 'sorumlusu', header: 'Birim Sorumlusu', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.sorumlusu}</span> },
                    { key: 'skor', header: 'Skor', width: '130px', render: (item: any) => (
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">%{item.skor}</span>
                    ) },
                    { key: 'durum', header: 'Durum', width: '160px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Tamamlanma Tarihi', width: '150px', render: (item: any) => <DateDisplay date={item.tarih} /> }
                ]}
                data={selfAssessments}
                rowKey="id"
            />
        </div>
    );
}
