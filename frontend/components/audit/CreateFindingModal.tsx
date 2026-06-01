import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Paperclip, Plus, Trash2, Info, AlertCircle, CheckCircle2, MessageSquare, ClipboardCheck, FileText, Loader2, ChevronDown, HelpCircle, Link2, Lightbulb, Shield, Activity, CheckCircle, Check, RefreshCw } from 'lucide-react';
import ActionList from './ActionList';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import Switch from '@/components/ui/Switch';
import { auditApi, Audit, Finding, Process, Risk, Control, CreateFindingDto } from '@/lib/audit-api';
import { adminApi } from '@/lib/admin-api';
import AuditronSuggestionPanel from './AuditronSuggestionPanel';
import CustomSelect from '@/components/ui/CustomSelect';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';

interface CreateFindingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (finding?: any) => void;
    preSelectedAuditId?: string | number;
    editFindingId?: string | number;
    initialFinding?: any;
}

const RISK_CATEGORIES = [
    'Operasyonel', 'Finansal', 'Uyum', 'BT', 'İtibar', 'Suistimal', 'Mevzuat',
    'MASAK / Suç Gelirleri', 'KVKK / Kişisel Veri', 'BT Tebliği (BDDK)',
    'Sızma Testi', 'İş Sürekliliği', 'Diğer'
];

