import PageHeader from '@/components/ui/PageHeader';
'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Edit2, Trash2, Mail, Phone, Shield, Users, Calendar, AlertCircle, X,
    RefreshCw, Eye, Briefcase, TrendingUp, History, ArrowRight, FileText, ShieldCheck,
    Award, Clock, CheckCircle, UserCheck, Download
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import OverflowTooltip from '@/components/ui/OverflowTooltip';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import DataTable from '@/components/ui/DataTable';
import RefreshButton from '@/components/ui/RefreshButton';
import { formatDate, formatPhone, getPhotoUrl } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingState from '@/components/ui/LoadingState';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import FormField from '@/components/ui/FormField';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import PageHeader from '@/components/ui/PageHeader';
import DatePicker from '@/components/ui/DatePicker';
import ProfileHeader from '@/components/ui/ProfileHeader';
import UserAvatar from '@/components/ui/UserAvatar';
import CodeBadge from '@/components/ui/CodeBadge';
import InfoItem from '@/components/ui/InfoItem';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';
import Checkbox from '@/components/ui/Checkbox';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { DEPARTMENTS, HIERARCHY } from '@/lib/organization-constants';
import EducationModal from '@/components/audit/staff/modals/EducationModal';
import ExperienceModal from '@/components/audit/staff/modals/ExperienceModal';
import TrainingModal from '@/components/audit/staff/modals/TrainingModal';
import PromotionModal from '@/components/audit/staff/modals/PromotionModal';
import BulkTrainingModal from '@/components/audit/staff/modals/BulkTrainingModal';
import LeaveModal from '@/components/audit/staff/modals/LeaveModal';

interface ControlStaffMember {
    id: string;
    registrationNumber: string;
    title: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    status: 'Aktif' | 'Pasif' | 'İzinli';
    hireDate: string;
    birthDate?: string;
    bloodGroup?: string;
    address?: string;
    tcNo?: string;
    cpeHours: number;
    testsCount: number;
    skillsCount: number;
    certificates: string[];
    experiences: any[];
    educations: any[];
    trainings: any[];
    promotions: any[];
    leaves: any[];
}

const CONTROL_TITLES = ['İç Kontrol Müdürü', 'Başdenetçi', 'Denetçi', 'Yetkili Denetçi Yardımcısı', 'Denetçi Yardımcısı', 'Birim Kontrol Sorumlusu (BKS)'];
const CONTROL_ROLES = ['İç Kontrol Müdürü', 'Başdenetçi', 'Denetçi', 'Birim Kontrol Sorumlusu (BKS)'];

function ControlStaffPageContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{
        title: string[];
        role: string[];
        department: string[];
        status: string[];
    }>({
        title: [],
        role: [],
        department: [],
        status: []
    });
    
    // Selected staff detail panel state
    const [selectedStaff, setSelectedStaff] = useState<ControlStaffMember | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState('general');
    
    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditingStaff, setIsEditingStaff] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isBulkTrainingModalOpen, setIsBulkTrainingModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    // Initial mock dataset matching real banking staff structure
    const [staffMembers, setStaffMembers] = useState<ControlStaffMember[]>([
        {
            id: 'USR-IK-001',
            registrationNumber: 'IKM-001',
            title: 'Başdenetçi',
            role: 'Başdenetçi',
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet.yilmaz@banka.com',
            phone: '+90 212 555 01 01',
            department: 'İç Kontrol ve Uyum Müdürlüğü',
            status: 'Aktif',
            hireDate: '2018-03-15',
            cpeHours: 32,
            testsCount: 14,
            skillsCount: 5,
            certificates: ['COSO Foundation Certificate', 'CIA Part I'],
            experiences: [
                { id: 'EXP-1', companyName: 'Banka A.Ş.', position: 'İç Kontrol Uzmanı', startDate: '2018-03-15', isCurrent: true }
            ],
            educations: [
                { id: 'EDU-1', schoolName: 'İstanbul Üniversitesi', department: 'İktisat', degree: 'Lisans', graduationYear: '2017' }
            ],
            trainings: [
                { id: 'TRN-1', name: 'COSO 2013 Uygulama Kılavuzu', hours: 16, date: '2026-06-10', provider: 'İç Kontrol Merkezi' }
            ],
            promotions: [
                { id: 'PRM-1', oldTitle: 'Denetçi', newTitle: 'Başdenetçi', date: '2022-01-01' }
            ],
            leaves: []
        },
        {
            id: 'USR-IK-002',
            registrationNumber: 'IKM-002',
            title: 'Başdenetçi',
            role: 'Başdenetçi',
            firstName: 'Canan',
            lastName: 'Öztürk',
            email: 'canan.ozturk@banka.com',
            phone: '+90 212 555 01 02',
            department: 'İç Kontrol ve Uyum Müdürlüğü',
            status: 'Aktif',
            hireDate: '2019-06-01',
            cpeHours: 28,
            testsCount: 12,
            skillsCount: 5,
            certificates: ['COSO Foundation Certificate', 'İç Kontrol Test Uzmanı'],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        },
        {
            id: 'USR-IK-003',
            registrationNumber: 'IKM-003',
            title: 'Denetçi',
            role: 'Denetçi',
            firstName: 'Zeynep',
            lastName: 'Kaya',
            email: 'zeynep.kaya@banka.com',
            phone: '+90 212 555 01 03',
            department: 'İç Kontrol ve Uyum Müdürlüğü',
            status: 'Aktif',
            hireDate: '2021-09-01',
            cpeHours: 24,
            testsCount: 10,
            skillsCount: 4,
            certificates: ['COSO Foundation Certificate'],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        },
        {
            id: 'USR-IK-004',
            registrationNumber: 'IKM-004',
            title: 'İç Kontrolör',
            role: 'İç Kontrolör',
            firstName: 'Emre',
            lastName: 'Aksoy',
            email: 'emre.aksoy@banka.com',
            phone: '+90 212 555 01 04',
            department: 'İç Kontrol ve Uyum Müdürlüğü',
            status: 'Aktif',
            hireDate: '2022-02-15',
            cpeHours: 20,
            testsCount: 8,
            skillsCount: 4,
            certificates: ['İç Kontrol BKS Yetkinlik Belgesi'],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        },
        {
            id: 'USR-BKS-001',
            registrationNumber: 'BKS-001',
            title: 'Birim Kontrol Sorumlusu (BKS)',
            role: 'Birim Kontrol Sorumlusu (BKS)',
            firstName: 'Mehmet',
            lastName: 'Demir',
            email: 'mehmet.demir@banka.com',
            phone: '+90 212 555 02 01',
            department: 'Tahsisat Servisi',
            status: 'Aktif',
            hireDate: '2015-01-10',
            cpeHours: 16,
            testsCount: 4,
            skillsCount: 3,
            certificates: ['İç Kontrol BKS Yetkinlik Belgesi'],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        },
        {
            id: 'USR-BKS-002',
            registrationNumber: 'BKS-002',
            title: 'Birim Kontrol Sorumlusu (BKS)',
            role: 'Birim Kontrol Sorumlusu (BKS)',
            firstName: 'Ali',
            lastName: 'Koç',
            email: 'ali.koc@banka.com',
            phone: '+90 212 555 03 01',
            department: 'Finans Servisi',
            status: 'Aktif',
            hireDate: '2016-05-20',
            cpeHours: 12,
            testsCount: 5,
            skillsCount: 3,
            certificates: ['İç Kontrol BKS Yetkinlik Belgesi'],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        },
        {
            id: 'USR-BKS-003',
            registrationNumber: 'BKS-003',
            title: 'Birim Kontrol Sorumlusu (BKS)',
            role: 'Birim Kontrol Sorumlusu (BKS)',
            firstName: 'Fatma',
            lastName: 'Yıldız',
            email: 'fatma.yildiz@banka.com',
            phone: '+90 212 555 04 01',
            department: 'Operasyon Servisi',
            status: 'Aktif',
            hireDate: '2017-08-15',
            cpeHours: 18,
            testsCount: 6,
            skillsCount: 3,
            certificates: ['İç Kontrol BKS Yetkinlik Belgesi'],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        },
        {
            id: 'USR-BKS-004',
            registrationNumber: 'BKS-004',
            title: 'Birim Kontrol Sorumlusu (BKS)',
            role: 'Birim Kontrol Sorumlusu (BKS)',
            firstName: 'Selin',
            lastName: 'Kara',
            email: 'selin.kara@banka.com',
            phone: '+90 212 555 05 01',
            department: 'Bilgi Teknolojileri Servisi',
            status: 'Aktif',
            hireDate: '2020-11-01',
            cpeHours: 8,
            testsCount: 3,
            skillsCount: 2,
            certificates: [],
            experiences: [],
            educations: [],
            trainings: [],
            promotions: [],
            leaves: []
        }
    ]);

    // New/Edit staff form state
    const [staffForm, setStaffForm] = useState({
        registrationNumber: '',
        firstName: '',
        lastName: '',
        title: CONTROL_TITLES[2],
        role: CONTROL_ROLES[1],
        department: DEPARTMENTS[1],
        email: '',
        phone: '',
        hireDate: new Date().toISOString().split('T')[0]
    });

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffForm.firstName || !staffForm.lastName) {
            showToast('Lütfen ad ve soyad alanlarını doldurunuz', 'warning');
            return;
        }

        if (isEditingStaff && selectedStaff) {
            setStaffMembers(prev => prev.map(s => s.id === selectedStaff.id ? {
                ...s,
                ...staffForm,
                email: staffForm.email || `${staffForm.firstName.toLowerCase()}.${staffForm.lastName.toLowerCase()}@banka.com`
            } : s));
            showToast('Personel bilgileri güncellendi', 'success');
        } else {
            const newMember: ControlStaffMember = {
                id: `USR-IK-0${staffMembers.length + 1}`,
                registrationNumber: staffForm.registrationNumber || `IKM-00${staffMembers.length + 1}`,
                title: staffForm.title,
                role: staffForm.role,
                firstName: staffForm.firstName,
                lastName: staffForm.lastName,
                email: staffForm.email || `${staffForm.firstName.toLowerCase()}.${staffForm.lastName.toLowerCase()}@banka.com`,
                phone: staffForm.phone || '+90 212 555 00 00',
                department: staffForm.department,
                status: 'Aktif',
                hireDate: staffForm.hireDate,
                cpeHours: 0,
                testsCount: 0,
                skillsCount: 3,
                certificates: [],
                experiences: [],
                educations: [],
                trainings: [],
                promotions: [],
                leaves: []
            };
            setStaffMembers(prev => [newMember, ...prev]);
            showToast('Yeni personel kaydı oluşturuldu', 'success');
        }
        setIsAddModalOpen(false);
        setIsEditingStaff(false);
    };

    const handleDeleteStaff = (id: string) => {
        setStaffMembers(prev => prev.filter(s => s.id !== id));
        if (selectedStaff?.id === id) setSelectedStaff(null);
        setDeleteConfirmId(null);
        showToast('Personel kaydı silindi', 'success');
    };

    const filteredStaff = staffMembers.filter(member => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        if (searchTerm && !fullName.includes(searchTerm.toLowerCase()) &&
            !member.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !member.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filters.status.length > 0 && !filters.status.includes(member.status)) return false;
        if (filters.title.length > 0 && !filters.title.includes(member.title)) return false;
        if (filters.role.length > 0 && !filters.role.includes(member.role)) return false;
        if (filters.department.length > 0 && !filters.department.includes(member.department)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Denetçi Kadrosu (BKS)" subtitle="İç Kontrol Denetçileri ve Birim Kontrol Sorumlularının (BKS) görev ve yetki yönetimi" />
            <ControlStaffTabs />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Toplam Kadro</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">{staffMembers.length} Personel</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">İç Kontrolör Kadrosu</p>
                        <h3 className="text-xl font-bold text-emerald-600 mt-1">{staffMembers.filter(s => s.role === 'İç Kontrolör').length} Kişi</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck size={20} />
                    </div>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Birim Kontrol Sorumlusu (BKS)</p>
                        <h3 className="text-xl font-bold text-purple-600 mt-1">{staffMembers.filter(s => s.role === 'Birim Kontrol Sorumlusu (BKS)').length} Kişi</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <UserCheck size={20} />
                    </div>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Kapsanan Birimler</p>
                        <h3 className="text-xl font-bold text-amber-600 mt-1">{DEPARTMENTS.length} Birim</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Award size={20} />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <PageToolbar
                searchPlaceholder="Personel adı, sicil no veya birim ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                showExportButton={true}
                onExportClick={() => showToast('İç Kontrol Personel Listesi dışa aktarıldı.', 'info')}
                filters={
                    <FilterDropdown
                        activeCount={filters.title.length + filters.role.length + filters.department.length + filters.status.length}
                        onClear={() => { setFilters({ title: [], role: [], department: [], status: [] }); setSearchTerm(''); }}
                    >
                        <CustomSelect label="Ünvan" value={filters.title} onChange={(val) => setFilters({ ...filters, title: val as string[] })} isMulti options={CONTROL_TITLES.map(t => ({ value: t, label: t }))} />
                        <CustomSelect label="Sorumlu Rol" value={filters.role} onChange={(val) => setFilters({ ...filters, role: val as string[] })} isMulti options={CONTROL_ROLES.map(r => ({ value: r, label: r }))} />
                        <CustomSelect label="Görevli Birim" value={filters.department} onChange={(val) => setFilters({ ...filters, department: val as string[] })} isMulti options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
                        <CustomSelect label="Durum" value={filters.status} onChange={(val) => setFilters({ ...filters, status: val as string[] })} isMulti options={[{ value: "Aktif", label: "Aktif" }, { value: "İzinli", label: "İzinli" }, { value: "Pasif", label: "Pasif" }]} />
                    </FilterDropdown>
                }
                rightActions={
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" leftIcon={<Award size={16} />} onClick={() => router.push('/control/training')}>
                            Eğitim Raporu
                        </Button>
                        <Button variant="secondary" leftIcon={<Award size={16} />} onClick={() => router.push('/control/skills')}>
                            Yetkinlikler
                        </Button>
                        <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setIsBulkTrainingModalOpen(true)}>
                            Toplu Eğitim
                        </Button>
                        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => { setIsEditingStaff(false); setIsAddModalOpen(true); }}>
                            Yeni Personel Ekle
                        </Button>
                    </div>
                }
            />

            {/* Main DataTable */}
            <DataTable
                columns={[
                    { key: 'registrationNumber', header: 'Sicil No', width: '120px', render: (item: any) => <CodeBadge code={item.registrationNumber} /> },
                    { key: 'fullName', header: 'Ad Soyad & Ünvan', sortable: true, render: (item: any) => (
                        <div className="flex items-center gap-3">
                            <UserAvatar name={`${item.firstName} ${item.lastName}`} size="md" />
                            <div>
                                <div className="font-bold text-slate-900 text-xs">{item.firstName} {item.lastName}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{item.title}</div>
                            </div>
                        </div>
                    ) },
                    { key: 'department', header: 'Birim / Servis', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.department}</span> },
                    { key: 'role', header: 'Rol', width: '160px', render: (item: any) => (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${item.role.includes('BKS') ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {item.role}
                        </span>
                    ) },
                    { key: 'cpeHours', header: 'Eğitim (Saat)', width: '110px', sortable: true, render: (item: any) => <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{item.cpeHours}h</span> },
                    { key: 'status', header: 'Durum', width: '100px', render: (item: any) => <StatusBadge value={item.status} type="status" /> },
                    { key: 'actions', header: 'İşlemler', width: '110px', render: (item: any) => (
                        <ActionMenu items={[
                            { label: 'Detay & Özlük İncele', icon: Eye, onClick: () => { setSelectedStaff(item); setActiveDetailTab('general'); } },
                            { label: 'Düzenle', icon: Edit2, onClick: () => { setSelectedStaff(item); setStaffForm({ registrationNumber: item.registrationNumber, firstName: item.firstName, lastName: item.lastName, title: item.title, role: item.role, department: item.department, email: item.email, phone: item.phone, hireDate: item.hireDate }); setIsEditingStaff(true); setIsAddModalOpen(true); } },
                            { label: 'Sil', icon: Trash2, variant: 'danger', onClick: () => setDeleteConfirmId(item.id) },
                        ]} />
                    ) }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setFilters({ title: [], role: [], department: [], status: [] }); }}
                rowKey="id"
            />

            {/* Personel Detay Paneli / Drawer / Full View */}
            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Personel Özlük Profili — ${selectedStaff.firstName} ${selectedStaff.lastName}`} size="xl">
                    <div className="space-y-6 text-xs">
                        {/* Profile Header */}
                        <ProfileHeader staff={selectedStaff} isViewMode={true} />

                        {/* Navigation Tabs inside detail modal */}
                        <SegmentedTabs
                            tabs={[
                                { id: 'general', label: 'Genel Özlük', icon: Users },
                                { id: 'experience', label: 'Deneyimler', icon: Briefcase },
                                { id: 'education', label: 'Eğitimler', icon: Award },
                                { id: 'trainings', label: 'CPE & Sertifikalar', icon: Clock },
                                { id: 'promotions', label: 'Kariyer & Terfi', icon: TrendingUp },
                                { id: 'leaves', label: 'İzin & İlerleme', icon: Calendar },
                            ]}
                            activeTab={activeDetailTab}
                            onChange={(id) => setActiveDetailTab(id)}
                        />

                        {/* Tab Content 1: General */}
                        {activeDetailTab === 'general' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <InfoItem label="İşe Başlama Tarihi" value={formatDate(selectedStaff.hireDate)} />
                                    <InfoItem label="Sorumlu Rol" value={selectedStaff.role} />
                                    <InfoItem label="E-posta Adresi" value={selectedStaff.email} />
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                    <h4 className="font-bold text-slate-800 text-xs">Kazanılan Sertifikalar</h4>
                                    {selectedStaff.certificates.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedStaff.certificates.map((cert, idx) => (
                                                <span key={idx} className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full text-[10px]">{cert}</span>
                                            ))}
                                        </div>
                                    ) : <p className="text-slate-400 italic">Henüz sertifika kaydı bulunmuyor.</p>}
                                </div>
                            </div>
                        )}

                        {/* Tab Content 2: Experience */}
                        {activeDetailTab === 'experience' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-xs">İş Geçmişi & Deneyimler</h4>
                                    <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsExperienceModalOpen(true)}>Deneyim Ekle</Button>
                                </div>
                                {selectedStaff.experiences.length > 0 ? (
                                    selectedStaff.experiences.map(exp => (
                                        <div key={exp.id} className="p-3 border rounded-xl bg-white space-y-1">
                                            <div className="font-bold text-slate-900">{exp.position}</div>
                                            <div className="text-slate-500 font-medium">{exp.companyName}</div>
                                            <div className="text-[10px] text-slate-400">{formatDate(exp.startDate)} - {exp.isCurrent ? 'Devam Ediyor' : formatDate(exp.endDate)}</div>
                                        </div>
                                    ))
                                ) : <EmptyState title="Deneyim Bilgisi Yok" description="Personel için deneyim eklenmemiş." />}
                            </div>
                        )}

                        {/* Tab Content 3: Education */}
                        {activeDetailTab === 'education' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-xs">Öğrenim & Akademik Geçmiş</h4>
                                    <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsEducationModalOpen(true)}>Eğitim Ekle</Button>
                                </div>
                                {selectedStaff.educations.length > 0 ? (
                                    selectedStaff.educations.map(edu => (
                                        <div key={edu.id} className="p-3 border rounded-xl bg-white space-y-1">
                                            <div className="font-bold text-slate-900">{edu.schoolName} — {edu.department}</div>
                                            <div className="text-slate-500 font-medium">Derece: {edu.degree} • Mezuniyet: {edu.graduationYear}</div>
                                        </div>
                                    ))
                                ) : <EmptyState title="Eğitim Bilgisi Yok" description="Personel için okul/akademik kaydı bulunmuyor." />}
                            </div>
                        )}

                        {/* Tab Content 4: Trainings */}
                        {activeDetailTab === 'trainings' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-xs">Mesleki Eğitim & Sertifikasyon (CPE)</h4>
                                    <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsTrainingModalOpen(true)}>Eğitim Kaydı Ekle</Button>
                                </div>
                                {selectedStaff.trainings.length > 0 ? (
                                    selectedStaff.trainings.map(trn => (
                                        <div key={trn.id} className="p-3 border rounded-xl bg-white space-y-1">
                                            <div className="font-bold text-slate-900">{trn.name}</div>
                                            <div className="text-slate-500 font-medium">Kurum: {trn.provider} • Süre: {trn.hours} Saat</div>
                                            <div className="text-[10px] text-slate-400">Tarih: {formatDate(trn.date)}</div>
                                        </div>
                                    ))
                                ) : <EmptyState title="Mesleki Eğitim Kaydı Yok" description="Henüz CPE/eğitim katılım kaydı girilmemiş." />}
                            </div>
                        )}

                        {/* Tab Content 5: Promotions */}
                        {activeDetailTab === 'promotions' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-xs">Terfi & Unvan Değişiklik Geçmişi</h4>
                                    <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsPromotionModalOpen(true)}>Terfi Kaydı Ekle</Button>
                                </div>
                                {selectedStaff.promotions.length > 0 ? (
                                    selectedStaff.promotions.map(prm => (
                                        <div key={prm.id} className="p-3 border rounded-xl bg-white space-y-1">
                                            <div className="font-bold text-slate-900">{prm.oldTitle} ➔ {prm.newTitle}</div>
                                            <div className="text-[10px] text-slate-400">Terfi Tarihi: {formatDate(prm.date)}</div>
                                        </div>
                                    ))
                                ) : <EmptyState title="Terfi Kaydı Yok" description="Personel kariyer geçmişi henüz güncellenmemiş." />}
                            </div>
                        )}

                        {/* Tab Content 6: Leaves */}
                        {activeDetailTab === 'leaves' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-xs">İzin & Kapasite Takibi</h4>
                                    <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsLeaveModalOpen(true)}>İzin Girişi Yap</Button>
                                </div>
                                <EmptyState title="Aktif İzin Bulunmuyor" description="Personelin onaylı veya bekleyen izin kaydı bulunmamaktadır." />
                            </div>
                        )}

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* New / Edit Staff Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={isEditingStaff ? "Personel Bilgilerini Düzenle" : "Yeni İç Kontrol Personeli / BKS Ekle"} size="lg">
                <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput
                            label="Sicil No"
                            value={staffForm.registrationNumber}
                            onChange={(e) => setStaffForm({ ...staffForm, registrationNumber: e.target.value })}
                            placeholder="IKM-009"
                            inputClassName="font-mono"
                        />
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">İşe Başlama Tarihi</label>
                            <DatePicker
                                value={staffForm.hireDate}
                                onChange={(val) => setStaffForm({ ...staffForm, hireDate: val })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FormInput
                            label="Ad"
                            required
                            value={staffForm.firstName}
                            onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                        />
                        <FormInput
                            label="Soyad"
                            required
                            value={staffForm.lastName}
                            onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect label="Ünvan" options={CONTROL_TITLES.map(t => ({ value: t, label: t }))} value={staffForm.title} onChange={(val) => setStaffForm({ ...staffForm, title: val as string })} />
                        </div>
                        <div>
                            <CustomSelect label="Sorumlu Rol" options={CONTROL_ROLES.map(r => ({ value: r, label: r }))} value={staffForm.role} onChange={(val) => setStaffForm({ ...staffForm, role: val as string })} />
                        </div>
                    </div>

                    <div>
                        <CustomSelect label="Görevli Birim (Resmi Şema)" options={DEPARTMENTS.map(d => ({ value: d, label: d }))} value={staffForm.department} onChange={(val) => setStaffForm({ ...staffForm, department: val as string })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FormInput
                            label="E-posta"
                            type="email"
                            value={staffForm.email}
                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                            placeholder="ad.soyad@banka.com"
                        />
                        <FormInput
                            label="Telefon"
                            type="tel"
                            value={staffForm.phone}
                            onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                            placeholder="+90 212 555 XX XX"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Personeli Kaydet</Button>
                    </div>
                </form>
            </Modal>

            {/* Sub-modals for details */}
            <ExperienceModal isOpen={isExperienceModalOpen} onClose={() => setIsExperienceModalOpen(false)} onSave={() => { setIsExperienceModalOpen(false); showToast('Deneyim eklendi', 'success'); }} experienceForm={{ position: '', companyName: '', department: '', startDate: '', endDate: '', isCurrent: false, description: '', careerPaths: '' }} setExperienceForm={() => {}} isEditing={false} loading={false} selectedParentExp={''} setSelectedParentExp={() => {}} />
            <EducationModal isOpen={isEducationModalOpen} onClose={() => setIsEducationModalOpen(false)} onSave={() => { setIsEducationModalOpen(false); showToast('Eğitim kaydı eklendi', 'success'); }} educationForm={{ schoolName: '', faculty: '', department: '', degree: 'Lisans', graduationYear: '2020' }} setEducationForm={() => {}} isEditing={false} loading={false} />
            <TrainingModal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} onSave={() => { setIsTrainingModalOpen(false); showToast('CPE Eğitimi eklendi', 'success'); }} trainingForm={{ name: '', provider: '', startDate: '', endDate: '', hours: '8', status: 'Tamamlandı', description: '' }} setTrainingForm={() => {}} isEditing={false} loading={false} />
            <PromotionModal isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} onSave={() => { setIsPromotionModalOpen(false); showToast('Terfi kaydı eklendi', 'success'); }} promotionForm={{ type: 'Terfi', promotionDate: '', department: '', title: '', notes: '', previousTitle: '' }} setPromotionForm={() => {}} loading={false} selectedParentDept={''} setSelectedParentDept={() => {}} />
            <BulkTrainingModal isOpen={isBulkTrainingModalOpen} onClose={() => setIsBulkTrainingModalOpen(false)} onSave={() => { setIsBulkTrainingModalOpen(false); showToast('Toplu eğitim ataması yapıldı', 'success'); }} bulkTrainingForm={{ name: '', provider: '', hours: 8, date: '', selectedStaffIds: [] }} setBulkTrainingForm={() => {}} staffList={staffMembers as any} loading={false} />
            <LeaveModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onSave={() => { setIsLeaveModalOpen(false); showToast('İzin girişi yapıldı', 'success'); }} initialData={null} isViewMode={false} staffList={staffMembers as any} currentStaffId={selectedStaff?.id} />

            {/* Delete confirm modal */}
            <ConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => deleteConfirmId && handleDeleteStaff(deleteConfirmId)}
                title="Personel Kaydını Sil"
                message="Bu personeli kadrodan çıkarmak istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                type="danger"
            />
        </div>
    );
}


export default function ControlStaffPage() {
    return (
        <RequireRole allowedRoles={['KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlStaffPageContent />
        </RequireRole>
    );
}
