'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle, XCircle, AlertTriangle, Play, FileText, Plus,
    ChevronDown, ChevronRight, Search, Filter, Save, Upload, Trash2, X,
    Send, Eye, MessageSquare, RotateCcw, ShieldCheck, PenTool, FolderOpen
} from 'lucide-react';
import { auditApi, AuditTest, Control, Risk, Process } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import CreateFindingModal from './CreateFindingModal';
import ConfirmModal from '../ConfirmModal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import EmptyState from '@/components/ui/EmptyState';
import Checkbox from '@/components/ui/Checkbox';
import { FileUpload } from '@/components/ui/FileUpload';

interface TestStepsProps {
    auditId: string;
    unitId?: string; // To fetch RCM data
    onProgressUpdate?: () => void;
}

export default function TestSteps({ auditId, unitId, onProgressUpdate }: TestStepsProps) {
    const { showToast } = useToast();
    const { user, hasRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<AuditTest[]>([]);

    // Role checks 
    const isSupervisor = hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_SUPERVISOR');
    const isInspector = hasRole('AUDIT_INSPECTOR') || hasRole('Müfettiş') || hasRole('Başmüfettiş') || hasRole('Kıdemli Müfettiş');

    // RCM Selection States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUnitWarning, setShowUnitWarning] = useState(false);
    const [availableProcesses, setAvailableProcesses] = useState<Process[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<string>('');
    const [availableRisks, setAvailableRisks] = useState<Risk[]>([]);
    const [selectedRisk, setSelectedRisk] = useState<string>('');
    const [availableControls, setAvailableControls] = useState<Control[]>([]);
    const [selectedControls, setSelectedControls] = useState<string[]>([]);

    // Execution States
    const [activeTest, setActiveTest] = useState<string | null>(null);
    const [testFormData, setTestFormData] = useState<Partial<AuditTest>>({});
    const [manualTestResult, setManualTestResult] = useState<string>(''); // Override

    // Review Note States ( Maker-Checker)
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewTargetTest, setReviewTargetTest] = useState<AuditTest | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewAction, setReviewAction] = useState<'approve' | 'revision'>('approve');

    // Finding Creation
    const [showFindingModal, setShowFindingModal] = useState(false);
    const [failedTestForFinding, setFailedTestForFinding] = useState<AuditTest | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        loadTests();
    }, [auditId]);

    const loadTests = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getAuditTests(auditId);
            setTests(data || []);
        } catch (error) {
            console.error(error);
            showToast('Test adımları yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = async () => {
        setShowAddModal(true);
        if (availableProcesses.length === 0) {
            try {
                const processes = await auditApi.getProcesses(unitId);
                setAvailableProcesses(processes);
            } catch (error) {
                showToast('Süreçler yüklenirken hata oluştu', 'error');
            }
        }
    };

    const handleProcessChange = async (processId: string) => {
        setSelectedProcess(processId);
        setSelectedRisk('');
        setAvailableRisks([]);
        setAvailableControls([]);
        if (processId) {
            try {
                const risks = await auditApi.getRisks(processId);
                setAvailableRisks(risks);
            } catch (error) { console.error(error); }
        }
    };

    const handleRiskChange = async (riskId: string) => {
        setSelectedRisk(riskId);
        setAvailableControls([]);
        if (riskId) {
            try {
                const controls = await auditApi.getControls(riskId);
                setAvailableControls(controls);
            } catch (error) { console.error(error); }
        }
    };

    const handleAddSelectedControls = async () => {
        try {
            for (const controlId of selectedControls) {
                // Check if already exists
                if (tests.some(t => t.controlId === controlId)) continue;

                await auditApi.createAuditTest({
                    auditId,
                    controlId,
                    status: 'Planlandı' // Default status
                });
            }
            showToast('Test adımları eklendi', 'success');
            setShowAddModal(false);
            setSelectedControls([]);
            loadTests();
        } catch (error) {
            showToast('Testler eklenirken hata oluştu', 'error');
        }
    };

    const handleStartTest = (test: AuditTest) => {
        setActiveTest(test.id);
        setManualTestResult(test.testResult || '');
        setTestFormData({
            procedure: test.procedure,
            sampleSize: test.sampleSize,
            designEffectiveness: test.designEffectiveness || 'Etkin',
            operatingEffectiveness: test.operatingEffectiveness || 'Etkin',
            testResult: test.testResult,
            // @ts-ignore
            evidence: test.evidence
        });
    };

    // Otomatik sonuç önerisi (denetçi override edebilir)
    const getSuggestedResult = () => {
        if (testFormData.operatingEffectiveness === 'Etkin Değil' ||
            testFormData.designEffectiveness === 'Etkin Değil') return 'Başarısız';
        if (testFormData.designEffectiveness === 'Değerlendirilmedi' ||
            testFormData.operatingEffectiveness === 'Uygulanabilir Değil') return 'Değerlendirilmedi';
        return 'Başarılı';
    };

    const handleSaveTest = async (id: string, submitForReview: boolean = false) => {
        try {
            // Test sonucu: önce denetçi seçimi, yoksa otomatik hesaplama
            const result = manualTestResult || getSuggestedResult();

            // Sadece schema'da scalar olan alanları gönder (notes relation, completedAt yok)
            const { notes, ...safeFormData } = testFormData as any;

            // Testi Tamamla yerine "İncelemeye Gönder" akışı
            let newStatus = 'Devam Ediyor';
            if (submitForReview) {
                newStatus = 'Onay Bekliyor'; // Supervisor review bekleyecek
            }

            const updatedTest = await auditApi.updateAuditTest(id, {
                ...safeFormData,
                testResult: result,
                testDate: submitForReview ? new Date().toISOString() : undefined,
                testedBy: submitForReview ? user?.displayName : undefined,
                status: newStatus
            });

            // Update local state
            setTests(prev => prev.map(t => t.id === id ? { ...t, ...updatedTest, testResult: result, status: newStatus } : t));

            setActiveTest(null);
            showToast(submitForReview ? 'Test incelemeye gönderildi ' : 'Test kaydedildi', 'success');

            // Trigger Finding Creation if Failed
            if (submitForReview && result === 'Başarısız') {
                setFailedTestForFinding(tests.find(t => t.id === id) || null);
                setShowFindingModal(true);
            }

            if (onProgressUpdate) onProgressUpdate();

        } catch (error) {
            console.error('Test kaydetme hatası:', error);
            showToast('Kayıt başarısız', 'error');
        }
    };

    // Supervisor Review Handler
    const handleSupervisorReview = async () => {
        if (!reviewTargetTest) return;
        try {
            const newStatus = reviewAction === 'approve' ? 'Onaylandı' : 'Revizyon';

            // Update test status
            await auditApi.updateAuditTest(reviewTargetTest.id, {
                status: newStatus,
                reviewerId: user?.id,
                reviewedAt: new Date().toISOString(),
                supervisorId: user?.id,
                supervisorApprovedAt: reviewAction === 'approve' ? new Date().toISOString() : undefined
            });

            // Create Review Note if provided
            if (reviewNote.trim()) {
                try {
                    await auditApi.createReviewNote({
                        text: reviewNote,
                        type: 'TEST',
                        testId: reviewTargetTest.id,
                        authorId: user?.id,
                        authorName: user?.displayName || ''
                    });
                } catch (e) { console.error('Review note save failed:', e); }
            }

            setTests(prev => prev.map(t =>
                t.id === reviewTargetTest.id
                    ? { ...t, status: newStatus }
                    : t
            ));

            showToast(
                reviewAction === 'approve'
                    ? 'Test onaylandı (Supervisor Sign-Off)'
                    : 'Test revizyon için geri gönderildi',
                reviewAction === 'approve' ? 'success' : 'warning'
            );

            setShowReviewModal(false);
            setReviewNote('');
            setReviewTargetTest(null);
            if (onProgressUpdate) onProgressUpdate();
        } catch (error) {
            console.error('Review error:', error);
            showToast('İnceleme işlemi başarısız', 'error');
        }
    };

    const handleDeleteTest = async (testId: string) => {
        setDeleteConfirmId(testId);
    };

    const confirmDeleteTest = async () => {
        if (!deleteConfirmId) return;
        try {
            await auditApi.deleteAuditTest(deleteConfirmId);
            setTests(prev => prev.filter(t => t.id !== deleteConfirmId));
            showToast('Test silindi', 'success');
        } catch (error) {
            showToast('Silme işlemi başarısız', 'error')
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const getStatusBadge = (test: any) => {
        if (test.status === 'Onaylandı') return <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><ShieldCheck size={12} /> Onaylandı</span>;
        if (test.status === 'Onay Bekliyor') return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><Send size={12} /> İnceleme Bekliyor</span>;
        if (test.status === 'Revizyon') return <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1"><RotateCcw size={12} /> Revizyon İstendi</span>;
        if (test.testResult === 'Başarılı') return <span className="badge bg-green-100 text-green-700">Başarılı</span>;
        if (test.testResult === 'Başarısız') return <span className="badge bg-red-100 text-red-700">Başarısız</span>;
        if (test.testResult === 'Kısmen Başarılı') return <span className="badge bg-yellow-100 text-yellow-700">Kısmen Başarılı</span>;
        if (test.status === 'Devam Ediyor') return <span className="badge bg-blue-100 text-blue-600">Devam Ediyor</span>;
        return <span className="badge bg-blue-50 text-blue-600">Planlandı</span>;
    };

    return (
        <div className="card !p-0 shadow-sm border border-gray-100">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <PenTool size={20} className="text-primary" /> Saha Çalışması
                </h3>
                <Button
                    onClick={handleOpenAddModal}
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    className="gap-2"
                >
                    Test Adımı Ekle (RCM)
                </Button>
            </div>
            <div className="p-6">

            {/* Test List */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : tests.length === 0 ? (
                <div className="py-6">
                    <EmptyState
                        icon={FolderOpen}
                        title="Kayıt Bulunamadı"
                        description="Denetim kapsamındaki kontrolleri buraya ekleyin."
                    />
                    {!unitId && (
                        <div className="max-w-md mx-auto mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex flex-col items-center text-center gap-2">
                            <AlertTriangle size={24} className="text-orange-500" />
                            <p><strong>Bilgi:</strong> Bu denetimin henüz bir Birim/Süreci seçilmemiş ancak yine de genel süreçlerden test adımları ekleyebilirsiniz.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {tests.map(test => (
                        <div key={test.id} className="bg-white border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                            {/* Card Header */}
                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                                onClick={() => {
                                    if (activeTest === test.id) {
                                        setActiveTest(null);
                                    } else {
                                        handleStartTest(test);
                                    }
                                }}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${test.testResult === 'Başarısız' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{(test as any).control?.name || 'Kontrol Adı Belirtilmemiş'}</h4>
                                        <p className="text-xs text-gray-500">{(test as any).control?.code || 'Kod Yok'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* RCM Risk Badge (#9) */}
                                    {(test as any).control?.risk && (
                                        <span className={`badge text-[10px] px-2 py-0.5 font-bold ${
                                            (test as any).control.risk.level === 'Yüksek' ? 'bg-red-50 text-red-600 border border-red-200' :
                                            (test as any).control.risk.level === 'Orta' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                            'bg-blue-50 text-blue-600 border border-blue-200'
                                        }`}>
                                            Risk: {(test as any).control.risk.name || (test as any).control.risk.level}
                                        </span>
                                    )}
                                    {getStatusBadge(test)}
                                    {/* Supervisor Quick Actions */}
                                    {isSupervisor && test.status === 'Onay Bekliyor' && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); setReviewTargetTest(test); setShowReviewModal(true); }}
                                            leftIcon={<Eye size={14} />}
                                            className="text-xs"
                                        >
                                            İncele
                                        </Button>
                                    )}
                                    {activeTest === test.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Content (Test Execution Form) */}
                            {activeTest === test.id && (
                                <div className="p-6 bg-white animate-in slide-in-from-top-2">
                                    {/* Revizyon uyarısı */}
                                    {test.status === 'Revizyon' && (
                                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-center gap-2">
                                            <RotateCcw size={16} className="shrink-0" />
                                            <span><strong>Revizyon İstendi:</strong> Başmüfettiş bu testi geri gönderdi. Lütfen düzeltmeleri yapıp tekrar incelemeye gönderin.</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <h5 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Kontrol Detayları</h5>
                                            <p className="text-sm text-gray-600 mb-2">{(test as any).control?.description || 'Açıklama yok'}</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="bg-gray-100 px-2 py-1 rounded">Sıklık: {(test as any).control?.frequency || '-'}</span>
                                                <span className="bg-gray-100 px-2 py-1 rounded">Tip: {(test as any).control?.type || '-'}</span>
                                                {(test as any).control?.risk && (
                                                    <span className="bg-red-50 px-2 py-1 rounded text-red-700 font-medium border border-red-100">
                                                        İlişkili Risk: {(test as any).control.risk.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600">Test Prosedürü</label>
                                                <textarea
                                                    className="form-input w-full h-20 text-sm"
                                                    placeholder="Testin nasıl yapıldığını açıklayın..."
                                                    value={testFormData.procedure || ''}
                                                    onChange={e => setTestFormData({ ...testFormData, procedure: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600">Örneklem Büyüklüğü</label>
                                                    <input
                                                        type="number"
                                                        className="form-input w-full text-sm"
                                                        value={testFormData.sampleSize || ''}
                                                        onChange={e => setTestFormData({ ...testFormData, sampleSize: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-2">1. Tasarım Etkinliği</label>
                                            <CustomSelect
                                                value={testFormData.designEffectiveness || 'Etkin'}
                                                onChange={val => { setTestFormData({ ...testFormData, designEffectiveness: String(val) }); setManualTestResult(''); }}
                                                options={[
                                                    { value: 'Etkin', label: 'Etkin' },
                                                    { value: 'Etkin Değil', label: 'Etkin Değil (Bulgu!)' },
                                                    { value: 'Değerlendirilmedi', label: 'Değerlendirilmedi' }
                                                ]}
                                                disabled={test.status === 'Onay Bekliyor' || test.status === 'Onaylandı'}
                                                className={testFormData.designEffectiveness === 'Etkin Değil' ? 'border-red-300 bg-red-50 text-red-700' : ''}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-2">2. İşleyiş Etkinliği</label>
                                            <CustomSelect
                                                value={testFormData.operatingEffectiveness || 'Etkin'}
                                                onChange={val => { setTestFormData({ ...testFormData, operatingEffectiveness: String(val) }); setManualTestResult(''); }}
                                                options={[
                                                    { value: 'Etkin', label: 'Etkin' },
                                                    { value: 'Etkin Değil', label: 'Etkin Değil (Bulgu!)' },
                                                    { value: 'Uygulanabilir Değil', label: 'Uygulanabilir Değil' }
                                                ]}
                                                disabled={test.status === 'Onay Bekliyor' || test.status === 'Onaylandı'}
                                                className={testFormData.operatingEffectiveness === 'Etkin Değil' ? 'border-red-300 bg-red-50 text-red-700' : ''}
                                            />
                                        </div>
                                        {/* #4: Test Sonucu Override */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 block mb-2">3. Manuel Test Sonucu</label>
                                            <CustomSelect
                                                value={manualTestResult || getSuggestedResult()}
                                                onChange={val => setManualTestResult(String(val))}
                                                options={[
                                                    { value: 'Başarılı', label: 'Başarılı' },
                                                    { value: 'Kısmen Başarılı', label: 'Kısmen Başarılı' },
                                                    { value: 'Başarısız', label: 'Başarısız (Bulgu!)' },
                                                    { value: 'Değerlendirilmedi', label: 'Değerlendirilmedi' }
                                                ]}
                                                disabled={test.status === 'Onay Bekliyor' || test.status === 'Onaylandı'}
                                            />
                                            {manualTestResult && manualTestResult !== getSuggestedResult() && (
                                                <p className="text-[10px] text-amber-600 mt-1">⚠ Otomatik öneri: {getSuggestedResult()} — Müfettiş tarafından değiştirildi</p>
                                            )}
                                        </div>
                                        <div className="flex items-end justify-end gap-2 flex-wrap">
                                            <Button
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteTest(test.id)}
                                                leftIcon={<Trash2 size={16} />}
                                                size="sm"
                                                disabled={test.status === 'Onay Bekliyor' || test.status === 'Onaylandı'}
                                            >
                                                Sil
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleSaveTest(test.id, false)}
                                                leftIcon={<Save size={16} />}
                                                size="sm"
                                                disabled={test.status === 'Onay Bekliyor' || test.status === 'Onaylandı'}
                                            >
                                                Kaydet
                                            </Button>
                                            {/* İncelemeye Gönder (Maker-Checker) */}
                                            {test.status !== 'Onay Bekliyor' && test.status !== 'Onaylandı' && (
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleSaveTest(test.id, true)}
                                                    leftIcon={<Send size={16} />}
                                                    size="sm"
                                                >
                                                    İncelemeye Gönder
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t pt-4">
                                        <div className="mb-4">
                                            <FileUpload 
                                                label="Kanıtlar / Ekler"
                                                description="Desteklenen formatlar: PDF, XLSX, DOCX, JPG, PNG"
                                                multiple={false}
                                                hideList={true}
                                                onFileSelect={async (files) => {
                                                    const file = files?.[0];
                                                    if (!file) return;

                                                    try {
                                                        showToast('Dosya yükleniyor...', 'info');

                                                        // Real Upload using Workpaper API
                                                        // Evidence is technically a workpaper categorized as 'Kanıt'
                                                        const uploadedWp = await auditApi.uploadWorkpaper(auditId, file, 'Kanıt');

                                                        if (!uploadedWp || !uploadedWp.id) throw new Error('Yüklenen dosya bilgisi alınamadı');

                                                        const newEvidenceItem = {
                                                            id: uploadedWp.id,
                                                            name: uploadedWp.name,
                                                            url: `/api/audit/audits/${auditId}/workpapers/${encodeURIComponent(uploadedWp.name)}`, // Direct API link
                                                            path: uploadedWp.path
                                                        };

                                                        const currentEvidence = (testFormData as any).evidence ? JSON.parse((testFormData as any).evidence || '[]') : [];
                                                        const newEvidence = [...currentEvidence, newEvidenceItem];

                                                        setTestFormData({
                                                            ...testFormData,
                                                            // @ts-ignore
                                                            evidence: JSON.stringify(newEvidence)
                                                        });
                                                        showToast('Kanıt başarıyla yüklendi', 'success');
                                                    } catch (err) {
                                                        console.error(err);
                                                        showToast('Kanıt yüklenemedi', 'error');
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Evidence List */}
                                        {(testFormData as any).evidence && (
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    try {
                                                        const evs = JSON.parse((testFormData as any).evidence || '[]');
                                                        return Array.isArray(evs) ? evs.map((ev: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 bg-gray-50 border px-3 py-1.5 rounded text-sm group">
                                                                <FileText size={14} className="text-gray-500" />
                                                                <Tooltip content={ev.name}>
                                                                    <span className="truncate max-w-[150px]">{ev.name}</span>
                                                                </Tooltip>
                                                                <Tooltip content="Sil">
                                                                    <button
                                                                        type="button"
                                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded relative"
                                                                        onClick={() => {
                                                                            const newEvs = evs.filter((_: any, i: number) => i !== idx);
                                                                            setTestFormData({ ...testFormData, evidence: JSON.stringify(newEvs) } as any);
                                                                        }}
                                                                    >
                                                                        <XCircle size={14} />
                                                                    </button>
                                                                </Tooltip>
                                                            </div>
                                                        )) : null;
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Auto Finding Info */}
                                    {(testFormData.designEffectiveness === 'Etkin Değil' || testFormData.operatingEffectiveness === 'Etkin Değil') && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                                            <AlertTriangle size={16} />
                                            <span>Dikkat: Bu test başarısız olarak işaretlendi. "Testi Tamamla" dediğinizde otomatik bulgu oluşturma ekranı açılacaktır.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Test Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Test Adımı Ekle (RCM)"
                size="lg"
                footer={
                    <div className="w-full flex justify-end gap-3">
                        <Button
                            variant="primary"
                            onClick={handleAddSelectedControls}
                            disabled={selectedControls.length === 0}
                            leftIcon={<Plus size={18} />}
                            className="px-8 shadow-md hover:shadow-lg transition-all"
                        >
                            Seçilenleri Ekle ({selectedControls.length})
                        </Button>
                    </div>
                }
            >
                        <div className="space-y-4">
                            <div>
                                <CustomSelect
                                    label="Süreç"
                                    value={selectedProcess}
                                    onChange={(val) => handleProcessChange(String(val))}
                                    options={availableProcesses.map(p => ({ value: p.id, label: p.name }))}
                                    placeholder="Seçiniz..."
                                />
                            </div>
                            {selectedProcess && (
                                <div>
                                    <CustomSelect
                                        label="Risk"
                                        value={selectedRisk}
                                        onChange={(val) => handleRiskChange(String(val))}
                                        options={availableRisks.map(r => ({ value: r.id, label: r.name }))}
                                        placeholder="Seçiniz..."
                                    />
                                </div>
                            )}
                            {selectedRisk && (
                                <div>
                                    <label className="form-label">Kontroller (Çoklu Seçim)</label>
                                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                                        {availableControls.length === 0 ? <div className="text-sm text-gray-400 p-2">Kontrol bulunamadı.</div> :
                                            availableControls.map(c => (
                                                <div key={c.id} className="flex items-center p-1">
                                                    <Checkbox
                                                        id={`control-${c.id}`}
                                                        checked={selectedControls.includes(c.id)}
                                                        onChange={(checked) => {
                                                            if (checked) setSelectedControls([...selectedControls, c.id]);
                                                            else setSelectedControls(selectedControls.filter(id => id !== c.id));
                                                        }}
                                                        className="w-full hover:bg-gray-50 p-2 rounded transition-colors"
                                                        label={
                                                            <div className="text-sm flex flex-col justify-center min-w-[200px]">
                                                                <span className="font-semibold text-gray-800">{c.name}</span>
                                                                <span className="text-xs text-gray-500 truncate w-[28rem] mt-0.5">{c.description}</span>
                                                            </div>
                                                        }
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                </div>
            </Modal>


            {/* Create Finding Modal (Triggered by Failed Test) */}
            {showFindingModal && failedTestForFinding && (
                <CreateFindingModal
                    isOpen={showFindingModal}
                    onClose={() => setShowFindingModal(false)}
                    preSelectedAuditId={parseInt(auditId)}
                    onSuccess={() => {
                        setShowFindingModal(false);
                        showToast('Bulgu başarıyla oluşturuldu ve test ile ilişkilendirildi.', 'success');
                    }}
                    // Pre-fill data from failed test
                    initialFinding={{
                        title: `Başarısız Kontrol Testi: ${(failedTestForFinding as any).control?.name}`,
                        description: `Test Prosedürü: ${failedTestForFinding.procedure}\n\nTest Sonucu: Başarısız\n\nTespit Edilen Eksiklikler: ${failedTestForFinding.notes || ''}`,
                        risk: 'Yüksek', // Default high risk for control failure
                        category: 'İç Kontrol',
                        controlId: failedTestForFinding.controlId,
                        auditTestId: failedTestForFinding.id,
                        // Could also link processId and riskId if we had them handy in the test object
                    }}
                />
            )}
            <ConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDeleteTest}
                title="Test Adımını Sil"
                message="Bu test adımını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                type="danger"
            />

            {/* Supervisor Review Modal */}
            <Modal
                isOpen={showReviewModal}
                onClose={() => { setShowReviewModal(false); setReviewNote(''); setReviewTargetTest(null); }}
                title="Test İnceleme — Gözetim "
                size="lg"
                footer={
                    <div className="w-full flex justify-between items-center">
                        <p className="text-xs text-gray-400">Gözetim onayı, IIA Standart 2340 gereği zorunludur.</p>
                        <div className="flex gap-3">
                            <Button
                                variant="danger"
                                onClick={() => { setReviewAction('revision'); handleSupervisorReview(); }}
                                leftIcon={<RotateCcw size={16} />}
                            >
                                Revizyon İste
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => { setReviewAction('approve'); handleSupervisorReview(); }}
                                leftIcon={<ShieldCheck size={16} />}
                                className="shadow-lg shadow-primary/20"
                            >
                                Onayla (Sign-Off)
                            </Button>
                        </div>
                    </div>
                }
            >
                {reviewTargetTest && (
                    <div className="space-y-5">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h4 className="font-bold text-blue-900 text-sm mb-2">Test Bilgileri</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-500">Kontrol:</span> <span className="font-medium">{(reviewTargetTest as any).control?.name}</span></div>
                                <div><span className="text-gray-500">Test Eden:</span> <span className="font-medium">{(reviewTargetTest as any).testedBy || '-'}</span></div>
                                <div><span className="text-gray-500">Tasarım:</span> <span className="font-medium">{reviewTargetTest.designEffectiveness}</span></div>
                                <div><span className="text-gray-500">İşleyiş:</span> <span className="font-medium">{reviewTargetTest.operatingEffectiveness}</span></div>
                                <div><span className="text-gray-500">Sonuç:</span> <span className={`font-bold ${reviewTargetTest.testResult === 'Başarısız' ? 'text-red-600' : reviewTargetTest.testResult === 'Kısmen Başarılı' ? 'text-amber-600' : 'text-green-600'}`}>{reviewTargetTest.testResult}</span></div>
                                <div><span className="text-gray-500">Örneklem:</span> <span className="font-medium">{reviewTargetTest.sampleSize || '-'}</span></div>
                            </div>
                            {reviewTargetTest.procedure && (
                                <div className="mt-3 pt-3 border-t border-blue-100">
                                    <span className="text-xs font-bold text-blue-700">Prosedür:</span>
                                    <p className="text-sm text-gray-700 mt-1">{reviewTargetTest.procedure}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                                <MessageSquare size={16} className="text-primary" />
                                İnceleme Notu (Review Note)
                            </label>
                            <textarea
                                className="form-input w-full h-28 text-sm resize-none"
                                placeholder="Testle ilgili görüşünüz, eksik gördüğünüz noktalar veya düzeltme talepleriniz..."
                                value={reviewNote}
                                onChange={e => setReviewNote(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Unit Warning Alert Modal */}
            <Modal
                isOpen={showUnitWarning}
                onClose={() => setShowUnitWarning(false)}
                title="Eksik Bilgi Uyarısı"
                size="sm"
                footer={
                    <div className="w-full flex justify-end">
                        <Button variant="primary" onClick={() => setShowUnitWarning(false)}>
                            Anladım
                        </Button>
                    </div>
                }
            >
                <div className="text-center py-4">
                    <AlertTriangle size={48} className="mx-auto text-orange-400 mb-4 opacity-80" />
                    <p className="font-semibold text-gray-800 text-lg mb-2">Birim / Süreç Seçilmemiş</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Bu denetime henüz bir <b>Denetlenebilir Birim</b> veya <b>Süreç</b> atanmamıştır. RCM (Risk Kontrol Matrisi) test adımlarını yükleyebilmek için lütfen öncelikle denetim özellikleri üzerinden birim seçimi yapınız.
                    </p>
                </div>
            </Modal>
        </div>
        </div>
    );
}
