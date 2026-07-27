'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import { AlertOctagon, CheckCircle2, Clock, Plus, Sliders } from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';

export default function ControlDeficienciesSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const deficiencies = [
        {
            id: 'EKS-2026-001',
            ad: 'Müşteri Kimlik Doğrulama Formlarında İkinci İntibak Onayı Eksikliği',
            birim: 'Müşteri İlişkileri ve Gişe',
            kontroKodu: 'KNT-KVKK-008',
            seviye: 'YÜKSEK',
            durum: 'AKSIYONDA',
            sorumlu: 'Zeynep Kaya (BKS)',
            hedetTarih: '2026-08-15',
            tespitTarihi: '2026-07-02'
        },
        {
            id: 'EKS-2026-002',
            ad: 'Hazine Gün Sonu Pozisyon Limit Kontrolünde Manuel Gecikme',
            birim: 'Hazine ve Fon Yönetimi',
            kontroKodu: 'KNT-HZ-004',
            seviye: 'ORTA',
            durum: 'GÖZDEN_GEÇİRMEDE',
            sorumlu: 'Ayşe Şahin (BKS)',
            hedetTarih: '2026-08-30',
            tespitTarihi: '2026-07-10'
        },
        {
            id: 'EKS-2026-003',
            ad: 'Kredi Dosyalarında Çapraz İptek Şerhi Girişi Unutulması',
            birim: 'Kredi Operasyonları Müdürlüğü',
            kontroKodu: 'KNT-KRE-001',
            seviye: 'DÜŞÜK',
            durum: 'KAPANDI',
            sorumlu: 'Mehmet Demir (BKS)',
            hedetTarih: '2026-07-20',
            tespitTarihi: '2026-06-15'
        }
    ];

    const filteredDeficiencies = deficiencies.filter(d => {
        if (searchTerm && !d.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Kontrol Eksikliği"
                    value={12}
                    icon={AlertOctagon}
                    color="red"
                    infoTooltip="Kontrol testleri ve öz değerlendirmelerde tespit edilen açık eksiklikler"
                />
                <StatCard
                    title="Aksiyondaki Eksiklikler"
                    value={8}
                    icon={Clock}
                    color="amber"
                    infoTooltip="Düzeltici aksiyon planı yürürlükte olan eksiklikler"
                />
                <StatCard
                    title="Kapatılan Eksiklikler"
                    value={24}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Düzeltici kontrolleri doğrulanarak kapatılan eksiklikler"
                />
                <StatCard
                    title="Gecikmedeki Aksiyonlar"
                    value={1}
                    icon={Sliders}
                    color="purple"
                    infoTooltip="Hedef termin tarihini aşmış düzeltici aksiyonlar"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Eksiklik tanımı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => showToast('Yeni Kontrol Eksikliği Kaydı ekranı açıldı', 'info')}
                    >
                        Eksiklik Kaydı Ekle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'id',
                        header: 'Eksiklik Kodu',
                        width: '130px',
                        render: (item: any) => <CodeBadge code={item.id} />
                    },
                    {
                        key: 'ad',
                        header: 'Eksiklik Tanımı & İlgili Kontrol',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-slate-900">{item.ad}</div>
                                <div className="text-xs text-slate-500 font-medium">Birim: {item.birim} • Kontrol: {item.kontroKodu}</div>
                            </div>
                        )
                    },
                    {
                        key: 'seviye',
                        header: 'Önem Seviyesi',
                        width: '130px',
                        render: (item: any) => (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.seviye === 'YÜKSEK' ? 'bg-red-100 text-red-800' : item.seviye === 'ORTA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                {item.seviye}
                            </span>
                        )
                    },
                    {
                        key: 'sorumlu',
                        header: 'Sorumlu BKS',
                        width: '170px',
                        render: (item: any) => (
                            <span className="text-xs font-semibold text-slate-700">{item.sorumlu}</span>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '140px',
                        render: (item: any) => <StatusBadge value={item.durum} type="status" />
                    },
                    {
                        key: 'hedetTarih',
                        header: 'Hedef Termin',
                        width: '130px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-slate-600">{formatDate(item.hedetTarih)}</span>
                        )
                    }
                ]}
                data={filteredDeficiencies}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}
