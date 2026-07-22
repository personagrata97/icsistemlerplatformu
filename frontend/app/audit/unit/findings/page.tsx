'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { Clock, AlertTriangle, CheckCircle, FileText, Upload, Send, Save, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function UnitFindingsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFinding, setSelectedFinding] = useState<any>(null);
    const [responseType, setResponseType] = useState<'AGREE' | 'PARTIAL' | 'DISAGREE'>('AGREE');
    const [responseReason, setResponseReason] = useState('');
    const [actionItems, setActionItems] = useState<any[]>([
        { id: '1', work: 'Kredi tahsis prosedürü güncellenecek', responsible: 'Ahmet Yılmaz', deadline: '2026-08-15', status: 'DEVAM_EDIYOR' }
    ]);
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [unitFindings, setUnitFindings] = useState<any[]>([
        {
            id: 'F-2026-01',
            kod: 'BLG-2026-014',
            konu: 'Kredi Tahsis Sürecinde Yetki Limit Aşımları ve Eksik Onaylar',
            onem: 'YÜKSEK',
            tebligTarihi: '2026-07-10',
            terminTarihi: '2026-08-10',
            kalanGun: 19,
            durum: 'TEBLIG_EDILDI',
            tespit: '2026 Q2 döneminde 14 adet ticari kredi tahsisinde şube yetki limitlerinin %15 oranında aşıldığı ve bölge onayının sisteme taranmadığı tespit edilmiştir.',
            oneri: 'Kredi tahsis yetki limitlerinin sistemsel engellemeye dönüştürülmesi ve eksik onayların tamamlanması gerekmektedir.'
        },
        {
            id: 'F-2026-02',
            kod: 'BLG-2026-022',
            konu: 'Kişisel Verilerin Saklanması ve İzinli Veri Tabanı Uyumsuzluğu',
            onem: 'ORTA',
            tebligTarihi: '2026-07-01',
            terminTarihi: '2026-08-01',
            kalanGun: 10,
            durum: 'YANIT_BEKLENIYOR',
            tespit: 'Pazarlama aramalarında onay formu taranmamış 42 müşteriye ulaşıldığı görülmüştür.',
            oneri: 'KVKK izin mekanizmasının gişe ekranında zorunlu alan haline getirilmesi.'
        }
    ]);

    const handleOpenFindingModal = (finding: any) => {
        setSelectedFinding(finding);
        setResponseType('AGREE');
        setResponseReason('');
    };

    const handleSaveDraft = () => {
        showToast('Yanıt taslağı kaydedildi.', 'info');
    };

    const handleSubmitToAuditor = async () => {
        if ((responseType === 'PARTIAL' || responseType === 'DISAGREE') && !responseReason.trim()) {
            showToast('Kısmen katılıyorum veya katılmıyorum seçeneklerinde gerekçe zorunludur.', 'warning');
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSend = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setUnitFindings(prev => prev.map(f => f.id === selectedFinding.id ? { ...f, durum: 'MÜFETTİŞE_GÖNDERİLDİ' } : f));
        setSubmitting(false);
        setIsConfirmModalOpen(false);
        setSelectedFinding(null);
        showToast(`Bulgu yanıtı ${TERMS.mufettis} değerlendirmesine başarıyla gönderildi.`, 'success');
    };

    const filteredFindings = unitFindings.filter(f =>
        f.konu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.kod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{TERMS.denetlenenBirim} İş Alanı</h2>
                    <p className="text-emerald-100 text-xs mt-1">Biriminiz adına tebliğ edilen bulguları inceleyin, yanıt verin ve aksiyon kanıtlarınızı yükleyin.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-700/60 rounded-xl text-xs font-semibold border border-emerald-500/30">
                    {TERMS.birimKisa} Portal
                </div>
            </div>

            {/* Top StatCards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Yanıt Bekleyen Bulgular"
                    value={unitFindings.filter(f => f.durum !== 'KAPANDI').length}
                    icon={Clock}
                    variant="danger"
                    infoTooltip="Termin süresi yaklaşan ve yanıt girilmesi gereken bulgular"
                />
                <StatCard
                    title="Aksiyonu Süren İşler"
                    value={1}
                    icon={AlertTriangle}
                    variant="warning"
                    infoTooltip="Birim tarafından aksiyon planı girilmiş ve uygulama safhasında olanlar"
                />
                <StatCard
                    title="Gecikmiş Aksiyonlar"
                    value={0}
                    icon={AlertTriangle}
                    variant="default"
                    infoTooltip="Termin süresi dolduğu halde tamamlanmamış aksiyonlar"
                />
                <StatCard
                    title="Kapanan Bulgular (2026)"
                    value={4}
                    icon={CheckCircle}
                    variant="success"
                    infoTooltip="Müfettiş tarafından aksiyonları onaylanarak kapatılan bulgular"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <PageToolbar
                        searchPlaceholder="Bulgu kodu veya konu ara..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                    />

                    <DataTable
                        columns={[
                            {
                                key: 'kod',
                                header: 'Bulgu Kodu',
                                width: '130px',
                                render: (item: any) => (
                                    <code className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                                        {item.kod}
                                    </code>
                                )
                            },
                            {
                                key: 'konu',
                                header: 'Bulgu Konusu & Detay',
                                sortable: true,
                                render: (item: any) => (
                                    <div>
                                        <div className="font-bold text-gray-900">{item.konu}</div>
                                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                            <span>Tebliğ: {formatDate(item.tebligTarihi)}</span>
                                            <span>•</span>
                                            <span className="text-red-600 font-semibold">Termin: {formatDate(item.terminTarihi)} ({item.kalanGun} gün kaldı)</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'onem',
                                header: 'Önem Düzeyi',
                                width: '120px',
                                render: (item: any) => <StatusBadge value={item.onem} type="risk" />
                            },
                            {
                                key: 'actions',
                                header: 'İşlem',
                                width: '150px',
                                align: 'center',
                                render: (item: any) => (
                                    <Button size="sm" variant="primary" leftIcon={<ArrowRight size={14} />} onClick={() => handleOpenFindingModal(item)}>
                                        Yanıtla & Aksiyon
                                    </Button>
                                )
                            }
                        ]}
                        data={filteredFindings}
                        searchTerm={searchTerm}
                        onClearFilters={() => setSearchTerm('')}
                        rowKey="id"
                    />
                </div>

                {/* Right Sidebar: Process Guide */}
                <div className="col-span-12 lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-3">
                        <HelpCircle size={18} className="text-emerald-700" />
                        <span>Süreç Rehberi & Beklentiler</span>
                    </div>

                    <div className="space-y-3 text-xs text-gray-600">
                        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl">
                            <strong>1. Görüş Bildirimi:</strong> Bulgu tespit ve önerisine katılım durumunuzu (Katılıyorum / Kısmen / Katılmıyorum) belirleyiniz.
                        </div>
                        <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
                            <strong>2. Aksiyon Planı:</strong> Katıldığınız hususlarda somut aksiyon adımı, sorumlu personel ve gerçekçi termin yazınız.
                        </div>
                        <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
                            <strong>3. Kanıt Yükleme:</strong> Düzeltici işlemi kanıtlayan belge veya ekran görüntülerini sisteme ekleyiniz.
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Finding Response Workspace */}
            {selectedFinding && (
                <Modal
                    isOpen={!!selectedFinding}
                    onClose={() => setSelectedFinding(null)}
                    title={`Bulgu Yanıt Alanı — ${selectedFinding.kod}`}
                    size="xl"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" leftIcon={<Save size={16} />} onClick={handleSaveDraft}>
                                Taslak Kaydet
                            </Button>
                            <Button variant="primary" leftIcon={<Send size={16} />} onClick={handleSubmitToAuditor}>
                                Müfettişe Gönder
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-5 text-sm">
                        {/* Upper Block: Finding Details */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">{selectedFinding.konu}</span>
                                <StatusBadge value={selectedFinding.onem} type="risk" />
                            </div>
                            <div className="text-xs text-gray-600">
                                <strong>Tespit:</strong> {selectedFinding.tespit}
                            </div>
                            <div className="text-xs text-emerald-800 font-medium">
                                <strong>Müfettiş Önerisi:</strong> {selectedFinding.oneri}
                            </div>
                        </div>

                        {/* Middle Block: Unit Opinion */}
                        <div>
                            <label className="form-label mb-2 block font-bold text-gray-900">1. Birim Görüşü (Zorunlu)</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setResponseType('AGREE')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${responseType === 'AGREE' ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    ✓ Katılıyorum
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResponseType('PARTIAL')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${responseType === 'PARTIAL' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    ! Kısmen Katılıyorum
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResponseType('DISAGREE')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${responseType === 'DISAGREE' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    ✕ Katılmıyorum
                                </button>
                            </div>
                        </div>

                        {(responseType === 'PARTIAL' || responseType === 'DISAGREE') && (
                            <div>
                                <label className="form-label mb-1 block text-xs font-bold text-red-700">Farklı Düşünce & Gerekçe (Zorunlu)</label>
                                <textarea
                                    className="form-input text-xs w-full"
                                    rows={3}
                                    placeholder="Katılmama veya kısmen katılma gerekçenizi mevzuat ve operasyonel nedenlerle açıklayınız..."
                                    value={responseReason}
                                    onChange={(e) => setResponseReason(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Action Plan Entry */}
                        <div>
                            <label className="form-label mb-2 block font-bold text-gray-900">2. Aksiyon Planı ve Kanıt Yükleme</label>
                            <div className="p-3 bg-gray-50 rounded-xl space-y-3">
                                {actionItems.map((act, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-gray-200 text-xs">
                                        <div className="col-span-2">
                                            <strong>Yapılacak İş:</strong> {act.work}
                                        </div>
                                        <div>
                                            <strong>Sorumlu:</strong> {act.responsible}
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 pt-2">
                                    <Button size="sm" variant="secondary" leftIcon={<Upload size={14} />} onClick={() => setEvidenceFile('kanit_belgesi_2026.pdf')}>
                                        Kanıt Belgesi Yükle
                                    </Button>
                                    {evidenceFile && <span className="text-xs text-emerald-700 font-medium">✓ {evidenceFile} eklendi</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ConfirmModal for Submission */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSend}
                title="Bulgu Yanıtını Müfettişe Gönder"
                message="Bulgu yanıtını ve aksiyon planını müfettiş değerlendirmesine göndermek istediğinize emin misiniz? Gönderildikten sonra yanıtınız kilitlenecektir."
                confirmText="Evet, Müfettişe Gönder"
                variant="primary"
                isLoading={submitting}
            />
        </div>
    );
}
