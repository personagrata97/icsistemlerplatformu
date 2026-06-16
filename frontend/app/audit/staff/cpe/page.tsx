'use client';

import React, { useState, useEffect } from 'react';
import { auditApi } from '@/lib/audit-api';
import { Users, TrendingUp, TrendingDown, Minus, Clock, BookOpen, FileText, Eye } from 'lucide-react';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';
import PageHeader from '@/components/audit/PageHeader';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, getPhotoUrl } from '@/lib/audit-utils';
import { useAuth } from '@/context/AuthContext';
import { ROLES, checkRole } from '@/lib/auth-constants';
import Badge from '@/components/ui/Badge';
import { Lock } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StaffTabs from '@/components/audit/staff/StaffTabs';

const normalizeName = (name: string) => {
    return name.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
};

const TITLES = [
    'Müfettiş Yardımcısı', 
    'Yetkili Müfettiş Yardımcısı', 
    'Müfettiş', 
    'Kıdemli Müfettiş', 
    'Başmüfettiş', 
    'Teftiş Kurulu Müdürü'
];

export default function CpePage() {
    const { user, hasRole } = useAuth();
    const canManage = hasRole ? checkRole(hasRole, ROLES.STAFF_MANAGER) : false;

    const checkIsSelf = (row: any) => {
        const isIdMatch = String(row.id) === String(user?.id);
        const userName = user?.displayName || (user as any)?.name || user?.username || '';
        const normUser = normalizeName(userName);
        const normStaff = normalizeName(row.name || '');
        return isIdMatch || Boolean(normUser && normStaff && (normUser.includes(normStaff) || normStaff.includes(normUser)));
    };

    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedTitleFilter, setSelectedTitleFilter] = useState<string[]>([]);
    const [selectedStaffFilter, setSelectedStaffFilter] = useState<string[]>([]);
    const [cpeFilterMode, setCpeFilterMode] = useState<string>('');
    
    const yearOptions = Array.from({ length: 3 }, (_, i) => ({
        value: (currentYear - i).toString(),
        label: `${currentYear - i} Yılı`
    }));

    // Seçili Personel Detayı (Modal için)
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getCpeStats(parseInt(selectedYear));
            setStats(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Eğitim verisi yüklenemedi:', error);
            showToast('Eğitim verileri alınırken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Toplam Gösterge Hesaplamaları
    const totalCpe = stats.reduce((sum, s) => sum + s.totalHours, 0);
    const avgCpe = stats.length > 0 ? (totalCpe / stats.length).toFixed(1) : '0';
    const activeStaffCount = stats.length;

    // Arama ve Filtreleme İşlemi
    const filteredStats = stats.filter(row => {
        const matchesSearch = (row.name || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (row.title || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        
        if (!matchesSearch) return false;

        if (selectedTitleFilter.length > 0) {
            if (!row.title || !selectedTitleFilter.includes(row.title)) return false;
        }

        if (selectedStaffFilter.length > 0 && !selectedStaffFilter.includes(row.id)) return false;

        if (cpeFilterMode === 'above_avg') {
            if (row.totalHours < parseFloat(avgCpe)) return false;
        } else if (cpeFilterMode === 'below_target') {
            if (row.totalHours >= 40) return false;
        }
        
        return true;
    });

    const belowTargetCount = stats.filter(s => s.totalHours < 40).length;

    const columns = [
        {
            key: 'name',
            header: 'Personel',
            type: 'user',
            align: 'left' as const,
            sortable: true
        },
        {
            key: 'totalHours',
            header: 'Toplam Eğitim Süresi',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => {
                if (!canManage && !checkIsSelf(row)) return <div className="text-slate-300 flex justify-center py-2"><Lock size={16} /></div>;
                const isBelowTarget = row.totalHours < 40;
                return (
                    <div className="flex justify-center">
                        <Badge variant={isBelowTarget ? "warning" : "success"} size="md" className="gap-1.5 font-bold">
                            <Clock size={14} />
                            {row.totalHours} Saat
                        </Badge>
                    </div>
                );
            }
        },
        {
            key: 'previousYearHours',
            header: `Geçen Yıl (${parseInt(selectedYear) - 1})`,
            align: 'center' as const,
            sortable: true,
            render: (row: any) => {
                if (!canManage && !checkIsSelf(row)) return <div className="text-slate-300 flex justify-center py-2"><Lock size={16} /></div>;
                return (
                    <Badge variant="gray" className="text-gray-500 font-medium">
                        {row.previousYearHours} Saat
                    </Badge>
                );
            }
        },
        {
            key: 'trend',
            header: 'Yıllık Değişim',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => {
                if (!canManage && !checkIsSelf(row)) return <div className="text-slate-300 flex justify-center py-2"><Lock size={16} /></div>;
                const trend = row.trend;
                const current = row.totalHours;
                const previous = row.previousYearHours;
                return (
                    <div className="flex justify-center">
                        <Badge variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'secondary'} size="sm" className="gap-1 font-bold">
                            {trend === 'up' && <TrendingUp size={14} />}
                            {trend === 'down' && <TrendingDown size={14} />}
                            {trend === 'neutral' && <Minus size={14} />}
                            {trend === 'up' ? `+${current - previous} Saat` : trend === 'down' ? `${current - previous} Saat` : 'Değişim Yok'}
                        </Badge>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '120px',
            align: 'center' as const,
            render: (row: any) => {
                const isSelfRow = checkIsSelf(row);
                const canViewDetails = canManage || isSelfRow;
                if (!canViewDetails) return null;
                
                return (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                            items={[
                                { label: 'Eğitim Detayları', icon: <Eye size={14} />, onClick: () => setSelectedStaff(row) }
                            ]}
                        />
                    </div>
                );
            }
        }
    ];

    if (loading && stats.length === 0) {
        return <div className="flex items-center justify-center h-64"><LoadingState message="Eğitim Raporları yükleniyor..." /></div>;
    }

    return (
        <div className="space-y-6">
            <StaffTabs />
            <PageHeader title="Eğitim Raporu" subtitle="Personel eğitim süreleri ve gelişim istatistikleri" />


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Toplam Mesleki Eğitim Süresi"
                    value={`${totalCpe} Saat`}
                    entityType="SKILL_IT"
                    subtext={`${selectedYear} Yılı Geneli`}
                    onClick={() => setCpeFilterMode('')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${!cpeFilterMode ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />

                <StatCard
                    title="Kişi Başı Ortalama"
                    value={`${avgCpe} Saat`}
                    entityType="SKILL_FINANCE"
                    subtext="Kurum Ortalaması"
                    onClick={() => setCpeFilterMode(prev => prev === 'above_avg' ? '' : 'above_avg')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${cpeFilterMode === 'above_avg' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />

                <StatCard
                    title="Değerlendirilen Personel"
                    value={`${activeStaffCount} Kişi`}
                    entityType="AUDIT_FINDING"
                    subtext="Aktif Kadro"
                    onClick={() => setCpeFilterMode('')}
                />
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-4 mb-2 shadow-sm">
                <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shrink-0 mt-0.5 shadow-inner">
                    <TrendingUp size={24} />
                </div>
                <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm mb-1">
                            Yıllık Eğitim ve Gelişim Hedefi Takibi
                        </h4>
                        <p className="text-sm text-indigo-800/80 leading-relaxed max-w-none">
                            Yıllık <strong>40 saatlik</strong> mesleki eğitim hedefinin altında kalan {belowTargetCount > 0 ? <strong className="text-rose-600">{belowTargetCount} personel</strong> : <strong>personel</strong>} bulunmaktadır. Planlamalarda bu durumu göz önünde bulundurabilirsiniz.
                        </p>
                    </div>
                    {canManage && belowTargetCount > 0 && (
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="shrink-0 shadow-sm"
                            onClick={() => setCpeFilterMode('below_target')}
                        >
                            İlgili Personeli Listele
                        </Button>
                    )}
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Personel veya ünvan ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(stats, 'Egitim_Raporu')}
                filters={
                    <FilterDropdown
                        activeCount={(selectedYear !== currentYear.toString() ? 1 : 0) + (selectedTitleFilter.length > 0 ? 1 : 0) + (selectedStaffFilter.length > 0 ? 1 : 0) + (cpeFilterMode ? 1 : 0)}
                        onClear={() => {
                            setSelectedYear(currentYear.toString());
                            setSelectedTitleFilter([]);
                            setSelectedStaffFilter([]);
                            setCpeFilterMode('');
                            setSearchTerm('');
                        }}
                    >
                        <CustomSelect
                            label="Personel Filtresi"
                            options={stats.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedStaffFilter}
                            onChange={(val) => setSelectedStaffFilter(val as string[])}
                            isMulti
                            showSearch
                            placeholder="Personel seçiniz..."
                        />
                        <CustomSelect
                            label="Rapor Yılı"
                            options={yearOptions}
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(val as string)}
                        />
                        <CustomSelect
                            label="Ünvan"
                            options={TITLES.map(t => ({ value: t, label: t }))}
                            value={selectedTitleFilter}
                            onChange={(val) => setSelectedTitleFilter(val as string[])}
                            isMulti
                            placeholder="Ünvan seçiniz..."
                        />
                        <CustomSelect
                            label="Eğitim Durumu"
                            placeholder="Tüm Durumlar"
                            options={[
                                { value: 'above_avg', label: 'Ortalama Üzeri' },
                                { value: 'below_target', label: 'Hedef Altı (<40 Saat)' }
                            ]}
                            value={cpeFilterMode}
                            onChange={(val) => setCpeFilterMode(val as any)}
                        />
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={columns}
                data={filteredStats}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={15}
                itemUnit="personel"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setCpeFilterMode('all');
                    setSelectedTitleFilter([]);
                    setSelectedStaffFilter([]);
                    setSelectedYear(currentYear.toString());
                }}
                className="mt-4 shadow-sm border border-gray-100"
            />

            {/* Detay Modalı */}
            <Modal
                isOpen={!!selectedStaff}
                onClose={() => setSelectedStaff(null)}
                title={
                    <div className="flex items-center gap-2">
                        <BookOpen className="text-primary" size={22} />
                        <span>{selectedStaff?.name || ''} - {selectedYear} Yılı Eğitim Detayları</span>
                    </div>
                }
                size="lg"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                    </div>
                }
            >
                {selectedStaff && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-sm overflow-hidden shrink-0">
                                    {getPhotoUrl(selectedStaff.photoUrl) ? (
                                        <img src={getPhotoUrl(selectedStaff.photoUrl)!} alt={selectedStaff.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedStaff.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-lg">{selectedStaff.name}</div>
                                    <div className="text-sm text-gray-500">{selectedStaff.title}</div>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <span className="text-sm text-gray-500 font-medium">Toplam Süre:</span>
                                <Badge variant={selectedStaff.totalHours < 40 ? "warning" : "success"} size="md" className="font-bold">
                                    <Clock size={14} className="mr-1 inline-block" />
                                    {selectedStaff.totalHours} Saat
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 px-1">
                                <BookOpen size={18} className="text-primary" />
                                Tamamlanan Eğitimler ({selectedStaff.trainings.length})
                            </h3>
                            
                            {selectedStaff.trainings.length === 0 ? (
                                <EmptyState
                                    title="Eğitim Kaydı Yok"
                                    description="Bu personelin seçili yıla ait bir mesleki eğitim girişi bulunmuyor."
                                    icon={Clock}
                                />
                            ) : (
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                                    {selectedStaff.trainings.map((t: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-primary/30 transition-colors">
                                            <div>
                                                <div className="font-bold text-gray-900">{t.name}</div>
                                                <div className="text-sm text-gray-500 font-medium">{t.provider || 'Kurum İçi'}</div>
                                                <div className="text-xs text-gray-400 mt-1">{formatDate(t.startDate)}</div>
                                            </div>
                                            <Badge variant="info" size="md" className="font-black text-sm">
                                                +{t.hours || 0} Saat
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
