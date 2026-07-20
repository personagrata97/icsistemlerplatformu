'use client';
import { useState, useEffect, useRef } from 'react';
import {
    Layers, Calculator, Plus, Search, Download, RefreshCw, Eye,
    Edit2, Trash2, X, CheckCircle, AlertTriangle, Target, BarChart2,
    FileSpreadsheet, User, Clock, Calendar, AlertCircle, Info, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/Toast';
import PageHeader from '@/components/audit/PageHeader';
import ConfirmModal from '@/components/ConfirmModal';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import StatCard from '@/components/ui/StatCard';
import Tooltip from '@/components/ui/Tooltip';
import Pagination from '@/components/ui/Pagination';
import LoadingState from '@/components/ui/LoadingState';
import ActionMenu from '@/components/ui/ActionMenu';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { clsx } from 'clsx';
import { auditApi } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import { formatDate, formatDateTime, generateSamplingReport, exportSamplingPlans, generateEnhancedSamplingExcel } from '@/lib/audit-utils';
import AdvancedSamplingModal from '@/components/sampling/AdvancedSamplingModal';

// Örnekleme Modülü - Denetim örnekleme metodolojisi
interface SamplingPlan {
    id: string;
    auditId: string;
    auditName: string;
    title: string;
    populationSize: number;
    method: 'Rastgele' | 'Sistematik' | 'Katmanlı' | 'Parasal Birim' | 'Yargısal' | 'Küme';
    confidenceLevel: number;
    errorRate: number;
    sampleSize: number;
    status: 'Planlandı' | 'Seçildi' | 'Tamamlandı';
    created_at: string;
    creatorId?: string;
    creatorName?: string;
    selectedItems?: string;
    testResult?: string;
    deviationsFound?: number;
    conclusions?: string;
    notes?: string;
    // İstatistiksel değerlendirme alanları
    observedDeviationRate?: number;
    upperDeviationRate?: number;
    precisionRate?: number;
    confidenceIntervalLower?: number;
    confidenceIntervalUpper?: number;
    projectedPopulationErrors?: number;
    sampleAdequacy?: string;
    populationWorkpaperId?: string;
}

const SAMPLING_METHODS = [
    { value: 'Rastgele', label: 'Basit Rastgele Örnekleme', description: 'Tüm popülasyondan şans usulü eşit ihtimalle seçim yapılır. Her kaydın seçilme olasılığı aynıdır.' },
    { value: 'Sistematik', label: 'Sistematik Örnekleme', description: 'Belirli aralıklarla (periyodik) seçim yapılır. Rastgele bir başlangıç noktasından itibaren atlama yapılır.' },
    { value: 'Katmanlı', label: 'Katmanlı (Tabakalı) Örnekleme', description: 'Popülasyon alt gruplara (tabaka) ayrılır ve her gruptan oransal seçim yapılır.' },
    { value: 'Küme', label: 'Blok/Küme Örneklemesi', description: 'Doğal kümeler (şube, bölge, dönem) rastgele seçilir ve seçilen kümelerin tüm kayıtları incelenir.' },
    { value: 'Parasal Birim', label: 'Parasal Birim Örneklemesi (MUS)', description: 'Parasal büyüklükle orantılı seçim. Yüksek tutarlı işlemlerin seçilme olasılığı daha fazladır.' },
    { value: 'Yargısal', label: 'Yargısal Örnekleme', description: 'Müfettişin mesleki bilgi ve deneyimine dayalı bilinçli seçim. İstatistiksel olmayan, risk odaklı yaklaşım.' }
];



import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import { AccessDenied } from '@/components/audit/AuditLogComponents';

export default function SamplingPage() {
    const { hasRole } = useAuth();
    const isInspector = hasRole('AUDIT_INSPECTOR');
    const isSupervisor = hasRole('AUDIT_SUPERVISOR');
    const isManager = hasRole('AUDIT_ADMIN') || hasRole('ADMIN') || hasRole('Yönetici');
    const isAuditor = isInspector || isSupervisor || isManager;
    const isUnit = checkRole(hasRole, ROLES.UNIT);

    if (isUnit && !isAuditor) {
        return <AccessDenied />;
    }

    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<SamplingPlan[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<SamplingPlan | null>(null);
    const [editingPlan, setEditingPlan] = useState<SamplingPlan | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showCalculator, setShowCalculator] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [audits, setAudits] = useState<any[]>([]); // Audits list state

    const handleSave = async () => {
        if (!editingPlan) return; // Düzenlenen plan boş mu kontrolü

        if (!editingPlan.auditId) {
            showToast('Lütfen bir denetim seçiniz.', 'error');
            return;
        }
        if (!editingPlan.title) {
            showToast('Lütfen popülasyon tanımı giriniz.', 'error');
            return;
        }

        try {
            const payload = {
                auditId: editingPlan.auditId,
                title: editingPlan.title,
                method: editingPlan.method,
                populationSize: Number(editingPlan.populationSize),
                sampleSize: Number(editingPlan.sampleSize),
                confidenceLevel: Number(editingPlan.confidenceLevel),
                errorRate: Number(editingPlan.errorRate),
                status: editingPlan.status,
                deviationsFound: editingPlan.deviationsFound || 0,
                testResult: editingPlan.testResult || '',
                conclusions: editingPlan.conclusions || '',
                notes: editingPlan.notes
            };

            if (editingPlan.id) {
                await auditApi.updateSample(editingPlan.id, payload);
                showToast('Plan güncellendi.', 'success');
            } else {
                await auditApi.createSample(payload);
                showToast('Yeni örnekleme planı oluşturuldu.', 'success');
            }
            setEditingPlan(null);
            loadData();
        } catch (error: any) {
            showToast(error.message || 'İşlem başarısız', 'error');
        }
    };

    const handleSaveTestResults = async () => {
        if (!selectedPlan) return;
        try {
            const payload = {
                deviationsFound: selectedPlan.deviationsFound || 0,
                conclusions: selectedPlan.conclusions || '',
                testResult: selectedPlan.testResult || '',
                status: selectedPlan.status || 'Tamamlandı'
            };
            await auditApi.updateSample(selectedPlan.id, payload);
            showToast('Test sonuçları başarıyla kaydedildi.', 'success');
            loadData(false);
            setSelectedPlan({ ...selectedPlan, ...payload });
        } catch (error: any) {
            showToast(error.message || 'Sonuçlar kaydedilemedi', 'error');
        }
    };

    const handleNewPlan = () => {
        setEditingPlan({
            id: '',
            auditId: '',
            auditName: '',
            title: '',
            populationSize: 1000,
            method: 'Rastgele',
            confidenceLevel: 95,
            errorRate: 5,
            sampleSize: 0,
            status: 'Planlandı',
            created_at: new Date().toISOString()
        });
    };

    // Filter state
    const [filterMethod, setFilterMethod] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterConclusions, setFilterConclusions] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortColumn, setSortColumn] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const toggleStatusFilter = (status: string) => {
        if (filterStatus.includes(status)) {
            setFilterStatus(filterStatus.filter(s => s !== status));
        } else {
            setFilterStatus([...filterStatus, status]);
            setFilterConclusions([]);
        }
    };

    const toggleConclusionFilter = (conclusion: string) => {
        if (filterConclusions.includes(conclusion)) {
            setFilterConclusions(filterConclusions.filter(c => c !== conclusion));
        } else {
            setFilterConclusions([conclusion]);
            setFilterStatus([]);
        }
    };

    // Calculator state
    const [calcPopulation, setCalcPopulation] = useState<number>(1000);
    const [calcConfidence, setCalcConfidence] = useState<90 | 95 | 99>(95);
    const [calcTolerableError, setCalcTolerableError] = useState<number>(5);
    const [calcExpectedError, setCalcExpectedError] = useState<number>(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (showOverlay = true) => {
        try {
            if (showOverlay) setLoading(true);
            const [data, auditList] = await Promise.all([
                auditApi.getSamples(),
                auditApi.getAudits().catch(() => [])
            ]);
            setAudits(auditList || []);
            // Backend verisini frontend arayüz yapısına dönüştür
            const transformedPlans = (data || []).map((sample: any) => ({
                ...sample,
                auditName: sample.audit?.title || 'Bilinmeyen Denetim',
                // Orijinal alanları koru, arayüz için varlıklarını garanti et
                title: sample.title || sample.populationDescription || 'Tanımsız Popülasyon',
                method: sample.method || sample.samplingMethod || 'Rastgele',
                populationSize: sample.populationSize || 0,
                sampleSize: sample.sampleSize || sample.actualSampleSize || 0,
                status: sample.status || 'Planlandı',
            }));
            setPlans(transformedPlans);
        } catch (error) {
            console.error('Örnekleme planları yükleme hatası:', error);
            showToast('Veriler yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredPlans = plans.filter(p => {
        const matchesSearch = p.auditName.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            p.title.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        
        // Katmanlı ve Tabakalı aynı şeydir, bu yüzden ikisini de tolere ediyoruz
        const matchesMethod = filterMethod.length === 0 || filterMethod.some(fm => {
            const planMethod = String(p.method || '').toLocaleLowerCase('tr-TR');
            const targetMethod = String(fm).toLocaleLowerCase('tr-TR');
            if (targetMethod === 'katmanlı' && planMethod.includes('tabakalı')) return true;
            if (targetMethod === 'tabakalı' && planMethod.includes('katmanlı')) return true;
            return planMethod.includes(targetMethod);
        });

        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(p.status);
        const matchesConclusions = filterConclusions.length === 0 || filterConclusions.includes(p.conclusions || '');
        return matchesSearch && matchesMethod && matchesStatus && matchesConclusions;
    });

    // Filtre değiştiğinde sayfalamayı sıfırla
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMethod, filterStatus, filterConclusions]);


    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                const plan = plans.find(p => p.id === deleteConfirm);
                await auditApi.deleteSample(deleteConfirm);
                
                // Not: Backend'de createNotification endpoint'i olmadığı için bildirim sadece loglara yazılır veya toast gösterilir.

                showToast('Örnekleme planı silindi.', 'success');
                loadData(false);
            } catch (error: any) {
                showToast(error.message || 'Silme başarısız', 'error');
            } finally {
                setDeleteConfirm(null);
            }
        }
    };

    // Örneklem büyüklüğü hesaplayıcı formülü (İstatistiksel Nitelik Örneklemesi)
    const calculateSampleSizeValue = () => {
        if (calcPopulation <= 0) return 0;
        
        // n = (Z² * p * (1-p)) / E²
        const zScores: Record<number, number> = { 90: 1.645, 95: 1.96, 99: 2.576 };
        const z = zScores[calcConfidence] || 1.96;
        
        const p = Math.max(calcExpectedError / 100, 0.01); 
        const e = Math.max(calcTolerableError / 100, 0.005);

        let n0 = (z * z * p * (1 - p)) / (e * e);
        let n = n0 / (1 + ((n0 - 1) / calcPopulation));

        return Math.max(Math.ceil(n), 1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Tamamlandı': return 'success';
            case 'Seçildi': return 'info';
            case 'Planlandı': return 'warning';
            default: return 'info';
        }
    };

    const getConclusionColor = (conclusion: string) => {
        switch (conclusion) {
            case 'Kabul': return 'bg-green-100 text-green-700';
            case 'Red': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    if (loading && plans.length === 0) {
        return <LoadingState message="Veriler yükleniyor, lütfen bekleyiniz..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Denetim Örneklemesi"
                subtitle="İstatistiksel örnekleme planları ve sonuç değerlendirmesi"
            />

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <StatCard
                    title="Toplam Plan"
                    value={plans.length}
                    color="blue"
                    icon={<Layers size={20} />}
                    onClick={() => { setFilterStatus([]); setFilterConclusions([]); }}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.length === 0 && filterConclusions.length === 0 ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />
                <StatCard
                    title="Tamamlandı"
                    value={plans.filter(p => p.status === 'Tamamlandı').length}
                    color="green"
                    icon={<CheckCircle size={20} />}
                    onClick={() => toggleStatusFilter('Tamamlandı')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Tamamlandı') ? 'ring-2 ring-green-500 scale-[1.02] bg-green-50/10' : ''}`}
                />
                <StatCard
                    title="Örnek Seçildi"
                    value={plans.filter(p => p.status === 'Seçildi').length}
                    color="yellow"
                    icon={<Target size={20} />}
                    onClick={() => toggleStatusFilter('Seçildi')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Seçildi') ? 'ring-2 ring-yellow-500 scale-[1.02] bg-yellow-50/10' : ''}`}
                />
                <StatCard
                    title="Kabul Edilen"
                    value={plans.filter(p => p.conclusions === 'Kabul').length}
                    color="purple"
                    icon={<BarChart2 size={20} />}
                    onClick={() => toggleConclusionFilter('Kabul')}
                    className={`transition-all hover:scale-[1.02] ${filterConclusions.includes('Kabul') ? 'ring-2 ring-purple-500 scale-[1.02] bg-purple-50/10' : ''}`}
                />
            </div>

            {/* Standardized Toolbar */}
            <PageToolbar
                searchPlaceholder="Denetim veya popülasyon ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadData(false)}
                showExportButton={true}
                onExportClick={() => {
                    exportSamplingPlans(plans)
                        .then(() => showToast('Liste PDF olarak dışa aktarıldı', 'success'))
                        .catch((err) => { console.error(err); showToast('Dışa aktarma başarısız.', 'error'); });
                }}
                showAddButton={true}
                onAddClick={() => setShowAdvancedModal(true)}
                addButtonText="Yeni Örneklem Kur"
                filters={
                    <FilterDropdown
                        onClear={() => { setFilterMethod([]); setFilterStatus([]); setSearchTerm(''); }}
                    >
                        <CustomSelect label="Yöntem" value={filterMethod} onChange={(val) => setFilterMethod(val as string[])} placeholder="Tümü" isMulti options={SAMPLING_METHODS.map(m => ({ value: m.value, label: m.label }))} />
                        <CustomSelect label="Durum" value={filterStatus} onChange={(val) => setFilterStatus(val as string[])} placeholder="Tümü" isMulti options={[{ value: 'Planlandı', label: 'Planlandı' }, { value: 'Seçildi', label: 'Seçildi' }, { value: 'Tamamlandı', label: 'Tamamlandı' }]} />
                    </FilterDropdown>
                }
                rightActions={
                    <Button variant="secondary" onClick={() => setShowCalculator(true)} leftIcon={<Calculator size={16} />}>
                        Hesaplayıcı
                    </Button>
                }
            />

            {/* Planlar Tablosu */}
            <DataTable
                title="Örnekleme Planları"
                description="İstatistiksel seçimler ve popülasyon detayları"
                columns={[
                    {
                        key: 'auditName',
                        header: 'DENETİM / BİRİM',
                        sortable: true,
                        render: (plan: any) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="cell-title">{plan.auditName}</div>
                                <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter uppercase">{plan.auditId}</div>
                            </div>
                        )
                    },
                    {
                        key: 'title',
                        header: 'POPÜLASYON',
                        sortable: true,
                        render: (plan: any) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="text-xs font-bold text-slate-700">{plan.title}</div>
                                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">N = {plan.populationSize?.toLocaleString()}</div>
                            </div>
                        )
                    },
                    {
                        key: 'method',
                        header: 'YÖNTEM',
                        sortable: true,
                        width: '150px',
                        align: 'center',
                        render: (plan: any) => {
                            const methodStr = typeof plan.method === 'string' ? plan.method : (plan.method?.value || JSON.stringify(plan.method) || 'Rastgele');
                            const methodInfo = SAMPLING_METHODS.find(m => m.value === methodStr || methodStr.includes(m.value) || (m.value === 'Katmanlı' && methodStr.includes('Tabakalı')));
                            return (
                                <Tooltip content={methodInfo ? methodInfo.description : 'Yöntem bilgisi yok'}>
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200 text-[10px] font-black uppercase tracking-widest cursor-help">
                                        {methodStr}
                                    </span>
                                </Tooltip>
                            );
                        }
                    },
                    {
                        key: 'sampleSize',
                        header: 'ÖRNEKLEM',
                        sortable: true,
                        width: '120px',
                        align: 'center',
                        render: (plan: any) => (
                            <div className="flex flex-col items-center">
                                <div className="text-sm font-black text-primary font-mono tracking-tighter">{plan.sampleSize}</div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">%{plan.confidenceLevel} GÜVEN</div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        header: 'DURUM',
                        sortable: true,
                        width: '120px',
                        align: 'center',
                        type: 'status'
                    },
                    {
                        key: 'result',
                        header: 'SONUÇ',
                        sortable: true,
                        width: '120px',
                        align: 'center',
                        render: (plan: any) => (
                            plan.deviationsFound !== undefined ? (
                                <span className={clsx(
                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
                                    plan.deviationsFound === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {plan.deviationsFound} Sapma
                                </span>
                            ) : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">BEKLİYOR</span>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'İŞLEMLER',
                        width: '160px',
                        align: 'center',
                        render: (plan: any) => (
                            <ActionMenu
                                items={[
                                    { label: 'Detayı İncele', icon: Eye, onClick: () => setSelectedPlan(plan) }
                                ]}
                            />
                        )
                    }
                ]}
                data={filteredPlans}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={10}
                className="border-none"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilterMethod([]);
                    setFilterStatus([]);
                }}
            />

            {/* Silme Onay Modalı */}
            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Planı Sil"
                message="Bu örnekleme planını silmek istediğinizden emin misiniz?"
                confirmText="Evet, Sil"
                cancelText="İptal"
                type="danger"
            />

            {/* Hesaplayıcı Modalı - Merkezi Modal Bileşeni */}
            <Modal
                isOpen={showCalculator}
                onClose={() => setShowCalculator(false)}
                title="Örneklem Hesaplayıcı"
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Popülasyon Büyüklüğü (N)</label>
                        <input
                            type="number"
                            value={calcPopulation}
                            onChange={(e) => setCalcPopulation(parseInt(e.target.value) || 0)}
                            className="form-input w-full"
                        />
                    </div>
                    <div>
                        <CustomSelect
                            label="Güven Düzeyi"
                            value={String(calcConfidence)}
                            onChange={(val) => setCalcConfidence(parseInt(val as string) as 90 | 95 | 99)}
                            options={[
                                { value: '90', label: '%90' },
                                { value: '95', label: '%95' },
                                { value: '99', label: '%99' }
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hata Payı %</label>
                        <input
                            type="number"
                            value={calcTolerableError}
                            onChange={(e) => setCalcTolerableError(parseFloat(e.target.value) || 0)}
                            className="form-input w-full"
                            step="0.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Hata Oranı (%)</label>
                        <input
                            type="number"
                            value={calcExpectedError}
                            onChange={(e) => setCalcExpectedError(parseFloat(e.target.value) || 0)}
                            className="form-input w-full"
                            step="0.5"
                        />
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Hesaplanan Örneklem Büyüklüğü</div>
                        <div className="text-4xl font-bold text-primary">{calculateSampleSizeValue()}</div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="secondary" onClick={() => setShowCalculator(false)}>Kapat</Button>
                    </div>
                </div>
            </Modal>

            {/* Detay Modalı - Merkezi Modal Bileşeni */}
            <Modal
                isOpen={!!selectedPlan}
                onClose={() => setSelectedPlan(null)}
                title={selectedPlan?.auditName || 'Plan Detayı'}
                size="2xl"
                footer={
                    <div className="flex justify-end w-full gap-2">
                        <Button variant="outline" onClick={() => setSelectedPlan(null)}>İptal</Button>
                        {selectedPlan?.populationWorkpaperId && (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    auditApi.downloadWorkpaper(
                                        selectedPlan.populationWorkpaperId || '', 
                                        `Ham_Veri_${selectedPlan.title?.replace(/\s+/g, '_')}.xlsx`
                                    ).catch(err => {
                                        showToast('Ham veri indirilemedi: ' + err.message, 'error');
                                    });
                                }}
                            >
                                Ham Veriyi İndir
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                if (selectedPlan) {
                                    try {
                                        showToast('Excel hazırlanıyor...', 'info');
                                        let rawData = [];
                                        
                                        // Eğer bir çalışma kağıdı bağı varsa ve backend'de raw data saklanmışsa çekmeyi dene
                                        // (Bu aşamada demo için parse edilmiş JSON'ı populationData içinden veya workpaper'dan alabiliriz)
                                        // Gerçek senaryoda: await auditApi.getWorkpaperContent(selectedPlan.populationWorkpaperId)
                                        
                                        await generateEnhancedSamplingExcel(selectedPlan, []); // Raw data boş geçildi (Workpaper API entegrasyonu backend'de bekliyor)
                                        showToast('Excel raporu indirildi.', 'success');
                                    } catch (e) {
                                        console.error('Excel indirme hatası:', e);
                                        showToast('Excel oluşturulurken hata oluştu.', 'error');
                                    }
                                } else {
                                    showToast('İndirilecek örneklem verisi bulunamadı.', 'error');
                                }
                            }}
                        >
                            Excel İndir
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (selectedPlan) {
                                    generateSamplingReport(selectedPlan)
                                        .then(() => showToast('Rapor indirildi.', 'success'))
                                        .catch((err) => {
                                            console.error(err);
                                            showToast('Rapor oluşturulurken hata oluştu.', 'error');
                                        });
                                }
                            }}
                        >
                            PDF Raporunu İndir
                        </Button>
                    </div>
                }
            >
                {selectedPlan && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start -mt-4">
                            <p className="text-sm text-gray-500">{selectedPlan.title}</p>
                        </div>

                        {/* Seçilen Kalemlerin Görüntülenmesi (JSON'dan parse ederek) */}
                        {selectedPlan.selectedItems && (
                            <div className="mt-4 border rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                                    <h5 className="font-semibold text-gray-700">Seçilen Örneklem Kayıtları ({selectedPlan.sampleSize})</h5>
                                </div>
                                <div className="max-h-64 overflow-y-auto overflow-x-auto p-4 bg-white">
                                    {(() => {
                                        try {
                                            const items = JSON.parse(selectedPlan.selectedItems);
                                            if (Array.isArray(items) && items.length > 0) {
                                                // Take all object keys for headers instead of limiting to 5
                                                const sampleHeaders = Object.keys(items[0]);
                                                return (
                                                    <DataTable
                                                        columns={[
                                                            {
                                                                key: 'index',
                                                                header: '#',
                                                                width: '50px',
                                                                align: 'center',
                                                                render: (_: any, idx: number) => <span className="font-medium text-gray-500">{idx + 1}</span>
                                                            },
                                                            ...sampleHeaders.map((h: string) => ({
                                                                key: h,
                                                                header: h,
                                                                sortable: true,
                                                                render: (row: any) => row[h]?.toString().substring(0, 30) || '-'
                                                            }))
                                                        ]}
                                                        data={items.slice(0, 50)}
                                                        rowKey={(_: any) => Math.random().toString()}
                                                        className="border-b"
                                                        itemsPerPage={50}
                                                        paginated={false}
                                                    />
                                                );
                                            } else {
                                                return <p className="text-sm text-gray-500 italic">Kayıt biçimi görüntülenemiyor veya boş.</p>;
                                            }
                                        } catch (e) {
                                            return <p className="text-sm text-gray-500 italic">Detaylı veri bulunamadı.</p>;
                                        }
                                    })()}
                                    {selectedPlan.sampleSize > 50 && (
                                        <p className="text-xs text-center text-gray-400 mt-3 pt-3 border-t">İlk 50 kayıt önizlenmektedir. Tümü için Rapor İndir veya Excel İndir seçeneğini kullanın.</p>
                                    )}
                                </div>
                            </div>
                        )}                        {/* Örnekleme Parametreleri */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Popülasyon</div>
                                <div className="text-lg font-bold">{selectedPlan.populationSize.toLocaleString()}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Örneklem</div>
                                <div className="text-lg font-bold text-primary">{selectedPlan.sampleSize}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Yöntem</div>
                                <div className="text-lg font-bold">{selectedPlan.method}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Güven Düzeyi</div>
                                <div className="text-lg font-bold">{selectedPlan.confidenceLevel != null ? '%' + selectedPlan.confidenceLevel : '-'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Hata Payı</div>
                                <div className="text-lg font-bold">{selectedPlan.errorRate != null ? '%' + selectedPlan.errorRate : '-'}</div>
                            </div>
                        </div>

                        {/* Sistem Notları / Bilgilendirme */}
                        {selectedPlan.notes && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 shadow-sm">
                                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="text-sm font-bold text-blue-900">Metot ve Dağılım Notu</div>
                                    <div className="text-xs text-blue-800 leading-relaxed italic font-medium">
                                        {selectedPlan.notes}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sonuçlar */}
                        {selectedPlan.deviationsFound !== undefined && (
                            <div className="border rounded-lg p-4">
                                <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                                    <BarChart2 size={18} className="text-purple-500" />
                                    Test Sonuçları ve İstatistiksel Değerlendirme
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-gray-500">Bulunan Sapma</div>
                                        <div className="text-xl font-bold text-red-600">{selectedPlan.deviationsFound}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Gözlemlenen Sapma Oranı</div>
                                        <div className="text-xl font-bold text-gray-800">
                                            {selectedPlan.observedDeviationRate != null ? `%${selectedPlan.observedDeviationRate}` : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Üst Sapma Oranı</div>
                                        <div className={`text-xl font-bold ${selectedPlan.upperDeviationRate != null && selectedPlan.upperDeviationRate > (selectedPlan.errorRate || 5)
                                            ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            {selectedPlan.upperDeviationRate != null ? `%${selectedPlan.upperDeviationRate}` : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Kesinlik (Hassasiyet)</div>
                                        <div className="text-xl font-bold text-blue-600">
                                            {selectedPlan.precisionRate != null ? `%${selectedPlan.precisionRate}` : '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* İkinci satır: Güven Aralığı, Popülasyon Projeksiyonu, Yeterlilik, Kanaat */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <div className="text-xs text-gray-500">Güven Aralığı</div>
                                        <div className="text-sm font-bold text-gray-700">
                                            {selectedPlan.confidenceIntervalLower != null && selectedPlan.confidenceIntervalUpper != null
                                                ? `%${selectedPlan.confidenceIntervalLower} — %${selectedPlan.confidenceIntervalUpper}`
                                                : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Popülasyona Projekte Edilen Hata</div>
                                        <div className="text-xl font-bold text-orange-600">
                                            {selectedPlan.projectedPopulationErrors != null
                                                ? `~${Number(selectedPlan.projectedPopulationErrors || 0).toLocaleString('tr-TR')} kayıt`
                                                : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Örneklem Yeterliliği</div>
                                        <span className={`px-3 py-1 rounded text-sm font-bold ${selectedPlan.sampleAdequacy === 'Yeterli'
                                            ? 'bg-green-100 text-green-700'
                                            : selectedPlan.sampleAdequacy === 'Yetersiz'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {selectedPlan.sampleAdequacy || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Kanaat</div>
                                        <span className={`px-3 py-1 rounded text-sm font-bold ${selectedPlan.conclusions === 'Kabul'
                                            ? 'bg-green-100 text-green-700'
                                            : selectedPlan.conclusions === 'Red'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedPlan.conclusions || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Metot açıklaması */}
                                {selectedPlan.method && (
                                    <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800">
                                        <strong>Kullanılan Yöntem:</strong> {SAMPLING_METHODS.find(m => m.value === selectedPlan.method)?.label || selectedPlan.method}
                                        <br />
                                        <span className="opacity-80">{SAMPLING_METHODS.find(m => m.value === selectedPlan.method)?.description || ''}</span>
                                    </div>
                                )}

                                {/* IIA Std 2320: Sapma tespit edildi → Bulgu Oluştur */}
                                {selectedPlan.deviationsFound != null && selectedPlan.deviationsFound > 0 && (
                                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={18} className="text-rose-600" />
                                            <div>
                                                <p className="text-sm font-semibold text-rose-800">{selectedPlan.deviationsFound} sapma tespit edildi</p>
                                                <p className="text-xs text-rose-600">Bu örneklem sonucuna dayalı bir bulgu oluşturabilirsiniz.</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => {
                                                sessionStorage.setItem('newFindingFromSampling', JSON.stringify({
                                                    auditId: selectedPlan.auditId,
                                                    deviations: selectedPlan.deviationsFound,
                                                    title: selectedPlan.title
                                                }));
                                                setSelectedPlan(null);
                                                window.location.href = `/audit/findings`;
                                            }}
                                            leftIcon={<AlertCircle size={14} />}
                                            className="whitespace-nowrap"
                                        >
                                            Bulgu Oluştur →
                                        </Button>
                                    </div>
                                )}

                                {/* Test Sonuçları Girişi Formu */}
                                {(selectedPlan.status === 'Seçildi' || selectedPlan.status === 'Tamamlandı') && (
                                    <div className="space-y-4 pt-6 mt-6 border-t border-gray-200">
                                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <BarChart2 size={16} className="text-primary" />
                                            Test Bulguları ve Değerlendirme Girişi
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label text-xs">Bulunan Sapma Sayısı</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-input text-sm"
                                                    placeholder="Örn: 0"
                                                    value={selectedPlan.deviationsFound ?? ''}
                                                    onChange={(e) => setSelectedPlan({ ...selectedPlan, deviationsFound: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <CustomSelect
                                                    label="Nihai Kanaat"
                                                    value={selectedPlan.conclusions || ''}
                                                    onChange={(val) => setSelectedPlan({ ...selectedPlan, conclusions: val as string })}
                                                    options={[
                                                        { value: 'Kabul', label: 'UYGUN (Kabul)' },
                                                        { value: 'Red', label: 'UYGUN DEĞİL (Red)' },
                                                        { value: 'Şartlı Kabul', label: 'Şartlı Kabul' }
                                                    ]}
                                                    placeholder="Bir kanaat belirtin..."
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label text-xs">Test Değerlendirme Özeti ve Karar Gerekçesi</label>
                                            <textarea
                                                className="form-input min-h-[100px] text-sm resize-none"
                                                placeholder="İnceleme sonuçlarını ve sapmaların nedenlerini buraya yazınız..."
                                                value={selectedPlan.testResult || ''}
                                                onChange={(e) => setSelectedPlan({ ...selectedPlan, testResult: e.target.value })}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-end">
                                            <Button 
                                                variant="primary" 
                                                onClick={handleSaveTestResults} 
                                                leftIcon={<CheckCircle size={16} />}
                                            >
                                                Sonuçları Kaydet
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-xs text-gray-500 flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded text-gray-600">
                                <User size={13} className="text-gray-400" />
                                <span>Oluşturan: <span className="font-bold text-gray-900">{selectedPlan.creatorName || selectedPlan.creatorId || 'Sistem'}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded text-gray-600">
                                <Calendar size={13} className="text-gray-400" />
                                <span>Tarih: <span className="font-bold text-gray-900">{formatDateTime(selectedPlan.created_at)}</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Düzenleme / Yeni Kayıt Modalı */}
            {
                editingPlan && (
                    <Modal
                        isOpen={!!editingPlan}
                        onClose={() => setEditingPlan(null)}
                        title={editingPlan.id ? 'Plan Düzenle' : 'Yeni Örnekleme Planı'}
                        size="lg"
                        footer={
                            <div className="flex justify-end w-full gap-3">
                                <Button variant="secondary" onClick={() => setEditingPlan(null)}>İptal</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                >
                                    {editingPlan.id ? 'Güncelle' : 'Oluştur'}
                                </Button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <div className="form-group">
                                <CustomSelect
                                    label="Denetim Seçiniz *"
                                    value={editingPlan.auditId || ''}
                                    onChange={(val) => {
                                        const selectedAudit = audits.find(a => a.id === val);
                                        setEditingPlan({
                                            ...editingPlan,
                                            auditId: val as string,
                                            auditName: selectedAudit?.title || ''
                                        });
                                    }}
                                    options={audits.map(a => ({ value: a.id, label: a.title }))}
                                    placeholder="Bir denetim seçin..."
                                    error={!editingPlan.auditId}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Popülasyon Tanımı *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: 2023 Yılı Satınalma Faturaları"
                                    value={editingPlan.title || ''}
                                    onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Popülasyon Büyüklüğü (N)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={editingPlan.populationSize || ''}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, populationSize: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <CustomSelect
                                        label="Örnekleme Yöntemi"
                                        value={editingPlan.method}
                                        onChange={(val) => setEditingPlan({ ...editingPlan, method: val as any })}
                                        options={SAMPLING_METHODS}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="form-group">
                                    <CustomSelect
                                        label="Güven %"
                                        value={String(editingPlan.confidenceLevel)}
                                        onChange={(val) => setEditingPlan({ ...editingPlan, confidenceLevel: parseInt(val as string) })}
                                        options={[
                                            { value: '90', label: '%90' },
                                            { value: '95', label: '%95' },
                                            { value: '99', label: '%99' }
                                        ]}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hata Payı %</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-input text-sm"
                                        value={editingPlan.errorRate}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, errorRate: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-xs uppercase font-bold text-primary">Örneklem (n)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="form-input font-bold text-primary"
                                            value={editingPlan.sampleSize}
                                            onChange={(e) => setEditingPlan({ ...editingPlan, sampleSize: parseInt(e.target.value) || 0 })}
                                        />
                                        <button
                                            title="Küçük Hesapla"
                                            onClick={() => {
                                                // Trigger local calculation
                                                const zScores: Record<number, number> = { 90: 1.645, 95: 1.96, 99: 2.576 };
                                                const z = zScores[editingPlan.confidenceLevel] || 1.96;
                                                const p = 0.5; // Worst case
                                                const e = editingPlan.errorRate / 100;
                                                let n = Math.ceil((z * z * p * (1 - p)) / (e * e));
                                                if (editingPlan.populationSize > 0) {
                                                    n = Math.ceil(n / (1 + ((n - 1) / editingPlan.populationSize)));
                                                }
                                                setEditingPlan({ ...editingPlan, sampleSize: Math.max(n, 1) });
                                            }}
                                            className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
                                            type="button"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <CustomSelect
                                    label="Durum"
                                    value={editingPlan.status}
                                    onChange={(val) => setEditingPlan({ ...editingPlan, status: val as any })}
                                    options={[
                                        { value: 'Planlandı', label: 'Planlandı' },
                                        { value: 'Seçildi', label: 'Seçildi' },
                                        { value: 'Tamamlandı', label: 'Tamamlandı' }
                                    ]}
                                />
                            </div>
                        </div>
                    </Modal>
                )
            }

            {/* Yeni Gelişmiş Örneklem Modalı */}
            <AdvancedSamplingModal
                isOpen={showAdvancedModal}
                onClose={() => setShowAdvancedModal(false)}
                audits={audits}
                onGenerate={async (config, file) => {
                    try {
                        if (file) {
                            // Dosyalı gönderimde populationData'yı config'e KOYMA
                            // Backend dosyayı kendisi parse edecek (Field value too long çözümü)
                            const filePayload = {
                                auditId: config.auditId,
                                title: config.populationName + ' (Kural Bazlı Seçim)',
                                method: config.samplingMethod,
                                sampleSize: Number(config.sampleSize),
                                rules: config.rules,
                                confidenceLevel: config.confidenceLevel,
                                errorRate: config.errorRate,
                                stratifiedColumn: config.stratifiedColumn,
                            };
                            await auditApi.generateAdvancedSampleWithFile(filePayload, file);
                        } else {
                            // Dosyasız gönderimde populationData config içinde gider (eski davranış)
                            const payload = {
                                auditId: config.auditId,
                                title: config.populationName + ' (Kural Bazlı Seçim)',
                                method: config.samplingMethod,
                                sampleSize: Number(config.sampleSize),
                                rules: config.rules,
                                confidenceLevel: config.confidenceLevel,
                                errorRate: config.errorRate,
                                stratifiedColumn: config.stratifiedColumn,
                                populationData: config.populationData
                            };
                            await auditApi.generateAdvancedSample(payload);
                        }

                        showToast(`${config.sampleSize} adet örneklem kurallara uygun olarak arka planda havuzdan çekildi.`, 'success');
                        setShowAdvancedModal(false);
                        loadData();
                    } catch (e: any) {
                        showToast(e.message || 'Örneklem oluşturulamadı', 'error');
                    }
                }}
            />
        </div >
    );
}
