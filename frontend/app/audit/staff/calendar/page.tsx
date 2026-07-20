'use client';

import React, { useState, useEffect } from 'react';
import StaffTabs from '@/components/audit/staff/StaffTabs';
import PageHeader from '@/components/audit/PageHeader';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import ActionMenu from '@/components/ui/ActionMenu';
import { getPhotoUrl } from '@/lib/audit-utils';
import { Calendar, X } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import Tooltip from '@/components/ui/Tooltip';
import EntityIcon from '@/components/ui/EntityIcon';
import ProgressBar from '@/components/ui/ProgressBar';

export default function CalendarPage() {
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedStaffFilter, setSelectedStaffFilter] = useState<string[]>([]);
    const [calendarModalOpen, setCalendarModalOpen] = useState(false);
    const [selectedStaffName, setSelectedStaffName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getStaff();
            setStaffList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Personel',
            type: 'user',
            align: 'left' as const,
            sortable: true
        },
        {
            key: 'status',
            header: 'Mevcut Durum',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => {
                const isLeave = row.status === 'İzinde';
                return (
                    <div className="flex justify-center">
                        <Badge variant={isLeave ? 'warning' : 'success'} size="sm">
                            {isLeave ? 'Yıllık İzinde' : 'Aktif Görevde'}
                        </Badge>
                    </div>
                );
            }
        },
        {
            key: 'currentAudit',
            header: 'Aktif Denetim Görevleri',
            infoTooltip: 'Personelin şu anda aktif olarak atandığı veya yürüttüğü denetim görevleri.',
            sortable: true,
            render: (row: any) => {
                if (row.status === 'İzinde') return <span className="text-gray-400 font-medium">-</span>;
                
                // Mock multiple audits for the admin user to show the edge case
                const isMultiple = row.name.includes('Yöneticisi') || row.name.includes('Başmüfettiş');
                
                const audits: { name: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'primary' | 'outline' }[] = [
                    { name: 'Genel Müdürlük Süreç Denetimi (2026/04)', variant: 'primary' }
                ];
                
                if (isMultiple) {
                    audits.push({ name: 'Bilgi Sistemleri Sızma Testi (2026/05)', variant: 'gray' });
                    audits.push({ name: 'Mevzuat Uyum Denetimi (2026/06)', variant: 'info' });
                }
                
                const maxDisplay = 2;

                return (
                    <div className="flex flex-col gap-1.5 items-start max-w-[240px]">
                        <div className="flex items-center gap-2">
                            <EntityIcon type="AUDIT" size={14} />
                            <span className="text-[13px] font-semibold text-slate-700 truncate" title={audits[0].name}>
                                {audits[0].name}
                            </span>
                        </div>
                        {audits.length > 1 && (
                            <Tooltip content={
                                <div className="p-1 space-y-1">
                                    {audits.slice(1).map((a, idx) => (
                                        <div key={idx} className="text-xs">{a.name}</div>
                                    ))}
                                </div>
                            }>
                                <Badge variant="outline" className="text-[10px] cursor-help px-1.5 py-0.5" size="sm">
                                    +{audits.length - 1} Görev Daha
                                </Badge>
                            </Tooltip>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'utilization',
            header: 'Kapasite Kullanımı (Aylık)',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <div className="max-w-[130px] mx-auto">
                    <ProgressBar 
                        value={row.status === 'İzinde' ? 0 : 85} 
                        colorClass={row.status === 'İzinde' ? 'bg-amber-400' : 'bg-emerald-500'} 
                    />
                </div>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            align: 'center' as const,
            render: (row: any) => (
                <ActionMenu items={[
                    { 
                        label: 'Takvimi İncele', 
                        icon: Calendar, 
                        onClick: () => {
                            setSelectedStaffName(row.name);
                            setCalendarModalOpen(true);
                        } 
                    }
                ]} />
            )
        }
    ];

    const filteredList = staffList.filter(s => {
        if (!s.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter === 'active' && s.status === 'İzinde') return false;
        if (statusFilter === 'leave' && s.status !== 'İzinde') return false;
        if (selectedStaffFilter.length > 0 && !selectedStaffFilter.includes(s.id)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <StaffTabs />
            <PageHeader title="Kapasite & Takvim" subtitle="Personel izinleri, eğitim takvimi ve aktif denetim görev planlaması" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="Aktif Personel" 
                    value={staffList.filter(s => s.status !== 'İzinde').length.toString()} 
                    entityType="USER" 
                    subtext="Sahada görevli müfettişler" 
                    onClick={() => setStatusFilter('active')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'active' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />
                <StatCard 
                    title="İzindeki Personel" 
                    value={staffList.filter(s => s.status === 'İzinde').length.toString()} 
                    entityType="ACTIVITY" 
                    subtext="Yıllık izinde olanlar" 
                    onClick={() => setStatusFilter('leave')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'leave' ? 'ring-2 ring-amber-500 scale-[1.02] bg-amber-50/10' : ''}`}
                />
                <StatCard 
                    title="Kapasite Kullanımı" 
                    value="%85" 
                    entityType="METRIC" 
                    subtext="Aylık ortalama efor" 
                    onClick={() => setStatusFilter('all')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4 mb-2 shadow-sm">
                <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0 mt-0.5 shadow-inner">
                    <Calendar size={24} />
                </div>
                <div className="w-full">
                    <h4 className="font-bold text-emerald-900 text-sm mb-1">
                        Kapasite ve Görev Planlama Bildirimi
                    </h4>
                    <p className="text-sm text-emerald-800/80 leading-relaxed max-w-none">
                        Personelin aktif kapasitesi, yıllık izinleri ve devam eden denetim görevleri bu ekranda entegre olarak listelenir. <strong>Kapasite Kullanımı</strong> sütunu, müfettişin o ay içerisindeki efor doluluğunu otomatik olarak hesaplayarak aşırı yüklemeleri önler. <em>Filtrelemek için yukarıdaki metrik kartlarına tıklayabilirsiniz.</em>
                    </p>
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Personel ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(filteredList, 'Kapasite_ve_Takvim_Raporu')}
                filters={
                    <FilterDropdown
                        activeCount={(statusFilter ? 1 : 0) + (selectedStaffFilter.length > 0 ? 1 : 0)}
                        onClear={() => {
                            setStatusFilter('');
                            setSelectedStaffFilter([]);
                            setSearchTerm('');
                        }}
                    >
                        <CustomSelect
                            label="Personel Filtresi"
                            options={staffList.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedStaffFilter}
                            onChange={(val) => setSelectedStaffFilter(val as string[])}
                            isMulti
                            showSearch
                            placeholder="Personel seçiniz..."
                        />
                        <CustomSelect
                            label="Mevcut Durum"
                            placeholder="Tüm Durumlar"
                            options={[
                                { value: 'active', label: 'Aktif Görevde' },
                                { value: 'leave', label: 'Yıllık İzinde' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val as any)}
                        />
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={columns}
                data={filteredList}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={10}
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setSelectedStaffFilter([]);
                }}
                className="mt-4 shadow-sm border border-gray-100"
            />

            {/* Calendar Modal */}
            <Modal
                isOpen={calendarModalOpen}
                onClose={() => setCalendarModalOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <Calendar className="text-emerald-500" size={22} />
                        <span>{selectedStaffName} - Çalışma Takvimi</span>
                    </div>
                }
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="secondary" onClick={() => setCalendarModalOpen(false)}>Kapat</Button>
                    </div>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                        <div>
                            <div className="text-sm text-emerald-600 font-medium mb-0.5">Bu Haftanın Gündemi</div>
                            <div className="text-xl font-bold text-emerald-800">3 Aktif Randevu / Görev</div>
                        </div>
                        <Calendar size={32} className="text-emerald-200" />
                    </div>
                    
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-700 text-sm border-b pb-2">Yaklaşan Etkinlikler</h4>
                        
                        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-slate-100 pr-4">
                                <span className="text-xs font-bold text-emerald-600">PZT</span>
                                <span className="text-lg font-black text-slate-700">12</span>
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Açılış Toplantısı (Genel Müdürlük Denetimi)</div>
                                <div className="text-xs text-slate-500 mt-1">10:00 - 11:30 • Katılımcı</div>
                            </div>
                        </div>

                        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-slate-100 pr-4">
                                <span className="text-xs font-bold text-emerald-600">ÇAR</span>
                                <span className="text-lg font-black text-slate-700">14</span>
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm">Birim Yöneticisi ile Mülakat</div>
                                <div className="text-xs text-slate-500 mt-1">14:00 - 15:00 • Müfettiş</div>
                            </div>
                        </div>

                        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-lg shadow-sm opacity-60">
                            <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-slate-100 pr-4">
                                <span className="text-xs font-bold text-slate-400">CUM</span>
                                <span className="text-lg font-black text-slate-500">16</span>
                            </div>
                            <div>
                                <div className="font-bold text-slate-600 text-sm">Taslak Rapor Değerlendirme</div>
                                <div className="text-xs text-slate-400 mt-1">15:30 - 17:00 • Gözlemci</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
