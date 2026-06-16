'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, RefreshCw, FileText, CheckCircle, AlertTriangle, Eye, Upload, PieChart, Loader2 } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import PageHeader from '@/components/audit/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import ActionLink from '@/components/ui/ActionLink';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingState from '@/components/ui/LoadingState';
import CustomSelect from '@/components/ui/CustomSelect';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import CodeBadge from '@/components/ui/CodeBadge';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';

// Yıllık İç Denetim Planı Yapısı
interface AuditPlanItem {
    id: string;
    title: string;
    year: number;
    type: string; // AuditTableItem uyumluluğu için
    planType: 'Yıllık Plan' | 'Revizyon-1' | 'Revizyon-2' | 'Revizyon-3'; // Ana plan veya revizyonlar
    status: 'Taslak' | 'Onay Bekliyor' | 'Onaylandı' | 'İptal';
    approvalDate?: string;
    approvedBy?: string;
    documentUrl?: string; // Yüklenen PDF URL'i
    description?: string;
    createdAt: string;
    updatedAt?: string;
}

const PLAN_TYPES = ['Yıllık Plan', 'Revizyon-1', 'Revizyon-2', 'Revizyon-3'] as const;
const STATUS_OPTIONS = ['Taslak', 'Onay Bekliyor', 'Onaylandı', 'İptal'] as const;

