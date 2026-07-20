'use client';

import React, { useState, useEffect } from 'react';
import StaffTabs from '@/components/audit/staff/StaffTabs';
import PageHeader from '@/components/audit/PageHeader';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import ActionMenu from '@/components/ui/ActionMenu';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { getPhotoUrl } from '@/lib/audit-utils';
import { Clock } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';

export default function TimesheetPage() {
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedStaffFilter, setSelectedStaffFilter] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

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
            key: 'totalHours',
            header: 'Aylık Gerçekleşen Efor',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <Badge variant="gray" className="font-bold text-slate-700">{row.totalHours || 0} Saat</Badge>
            )
        },
        {
            key: 'auditHours',
            header: 'Denetim Görevleri',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <Badge variant="primary" size="sm">{row.auditHours || 0} Saat</Badge>
            )
        },
        {
            key: 'adminHours',
            header: 'İdari / Eğitim',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <Badge variant="secondary" size="sm">{row.adminHours || 0} Saat</Badge>
            )
        },
        {
            key: 'status',
            header: 'Çizelge Durumu',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <div className="flex justify-center">
                    <StatusBadge 
                        value={row.status === 'Onaylandı' ? 'Tamamlandı' : 'Bekliyor'} 
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
                        label: 'Çizelge Detayı', 
                        icon: Clock, 
                        onClick: () => {
                            setSelectedStaff(row);
                            setModalOpen(true);
                        } 
                    }
                ]} />
            )
        }
    ];

    const enrichedList = staffList.map(s => {
        // Pseudo-random data for demonstration based on ID
        const isPending = s.id % 4 === 0;
        return {
            ...s,
            totalHours: isPending ? 120 : 142,
            auditHours: isPending ? 100 : 120,
            adminHours: isPending ? 20 : 22,
            status: isPending ? 'Onay Bekliyor' : 'Onaylandı',
            timesheetStatus: isPending ? 'pending' : 'approved'
        };
    });

    const filteredList = enrichedList.filter(s => {
        if (!s.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter && s.timesheetStatus !== statusFilter) return false;
        if (selectedStaffFilter.length > 0 && !selectedStaffFilter.includes(s.id.toString())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <StaffTabs />
            <PageHeader title="Efor ve Zaman İzleme" subtitle="Aylık denetim eforları, gerçekleşen çalışma saatleri ve idari izinler" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="Toplam Gerçekleşen Efor" 
                    value="1.420 Saat" 
                    entityType="METRIC" 
                    subtext="Bu ayki toplam çalışma" 
                    onClick={() => setStatusFilter('')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${!statusFilter ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />
                <StatCard 
                    title="Denetim Görevleri" 
                    value="1.200 Saat" 
                    entityType="ACTIVITY" 
                    subtext="%85 Görev Dağılımı" 
                    onClick={() => setStatusFilter('approved')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'approved' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />
                <StatCard 
                    title="İdari / Diğer" 
                    value="220 Saat" 
                    entityType="WORKPAPER" 
                    subtext="Eğitim, toplantı ve idari" 
                    onClick={() => setStatusFilter('pending')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'pending' ? 'ring-2 ring-amber-500 scale-[1.02] bg-amber-50/10' : ''}`}
                />
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-4 mb-2 shadow-sm">
                <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shrink-0 mt-0.5 shadow-inner">
                    <Clock size={24} />
                </div>
                <div className="w-full">
                    <h4 className="font-bold text-indigo-900 text-sm mb-1">
                        Aylık Efor İzleme ve Faturalandırma
                    </h4>
                    <p className="text-sm text-indigo-800/80 leading-relaxed max-w-none">
                        Bu ekranda personelin ay içindeki çalışmaları <strong>Denetim</strong> ve <strong>İdari/Eğitim</strong> olarak ayrıştırılmaktadır. Sistem, her personelin günlük çalışma saatlerini (Timesheet) toplar ve onay durumlarını yansıtır. <em>Metrik kartlarına tıklayarak odaklanmak istediğiniz efor türünü veya onay durumunu filtreleyebilirsiniz.</em>
                    </p>
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Personel ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(filteredList, 'Efor_Zaman_Izleme_Raporu')}
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
                            options={staffList.map(s => ({ value: s.id.toString(), label: s.name }))}
                            value={selectedStaffFilter}
                            onChange={(val) => setSelectedStaffFilter(val as string[])}
                            isMulti
                            showSearch
                            placeholder="Personel seçiniz..."
                        />
                        <CustomSelect
                            label="Efor Durumu"
                            placeholder="Tüm Durumlar"
                            options={[
                                { value: 'submitted', label: 'Gönderildi' },
                                { value: 'pending', label: 'Bekliyor' },
                                { value: 'approved', label: 'Onaylandı' }
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <Clock className="text-indigo-500" size={22} />
                        <span>{selectedStaff?.name || ''} - Çizelge Detayı</span>
                    </div>
                }
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Kapat</Button>
                    </div>
                }
            >
                {selectedStaff && (
                    <div className="space-y-4 py-2">
                        <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <div>
                                <div className="text-sm text-slate-500 font-medium mb-0.5">Aylık Toplam Efor</div>
                                <div className="text-2xl font-bold text-indigo-700">{selectedStaff.totalHours || 0} Saat</div>
                            </div>
                            <Clock size={32} className="text-indigo-200" />
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-700 text-sm border-b pb-2">Efor Dağılımı</h4>
                            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                <span className="font-semibold text-slate-600">Denetim Görevleri</span>
                                <Badge variant="primary">{selectedStaff.auditHours || 0} Saat</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                <span className="font-semibold text-slate-600">İdari ve Eğitim</span>
                                <Badge variant="secondary">{selectedStaff.adminHours || 0} Saat</Badge>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
