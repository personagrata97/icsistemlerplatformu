'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, CheckCircle2, Clock, AlertCircle, User, Edit3, ChevronRight, FileText, Check, X, ListChecks } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import PersonCell from '@/components/ui/PersonCell';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';

interface AuditProgramTabProps {
    auditId: string;
    allStaff: any[];
    canEdit?: boolean;
}

const AuditProgramTab: React.FC<AuditProgramTabProps> = ({
    auditId,
    allStaff = [],
    canEdit = true
}) => {
    const { showToast } = useToast();
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Program Modal
    const [showAddProgramModal, setShowAddProgramModal] = useState(false);
    const [programBaslik, setProgramBaslik] = useState('');
    const [programAciklama, setProgramAciklama] = useState('');
    const [programSorumluId, setProgramSorumluId] = useState('');
    const [programPlanlananGun, setProgramPlanlananGun] = useState(3);

    // Create Step Modal
    const [showAddStepModal, setShowAddStepModal] = useState(false);
    const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
    const [stepTestAdimi, setStepTestAdimi] = useState('');
    const [stepYontem, setStepYontem] = useState('');
    const [stepBeklenenKanit, setStepBeklenenKanit] = useState('');
    const [stepSorumluId, setStepSorumluId] = useState('');

    // Edit Step Result Modal
    const [editingStep, setEditingStep] = useState<any | null>(null);
    const [stepDurum, setStepDurum] = useState('Planlandı');
    const [stepSonuc, setStepSonuc] = useState('');
    const [stepNotlar, setStepNotlar] = useState('');

    const loadPrograms = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getAuditProgram(auditId);
            setPrograms(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load audit programs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auditId) {
            loadPrograms();
        }
    }, [auditId]);

    const handleCreateProgram = async () => {
        if (!programBaslik.trim()) {
            showToast('Lütfen program başlığını giriniz', 'warning');
            return;
        }
        try {
            await auditApi.createAuditProgram(auditId, {
                baslik: programBaslik,
                aciklama: programAciklama,
                sorumluId: programSorumluId || undefined,
                planlananGun: Number(programPlanlananGun) || 0
            });
            showToast('Denetim programı başarıyla oluşturuldu', 'success');
            setShowAddProgramModal(false);
            setProgramBaslik('');
            setProgramAciklama('');
            setProgramSorumluId('');
            loadPrograms();
        } catch (err: any) {
            showToast(err.message || 'Program oluşturulurken hata oluştu', 'error');
        }
    };

    const handleAddStep = async () => {
        if (!activeProgramId || !stepTestAdimi.trim()) {
            showToast('Lütfen test adımını giriniz', 'warning');
            return;
        }
        try {
            await auditApi.addAuditProgramStep(activeProgramId, {
                testAdimi: stepTestAdimi,
                yontem: stepYontem,
                beklenenKanit: stepBeklenenKanit,
                sorumluId: stepSorumluId || undefined
            });
            showToast('Program test adımı eklendi', 'success');
            setShowAddStepModal(false);
            setStepTestAdimi('');
            setStepYontem('');
            setStepBeklenenKanit('');
            setStepSorumluId('');
            loadPrograms();
        } catch (err: any) {
            showToast(err.message || 'Test adımı eklenirken hata oluştu', 'error');
        }
    };

    const handleUpdateStep = async () => {
        if (!editingStep) return;
        try {
            await auditApi.updateAuditProgramStep(editingStep.id, {
                durum: stepDurum,
                sonuc: stepSonuc,
                notlar: stepNotlar
            });
            showToast('Test adımı sonucu güncellendi', 'success');
            setEditingStep(null);
            loadPrograms();
        } catch (err: any) {
            showToast(err.message || 'Güncelleme yapılırken hata oluştu', 'error');
        }
    };

    const getStatusBadge = (durum: string) => {
        switch (durum) {
            case 'Tamamlandı':
            case 'Uygun':
                return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs font-semibold">Tamamlandı</span>;
            case 'Devam Ediyor':
            case 'Devam':
                return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold">Devam Ediyor</span>;
            case 'Bulgu Oluştu':
                return <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded text-xs font-semibold">Bulgu Oluştu</span>;
            default:
                return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">Planlandı</span>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Denetim programı yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardCheck size={22} className="text-primary" /> Denetim Programı ve Test Adımları
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Saha çalışmasında uygulanacak denetim prosedürleri ve test adımlarının takibi
                    </p>
                </div>
                {canEdit && (
                    <Button size="sm" onClick={() => setShowAddProgramModal(true)} leftIcon={<Plus size={16} />}>
                        Yeni Program Başlığı Ekle
                    </Button>
                )}
            </div>

            {/* Programs List */}
            {programs.length > 0 ? (
                programs.map((program: any, pIdx: number) => (
                    <div key={program.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                                    {program.sira || pIdx + 1}
                                </span>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-base">{program.baslik}</h4>
                                    {program.aciklama && (
                                        <p className="text-xs text-slate-500 mt-0.5">{program.aciklama}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusBadge(program.durum)}
                                {program.sorumlu && (
                                    <span className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200 font-medium">
                                        Sorumlu: {program.sorumlu.displayName || program.sorumlu.title}
                                    </span>
                                )}
                                {canEdit && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            setActiveProgramId(program.id);
                                            setShowAddStepModal(true);
                                        }}
                                        leftIcon={<Plus size={14} />}
                                    >
                                        Test Adımı Ekle
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Steps List */}
                        <div className="divide-y divide-slate-100">
                            {program.steps && program.steps.length > 0 ? (
                                program.steps.map((step: any, sIdx: number) => (
                                    <div key={step.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-bold text-slate-400">
                                                    #{program.sira || pIdx + 1}.{step.sira || sIdx + 1}
                                                </span>
                                                <h5 className="font-semibold text-sm text-slate-800">{step.testAdimi}</h5>
                                            </div>

                                            {step.yontem && (
                                                <p className="text-xs text-slate-600">
                                                    <strong className="text-slate-700">Yöntem:</strong> {step.yontem}
                                                </p>
                                            )}

                                            {step.beklenenKanit && (
                                                <p className="text-xs text-slate-500 italic">
                                                    Beklenen Kanıt: {step.beklenenKanit}
                                                </p>
                                            )}

                                            {step.sonuc && (
                                                <div className="mt-2 text-xs bg-slate-100 p-2 rounded border border-slate-200 text-slate-800">
                                                    <strong className="text-slate-900">Test Sonucu:</strong> {step.sonuc}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {getStatusBadge(step.durum)}
                                            {canEdit && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    leftIcon={<Edit3 size={14} />}
                                                    onClick={() => {
                                                        setEditingStep(step);
                                                        setStepDurum(step.durum || 'Planlandı');
                                                        setStepSonuc(step.sonuc || '');
                                                        setStepNotlar(step.notlar || '');
                                                    }}
                                                >
                                                    Sonuç Gir
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-xs text-slate-500 italic">
                                    Bu program başlığı altında henüz tanımlanmış test adımı bulunmuyor.
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                    <ListChecks size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-base font-semibold text-slate-700">Henüz Denetim Programı Tanımlanmadı</p>
                    <p className="text-xs text-slate-500 mt-1">Saha çalışmasına başlamak için denetim programı başlıkları ve test adımlarını ekleyin.</p>
                </div>
            )}

            {/* Add Program Modal */}
            {showAddProgramModal && (
                <div className="modal-overlay open" onClick={() => setShowAddProgramModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Yeni Denetim Programı Başlığı</h3>
                            <button onClick={() => setShowAddProgramModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Program Başlığı *
                                </label>
                                <FormInput
                                    type="text"
                                    value={programBaslik}
                                    onChange={e => setProgramBaslik(e.target.value)}
                                    placeholder="Örn: Kredi Tahsis Süreçleri Kontrolü"
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Açıklama / Amaç
                                </label>
                                <FormTextarea
                                    rows={3}
                                    value={programAciklama}
                                    onChange={e => setProgramAciklama(e.target.value)}
                                    placeholder="Program kapsamındaki amaçlar..."
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Sorumlu Müfettiş
                                </label>
                                <CustomSelect
                                    value={programSorumluId}
                                    onChange={(val) => setProgramSorumluId(val as string)}
                                    options={allStaff.map(s => ({ value: s.id, label: s.name || s.displayName }))}
                                    placeholder="Sorumlu seçiniz..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowAddProgramModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleCreateProgram}>
                                    Program Oluştur
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Step Modal */}
            {showAddStepModal && (
                <div className="modal-overlay open" onClick={() => setShowAddStepModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Test Adımı Ekle</h3>
                            <button onClick={() => setShowAddStepModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Test Adımı Açıklaması *
                                </label>
                                <FormTextarea
                                    rows={2}
                                    value={stepTestAdimi}
                                    onChange={e => setStepTestAdimi(e.target.value)}
                                    placeholder="Gerçekleştirilecek test adımını detaylı yazınız..."
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Test Yöntemi (Sorgulama, Örnekleme vb.)
                                </label>
                                <FormInput
                                    type="text"
                                    value={stepYontem}
                                    onChange={e => setStepYontem(e.target.value)}
                                    placeholder="Örn: %100 Populasyon Veri Analizi"
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Beklenen Kanıt / Belge
                                </label>
                                <FormInput
                                    type="text"
                                    value={stepBeklenenKanit}
                                    onChange={e => setStepBeklenenKanit(e.target.value)}
                                    placeholder="Örn: Kredi Onay Komitesi Karar Tutanağı"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowAddStepModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleAddStep}>
                                    Test Adımını Kaydet
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Step Result Modal */}
            {editingStep && (
                <div className="modal-overlay open" onClick={() => setEditingStep(null)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Test Sonucu ve Değerlendirme</h3>
                            <button onClick={() => setEditingStep(null)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Test Durumu *
                                </label>
                                <CustomSelect
                                    value={stepDurum}
                                    onChange={(val) => setStepDurum(val as string)}
                                    options={[
                                        { value: 'Planlandı', label: 'Planlandı' },
                                        { value: 'Devam Ediyor', label: 'Devam Ediyor' },
                                        { value: 'Tamamlandı', label: 'Tamamlandı (Uygun)' },
                                        { value: 'Bulgu Oluştu', label: 'Bulgu Oluştu' }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Test Sonucu / Tespiti
                                </label>
                                <FormTextarea
                                    rows={4}
                                    value={stepSonuc}
                                    onChange={e => setStepSonuc(e.target.value)}
                                    placeholder="Yapılan test ve sonucunu açıklayınız..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setEditingStep(null)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleUpdateStep}>
                                    Sonucu Kaydet
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditProgramTab;
