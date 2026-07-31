'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Checkbox from '@/components/ui/Checkbox';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
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

import { useEffect } from 'react';
import { sanctionApi } from '@/lib/sanction-api';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Pagination from '@/components/ui/Pagination';

function EnhancedDueDiligencePageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSignal, setSelectedSignal] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [signals, setSignals] = useState<any[]>([]);
    const [eddRecords, setEddRecords] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);

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

    const loadData = async () => {
        setLoading(true);
        try {
            const [sigData, eddData] = await Promise.all([
                sanctionApi.getSignals(undefined, { page, pageSize }),
                sanctionApi.getEDDRecords()
            ]);
            const sigItems = sigData?.items || (Array.isArray(sigData) ? sigData : []);
            setSignals(sigItems);
            setTotal(sigData?.total || sigItems.length || 0);
            setEddRecords(Array.isArray(eddData) ? eddData : []);
        } catch (e) {
            showToast('EDD verileri yüklenemedi', 'error');
            setSignals([]);
            setEddRecords([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page]);

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
        if (!selectedSignal) return;
        setSubmitting(true);
        try {
            await sanctionApi.createEDDRecord({
                musteriId: selectedSignal.musteriId || selectedSignal.id,
                signalId: selectedSignal.id,
                iddiaTuru,
                iddiaAsamasi,
                kaynakAd,
                kaynakTarih,
                guvenilirlikSkoru,
                ticaretSicilKontrol: ticaretSicil,
                resmiGazeteKontrol: resmiGazete,
                tmsfKontrol: tmsfListesi,
                acikKaynakKontrol: acikKaynak,
                kurumIciKontrol: kurumIci,
                kanitDosyaUrl: kanitDosya,
                kaynakBaglantisi,
                karar,
                kararGerekcesi,
            });
            showToast('Genişletilmiş Durum Tespiti (EDD) kararı veritabanına ve denetim izine kaydoldu.', 'success');
            await loadData();
            setIsConfirmOpen(false);
            setSelectedSignal(null);
        } catch (e: any) {
            showToast(e.message || 'EDD kaydı oluşturulurken hata oluştu', 'error');
        } finally {
            setSubmitting(false);
        }
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
                                <StatusBadge value={item.riskPuani >= 85 ? 'Yüksek' : 'Orta'} type="risk" />
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
                <Pagination
                    currentPage={page}
                    totalItems={total || signals.length}
                    itemsPerPage={pageSize}
                    onPageChange={setPage}
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
                                <Checkbox label="Ticaret Sicil Gazetesi" checked={ticaretSicil} onChange={checked => setTicaretSicil(checked)} />
                                <Checkbox label="Resmî Gazete İlanları" checked={resmiGazete} onChange={checked => setResmiGazete(checked)} />
                                <Checkbox label="TMSF Şirket Listesi" checked={tmsfListesi} onChange={checked => setTmsfListesi(checked)} />
                                <Checkbox label="Açık Kaynak Araştırması" checked={acikKaynak} onChange={checked => setAcikKaynak(checked)} />
                                <Checkbox label="Kurum İçi Geçmiş Kaydı" checked={kurumIci} onChange={checked => setKurumIci(checked)} />
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
                                <FormInput
                                    label="Kaynak Adı & Belge Numarası"
                                    value={kaynakAd}
                                    onChange={e => setKaynakAd(e.target.value)}
                                />
                                <FormInput
                                    label="Kaynak Bağlantısı (Metin Olarak Saklanır)"
                                    value={kaynakBaglantisi}
                                    onChange={e => setKaynakBaglantisi(e.target.value)}
                                    inputClassName="font-mono"
                                />
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

                            <FormTextarea
                                label="Karar Gerekçesi"
                                required
                                rows={3}
                                placeholder="Kararın hukuki ve operasyonel dayanaklarını, incelenen belgeleri detaylı yazınız..."
                                value={kararGerekcesi}
                                onChange={e => setKararGerekcesi(e.target.value)}
                            />
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


export default function EnhancedDueDiligencePage() {
    return (
        <RequireRole allowedRoles={['UYUM_GOREVLISI', 'UYUM_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <EnhancedDueDiligencePageContent />
        </RequireRole>
    );
}
