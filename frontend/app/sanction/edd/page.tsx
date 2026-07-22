'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';
import { ShieldAlert, FileText, CheckSquare, Upload, AlertOctagon, Send, FileCheck, Layers, Eye, UserCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function EnhancedDueDiligencePage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSignal, setSelectedSignal] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [iddiaTuru, setIddiaTuru] = useState('KARAPARA');
    const [iddiaAsamasi, setIddiaAsamasi] = useState('SORUSTURMA');
    const [kaynakAd, setKaynakAd] = useState('Ticaret Sicil Gazetesi & TMSF Duyurusu');
    const [kaynakTarih, setKaynakTarih] = useState('2026-07-20');
    const [guvenilirlikSkoru, setGuvenilirlikSkoru] = useState('YUKSEK');
    const [kaynakBaglantisi, setKaynakBaglantisi] = useState('https://resmigazete.gov.tr/2026/07/20-04.pdf');

    // Checklist States
    const [ticaretSicil, setTicaretSicil] = useState(true);
    const [resmiGazete, setResmiGazete] = useState(true);
    const [tmsfListesi, setTmsfListesi] = useState(true);
    const [acikKaynak, setAcikKaynak] = useState(true);
    const [kurumIci, setKurumIci] = useState(true);

    // Decision State
    const [karar, setKarar] = useState<'ISLEME_DEVAM' | 'SARTLI_DEVAM' | 'ISLEMI_REDDET_SIB'>('SARTLI_DEVAM');
    const [kararGerekcesi, setKararGerekcesi] = useState('');
    const [kanitDosya, setKanitDosya] = useState<string | null>('edd_araştırma_raporu_2026.pdf');

    const signals = [
        {
            id: 'SIG-2026-01',
            musteriId: 'M-10928',
            musteriAd: 'Atlas İnşaat Otomotiv A.Ş.',
            tcknVkn: '8120394812',
            kuralKodu: 'KURAL_1',
            kuralAd: 'Tüzel Kişi Hesabından Gerçek Kişiye Ödeme Yönlendirme',
            riskPuani: 90,
            onemDuzeyi: 'YÜKSEK',
            islemTuru: 'Sözleşme Feshi & Bedel İadesi (850.000 TL)',
            sebeb: 'Fesih bedelinin şirket hesabı yerine yönetim kurulu üyesinin şahsi IBAN hesabına ödenmesi talebi.',
            durum: 'ACIK',
            tarih: '2026-07-22'
        },
        {
            id: 'SIG-2026-02',
            musteriId: 'M-10442',
            musteriAd: 'Mehmet Demir',
            tcknVkn: '10928172640',
            kuralKodu: 'KURAL_3',
            kuralAd: 'Erken Fesih ve Yüksek Tutar Örüntüsü',
            riskPuani: 75,
            onemDuzeyi: 'ORTA',
            islemTuru: 'Erken Erken Ayrılma Talebi (1.200.000 TL)',
            sebeb: 'Sözleşme tesisinden 45 gün sonra yüksek tutarlı peşin fesih talebi.',
            durum: 'ACIK',
            tarih: '2026-07-21'
        }
    ];

    const eddRecords = [
        {
            id: 'EDD-2026-88',
            musteriAd: 'Zelımkhan YANDARBIEV',
            iddiaTuru: 'TEROR_FINANSMANI',
            iddiaAsamasi: 'KESINLESMIS_KARAR',
            kaynak: 'MASAK & Resmî Gazete 6415 S.K. Kararı',
            karar: 'ISLEMI_REDDET_SIB',
            ustOnay: 'ONAYLANDI',
            inceleyen: 'Uyum Görevlisi (Ahmet KAYA)',
            tarih: '2026-07-19'
        }
    ];

    const handleOpenEDD = (sig: any) => {
        setSelectedSignal(sig);
        setKararGerekcesi('');
    };

    const handleSaveEDD = () => {
        if (!kararGerekcesi.trim()) {
            showToast('Karar gerekçesi yazılması zorunludur (MASAK & KVKK Uyum Şartı).', 'warning');
            return;
        }
        setIsConfirmOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setSubmitting(false);
        setIsConfirmOpen(false);
        setSelectedSignal(null);
        showToast('Genişletilmiş Durum Tespiti (EDD) kararı denetim izine kaydoldu.', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Genişletilmiş Durum Tespiti (EDD) ve İtibar Riski Yönetimi</h2>
                    <p className="text-red-100 text-xs mt-1">İç Sinyaller ve Resmî Yapılandırılmış Kaynaklar Üzerinden Disiplinli Kayıt Altına Alma Ekranı</p>
                </div>
                <div className="px-4 py-2 bg-red-800/80 rounded-xl text-xs font-semibold border border-red-600/50">
                    EDD / KYK Uyum Kartı
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Açık EDD İnceleme Sinyalleri"
                    value={signals.length}
                    icon={ShieldAlert}
                    color="red"
                    infoTooltip="Kural motoru tarafından otomatik üretilmiş yüksek riskli iç sinyaller"
                />
                <StatCard
                    title="Karara Bağlanan EDD İncelemeleri"
                    value={12}
                    icon={ShieldCheck}
                    color="emerald"
                    infoTooltip="Uyum görevlisi tarafından denetlenebilir biçimde kapatılan vakalar"
                />
                <StatCard
                    title="Üst Onay Bekleyen Kararlar"
                    value={1}
                    icon={AlertOctagon}
                    color="amber"
                    infoTooltip="İşlemi Reddet / ŞİB kararı verilmiş ve üst yönetim onayında bekleyenler"
                />
                <StatCard
                    title="Sinyal Doğruluk Oranı"
                    value="%94"
                    icon={UserCheck}
                    color="purple"
                    infoTooltip="İç sinyal kural motorunun gerçek riskli vakaları tespit etme başarısı"
                />
            </div>

            <div className="space-y-4">
                <PageToolbar
                    searchPlaceholder="Müşteri veya sinyal ara..."
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                <DataTable
                    columns={[
                        {
                            key: 'id',
                            header: 'Sinyal Kodu',
                            width: '130px',
                            render: (item: any) => (
                                <code className="font-mono text-xs font-bold text-red-800 bg-red-50 px-2 py-1 rounded">
                                    {item.id}
                                </code>
                            )
                        },
                        {
                            key: 'musteriAd',
                            header: 'Müşteri Ad Soyad / VKN',
                            sortable: true,
                            render: (item: any) => (
                                <div>
                                    <div className="font-bold text-gray-900">{item.musteriAd}</div>
                                    <div className="text-[11px] text-gray-500 font-mono">Kimlik/VKN: {item.tcknVkn}</div>
                                </div>
                            )
                        },
                        {
                            key: 'kuralAd',
                            header: 'Tetiklenen İç Sinyal Kuralı',
                            render: (item: any) => (
                                <div>
                                    <div className="font-semibold text-gray-800">{item.kuralAd}</div>
                                    <div className="text-[11px] text-red-700">{item.sebeb}</div>
                                </div>
                            )
                        },
                        {
                            key: 'riskPuani',
                            header: 'Risk Skoru',
                            width: '120px',
                            render: (item: any) => (
                                <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${item.riskPuani >= 85 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                    %{item.riskPuani}
                                </span>
                            )
                        },
                        {
                            key: 'actions',
                            header: 'İnceleme & EDD',
                            width: '160px',
                            align: 'center',
                            render: (item: any) => (
                                <Button size="sm" variant="danger" leftIcon={<ShieldAlert size={14} />} onClick={() => handleOpenEDD(item)}>
                                    EDD Kartını Aç
                                </Button>
                            )
                        }
                    ]}
                    data={signals}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="id"
                />
            </div>

            {/* Modal: EDD Workspace */}
            {selectedSignal && (
                <Modal
                    isOpen={!!selectedSignal}
                    onClose={() => setSelectedSignal(null)}
                    title={`Genişletilmiş Durum Tespiti (EDD) İnceleme Kartı — ${selectedSignal.musteriAd}`}
                    size="xl"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" onClick={() => setSelectedSignal(null)}>İptal</Button>
                            <Button variant="danger" leftIcon={<Send size={16} />} onClick={handleSaveEDD}>
                                EDD Kararını Kaydet & Onaya Gönder
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-6 text-sm text-gray-700">
                        {/* Upper Block */}
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                            <div><strong>Müşteri Künyesi:</strong> {selectedSignal.musteriAd} ({selectedSignal.tcknVkn})</div>
                            <div><strong>Talep Edilen İşlem:</strong> {selectedSignal.islemTuru}</div>
                            <div><strong>Tetikleyen Sinyal:</strong> {selectedSignal.kuralAd}</div>
                            <div><strong>Risk Puanı:</strong> <span className="font-bold text-red-700">%{selectedSignal.riskPuani} ({selectedSignal.onemDuzeyi})</span></div>
                        </div>

                        {/* Checklist Block */}
                        <div>
                            <label className="form-label mb-2 block font-bold text-gray-900">1. Resmî Araştırma Kontrol Listesi (Checklist)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={ticaretSicil} onChange={e => setTicaretSicil(e.target.checked)} className="rounded text-red-700 focus:ring-red-600" />
                                    <span>Ticaret Sicil Gazetesi</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={resmiGazete} onChange={e => setResmiGazete(e.target.checked)} className="rounded text-red-700 focus:ring-red-600" />
                                    <span>Resmî Gazete İlanları</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={tmsfListesi} onChange={e => setTmsfListesi(e.target.checked)} className="rounded text-red-700 focus:ring-red-600" />
                                    <span>TMSF Şirket Listesi</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={acikKaynak} onChange={e => setAcikKaynak(e.target.checked)} className="rounded text-red-700 focus:ring-red-600" />
                                    <span>Açık Kaynak Araştırması</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={kurumIci} onChange={e => setKurumIci(e.target.checked)} className="rounded text-red-700 focus:ring-red-600" />
                                    <span>Kurum İçi Geçmiş Kaydı</span>
                                </label>
                            </div>
                        </div>

                        {/* Structured Claim Block */}
                        <div className="space-y-3">
                            <label className="form-label block font-bold text-gray-900">2. Yapılandırılmış İddia & Bulgu Kaydı (KVKK Uyumlu)</label>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="form-label mb-1">İddia Türü</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'KARAPARA', label: 'Kara Para Aklama İddiası' },
                                            { value: 'MUVAZAA', label: 'Muvazaalı İşlem / Konut Devri' },
                                            { value: 'VERGI', label: 'Vergi Kaçakçılığı' },
                                            { value: 'DOLANDIRICILIK', label: 'Dolandırıcılık / Emniyeti Suistimal' },
                                            { value: 'TEROR', label: 'Terörün Finansmanı' },
                                        ]}
                                        value={iddiaTuru}
                                        onChange={val => setIddiaTuru(val as string)}
                                    />
                                </div>

                                <div>
                                    <label className="form-label mb-1">İddia Aşaması (Hukuki Aşama Ayrımı)</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'HABER_IDDIA', label: 'Haber / Basın İddiası' },
                                            { value: 'SORUSTURMA', label: 'Savcılık Soruşturması' },
                                            { value: 'DAVA', label: 'Devam Eden Mahkeme Davası' },
                                            { value: 'KESINLESMIS_KARAR', label: 'Kesinleşmiş Mahkeme Kararı' },
                                        ]}
                                        value={iddiaAsamasi}
                                        onChange={val => setIddiaAsamasi(val as string)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="form-label mb-1">Kaynak Adı & Belge Numarası</label>
                                    <input type="text" className="form-input text-xs" value={kaynakAd} onChange={e => setKaynakAd(e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label mb-1">Kaynak Bağlantısı (Metin Olarak Saklanır)</label>
                                    <input type="text" className="form-input text-xs font-mono" value={kaynakBaglantisi} onChange={e => setKaynakBaglantisi(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Decision Block */}
                        <div>
                            <label className="form-label mb-2 block font-bold text-gray-900">3. Uyum Görevlisi Kararı (İnsan Kararı Zorunludur)</label>
                            <div className="flex gap-3 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setKarar('ISLEME_DEVAM')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${karar === 'ISLEME_DEVAM' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-200'}`}
                                >
                                    ✓ İşleme Devam
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKarar('SARTLI_DEVAM')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${karar === 'SARTLI_DEVAM' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-200'}`}
                                >
                                    ! Şartlı Devam (Ek Belge / Üst Onay)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKarar('ISLEMI_REDDET_SIB')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${karar === 'ISLEMI_REDDET_SIB' ? 'bg-red-700 text-white border-red-700' : 'bg-white text-gray-700 border-gray-200'}`}
                                >
                                    ✕ İşlemi Reddet & ŞİB'e Al
                                </button>
                            </div>

                            <div>
                                <label className="form-label mb-1 block text-xs font-bold text-gray-900">Karar Gerekçesi (Zorunlu)</label>
                                <textarea
                                    className="form-input text-xs w-full"
                                    rows={3}
                                    placeholder="Kararın hukuki ve operasyonel dayanaklarını, incelenen belgeleri detaylı yazınız..."
                                    value={kararGerekcesi}
                                    onChange={e => setKararGerekcesi(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ConfirmModal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSubmit}
                title="EDD Kararını Onaya Gönder"
                message="Genişletilmiş Durum Tespiti kararınız denetim izine yazılarak saklanacaktır. Devam etmek istiyor musunuz?"
                confirmText="Evet, Kararı Kaydet"
                variant="danger"
                isLoading={submitting}
            />
        </div>
    );
}
