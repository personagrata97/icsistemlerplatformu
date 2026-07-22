'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { ShieldCheck, CheckCircle2, AlertOctagon, Sliders, RefreshCw, Layers, Activity, FileCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function PharosControlPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'inventory' | 'kod'>('inventory');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const controls = [
        {
            id: 'KNT-KRE-001',
            ad: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü',
            surec: 'Kredi Tahsis ve Operasyon',
            tur: 'ÖNLEYİCİ',
            yontem: 'OTOMATİK',
            siklik: 'GÜNLÜK',
            sahip: 'Kredi Operasyonları Müdürlüğü',
            dayandigiRisk: 'Yetkisiz Kredi Kullandırımı Riski',
            etkinlikSkoru: 95,
            durum: 'ETKİN',
            sonTest: '2026-07-15'
        },
        {
            id: 'KNT-KVKK-008',
            ad: 'Müşteri İzin Formu Girişi ve Onay Kontrolü',
            surec: 'Müşteri İlişkileri ve Gişe',
            tur: 'TESPİT EDİCİ',
            yontem: 'MANUEL',
            siklik: 'HAFTALIK',
            sahip: 'Birim Uyum Sorumlusu',
            dayandigiRisk: 'KVKK İhlali ve İdari Para Cezası Riski',
            etkinlikSkoru: 65,
            durum: 'GELİŞİME_AÇIK',
            sonTest: '2026-07-10'
        },
        {
            id: 'KNT-MUH-012',
            ad: 'Gün Sonu Genel Muhasebe Mutabakatı',
            surec: 'Mali İşler ve Muhasebe',
            tur: 'TESPİT EDİCİ',
            yontem: 'OTOMATİK',
            siklik: 'GÜNLÜK',
            sahip: 'Genel Muhasebe Müdürlüğü',
            dayandigiRisk: 'Mali Tablo Hataları Riski',
            etkinlikSkoru: 98,
            durum: 'ETKİN',
            sonTest: '2026-07-21'
        }
    ];

    const selfAssessments = [
        { id: '1', birim: 'Kredi Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 92, tarih: '2026-07-15' },
        { id: '2', birim: 'Hazine ve Fon Yönetimi', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 96, tarih: '2026-07-18' },
        { id: '3', birim: 'Şube Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'DEĞERLENDİRMEDE', skor: 78, tarih: '2026-07-20' },
    ];

    const filteredControls = controls.filter(c => {
        if (statusFilter !== 'ALL' && c.durum !== statusFilter) return false;
        if (searchTerm && !c.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !c.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{TERMS.controlModule} — COSO 2013 İç Kontrol Yönetimi</h2>
                    <p className="text-slate-300 text-xs mt-1">{TERMS.controlModuleDescription}</p>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold border border-slate-700">
                    2. Savunma Hattı (İç Kontrol)
                </div>
            </div>

            {/* Top StatCards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Kontrol Envanteri"
                    value={48}
                    icon={Layers}
                    color="blue"
                    infoTooltip="Sistemde kayıtlı COSO 2013 süreç içi kontrol noktaları"
                />
                <StatCard
                    title="Etkin Kontroller (%80+)"
                    value={38}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="İç denetim ve birim KÖD testleri sonucunda etkin bulunanlar"
                />
                <StatCard
                    title="Gelişime Açık Kontroller"
                    value={7}
                    icon={Sliders}
                    color="amber"
                    infoTooltip="Kısmen çalışan veya iyileştirme gereken kontroller"
                />
                <StatCard
                    title="KÖD Tamamlanma Oranı"
                    value="%88"
                    icon={FileCheck}
                    color="purple"
                    infoTooltip="2026 Q2 Birim Kontrol Öz Değerlendirme dönemi katılımı"
                />
            </div>

            <SegmentedTabs
                tabs={[
                    { id: 'inventory', label: 'Kontrol Envanteri (COSO 2013)', icon: Layers },
                    { id: 'kod', label: 'Birim Öz Değerlendirmesi (KÖD)', icon: FileCheck },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as 'inventory' | 'kod')}
            />

            {activeTab === 'inventory' ? (
                <div className="space-y-4">
                    <PageToolbar
                        searchPlaceholder="Kontrol kodu veya adı ile ara..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        filters={
                            <FilterDropdown
                                label="Filtrele"
                                activeCount={statusFilter !== 'ALL' ? 1 : 0}
                                onClear={() => setStatusFilter('ALL')}
                            >
                                <div>
                                    <label className="form-label mb-1">Kontrol Etkinlik Durumu</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'ALL', label: 'Tüm Kontroller' },
                                            { value: 'ETKİN', label: 'Etkin Kontroller' },
                                            { value: 'GELİŞİME_AÇIK', label: 'Gelişime Açık Kontroller' },
                                            { value: 'ETKİNSİZ', label: 'Etkisiz Kontroller' },
                                        ]}
                                        value={statusFilter}
                                        onChange={(val) => setStatusFilter(val as string)}
                                    />
                                </div>
                            </FilterDropdown>
                        }
                    />

                    <DataTable
                        columns={[
                            {
                                key: 'id',
                                header: 'Kontrol Kodu',
                                width: '140px',
                                render: (item: any) => (
                                    <code className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                                        {item.id}
                                    </code>
                                )
                            },
                            {
                                key: 'ad',
                                header: 'Kontrol Tanımı ve Süreç',
                                sortable: true,
                                render: (item: any) => (
                                    <div>
                                        <div className="font-bold text-gray-900">{item.ad}</div>
                                        <div className="text-[11px] text-gray-500 mt-0.5">Süreç: {item.surec} • Sahip: {item.sahip}</div>
                                    </div>
                                )
                            },
                            {
                                key: 'tur',
                                header: 'Tür / Yöntem',
                                width: '160px',
                                render: (item: any) => (
                                    <div className="text-xs text-gray-700 font-medium">
                                        <div>{item.tur}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{item.yontem} ({item.siklik})</div>
                                    </div>
                                )
                            },
                            {
                                key: 'dayandigiRisk',
                                header: 'Dayandığı Risk',
                                width: '200px',
                                render: (item: any) => (
                                    <span className="text-xs text-gray-600 font-medium">{item.dayandigiRisk}</span>
                                )
                            },
                            {
                                key: 'etkinlikSkoru',
                                header: 'Etkinlik Skoru',
                                width: '130px',
                                render: (item: any) => (
                                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${item.etkinlikSkoru >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        %{item.etkinlikSkoru}
                                    </span>
                                )
                            },
                            {
                                key: 'durum',
                                header: 'Durum',
                                width: '130px',
                                render: (item: any) => <StatusBadge value={item.durum} type="status" />
                            }
                        ]}
                        data={filteredControls}
                        searchTerm={searchTerm}
                        onClearFilters={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                        rowKey="id"
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <DataTable
                        columns={[
                            { key: 'birim', header: 'Değerlendirilen Birim', sortable: true },
                            { key: 'donem', header: 'Dönem', width: '120px' },
                            {
                                key: 'skor',
                                header: 'Öz Değerlendirme Skoru',
                                width: '160px',
                                render: (item: any) => (
                                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                                        %{item.skor}
                                    </span>
                                )
                            },
                            {
                                key: 'durum',
                                header: 'Durum',
                                width: '160px',
                                render: (item: any) => <StatusBadge value={item.durum} type="status" />
                            },
                            {
                                key: 'tarih',
                                header: 'Tamamlanma Tarihi',
                                width: '150px',
                                render: (item: any) => (
                                    <span className="font-mono text-xs text-gray-500">{formatDate(item.tarih)}</span>
                                )
                            }
                        ]}
                        data={selfAssessments}
                        rowKey="id"
                    />
                </div>
            )}
        </div>
    );
}