export default function AuditPlanPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const canManage = checkRole(hasRole, ROLES.TRASH_MANAGER) || hasRole('SYSTEM_ADMIN') || hasRole('Admin') || hasRole('Yönetici');

    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<AuditPlanItem[]>([]);
    const currentYear = new Date().getFullYear().toString();

    // Kapasite Stateleri
    const [totalCapacity, setTotalCapacity] = useState(1100);
    const [plannedCapacity, setPlannedCapacity] = useState(0);
    const [selectedYear, setSelectedYear] = useState<string[]>(['2026']); // İlk plan yılı 2026
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<AuditPlanItem | null>(null);
    const [uploadPlanId, setUploadPlanId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [newPlan, setNewPlan] = useState<{
        title: string;
        planType: typeof PLAN_TYPES[number];
        status: typeof STATUS_OPTIONS[number];
        description?: string;
    }>({
        title: '',
        planType: 'Yıllık Plan',
        status: 'Taslak',
        description: ''
    });

    // Silme onay durumu
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        // Ana sayfaya gelindiğinde veya route değiştiğinde filtreleri varsayılana döndür
        setSearchTerm('');
        setFilterType([]);
        setFilterStatus([]);
        setSelectedYear([]);
        loadData();
    }, [pathname]);

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        try {
            const [data, statsData, staffData] = await Promise.all([
                auditApi.getPlans(),
                auditApi.getExecutiveStats(),
                auditApi.getStaff().catch(() => [])
            ]);
            // Tüm planları yükle (yıl filtresi client-side yapılacak)
            const allPlans = (Array.isArray(data) ? data : []).map((p: any) => ({
                ...p,
                planType: p.planType || p.type || 'Yıllık Plan'
            }));
            setPlans(allPlans);

            // Kapasite Hesabı (Adam/Gün) — Gerçek personel sayısı staff API'den
            const staffList = Array.isArray(staffData) ? staffData : [];
            const totalAuditorCount = staffList.length > 0 ? staffList.length : 1;
            const tCapacity = totalAuditorCount * 220;
            setTotalCapacity(tCapacity);

            setPlannedCapacity(statsData?.totalPlannedDays || 0);

        } catch (error) {
            console.error('Plan listesi yükleme hatası:', error);
            setPlans([]);
            showToast('Planlar yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredPlans = plans.filter(p => {
        const matchesSearch = p.title.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesType = filterType.length === 0 || filterType.includes(p.planType);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(p.status);
        const activeYears = selectedYear.map(y => parseInt(y));
        const matchesYear = activeYears.length === 0 || activeYears.includes(p.year);
        return matchesSearch && matchesType && matchesStatus && matchesYear;
    });

    const handleAddPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Prisma şema uyumu için veri dönüşümü
            const apiData = {
                title: newPlan.title,
                type: newPlan.planType, // planType → type dönüşümü
                year: selectedYear.length > 0 ? parseInt(selectedYear[0]) : parseInt(currentYear),
                status: newPlan.status,
                description: newPlan.description,
                quarter: 'Yıllık', // Şema zorunlu alan
                priority: 'Yüksek', // Şema zorunlu alan
                startDate: `${selectedYear.length > 0 ? selectedYear[0] : currentYear}-01-01`,
                endDate: `${selectedYear.length > 0 ? selectedYear[0] : currentYear}-12-31`,
                // documentUrl burada gönderilmez, dosya yükleme ayrı yapılır
            };

            if (editingPlan) {
                const updated = await auditApi.updatePlan(editingPlan.id, apiData);
                setPlans(prev => prev.map(p => p.id === updated.id ? { ...updated, planType: updated.type } : p));
                showToast('Plan güncellendi', 'success');
            } else {
                const addedPlan = await auditApi.createPlan(apiData);
                // Backend yanıtındaki 'type' alanını frontend 'planType' alanına dönüştür
                const frontendPlan = { ...addedPlan, planType: addedPlan.type };
                setPlans(prev => [...prev, frontendPlan]);
                showToast('Plan başarıyla oluşturuldu', 'success');
            }

            resetForm();
        } catch (error) {
            console.error('Plan kaydetme hatası:', error);
            showToast('Plan oluşturulurken hata oluştu. Lütfen tüm alanları kontrol edin.', 'error');
        }
    };

    const resetForm = () => {
        setShowAddModal(false);
        setEditingPlan(null);
        setNewPlan({
            title: '',
            planType: 'Yıllık Plan',
            status: 'Taslak',
            description: ''
        });
    };

    const handleDeletePlanClick = (id: string) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            await auditApi.deletePlan(deleteConfirm.id);
            setPlans(prev => prev.filter(p => p.id !== deleteConfirm.id));
            showToast('Plan silindi', 'success');
        } catch (error) {
            console.error('Plan silme hatası:', error);
            setPlans(prev => prev.filter(p => p.id !== deleteConfirm.id));
            showToast('Plan silindi (çevrimdışı)', 'warning');
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    // Yıllık plan var mı kontrol et
    const hasAnnualPlan = plans.some(p => p.planType === 'Yıllık Plan');
    const approvedAnnualPlan = plans.find(p => p.planType === 'Yıllık Plan' && p.status === 'Onaylandı');

    if (loading && plans.length === 0) {
        return <LoadingState fullscreen message="Denetim planı yükleniyor..." />;
    }
    // Calculate stats based on search and year filters
    const statsTotal = plans.filter(p => {
        const matchesSearch = p.title.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const activeYears = selectedYear.map(y => parseInt(y));
        const matchesYear = activeYears.length === 0 || activeYears.includes(p.year);
        return matchesSearch && matchesYear;
    });

    const toggleStatusFilter = (status: string) => {
        if (filterStatus.includes(status)) {
            setFilterStatus(filterStatus.filter(s => s !== status));
        } else {
            setFilterStatus([status]);
        }
    };

    const toggleRevizyonFilter = () => {
        const hasRevizyon = filterType.some(t => t.startsWith('Revizyon'));
        if (hasRevizyon) {
            setFilterType(filterType.filter(t => !t.startsWith('Revizyon')));
        } else {
            setFilterType(['Revizyon-1', 'Revizyon-2', 'Revizyon-3']);
        }
    };

    return (
        <>
            {/* Header */}
            <PageHeader title="Denetim Planı" subtitle="Yıllık denetim planı ve revizyonlarının yönetimi" />
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Taslak"
                    value={statsTotal.filter(p => p.status === 'Taslak').length}
                    color="blue"
                    icon={<FileText size={20} />}
                    onClick={() => toggleStatusFilter('Taslak')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Taslak') ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />

                <StatCard
                    title="Revizyon"
                    value={statsTotal.filter(p => p.planType?.startsWith('Revizyon') || p.type?.startsWith('Revizyon')).length}
                    color="amber"
                    icon={<RefreshCw size={20} />}
                    onClick={toggleRevizyonFilter}
                    className={`transition-all hover:scale-[1.02] ${filterType.some(t => t.startsWith('Revizyon')) ? 'ring-2 ring-amber-500 scale-[1.02] bg-amber-50/10' : ''}`}
                />

                <StatCard
                    title="Onaylandı"
                    value={statsTotal.filter(p => p.status === 'Onaylandı').length}
                    color="green"
                    icon={<CheckCircle size={20} />}
                    onClick={() => toggleStatusFilter('Onaylandı')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Onaylandı') ? 'ring-2 ring-green-500 scale-[1.02] bg-green-50/10' : ''}`}
                />

                <StatCard
                    title="Onay Bekliyor"
                    value={statsTotal.filter(p => p.status === 'Onay Bekliyor').length}
                    color="orange"
                    icon={<Calendar size={20} />}
                    onClick={() => toggleStatusFilter('Onay Bekliyor')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Onay Bekliyor') ? 'ring-2 ring-orange-500 scale-[1.02] bg-orange-50/10' : ''}`}
                />
            </div>

            {/* Capacity Analysis */}
            <div className="card mb-6 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <PieChart size={20} className="text-indigo-600" /> Plan Kapasite Analizi (Adam/Gün)
                    </h3>
                    <span className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        %{((plannedCapacity / totalCapacity) * 100).toFixed(1)} Doluluk
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Planlanan Efor: {plannedCapacity} Gün</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Toplam Kapasite: {totalCapacity} Gün</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden border border-gray-200 shadow-inner my-1">
                        <div
                            className={`h-full flex items-center justify-end text-[10px] text-white font-bold px-2 transition-all duration-1000 ease-out 
                                ${plannedCapacity > totalCapacity ? 'bg-red-500' :
                                    (plannedCapacity / totalCapacity) > 0.8 ? 'bg-orange-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min((plannedCapacity / totalCapacity) * 100, 100)}%` }}
                        >
                            {plannedCapacity > 0 ? `%${((plannedCapacity / totalCapacity) * 100).toFixed(0)}` : ''}
                        </div>
                    </div>
                    <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <AlertTriangle size={12} className={plannedCapacity > totalCapacity ? 'text-red-500' : 'text-gray-400'} />
                            {plannedCapacity > totalCapacity ? 'Kapasite aşımı mevcut! Personel sayısını artırın veya planı azaltın.' : 'Kapasite sınırları içerisindesiniz.'}
                        </p>
                        <span className="text-xs font-semibold text-gray-600">Kalan: {Math.max(totalCapacity - plannedCapacity, 0)} Gün</span>
                    </div>

                    {/* IIA Std 2010: Universe Risk Bazlı Önceliklendirme Bağlantısı */}
                    <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <AlertTriangle size={14} className="text-indigo-500" />
                            <span className="font-medium">Risk bazlı önceliklendirme için Denetim Evreni risk skorlarını inceleyin</span>
                        </div>
                        <ActionLink href="/audit/universe" className="text-indigo-600 hover:text-indigo-800">
                            Denetim Evrenine Git
                        </ActionLink>
                    </div>
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Plan ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadData(false)}
                showExportButton={true}
                onExportClick={() => { auditApi.exportToExcel(filteredPlans, `${selectedYear}_Denetim_Plani`); showToast('Planlar dışa aktarıldı', 'success'); }}
                showAddButton={canManage}
                onAddClick={() => setShowAddModal(true)}
                addButtonText={hasAnnualPlan ? 'Revizyon Ekle' : 'Yıllık Plan Oluştur'}
                filters={
                    <FilterDropdown
                        activeCount={selectedYear.length + filterType.length + filterStatus.length}
                        onClear={() => { setSelectedYear([]); setFilterType([]); setFilterStatus([]); setSearchTerm(''); }}
                    >
                        <CustomSelect 
                            label="Plan Yılı" 
                            value={selectedYear} 
                            onChange={(val) => setSelectedYear(val as string[])} 
                            placeholder="Tümü"
                            isMulti
                            options={Array.from(new Set(plans.map(p => p.year))).sort((a, b) => b - a).map(y => ({ value: String(y), label: `${y} Yılı` }))} 
                        />
                        <CustomSelect label="Plan Türü" value={filterType} onChange={(val) => setFilterType(val as string[])} placeholder="Tümü" isMulti options={PLAN_TYPES.map(t => ({ value: t, label: t }))} />
                        <CustomSelect label="Durum" value={filterStatus} onChange={(val) => setFilterStatus(val as string[])} placeholder="Tümü" isMulti options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))} />
                    </FilterDropdown>
                }
                rightActions={
                    <div className="flex items-center gap-2">
                        <Link href="/audit/plan/multi-year">
                            <Button variant="secondary" leftIcon={<PieChart size={18} />}>
                                Çok Yıllı Plan
                            </Button>
                        </Link>
                    </div>
                }
            />



            {/* Plan List */}
            <DataTable
                title={`Denetim Planları${selectedYear.length > 0 ? ' (' + selectedYear.join(', ') + ')' : ''}`}
                description="Hazırlanan yıllık plan ve revizyonların listesi"
                columns={[
                    {
                        key: 'planType',
                        header: 'Plan Türü',
                        width: '160px',
                        render: (plan: any) => (
                            <CodeBadge code={plan.planType} size="sm" variant="secondary" />
                        )
                    },
                    {
                        key: 'title',
                        header: 'Plan Başlığı',
                        render: (plan: any) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="cell-title">{plan.title}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.year} Dönemi</div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        header: 'Durum',
                        width: '150px',
                        align: 'center',
                        render: (plan: any) => (
                            <StatusBadge type="status" value={plan.status} />
                        )
                    },
                    {
                        key: 'createdAt',
                        header: 'Oluşturulma',
                        width: '180px',
                        align: 'center',
                        type: 'datetime'
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '120px',
                        align: 'center',
                        render: (plan: any) => {
                            const items = [
                                {
                                    label: 'Detayı İncele',
                                    icon: Eye,
                                    onClick: () => router.push(`/audit/plan/${plan.id}`)
                                }
                            ];
                            
                            if (canManage) {
                                items.push({
                                    label: 'Düzenle',
                                    icon: AlertTriangle as any, // Using an icon, in real life Edit
                                    onClick: () => {
                                        setEditingPlan(plan);
                                        setNewPlan({
                                            title: plan.title,
                                            planType: plan.planType,
                                            status: plan.status,
                                            description: plan.description
                                        });
                                        setShowAddModal(true);
                                    }
                                });
                            }

                            return (
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                    <ActionMenu items={items} />
                                </div>
                            );
                        }
                    }
                ]}
                data={filteredPlans}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={10}
                itemUnit="plan"
                emptyIcon={Calendar}
                emptyTitle={`${selectedYear.length > 0 ? selectedYear.join(', ') + ' Yılı' : ''} Plan Bulunamadı`}
                emptyDescription="Bu yıl için henüz bir denetim planı veya revizyon oluşturulmamış."
                className="shadow-sm border border-gray-100"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilterType([]);
                    setFilterStatus([]);
                    setSelectedYear([]);
                }}
            />

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={resetForm}
                title={
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-gray-500" />
                        <span>{editingPlan ? 'Planı Düzenle' : (hasAnnualPlan ? 'Revizyon Ekle' : 'Yıllık Plan Oluştur')}</span>
                    </div>
                }
                size="2xl"
                footer={
                    <div className="flex justify-end w-full gap-3">
                        <Button
                            variant="secondary"
                            onClick={resetForm}
                            disabled={loading}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            form="plan-form"
                            isLoading={loading}
                            className="px-8 shadow-md"
                        >
                            {editingPlan ? 'Güncelle' : 'Oluştur'}
                        </Button>
                    </div>
                }
            >
                <form id="plan-form" onSubmit={handleAddPlan} className="space-y-4">
                    {/* Yıl Bilgisi */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3">
                        <Calendar className="text-indigo-600" size={20} />
                        <div>
                            <div className="font-semibold text-indigo-900">{selectedYear.length > 0 ? selectedYear[0] : currentYear} Yılı</div>
                            <div className="text-xs text-indigo-600">Denetim Planı</div>
                        </div>
                    </div>

                    {/* Plan Başlığı */}
                    <div className="form-group">
                        <label className="form-label">Plan Başlığı *</label>
                        <input
                            type="text"
                            className="form-input w-full"
                            required
                            placeholder={`${selectedYear.length > 0 ? selectedYear[0] : currentYear} Yıllık Denetim Planı`}
                            value={newPlan.title}
                            onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                        />
                    </div>

                    {/* Plan Türü ve Durum */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <CustomSelect
                                label="Plan Türü"
                                value={newPlan.planType}
                                onChange={(val) => setNewPlan({ ...newPlan, planType: val as any })}
                                disabled={!hasAnnualPlan && !editingPlan}
                                options={PLAN_TYPES.map(t => ({
                                    value: t,
                                    label: t + (t === 'Yıllık Plan' && hasAnnualPlan && !editingPlan ? ' (Mevcut)' : ''),
                                    disabled: t === 'Yıllık Plan' && hasAnnualPlan && !editingPlan
                                }))}
                            />
                            {!hasAnnualPlan && !editingPlan && (
                                <p className="text-xs text-amber-600 mt-1">⚠ Önce yıllık plan oluşturulmalıdır</p>
                            )}
                        </div>
                        <div className="form-group">
                            <CustomSelect
                                label="Durum"
                                value={newPlan.status}
                                onChange={(val) => setNewPlan({ ...newPlan, status: val as any })}
                                options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                            />
                        </div>
                    </div>

                    {/* Açıklama */}
                    <div className="form-group">
                        <label className="form-label">Açıklama</label>
                        <textarea
                            className="form-textarea w-full"
                            rows={3}
                            placeholder="Plan hakkında kısa açıklama..."
                            value={newPlan.description}
                            onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>

            {/* Belge Yükleme Modalı */}
            <Modal
                isOpen={!!uploadPlanId}
                onClose={() => { if (!uploading) setUploadPlanId(null); }}
                title="Onaylı Plan Belgesi Yükle"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setUploadPlanId(null)} disabled={uploading}>Kapat</Button>
                    </div>
                }
            >
                <div className="p-4 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-300 text-center hover:border-primary transition-colors cursor-pointer"
                     onClick={(e) => {
                         if (uploading) return;
                         const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
                         input?.click();
                     }}>
                    {uploading ? (
                        <div className="py-6">
                            <Loader2 size={32} className="mx-auto text-primary mb-3 animate-spin" />
                            <p className="text-sm text-gray-700 font-semibold">Belge yükleniyor...</p>
                        </div>
                    ) : (
                        <>
                            <Upload size={32} className="mx-auto text-gray-400 mb-4 mt-2" />
                            <p className="text-sm text-gray-800 font-bold mb-1">PDF dosyası seçin veya sürükleyin</p>
                            <p className="text-xs text-gray-500 mb-2">(Maks. 20MB)</p>
                        </>
                    )}
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        disabled={uploading}
                        onClick={(e) => e.stopPropagation()}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && uploadPlanId) {
                                if (file.size > 20 * 1024 * 1024) {
                                    showToast('Dosya boyutu 20MB\'\u0131 aşamaz', 'error');
                                    return;
                                }
                                setUploading(true);
                                try {
                                    const result = await auditApi.uploadPlanDocument(uploadPlanId, file);
                                    setPlans(prev => prev.map(p => p.id === uploadPlanId ? { ...p, documentUrl: result?.url || result?.documentUrl || file.name } : p));
                                    showToast('Belge başarıyla yüklendi', 'success');
                                    setUploadPlanId(null);
                                } catch (err) {
                                    console.error('Belge yükleme hatası:', err);
                                    showToast('Belge yüklenirken hata oluştu', 'error');
                                } finally {
                                    setUploading(false);
                                }
                            }
                        }}
                    />
                    {!uploading && (
                        <Button variant="secondary" size="sm" className="mt-2 text-xs" onClick={(e) => { e.stopPropagation(); const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement; input?.click(); }}>
                            Bilgisayardan Seç
                        </Button>
                    )}
                </div>
            </Modal>

            {/* Silme Onay Modalı */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Planı Sil"
                message="Bu planı silmek istediğinize emin misiniz?"
                confirmText="Evet, Sil"

                type="danger"
            />
        </>
    );
}
