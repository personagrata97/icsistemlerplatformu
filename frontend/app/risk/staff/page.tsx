'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import FormInput from '@/components/ui/FormInput';
import CustomSelect from '@/components/ui/CustomSelect';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import ActionMenu from '@/components/ui/ActionMenu';
import { Users, Award, ShieldCheck, Activity, UserPlus, Edit3, Trash2, BookOpen, Clock, FileCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';
import RequireRole from '@/components/auth/RequireRole';
import { MODULE_TERMS } from '@/lib/terminology';

interface RiskStaffMember {
    id: string;
    registrationNumber: string;
    firstName: string;
    lastName: string;
    title: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    status: string;
    hireDate: string;
    cpeHours: number;
    certifications: string[];
    experiences: any[];
    promotions: any[];
}

const RISK_TITLES = MODULE_TERMS.risk.unvanlar;
const RISK_ROLES = ['Risk Yönetimi Müdürü', 'Risk Yönetimi Yönetmeni', 'Risk Yönetimi Uzmanı'];

function RiskStaffPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<RiskStaffMember | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [staffList, setStaffList] = useState<RiskStaffMember[]>([
        {
            id: 'RSK-001',
            registrationNumber: 'RSK-REG-01',
            firstName: 'Canan',
            lastName: 'Öztürk',
            title: 'Risk Yönetimi Yönetmeni',
            role: 'Risk Yönetimi Yönetmeni',
            department: 'Mali ve Likidite Riski Yönetimi',
            email: 'canan.ozturk@banka.com',
            phone: '+90 212 555 02 01',
            status: 'Aktif',
            hireDate: '2019-04-10',
            cpeHours: 35,
            certifications: ['FRM', 'PRM', 'Basel III Risk Specialist'],
            experiences: [{ id: '1', company: 'Banka A.Ş.', title: 'Likidite Uzmanı', date: '2019-2023' }],
            promotions: [{ id: 'p1', oldTitle: 'Risk Yönetimi Uzmanı', newTitle: 'Risk Yönetimi Yönetmeni', date: '2023-01-01' }]
        },
        {
            id: 'RSK-002',
            registrationNumber: 'RSK-REG-02',
            firstName: 'Bora',
            lastName: 'Yılmaz',
            title: 'Risk Yönetimi Müdürü',
            role: 'Risk Yönetimi Müdürü',
            department: 'Operasyonel Risk ve Piyasa Riski',
            email: 'bora.yilmaz@banka.com',
            phone: '+90 212 555 02 02',
            status: 'Aktif',
            hireDate: '2016-09-01',
            cpeHours: 48,
            certifications: ['CFA', 'FRM', 'ISO 31000 LA'],
            experiences: [{ id: '1', company: 'Denetim Firması', title: 'Risk Danışmanı', date: '2014-2016' }],
            promotions: [{ id: 'p1', oldTitle: 'Risk Yönetimi Yönetmeni', newTitle: 'Risk Yönetimi Müdürü', date: '2021-06-01' }]
        },
        {
            id: 'RSK-003',
            registrationNumber: 'RSK-REG-03',
            firstName: 'Merve',
            lastName: 'Aksoy',
            title: 'Risk Yönetimi Uzmanı',
            role: 'Risk Yönetimi Uzmanı',
            department: 'Piyasa ve Kredi Riski',
            email: 'merve.aksoy@banka.com',
            phone: '+90 212 555 02 03',
            status: 'Aktif',
            hireDate: '2022-01-15',
            cpeHours: 24,
            certifications: ['FRM Part I'],
            experiences: [],
            promotions: []
        }
    ]);

    const [formData, setFormData] = useState<Partial<RiskStaffMember>>({
        firstName: '',
        lastName: '',
        title: RISK_TITLES[1] || 'Risk Yönetimi Uzmanı',
        role: 'Risk Yönetimi Uzmanı',
        department: 'Mali ve Likidite Riski Yönetimi',
        email: '',
        phone: '',
        status: 'Aktif',
        hireDate: new Date().toISOString().split('T')[0],
        cpeHours: 20,
        certifications: ['FRM']
    });

    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({
            firstName: '',
            lastName: '',
            title: RISK_TITLES[1] || 'Risk Yönetimi Uzmanı',
            role: 'Risk Yönetimi Uzmanı',
            department: 'Mali ve Likidite Riski Yönetimi',
            email: '',
            phone: '',
            status: 'Aktif',
            hireDate: new Date().toISOString().split('T')[0],
            cpeHours: 20,
            certifications: ['FRM']
        });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (staff: RiskStaffMember) => {
        setIsEditing(true);
        setSelectedStaff(staff);
        setFormData({ ...staff });
        setIsAddModalOpen(true);
    };

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName) {
            showToast('Lütfen ad ve soyad giriniz', 'warning');
            return;
        }

        if (isEditing && selectedStaff) {
            setStaffList(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, ...formData } as RiskStaffMember : s));
            showToast(`${formData.firstName} ${formData.lastName} bilgileri güncellendi.`, 'success');
        } else {
            const newMember: RiskStaffMember = {
                id: `RSK-00${staffList.length + 1}`,
                registrationNumber: `RSK-REG-0${staffList.length + 1}`,
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                title: formData.title || 'Risk Yönetimi Uzmanı',
                role: formData.role || 'Risk Yönetimi Uzmanı',
                department: formData.department || 'Mali ve Likidite Riski Yönetimi',
                email: formData.email || '',
                phone: formData.phone || '',
                status: 'Aktif',
                hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
                cpeHours: formData.cpeHours || 20,
                certifications: formData.certifications || ['FRM'],
                experiences: [],
                promotions: []
            };
            setStaffList([newMember, ...staffList]);
            showToast(`Yeni Risk Uzmanı (${newMember.firstName} ${newMember.lastName}) başarıyla eklendi.`, 'success');
        }

        setIsAddModalOpen(false);
    };

    const handleDeleteStaff = (id: string) => {
        setStaffList(prev => prev.filter(s => s.id !== id));
        setDeleteConfirmId(null);
        showToast('Risk personeli kadrodan çıkarıldı.', 'success');
    };

    const filtered = staffList.filter(s => {
        const full = `${s.firstName} ${s.lastName}`.toLowerCase();
        const q = searchTerm.toLowerCase();
        return full.includes(q) || s.department.toLowerCase().includes(q) || s.title.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Toplam Risk Kadrosu" value={staffList.length} icon={Users} color="blue" />
                <StatCard title="Sertifikalı Uzmanlar (FRM/CFA)" value={staffList.filter(s => s.certifications.length > 0).length} icon={Award} color="purple" />
                <StatCard title="Yıllık Eğitim Tamamlama" value="%94" icon={ShieldCheck} color="emerald" />
                <StatCard title="Ortalama Yıllık CPE Saat" value={36} icon={Activity} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Analist adı, unvan veya departman ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={handleOpenAdd}>
                        Yeni Risk Uzmanı Ekle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'ANALİST KODU', width: '140px', render: (item: any) => <CodeBadge code={item.id} /> },
                    {
                        key: 'firstName', header: 'ANALİST ADI & UNVAN', sortable: true, render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{item.firstName} {item.lastName}</div>
                                <div className="text-xs text-gray-500">{item.title} • {item.department}</div>
                            </div>
                        )
                    },
                    {
                        key: 'certifications', header: 'SERTİFİKALAR', render: (item: any) => (
                            <div className="flex flex-wrap gap-1">
                                {item.certifications?.map((c: string) => (
                                    <span key={c} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">{c}</span>
                                ))}
                            </div>
                        )
                    },
                    { key: 'cpeHours', header: 'CPE SAAT', width: '110px', render: (item: any) => <span className="font-bold text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">{item.cpeHours}h</span> },
                    { key: 'status', header: 'DURUM', width: '120px', render: (item: any) => <StatusBadge value={item.status} type="status" /> },
                    {
                        key: 'actions', header: 'İŞLEM', width: '120px', render: (item: any) => (
                            <ActionMenu
                                items={[
                                    { label: 'Detay & Düzenle', icon: <Edit3 size={14} />, onClick: () => handleOpenEdit(item) },
                                    { label: 'Kadrodan Çıkar', icon: <Trash2 size={14} />, onClick: () => setDeleteConfirmId(item.id), variant: 'danger' as any }
                                ]}
                            />
                        )
                    }
                ]}
                data={filtered}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Personel Ekle / Düzenle Modal */}
            {isAddModalOpen && (
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title={isEditing ? `Risk Uzmanı Düzenle — ${formData.firstName} ${formData.lastName}` : 'Yeni Risk Uzmanı Ekle'}
                    size="lg"
                >
                    <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Ad"
                                required
                                value={formData.firstName || ''}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <FormInput
                                label="Soyad"
                                required
                                value={formData.lastName || ''}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <CustomSelect
                                    label="Unvan"
                                    options={RISK_TITLES.map(t => ({ value: t, label: t }))}
                                    value={formData.title || ''}
                                    onChange={(val) => setFormData({ ...formData, title: String(val) })}
                                />
                            </div>
                            <FormInput
                                label="Departman"
                                value={formData.department || ''}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="E-Posta"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <FormInput
                                label="Telefon"
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                            <Button variant="primary" type="submit">Kaydet</Button>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Personeli Kadrodan Çıkar"
                message="Seçilen risk personelini kadrodan çıkarmak istediğinize emin misiniz?"
                confirmText="Kadrodan Çıkar"
                variant="danger"
                onConfirm={() => deleteConfirmId && handleDeleteStaff(deleteConfirmId)}
            />
        </div>
    );
}

export default function RiskStaffPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'RISK_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'SUPER_ADMIN']}>
            <RiskStaffPageContent />
        </RequireRole>
    );
}
