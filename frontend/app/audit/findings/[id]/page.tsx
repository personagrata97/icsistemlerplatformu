'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Check, Send, Eye, Download, Save, Upload, RefreshCw, Plus,
    History, ChevronDown, AlertCircle, ClipboardList, Paperclip, Calendar,
    FileText, Edit2, Trash2, X, User, Clock, CheckCircle, XCircle, RotateCcw,
    MessageSquare, Mail, RotateCw, ExternalLink, Sparkles, BookOpen, Lightbulb
} from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { PlayCircle, FileSearch } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { BackButton } from '@/components/ui/BackButton';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import { getStatusColor, getRiskColor, formatDate } from '@/lib/audit-utils';
import { getAvailableTransitions } from '@/lib/audit-workflow';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import ConfirmModal from '@/components/ConfirmModal';
import FormInput from "@/components/ui/FormInput";

interface Finding {
    id: string;
    code: string;
    title: string;
    description?: string;
    risk: string;
    status: string;
    assignedTo?: string;
    dueDate?: string;
    category?: string;
    auditId?: string;
    department?: string;
    departmentResponse?: string;
    actionPlan?: string;
    rejectionNote?: string;
    lastEditedAt?: string;
    createdAt?: string;
    processHistory?: ProcessLog[];
    attachments?: Attachment[];
    auditTest?: { id: string; title: string; description?: string; status?: string } | null;
}

interface ProcessLog {
    id: string;
    action: string;
    user: string;
    date: string;
    note?: string;
    fromStatus?: string;
    toStatus?: string;
}

interface Attachment {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
}

interface Audit {
    id: string;
    title: string;
    auditCode: string;
    type?: string;
    supervisorId?: string | null;
}

interface FindingAnalysis {
    riskLevel: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';
    riskReason: string;
    suggestedCriteria: {
        text: string;
        source: string;
        category: string;
    }[];
    titleSuggestion?: string;
    contentSuggestions?: string[];
    generalNotes?: string;
}

// Icon map for workflow buttons
const IconMap: Record<string, any> = {
    Send, CheckCircle, XCircle, RotateCw, Mail, MessageSquare, Check, FileText,
    PlayCircle, FileSearch, Eye, History
};

