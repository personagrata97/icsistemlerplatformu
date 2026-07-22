'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { AlertTriangle, ShieldAlert, Sliders, TrendingUp, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function RiskDashboardPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');

    const kpiAlerts = [
        {
            id: 'KPI-KRE-01',
            kod: 'KPI-KRE-001',
            ad: 'Kredi Limit Aşım Oranı (Şube Bazlı)',
            seviye: 'KIRMIZI',
            mevcutDeger: '%18.4',
            esikDeger: '%10.0',
            birim: 'Kredi Operasyonları Müdürlüğü',
            sonYukleme: '2026-07-22'
        },
        {
            id: 'KPI-LIK-04',
            kod: 'KPI-LIK-004',
            ad: '30 Günlük Net Nakit Çıkış Rasyosu',
            seviye: 'SARI',
            mevcutDeger: '%8.2',
            esikDeger: '%5.0',
            birim: 'Hazine ve Fon Yönetimi',
            sonYukleme: '2026-07-21'
        }
    ];

    const filteredKpis = kpiAlerts.filter(k => {
        if (levelFilter !== 'ALL' && k.seviye !== levelFilter) return false;
        if (searchTerm && !k.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !k.kod.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{TERMS.riskModule} — Risk İzleme ve Erken Uyarı Paneli</h2>
                    <p className="text-slate-300 text-xs mt-1">{TERMS.riskModuleDescription}</p>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold border border-slate-700">
                    BDDK Uyumlu Risk Cockpit
                </div>
            </div>

            {/* Top StatCards (Exact Section C Layout Plan) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Kırmızı KPI Sayısı (Aşım)"
                    value={1}
                    icon={AlertTriangle}
                    color="red"
                    infoTooltip="Kritik risk eşiğini aşmış mevzuat ve operasyonel uyarılardır"
                />
                <StatCard
                    title="Sarı KPI Sayısı (Erken Uyarı)"
                    value={1}
                    icon={ShieldAlert}
                    color="amber"
                    infoTooltip="Kritik eşiğe yaklaşan izleme uyarısı verilen metrikler"
                />
                <StatCard
                    title="Limit Aşan Sözleşmeler"
                    value={14}
                    icon={TrendingUp}
                    color="purple"
                    infoTooltip="Tahsis yetki limitinin üzerinde onay alan sözleşmeler"
                />
                <StatCard
                    title="Son Veri Yükleme Tarihi"
                    value="22.07.2026"
                    icon={RefreshCw}
                    color="emerald"
                    infoTooltip="Risk veritabanının en son güncellenme zamanı"
                />
            </div>

            <PageToolbar
                searchPlaceholder="KPI kodu veya adı ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={levelFilter !== 'ALL' ? 1 : 0}
                        onClear={() => setLevelFilter('ALL')}
                    >
                        <div>
                            <label className="form-label mb-1">KPI Risk Seviyesi</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Seviyeler' },
                                    { value: 'KIRMIZI', label: 'Kırmızı Seviye (Aşım)' },
                                    { value: 'SARI', label: 'Sarı Seviye (Erken Uyarı)' },
                                ]}
                                value={levelFilter}
                                onChange={val => setLevelFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'kod',
                        header: 'KPI Kodu',
                        width: '130px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                {item.kod}
                            </code>
                        )
                    },
                    {
                        key: 'ad',
                        header: 'Risk Göstergesi ve Birim',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900">{item.ad}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Sorumlu Birim: {item.birim}</div>
                            </div>
                        )
                    },
                    {
                        key: 'mevcutDeger',
                        header: 'Mevcut / Eşik',
                        width: '150px',
                        render: (item: any) => (
                            <div className="text-xs font-mono">
                                <span className="font-bold text-red-700">{item.mevcutDeger}</span> / <span className="text-gray-400">{item.esikDeger}</span>
                            </div>
                        )
                    },
                    {
                        key: 'seviye',
                        header: 'Seviye',
                        width: '130px',
                        render: (item: any) => (
                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${item.seviye === 'KIRMIZI' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                {item.seviye}
                            </span>
                        )
                    },
                    {
                        key: 'sonYukleme',
                        header: 'Son Veri',
                        width: '130px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-gray-500">{formatDate(item.sonYukleme)}</span>
                        )
                    }
                ]}
                data={filteredKpis}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setLevelFilter('ALL'); }}
                rowKey="id"
            />
        </div>
    );
}
