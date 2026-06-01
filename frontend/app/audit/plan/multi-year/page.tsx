'use client';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, FileText, Trash2, Edit2, CheckCircle, ChevronRight, Download, AlertCircle } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import PageHeader from '@/components/audit/PageHeader';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { clsx } from 'clsx';
import ConfirmModal from '@/components/ConfirmModal';

export default function MultiYearPlanPage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [confirmDeletePlan, setConfirmDeletePlan] = useState<string | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    // New Plan Form
    const [newPlan, setNewPlan] = useState({
        title: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 2,
        description: ''
    });

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await auditApi.getMultiYearPlans();
            setPlans(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Planlar yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await auditApi.createMultiYearPlan(newPlan);
            showToast('Plan oluşturuldu', 'success');
            setIsCreateModalOpen(false);
            loadPlans();
        } catch (error) {
            showToast('Plan oluşturulamadı', 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirmDeletePlan) return;
        try {
            await auditApi.deleteMultiYearPlan(confirmDeletePlan);
            showToast('Plan silindi', 'success');
            loadPlans();
            if (selectedPlan?.id === confirmDeletePlan) setSelectedPlan(null);
        } catch (error) {
            showToast('Silinemedi', 'error');
        } finally {
            setConfirmDeletePlan(null);
        }
    };

    const handleViewPlan = async (plan: any) => {
        try {
            const details = await auditApi.getMultiYearPlanById(plan.id);
            setSelectedPlan(details);
        } catch (error) {
            showToast('Plan detayları alınamadı', 'error');
        }
    };

    const handleApprove = async () => {
        if (!selectedPlan) return;
        try {
            await auditApi.approveMultiYearPlan(selectedPlan.id);
            showToast('Plan onaylandı', 'success');
            loadPlans();
            const updated = await auditApi.getMultiYearPlanById(selectedPlan.id);
            setSelectedPlan(updated);
        } catch (error) {
            showToast('Onaylanamadı', 'error');
        } finally {
            setIsApproveModalOpen(false);
        }
    };

    const handleExport = async () => {
        if (!selectedPlan) return;
        try {
            showToast('Excel hazırlanıyor...', 'info');
            const { filename } = await auditApi.exportMultiYearPlan(selectedPlan.id);
            const blob = await auditApi.downloadMultiYearPlanFile(filename);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Excel indirildi', 'success');
        } catch (error) {
            showToast('Dışa aktarılamadı', 'error');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="mb-4">
                <BackButton href="/audit/plan" label="Planlara Dön" />
            </div>
            <PageHeader
                title="Çok Yıllı Denetim Planı"
                subtitle="Stratejik denetim planlaması ve kapsama matrisi"
            />

            {/* Content Split: List vs Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Plan List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Plan Listesi</h3>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            leftIcon={<Plus size={18} />}
                            size="sm"
                        >
                            Yeni Plan
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <LoadingState />
                        ) : plans.length === 0 ? (
                            <EmptyState
                                title="Plan Bulunamadı"
                                description="Henüz oluşturulmuş bir plan yok."
                            />
                        ) : (
                            plans.map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => handleViewPlan(plan)}
                                    className={`card cursor-pointer transition-all hover:shadow-md border-l-4 ${selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-gray-900">{plan.title}</div>
                                        {/* Status Badge */}
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${plan.status === 'Aktif' ? 'bg-green-100 text-green-700' :
                                            plan.status === 'Onaylandı' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {plan.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <Calendar size={14} />
                                        <span>{plan.startYear} - {plan.endYear} ({plan.endYear - plan.startYear + 1} Yıl)</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                        <span className="text-xs text-gray-400">
                                            {plan._count?.items || 0} Birim Planlandı
                                        </span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Button variant="danger" size="sm" onClick={() => setConfirmDeletePlan(plan.id)} className="px-3 text-xs">
                                                Sil
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Plan Details */}
                <div className="lg:col-span-2">
                    {selectedPlan ? (
                        <div className="card h-full flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedPlan.title}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{selectedPlan.description || 'Açıklama yok.'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleExport}
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<Download size={18} />}
                                    >
                                        Excel İndir
                                    </Button>
                                    {selectedPlan.status === 'Taslak' && (
                                        <Button
                                            onClick={() => setIsApproveModalOpen(true)}
                                            variant="primary"
                                            size="sm"
                                            leftIcon={<CheckCircle size={18} />}
                                        >
                                            Onayla
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Plan Items Table */}
                            <DataTable
                                title="Plan Kalemleri"
                                description="Yıl ve çeyrek bazlı denetim dağılımı"
                                columns={[
                                    {
                                        key: 'unit.name',
                                        header: 'Denetim Birimi',
                                        render: (item: any) => <div className="cell-title">{item.unit?.name}</div>
                                    },
                                    {
                                        key: 'risk',
                                        header: 'Risk',
                                        width: '120px',
                                        align: 'center',
                                        render: (item: any) => <StatusBadge value={item.unit?.riskLevel} type="risk" size="sm" />
                                    },
                                    {
                                        key: 'year',
                                        header: 'Yıl',
                                        width: '100px',
                                        align: 'center',
                                        render: (item: any) => <span className="text-sm font-black text-primary">{item.year}</span>
                                    },
                                    {
                                        key: 'quarter',
                                        header: 'Çeyrek',
                                        width: '100px',
                                        align: 'center'
                                    },
                                    {
                                        key: 'priority',
                                        header: 'Öncelik',
                                        width: '120px',
                                        align: 'center',
                                        render: (item: any) => (
                                            <span className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                                item.priority === 'Yüksek' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-200"
                                            )}>
                                                {item.priority}
                                            </span>
                                        )
                                    },
                                    {
                                        key: 'estimatedDays',
                                        header: 'Gün',
                                        width: '80px',
                                        align: 'right',
                                        render: (item: any) => <span className="font-mono font-bold text-slate-700">{item.estimatedDays}</span>
                                    }
                                ]}
                                data={selectedPlan.items || []}
                                loading={false}
                                rowKey="id"
                                className="flex-1 shadow-none border-t-0"
                            />

                            {/* IIA Std 2010: Kapsam Boşluk Analizi */}
                            {selectedPlan.coverageGaps && selectedPlan.coverageGaps.length > 0 && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                                        <AlertCircle size={16} className="text-amber-600" />
                                        Kapsam Boşluk Analizi — Plana Dahil Edilmemiş Birimler
                                    </h4>
                                    <p className="text-xs text-amber-700 mb-3">
                                        Aşağıdaki denetim evreni birimleri bu çok yıllık plana dahil edilmemiştir. Risk durumuna göre değerlendirilmesi önerilir.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPlan.coverageGaps.map((gap: any) => (
                                            <span key={gap.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-200 rounded text-xs text-amber-800">
                                                {gap.name}
                                                {gap.riskLevel && <StatusBadge value={gap.riskLevel} type="risk" size="sm" />}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl min-h-[400px]">
                            <FileText size={48} className="mb-4 text-gray-300" />
                            <p>Detaylarını görüntülemek için soldan bir plan seçin.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Yeni Çok Yıllık Plan"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Başlığı</label>
                        <input
                            required
                            type="text"
                            className="form-input w-full"
                            placeholder="Örn: 2024-2026 Stratejik Denetim Planı"
                            value={newPlan.title}
                            onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Yılı</label>
                            <input
                                required
                                type="number"
                                className="form-input w-full"
                                value={newPlan.startYear}
                                onChange={e => setNewPlan({ ...newPlan, startYear: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Yılı</label>
                            <input
                                required
                                type="number"
                                className="form-input w-full"
                                value={newPlan.endYear}
                                onChange={e => setNewPlan({ ...newPlan, endYear: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            className="form-input w-full"
                            rows={3}
                            value={newPlan.description}
                            onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} className="mr-2">
                            İptal
                        </Button>
                        <Button type="submit">
                            Oluştur
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!confirmDeletePlan}
                onClose={() => setConfirmDeletePlan(null)}
                onConfirm={handleDelete}
                title="Planı Sil"
                message="Bu çok yıllık planı ve tüm kalemlerini silmek istediğinize emin misiniz?"
                confirmText="Sil"
                type="danger"
            />

            {/* Confirm Approve Modal */}
            <ConfirmModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={handleApprove}
                title="Planı Onayla"
                message="Bu planı onaylamak istediğinize emin misiniz? Onaylanan planlar üzerinde düzenleme yapılamaz."
                confirmText="Onayla"
                type="success"
            />
        </div>
    );
}