const CreateFindingModal: React.FC<CreateFindingModalProps> = ({ isOpen, onClose, onSuccess, preSelectedAuditId, editFindingId, initialFinding }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [audits, setAudits] = useState<Audit[]>([]);
    const [allFindings, setAllFindings] = useState<Finding[]>([]);
    const [similarFindings, setSimilarFindings] = useState<Finding[]>([]);
    const [inspectorFiles, setInspectorFiles] = useState<File[]>([]);
    const [unitFiles, setUnitFiles] = useState<File[]>([]);

    // RCM Entegrasyonu Eyaleti
    const [processes, setProcesses] = useState<Process[]>([]);
    const [risks, setRisks] = useState<Risk[]>([]);
    const [controls, setControls] = useState<Control[]>([]);
    const [inspectors, setInspectors] = useState<any[]>([]);

    const [form, setForm] = useState({
        auditId: '',
        findingCode: '',
        title: '',
        risk: 'Orta',
        categories: [] as string[],
        criteria: '',
        content: '',
        rootCause: '',
        effect: '',
        inspectorRecommendation: '',
        dueDate: '',
        isAgreed: null as boolean | null,
        disagreementReason: '',
        actionPlan: '',
        actions: [] as Array<{ id: string; action: string; dueDate: string; responsible: string }>,
        finalInspectorOpinion: '',
        // Professional Audit Features
        isRepeatFinding: false,
        relatedFindingId: '',
        tags: [] as string[],
        workingPaperRef: '',
        otherDescription: '', // For 'Diğer' category
        isAgreedPre: false, // Fast-Track Mutabakat
        resolvedDuringAudit: false, // Denetim Esnasında Giderildi
        // RCM Entegrasyonu Verisi
        processId: '',
        riskId: '',
        controlId: '',
        financialImpact: '',
        regulatoryRisk: false, // İdari yaptırım riski
        // Sorumlu Müfettiş Ataması
        assignedUserId: '',
        // Peer Review Integration
        reviewerId: '',
        auditTestId: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadAudits();
            loadAllFindings();
            loadInspectors();
            if (editFindingId && initialFinding) {
                setForm({
                    auditId: String(initialFinding.auditId),
                    findingCode: initialFinding.code || '',
                    title: initialFinding.title || '',
                    risk: initialFinding.riskLevel || 'Orta',
                    categories: initialFinding.category ? initialFinding.category.split(', ') : [],
                    criteria: initialFinding.criteria || '',
                    content: initialFinding.description || '',
                    rootCause: initialFinding.rootCause || '',
                    effect: initialFinding.effect || '',
                    inspectorRecommendation: initialFinding.recommendation || '',
                    dueDate: initialFinding.dueDate ? initialFinding.dueDate.split('T')[0] : '',
                    isAgreed: initialFinding.isAgreed,
                    disagreementReason: initialFinding.disagreementReason || '',
                    actionPlan: initialFinding.actionPlan || '',
                    actions: initialFinding.actions || [],
                    finalInspectorOpinion: initialFinding.finalInspectorOpinion || '',
                    // Professional Audit Features
                    isRepeatFinding: initialFinding.isRepeatFinding || false,
                    relatedFindingId: initialFinding.relatedFindingId || '',
                    tags: initialFinding.tags || [],
                    workingPaperRef: initialFinding.workingPaperRef || '',
                    otherDescription: initialFinding.otherDescription || '',
                    isAgreedPre: false, // Default false on edit unless we want to load it
                    // RCM Entegrasyonu Kontrolü
                    processId: initialFinding.processId || '',
                    riskId: initialFinding.riskId || '',
                    controlId: initialFinding.controlId || '',
                    financialImpact: initialFinding.financialImpact || '',
                    regulatoryRisk: initialFinding.regulatoryRisk || false,
                    // Sorumlu Müfettiş
                    assignedUserId: initialFinding.assignedUserId || '',
                    // Peer Review
                    reviewerId: initialFinding.reviewerId || '',
                    auditTestId: initialFinding.auditTestId || '',
                    resolvedDuringAudit: initialFinding.resolvedDuringAudit || false
                });
            } else if (preSelectedAuditId) {
                setForm(prev => ({ ...prev, auditId: String(preSelectedAuditId) }));
            }
        } else {
            setForm({
                auditId: '',
                findingCode: '',
                title: '',
                risk: 'Orta',
                categories: [],
                criteria: '',
                content: '',
                rootCause: '',
                effect: '',
                inspectorRecommendation: '',
                dueDate: '',
                isAgreed: null,
                disagreementReason: '',
                actionPlan: '',
                actions: [],
                finalInspectorOpinion: '',
                // Professional Audit Features
                isRepeatFinding: false,
                relatedFindingId: '',
                tags: [],
                workingPaperRef: '',
                otherDescription: '',
                isAgreedPre: false,
                resolvedDuringAudit: false,
                // RCM Integration
                processId: '',
                riskId: '',
                controlId: '',
                financialImpact: '',
                regulatoryRisk: false,
                // Sorumlu Müfettiş
                assignedUserId: '',
                // Peer Review
                reviewerId: '',
                auditTestId: ''
            });
            setInspectorFiles([]);
            setUnitFiles([]);
        }
    }, [isOpen, preSelectedAuditId, editFindingId, initialFinding]);

    useEffect(() => {
        const generateCode = async () => {
            if (form.auditId && audits.length > 0) {
                const selectedAudit = audits.find(a => String(a.id) === String(form.auditId));

                // Only generate if we don't have a code or if it's a new finding (not editing an existing one with a code)
                // If editing, we generally keep the code, unless user cleared it.
                if (selectedAudit && (!form.findingCode || !editFindingId)) {
                    try {
                        // 1. Get Unit Code
                        let unitCode = 'GEN'; // Default
                        if (selectedAudit.unit) {
                            // Try to get a code from unit name (e.g., "Operasyon" -> "OPR", "Bilgi Teknolojileri" -> "BT")
                            const name = selectedAudit.unit.name || '';
                            if (name.length >= 3) {
                                unitCode = name.substring(0, 3).toUpperCase();
                                // Custom mappings could go here (e.g. if name is "İnsan Kaynakları" -> "IK")
                                const customMap: Record<string, string> = {
                                    'İnsan Kaynakları': 'IK',
                                    'Bilgi Teknolojileri': 'BT',
                                    'İç Denetim': 'ID',
                                    'Risk Yönetimi': 'RY'
                                };
                                if (customMap[name]) unitCode = customMap[name];
                            }
                        }

                        // 2. Get Year
                        const year = new Date().getFullYear();

                        // 3. Get Sequence
                        // Use the already-loaded allFindings state, which has proper Finding[] type
                        const relevantFindings = allFindings.filter((f: Finding) =>
                            String(f.auditId) === String(form.auditId) &&
                            f.code.startsWith(`${unitCode}-${year}`)
                        );

                        // Parse existing codes to find max sequence
                        let maxSeq = 0;
                        relevantFindings.forEach((f: Finding) => {
                            const parts = f.code.split('-');
                            if (parts.length === 3) {
                                const seq = parseInt(parts[2]);
                                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                            }
                        });

                        const nextSeq = (maxSeq + 1).toString().padStart(3, '0');

                        setForm(prev => ({
                            ...prev,
                            findingCode: `${unitCode}-${year}-${nextSeq}`
                        }));

                    } catch (error) {
                        console.error('Error generating finding code:', error);
                        // Fallback
                        setForm(prev => ({
                            ...prev,
                            findingCode: `BLG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`
                        }));
                    }
                }
            }
        };

        generateCode();
    }, [form.auditId, audits]);

    const loadAudits = async () => {
        try {
            const data = await auditApi.getAudits();
            setAudits(data);
        } catch (error) {
            console.error('Failed to load audits', error);
        }
    };

    const loadAllFindings = async () => {
        try {
            const data = await auditApi.getFindings();
            setAllFindings(data);
        } catch (error) {
            console.error('Failed to load findings', error);
        }
    };

    const loadInspectors = async () => {
        try {
            const users = await adminApi.getUsers();
            // Filter users who might act as reviewers. Usually inspectors/auditors.
            // Using a loose filter here so it's robust. If they have 'Müfettiş' in title or role.
            const reviewers = users.filter((u: any) =>
                (u.roles && u.roles.some((r: any) => r.name?.toLowerCase().includes('müfettiş'))) ||
                (u.title && u.title?.toLowerCase().includes('müfettiş'))
            );
            // Fallback to all users if nothing matches (for testing)
            setInspectors(reviewers.length > 0 ? reviewers : users);
        } catch (error) {
            console.error('Failed to load users for inspector list', error);
        }
    };

    // Denetim değiştiğinde RCM verilerini yükle
    useEffect(() => {
        const loadRcmData = async () => {
            if (!form.auditId) {
                setProcesses([]);
                setRisks([]);
                setControls([]);
                return;
            }

            const selectedAudit = audits.find(a => String(a.id) === String(form.auditId));
            if (!selectedAudit?.unitId) {
                setProcesses([]);
                return;
            }

            try {
                const procs = await auditApi.getProcesses(selectedAudit.unitId);
                setProcesses(procs);
            } catch (e) {
                console.error('Failed to load processes', e);
            }
        };

        loadRcmData();
    }, [form.auditId, audits]);

    // Load risks when process changes
    useEffect(() => {
        const loadRisks = async () => {
            if (!form.processId) {
                setRisks([]);
                setControls([]);
                return;
            }
            try {
                const riskData = await auditApi.getRisks(form.processId);
                setRisks(riskData);
            } catch (e) {
                console.error('Failed to load risks', e);
            }
        };
        loadRisks();
    }, [form.processId]);

    // Load controls when risk changes
    useEffect(() => {
        const loadControls = async () => {
            if (!form.riskId) {
                setControls([]);
                return;
            }
            try {
                const controlData = await auditApi.getControls(form.riskId);
                setControls(controlData);
            } catch (e) {
                console.error('Failed to load controls', e);
            }
        };
        loadControls();
    }, [form.riskId]);

    // Smart Similarity Detection (Auditron AI) checks if title/category matches past findings
    useEffect(() => {
        if (!form.title && form.categories.length === 0) {
            setSimilarFindings([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            try {
                // Eğer başlık en az 5 karakterse veya en az 1 kategori seçildiyse AI kontrolü yap
                if (form.title.length > 4 || form.categories.length > 0) {
                    const selectedAudit = audits.find(a => String(a.id) === String(form.auditId));
                    const unitId = selectedAudit?.unitId;

                    const response = await auditApi.checkRecurringFindings({
                        unitId: unitId,
                        category: form.categories.length > 0 ? form.categories[0] : undefined,
                        title: form.title
                    });

                    if (response.recurring && response.findings) {
                        let matches = response.findings;
                        // Mevcut düzenlenmekte olan bulguyu atla (eğer varsa)
                        if (editFindingId) {
                            matches = matches.filter((f: any) => String(f.id) !== String(editFindingId));
                        }
                        setSimilarFindings(matches.slice(0, 3));
                    } else {
                        setSimilarFindings([]);
                    }
                }
            } catch (err) {
                console.error("Auditron AI recurring check failed:", err);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(searchTimeout);
    }, [form.title, form.categories, form.auditId, audits, editFindingId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'inspector' | 'unit') => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (target === 'inspector') {
                setInspectorFiles(prev => [...prev, ...newFiles]);
            } else if (target === 'unit') {
                setUnitFiles(prev => [...prev, ...newFiles]);
            }
        }
    };

    const removeFile = (idx: number, target: 'inspector' | 'unit') => {
        if (target === 'inspector') {
            setInspectorFiles(prev => prev.filter((_: File, i: number) => i !== idx));
        } else if (target === 'unit') {
            setUnitFiles(prev => prev.filter((_: File, i: number) => i !== idx));
        }
    };

    const addAction = () => {
        setForm(prev => ({
            ...prev,
            actions: [...prev.actions, { id: Date.now().toString(), action: '', dueDate: '', responsible: '' }]
        }));
    };

    const removeAction = (id: string) => {
        setForm(prev => ({
            ...prev,
            actions: prev.actions.filter(a => a.id !== id)
        }));
    };

    const updateAction = (id: string, field: string, value: string) => {
        setForm(prev => ({
            ...prev,
            actions: prev.actions.map(a => a.id === id ? { ...a, [field]: value } : a)
        }));
    };

    const handleCategoryToggle = (cat: string) => {
        setForm(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }));
    };

    const handleSuggestFinancialImpact = () => {
        if (!form.content) {
            showToast('Lütfen önce bulgu içeriğini doldurun.', 'error');
            return;
        }

        // Metin içindeki sayısal değerleri regex ile ararız (AI değildir)
        const numbers = form.content.match(/[\d.,]+/g);
        if (numbers && numbers.length > 0) {
            const parsed = numbers.map(n => parseFloat(n.replace(/\./g, '').replace(',', '.'))).filter(n => !isNaN(n) && n > 1000);
            if (parsed.length > 0) {
                const maxNum = Math.max(...parsed);
                setForm(prev => ({ ...prev, financialImpact: String(Math.round(maxNum)) }));
                showToast('Metin içindeki sayısal verilerden tahmini bir tutar önerildi. Lütfen doğrulayın.', 'info');
            } else {
                showToast('Metin içinde 1.000 TL üzerinde bir tutar bulunamadı. Lütfen manuel girin.', 'warning');
            }
        } else {
            showToast('Metin içinde sayısal veri bulunamadı. Lütfen parasal etkiyi manuel girin.', 'warning');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!form.auditId) {
                showToast('Lütfen denetim seçin.', 'error');
                setLoading(false);
                return;
            }

            const payload: CreateFindingDto = {
                auditId: String(form.auditId),
                title: form.title,
                risk: form.risk,
                description: form.content,
                criteria: form.criteria || undefined,
                rootCause: form.rootCause === 'Diğer' ? `Diğer: ${form.otherDescription}` : (form.rootCause || undefined),
                effect: form.effect || undefined, // undefined instead of null
                recommendation: form.inspectorRecommendation || undefined,
                dueDate: form.dueDate || undefined,
                category: form.categories.join(', '),
                status: form.resolvedDuringAudit ? 'Denetim Esnasında Giderildi' : (form.isAgreedPre ? 'Mutabakat Bekliyor' : 'Taslak'),
                isAgreed: form.isAgreedPre ? true : (form.isAgreed || undefined), // boolean | undefined
                disagreementReason: form.isAgreed === false ? form.disagreementReason : undefined,
                actionPlan: form.actionPlan || undefined,
                finalInspectorOpinion: form.finalInspectorOpinion || undefined,
                // Professional Audit Features
                isRepeatFinding: form.isRepeatFinding || false,
                relatedFindingId: form.relatedFindingId || undefined,
                tags: form.tags.length > 0 ? form.tags : undefined,
                workingPaperRef: form.workingPaperRef || undefined,
                // Auditron AI Recurring Data
                isRecurring: form.isRepeatFinding || false,
                recurringFindingId: form.relatedFindingId || undefined,
                // RCM Integration
                processId: form.processId || undefined,
                riskId: form.riskId || undefined,
                controlId: form.controlId || undefined,
                financialImpact: form.financialImpact ? parseFloat(form.financialImpact) : undefined,
                // References
                auditTestId: form.auditTestId || undefined,
                workpaperId: form.workingPaperRef || undefined,
                actions: form.actions && form.actions.length > 0 ? form.actions : undefined,
                // Sorumlu Müfettiş Ataması
                assignedUserId: form.assignedUserId || undefined,
                // İdari Yaptırım Riski
                regulatoryRisk: form.regulatoryRisk || false,
                // Peer Review
                reviewerId: form.reviewerId || undefined
            };

            let response;
            if (editFindingId) {
                response = await auditApi.updateFinding(String(editFindingId), payload);
            } else {
                response = await auditApi.createFinding(payload);
            }

            const findingId = editFindingId ? String(editFindingId) : String(response.id);

            // Upload Inspector Files
            if (inspectorFiles.length > 0) {
                for (const file of inspectorFiles) {
                    await auditApi.uploadFindingEvidence(findingId, file);
                }
            }

            // Upload Unit Files
            if (unitFiles.length > 0) {
                for (const file of unitFiles) {
                    await auditApi.uploadFindingEvidence(findingId, file);
                }
            }

            showToast(`Bulgu başarıyla ${editFindingId ? 'güncellendi' : 'oluşturuldu'}`, 'success');

            if (onSuccess) onSuccess(response);
            onClose();
        } catch (err: any) {
            console.error('Bulgu oluşturma hatası:', err);
            showToast(err.message || 'Bulgu oluşturulurken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // User requested risk colors: Low=Yellow, Medium=Orange, High=Red, Critical=Maroon
    const getRiskSelectClass = (risk: string) => {
        switch (risk) {
            case 'Düşük': return 'text-yellow-600 font-bold';
            case 'Orta': return 'text-orange-600 font-bold';
            case 'Yüksek': return 'text-red-600 font-bold';
            case 'Kritik': return 'text-red-900 font-bold';
            default: return 'text-gray-700';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editFindingId ? 'Bulguyu Düzenle' : 'Yeni Bulgu Oluştur'}
            size="2xl"
            footer={
                <div className="flex justify-end w-full gap-3">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onClose}
                        className="min-w-[120px]"
                        disabled={loading}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="createFindingForm"
                        className="min-w-[160px] shadow-lg shadow-primary/20"
                        disabled={loading}
                        isLoading={loading}
                    >
                        {loading ? 'Kaydediliyor...' : (form.isAgreedPre ? 'Onaya Gönder (Fast-Track)' : (editFindingId ? 'Değişiklikleri Kaydet' : 'Bulguyu Kaydet'))}
                    </Button>
                </div>
            }
        >
            <form id="createFindingForm" onSubmit={handleSubmit} className="space-y-6">
                {/* Smart Similarity Detection (Auditron AI) Banner */}
                {similarFindings.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-indigo-600 rounded-xl shrink-0 shadow-md shadow-indigo-200 flex items-center justify-center">
                                <Activity size={22} className="text-white animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-indigo-900 text-[13px] mb-1 flex items-center gap-2">
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Auditron AI</span>
                                    Tekrarlayan Bulgu Tespiti
                                </h4>
                                <p className="text-[12px] text-indigo-800/80 mb-3 font-medium">Girdiğiniz bilgilere göre geçmiş dönemlere ait benzer konular saptadık. Bu bulgunun tekerrür eden bir bulgu olarak işaretlenmesini öneririz.</p>
                                <div className="space-y-2">
                                    {similarFindings.map(sf => (
                                        <div key={sf.id} className="flex items-center justify-between bg-white/90 border border-indigo-100 rounded-xl px-3 py-2 gap-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Link2 size={14} className="text-indigo-400 shrink-0" />
                                                <span className="text-[11px] font-bold text-indigo-700 shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded">[{sf.code}]</span>
                                                <span className="text-xs text-gray-700 truncate font-medium">{sf.title}</span>
                                            </div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setForm({ ...form, relatedFindingId: String(sf.id), isRepeatFinding: true })}
                                                className="text-[10px] h-7 px-3 rounded-lg transition-all shrink-0 uppercase tracking-wide gap-1.5"
                                            >
                                                Tekerrür Ekle
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                title="Kapat"
                                onClick={() => setSimilarFindings([])}
                                className="bg-indigo-100 hover:bg-indigo-200 p-1.5 rounded-full text-indigo-600 transition-colors"
                                type="button"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Section 1: Genel Bilgiler */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-2 border-b pb-4 mb-2">
                        <Info size={18} className="text-gray-600" />
                        <h3 className="font-bold text-gray-700">Genel Bilgiler</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <CustomSelect
                                label="İlgili Denetim *"
                                value={form.auditId}
                                onChange={(val) => setForm({ ...form, auditId: val as string })}
                                options={[
                                    { value: "", label: "Denetim Seçin" },
                                    ...audits.map(a => ({ value: String(a.id), label: `${a.code ? `[${a.code}] ` : ''}${a.title}` }))
                                ]}
                                disabled={!!preSelectedAuditId}
                                showSearch
                                labelClassName="form-label"
                            />
                        </div>
                        <div>
                            <label className="form-label">Bulgu Numarası</label>
                            <input
                                type="text"
                                className="w-full border-gray-200 rounded-xl p-3 bg-gray-100/50 text-sm font-bold text-gray-700"
                                value={form.findingCode}
                                onChange={e => setForm({ ...form, findingCode: e.target.value })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Risk Seviyesi"
                                value={form.risk}
                                onChange={(val) => setForm({ ...form, risk: val as string })}
                                options={[
                                    { value: "Kritik", label: "Kritik" },
                                    { value: "Yüksek", label: "Yüksek" },
                                    { value: "Orta", label: "Orta" },
                                    { value: "Düşük", label: "Düşük" }
                                ]}
                                labelClassName="form-label"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2 h-full flex flex-col">
                            <label className="form-label">Bulgu Başlığı *</label>
                            <textarea
                                className="form-input min-h-[110px] h-full resize-none"
                                placeholder="Bulgunun özeti (Örn: Yetkisiz Erişim Tespiti)"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="relative group space-y-2 h-full flex flex-col">
                            <label className="form-label">Kategoriler</label>
                            <div className="flex flex-col gap-2 h-full">
                                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-300 rounded-xl min-h-[110px] h-full content-start">
                                    {RISK_CATEGORIES.map(cat => (
                                        <Button
                                            key={cat}
                                            type="button"
                                            onClick={() => handleCategoryToggle(cat)}
                                            variant={form.categories.includes(cat) ? "primary" : "secondary"}
                                            className={`h-7 text-[10px] px-2 py-1 rounded-lg font-bold transition-all border ${!form.categories.includes(cat) && 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {cat}
                                        </Button>
                                    ))}
                                </div>
                                {form.categories.includes('Diğer') && (
                                    <input
                                        type="text"
                                        className="form-input text-xs animate-in fade-in slide-in-from-top-1"
                                        placeholder="Diğer risk kategorisini belirtiniz..."
                                        value={form.otherDescription}
                                        onChange={e => setForm({ ...form, otherDescription: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col justify-end gap-3 h-full">
                            <CustomSelect
                                label="Sorumlu Müfettiş (Aksiyon Takibi)"
                                value={form.assignedUserId}
                                onChange={(val) => setForm({ ...form, assignedUserId: val as string })}
                                options={[
                                    { value: "", label: "Atanmadı" },
                                    ...inspectors.map(req => ({ value: String(req.id), label: req.displayName || req.username }))
                                ]}
                                showSearch
                                labelClassName="form-label text-slate-800"
                                placeholder="Sorumlu seçiniz..."
                            />
                            <CustomSelect
                                label="Çapraz İncelemeci (Opsiyonel)"
                                value={form.reviewerId}
                                onChange={(val) => setForm({ ...form, reviewerId: val as string })}
                                options={[
                                    { value: "", label: "İncelemeci Atanmasın" },
                                    ...inspectors.map(req => ({ value: String(req.id), label: req.displayName || req.username }))
                                ]}
                                showSearch
                                labelClassName="form-label text-primary"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    {/* Professional Audit Features Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                         {/* İdari Yaptırım Riski Toggle */}
                        <div>
                            <label className="form-label">Regülatif Risk</label>
                            <div
                                onClick={() => setForm(prev => ({ ...prev, regulatoryRisk: !prev.regulatoryRisk }))}
                                className={`
                                            cursor-pointer w-full flex items-center gap-3 p-2 rounded-xl border transition-all select-none group min-h-[46px]
                                            ${form.regulatoryRisk
                                        ? 'bg-red-50/80 border-red-200 shadow-sm'
                                        : 'bg-white border-gray-300 hover:border-red-200 hover:bg-red-50/30'
                                    }
                                        `}
                            >
                                <div className={`
                                            w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0
                                            ${form.regulatoryRisk ? 'bg-red-100 text-red-600 shadow-sm border border-red-200' : 'bg-gray-100 text-gray-500 group-hover:text-red-500 group-hover:bg-red-50'}
                                        `}>
                                    <AlertCircle size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold transition-colors truncate ${form.regulatoryRisk ? 'text-red-700' : 'text-gray-800'}`}>
                                        İdari Yaptırım Riski
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-tight mt-0.5 font-medium">
                                        BDDK / MASAK Ceza
                                    </p>
                                </div>
                                <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                                            ${form.regulatoryRisk ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-transparent'}
                                        `}>
                                    <Check size={12} className={`text-white transition-transform ${form.regulatoryRisk ? 'scale-100' : 'scale-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Pre-Agreed Fast Track Toggle */}
                        <div>
                            <label className="form-label">Mutabakat Durumu</label>
                            <div
                                onClick={() => setForm(prev => ({ ...prev, isAgreedPre: !prev.isAgreedPre }))}
                                className={`
                                            cursor-pointer w-full flex items-center gap-3 p-2 rounded-xl border transition-all select-none group min-h-[46px]
                                            ${form.isAgreedPre
                                        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                        : 'bg-white border-gray-300 hover:border-blue-200 hover:bg-blue-50/30'
                                    }
                                        `}
                            >
                                <div className={`
                                            w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0
                                            ${form.isAgreedPre ? 'bg-blue-100 text-blue-600 shadow-sm border border-blue-200' : 'bg-gray-100 text-gray-500 group-hover:text-blue-500 group-hover:bg-blue-50'}
                                        `}>
                                    <ClipboardCheck size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold transition-colors truncate ${form.isAgreedPre ? 'text-blue-700' : 'text-gray-800'}`}>
                                        Önceden Mutabık Kalındı
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-tight mt-0.5 font-medium">
                                        (Fast-Track Kapanış)
                                    </p>
                                </div>
                                <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                                            ${form.isAgreedPre ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-transparent'}
                                        `}>
                                    <Check size={12} className={`text-white transition-transform ${form.isAgreedPre ? 'scale-100' : 'scale-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Denetim Esnasında Giderildi Toggle */}
                        <div>
                            <label className="form-label">Saha Düzeltme</label>
                            <div
                                onClick={() => setForm(prev => ({ ...prev, resolvedDuringAudit: !prev.resolvedDuringAudit, ...(prev.resolvedDuringAudit ? {} : { isAgreedPre: false }) }))}
                                className={`
                                            cursor-pointer w-full flex items-center gap-3 p-2 rounded-xl border transition-all select-none group min-h-[46px]
                                            ${form.resolvedDuringAudit
                                        ? 'bg-teal-50/80 border-teal-200 shadow-sm'
                                        : 'bg-white border-gray-300 hover:border-teal-200 hover:bg-teal-50/30'
                                    }
                                        `}
                            >
                                <div className={`
                                            w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0
                                            ${form.resolvedDuringAudit ? 'bg-teal-100 text-teal-600 shadow-sm border border-teal-200' : 'bg-gray-100 text-gray-500 group-hover:text-teal-500 group-hover:bg-teal-50'}
                                        `}>
                                    <CheckCircle2 size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold transition-colors truncate ${form.resolvedDuringAudit ? 'text-teal-700' : 'text-gray-800'}`}>
                                        Denetim Esnasında Giderildi
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-tight mt-0.5 font-medium">
                                        Tebliğ ger. (kayıt amaçlı)
                                    </p>
                                </div>
                                <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                                            ${form.resolvedDuringAudit ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-transparent'}
                                        `}>
                                    <Check size={12} className={`text-white transition-transform ${form.resolvedDuringAudit ? 'scale-100' : 'scale-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Repeat Finding Card Toggle */}
                        <div>
                            <label className="form-label">Tekerrür Durumu</label>
                            <div
                                onClick={() => setForm(prev => ({ ...prev, isRepeatFinding: !prev.isRepeatFinding }))}
                                className={`
                                            cursor-pointer w-full flex items-center gap-3 p-2 rounded-xl border transition-all select-none group min-h-[46px]
                                            ${form.isRepeatFinding
                                        ? 'bg-primary/5 border-primary shadow-sm'
                                        : 'bg-white border-gray-300 hover:border-primary/30 hover:bg-gray-50'
                                    }
                                        `}
                            >
                                <div className={`
                                            w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0
                                            ${form.isRepeatFinding ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:text-primary group-hover:bg-primary/10'}
                                        `}>
                                    <RefreshCw size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold transition-colors truncate ${form.isRepeatFinding ? 'text-primary' : 'text-gray-800'}`}>
                                        Tekerrür Eden Bulgu
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-tight mt-0.5 font-medium">
                                        Geçmiş denetimlerde tespit edilmiş mi?
                                    </p>
                                </div>
                                <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                                            ${form.isRepeatFinding ? 'bg-primary border-primary' : 'border-gray-300 bg-transparent'}
                                        `}>
                                    <Check size={12} className={`text-white transition-transform ${form.isRepeatFinding ? 'scale-100' : 'scale-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Related Finding Dropdown */}
                        <div>
                            <CustomSelect
                                label="İlişkili Geçmiş Bulgu"
                                value={form.relatedFindingId}
                                onChange={(val) => {
                                    const newVal = val as string;
                                    setForm({
                                        ...form,
                                        relatedFindingId: newVal,
                                        isRepeatFinding: newVal ? true : false
                                    });
                                }}
                                options={[
                                    { value: "", label: "Seçiniz (Opsiyonel)" },
                                    ...allFindings.filter(f => !editFindingId || String(f.id) !== String(editFindingId)).map(f => ({
                                        value: String(f.id),
                                        label: `[${f.code}] ${f.title}`
                                    }))
                                ]}
                                showSearch
                                labelClassName="form-label"
                            />
                        </div>

                        {/* Working Paper Reference */}
                        <div>
                            <CustomSelect
                                label="Çalışma Kağıdı Ref."
                                value={form.workingPaperRef}
                                onChange={(val) => setForm({ ...form, workingPaperRef: val as string })}
                                options={[
                                    { value: "", label: "Seçiniz (Opsiyonel)" },
                                    ...(audits.find(a => String(a.id) === String(form.auditId))?.workpapers
                                        ? (typeof audits.find(a => String(a.id) === String(form.auditId))?.workpapers === 'string'
                                            ? JSON.parse(audits.find(a => String(a.id) === String(form.auditId))!.workpapers as unknown as string)
                                            : audits.find(a => String(a.id) === String(form.auditId))?.workpapers) || []
                                        : []).map((wp: any) => ({
                                            value: wp.id,
                                            label: wp.name
                                        }))
                                ]}
                                showSearch
                                labelClassName="form-label"
                            />
                        </div>

                        {/* Tags Input */}
                        <div>
                            <label className="form-label">Etiketler</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter ile ekle: zimmet, yetki..."
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        const value = input.value.trim();
                                        if (value && !form.tags.includes(value)) {
                                            setForm({ ...form, tags: [...form.tags, value] });
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            {form.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {form.tags.map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                                            {tag}
                                            <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setForm({ ...form, tags: form.tags.filter((_, i) => i !== idx) })} />
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RCM Integration Section */}
                    {processes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                            <div>
                                <CustomSelect
                                    label="İlişkili Süreç"
                                    value={form.processId}
                                    onChange={(val) => setForm({ ...form, processId: val as string, riskId: '', controlId: '' })}
                                    options={[
                                        { value: "", label: "Süreç Seçiniz (Opsiyonel)" },
                                        ...processes.map(p => ({ value: p.id, label: p.name }))
                                    ]}
                                    showSearch
                                    labelClassName="form-label"
                                />
                            </div>

                            <div>
                                <CustomSelect
                                    label="İlişkili Risk"
                                    value={form.riskId}
                                    onChange={(val) => setForm({ ...form, riskId: val as string, controlId: '' })}
                                    options={[
                                        { value: "", label: "Risk Seçiniz" },
                                        ...risks.map(r => ({ value: r.id, label: `${r.code ? `[${r.code}] ` : ''}${r.name} (${r.level})` }))
                                    ]}
                                    disabled={!form.processId}
                                    showSearch
                                    labelClassName="form-label"
                                />
                            </div>

                            <div>
                                <CustomSelect
                                    label="İlişkili Kontrol"
                                    value={form.controlId}
                                    onChange={(val) => setForm({ ...form, controlId: val as string })}
                                    options={[
                                        { value: "", label: "Kontrol Seçiniz" },
                                        ...controls.map(c => ({ value: c.id, label: `${c.code ? `[${c.code}] ` : ''}${c.name}` }))
                                    ]}
                                    disabled={!form.riskId}
                                    showSearch
                                    labelClassName="form-label"
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Section 2: Bulgu Detayları */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center gap-2 border-b pb-4 mb-2">
                        <AlertCircle size={18} className="text-gray-600" />
                        <h3 className="font-bold text-gray-700">Bulgu Detayları</h3>
                    </div>
                    <div className="space-y-4">
                        {/* AI Suggestion Panel */}
                        <AuditronSuggestionPanel
                            findingData={form}
                            onApplySuggestion={(field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))}
                            className="mb-4 shadow-sm"
                        />
                        <div>
                            <label className="form-label">Kriter - Dayanak</label>
                            <textarea
                                className="form-input bg-gray-50/50 resize-none"
                                rows={2}
                                placeholder="İlgili mevzuat, yönetmelik veya prosedür maddeleri..."
                                value={form.criteria}
                                onChange={e => setForm({ ...form, criteria: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label className="form-label">Bulgu İçeriği *</label>
                            <textarea
                                className="w-full border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px]"
                                rows={4}
                                placeholder="Mevcut durumun detaylı açıklaması, incelenen örneklemler, göze çarpan eksikliklerin somut verileri (5N1K)..."
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div>
                            <CustomSelect
                                label="Kök Neden (COSO Standartları)"
                                value={form.rootCause || ""}
                                onChange={(val) => setForm({ ...form, rootCause: val as string })}
                                options={[
                                    { value: "", label: "Kök Neden Seçiniz..." },
                                    { value: "Personel Eksikliği / Yetersizliği", label: "Personel Eksikliği / Yetersizliği" },
                                    { value: "Süreç / Prosedür Uyumsuzluğu", label: "Süreç / Prosedür Uyumsuzluğu" },
                                    { value: "Sistem / Altyapı Yetersizliği", label: "Sistem / Altyapı Yetersizliği" },
                                    { value: "Kontrol Ortamının Zafiyeti", label: "Kontrol Ortamının Zafiyeti" },
                                    { value: "Mevzuat Uyumsuzluğu", label: "Mevzuat Uyumsuzluğu" },
                                    { value: "Eğitim / Farkındalık Eksikliği", label: "Eğitim / Farkındalık Eksikliği" },
                                    { value: "Diğer", label: "Diğer" }
                                ]}
                                labelClassName="form-label"
                            />
                        </div>
                        {form.rootCause === 'Diğer' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="form-label">Diğer Kök Neden Açıklaması *</label>
                                <textarea
                                    className="form-input resize-none"
                                    rows={2}
                                    placeholder="Lütfen kök nedeni açıklayın..."
                                    value={form.otherDescription}
                                    onChange={e => setForm({ ...form, otherDescription: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                        )}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="form-label text-red-700 !mb-0">Tahmini Finansal Etki (TL)</label>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleSuggestFinancialImpact}
                                    className="h-6 text-[10px] px-2 py-0 font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-100"
                                    leftIcon={<Lightbulb size={12} />}
                                >
                                    AI ile Öner
                                </Button>
                            </div>
                            <input
                                type="number"
                                className="w-full border-red-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-red-50/50 placeholder:text-red-300 font-bold text-red-700"
                                placeholder="Varsa tahmini finansal kayıp tutarı..."
                                value={form.financialImpact}
                                onChange={e => setForm({ ...form, financialImpact: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Etki (Sonuç)</label>
                            <textarea
                                className="form-input bg-gray-50/50"
                                rows={2}
                                placeholder="Bu durumun yaratacağı potansiyel veya gerçekleşen etki (Maddi kayıp, itibar kaybı vb.)"
                                value={form.effect || ''}
                                onChange={e => setForm({ ...form, effect: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label className="form-label">Müfettiş Önerisi</label>
                            <textarea
                                className="form-input bg-gray-50/50"
                                rows={2}
                                placeholder="Önerilen aksiyonlar..."
                                value={form.inspectorRecommendation}
                                onChange={e => setForm({ ...form, inspectorRecommendation: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                </section>

                {/* Section 2.5: Fast-Track Mutabakat Detayları (Sadece 'Önceden Mutabık Kalındı' seçiliyse) */}
                {form.isAgreedPre && (
                    <section className="bg-blue-50/30 p-6 rounded-2xl shadow-sm border border-blue-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 border-b border-blue-100 pb-4 mb-2">
                            <ClipboardCheck size={18} className="text-blue-600" />
                            <h3 className="font-bold text-blue-800">Tek Tuşla Onay (Fast-Track)</h3>
                            <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">Senaryo 2</span>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <div className="bg-white border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                                    <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        Bulguyu kaydettiğinizde durumu otomatik olarak <strong className="font-bold">"Mutabakat Bekliyor"</strong> olacak ve ilgili birim yöneticisine sistemden onay e-postası (Magic Link) iletilecektir. Birim onayı tek tuşla verdiğinde bulgu <strong className="font-bold">"Aksiyon Bekliyor"</strong> durumuna geçerek mutabakat tamamlanacaktır.
                                    </p>
                                </div>
                                <div>
                                    <label className="form-label text-blue-800">Birim Cevabı / Alınan Aksiyon Özeti *</label>
                                    <textarea
                                        className="w-full border-blue-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px]"
                                        placeholder="Birim yetkilisi adına girilecek alınan aksiyon kararı (Bu metin onaya gidecektir)..."
                                        value={form.actionPlan}
                                        onChange={e => setForm({ ...form, actionPlan: e.target.value })}
                                        required={form.isAgreedPre}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </section>
                )}


                {/* Section 3: Kanıtlar ve Tarih */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 border-b pb-4 mb-2">
                            <Paperclip size={18} className="text-gray-600" />
                            <h3 className="font-bold text-gray-700">Bulgu Kanıtı</h3>
                        </div>
                        <div>
                            <input
                                type="file"
                                className="form-input"
                                multiple
                                onChange={e => handleFileChange(e, 'inspector')}
                            />
                            <p className="text-xs text-gray-500 mt-1">Kanıt dosyalarını seçiniz (PDF, Görsel, Ofis)</p>
                        </div>
                        {inspectorFiles.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 mt-4 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                {inspectorFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText size={14} className="text-gray-500" />
                                            <span className="font-medium text-gray-700 truncate">{file.name}</span>
                                        </div>
                                        <button
                                            title="Sil"
                                            onClick={() => removeFile(idx, 'inspector')}
                                            className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded"
                                            type="button"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-4 mb-2">
                                <Save size={18} className="text-gray-600" />
                                <h3 className="font-bold text-gray-700">Öngörülen Kapatma Tarihi</h3>
                            </div>
                            <div className="space-y-4 mt-4 h-full flex flex-col justify-center">
                                <div className="form-group">
                                    {/* Label removed to avoid redundancy with header */}
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="w-full border-gray-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-700 shadow-sm"
                                            value={form.dueDate}
                                            onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            {/* Custom calendar icon overlap if needed, but browser default usually exists. 
                                                        Let's keep it simple but larger padding. 
                                                    */}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 font-medium">Bu tarihe kadar aksiyonların tamamlanması beklenmektedir.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Section 4: Birim Yanıtı & Mutabakat */}
                {!!editFindingId && (
                    <section className="bg-gray-50 p-2 rounded-3xl border border-gray-200">
                        <div className="bg-white p-6 rounded-[22px] shadow-sm space-y-6">
                            <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 mb-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <MessageSquare size={16} className="text-primary" />
                                    </div>
                                    <h3 className="font-bold text-gray-700">Birim Mutabakatı ve Aksiyon Planı</h3>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 shadow-sm transition-colors hover:border-primary/20 group">
                                    <div className="flex flex-col items-end mr-2 cursor-pointer" onClick={() => setForm({ ...form, isAgreed: false })}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${form.isAgreed === false ? 'text-red-500' : 'text-gray-400'}`}>Mutabık Değiliz</span>
                                    </div>

                                    <Switch
                                        checked={form.isAgreed === true}
                                        onChange={(checked) => setForm({ ...form, isAgreed: checked })}
                                        activeColor="bg-[#009c45]"
                                    />

                                    <div className="flex flex-col items-start ml-2 cursor-pointer" onClick={() => setForm({ ...form, isAgreed: true })}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${form.isAgreed ? 'text-[#009c45]' : 'text-gray-400'}`}>Mutabıkız</span>
                                    </div>
                                </div>
                            </div>

                            {form.isAgreed === false && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="form-label text-red-700">Bulguda Mutabık Olmama Gerekçesi</label>
                                        <textarea
                                            className="w-full border-red-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all bg-red-50/20"
                                            rows={4}
                                            placeholder="Konu hakkında mutabık olmama gerekçenizi ve dayanaklarınızı detaylı olarak açıklayınız..."
                                            value={form.disagreementReason}
                                            onChange={e => setForm({ ...form, disagreementReason: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {form.isAgreed === true && (
                                <div className="space-y-8 animate-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="form-label text-green-700">Birim Cevabı</label>
                                        <textarea
                                            className="w-full border-green-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-green-500/10 focus:border-green-400 transition-all bg-green-50/20"
                                            rows={3}
                                            placeholder="Bulguya ilişkin açıklamalarınız ve alınacak aksiyonlar..."
                                            value={form.actionPlan}
                                            onChange={e => setForm({ ...form, actionPlan: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Dynamic Action List */}
                                        <ActionList
                                            actions={form.actions}
                                            onChange={(newActions) => setForm(prev => ({ ...prev, actions: newActions }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Common Evidence Upload for Unit (Available in both Agree/Disagree) */}
                            {form.isAgreed !== null && (
                                <div className="mt-6 border-t pt-6">
                                    <div className="space-y-4">
                                        <label className="form-label">Birim Kanıtları</label>
                                        <div className="form-group">
                                            <input
                                                type="file"
                                                className="form-input"
                                                multiple
                                                onChange={e => handleFileChange(e, 'unit')}
                                            />
                                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Kanıt Dosyası Ekle</p>
                                        </div>
                                        {unitFiles.length > 0 && (
                                            <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                                {unitFiles.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px] bg-gray-50 text-gray-700 p-2 rounded-lg border border-gray-200">
                                                        <span className="truncate max-w-[150px] font-medium">{f.name}</span>
                                                        <button
                                                            title="Sil"
                                                            onClick={() => removeFile(i, 'unit')}
                                                            className="cursor-pointer hover:text-red-900 text-gray-400 rounded p-1 transition-colors"
                                                            type="button"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {form.isAgreed === null && (
                                <div className="py-16 text-center text-gray-400 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <ClipboardCheck size={24} className="opacity-30" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em]">Mutabakat Durumu Bekleniyor</p>
                                    <p className="text-[10px] italic">Lütfen yukarıdaki butonlardan seçim yapınız</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Section 5: Müfettiş Kanaati */}
                {!!editFindingId && (
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 border-b pb-4 mb-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <h3 className="font-bold text-gray-700">Nihai Müfettiş Görüşü</h3>
                        </div>
                        <textarea
                            className="w-full border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-emerald-50/10 min-h-[100px]"
                            rows={3}
                            placeholder="Birim yanıtlarının ve aksiyon planlarının yeterliliği hakkındaki nihai müfettiş görüşü..."
                            value={form.finalInspectorOpinion}
                            onChange={e => setForm({ ...form, finalInspectorOpinion: e.target.value })}
                        ></textarea>
                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-[11px] leading-relaxed text-gray-600">
                            <Info size={16} className="text-gray-400 shrink-0" />
                            <p className="font-medium">
                                <strong>BİLGİ:</strong> Bu alan, birim tarafından sunulan aksiyon planlarının, tespit edilen riski/bulguyu giderme konusundaki yeterliliğinin müfettiş tarafından <u>değerlendirildiği</u> alandır.
                            </p>
                        </div>
                    </section>
                )}
            </form>
        </Modal>
    );
};

export default CreateFindingModal;
