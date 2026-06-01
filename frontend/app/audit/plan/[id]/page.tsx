'use client';
import { useState, useEffect, useRef } from 'react';
import { formatDate } from '@/lib/audit-utils';
import {
    Calendar, ArrowLeft, Edit2, Trash2, CheckCircle, Clock, AlertTriangle,
    User, FileText, ChevronRight, Plus, Download, Upload, Eye, X, Save, Users
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { auditApi } from '@/lib/audit-api';
import Tooltip from '@/components/ui/Tooltip';
import LoadingState from '@/components/ui/LoadingState';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { BackButton } from '@/components/ui/BackButton';
import CustomSelect from '@/components/ui/CustomSelect';
import AddAuditToPlanModal from '@/components/audit/modals/AddAuditToPlanModal';
import ResourcePlanningModal from '@/components/audit/modals/ResourcePlanningModal';
import EditPlanModal from '@/components/audit/modals/EditPlanModal';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { clsx } from 'clsx';
import EmptyState from '@/components/ui/EmptyState';

// Plan Türü Renkleri
const PLAN_TYPE_COLORS: Record<string, string> = {
    'Yıllık Plan': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Revizyon-1': 'bg-orange-100 text-orange-800 border-orange-200',
    'Revizyon-2': 'bg-orange-200 text-orange-900 border-orange-300',
    'Revizyon-3': 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_COLORS: Record<string, string> = {
    'Taslak': 'bg-blue-100 text-blue-800 border-blue-200',
    'Onay Bekliyor': 'bg-amber-100 text-amber-800 border-amber-200',
    'Onaylandı': 'bg-green-100 text-green-800 border-green-200',
    'İptal': 'bg-red-100 text-red-800 border-red-200',
};

export default function AuditPlanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const { showToast } = useToast();
    const { user } = useAuth();

    const isManager = !!user?.roles?.some(r => r === 'ADMIN' || r === 'AUDIT_ADMIN' || r === 'MANAGER');

    // States
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [availableAudits, setAvailableAudits] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [historicalStats, setHistoricalStats] = useState<{ type: string, avgDays: number, count: number }[]>([]);

    // Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAddAuditModal, setShowAddAuditModal] = useState(false);
    const [showAddResourceModal, setShowAddResourceModal] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Form States
    const [signedFile, setSignedFile] = useState<File | null>(null);
    const [approvalNote, setApprovalNote] = useState('');
    const [resSortCol, setResSortCol] = useState('');
    const [resSortDir, setResSortDir] = useState<'asc' | 'desc'>('desc');
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        status: 'Taslak'
    });
    const [selectedAuditId, setSelectedAuditId] = useState('');
    const [newResource, setNewResource] = useState({
        staffId: '',
        days: 0  // Kullanıcı girecek
    });

    // Click outside refs
    const addAuditRef = useRef(null);
    const addResourceRef = useRef(null);
    useOnClickOutside(addAuditRef, () => setShowAddAuditModal(false));
    useOnClickOutside(addResourceRef, () => setShowAddResourceModal(false));

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Plan verisi
            const data = await auditApi.getPlan(String(id));
            setPlan(data);
            setEditForm({
                title: data.title || '',
                description: data.description || '',
                status: data.status || 'Taslak'
            });

            // Mevcut denetimler listesi (plan'a eklemek için)
            const audits = await auditApi.getAudits();
            setAvailableAudits(Array.isArray(audits) ? audits : []);

            // Personel listesi (kaynak planlaması için)
            const staff = await auditApi.getStaff();
            setStaffList(Array.isArray(staff) ? staff : []);
        } catch (error: any) {
            console.error('Plan yükleme hatası:', error);
            showToast(error?.message || 'Plan verileri yüklenemedi', 'error');
            setPlan(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAuditToPlan = () => {
        if (!selectedAuditId) {
            showToast('Lütfen bir denetim seçin', 'error');
            return;
        }

        const selectedAudit = availableAudits.find(a => a.id === selectedAuditId);
        if (!selectedAudit) return;

        // Check if already added
        if (plan.audits?.some((a: any) => a.id === selectedAuditId)) {
            showToast('Bu denetim zaten ekli', 'error');
            return;
        }

        setPlan({
            ...plan,
            audits: [...(plan.audits || []), selectedAudit]
        });
        setShowAddAuditModal(false);
        setSelectedAuditId('');
        showToast('Denetim plana eklendi', 'success');
    };

    const handleRemoveAuditFromPlan = (auditId: string) => {
        setPlan({
            ...plan,
            audits: plan.audits?.filter((a: any) => a.id !== auditId) || []
        });
        showToast('Denetim plandan çıkarıldı', 'success');
    };

    const handleAddResource = (data: { staffId: string; days: number }) => {
        if (!data.staffId) {
            showToast('Lütfen personel seçin', 'error');
            return;
        }

        const selectedStaff = staffList.find(s => s.id === data.staffId);
        if (!selectedStaff) return;

        // Check if already added
        if (plan.resources?.some((r: any) => r.staffId === data.staffId)) {
            showToast('Bu personel zaten ekli', 'error');
            return;
        }

        const resourceEntry = {
            staffId: data.staffId,
            name: selectedStaff.name || `${selectedStaff.firstName} ${selectedStaff.lastName}`,
            title: selectedStaff.title,  // Ünvan otomatik
            days: data.days
        };

        setPlan({
            ...plan,
            resources: [...(plan.resources || []), resourceEntry]
        });
        setShowAddResourceModal(false);
        showToast('Kaynak plana eklendi', 'success');
    };

    const handleRemoveResource = (staffId: string) => {
        setPlan({
            ...plan,
            resources: plan.resources?.filter((r: any) => r.staffId !== staffId) || []
        });
        showToast('Kaynak plandan çıkarıldı', 'success');
    };

    const handleApprove = async () => {
        if (!signedFile) {
            showToast('Lütfen imzalı plan belgesini yükleyin', 'error');
            return;
        }

        setUploadingFile(true);
        try {
            await auditApi.uploadPlanDocument(String(id), signedFile);
            await auditApi.updatePlan(String(id), {
                status: 'Onaylandı',
                approvedBy: user?.displayName || user?.email || 'Yönetici',
                approvedAt: new Date().toISOString(),
                approvalNote: approvalNote
            });

            setPlan({
                ...plan,
                status: 'Onaylandı',
                approvedBy: user?.displayName || user?.email || 'Yönetici',
                approvedAt: new Date().toISOString()
            });

            showToast('Plan başarıyla onaylandı', 'success');
            setSignedFile(null);
            setApprovalNote('');
        } catch (error: any) {
            console.error('Plan onaylama hatası:', error);
            showToast(error?.message || 'Plan onaylanırken hata oluştu.', 'error');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSaveEdit = async (data: { title: string; description: string; status: string }) => {
        try {
            await auditApi.updatePlan(String(id), data);
            setPlan({ ...plan, ...data });
            showToast('Plan güncellendi', 'success');
            setShowEditModal(false);
        } catch (error: any) {
            console.error('Plan güncelleme hatası:', error);
            showToast(error?.message || 'Plan güncellenirken hata oluştu.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await auditApi.deletePlan(String(id));
            showToast('Plan silindi', 'success');
            router.push('/audit/plan');
        } catch (error: any) {
            console.error('Plan silme hatası:', error);
            showToast(error?.message || 'Plan silinirken hata oluştu.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingState message="Plan detayları yükleniyor..." />
            </div>
        );
    }

    if (!plan) return (
        <div className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
            <p className="text-xl font-semibold">Plan bulunamadı.</p>
            <div className="mt-4">
                <BackButton href="/audit/plan" label="Planlara Dön" />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-6">
                <BackButton href="/audit/plan" label="Planlara Dön" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${PLAN_TYPE_COLORS[plan.planType] || 'bg-gray-100'}`}>
                            {plan.planType || 'Plan'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[plan.status] || 'bg-gray-100'}`}>
                            {plan.status}
                        </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {plan.year}</div>
                        <div className="flex items-center gap-1.5"><User size={14} className="text-primary" /> {plan.createdBy || 'Sistem'}</div>
                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {formatDate(plan.createdAt)}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ActionMenu items={[
                        { label: 'Düzenle', icon: Edit2, onClick: () => setShowEditModal(true) },
                        { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => setShowDeleteConfirm(true) }
                    ]} />
                </div>
            </div>

            {/* Approval Section for Manager */}
            {isManager && plan.status !== 'Onaylandı' && (
                <div className="card border-l-4 border-blue-500 bg-blue-50/50">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-blue-600" />
                        Plan Onayı
                    </h3>
                    <div className="bg-white p-5 rounded-xl border border-blue-100 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="flex flex-col h-full">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    İmzalı Denetim Planı (PDF) <span className="text-red-500">*</span>
                                </label>
                                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-primary hover:bg-blue-50 transition-all cursor-pointer min-h-[120px]">
                                    <Upload size={32} className="text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-500">Dosya Seçin (PDF)</span>
                                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => setSignedFile(e.target.files?.[0] || null)} />
                                </label>
                                {signedFile && (
                                    <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-100 mt-2">
                                        <FileText size={16} />
                                        <span className="font-medium truncate">{signedFile.name}</span>
                                        <button
                                            title="Dosyayı Kaldır"
                                            onClick={() => setSignedFile(null)}
                                            className="ml-auto text-blue-400 hover:text-blue-600 p-1 rounded-md transition-colors"
                                            type="button"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col h-full">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Onay Notu</label>
                                <textarea className="form-textarea w-full h-[120px] resize-none flex-1" placeholder="Onay veya revizyon notları..." value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleApprove}
                                disabled={!signedFile || uploadingFile}
                                isLoading={uploadingFile}
                                leftIcon={!uploadingFile && <CheckCircle size={18} />}
                                className="px-6"
                            >
                                Planı Onayla
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approved Badge */}
            {plan.status === 'Onaylandı' && (
                <div className="card bg-green-50 border-l-4 border-green-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500 text-white p-3 rounded-full"><CheckCircle size={24} /></div>
                        <div>
                            <p className="font-bold text-green-900 text-lg">Bu plan onaylanmıştır</p>
                            <p className="text-sm text-green-700">
                                <strong>Onaylayan:</strong> {plan.approvedBy || 'Yönetici'} |
                                <strong> Tarih:</strong> {formatDate(plan.approvedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            {plan.description && (
                <div className="card">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Açıklama</h3>
                    <p className="text-gray-700">{plan.description}</p>
                </div>
            )}

            {/* Content Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/30">
                    <div className="tabs-container mb-0">
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('overview')}
                            className={`tab-item ${activeTab === 'overview' ? 'tab-item-active' : ''} !rounded-none !h-auto py-2`}
                        >
                            Genel Bakış
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('audits')}
                            className={`tab-item ${activeTab === 'audits' ? 'tab-item-active' : ''} !rounded-none !h-auto py-2`}
                        >
                            Denetimler ({plan.audits?.length || 0})
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('resources')}
                            className={`tab-item ${activeTab === 'resources' ? 'tab-item-active' : ''} !rounded-none !h-auto py-2`}
                        >
                            Kaynak Planlaması ({plan.resources?.length || 0})
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Plan Türü"
                                value={plan.planType || 'Plan'}
                                color="indigo"
                                icon={<FileText size={20} />}
                            />

                            <StatCard
                                title="Planlanan Denetim"
                                value={`${plan.audits?.length || 0} Adet`}
                                color="blue"
                                icon={<CheckCircle size={20} />}
                            />

                            <StatCard
                                title="Toplam Adam/Gün"
                                value={`${plan.resources?.reduce((sum: number, r: any) => sum + (r.days || 0), 0) || 0} Gün`}
                                color="green"
                                icon={<Users size={20} />}
                            />
                        </div>
                    )}

                    {/* Audits Tab */}
                    {activeTab === 'audits' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button onClick={() => setShowAddAuditModal(true)} leftIcon={<Plus size={18} />}>
                                    Denetim Ekle
                                </Button>
                            </div>

                            {plan.audits && plan.audits.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {plan.audits.map((audit: any) => (
                                        <div key={audit.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{audit.title}</h4>
                                                        <span className="text-xs text-gray-400">{audit.type || 'Denetim'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-blue-50 text-blue-600 border-blue-100">
                                                        {audit.status}
                                                    </span>
                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <ActionMenu items={[
                                                            { label: 'İncele', icon: Eye, onClick: () => router.push(`/audit/audits/${audit.id}`) },
                                                            { label: 'Kaldır', icon: Trash2, variant: 'danger' as const, onClick: () => handleRemoveAuditFromPlan(audit.id) }
                                                        ]} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Denetim Eklenmemiş"
                                    description="Bu plana henüz denetim eklenmemiş."
                                />
                            )}
                        </div>
                    )}

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                        <div className="space-y-4">
                            <DataTable
                                title="Kaynak Dağılımı"
                                description="Denetim ekibi personeli ve ayrılan eforlar"
                                columns={[
                                    {
                                        key: 'name',
                                        header: 'Personel',
                                        render: (r: any) => (
                                            <div className="cell-user">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white shadow-sm">
                                                    {r.name?.charAt(0) || 'P'}
                                                </div>
                                                <span className="font-semibold text-slate-700">{r.name}</span>
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'title',
                                        header: 'Ünvan',
                                        render: (r: any) => (
                                            <span className="cell-user-role">{r.title || r.role || '-'}</span>
                                        )
                                    },
                                    {
                                        key: 'days',
                                        header: 'Süre (Gün)',
                                        width: '150px',
                                        align: 'center',
                                        render: (r: any) => (
                                            <div className="cell-date justify-center px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-bold">
                                                {r.days} Gün
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'actions',
                                        header: 'İşlemler',
                                        width: '100px',
                                        align: 'center',
                                        render: (r: any) => (
                                            <div className="flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <ActionMenu items={[
                                                    { label: 'Kaldır', icon: Trash2, variant: 'danger' as const, onClick: () => handleRemoveResource(r.staffId) }
                                                ]} />
                                            </div>
                                        )
                                    }
                                ]}
                                data={plan.resources || []}
                                loading={loading}
                                rowKey="staffId"
                                rightElement={
                                    <Button onClick={() => setShowAddResourceModal(true)} leftIcon={<Plus size={18} />}>
                                        Kaynak Ekle
                                    </Button>
                                }
                            />
                            
                            {plan.resources && plan.resources.length > 0 && (
                                <div className="flex justify-end pr-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Planlanan Efor</span>
                                        <span className="text-2xl font-black text-primary font-mono tracking-tighter">
                                            {plan.resources.reduce((sum: number, r: any) => sum + (Number(r.days) || 0), 0)} <span className="text-sm font-bold opacity-60">GÜN</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Audit Modal */}
            <AddAuditToPlanModal
                isOpen={showAddAuditModal}
                onClose={() => setShowAddAuditModal(false)}
                onAdd={handleAddAuditToPlan}
                planAudits={plan.audits}
                availableAudits={availableAudits}
                selectedAuditId={selectedAuditId}
                setSelectedAuditId={setSelectedAuditId}
            />

            {/* Add Resource Modal */}
            <ResourcePlanningModal
                isOpen={showAddResourceModal}
                onClose={() => setShowAddResourceModal(false)}
                onAdd={handleAddResource}
                staffList={staffList}
                planResources={plan.resources}
            />

            {/* Edit Modal */}
            <EditPlanModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveEdit}
                initialData={editForm}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Planı Sil"
                message="Bu planı silmek istediğinize emin misiniz? Bu öğe çöp kutusuna taşınacaktır."
                confirmText="Evet, Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    );
}
