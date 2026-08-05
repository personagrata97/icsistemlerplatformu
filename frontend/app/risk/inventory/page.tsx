'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { MODULE_TERMS } from '@/lib/terminology';
import { useToast } from '@/components/Toast';
import { riskApi } from '@/lib/risk-api';
import {
    Layers, Shield, RefreshCw, BarChart2
} from 'lucide-react';

export default function RiskInventoryPage() {
    return (
        <RequireRole allowedRoles={['RISK_UZMANI', 'RISK_YONETICI', 'ADMIN', 'SUPER_ADMIN', 'BIRIM_KULLANICISI']}>
            <RiskInventoryContent />
        </RequireRole>
    );
}

function RiskInventoryContent() {
    const { showToast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [kpiList, setKpiList] = useState<any[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadKpis = async () => {
        setLoading(true);
        try {
            const data = await riskApi.getKpis();
            setKpiList(Array.isArray(data) ? data : (data?.items || []));
        } catch (error) {
            console.error('Risk envanteri yükleme hatası:', error);
            showToast('Risk envanteri verileri yüklenirken hata oluştu.', 'error');
            setKpiList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKpis();
    }, []);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory([]);
    };

    const filtered = kpiList.filter((k: any) => {
        const name = k.kpi_adi || k.name || '';
        const code = k.kpi_kodu || k.code || '';
        const category = k.kategori || k.category || '';
        const q = searchTerm.toLowerCase();

        const matchesSearch = name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
        const matchesCategory = selectedCategory.length === 0 || selectedCategory.includes(category);

        return matchesSearch && matchesCategory;
    });

    const isFiltered = searchTerm !== '' || selectedCategory.length > 0;
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns: Column<any>[] = [
        {
            key: 'kpi_kodu',
            header: 'Gösterge Kodu & Tanımı',
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.kpi_kodu || row.code} />
                        <span className="font-semibold text-sm text-slate-800">{row.kpi_adi || row.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{row.aciklama || row.description || 'Risk gösterge açıklaması'}</p>
                </div>
            )
        },
        {
            key: 'kategori',
            header: 'Kategori',
            render: (row: any) => (
                <span className="text-xs font-medium text-slate-700">{row.kategori || row.category || 'Likidite & Finansal'}</span>
            )
        },
        {
            key: 'birim',
            header: 'Sorumlu Birim',
            render: (row: any) => (
                <span className="text-xs text-slate-700">{row.sorumlu_birim || row.unit || 'Risk Yönetimi'}</span>
            )
        },
        {
            key: 'esik_deger',
            header: 'Eşik Değer',
            render: (row: any) => (
                <span className="font-mono text-xs font-bold text-slate-800">{row.esik_deger || row.threshold || '-'}</span>
            )
        },
        {
            key: 'durum',
            header: 'İzleme Durumu',
            render: (row: any) => <StatusBadge type="status" value={row.durum || 'Aktif'} />
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Risk Göstergeleri & Limit Envanteri"
                subtitle={`İzlenen risk göstergeleri (KPI), limit eşikleri, izleme dönemleri ve sorumlu birim haritası (${MODULE_TERMS.risk.evren}).`}
                actions={
                    <Button variant="outline" size="sm" onClick={loadKpis} leftIcon={<RefreshCw size={14} />}>
                        Yenile
                    </Button>
                }
            />

            {/* Scorecard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Toplam Risk Göstergesi"
                    value={kpiList.length}
                    icon={Layers}
                    color="blue"
                />
                <StatCard
                    title="İzleme Dönemi"
                    value={MODULE_TERMS.risk.calismaBirimi}
                    icon={BarChart2}
                    color="indigo"
                />
                <StatCard
                    title="Aktif Limit Kontrolleri"
                    value={kpiList.filter(k => (k.durum || 'Aktif') === 'Aktif').length}
                    icon={Shield}
                    color="emerald"
                />
            </div>

            {/* Toolbar */}
            <PageToolbar
                searchPlaceholder="Gösterge kodu veya tanım arayınız..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadKpis}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={selectedCategory.length}
                        onClear={clearFilters}
                    >
                        <div className="space-y-4 min-w-[220px]">
                            <CustomSelect
                                label="Kategori"
                                placeholder="Tümü"
                                isMulti
                                value={selectedCategory}
                                onChange={(val) => setSelectedCategory(val as string[])}
                                options={[
                                    { value: 'Likidite', label: 'Likidite Riskleri' },
                                    { value: 'Piyasa', label: 'Piyasa & Faiz Riski' },
                                    { value: 'Kredi', label: 'Kredi Riski' },
                                    { value: 'Operasyonel', label: 'Operasyonel Risk' }
                                ]}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            {/* Content Table or EmptyState */}
            {filtered.length === 0 && !loading ? (
                <EmptyState
                    icon={Layers}
                    title="Risk Göstergesi Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun risk göstergesi bulunamadı. Filtreleri temizleyebilirsiniz.' : 'Sistemde henüz tanımlı risk göstergesi bulunmuyor.'}
                    action={isFiltered ? { label: 'Filtreleri Temizle', onClick: clearFilters } : undefined}
                />
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={paginatedItems}
                        columns={columns}
                        loading={loading}
                        rowKey="kpi_kodu"
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