export default function FindingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { user, hasRole } = useAuth();

    // Determine back URL
    const backUrl = searchParams.get('from') || '/audit/findings';

    const findingId = params.id as string;

    // Data States
    const [finding, setFinding] = useState<Finding | null>(null);
    const [audit, setAudit] = useState<Audit | null>(null);
    const [loading, setLoading] = useState(true);

    // UI States
    const [showHistory, setShowHistory] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'conciliation' | 'history'>('details');

    const [pendingTransition, setPendingTransition] = useState<any>(null);

    // AI States
    const [showAiModal, setShowAiModal] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<FindingAnalysis | null>(null);

    // Form States
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        risk: '',
        category: '',
        dueDate: '',
        assignedTo: ''
    });
    const [actionNote, setActionNote] = useState('');
    const [departmentResponse, setDepartmentResponse] = useState('');
    const [newAttachment, setNewAttachment] = useState<File | null>(null);

    // Workflow Steps for findings
    const workflowSteps = ['Taslak', 'Gözden Geçirme Bek.', 'Onay Bekliyor', 'Onaylandı', 'Tebliğ Edildi', 'Birim Yanıtladı', 'Takip Ediliyor', 'Doğrulama Bekliyor', 'Tamamlandı'];

    useEffect(() => {
        if (findingId) {
            loadData();
        }
    }, [findingId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch finding by ID
            const findingData = await auditApi.getFindingById(findingId);
            if (findingData) {
                setFinding(findingData);
                setEditForm({
                    title: findingData.title || '',
                    description: findingData.description || '',
                    risk: findingData.risk || 'Orta',
                    category: findingData.category || '',
                    dueDate: findingData.dueDate || '',
                    assignedTo: findingData.assignedTo || ''
                });
                setDepartmentResponse(findingData.departmentResponse || '');

                // Fetch related audit
                if (findingData.auditId) {
                    const auditData = await auditApi.getAuditById(findingData.auditId);
                    setAudit(auditData);
                }
            }
        } catch (error) {
            console.error('Failed to load finding:', error);
            showToast('Bulgu verileri yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Add process log
    const addProcessLog = async (action: string, note?: string, fromStatus?: string, toStatus?: string) => {
        if (!finding) return;

        const newLog: ProcessLog = {
            id: Date.now().toString(),
            action,
            user: user?.displayName || 'Sistem',
            date: new Date().toISOString(),
            note,
            fromStatus,
            toStatus
        };

        const updatedHistory = [...(finding.processHistory || []), newLog];

        try {
            await auditApi.updateFinding(findingId, {
                processHistory: JSON.stringify(updatedHistory),
                lastEditedAt: new Date().toISOString()
            });

            // Also create a log entry
            await auditApi.createLog({
                action,
                details: note || `${fromStatus} -> ${toStatus}`,
                targetType: 'Finding',
                targetId: findingId,
                user: user?.displayName || 'Sistem'
            });

            setFinding(prev => prev ? { ...prev, processHistory: updatedHistory } : null);
        } catch (error) {
            console.error('Failed to add process log:', error);
        }
    };

    // Handle status change
    const handleStatusChange = async (transition: any) => {
        if (!finding) return;

        // If action requires note, show modal
        if (transition.requireNote) {
            setPendingTransition(transition);
            setShowNoteModal(true);
            return;
        }

        try {
            const oldStatus = finding.status;
            const newStatus = transition.to;

            await auditApi.updateFinding(findingId, { status: newStatus });

            await addProcessLog(
                transition.label,
                undefined,
                oldStatus,
                newStatus
            );

            setFinding(prev => prev ? { ...prev, status: newStatus } : null);
            showToast(`Bulgu durumu "${newStatus}" olarak güncellendi`, 'success');
        } catch (error) {
            showToast('Durum güncellenirken hata oluştu', 'error');
        }
    };

    // Handle status change with note
    const handleStatusChangeWithNote = async () => {
        if (!finding || !pendingTransition) return;

        try {
            const oldStatus = finding.status;
            const newStatus = pendingTransition.to;

            await auditApi.updateFinding(findingId, {
                status: newStatus,
                rejectionNote: actionNote
            });

            await addProcessLog(
                pendingTransition.label,
                actionNote,
                oldStatus,
                newStatus
            );

            setFinding(prev => prev ? { ...prev, status: newStatus, rejectionNote: actionNote } : null);
            showToast(`Bulgu durumu "${newStatus}" olarak güncellendi`, 'success');

            setShowNoteModal(false);
            setActionNote('');
            setPendingTransition(null);
        } catch (error) {
            showToast('Durum güncellenirken hata oluştu', 'error');
        }
    };

    // Save edits
    const handleSaveEdits = async () => {
        if (!finding) return;

        try {
            await auditApi.updateFinding(findingId, {
                ...editForm,
                lastEditedAt: new Date().toISOString()
            });

            await addProcessLog('Bulgu Güncellendi', 'Bulgu bilgileri düzenlendi');

            setFinding(prev => prev ? { ...prev, ...editForm } : null);
            setIsEditing(false);
            showToast('Bulgu başarıyla güncellendi', 'success');
        } catch (error) {
            showToast('Güncelleme sırasında hata oluştu', 'error');
        }
    };

    // Save department response
    const handleSaveDepartmentResponse = async () => {
        if (!finding) return;

        try {
            const updatePayload: any = {
                departmentResponse,
                lastEditedAt: new Date().toISOString()
            };

            const statusChanged = finding.status === 'Tebliğ Edildi';
            if (statusChanged) {
                updatePayload.status = 'Birim Yanıtladı';
            }

            await auditApi.updateFinding(findingId, updatePayload);

            await addProcessLog(
                'Birim Yanıtı Kaydedildi',
                departmentResponse.substring(0, 100) + '...',
                finding.status,
                statusChanged ? 'Birim Yanıtladı' : finding.status
            );

            setFinding(prev => prev ? { 
                ...prev, 
                departmentResponse, 
                status: statusChanged ? 'Birim Yanıtladı' : prev.status 
            } : null);
            setShowResponseModal(false);
            showToast(statusChanged ? 'Birim yanıtı kaydedildi ve durum "Birim Yanıtladı" olarak güncellendi.' : 'Birim yanıtı kaydedildi.', 'success');
        } catch (error) {
            showToast('Kaydetme sırasında hata oluştu', 'error');
        }
    };

    // Upload attachment
    const handleUploadAttachment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!finding || !newAttachment) return;

        try {
            const attachment: Attachment = {
                id: Date.now().toString(),
                name: newAttachment.name,
                type: newAttachment.type.split('/')[1]?.toLocaleUpperCase('tr-TR') || 'Dosya',
                size: `${(newAttachment.size / 1024).toFixed(1)} KB`,
                uploadedBy: user?.displayName || 'Mevcut Kullanıcı',
                uploadedAt: new Date().toISOString().split('T')[0]
            };

            const updatedAttachments = [...(finding.attachments || []), attachment];
            await auditApi.updateFinding(findingId, {
                attachments: JSON.stringify(updatedAttachments)
            });

            await addProcessLog('Dosya Eklendi', attachment.name);

            setFinding(prev => prev ? { ...prev, attachments: updatedAttachments } : null);
            setShowAttachmentModal(false);
            setNewAttachment(null);
            showToast('Dosya eklendi', 'success');
        } catch (error) {
            showToast('Dosya eklenirken hata oluştu', 'error');
        }
    };

    // AI Analysis Handler
    const handleAiAnalysis = async () => {
        if (!finding) return;

        setAnalyzing(true);
        setShowAiModal(true);

        try {
            const analysis = await auditApi.analyzeFinding({
                findingTitle: finding.title,
                findingContent: finding.description || '',
                auditType: audit?.type || 'Genel Denetim',
                department: finding.department || finding.assignedTo
            });

            setAiAnalysis(analysis);
        } catch (error) {
            console.error(error);
            showToast('Yapay zeka analizi yapılamadı.', 'error');
            setShowAiModal(false);
        } finally {
            setAnalyzing(false);
        }
    };

    // Apply AI Suggestions
    const applyAiSuggestions = () => {
        if (!aiAnalysis || !finding) return;

        setEditForm(prev => ({
            ...prev,
            title: aiAnalysis.titleSuggestion || prev.title,
            risk: aiAnalysis.riskLevel || prev.risk,
            // Append suggestions to description if desired, or replace? 
            // For now let's just update fields and maybe show a toast
        }));

        setIsEditing(true);
        setShowAiModal(false);
        showToast('AI önerileri düzenleme formuna uygulandı.', 'success');
    };

    // Delete finding
    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await auditApi.deleteFinding(findingId);
            showToast('Bulgu silindi', 'success');
            router.push('/audit/findings');
        } catch (error) {
            showToast('Silme işlemi sırasında hata oluştu', 'error');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    // Get current step index for stepper
    const getCurrentStepIndex = () => {
        if (!finding) return 0;
        const status = finding.status;

        // Map status to step
        const statusMap: Record<string, number> = {
            'Taslak': 0,
            'Gözden Geçirme Bekliyor': 1,
            'Onay Bekliyor': 2,
            'Revizyon Gerekli': 0,
            'Onaylandı': 3,
            'Tebliğ Edildi': 4,
            'Birim Yanıtladı': 5,
            'Takip Ediliyor': 6,
            'Doğrulama Bekliyor': 7,
            'Tamamlandı': 8,
            'Risk Kabul Edildi': 8
        };

        return statusMap[status] ?? 0;
    };

    // Get available transitions
    const getTransitions = () => {
        if (!finding) return [];
        
        // Dynamic workflow role calculation based on AuthContext roles
        const getUserWorkflowRole = () => {
            if (checkRole(hasRole, ROLES.ADMIN)) return 'Sistem Yöneticisi';
            if (checkRole(hasRole, ROLES.FINDING_SUPERVISOR)) return 'Gözetim Sorumlusu';
            if (checkRole(hasRole, ROLES.UNIT)) return 'Birim Yöneticisi';
            return 'Müfettiş';
        };
        
        const userRole = getUserWorkflowRole();
        const hasSupervisor = !!audit?.supervisorId;
        return getAvailableTransitions(finding.status, userRole as any, hasSupervisor);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex justify-center p-12">
                    <LoadingState message="Bulgu detayları yükleniyor..." />
                </div>
            </div>
        );
    }

    if (!finding) {
        return (
            <div className="card text-center py-8">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bulgu Bulunamadı</h3>
                <div className="mt-4">
                    <BackButton href="/audit/findings" label="Bulgulara Dön" />
                </div>
            </div>
        );
    }

    const currentStepIndex = getCurrentStepIndex();
    const transitions = getTransitions();
    const processHistory = typeof finding.processHistory === 'string'
        ? JSON.parse(finding.processHistory)
        : (finding.processHistory || []);
    const attachments = typeof finding.attachments === 'string'
        ? JSON.parse(finding.attachments)
        : (finding.attachments || []);

    return (
        <>


            {/* Main Card */}
            <div className="card">
                {/* Workflow Stepper */}
                <div className="flex justify-between mb-6 relative">
                    {workflowSteps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        return (
                            <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isCompleted ? 'bg-green-500 text-white' :
                                    isCurrent ? 'bg-primary text-white' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                    {isCompleted ? <Check size={18} /> : index + 1}
                                </div>
                                <span className={`text-xs mt-2 text-center ${isCurrent ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                    {/* Stepper Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" style={{ left: '8%', right: '8%' }}>
                        <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${Math.max(0, (currentStepIndex / (workflowSteps.length - 1)) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-6 pt-4 border-t">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <BackButton href={backUrl} label="Bulgulara Dön" />
                            {finding.code && (
                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {finding.code}
                                </span>
                            )}
                            <StatusBadge value={finding.risk} type="risk" />
                            <StatusBadge value={finding.status} type="status" />
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                className="form-input text-xl font-bold w-full"
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        ) : (
                            <h2 className="text-xl font-bold mb-2 ml-1">{finding.title}</h2>
                        )}
                        {audit && (
                            <Link href={`/audit/audits/${audit.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                <ExternalLink size={12} /> {audit.title} ({audit.auditCode})
                            </Link>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" leftIcon={<Save size={18} />} onClick={handleSaveEdits}>
                                    Kaydet
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={handleAiAnalysis}
                                    leftIcon={<Sparkles size={18} />}
                                    className="text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 mr-2"
                                >
                                    AI Analiz
                                </Button>
                                <ActionMenu items={[
                                    { label: 'Düzenle', icon: Edit2, onClick: () => setIsEditing(true) },
                                    { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: handleDelete }
                                ]} />
                            </>
                        )}
                    </div>
                </div >

                {/* Tabs */}
                <div className="flex border-b mb-6 -mx-6 px-6 bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'details' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <FileText size={16} /> Detaylar
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('conciliation')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'conciliation' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <MessageSquare size={16} /> Mutabakat & Yanıt
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'history' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <History size={16} /> Ekler & Geçmiş
                        </div>
                    </button>
                </div>

                {activeTab === 'details' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Info Grid */}
                        < div className="grid grid-cols-4 gap-6 mb-6" >
                            <div>
                                <h4 className="text-sm text-gray-500 mb-1">Kategori</h4>
                                {isEditing ? (
                                    <input type="text" className="form-input" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                                ) : (
                                    <p className="font-medium">{finding.category || '-'}</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500 mb-1">Risk Seviyesi</h4>
                                {isEditing ? (
                                    <CustomSelect
                                        value={editForm.risk}
                                        onChange={(val) => setEditForm({ ...editForm, risk: val as string })}
                                        options={[
                                            { value: 'Kritik', label: 'Kritik' },
                                            { value: 'Yüksek', label: 'Yüksek' },
                                            { value: 'Orta', label: 'Orta' },
                                            { value: 'Düşük', label: 'Düşük' }
                                        ]}
                                    />
                                ) : (
                                    <StatusBadge value={finding.risk} type="risk" />
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500 mb-1">Termin Tarihi</h4>
                                {isEditing ? (
                                    <FormInput type="date"  value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                                ) : (
                                    <p className="font-medium flex items-center gap-1">
                                        <Calendar size={14} /> {formatDate(finding.dueDate)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm text-gray-500 mb-1">Sorumlu</h4>
                                {isEditing ? (
                                    <input type="text" className="form-input" value={editForm.assignedTo} onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })} />
                                ) : (
                                    <p className="font-medium flex items-center gap-1">
                                        <User size={14} /> {finding.assignedTo || 'Atanmamış'}
                                    </p>
                                )}
                            </div>
                            {finding.auditTest && (
                                <div>
                                    <h4 className="text-sm text-gray-500 mb-1">İlgili Test Adımı</h4>
                                    <div className="flex items-center gap-2">
                                        <ClipboardList size={14} className="text-primary" />
                                        <Link
                                            href={`/audit/audits/${finding.auditId}?tab=tests`}
                                            className="text-sm text-primary hover:underline font-medium"
                                        >
                                            {finding.auditTest.title || 'Test Adımı'}
                                        </Link>
                                        {finding.auditTest.status && (
                                            <StatusBadge value={finding.auditTest.status} type="status" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div >

                        {/* Description */}
                        < div className="bg-gray-50 rounded-lg p-4 mb-6" >
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                <FileText size={16} className="text-primary" /> Bulgu Açıklaması
                            </h4>
                            {
                                isEditing ? (
                                    <textarea
                                        className="form-input w-full"
                                        rows={4}
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{finding.description || 'Açıklama bulunmuyor.'}</p>
                                )
                            }
                        </div >

                        {/* Workflow Actions */}
                        {
                            transitions.length > 0 && (
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-5 border border-gray-100 mb-2">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm text-gray-800">
                                        <Send size={16} className="text-primary" /> Sonraki Adım / Aksiyon Al
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {transitions.map((transition: any, index: number) => {
                                            const Icon = IconMap[transition.icon] || Send;
                                            const variant = transition.style === 'primary' ? 'primary' :
                                                transition.style === 'success' ? 'success' :
                                                    transition.style === 'danger' ? 'danger' :
                                                        transition.style === 'warning' ? 'warning' :
                                                            transition.style === 'info' ? 'view' :
                                                                'secondary';
                                            return (
                                                <Button
                                                    key={index}
                                                    variant={variant as any}
                                                    leftIcon={<Icon size={18} />}
                                                    onClick={() => handleStatusChange(transition)}
                                                    className="shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    {transition.label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        }
                    </div>
                )}

                {activeTab === 'conciliation' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status Alert for Conciliation */}
                        <div className={`p-4 rounded-lg flex items-start gap-4 border shadow-sm ${finding.status === 'Mutabık Değil' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                            <div className={`p-2 rounded-full ${finding.status === 'Mutabık Değil' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1">Bulgu Mutabakatı: {finding.status}</h4>
                                <p className="text-xs leading-relaxed opacity-90">
                                    {finding.status === 'Tebliğ Edildi' ? 'Bulgu ilgili birime tebliğ edilmiştir. Birimin aksiyon planı ve mutabakat görüşü beklenmektedir.' :
                                        finding.status === 'Birim Yanıtladı' ? 'Birim kanıtları/planı yüklemiştir. Lütfen birim yanıtını inceleyerek mutabakat sürecini sonuçlandırınız.' :
                                            finding.status === 'Mutabık Değil' ? 'Birim bulguya itiraz etmiştir. Sorunun çözümü için ek görüşmeler veya üst yönetim bilgilendirmesi gerekebilir.' :
                                                'Mutabakat süreci tamamlanmış veya bu aşamaya henüz gelinmemiştir.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Department Response Section */}
                            < div className="border rounded-xl p-5 border-l-4 border-l-blue-500 bg-white shadow-sm" >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold flex items-center gap-2 text-gray-800">
                                        <MessageSquare size={18} className="text-blue-500" /> Birim Yanıtı / Aksiyon Planı
                                    </h4>
                                    <button onClick={() => setShowResponseModal(true)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Düzenle">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                                {
                                    finding.departmentResponse ? (
                                        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 min-h-[120px]">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{finding.departmentResponse}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                                            <Mail size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-xs italic">Henüz birim yanıtı sisteme girilmemiş.</p>
                                        </div>
                                    )
                                }
                            </div >

                            {/* Mutabakat Notları / Conciliation Notes */}
                            <div className="border rounded-xl p-5 border-l-4 border-l-emerald-500 bg-white shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold flex items-center gap-2 text-gray-800">
                                        <CheckCircle size={18} className="text-emerald-500" /> Denetçi Değerlendirmesi
                                    </h4>
                                    <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => showToast('Mutabakat formu PDF olarak hazırlanıyor...', 'info')}>
                                        <Download size={14} className="mr-1" /> Mutabakat Formu
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div className={`text-xs p-3 rounded-lg border font-semibold flex items-center gap-2 ${finding.status.includes('Kapalı') || finding.status === 'Takip Ediliyor' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${finding.status.includes('Kapalı') || finding.status === 'Takip Ediliyor' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        Uzlaşı Durumu: {finding.status.includes('Kapalı') || finding.status === 'Takip Ediliyor' ? 'Tam Mutabakat Sağlandı' : 'Uzlaşı Bekleniyor'}
                                    </div>
                                    <div className="pl-4 py-1 border-l-2 border-emerald-100">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Resmi Görüş</h4>
                                        <p className="text-sm text-gray-600 italic leading-relaxed">
                                            {finding.rejectionNote || 'Birim yanıtı incelendikten sonra müfettişin nihai kanaati ve itirazlara cevabı burada yer alacaktır.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Attachments */}
                        <div className="bg-white rounded-xl border p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold flex items-center gap-2 text-gray-800">
                                    <Paperclip size={18} className="text-primary" /> İlgili Dosyalar & Kanıtlar ({attachments.length})
                                </h4>
                                <Button variant="primary" size="sm" onClick={() => setShowAttachmentModal(true)} leftIcon={<Plus size={18} />}>
                                    Yeni Dosya
                                </Button>
                            </div>
                            {attachments.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {attachments.map((att: Attachment) => (
                                        <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-white rounded shadow-sm">
                                                    <FileText size={18} className="text-gray-400" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-medium text-xs truncate max-w-[150px]">{att.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase">{att.size} • {att.uploadedAt}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                                                <ActionMenu items={[
                                                    { label: 'İndir', icon: Download, onClick: () => {} },
                                                    { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => {} }
                                                ]} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-300">
                                    <Paperclip size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm italic">Henüz dosya eklenmemiş.</p>
                                </div>
                            )}
                        </div>

                        {/* Process History */}
                        <div className="bg-white rounded-xl border p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold flex items-center gap-2 text-gray-800">
                                    <History size={18} className="text-primary" /> Süreç ve Denetim İzi ({processHistory.length})
                                </h4>
                                <div className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono uppercase">Read Only Log</div>
                            </div>
                            <div className="relative">
                                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-100" />
                                <div className="space-y-6">
                                    {processHistory.length > 0 ? processHistory.slice().reverse().map((log: ProcessLog) => (
                                        <div key={log.id} className="relative flex gap-6 pl-[32px]">
                                            <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="flex-1 bg-gray-50/80 rounded-xl p-4 border border-gray-100 relative group hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-sm text-gray-800">{log.action}</span>
                                                    <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Clock size={10} /> {formatDate(log.date)}
                                                    </span>
                                                </div>
                                                {log.fromStatus && log.toStatus && (
                                                    <div className="flex items-center gap-2 mb-2 p-1.5 bg-white/50 rounded-lg inline-flex border border-gray-100">
                                                        <StatusBadge value={log.fromStatus} type="status" size="sm" />
                                                        <ArrowLeft size={12} className="text-gray-300 rotate-180" />
                                                        <StatusBadge value={log.toStatus} type="status" size="sm" />
                                                    </div>
                                                )}
                                                {log.note && (
                                                    <div className="bg-white p-3 rounded-lg border border-gray-100 mb-2">
                                                        <p className="text-xs text-gray-600 leading-relaxed">"{log.note}"</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                    <User size={10} />
                                                    <span className="font-medium">{log.user}</span>
                                                    <span>•</span>
                                                    <span>{new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-gray-400">
                                            <History size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-sm italic">Henüz işlem geçmişi bulunmuyor.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div >

            {/* Note Modal */}
            {
                showNoteModal && (
                    <div className="modal-overlay open" onClick={() => { setShowNoteModal(false); setPendingTransition(null); }}>
                        <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-800">{pendingTransition?.label}</h3>
                                <button
                                    onClick={() => { setShowNoteModal(false); setPendingTransition(null); }}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors active:scale-90"
                                    title="Kapat"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body space-y-4">
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-yellow-800 text-sm">
                                        <AlertCircle size={14} className="inline mr-1" />
                                        Bu işlem için not girmeniz gerekmektedir.
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Açıklama / Not *</label>
                                    <textarea
                                        className="form-input"
                                        rows={4}
                                        required
                                        value={actionNote}
                                        onChange={e => setActionNote(e.target.value)}
                                        placeholder="Red gerekçesi veya not giriniz..."
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                <Button variant="secondary" onClick={() => { setShowNoteModal(false); setPendingTransition(null); }}>
                                    İptal
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleStatusChangeWithNote}
                                    disabled={!actionNote.trim()}
                                    className="px-8 shadow-md"
                                >
                                    Onayla
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Department Response Modal */}
            {
                showResponseModal && (
                    <div className="modal-overlay open" onClick={() => setShowResponseModal(false)}>
                        <div className="modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-800">Birim Yanıtı / Aksiyon Planı</h3>
                                <button
                                    onClick={() => setShowResponseModal(false)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors active:scale-90"
                                    title="Kapat"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body space-y-4">
                                <div className="form-group">
                                    <label className="form-label">Aksiyon Planı / Birim Yanıtı</label>
                                    <textarea
                                        className="form-input"
                                        rows={6}
                                        value={departmentResponse}
                                        onChange={e => setDepartmentResponse(e.target.value)}
                                        placeholder="Birimin bulguya yanıtı ve yapılacak aksiyon planını buraya giriniz..."
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                <Button variant="secondary" onClick={() => setShowResponseModal(false)}>İptal</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveDepartmentResponse}
                                    leftIcon={<Save size={18} />}
                                    className="px-8 shadow-md"
                                >
                                    Kaydet
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Attachment Modal */}
            {
                showAttachmentModal && (
                    <div className="modal-overlay open" onClick={() => setShowAttachmentModal(false)}>
                        <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-800">Dosya Ekle</h3>
                                <button
                                    onClick={() => setShowAttachmentModal(false)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors active:scale-90"
                                    title="Kapat"
                                    type="button"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUploadAttachment}>
                                <div className="modal-body space-y-4">
                                    <div className="form-group">
                                        <label className="form-label">Dosya Seç *</label>
                                        <input
                                            type="file"
                                            className="form-input"
                                            required
                                            onChange={e => setNewAttachment(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                    <Button variant="secondary" onClick={() => setShowAttachmentModal(false)}>İptal</Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        leftIcon={<Upload size={18} />}
                                        className="px-8 shadow-md"
                                    >
                                        Yükle
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* AI Analysis Modal */}
            {
                showAiModal && (
                    <div className="modal-overlay open" onClick={() => setShowAiModal(false)}>
                        <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Sparkles size={20} /> Yapay Zeka Risk Analizi
                                </h3>
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors active:scale-90"
                                    title="Kapat"
                                    type="button"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body p-6">
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                                        <h4 className="text-lg font-semibold text-gray-700">Bulgu Analiz Ediliyor...</h4>
                                        <p className="text-gray-500 mt-2">Mevzuat ve benzer bulgular taranıyor</p>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="space-y-6">
                                        {/* Risk Assessment */}
                                        <div className="flex gap-4 items-start bg-purple-50 p-4 rounded-xl border border-purple-100">
                                            <div className={`px-4 py-2 rounded-lg font-bold text-white shadow-sm flex-shrink-0 ${aiAnalysis.riskLevel === 'Kritik' ? 'bg-red-600' :
                                                aiAnalysis.riskLevel === 'Yüksek' ? 'bg-orange-500' :
                                                    aiAnalysis.riskLevel === 'Orta' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}>
                                                {aiAnalysis.riskLevel} Risk
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-purple-900 mb-1">Risk Değerlendirmesi</h4>
                                                <p className="text-purple-800 text-sm leading-relaxed">{aiAnalysis.riskReason}</p>
                                            </div>
                                        </div>

                                        {/* Related Criteria/Legislation */}
                                        {aiAnalysis.suggestedCriteria && aiAnalysis.suggestedCriteria.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-800">
                                                    <BookOpen size={18} className="text-blue-600" /> İlgili Mevzuat ve Kriterler
                                                </h4>
                                                <div className="space-y-3">
                                                    {aiAnalysis.suggestedCriteria.map((criteria, i) => (
                                                        <div key={i} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                                            <p className="text-sm text-gray-800">{criteria.text}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{criteria.source}</span>
                                                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{criteria.category}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {(aiAnalysis.titleSuggestion || (aiAnalysis.contentSuggestions && aiAnalysis.contentSuggestions.length > 0)) && (
                                            <div>
                                                <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-800">
                                                    <Lightbulb size={18} className="text-amber-500" /> İyileştirme Önerileri
                                                </h4>
                                                <div className="space-y-3">
                                                    {aiAnalysis.titleSuggestion && aiAnalysis.titleSuggestion !== finding?.title && (
                                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                            <span className="text-xs font-bold text-amber-600 uppercase mb-1 block">Başlık Önerisi</span>
                                                            <p className="text-sm font-medium">{aiAnalysis.titleSuggestion}</p>
                                                        </div>
                                                    )}
                                                    {aiAnalysis.contentSuggestions?.map((sugg, i) => (
                                                        <div key={i} className="flex gap-3 items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                                            <p className="text-sm text-gray-700">{sugg}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">Analiz sonucu alınamadı.</div>
                                )}
                            </div>
                            {!analyzing && aiAnalysis && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                    <Button variant="secondary" onClick={() => setShowAiModal(false)}>Kapat</Button>
                                    <Button
                                        variant="primary"
                                        onClick={applyAiSuggestions}
                                        leftIcon={<Check size={18} />}
                                        className="!bg-purple-600 !hover:bg-purple-700 !border-purple-600 shadow-md px-8"
                                    >
                                        Önerileri Uygula
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Bulguyu Sil"
                message="Bu bulguyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                type="danger"
            />
        </>
    );
}
