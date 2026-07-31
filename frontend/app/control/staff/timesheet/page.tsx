'use client';
import UnitBadge from '@/components/ui/UnitBadge';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import PersonCell from '@/components/ui/PersonCell';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Clock, Users, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';

function ControlStaffTimesheetPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const timesheetData = [
        { id: 'TS-01', name: 'Canan Öztürk', title: 'Kıdemli İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', totalHours: 160, testHours: 120, reportingHours: 25, cpeHours: 15, status: 'Onaylandı' },
        { id: 'TS-02', name: 'Ahmet Yılmaz', title: 'Kıdemli İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', totalHours: 168, testHours: 130, reportingHours: 22, cpeHours: 16, status: 'Onaylandı' },
        { id: 'TS-03', name: 'Zeynep Kaya', title: 'İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', totalHours: 152, testHours: 110, reportingHours: 30, cpeHours: 12, status: 'Beklemede' },
        { id: 'TS-04', name: 'Mehmet Demir', title: 'Birim Kontrol Sorumlusu (BKS)', department: 'Tahsisat Servisi', totalHours: 40, testHours: 30, reportingHours: 5, cpeHours: 5, status: 'Onaylandı' },
        { id: 'TS-05', name: 'Ali Koç', title: 'Birim Kontrol Sorumlusu (BKS)', department: 'Finans Servisi', totalHours: 45, testHours: 35, reportingHours: 5, cpeHours: 5, status: 'Onaylandı' },
    ];

    const filteredData = timesheetData.filter(s => {
        if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Zaman Çizelgesi (Timesheet)" subtitle="Süreç denetimleri ve projeler için harcanan adam/gün çalışma süreleri" />
            <ControlStaffTabs />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Girilen Efor" value="565 Saat" icon={Clock} color="blue" />
                <StatCard title="Test Çalışması Süresi" value="425 Saat" icon={CheckCircle2} color="emerald" />
                <StatCard title="Raporlama Eforu" value="87 Saat" icon={Users} color="purple" />
                <StatCard title="Onay Bekleyen Girişler" value={1} icon={AlertTriangle} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Personel veya birim ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown activeCount={statusFilter.length} onClear={() => setStatusFilter([])}>
                        <CustomSelect label="Onay Durumu" value={statusFilter} onChange={(val) => setStatusFilter(val as string[])} isMulti options={[{ value: 'Onaylandı', label: 'Onaylandı' }, { value: 'Beklemede', label: 'Beklemede' }]} />
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
                    { key: 'totalHours', header: 'Toplam Efor', width: '120px', render: (row: any) => <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">{row.totalHours} Saat</span> },
                    { key: 'testHours', header: 'Saha & Test', width: '110px', render: (row: any) => <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{row.testHours}h</span> },
                    { key: 'reportingHours', header: 'Raporlama', width: '110px', render: (row: any) => <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{row.reportingHours}h</span> },
                    { key: 'status', header: 'Durum', width: '120px', render: (row: any) => <StatusBadge value={row.status} type="status" /> },
                    { key: 'actions', header: 'İncele', width: '90px', render: (row: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedStaff(row)}>Detay</Button>
                    ) }
                ]}
                data={filteredData}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setStatusFilter([]); }}
                rowKey="id"
            />

            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Efor & Zaman Detayı — ${selectedStaff.name}`} size="lg">
                    <div className="p-4 space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-900">{selectedStaff.name} — {selectedStaff.title}</h4>
                            <p className="text-slate-500 font-medium"><UnitBadge name={selectedStaff.department} /></p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <span className="text-blue-800 font-bold block">Saha & Test Eforu</span>
                                <span className="text-xl font-bold text-blue-900">{selectedStaff.testHours}h</span>
                            </div>
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                <span className="text-purple-800 font-bold block">Raporlama Eforu</span>
                                <span className="text-xl font-bold text-purple-900">{selectedStaff.reportingHours}h</span>
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <span className="text-amber-800 font-bold block">CPE / Eğitim Eforu</span>
                                <span className="text-xl font-bold text-amber-900">{selectedStaff.cpeHours}h</span>
                            </div>
                        </div>
                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}


export default function ControlStaffTimesheetPage() {
    return (
        <RequireRole allowedRoles={['KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlStaffTimesheetPageContent />
        </RequireRole>
    );
}
