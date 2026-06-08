'use client';
import { useState, useEffect, useMemo } from 'react';
import {
    Shield, CheckCircle, AlertTriangle, BarChart3, Calendar,
    Download, TrendingUp, TrendingDown, FileText, ClipboardCheck,
    Plus, Edit, Trash2, Target, Clock, AlertCircle, ListChecks,
    ChevronRight, Activity
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import LoadingState from '@/components/ui/LoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import PageHeader from '@/components/audit/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import StatCard from '@/components/ui/StatCard';
import { auditApi } from '@/lib/audit-api';
import { DateDisplay } from '@/components/ui/DateDisplay';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import DatePicker from '@/components/ui/DatePicker';
import { clsx } from 'clsx';
import { formatDate } from '@/lib/audit-utils';
import { NoResultsState } from '@/components/ui/EmptyState';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import FormInput from "@/components/ui/FormInput";

// ======================== INTERFACES ========================

interface QualityMetric {
    id: string;
    name: string;
    category: string;
    target: number;
    actual: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    status: string;
    period?: string;
    isAutoCalculated?: boolean;
}

interface QualityAssessment {
    id: string;
    type: 'İç' | 'Dış';
    date: string;
    assessor: string;
    assessorOrg?: string;
    result: 'Uyumlu' | 'Kısmen Uyumlu' | 'Uyumsuz';
    score: number;
    findings?: string;
    nextDueDate?: string;
    actions?: QualityAction[];
    assessorTitle?: string;
    assessorCertifications?: string;
    assessorExperience?: string;
}

interface QualityAction {
    id: string;
    title: string;
    description?: string;
    responsible?: string;
    status: string;
    priority?: string;
    dueDate: string;
    completedAt?: string;
    assessmentId?: string;
    assessment?: QualityAssessment;
}

// ======================== HELPERS ========================

/** Türk standardında yüzde/birim formatlama: %90, 14 gün, 0 adet */
const formatMetricValue = (value: number, unit: string) => {
    if (unit === '%') return `%${value}`;
    return `${value} ${unit}`;
};

/** Hedef formatlama: Hedef: %90, Hedef: 30 gün */
const formatTarget = (target: number, unit: string) => {
    if (unit === '%') return `Hedef: %${target}`;
    return `Hedef: ${target} ${unit}`;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'İyi': return 'bg-green-100 text-green-700 border-green-200';
        case 'Uyarı': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'Kritik': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getActionStatusColor = (status: string) => {
    switch (status) {
        case 'Tamamlandı': return 'success';
        case 'Devam Ediyor': return 'info';
        case 'Açık': return 'warning';
        case 'Gecikmiş': return 'danger';
        default: return 'info';
    }
};

const TABS = [
    { id: 'overview', label: 'Genel Bakış', icon: Target },
    { id: 'metrics', label: 'Performans Metrikleri', icon: BarChart3 },
    { id: 'assessments', label: 'Değerlendirmeler', icon: ClipboardCheck },
    { id: 'actions', label: 'İyileştirme Planları', icon: ListChecks },
];

// ======================== COMPONENT ========================

export default function QualityAssurancePage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Data
    const [metrics, setMetrics] = useState<QualityMetric[]>([]);
    const [assessments, setAssessments] = useState<QualityAssessment[]>([]);
    const [actions, setActions] = useState<QualityAction[]>([]);
    const [stats, setStats] = useState<any>(null);

    // Arama ve Filtreleme
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterResult, setFilterResult] = useState<string[]>([]);
    const [filterPriority, setFilterPriority] = useState<string[]>([]);

    // Modals
    const [showMetricModal, setShowMetricModal] = useState(false);
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [editingMetric, setEditingMetric] = useState<QualityMetric | null>(null);
    const [editingAssessment, setEditingAssessment] = useState<QualityAssessment | null>(null);
    const [editingAction, setEditingAction] = useState<QualityAction | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'metric' | 'assessment' | 'action'; id: string } | null>(null);

    // Forms
    const [metricForm, setMetricForm] = useState({
        name: '', category: 'Performans', target: 0, actual: 0,
        unit: '%', trend: 'stable' as 'up' | 'down' | 'stable',
        period: new Date().getFullYear().toString()
    });

    const [assessmentForm, setAssessmentForm] = useState({
        type: 'İç' as 'İç' | 'Dış',
        date: new Date().toISOString().split('T')[0],
        assessor: '', assessorOrg: '',
        result: 'Uyumlu' as 'Uyumlu' | 'Kısmen Uyumlu' | 'Uyumsuz',
        score: 0, findings: '', nextDueDate: '',
        assessorTitle: '', assessorCertifications: '', assessorExperience: ''
    });

    const [actionForm, setActionForm] = useState({
        title: '', description: '', responsible: '',
        status: 'Açık', priority: 'Orta',
        dueDate: '', assessmentId: ''
    });

    // ======================== VERİ YÜKLEME ========================

    useEffect(() => { loadData(); }, []);

    // Sekme değiştiğinde aramayı ve filtreleri sıfırla
    useEffect(() => {
        setSearchTerm('');
        setFilterCategory([]);
        setFilterStatus([]);
        setFilterType([]);
        setFilterResult([]);
        setFilterPriority([]);
    }, [activeTab]);

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        try {
            const [metricsData, assessmentsData, autoMetricsData, actionsData, statsData] = await Promise.all([
                auditApi.getQualityMetrics(),
                auditApi.getQualityAssessments(),
                auditApi.getAutoMetrics().catch(() => []),
                auditApi.getQualityActions().catch(() => []),
                auditApi.getQualityStats().catch(() => null)
            ]);
            setMetrics([...(autoMetricsData || []), ...(metricsData || [])]);
            setAssessments(assessmentsData || []);
            setActions(actionsData || []);
            setStats(statsData);
        } catch (error) {
            console.error('Kalite verisi yükleme hatası:', error);
            showToast('Veriler yüklenirken hata oluştu.', 'error');
        } finally {
            if (showOverlay) setLoading(false);
        }
    };

    // ======================== EQA CALCULATION ========================

    const eqaInfo = useMemo(() => {
        const externalAssessments = assessments
            .filter(a => a.type === 'Dış')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (externalAssessments.length === 0) return { status: 'NOT_FOUND', daysLeft: 0, nextDate: null, lastDate: null };

        const lastDate = new Date(externalAssessments[0].date);
        const nextDate = new Date(lastDate);
        nextDate.setFullYear(nextDate.getFullYear() + 5);

        const diffDays = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'OVERDUE', daysLeft: Math.abs(diffDays), nextDate, lastDate };
        if (diffDays <= 180) return { status: 'APPROACHING', daysLeft: diffDays, nextDate, lastDate };
        return { status: 'GOOD', daysLeft: diffDays, nextDate, lastDate };
    }, [assessments]);

    // ======================== METRIC HANDLERS ========================

    const resetMetricForm = () => setMetricForm({ name: '', category: 'Performans', target: 0, actual: 0, unit: '%', trend: 'stable', period: new Date().getFullYear().toString() });

    const openEditMetric = (metric: QualityMetric) => {
        setEditingMetric(metric);
        setMetricForm({ name: metric.name, category: metric.category, target: metric.target, actual: metric.actual, unit: metric.unit, trend: metric.trend, period: metric.period || new Date().getFullYear().toString() });
        setShowMetricModal(true);
    };

    const handleSaveMetric = async () => {
        try {
            if (editingMetric) {
                await auditApi.updateQualityMetric(editingMetric.id, metricForm);
                showToast('Metrik güncellendi', 'success');
            } else {
                await auditApi.createQualityMetric(metricForm);
                showToast('Metrik oluşturuldu', 'success');
            }
            setShowMetricModal(false); setEditingMetric(null); resetMetricForm(); loadData(false);
        } catch (error: any) { showToast(error.message || 'İşlem başarısız', 'error'); }
    };

    const handleDeleteMetric = async (id: string) => {
        try { await auditApi.deleteQualityMetric(id); showToast('Metrik silindi', 'success'); loadData(false); }
        catch (error: any) { showToast(error.message || 'Silme başarısız', 'error'); }
    };

    // ======================== ASSESSMENT HANDLERS ========================

    const resetAssessmentForm = () => setAssessmentForm({ type: 'İç', date: new Date().toISOString().split('T')[0], assessor: '', assessorOrg: '', result: 'Uyumlu', score: 0, findings: '', nextDueDate: '', assessorTitle: '', assessorCertifications: '', assessorExperience: '' });

    const openEditAssessment = (a: QualityAssessment) => {
        setEditingAssessment(a);
        setAssessmentForm({ type: a.type, date: a.date.split('T')[0], assessor: a.assessor, assessorOrg: a.assessorOrg || '', result: a.result, score: a.score, findings: a.findings || '', nextDueDate: a.nextDueDate?.split('T')[0] || '', assessorTitle: a.assessorTitle || '', assessorCertifications: a.assessorCertifications || '', assessorExperience: a.assessorExperience || '' });
        setShowAssessmentModal(true);
    };

    const handleSaveAssessment = async () => {
        try {
            const payload = { ...assessmentForm, date: new Date(assessmentForm.date) };
            if (editingAssessment) {
                await auditApi.updateQualityAssessment(editingAssessment.id, payload);
                showToast('Değerlendirme güncellendi', 'success');
            } else {
                await auditApi.createQualityAssessment(payload);
                showToast('Değerlendirme oluşturuldu', 'success');
            }
            setShowAssessmentModal(false); setEditingAssessment(null); resetAssessmentForm(); loadData(false);
        } catch (error: any) { showToast(error.message || 'İşlem başarısız', 'error'); }
    };

    const handleDeleteAssessment = async (id: string) => {
        try { await auditApi.deleteQualityAssessment(id); showToast('Değerlendirme silindi', 'success'); loadData(false); }
        catch (error: any) { showToast(error.message || 'Silme başarısız', 'error'); }
    };

    // ======================== ACTION HANDLERS ========================

    const resetActionForm = () => setActionForm({ title: '', description: '', responsible: '', status: 'Açık', priority: 'Orta', dueDate: '', assessmentId: '' });

    const openEditAction = (action: QualityAction) => {
        setEditingAction(action);
        setActionForm({ title: action.title, description: action.description || '', responsible: action.responsible || '', status: action.status, priority: action.priority || 'Orta', dueDate: action.dueDate?.split('T')[0] || '', assessmentId: action.assessmentId || '' });
        setShowActionModal(true);
    };

    const handleSaveAction = async () => {
        try {
            const payload: any = {
                ...actionForm,
                dueDate: actionForm.dueDate ? new Date(actionForm.dueDate) : undefined,
            };
            if (actionForm.assessmentId) {
                payload.assessment = { connect: { id: actionForm.assessmentId } };
                delete payload.assessmentId;
            } else {
                delete payload.assessmentId;
            }
            if (editingAction) {
                await auditApi.updateQualityAction(editingAction.id, payload);
                showToast('Aksiyon güncellendi', 'success');
            } else {
                await auditApi.createQualityAction(payload);
                showToast('Aksiyon oluşturuldu', 'success');
            }
            setShowActionModal(false); setEditingAction(null); resetActionForm(); loadData(false);
        } catch (error: any) { showToast(error.message || 'İşlem başarısız', 'error'); }
    };

    const handleDeleteAction = async (id: string) => {
        try { await auditApi.deleteQualityAction(id); showToast('Aksiyon silindi', 'success'); loadData(false); }
        catch (error: any) { showToast(error.message || 'Silme başarısız', 'error'); }
    };

    // ======================== CONFIRM DELETE ========================

    const handleConfirmDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'metric') handleDeleteMetric(deleteConfirm.id);
        else if (deleteConfirm.type === 'assessment') handleDeleteAssessment(deleteConfirm.id);
        else if (deleteConfirm.type === 'action') handleDeleteAction(deleteConfirm.id);
        setDeleteConfirm(null);
    };

    // ======================== DERIVED DATA ========================

    const overdueActions = useMemo(() => actions.filter(a => a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date()), [actions]);

    const filteredMetrics = useMemo(() =>
        metrics.filter(m => {
            const matchesTerm = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory.length === 0 || filterCategory.includes(m.category);
            const matchesStatus = filterStatus.length === 0 || filterStatus.includes(m.status);
            return matchesTerm && matchesCategory && matchesStatus;
        })
    , [metrics, searchTerm, filterCategory, filterStatus]);

    const filteredAssessments = useMemo(() =>
        assessments.filter(a => {
            const matchesTerm = a.assessor.toLowerCase().includes(searchTerm.toLowerCase()) || a.type.toLowerCase().includes(searchTerm.toLowerCase()) || a.result.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType.length === 0 || filterType.includes(a.type);
            const matchesResult = filterResult.length === 0 || filterResult.includes(a.result);
            return matchesTerm && matchesType && matchesResult;
        })
    , [assessments, searchTerm, filterType, filterResult]);

    const filteredActions = useMemo(() =>
        actions.filter(a => {
            const matchesTerm = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || (a.responsible || '').toLowerCase().includes(searchTerm.toLowerCase()) || a.status.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPriority = filterPriority.length === 0 || filterPriority.includes(a.priority || 'Orta');
            const isOverdue = a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date();
            const displayStatus = isOverdue ? 'Gecikmiş' : a.status;
            const matchesStatus = filterStatus.length === 0 || filterStatus.includes(displayStatus);
            return matchesTerm && matchesPriority && matchesStatus;
        })
    , [actions, searchTerm, filterPriority, filterStatus]);

    // ======================== RENDER ========================

    if (loading) {
        return <div className="flex justify-center p-12"><LoadingState message="Kalite güvence verileri yükleniyor..." /></div>;
    }

    // ======================== ACTIONS & ADD BUTTON ========================

    // Toolbar add button logic based on tab
    const getAddAction = () => {
        switch (activeTab) {
            case 'metrics': return { text: 'Yeni Metrik', onClick: () => { resetMetricForm(); setEditingMetric(null); setShowMetricModal(true); } };
            case 'assessments': return { text: 'Yeni Değerlendirme', onClick: () => { resetAssessmentForm(); setEditingAssessment(null); setShowAssessmentModal(true); } };
            case 'actions': return { text: 'Yeni Aksiyon', onClick: () => { resetActionForm(); setEditingAction(null); setShowActionModal(true); } };
            default: return null;
        }
    };
    const addAction = getAddAction();

    const handleExport = () => {
        switch (activeTab) {
            case 'metrics':
                auditApi.exportToExcel(metrics, 'Kalite_Metrikleri');
                showToast('Metrikler dışa aktarıldı', 'success');
                break;
            case 'assessments':
                auditApi.exportToExcel(assessments, 'Kalite_Degerlendirmeleri');
                showToast('Değerlendirmeler dışa aktarıldı', 'success');
                break;
            case 'actions':
                auditApi.exportToExcel(actions, 'Iyilestirme_Planlari');
                showToast('İyileştirme planları dışa aktarıldı', 'success');
                break;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Kalite Güvence" subtitle="Kalite güvence ve iyileştirme programı yönetimi" />

            {/* 1. Tabs (Bulgular sayfasıyla aynı sıralama) */}
            <SegmentedTabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {/* 2. Stat Cards (her zaman görünür) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-2">
                <StatCard title="İyi Performans" value={metrics.filter(m => m.status === 'İyi').length} color="green" icon={<CheckCircle size={20} />}
                    infoTooltip="Hedefine ulaşan veya hedefini aşan metriklerin sayısıdır."
                    onClick={() => { setActiveTab('metrics'); setFilterStatus(['İyi']); setFilterCategory([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'metrics' && filterStatus.includes('İyi') ? 'ring-2 ring-green-500 scale-[1.02] bg-green-50/30' : ''}`}
                />
                <StatCard title="Uyarı" value={metrics.filter(m => m.status === 'Uyarı').length} color="yellow" icon={<AlertTriangle size={20} />}
                    infoTooltip="Hedefin altında kalan ancak henüz kritik seviyeye ulaşmamış olan metriklerin sayısıdır."
                    onClick={() => { setActiveTab('metrics'); setFilterStatus(['Uyarı']); setFilterCategory([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'metrics' && filterStatus.includes('Uyarı') ? 'ring-2 ring-yellow-500 scale-[1.02] bg-yellow-50/30' : ''}`}
                />
                <StatCard title="Kritik" value={metrics.filter(m => m.status === 'Kritik').length} color="red" icon={<AlertCircle size={20} />}
                    infoTooltip="Hedefin çok uzağında kalarak acil aksiyon gerektiren metriklerin sayısıdır."
                    onClick={() => { setActiveTab('metrics'); setFilterStatus(['Kritik']); setFilterCategory([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'metrics' && filterStatus.includes('Kritik') ? 'ring-2 ring-red-500 scale-[1.02] bg-red-50/30' : ''}`}
                />
                <StatCard title="İç Değerlendirme" value={assessments.filter(a => a.type === 'İç').length} color="blue" icon={<ClipboardCheck size={20} />}
                    infoTooltip="Kurum içindeki kalite güvence ekibi tarafından yapılan denetim faaliyetlerinin sayısı."
                    onClick={() => { setActiveTab('assessments'); setFilterType(['İç']); setFilterResult([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'assessments' && filterType.includes('İç') ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/30' : ''}`}
                />
                <StatCard title="Dış Değerlendirme" value={assessments.filter(a => a.type === 'Dış').length} color="purple" icon={<Shield size={20} />}
                    infoTooltip="Bağımsız dış denetçiler tarafından (EQA vb.) yapılan kalite değerlendirmelerinin sayısı."
                    onClick={() => { setActiveTab('assessments'); setFilterType(['Dış']); setFilterResult([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'assessments' && filterType.includes('Dış') ? 'ring-2 ring-purple-500 scale-[1.02] bg-purple-50/30' : ''}`}
                />
                <StatCard title="Açık Aksiyon" value={stats?.actions?.open || actions.filter(a => a.status === 'Açık' || a.status === 'Devam Ediyor').length} color="orange" icon={<ListChecks size={20} />}
                    infoTooltip="Henüz tamamlanmamış ve süreci devam eden kalite iyileştirme planlarının sayısı."
                    onClick={() => { setActiveTab('actions'); setFilterStatus(['Açık', 'Devam Ediyor']); setFilterPriority([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'actions' && (filterStatus.includes('Açık') || filterStatus.includes('Devam Ediyor')) ? 'ring-2 ring-orange-500 scale-[1.02] bg-orange-50/30' : ''}`}
                />
                <StatCard title="Gecikmiş Aksiyon" value={stats?.actions?.overdue || overdueActions.length} color="red" icon={<Clock size={20} />}
                    infoTooltip="Hedef tarihi geçmiş olmasına rağmen henüz tamamlanmamış olan kalite iyileştirme planlarının sayısı."
                    onClick={() => { setActiveTab('actions'); setFilterStatus(['Gecikmiş']); setFilterPriority([]); }}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${activeTab === 'actions' && filterStatus.includes('Gecikmiş') ? 'ring-2 ring-red-500 scale-[1.02] bg-red-50/30' : ''}`}
                />
            </div>

            {/* 3. EQA Bannerları */}
            {eqaInfo.status === 'OVERDUE' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-600 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-red-800">Dış Değerlendirme (EQA) Süresi Doldu!</h4>
                            <p className="text-sm text-red-700">Zorunlu 5 yıllık dış değerlendirme süresi <strong>{eqaInfo.daysLeft} gün</strong> önce dolmuştur.</p>
                        </div>
                    </div>
                </div>
            )}
            {eqaInfo.status === 'APPROACHING' && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-orange-600 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-orange-800">Dış Değerlendirme (EQA) Yaklaşıyor</h4>
                            <p className="text-sm text-orange-700">Bir sonraki zorunlu dış değerlendirmeye <strong>{eqaInfo.daysLeft} gün</strong> kaldı. (Planlanan: {eqaInfo.nextDate?.toLocaleDateString('tr-TR')})</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Toolbar — sadece aranacak içerik olan sekmelerde göster */}
            {activeTab !== 'overview' && (
                <PageToolbar
                    searchPlaceholder={
                        activeTab === 'metrics' ? "Metrik adı veya kategorisinde ara..." :
                        activeTab === 'assessments' ? "Değerlendirici veya sonuçta ara..." :
                        "Aksiyon başlığı, sorumlu veya durumda ara..."
                    }
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    onRefresh={() => loadData(false)}
                    showAddButton={!!addAction}
                    onAddClick={addAction?.onClick}
                    addButtonText={addAction?.text}
                    showExportButton={activeTab !== 'overview'}
                    onExportClick={handleExport}
                    filters={
                        <FilterDropdown
                            activeCount={
                                activeTab === 'metrics' ? filterCategory.length + filterStatus.length :
                                activeTab === 'assessments' ? filterType.length + filterResult.length :
                                filterPriority.length + filterStatus.length
                            }
                            onClear={() => {
                                setSearchTerm('');
                                setFilterCategory([]);
                                setFilterStatus([]);
                                setFilterType([]);
                                setFilterResult([]);
                                setFilterPriority([]);
                            }}
                        >
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                {activeTab === 'metrics' && (
                                    <>
                                        <div>
                                            <CustomSelect
                                                label="Kategori"
                                                value={filterCategory}
                                                onChange={(val) => setFilterCategory(val as string[])}
                                                placeholder="Tümü"
                                                isMulti
                                                options={[
                                                    { value: 'Performans', label: 'Performans' },
                                                    { value: 'Kalite', label: 'Kalite' },
                                                    { value: 'Uyum', label: 'Uyum' },
                                                    { value: 'Verimlilik', label: 'Verimlilik' },
                                                    { value: 'Etkinlik', label: 'Etkinlik' },
                                                    { value: 'Risk', label: 'Risk' }
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <CustomSelect
                                                label="Durum"
                                                value={filterStatus}
                                                onChange={(val) => setFilterStatus(val as string[])}
                                                placeholder="Tümü"
                                                isMulti
                                                options={[
                                                    { value: 'İyi', label: 'İyi' },
                                                    { value: 'Uyarı', label: 'Uyarı' },
                                                    { value: 'Kritik', label: 'Kritik' }
                                                ]}
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'assessments' && (
                                    <>
                                        <div>
                                            <CustomSelect
                                                label="Değerlendirme Türü"
                                                value={filterType}
                                                onChange={(val) => setFilterType(val as string[])}
                                                placeholder="Tümü"
                                                isMulti
                                                options={[
                                                    { value: 'İç', label: 'İç Değerlendirme' },
                                                    { value: 'Dış', label: 'Dış Değerlendirme' }
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <CustomSelect
                                                label="Uyum Sonucu"
                                                value={filterResult}
                                                onChange={(val) => setFilterResult(val as string[])}
                                                placeholder="Tümü"
                                                isMulti
                                                options={[
                                                    { value: 'Uyumlu', label: 'Uyumlu' },
                                                    { value: 'Kısmen Uyumlu', label: 'Kısmen Uyumlu' },
                                                    { value: 'Uyumsuz', label: 'Uyumsuz' }
                                                ]}
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'actions' && (
                                    <>
                                        <div>
                                            <CustomSelect
                                                label="Öncelik Seviyesi"
                                                value={filterPriority}
                                                onChange={(val) => setFilterPriority(val as string[])}
                                                placeholder="Tümü"
                                                isMulti
                                                options={[
                                                    { value: 'Yüksek', label: 'Yüksek' },
                                                    { value: 'Orta', label: 'Orta' },
                                                    { value: 'Düşük', label: 'Düşük' }
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <CustomSelect
                                                label="Aksiyon Durumu"
                                                value={filterStatus}
                                                onChange={(val) => setFilterStatus(val as string[])}
                                                placeholder="Tümü"
                                                isMulti
                                                options={[
                                                    { value: 'Açık', label: 'Açık' },
                                                    { value: 'Devam Ediyor', label: 'Devam Ediyor' },
                                                    { value: 'Tamamlandı', label: 'Tamamlandı' },
                                                    { value: 'Gecikmiş', label: 'Gecikmiş' }
                                                ]}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </FilterDropdown>
                    }
                />
            )}

            {/* ==================== TAB: GENEL BAKIŞ ==================== */}
            {activeTab === 'overview' && (
                <div className="space-y-6">

                    {/* Uyum Kontrol Listesi */}
                    <div className="card">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Shield size={20} className="text-primary" />
                            Kalite Uyum Durumu
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle size={20} className="text-green-500" />
                                    <span className="font-medium">Kalite Güvence Programı</span>
                                </div>
                                <p className="text-sm text-gray-500">Kalite güvence ve iyileştirme programı oluşturulmuştur.</p>
                            </div>
                            <div className="p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-3 mb-2">
                                    {assessments.filter(a => a.type === 'İç').length > 0
                                        ? <CheckCircle size={20} className="text-green-500" />
                                        : <AlertTriangle size={20} className="text-yellow-500" />
                                    }
                                    <span className="font-medium">İç Değerlendirmeler</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {assessments.filter(a => a.type === 'İç').length > 0
                                        ? `${assessments.filter(a => a.type === 'İç').length} adet iç değerlendirme kaydı mevcut.`
                                        : 'Henüz iç değerlendirme kaydı bulunmamaktadır.'
                                    }
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-3 mb-2">
                                    {metrics.length > 0
                                        ? <CheckCircle size={20} className="text-green-500" />
                                        : <AlertTriangle size={20} className="text-yellow-500" />
                                    }
                                    <span className="font-medium">Performans İzleme</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {metrics.length > 0
                                        ? `${metrics.length} adet performans metriği aktif olarak izlenmektedir.`
                                        : 'Henüz performans metriği tanımlanmamıştır.'
                                    }
                                </p>
                            </div>
                            <div className={`p-4 border rounded-lg ${eqaInfo.status === 'OVERDUE' ? 'bg-red-50 border-red-200' : eqaInfo.status === 'APPROACHING' ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {eqaInfo.status === 'GOOD' ? <CheckCircle size={20} className="text-green-500" /> :
                                     eqaInfo.status === 'NOT_FOUND' ? <AlertTriangle size={20} className="text-yellow-500" /> :
                                     <AlertTriangle size={20} className={eqaInfo.status === 'OVERDUE' ? 'text-red-500' : 'text-orange-500'} />}
                                    <span className="font-medium">Dış Değerlendirmeler</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {eqaInfo.status === 'NOT_FOUND' ? 'Henüz dış değerlendirme kaydı bulunmamaktadır.' :
                                     eqaInfo.status === 'OVERDUE' ? `KRİTİK: Süre doldu! (Hedef: ${eqaInfo.nextDate?.toLocaleDateString('tr-TR')})` :
                                     `Sonraki dış değerlendirme: ${eqaInfo.nextDate?.toLocaleDateString('tr-TR')} (${eqaInfo.daysLeft} gün kaldı)`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gecikmiş Aksiyonlar Uyarısı */}
                    {overdueActions.length > 0 && (
                        <div className="card border-l-4 border-l-red-500">
                            <h3 className="font-semibold flex items-center gap-2 mb-3 text-red-700">
                                <Clock size={20} />
                                Gecikmiş İyileştirme Aksiyonları ({overdueActions.length})
                            </h3>
                            <div className="space-y-2">
                                {overdueActions.slice(0, 5).map(action => (
                                    <div key={action.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div>
                                            <div className="text-sm font-medium text-red-800">{action.title}</div>
                                            <div className="text-xs text-red-600">Sorumlu: {action.responsible || '-'} · Son Tarih: {formatDate(action.dueDate)}</div>
                                        </div>
                                        <Button variant="danger" className="!text-xs !py-1 !px-3" onClick={() => { setActiveTab('actions'); }}>
                                            <ChevronRight size={14} /> Detay
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== TAB: PERFORMANS METRİKLERİ ==================== */}
            {activeTab === 'metrics' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 size={20} className="text-primary" />
                            Performans Metrikleri (KPI)
                        </h3>
                    </div>

                    {/* IIA: Otomatik Hesaplanan Metrikler */}
                    {filteredMetrics.some(m => m.isAutoCalculated) && (
                        <>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-teal-200">
                                <Activity size={16} className="text-teal-600" />
                                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Otomatik Hesaplanan Metrikler</h4>
                                <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">Sistem tarafından</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {filteredMetrics.filter(m => m.isAutoCalculated).map(metric => (
                                    <div key={metric.id} className={`p-4 border rounded-lg bg-white hover:shadow-md transition-shadow group border-l-4 border-l-teal-500`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">{metric.name}</div>
                                                <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded mt-1 inline-block">Otomatik Hesaplanan</span>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(metric.status)}`}>{metric.status}</span>
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-2xl font-bold text-gray-900">{formatMetricValue(metric.actual, metric.unit)}</span>
                                            {metric.trend === 'up' && <TrendingUp size={16} className="text-green-500 mb-1" />}
                                            {metric.trend === 'down' && <TrendingDown size={16} className="text-red-500 mb-1" />}
                                        </div>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${metric.actual >= metric.target ? 'bg-green-500' : metric.actual >= metric.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.min(metric.target > 0 ? (metric.actual / metric.target) * 100 : 0, 100)}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatTarget(metric.target, metric.unit)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Manuel Metrikler */}
                    {filteredMetrics.some(m => !m.isAutoCalculated) && (
                        <>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                <Target size={16} className="text-gray-600" />
                                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Manuel Metrikler</h4>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">Kullanıcı girişi</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMetrics.filter(m => !m.isAutoCalculated).map(metric => (
                                    <div key={metric.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow group">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="text-sm font-medium text-gray-700">{metric.name}</div>
                                            <div className="flex items-center gap-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(metric.status)}`}>{metric.status}</span>
                                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ActionMenu items={[
                                                        { label: 'Düzenle', icon: Edit, onClick: () => openEditMetric(metric) },
                                                        { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteConfirm({ type: 'metric', id: metric.id }) }
                                                    ]} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-2xl font-bold text-gray-900">{formatMetricValue(metric.actual, metric.unit)}</span>
                                            {metric.trend === 'up' && <TrendingUp size={16} className="text-green-500 mb-1" />}
                                            {metric.trend === 'down' && <TrendingDown size={16} className="text-red-500 mb-1" />}
                                        </div>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${metric.actual >= metric.target ? 'bg-green-500' : metric.actual >= metric.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.min(metric.target > 0 ? (metric.actual / metric.target) * 100 : 0, 100)}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatTarget(metric.target, metric.unit)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {filteredMetrics.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] flex items-center justify-center">
                            <NoResultsState searchTerm={searchTerm} onClear={() => setSearchTerm('')} />
                        </div>
                    )}
                </div>
            )}

            {/* ==================== TAB: DEĞERLENDİRMELER ==================== */}
            {activeTab === 'assessments' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ClipboardCheck size={20} className="text-primary" />
                            Değerlendirme Geçmişi
                        </h3>
                    </div>
                    <DataTable
                        columns={[
                            {
                                key: 'type', header: 'Tür', width: '150px',
                                render: (a: any) => (
                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                                        a.type === 'İç' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                    )}>{a.type} Değerlendirme</span>
                                )
                            },
                            { key: 'date', header: 'Tarih', width: '150px', align: 'center', type: 'date' },
                            { key: 'assessor', header: 'Değerlendirici', render: (a: any) => <div className="cell-title">{a.assessor}</div> },
                            {
                                key: 'result', header: 'Sonuç', width: '150px', align: 'center',
                                render: (a: any) => <StatusBadge type="status" value={a.result} />
                            },
                            {
                                key: 'score', header: 'Puan', width: '100px', align: 'center',
                                render: (a: any) => (
                                    <span className={clsx("text-sm font-black", a.score >= 90 ? "text-green-600" : a.score >= 70 ? "text-orange-500" : "text-red-500")}>
                                        %{a.score}
                                    </span>
                                )
                            },
                            { key: 'findings', header: 'Bulgular', render: (a: any) => <div className="text-xs text-slate-500 line-clamp-1 italic">{a.findings || '-'}</div> },
                            {
                                key: 'nextDueDate', header: 'Sonraki Planlanan', width: '150px', align: 'center',
                                render: (a: any) => a.nextDueDate ? <div className="cell-date justify-center opacity-70"><Calendar size={14} className="text-gray-400" />{formatDate(a.nextDueDate)}</div> : <span className="text-slate-300">-</span>
                            },
                            {
                                key: 'actions_col', header: 'İşlemler', width: '140px', align: 'center',
                                render: (a: any) => (
                                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                        <ActionMenu
                                            items={[
                                                { label: 'Düzenle', icon: Edit, onClick: () => openEditAssessment(a) },
                                                { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteConfirm({ type: 'assessment', id: a.id }) }
                                            ]}
                                        />
                                    </div>
                                )
                            }
                        ]}
                        data={filteredAssessments}
                        loading={loading}
                        rowKey="id"
                        paginated={true}
                        itemsPerPage={10}
                        itemUnit="değerlendirme"
                        emptyIcon={FileText}
                        emptyTitle="Değerlendirme Bulunamadı"
                        emptyDescription="Kriterlere uygun herhangi bir kalite değerlendirme kaydı mevcut değil."
                        className="shadow-sm border border-gray-100"
                        onClearFilters={() => setSearchTerm('')}
                        searchTerm={searchTerm}
                    />
                </div>
            )}

            {/* ==================== TAB: İYİLEŞTİRME PLANLARI ==================== */}
            {activeTab === 'actions' && (
                <DataTable
                    title="İyileştirme Planları"
                    description="Değerlendirmelerden kaynaklanan aksiyon ve iyileştirme planları takibi"
                    columns={[
                        { key: 'title', header: 'Aksiyon Başlığı', render: (a: any) => <div className="cell-title">{a.title}</div> },
                        { key: 'responsible', header: 'Sorumlu', width: '150px', render: (a: any) => <span className="text-sm text-gray-600">{a.responsible || '-'}</span> },
                        {
                            key: 'priority', header: 'Öncelik', width: '120px', align: 'center',
                            render: (a: any) => (
                                <span className={clsx("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                    a.priority === 'Yüksek' ? "bg-red-50 text-red-600 border-red-100" :
                                    a.priority === 'Orta' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                                    "bg-green-50 text-green-600 border-green-100"
                                )}>{a.priority || 'Orta'}</span>
                            )
                        },
                        {
                            key: 'status', header: 'Durum', width: '140px', align: 'center',
                            render: (a: any) => {
                                const isOverdue = a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date();
                                const displayStatus = isOverdue ? 'Gecikmiş' : a.status;
                                return <StatusBadge type="status" value={displayStatus} />;
                            }
                        },
                        {
                            key: 'dueDate', header: 'Son Tarih', width: '140px', align: 'center',
                            render: (a: any) => {
                                const isOverdue = a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date();
                                return a.dueDate ? (
                                    <div className={clsx("cell-date justify-center", isOverdue && "text-red-600 font-bold")}>
                                        <Calendar size={14} className={isOverdue ? "text-red-500" : "text-gray-400"} />
                                        {formatDate(a.dueDate)}
                                    </div>
                                ) : <span className="text-slate-300">-</span>;
                            }
                        },
                        {
                            key: 'assessment_ref', header: 'İlişkili Değerlendirme', width: '180px',
                            render: (a: any) => a.assessment ? (
                                <span className="text-xs text-slate-500">{a.assessment.type} - {formatDate(a.assessment.date)}</span>
                            ) : <span className="text-slate-300">-</span>
                        },
                        {
                            key: 'actions_col', header: 'İşlemler', width: '140px', align: 'center',
                            render: (a: any) => (
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                    <ActionMenu
                                        items={[
                                            { label: 'Düzenle', icon: Edit, onClick: () => openEditAction(a) },
                                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteConfirm({ type: 'action', id: a.id }) }
                                        ]}
                                    />
                                </div>
                            )
                        }
                    ]}
                    data={filteredActions}
                    loading={loading}
                    rowKey="id"
                    paginated={true}
                    itemsPerPage={10}
                    itemUnit="aksiyon"
                    emptyIcon={ListChecks}
                    emptyTitle="Aksiyon Bulunamadı"
                    emptyDescription="Kriterlere uygun herhangi bir iyileştirme aksiyonu kaydı mevcut değil."
                    className="shadow-sm border border-gray-100"
                    onClearFilters={() => setSearchTerm('')}
                    searchTerm={searchTerm}
                />
            )}

            {/* ==================== MODALS ==================== */}

            {/* Metrik Modal */}
            <Modal isOpen={showMetricModal} onClose={() => setShowMetricModal(false)} title={editingMetric ? 'Metrik Güncelle' : 'Yeni Metrik Ekle'}
                footer={<div className="flex justify-end w-full"><Button onClick={handleSaveMetric}>Kaydet</Button></div>}>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Metrik Adı</label>
                        <input type="text" className="form-input" value={metricForm.name} onChange={e => setMetricForm({ ...metricForm, name: e.target.value })} placeholder="Örn: Denetim Planına Uyum" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <CustomSelect label="Kategori" value={metricForm.category} onChange={(val) => setMetricForm({ ...metricForm, category: val as string })} options={[{ value: 'Performans', label: 'Performans' }, { value: 'Kalite', label: 'Kalite' }, { value: 'Uyum', label: 'Uyum' }, { value: 'Verimlilik', label: 'Verimlilik' }, { value: 'Etkinlik', label: 'Etkinlik' }, { value: 'Risk', label: 'Risk' }]} />
                        <div className="form-group">
                            <label className="form-label">Birim</label>
                            <input type="text" className="form-input" value={metricForm.unit} onChange={e => setMetricForm({ ...metricForm, unit: e.target.value })} placeholder="%, Gün, Adet" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="form-label">Hedef</label><input type="number" className="form-input" value={metricForm.target} onChange={e => setMetricForm({ ...metricForm, target: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">Gerçekleşen</label><input type="number" className="form-input" value={metricForm.actual} onChange={e => setMetricForm({ ...metricForm, actual: Number(e.target.value) })} /></div>
                    </div>
                </div>
            </Modal>

            {/* Değerlendirme Modal */}
            <Modal isOpen={showAssessmentModal} onClose={() => setShowAssessmentModal(false)} title={editingAssessment ? 'Değerlendirme Güncelle' : 'Yeni Değerlendirme Ekle'}
                footer={<div className="flex justify-end w-full"><Button onClick={handleSaveAssessment}>Kaydet</Button></div>}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <CustomSelect label="Tür" value={assessmentForm.type} onChange={(val) => setAssessmentForm({ ...assessmentForm, type: val as any })} options={[{ value: 'İç', label: 'İç Değerlendirme' }, { value: 'Dış', label: 'Dış Değerlendirme' }]} />
                        <div className="form-group"><label className="form-label">Tarih</label><DatePicker value={assessmentForm.date} onChange={val => setAssessmentForm({ ...assessmentForm, date: val })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="form-label">Değerlendirici Kişi/Kurum</label><input type="text" className="form-input" value={assessmentForm.assessor} onChange={e => setAssessmentForm({ ...assessmentForm, assessor: e.target.value })} placeholder="Örn: Denetim Komitesi / ABC Firması" /></div>
                        <div className="form-group"><label className="form-label">Bağlı Olduğu Kurum (Varsa)</label><input type="text" className="form-input" value={assessmentForm.assessorOrg} onChange={e => setAssessmentForm({ ...assessmentForm, assessorOrg: e.target.value })} /></div>
                    </div>

                    {assessmentForm.type === 'Dış' && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-4 mb-4">
                            <h4 className="text-sm font-semibold text-purple-800">Dış Değerlendirici Yetkinlik Bilgileri</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group"><label className="form-label">Ünvanı</label><input type="text" className="form-input" value={assessmentForm.assessorTitle} onChange={e => setAssessmentForm({ ...assessmentForm, assessorTitle: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Sertifikaları</label><input type="text" className="form-input" value={assessmentForm.assessorCertifications} onChange={e => setAssessmentForm({ ...assessmentForm, assessorCertifications: e.target.value })} placeholder="Örn: CIA, CISA, CRMA" /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Mesleki Deneyim Özeti</label><textarea className="form-input h-16" value={assessmentForm.assessorExperience} onChange={e => setAssessmentForm({ ...assessmentForm, assessorExperience: e.target.value })} /></div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <CustomSelect label="Sonuç" value={assessmentForm.result} onChange={(val) => setAssessmentForm({ ...assessmentForm, result: val as any })} options={[{ value: 'Uyumlu', label: 'Uyumlu' }, { value: 'Kısmen Uyumlu', label: 'Kısmen Uyumlu' }, { value: 'Uyumsuz', label: 'Uyumsuz' }]} />
                        <div className="form-group"><label className="form-label">Puan (%)</label><input type="number" className="form-input" value={assessmentForm.score} onChange={e => setAssessmentForm({ ...assessmentForm, score: Number(e.target.value) })} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Temel Bulgular</label><textarea className="form-input h-20" value={assessmentForm.findings} onChange={e => setAssessmentForm({ ...assessmentForm, findings: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Sonraki Planlanan Tarih</label><DatePicker value={assessmentForm.nextDueDate} onChange={val => setAssessmentForm({ ...assessmentForm, nextDueDate: val })} /></div>
                </div>
            </Modal>

            {/* Aksiyon Modal */}
            <Modal isOpen={showActionModal} onClose={() => setShowActionModal(false)} title={editingAction ? 'Aksiyon Güncelle' : 'Yeni İyileştirme Aksiyonu'}
                footer={<div className="flex justify-end w-full"><Button onClick={handleSaveAction}>Kaydet</Button></div>}>
                <div className="space-y-4">
                    <div className="form-group"><label className="form-label">Aksiyon Başlığı</label><input type="text" className="form-input" value={actionForm.title} onChange={e => setActionForm({ ...actionForm, title: e.target.value })} placeholder="Örn: Denetim prosedürlerini güncelle" /></div>
                    <div className="form-group"><label className="form-label">Açıklama</label><textarea className="form-input h-20" value={actionForm.description} onChange={e => setActionForm({ ...actionForm, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="form-label">Sorumlu</label><input type="text" className="form-input" value={actionForm.responsible} onChange={e => setActionForm({ ...actionForm, responsible: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Son Tarih</label><DatePicker value={actionForm.dueDate} onChange={val => setActionForm({ ...actionForm, dueDate: val })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <CustomSelect label="Durum" value={actionForm.status} onChange={(val) => setActionForm({ ...actionForm, status: val as string })} options={[{ value: 'Açık', label: 'Açık' }, { value: 'Devam Ediyor', label: 'Devam Ediyor' }, { value: 'Tamamlandı', label: 'Tamamlandı' }]} />
                        <CustomSelect label="Öncelik" value={actionForm.priority} onChange={(val) => setActionForm({ ...actionForm, priority: val as string })} options={[{ value: 'Düşük', label: 'Düşük' }, { value: 'Orta', label: 'Orta' }, { value: 'Yüksek', label: 'Yüksek' }]} />
                    </div>
                    {assessments.length > 0 && (
                        <CustomSelect label="İlişkili Değerlendirme (isteğe bağlı)" value={actionForm.assessmentId} onChange={(val) => setActionForm({ ...actionForm, assessmentId: val as string })}
                            options={[{ value: '', label: 'Seçiniz (opsiyonel)' }, ...assessments.map(a => ({ value: a.id, label: `${a.type} - ${formatDate(a.date)} (${a.assessor})` }))]}
                        />
                    )}
                </div>
            </Modal>

            {/* Silme Onay Modalı */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                title={deleteConfirm?.type === 'metric' ? 'Metrik Sil' : deleteConfirm?.type === 'assessment' ? 'Değerlendirme Sil' : 'Aksiyon Sil'}
                message={deleteConfirm?.type === 'metric' ? 'Bu metriği silmek istediğinizden emin misiniz?' : deleteConfirm?.type === 'assessment' ? 'Bu değerlendirmeyi silmek istediğinizden emin misiniz?' : 'Bu aksiyonu silmek istediğinizden emin misiniz?'}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteConfirm(null)}
            />
        </div>
    );
}
