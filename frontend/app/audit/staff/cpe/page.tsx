'use client';

import React, { useState, useEffect } from 'react';
import { auditApi } from '@/lib/audit-api';
import { Users, TrendingUp, TrendingDown, Minus, Clock, BookOpen, Award, FileText } from 'lucide-react';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import CustomSelect from '@/components/ui/CustomSelect';
import PageHeader from '@/components/audit/PageHeader';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';
import { Eye } from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import StatCard from '@/components/ui/StatCard';
import { BackButton } from '@/components/ui/BackButton';

export default function CpePage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cpeFilterMode, setCpeFilterMode] = useState<'all' | 'above_avg'>('all');
    
    // Yıl Seçimi
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
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
            console.error('CPE verisi yüklenemedi:', error);
            showToast('CPE verileri alınırken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Toplam Gösterge Hesaplamaları
    const totalCpe = stats.reduce((sum, s) => sum + s.totalHours, 0);
    const avgCpe = stats.length > 0 ? (totalCpe / stats.length).toFixed(1) : '0';
    const activeStaffCount = stats.length;

    // Arama ve Mod Filtresi
    const filteredStats = stats.filter(row => {
        const matchesSearch = (row.name || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (row.title || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        
        let matchesMode = true;
        if (cpeFilterMode === 'above_avg') {
            matchesMode = row.totalHours >= parseFloat(avgCpe);
        }
        
        return matchesSearch && matchesMode;
    });

    // Trend Formatı
    const getTrendDisplay = (trend: string, current: number, previous: number) => {
        if (trend === 'up') return <div className="flex items-center gap-1 text-green-600 font-medium"><TrendingUp size={16} /> <span>+{current - previous} (Artış)</span></div>;
        if (trend === 'down') return <div className="flex items-center gap-1 text-red-500 font-medium"><TrendingDown size={16} /> <span>{current - previous} (Düşüş)</span></div>;
        return <div className="flex items-center gap-1 text-gray-400 font-medium"><Minus size={16} /> <span>Değişim Yok</span></div>;
    };

    const columns = [
        {
            key: 'name',
            header: 'Personel',
            sortable: true,
            render: (row: any) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-black tracking-tighter shadow-inner overflow-hidden">
                        {row.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{row.title}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'totalHours',
            header: 'Toplam Süre',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-sm">
                    <Clock size={14} />
                    {row.totalHours} Saat
                </span>
            )
        },
        {
            key: 'previousYearHours',
            header: 'Geçen Yıl',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <span className="text-gray-500 font-medium">
                    {row.previousYearHours} Saat
                </span>
            )
        },
        {
            key: 'trend',
            header: 'Trend',
            align: 'center' as const,
            render: (row: any) => getTrendDisplay(row.trend, row.totalHours, row.previousYearHours)
        },
        {
            key: 'actions',
            header: '',
            width: '80px',
            align: 'center' as const,
            render: (row: any) => (
                <ActionMenu
                    items={[
                        { label: 'Detaylar', icon: <Eye size={14} />, onClick: () => setSelectedStaff(row) }
                    ]}
                />
            )
        }
    ];

    if (loading && stats.length === 0) {
        return <div className="flex items-center justify-center h-64"><LoadingState message="CPE Raporları yükleniyor..." /></div>;
    }

    return (
        <div className="space-y-6">
            <BackButton href="/audit/staff" label="Denetim Ekibi Listesine Dön" />
            <PageHeader
                title="Sürekli Mesleki Eğitim (CPE)"
                subtitle="Personel eğitim istatistikleri ve yıllık kazanım analizleri"
            />

            <PageToolbar
                searchPlaceholder="Personel veya unvan ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                filters={
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Rapor Yılı:</span>
                        <div className="w-32">
                            <CustomSelect
                                options={yearOptions}
                                value={selectedYear}
                                onChange={(val) => setSelectedYear(val as string)}
                            />
                        </div>
                    </div>
                }
            />

            {/* Toplam Gösterge Kartları (Merkezi Bileşen) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Toplam Mesleki Eğitim Süresi"
                    value={`${totalCpe} Saat`}
                    icon={Clock}
                    color="indigo"
                    subtext={`${selectedYear} Yılı Geneli`}
                    badgeText="Yeni"
                    onClick={() => setCpeFilterMode('all')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${cpeFilterMode === 'all' ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />

                <StatCard
                    title="Kişi Başı Ortalama"
                    value={`${avgCpe} Saat`}
                    icon={TrendingUp}
                    color="emerald"
                    subtext="Kurum Ortalaması"
                    onClick={() => setCpeFilterMode(prev => prev === 'above_avg' ? 'all' : 'above_avg')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${cpeFilterMode === 'above_avg' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />

                <StatCard
                    title="Değerlendirilen Personel"
                    value={`${activeStaffCount} Kişi`}
                    icon={Users}
                    color="orange"
                    subtext="Aktif Kadro"
                    onClick={() => setCpeFilterMode('all')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${cpeFilterMode === 'all' ? 'ring-2 ring-orange-500 scale-[1.02] bg-orange-50/10' : ''}`}
                />
            </div>

            {/* Veri Tablosu */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredStats}
                    loading={loading}
                    rowKey="id"
                    paginated={true}
                    itemsPerPage={15}
                    itemUnit="personel"
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    emptyIcon={FileText}
                    emptyTitle="Kayıt Bulunamadı"
                    emptyDescription="Seçili yıl için henüz CPE (Eğitim) saati istatistiği oluşmamış."
                />
            </div>

            {/* Detay Modalı */}
            <Modal
                isOpen={!!selectedStaff}
                onClose={() => setSelectedStaff(null)}
                title={`${selectedStaff?.name} - ${selectedYear} Yılı CPE Detayları`}
                size="2xl"
            >
                {selectedStaff && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-sm">
                                    {selectedStaff.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-lg">{selectedStaff.name}</div>
                                    <div className="text-sm text-gray-500">{selectedStaff.title}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 font-medium mb-1">Toplam Alınan Eğitim</div>
                                <div className="text-2xl font-black text-primary bg-primary/10 px-4 py-1 rounded-lg border border-primary/20 inline-block">{selectedStaff.totalHours} Saat</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 px-1">
                                <BookOpen size={18} className="text-primary" />
                                Alınan Eğitimler ({selectedStaff.trainings.length})
                            </h3>
                            
                            {selectedStaff.trainings.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                        <Clock size={20} className="text-gray-400" />
                                    </div>
                                    <div className="text-gray-500 font-medium">Bu yıla ait eğitim kaydı bulunmuyor.</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedStaff.trainings.map((t: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-primary/30 transition-colors">
                                            <div>
                                                <div className="font-bold text-gray-900">{t.name}</div>
                                                <div className="text-sm text-gray-500 font-medium">{t.provider || 'Kurum İçi'}</div>
                                                <div className="text-xs text-gray-400 mt-1">{formatDate(t.startDate)}</div>
                                            </div>
                                            <div className="font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                +{t.hours || 0} Saat
                                            </div>
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
