'use client';
import UnitBadge from '@/components/ui/UnitBadge';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable from '@/components/ui/DataTable';
import { DateDisplay } from '@/components/ui/DateDisplay';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import PersonCell from '@/components/ui/PersonCell';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { ShieldCheck, CheckCircle2, AlertTriangle, Eye, Shield } from 'lucide-react';
import { useToast } from '@/components/Toast';

function ControlStaffIndependencePageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const declarations = [
        { id: 'DEC-01', name: 'Canan Öztürk', title: 'Kıdemli İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', period: '2026 Yıllık', status: 'Uyumlu', exceptionText: 'Yok', declaredAt: '2026-01-15' },
        { id: 'DEC-02', name: 'Ahmet Yılmaz', title: 'Kıdemli İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', period: '2026 Yıllık', status: 'Uyumlu', exceptionText: 'Yok', declaredAt: '2026-01-14' },
        { id: 'DEC-03', name: 'Zeynep Kaya', title: 'İç Kontrolör', department: 'İç Kontrol ve Uyum Müdürlüğü', period: '2026 Yıllık', status: 'Uyumlu', exceptionText: 'Yok', declaredAt: '2026-01-10' },
        { id: 'DEC-04', name: 'Mehmet Demir', title: 'Birim Kontrol Sorumlusu (BKS)', department: 'Tahsisat Servisi', period: '2026 Yıllık', status: 'Uyumlu', exceptionText: 'Yok', declaredAt: '2026-01-20' },
        { id: 'DEC-05', name: 'Ali Koç', title: 'Birim Kontrol Sorumlusu (BKS)', department: 'Finans Servisi', period: '2026 Yıllık', status: 'İstisna Mevcut', exceptionText: 'Birinci derece yakın çalışan varlığı', declaredAt: '2026-01-18' },
    ];

    const filteredData = declarations.filter(s => {
        if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Bağımsızlık Beyanları" subtitle="Yıllık tarafsızlık, çıkar çatışması ve bağımsızlık taahhütnamelerinin takibi" />
            <ControlStaffTabs />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Beyan" value={declarations.length} icon={ShieldCheck} color="blue" />
                <StatCard title="Uyumlu Personel" value={declarations.filter(d => d.status === 'Uyumlu').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="İstisna Bildirimi" value={declarations.filter(d => d.status === 'İstisna Mevcut').length} icon={AlertTriangle} color="amber" />
                <StatCard title="Beyan Tamamlama Oranı" value="%100" icon={Shield} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Personel adı veya birim ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown activeCount={statusFilter.length} onClear={() => setStatusFilter([])}>
                        <CustomSelect label="Uyum Durumu" value={statusFilter} onChange={(val) => setStatusFilter(val as string[])} isMulti options={[{ value: 'Uyumlu', label: 'Uyumlu' }, { value: 'İstisna Mevcut', label: 'İstisna Mevcut' }]} />
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
                    { key: 'period', header: 'Beyan Dönemi', width: '130px', render: (row: any) => <span className="font-mono text-xs font-bold text-slate-800">{row.period}</span> },
                    { key: 'status', header: 'Uyum Durumu', width: '140px', render: (row: any) => <StatusBadge value={row.status} type="status" /> },
                    { key: 'declaredAt', header: 'Beyan Tarihi', type: 'date', width: '130px' },
                    { key: 'actions', header: 'İncele', width: '90px', render: (row: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedStaff(row)}>Beyan</Button>
                    ) }
                ]}
                data={filteredData}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setStatusFilter([]); }}
                rowKey="id"
            />

            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Bağımsızlık & Etik Beyan Detayı — ${selectedStaff.name}`} size="lg">
                    <div className="p-4 space-y-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-900">{selectedStaff.name} — {selectedStaff.title}</h4>
                            <p className="text-slate-500 font-medium"><UnitBadge name={selectedStaff.department} /></p>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                            <h5 className="font-bold text-slate-900">1. Beyan Edilen Çıkar Çatışması / İstisna Durumu</h5>
                            <p className="text-slate-700 leading-relaxed font-medium">{selectedStaff.exceptionText}</p>
                        </div>

                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                            ✓ Personel, 2026 yılı İç Kontrol Bağımsızlık ve Etik Uyum İlkeleri taahhütnamesini dijital olarak onaylamıştır.
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


export default function ControlStaffIndependencePage() {
    return (
        <RequireRole allowedRoles={['KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlStaffIndependencePageContent />
        </RequireRole>
    );
}
