'use client';

import React, { useState, useEffect } from 'react';
import {
    FileCheck, Plus, CheckCircle, AlertTriangle, ShieldCheck, FileText,
    Camera, Image as ImageIcon, Video, FileSpreadsheet, MessageSquare,
    Link, Eye, Info, X, Ban, RefreshCw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import PersonCell from '@/components/ui/PersonCell';
import { auditApi } from '@/lib/audit-api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

interface FindingEvidenceTabProps {
    findingId: string;
    findingTitle?: string;
}

export default function FindingEvidenceTab({ findingId, findingTitle }: FindingEvidenceTabProps) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [chainData, setChainData] = useState<any | null>(null);
    const [docReferences, setDocReferences] = useState<any[]>([]);
    const [companyDocs, setCompanyDocs] = useState<any[]>([]);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInvalidateModal, setShowInvalidateModal] = useState(false);
    const [showLinkDocModal, setShowLinkDocModal] = useState(false);
    const [targetEvidenceId, setTargetEvidenceId] = useState<string | null>(null);

    // Form States
    const [ad, setAd] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [kanitTuru, setKanitTuru] = useState('Belge');
    const [eldeEdilmeYontemi, setEldeEdilmeYontemi] = useState('');
    const [kaynagi, setKaynagi] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Invalidate Form
    const [gerekce, setGerekce] = useState('');

    // Link Doc Form
    const [selectedDocId, setSelectedDocId] = useState('');
    const [docAtifAciklama, setDocAtifAciklama] = useState('');

    useEffect(() => {
        if (findingId) {
            loadEvidences();
        }
    }, [findingId]);

    const loadEvidences = async () => {
        setLoading(true);
        try {
            const [chain, refs, docs] = await Promise.all([
                auditApi.getEvidenceChain(findingId),
                auditApi.getDocumentReferences('BULGU', findingId),
                auditApi.getCompanyDocuments()
            ]);
            setChainData(chain);
            setDocReferences(Array.isArray(refs) ? refs : []);
            setCompanyDocs(Array.isArray(docs) ? docs : []);
        } catch (error) {
            console.error('Failed to load evidence data:', error);
            showToast('Kanıt verileri yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAttachEvidence = async () => {
        if (!ad.trim()) {
            showToast('Lütfen kanıt adını giriniz.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await auditApi.attachEvidence({
                kaynakTuru: 'BULGU',
                kaynakId: findingId,
                ad: ad.trim(),
                aciklama: aciklama.trim(),
                kanitTuru,
                eldeEdilmeYontemi: eldeEdilmeYontemi.trim(),
                kaynagi: kaynagi.trim()
            });

            showToast('Kanıt kaydı başarıyla eklendi.', 'success');
            setShowAddModal(false);
            resetAddForm();
            loadEvidences();
        } catch (error: any) {
            console.error('Failed to attach evidence:', error);
            showToast(error.message || 'Kanıt eklenemedi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (evidenceId: string, yukleyenId: string) => {
        if (user?.id === yukleyenId) {
            showToast('Kendi yüklediğiniz kanıtı doğrulayamazsınız (Bağımsızlık kuralı).', 'warning');
            return;
        }

        try {
            await auditApi.verifyEvidence(evidenceId);
            showToast('Kanıt başarıyla doğrulandı.', 'success');
            loadEvidences();
        } catch (error: any) {
            showToast(error.message || 'Doğrulama başarısız oldu.', 'error');
        }
    };

    const handleInvalidate = async () => {
        if (!targetEvidenceId || !gerekce.trim()) {
            showToast('Lütfen geçersiz kılma gerekçesini yazınız.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await auditApi.invalidateEvidence(targetEvidenceId, gerekce.trim());
            showToast('Kanıt geçersiz kılındı.', 'info');
            setShowInvalidateModal(false);
            setTargetEvidenceId(null);
            setGerekce('');
            loadEvidences();
        } catch (error: any) {
            showToast(error.message || 'İşlem başarısız.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLinkDoc = async () => {
        if (!selectedDocId) {
            showToast('Lütfen bir şirket dokümanı seçiniz.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await auditApi.linkDocumentToEntity({
                dokumanId: selectedDocId,
                kaynakTuru: 'BULGU',
                kaynakId: findingId,
                aciklama: docAtifAciklama.trim()
            });
            showToast('Şirket dokümanı atıf kaydı eklendi.', 'success');
            setShowLinkDocModal(false);
            setSelectedDocId('');
            setDocAtifAciklama('');
            loadEvidences();
        } catch (error: any) {
            showToast(error.message || 'Atıf eklenemedi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAddForm = () => {
        setAd('');
        setAciklama('');
        setKanitTuru('Belge');
        setEldeEdilmeYontemi('');
        setKaynagi('');
    };

    const getKanitTuruIcon = (turu: string) => {
        switch (turu) {
            case 'Ekran Görüntüsü': return <ImageIcon size={14} className="text-blue-500" />;
            case 'Sistem Çıktısı': return <FileSpreadsheet size={14} className="text-emerald-500" />;
            case 'Mülakat Notu': return <MessageSquare size={14} className="text-purple-500" />;
            case 'Fotoğraf': return <Camera size={14} className="text-amber-500" />;
            case 'Video': return <Video size={14} className="text-rose-500" />;
            default: return <FileText size={14} className="text-slate-500" />;
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin text-teal-600" size={18} />
                <span className="text-xs font-medium">Kanıt ve doküman izlenebilirlik verileri yükleniyor...</span>
            </div>
        );
    }

    const directEvidences = chainData?.directEvidences || [];
    const actionEvidences = chainData?.actionEvidences || [];
    const programStepEvidences = chainData?.programStepEvidences || [];

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <FileCheck size={18} className="text-teal-600" />
                        Kanıt İzlenebilirliği ve Mevzuat Atıfları
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        IIA Standartları gereği bu bulguya bağlı doğrulama kanıtları ve şirket içi mevzuat doküman atıfları.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowLinkDocModal(true)} leftIcon={<Link size={14} />}>
                        Doküman Atıfı Ekle
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} leftIcon={<Plus size={14} />}>
                        Yeni Kanıt Yükle
                    </Button>
                </div>
            </div>

            {/* Linked Company Documents */}
            {docReferences.length > 0 && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Link size={14} className="text-blue-600" />
                        Atıf Yapılan Şirket İçi Mevzuat Dokümanları ({docReferences.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {docReferences.map(ref => (
                            <div key={ref.id} className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between shadow-xs">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                            {ref.dokuman?.kod || 'KODSUZ'}
                                        </span>
                                        <span className="font-semibold text-xs text-slate-800">
                                            {ref.dokuman?.ad} (v{ref.dokuman?.versiyon})
                                        </span>
                                    </div>
                                    {ref.aciklama && (
                                        <p className="text-xs text-slate-600 italic">Madde/İhlal: {ref.aciklama}</p>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">
                                    {ref.dokuman?.tur}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Direct Finding Evidences */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-600" />
                    Doğrudan Bulgu Kanıtları ({directEvidences.length})
                </h4>

                {directEvidences.length === 0 ? (
                    <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                        Bu bulguya ait henüz doğrudan kayıtlı bir doğrulama kanıtı bulunmuyor.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {directEvidences.map((ev: any) => {
                            const isUploader = user?.id === ev.yukleyenId;
                            return (
                                <div
                                    key={ev.id}
                                    className={`p-4 rounded-xl border transition-all bg-white shadow-xs ${
                                        ev.gecersizMi ? 'border-red-200 bg-red-50/20' : ev.dogrulandiMi ? 'border-emerald-200' : 'border-slate-200'
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                    {getKanitTuruIcon(ev.kanitTuru)}
                                                    {ev.kanitTuru}
                                                </span>
                                                <h5 className={`font-bold text-sm ${ev.gecersizMi ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                    {ev.ad}
                                                </h5>
                                                {ev.gecersizMi ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                                                        <Ban size={12} />
                                                        Geçersiz Kılındı
                                                    </span>
                                                ) : ev.dogrulandiMi ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                                                        <CheckCircle size={12} />
                                                        Doğrulandı
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        Doğrulama Bekliyor
                                                    </span>
                                                )}
                                            </div>

                                            {ev.aciklama && (
                                                <p className="text-xs text-slate-600">{ev.aciklama}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                                                {ev.kaynagi && (
                                                    <span><strong>Kaynak:</strong> {ev.kaynagi}</span>
                                                )}
                                                {ev.eldeEdilmeYontemi && (
                                                    <span><strong>Yöntem:</strong> {ev.eldeEdilmeYontemi}</span>
                                                )}
                                                <span><strong>Tarih:</strong> {new Date(ev.eldeEdilmeTarihi || ev.createdAt).toLocaleDateString('tr-TR')}</span>
                                            </div>

                                            {ev.gecersizMi && (
                                                <p className="text-xs bg-red-100 p-2 rounded text-red-800 font-medium">
                                                    <strong>Geçersizlik Gerekçesi:</strong> {ev.gecersizlikGerekcesi}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions & Meta */}
                                        <div className="flex flex-col items-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-400 block mb-0.5">Yükleyen</span>
                                                <PersonCell name={ev.yukleyen?.displayName || 'Müfettiş'} title={ev.yukleyen?.title} size="sm" />
                                            </div>

                                            {!ev.gecersizMi && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {!ev.dogrulandiMi && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            disabled={isUploader}
                                                            title={isUploader ? 'Yükleyen kendi kanıtını doğrulayamaz' : undefined}
                                                            onClick={() => handleVerify(ev.id, ev.yukleyenId)}
                                                            leftIcon={<CheckCircle size={12} />}
                                                        >
                                                            {isUploader ? 'Kendi Kaydınız' : 'Doğrula'}
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            setTargetEvidenceId(ev.id);
                                                            setShowInvalidateModal(true);
                                                        }}
                                                    >
                                                        Geçersiz Kıl
                                                    </Button>
                                                </div>
                                            )}

                                            {ev.dogrulandiMi && ev.dogrulayan && (
                                                <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-right">
                                                    Doğrulayan: {ev.dogrulayan.displayName} ({new Date(ev.dogrulamaTarihi).toLocaleDateString('tr-TR')})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Evidence Chain (Program Step & Action Evidences) */}
            {(programStepEvidences.length > 0 || actionEvidences.length > 0) && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Info size={16} className="text-indigo-600" />
                        İlişkili Kanıt Zinciri ({programStepEvidences.length + actionEvidences.length})
                    </h4>

                    {/* Program Step Evidences */}
                    {programStepEvidences.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Denetim Programı Test Adımı Kanıtları ({programStepEvidences.length})
                            </h5>
                            <div className="space-y-2">
                                {programStepEvidences.map((ev: any) => (
                                    <div key={ev.id} className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            {getKanitTuruIcon(ev.kanitTuru)}
                                            <span className="font-semibold text-slate-800">{ev.ad}</span>
                                            <span className="text-slate-500">({ev.kanitTuru})</span>
                                        </div>
                                        <span className="text-slate-400">Yükleyen: {ev.yukleyen?.displayName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Evidences */}
                    {actionEvidences.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Aksiyon Kapatma Kanıtları ({actionEvidences.length})
                            </h5>
                            <div className="space-y-2">
                                {actionEvidences.map((ev: any) => (
                                    <div key={ev.id} className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            {getKanitTuruIcon(ev.kanitTuru)}
                                            <span className="font-semibold text-slate-800">{ev.ad}</span>
                                            <span className="text-slate-500">({ev.kanitTuru})</span>
                                        </div>
                                        <span className="text-slate-400">Yükleyen: {ev.yukleyen?.displayName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Evidence Modal */}
            {showAddModal && (
                <div className="modal-overlay open" onClick={() => setShowAddModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Yeni Kanıt Kaydı Yükle</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Kanıt Adı / Tanımı *
                                </label>
                                <FormInput
                                    type="text"
                                    value={ad}
                                    onChange={e => setAd(e.target.value)}
                                    placeholder="Örn: 2026 Q2 Kredi Komitesi Karar Tutanağı"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Kanıt Türü *
                                    </label>
                                    <CustomSelect
                                        value={kanitTuru}
                                        onChange={val => setKanitTuru(val as string)}
                                        options={[
                                            { value: 'Belge', label: 'Belge / Doküman' },
                                            { value: 'Ekran Görüntüsü', label: 'Ekran Görüntüsü' },
                                            { value: 'Sistem Çıktısı', label: 'Sistem Çıktısı / Log' },
                                            { value: 'Mülakat Notu', label: 'Mülakat / İfade Notu' },
                                            { value: 'Fotoğraf', label: 'Fotoğraf' },
                                            { value: 'Video', label: 'Video Kaydı' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Kanıtın Kaynağı (Birim/Kişi)
                                    </label>
                                    <FormInput
                                        type="text"
                                        value={kaynagi}
                                        onChange={e => setKaynagi(e.target.value)}
                                        placeholder="Örn: Kredi Operasyon Bm."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Elde Edilme Yöntemi
                                </label>
                                <FormInput
                                    type="text"
                                    value={eldeEdilmeYontemi}
                                    onChange={e => setEldeEdilmeYontemi(e.target.value)}
                                    placeholder="Örn: Yerinde İnceleme / Sistem Sorgusu"
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Açıklama / Detay
                                </label>
                                <FormTextarea
                                    rows={3}
                                    value={aciklama}
                                    onChange={e => setAciklama(e.target.value)}
                                    placeholder="Kanıtın bulguyu nasıl desteklediğine dair notlar..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleAttachEvidence} disabled={isSubmitting}>
                                    {isSubmitting ? 'Kaydediliyor...' : 'Kanıtı Kaydet'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invalidate Evidence Modal */}
            {showInvalidateModal && (
                <div className="modal-overlay open" onClick={() => setShowInvalidateModal(false)}>
                    <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50">
                            <h3 className="text-base font-bold text-red-800 flex items-center gap-2">
                                <Ban size={18} />
                                Kanıtı Geçersiz Kıl
                            </h3>
                            <button onClick={() => setShowInvalidateModal(false)} className="p-1.5 hover:bg-red-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-slate-600">
                                IIA standartları ve veri bütünlüğü gereğince kanıtlar silinemez. Yalnızca gerekçe belirtilerek <strong>Geçersiz</strong> olarak işaretlenebilir.
                            </p>
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Geçersiz Kılma Gerekçesi *
                                </label>
                                <FormTextarea
                                    rows={3}
                                    value={gerekce}
                                    onChange={e => setGerekce(e.target.value)}
                                    placeholder="Örn: Hatalı tarihe ait ekstre yüklenmiş, yeni ekstre ile güncellenecektir..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowInvalidateModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="danger" onClick={handleInvalidate} disabled={isSubmitting}>
                                    {isSubmitting ? 'İşleniyor...' : 'Geçersiz Kıl'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Company Document Modal */}
            {showLinkDocModal && (
                <div className="modal-overlay open" onClick={() => setShowLinkDocModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Link size={18} className="text-blue-600" />
                                Şirket Dokümanı / Mevzuat Atıfı Ekle
                            </h3>
                            <button onClick={() => setShowLinkDocModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    İlgili Şirket Dokümanı *
                                </label>
                                <CustomSelect
                                    value={selectedDocId}
                                    onChange={val => setSelectedDocId(val as string)}
                                    options={companyDocs.map(d => ({
                                        value: d.id,
                                        label: `${d.kod} - ${d.ad} (v${d.versiyon})`
                                    }))}
                                    placeholder="Şirket içi mevzuat / doküman seçiniz..."
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Atıf Yapılan Madde / İhlal Notu
                                </label>
                                <FormInput
                                    type="text"
                                    value={docAtifAciklama}
                                    onChange={e => setDocAtifAciklama(e.target.value)}
                                    placeholder="Örn: Madde 14/B - Kredi Komitesi Onay Limiti İhlali"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowLinkDocModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleLinkDoc} disabled={isSubmitting}>
                                    {isSubmitting ? 'Ekleniyor...' : 'Atıf Ekle'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
