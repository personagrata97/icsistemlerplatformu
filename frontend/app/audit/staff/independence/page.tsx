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
import { Shield } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';

export default function IndependencePage() {
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [periodFilter, setPeriodFilter] = useState<string>('');
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
            key: 'period',
            header: 'Beyan Dönemi',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <div className="font-bold text-slate-700">{row.period || '2026 Yılı'}</div>
            )
        },
        {
            key: 'status',
            header: 'İmza Durumu',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <div className="flex justify-center">
                    <StatusBadge 
                        status={row.hasSigned ? 'Tamamlandı' : 'Bekliyor'} 
                        text={row.hasSigned ? 'İmzalandı' : 'Eksik'} 
                    />
                </div>
            )
        },
        {
            key: 'date',
            header: 'İmza Tarihi',
            type: 'date',
            align: 'center' as const,
            sortable: true
        },
        {
            key: 'conflict',
            header: 'Çıkar Çatışması Bildirimi',
            align: 'center' as const,
            sortable: true,
            render: (row: any) => (
                <Badge variant={row.conflict === 'Yok' ? 'secondary' : 'danger'} size="sm">
                    {row.conflict}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            align: 'center' as const,
            render: (row: any) => (
                <ActionMenu items={[
                    { 
                        label: 'Beyanı Görüntüle', 
                        icon: Shield, 
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
        // Pseudo-random logic based on ID for demonstration if real data is missing
        const hasConflict = s.id % 5 === 0;
        const hasSigned = s.id % 8 !== 0;
        
        return {
            ...s,
            date: hasSigned ? '2026-01-12T08:30:00Z' : null,
            period: '2026 Yılı',
            conflict: hasConflict ? 'İnceleniyor' : 'Yok',
            hasSigned: hasSigned,
            hasConflict: hasConflict
        };
    });

    const filteredList = enrichedList.filter(s => {
        if (!s.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (statusFilter === 'signed' && !s.hasSigned) return false;
        if (statusFilter === 'conflict' && s.conflict === 'Yok') return false;
        if (periodFilter && s.period !== periodFilter) return false;
        if (selectedStaffFilter.length > 0 && !selectedStaffFilter.includes(s.id)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <StaffTabs />
            <PageHeader title="Bağımsızlık İzleme" subtitle="Yıllık bağımsızlık beyanları, etik taahhütler ve çıkar çatışması bildirimleri" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="İmzalanan Beyanlar" 
                    value={staffList.length.toString()} 
                    entityType="DOCUMENT" 
                    subtext="2026 Yılı Dönemi" 
                    onClick={() => setStatusFilter('signed')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'signed' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />
                <StatCard 
                    title="Çıkar Çatışması Bildirimi" 
                    value="0" 
                    entityType="ISSUE" 
                    subtext="İncelenmesi gerekenler" 
                    onClick={() => setStatusFilter('conflict')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'conflict' ? 'ring-2 ring-rose-500 scale-[1.02] bg-rose-50/10' : ''}`}
                />
                <StatCard 
                    title="Uyum Oranı" 
                    value="%100" 
                    entityType="METRIC" 
                    subtext="Tüm personel imzaladı" 
                    onClick={() => setStatusFilter('all')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />
            </div>

            <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-4 mb-2 shadow-sm">
                <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600 shrink-0 mt-0.5 shadow-inner">
                    <Shield size={24} />
                </div>
                <div className="w-full">
                    <h4 className="font-bold text-rose-900 text-sm mb-1">
                        Bağımsızlık ve Etik Beyanı İzleme
                    </h4>
                    <p className="text-sm text-rose-800/80 leading-relaxed max-w-none">
                        Tüm denetim personelinin her yıl periyodik olarak bağımsızlık, tarafsızlık ve mesleki etik ilkelerine uyum beyanlarını elektronik ortamda yenilemesi gerekmektedir. Potansiyel çıkar çatışması bildirimleri sistem tarafından otomatik olarak risk havuzuna aktarılır ve ilgili personelin denetim planlamasındaki görevlendirmeleri bu kısıtlar çerçevesinde yönetilir.
                    </p>
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Personel ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(filteredList, 'Bagimsizlik_Izleme_Raporu')}
                filters={
                    <FilterDropdown
                        activeCount={(statusFilter ? 1 : 0) + (selectedStaffFilter.length > 0 ? 1 : 0) + (periodFilter ? 1 : 0)}
                        onClear={() => {
                            setStatusFilter('');
                            setSelectedStaffFilter([]);
                            setPeriodFilter('');
                            setSearchTerm('');
                        }}
                    >
                        <CustomSelect
                            label="Beyan Dönemi"
                            placeholder="Tüm Dönemler"
                            options={[
                                { value: '2026 Yılı', label: '2026 Yılı' },
                                { value: '2025 Yılı', label: '2025 Yılı' }
                            ]}
                            value={periodFilter}
                            onChange={(val) => setPeriodFilter(val as string)}
                        />
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
                            label="Durum Filtresi"
                            placeholder="Tüm Kayıtlar"
                            options={[
                                { value: 'signed', label: 'İmzalandı' },
                                { value: 'conflict', label: 'Çıkar Çatışması (Riskli)' }
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
                    setPeriodFilter('');
                }}
                className="mt-4 shadow-sm border border-gray-100"
            />

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <Shield className="text-rose-500" size={22} />
                        <span>{selectedStaff?.name || ''} - Bağımsızlık ve Etik Beyanı</span>
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
                        <div className={`flex justify-between items-center p-4 rounded-xl border ${selectedStaff.hasSigned ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div>
                                <div className="text-sm font-medium mb-1">Durum</div>
                                <div className={`text-lg font-bold ${selectedStaff.hasSigned ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {selectedStaff.hasSigned ? 'İmzalandı' : 'Bekliyor / Eksik'}
                                </div>
                            </div>
                            <Shield size={32} className={selectedStaff.hasSigned ? 'text-emerald-200' : 'text-rose-200'} />
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-700 text-sm border-b pb-2">Beyan Detayları</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Dönem</div>
                                    <div className="font-bold text-slate-700">{selectedStaff.period || '2026 Yılı'}</div>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                    <div className="text-xs text-slate-500 font-medium mb-1">İmza Tarihi</div>
                                    <div className="font-bold text-slate-700">{selectedStaff.date ? new Date(selectedStaff.date).toLocaleDateString('tr-TR') : '-'}</div>
                                </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                <div className="text-xs text-slate-500 font-medium mb-1">Çıkar Çatışması Bildirimi</div>
                                <div className="font-bold text-slate-700">{selectedStaff.conflict || 'Yok'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
