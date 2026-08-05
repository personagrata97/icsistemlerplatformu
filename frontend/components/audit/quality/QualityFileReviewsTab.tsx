'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, AlertTriangle, AlertCircle, Clock, User, ShieldCheck, ChevronRight, Save, X, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import PersonCell from '@/components/ui/PersonCell';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';

interface QualityFileReviewsTabProps {
    onRefreshNeeded?: () => void;
}

const QualityFileReviewsTab: React.FC<QualityFileReviewsTabProps> = ({ onRefreshNeeded }) => {
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [completedAudits, setCompletedAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Selected Active Review for Evaluation
    const [activeReview, setActiveReview] = useState<any | null>(null);

    // New Review Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAuditId, setSelectedAuditId] = useState('');
    const [reviewType, setReviewType] = useState('İÇ_DEĞERLENDİRME');
    const [isCreating, setIsCreating] = useState(false);

    // Evaluation State
    const [itemStates, setItemStates] = useState<{ [key: string]: { sonuc: string, bulgu: string, oneri: string } }>({});

    // Complete Modal State
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [genelSonuc, setGenelSonuc] = useState('Yeterli');
    const [ozet, setOzet] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [revList, auditsList] = await Promise.all([
                auditApi.getQualityReviews(),
                auditApi.getAudits({ status: 'Tamamlandı' })
            ]);
            setReviews(Array.isArray(revList) ? revList : []);
            setCompletedAudits(Array.isArray(auditsList) ? auditsList : auditsList?.audits || []);
        } catch (err) {
            console.error('Failed to load quality reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStartFromChecklist = async () => {
        if (!selectedAuditId) {
            showToast('Lütfen kalite gözden geçirmesi yapılacak tamamlanmış denetimi seçiniz', 'warning');
            return;
        }
        setIsCreating(true);
        try {
            const newRev = await auditApi.createQualityReviewFromChecklist({
                auditId: selectedAuditId,
                tur: reviewType
            });
            showToast('Şablondan dosya gözden geçirmesi oluşturuldu', 'success');
            setShowCreateModal(false);
            setSelectedAuditId('');
            loadData();
            openReviewEvaluation(newRev);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'Gözden geçirme oluşturulamadı', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const openReviewEvaluation = (review: any) => {
        setActiveReview(review);
        const initialState: any = {};
        if (review.items) {
            review.items.forEach((item: any) => {
                initialState[item.id] = {
                    sonuc: item.sonuc || 'Uygun',
                    bulgu: item.bulgu || '',
                    oneri: item.oneri || ''
                };
            });
        }
        setItemStates(initialState);
    };

    const handleSaveItem = async (itemId: string) => {
        const state = itemStates[itemId];
        if (!state) return;

        // KURAL 3: "Uygun Değil" sonucu olan her madde için öneri zorunlu.
        if (state.sonuc === 'Uygun Değil' && (!state.oneri || !state.oneri.trim())) {
            showToast('"Uygun Değil" sonucu seçilen kontrollerde öneri alanı zorunludur!', 'error');
            return;
        }

        try {
            await auditApi.updateQualityReviewItem(itemId, {
                sonuc: state.sonuc,
                bulgu: state.bulgu,
                oneri: state.oneri
            });
            showToast('Kontrol maddesi kaydedildi', 'success');
        } catch (err: any) {
            showToast(err.message || 'Kaydedilemedi', 'error');
        }
    };

    const handleCompleteReview = async () => {
        if (!activeReview) return;

        // Validation check for Uygun Değil
        if (activeReview.items) {
            for (const item of activeReview.items) {
                const state = itemStates[item.id] || item;
                if (state.sonuc === 'Uygun Değil' && (!state.oneri || !state.oneri.trim())) {
                    showToast(`"${item.kontrolBasligi}" maddesi "Uygun Değil" olarak işaretlenmiş, öneri giriniz!`, 'error');
                    return;
                }
            }
        }

        try {
            await auditApi.completeQualityReview(activeReview.id, {
                genelSonuc,
                ozet
            });
            showToast('Gözden geçirme raporu tamamlandı', 'success');
            setShowCompleteModal(false);
            setActiveReview(null);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'İşlem başarısız', 'error');
        }
    };

    const getGenelSonucBadge = (res?: string) => {
        switch (res) {
            case 'Yeterli':
                return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">Yeterli</span>;
            case 'Kısmen Yeterli':
                return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">Kısmen Yeterli</span>;
            case 'Yetersiz':
                return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">Yetersiz</span>;
            default:
                return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium">Değerlendiriliyor</span>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Kalite dosya gözden geçirmeleri yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {/* If Evaluation Mode is open */}
            {activeReview ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <button
                                onClick={() => setActiveReview(null)}
                                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 mb-1"
                            >
                                ← Gözden Geçirme Listesine Dön
                            </button>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="text-primary" size={22} />
                                {activeReview.audit?.title || 'Denetim Gözden Geçirme'} ({activeReview.audit?.auditCode})
                            </h3>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                <span>Gözden Geçiren: <strong>{activeReview.gozdenGeciren?.displayName || 'Kullanıcı'}</strong></span>
                                <span>•</span>
                                <span>Tür: <strong>{activeReview.tur === 'IC_DEGERLENDIRME' ? 'İç Değerlendirme' : 'Dış Değerlendirme'}</strong></span>
                                <span>•</span>
                                <span>Durum: <strong>{activeReview.durum}</strong></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeReview.durum !== 'Tamamlandı' && (
                                <Button
                                    variant="primary"
                                    leftIcon={<CheckCircle size={16} />}
                                    onClick={() => setShowCompleteModal(true)}
                                >
                                    Değerlendirmeyi Tamamla
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Review Items grouped by Category */}
                    <div className="space-y-6">
                        {['Planlama', 'Saha', 'Kanıt', 'Raporlama', 'İzleme'].map((cat: string) => {
                            const catItems = activeReview.items?.filter((i: any) => i.kategori === cat) || [];
                            if (catItems.length === 0) return null;

                            return (
                                <div key={cat} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                            {cat} Aşaması Kontrol Değerlendirmeleri ({catItems.length})
                                        </h4>
                                    </div>

                                    <div className="divide-y divide-slate-100 p-4 space-y-4">
                                        {catItems.map((item: any, idx: number) => {
                                            const st = itemStates[item.id] || { sonuc: item.sonuc || 'Uygun', bulgu: item.bulgu || '', oneri: item.oneri || '' };
                                            const isUygunDegil = st.sonuc === 'Uygun Değil';

                                            return (
                                                <div key={item.id} className={`p-4 rounded-lg border transition-all ${isUygunDegil ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/40 border-slate-200'}`}>
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                                        <div className="font-semibold text-sm text-slate-800">
                                                            {idx + 1}. {item.kontrolBasligi}
                                                        </div>
                                                        <div className="w-48 shrink-0">
                                                            <CustomSelect
                                                                value={st.sonuc}
                                                                onChange={(val) => {
                                                                    setItemStates({
                                                                        ...itemStates,
                                                                        [item.id]: { ...st, sonuc: val as string }
                                                                    });
                                                                }}
                                                                options={[
                                                                    { value: 'Uygun', label: 'Uygun' },
                                                                    { value: 'Kısmen', label: 'Kısmen Uygun' },
                                                                    { value: 'Uygun Değil', label: 'Uygun Değil (Öneri Zorunlu)' },
                                                                    { value: 'Uygulanamaz', label: 'Uygulanamaz' }
                                                                ]}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-semibold text-slate-600 block mb-1">
                                                                Tespit / Gözlem Notu
                                                            </label>
                                                            <FormTextarea
                                                                rows={2}
                                                                value={st.bulgu}
                                                                onChange={e => setItemStates({
                                                                    ...itemStates,
                                                                    [item.id]: { ...st, bulgu: e.target.value }
                                                                })}
                                                                placeholder="Varsa tespitiniz..."
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className={`text-xs font-semibold block mb-1 ${isUygunDegil ? 'text-red-700 font-bold' : 'text-slate-600'}`}>
                                                                İyileştirme Önerisi {isUygunDegil && '*'}
                                                            </label>
                                                            <FormTextarea
                                                                rows={2}
                                                                value={st.oneri}
                                                                onChange={e => setItemStates({
                                                                    ...itemStates,
                                                                    [item.id]: { ...st, oneri: e.target.value }
                                                                })}
                                                                placeholder={isUygunDegil ? 'Uygun Değil için öneri girilmesi ZORUNLUDUR...' : 'Öneri...'}
                                                            />
                                                        </div>
                                                    </div>

                                                    {activeReview.durum !== 'Tamamlandı' && (
                                                        <div className="mt-3 flex justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => handleSaveItem(item.id)}
                                                                leftIcon={<Save size={14} />}
                                                            >
                                                                Maddeyi Kaydet
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Reviews List View */
                <div className="space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck size={22} className="text-primary" /> Tamamlanmış Denetim Dosyası Gözden Geçirmeleri
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Uluslararası IIA ve Kurum içi kalite standartlarına göre tamamlanmış denetimlerin dosya bazlı kalite kontrolü
                            </p>
                        </div>
                        <Button size="sm" onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />}>
                            Şablondan Gözden Geçirme Başlat
                        </Button>
                    </div>

                    {/* Review Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.length > 0 ? (
                            reviews.map((rev: any) => (
                                <div
                                    key={rev.id}
                                    onClick={() => openReviewEvaluation(rev)}
                                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/50 group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                                {rev.audit?.auditCode || 'D-000'}
                                            </span>
                                            {getGenelSonucBadge(rev.genelSonuc)}
                                        </div>

                                        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-base mb-2">
                                            {rev.audit?.title || 'Denetim Başlığı'}
                                        </h4>

                                        <div className="text-xs text-slate-500 space-y-1 mb-4">
                                            <div className="flex items-center gap-1.5">
                                                <User size={14} className="text-slate-400" />
                                                <span>Gözden Geçiren: <strong>{rev.gozdenGeciren?.displayName || 'Kullanıcı'}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-slate-400" />
                                                <span>Başlangıç: {new Date(rev.baslangicTarihi).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>

                                        {rev.ozet && (
                                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 italic line-clamp-2">
                                                "{rev.ozet}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-primary">
                                        <span>Detaylı Değerlendirme ({rev.items?.length || 0} Madde)</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-base font-semibold text-slate-700">Henüz Dosya Gözden Geçirmesi Bulunmuyor</p>
                                <p className="text-xs text-slate-500 mt-1">Tamamlanmış denetimleriniz için hazır kalite kontrol şablonlarından gözden geçirme başlatabilirsiniz.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Review Modal */}
            {showCreateModal && (
                <div className="modal-overlay open" onClick={() => setShowCreateModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Şablondan Kalite Gözden Geçirmesi Başlat</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Tamamlanmış Denetim Seçiniz *
                                </label>
                                <CustomSelect
                                    value={selectedAuditId}
                                    onChange={(val) => setSelectedAuditId(val as string)}
                                    options={completedAudits.map(a => ({
                                        value: a.id,
                                        label: `${a.title} (${a.auditCode || a.id})`
                                    }))}
                                    placeholder="Tamamlanan denetimler listesi..."
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Gözden Geçirme Türü *
                                </label>
                                <CustomSelect
                                    value={reviewType}
                                    onChange={(val) => setReviewType(val as string)}
                                    options={[
                                        { value: 'İÇ_DEĞERLENDİRME', label: 'İç Kalite Değerlendirmesi' },
                                        { value: 'DIŞ_DEĞERLENDİRME', label: 'Dış Kalite Değerlendirmesi (Bağımsız)' }
                                    ]}
                                />
                            </div>

                            <div className="p-3 bg-amber-50 text-amber-800 rounded border border-amber-200 text-xs">
                                <AlertCircle size={14} className="inline mr-1" />
                                <strong>Önemli Kural:</strong> Denetim ekibinde yer alan müfettişler kendi denetimlerini kalite gözden geçirmesinden geçiremezler.
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleStartFromChecklist} disabled={isCreating}>
                                    {isCreating ? 'Oluşturuluyor...' : 'Gözden Geçirme Başlat'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Review Modal */}
            {showCompleteModal && (
                <div className="modal-overlay open" onClick={() => setShowCompleteModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Kalite Gözden Geçirmesini Tamamla</h3>
                            <button onClick={() => setShowCompleteModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Genel Kalite Değerlendirme Sonucu *
                                </label>
                                <CustomSelect
                                    value={genelSonuc}
                                    onChange={(val) => setGenelSonuc(val as string)}
                                    options={[
                                        { value: 'Yeterli', label: 'Yeterli (Uluslararası standartlara uygun)' },
                                        { value: 'Kısmen Yeterli', label: 'Kısmen Yeterli (Gelişime açık alanlar var)' },
                                        { value: 'Yetersiz', label: 'Yetersiz (Önemli uygunsuzluklar mevcut)' }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Genel Sonuç Özeti ve Görüş
                                </label>
                                <FormTextarea
                                    rows={4}
                                    value={ozet}
                                    onChange={e => setOzet(e.target.value)}
                                    placeholder="Gözden geçirme sonucu genel kanaat ve özet değerlendirmeniz..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleCompleteReview}>
                                    Raporu Tamamla ve Onayla
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QualityFileReviewsTab;
