'use client';
import UnitBadge from '@/components/ui/UnitBadge';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import TableActions from '@/components/ui/TableActions';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import PersonCell from '@/components/ui/PersonCell';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { Calendar, Users, Eye, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';

function ControlStaffCalendarPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [selectedStaffName, setSelectedStaffName] = useState('');
    const [calendarModalOpen, setCalendarModalOpen] = useState(false);

    const staffCapacity = [
        { id: 'KNT-01', name: 'Canan Öztürk', title: 'Kıdemli İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', status: 'Aktif', capacityRate: 85, activeTests: 3, plannedLeave: '15-20 Ağustos' },
        { id: 'KNT-02', name: 'Ahmet Yılmaz', title: 'Kıdemli İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', status: 'Aktif', capacityRate: 90, activeTests: 4, plannedLeave: '-' },
        { id: 'KNT-03', name: 'Zeynep Kaya', title: 'İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', status: 'Aktif', capacityRate: 70, activeTests: 2, plannedLeave: '01-05 Eylül' },
        { id: 'BKS-01', name: 'Mehmet Demir', title: 'Birim Kontrol Sorumlusu (BKS)', department: 'Tahsisat Servisi', status: 'Aktif', capacityRate: 60, activeTests: 1, plannedLeave: '-' },
        { id: 'BKS-02', name: 'Ali Koç', title: 'Birim Kontrol Sorumlusu (BKS)', department: 'Finans Servisi', status: 'Aktif', capacityRate: 75, activeTests: 2, plannedLeave: '-' },
    ];

    const filteredData = staffCapacity.filter(s => {
        if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Çalışma Takvimi" subtitle="İç kontrol ekibinin yıllık denetim, saha çalışması ve izin takvimi" />
            <ControlStaffTabs />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kadro" value={staffCapacity.length} icon={Users} color="blue" />
                <StatCard title="Ort. Kapasite Kullanımı" value="%76" icon={Clock} color="emerald" />
                <StatCard title="Aktif Test Yürüten" value={5} icon={Calendar} color="purple" />
                <StatCard title="Planlanan İzinler" value={2} icon={Calendar} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Personel adı veya birim ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown activeCount={statusFilter.length} onClear={() => setStatusFilter([])}>
                        <CustomSelect label="Durum" value={statusFilter} onChange={(val) => setStatusFilter(val as string[])} isMulti options={[{ value: 'Aktif', label: 'Aktif' }, { value: 'İzinli', label: 'İzinli' }]} />
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    { key: 'name', header: 'Personel', sortable: true, render: (row: any) => (
                        <div className="flex items-center gap-3">
                            <PersonCell name={row.name} size="md" />
                            <div>
                                <div className="font-bold text-slate-900 text-xs">{row.name}</div>
                                <div className="text-[11px] text-slate-500">{row.title}</div>
                            </div>
                        </div>
                    ) },
                    { key: 'department', header: 'Birim', render: (row: any) => <span className="text-xs font-semibold text-slate-700"><UnitBadge name={row.department} /></span> },
                    { key: 'status', header: 'Durum', width: '110px', render: (row: any) => <StatusBadge value={row.status} type="status" /> },
                    { key: 'capacityRate', header: 'Doluluk Oranı', width: '160px', render: (row: any) => (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span>%{row.capacityRate}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${row.capacityRate > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${row.capacityRate}%` }} />
                            </div>
                        </div>
                    ) },
                    { key: 'activeTests', header: 'Aktif Test', width: '100px', render: (row: any) => <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{row.activeTests} Test</span> },
                    { key: 'plannedLeave', header: 'Planlı İzin', width: '130px', render: (row: any) => <span className="text-xs font-medium text-slate-600">{row.plannedLeave}</span> },
                    { key: 'actions', header: 'İşlem', width: '100px', render: (row: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => { setSelectedStaffName(row.name); setCalendarModalOpen(true); }}>
                            Takvim
                        </Button>
                    ) }
                ]}
                data={filteredData}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setStatusFilter([]); }}
                rowKey="id"
            />

            {calendarModalOpen && (
                <Modal isOpen={calendarModalOpen} onClose={() => setCalendarModalOpen(false)} title={`Kapasite Takvimi — ${selectedStaffName}`} size="lg">
                    <div className="p-4 space-y-3 text-xs">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
                            {selectedStaffName} için dönemsel denetim testi ve izin planlama detayları.
                        </div>
                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setCalendarModalOpen(false)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}


export default function ControlStaffCalendarPage() {
    return (
        <RequireRole allowedRoles={['KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlStaffCalendarPageContent />
        </RequireRole>
    );
}
