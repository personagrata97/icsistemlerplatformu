'use client';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Download, ShieldCheck, Upload, Activity, Database, Info, ArrowRight, FileText, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';
import DataUploadModal from '@/components/risk/DataUploadModal';
import RiskLimitsModal from '@/components/risk/RiskLimitsModal';
import StatCard from '@/components/ui/StatCard';
import { useToast } from '@/components/Toast';
import DashboardWidget from '@/components/ui/DashboardWidget';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import Link from 'next/link';

// KPI kod → Türkçe açıklama haritası
const KPI_LABELS: Record<string, string> = {
    'NPL': 'Takipteki Alacak Oranı',
    'LCR': 'Likidite Yeterlilik Oranı',
    'IPTAL_ORANI': 'Aylık İptal/Cayma Oranı',
    'TESLIMAT_BASKI': 'Teslimat Baskı Oranı',
    'TESLIMAT_YUKUMLULUGU': 'Teslimat Yükümlülüğü',
    'DPD_DAGILIM': 'Gecikme (DPD) Dağılımı',
    'KONSANTRASYON_BOLGE': 'Bölge Yoğunlaşması',
    'KONSANTRASYON_VADE': 'Vade Yoğunlaşması',
    'KONSANTRASYON_TUZEL': 'Tüzel Kişi Yoğunlaşması',
    'FINANSMAN_LIMITI': 'Toplam Finansman Limiti',
    'OZKAYNAK_YETERLILIK': 'Özkaynak Yeterlilik Oranı',
    'KONSANTRASYON_RISK_GRUBU': 'Risk Grubu Yoğunlaşması',
};

// KPI açıklama ve mevzuat dayanağı tooltip'leri
const KPI_TOOLTIPS: Record<string, string> = {
    'NPL': 'Mevzuat Dayanağı: Finansal Kiralama, Faktoring, Finansman ve Tasarruf Finansman Şirketlerinin Muhasebe Uygulamaları ile Finansal Tabloları Hakkında Yönetmelik (Tasfiye Olunacak Alacaklar Esasları). Toplam portföye oran sınırı: %5.',
    'LCR': 'Mevzuat Dayanağı: 28 Kasım 2025 tarih ve 33091 sayılı Resmî Gazete\'de yayımlanan Tasarruf Finansman Şirketlerinin Likidite Yeterlilik Oranının Hesaplanmasına İlişkin Tebliğ (Md. 4). Haftalık basit aritmetik ortalama asgari limit: %100.',
    'IPTAL_ORANI': 'Mevzuat Dayanağı: 6361 Sayılı Kanun (Md. 39/A - Tasarruf Finansman Sözleşmesinden Cayma ve Fesih Hakları). Müşterinin ilk 14 günde cayma ve sonrasında fesih haklarının kullanımı izleme oranı.',
    'TESLIMAT_BASKI': 'Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik (Md. 20 - Fon Havuzu Yönetimi). Gelecek 12 aylık teslimat taahhütlerinin fon havuzuna oranı.',
    'TESLIMAT_YUKUMLULUGU': 'Mevzuat Dayanağı: BDDK Tasarruf Finansman Faaliyet Esasları. 30 gün içinde teslim edilmesi gereken sözleşmelerin toplam finansman yükümlülüğü (₺).',
    'DPD_DAGILIM': 'Mevzuat Dayanağı: TFRS 9 Finansal Araçlar Standardı. Alacakların gecikme günlerine (Days Past Due - DPD) göre sınıflandırılması ve karşılık hesabı.',
    'KONSANTRASYON_BOLGE': 'Mevzuat Dayanağı: BDDK Risk Yönetimi ve İç Kontrol Tebliği. Tek bir coğrafi bölgedeki en yüksek portföy yoğunlaşması. Alarm sınırı: %30.',
    'KONSANTRASYON_VADE': 'Mevzuat Dayanağı: BDDK Vade Riski Yönetim Rehberi. Tek bir vade grubundaki en yüksek portföy yoğunlaşması.',
    'KONSANTRASYON_TUZEL': 'Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik (Md. 15 - Finansman Sınırları). Tek bir tüzel kişiye verilebilecek finansman sınırları ve konsantrasyon takibi.',
    'FINANSMAN_LIMITI': 'Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik (Md. 22). Toplam finansman tutarı, tasarruf fon havuzu ile özkaynakları toplamının %200\'ünü aşamaz.',
    'OZKAYNAK_YETERLILIK': 'Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik. Özkaynağın, toplam sözleşme tutarına oranı asgari %3 olmalıdır.',
    'KONSANTRASYON_RISK_GRUBU': 'Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik (Aralık 2023 değişikliği). İlişkili kişi ve ortaklıklardan oluşan risk grubunun toplam yoğunlaşma takibi.',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function RiskCockpitPage() {
    const { showToast } = useToast();
    const [riskData, setRiskData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getRiskSummary('BAZ');
            const rawData = response.ozet || [];

            // DEDUPLICATION: Sadece en güncel KPI'ları al
            const latestKpis = Object.values(rawData.reduce((acc: any, curr: any) => {
                acc[curr.kpi_kodu] = curr;
                return acc;
            }, {}));

            setRiskData(latestKpis);
        } catch (error) {
            console.error('Risk verisi çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportBddk = async (type: 'lyo' | 'npl') => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const response = await fetch(`${API_BASE}/risk/bddk-export/${type}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Rapor alınamadı');
            const data = await response.json();

            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            const label = type === 'lyo' ? 'Likidite Yeterlilik Oranı' : 'Takipteki Alacak Oranı';

            const translateStatus = (status: string) => {
                if (!status) return 'SAĞLIKLI';
                const s = status.toUpperCase();
                if (s === 'RED' || s === 'IHLAL' || s === 'İHLAL') return 'LİMİT İHLALİ';
                if (s === 'YELLOW' || s === 'UYARI') return 'YAKIN İZLEME';
                return 'SAĞLIKLI';
            };

            if (type === 'lyo') {
                // Sheet 1: Rapor Özeti
                const summaryData = [
                    {
                        'Kurum Kodu': data.kurum_kodu,
                        'Rapor Kodu': data.rapor_kodu,
                        'Rapor Dönemi': data.rapor_donemi,
                        'Gösterge': 'Haftalık Ortalama LYO',
                        'Değer': `%${Number(data.haftalik_ortalama_lyo).toFixed(2)}`,
                        'Yasal Sınır': `%${Number(data.yasal_sinir).toFixed(2)}`,
                        'Durum': translateStatus(data.uyum_durumu)
                    }
                ];
                const wsSummary = XLSX.utils.json_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, wsSummary, 'Rapor Özeti');

                // Sheet 2: Günlük Detaylar
                const detailData = (data.gunluk_detaylar || []).map((row: any) => ({
                    'Tarih': row.rapor_tarihi,
                    'Gösterge': 'Likidite Yeterlilik Oranı (LYO)',
                    'Değer': `%${Number(row.deger).toFixed(2)}`,
                    'Durum': translateStatus(row.durum)
                }));
                const wsDetails = XLSX.utils.json_to_sheet(detailData);
                XLSX.utils.book_append_sheet(wb, wsDetails, 'Günlük Detaylar');
            } else {
                // Sheet 1: NPL Rapor Özeti
                const nplData = [
                    {
                        'Kurum Kodu': data.kurum_kodu,
                        'Rapor Kodu': data.rapor_kodu,
                        'Dönem': data.donem,
                        'NPL Oranı': `%${Number(data.npl_orani).toFixed(2)}`,
                        'Yasal Sınır': `%${Number(data.yasal_sinir).toFixed(2)}`,
                        'Durum': translateStatus(data.durum)
                    }
                ];
                const wsNpl = XLSX.utils.json_to_sheet(nplData);
                XLSX.utils.book_append_sheet(wb, wsNpl, 'NPL Rapor Özeti');
            }

            // Sheet 3: Kaynak Veri (Sözleşmeler)
            const sourceData = (data.kaynak_veriler || []).map((row: any) => ({
                'Sözleşme No': row.sozlesme_no,
                'Müşteri Ad Soyad': row.ad_soyad,
                'Segment': row.segment,
                'Bölge': row.bolge,
                'Şube': row.sube,
                'Toplam Tutar': `₺${Number(row.tutar).toLocaleString('tr-TR')}`,
                'Vade (Ay)': row.vade,
                'Gecikme Günü (DPD)': row.gecikme_gunu,
                'Durum': row.durum === 'TAKIPTE' ? 'TAKİP / NPL' : row.durum === 'AKTIF' ? 'AKTİF' : 'TAMAMLANDI'
            }));
            const wsSource = XLSX.utils.json_to_sheet(sourceData);
            XLSX.utils.book_append_sheet(wb, wsSource, 'Kaynak Veri (Sözleşmeler)');

            XLSX.writeFile(wb, `BDDK_BVTS_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast(`${label} Excel raporu indirildi`, 'success');
        } catch (error) {
            console.error('Rapor üretilirken hata:', error);
            showToast('Rapor üretilirken hata oluştu. Backend bağlantısını kontrol edin.', 'error');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
            <LoadingState message="Risk göstergeleri hesaplanıyor..." className="bg-transparent" />
        </div>
    );

    const kritikSayisi = riskData.filter((k: any) => k.risk_seviyesi === 'RED').length;
    const uyariSayisi = riskData.filter((k: any) => k.risk_seviyesi === 'YELLOW').length;
    const isSafe = kritikSayisi === 0;

    // Veri yok durumu
    if (riskData.length === 0) {
        return (
            <div className="space-y-8">
                {/* Rehber Kutusu */}
                <DashboardWidget widgetType="actions" variant="transparent">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <div className="p-4 bg-blue-100 rounded-xl text-blue-600 shrink-0">
                                <Info className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-blue-900 mb-2">Risk Modülü Kullanım Rehberi</h2>
                                <p className="text-blue-700 text-sm leading-relaxed mb-4">
                                    Risk kokpiti, yüklediğiniz sözleşme verilerinden otomatik olarak 9 farklı risk göstergesi hesaplar.
                                    İlk adım olarak aşağıdaki butona tıklayarak sözleşme verilerinizi yükleyin.
                                </p>

                                <div className="bg-white/60 rounded-xl p-4 mb-4 border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Hangi Verilere İhtiyaç Var?</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                                        <div className="flex items-center gap-2"><ArrowRight size={12} className="shrink-0" /> Müşteri bilgileri (ad, segment, bölge, şube)</div>
                                        <div className="flex items-center gap-2"><ArrowRight size={12} className="shrink-0" /> Sözleşme bilgileri (tutar, vade, başlangıç tarihi)</div>
                                        <div className="flex items-center gap-2"><ArrowRight size={12} className="shrink-0" /> Ödeme hareketleri (tarih, tutar, gecikme günü)</div>
                                        <div className="flex items-center gap-2"><ArrowRight size={12} className="shrink-0" /> Teslimat bilgileri (planlanan/gerçekleşen tarih)</div>
                                        <div className="flex items-center gap-2"><ArrowRight size={12} className="shrink-0" /> Likidite pozisyonu (nakit, likit varlık, yükümlülük)</div>
                                        <div className="flex items-center gap-2"><ArrowRight size={12} className="shrink-0" /> İptal/cayma kayıtları (tarih, neden)</div>
                                    </div>
                                </div>

                                <div className="bg-white/60 rounded-xl p-4 mb-4 border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Otomatik Hesaplanan Risk Göstergeleri</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-800">
                                        <div className="flex items-center gap-2"><BarChart3 size={12} className="shrink-0 text-blue-400" /> Takipteki Alacak (NPL)</div>
                                        <div className="flex items-center gap-2"><BarChart3 size={12} className="shrink-0 text-blue-400" /> Likidite Yeterlilik (LYO)</div>
                                        <div className="flex items-center gap-2"><BarChart3 size={12} className="shrink-0 text-blue-400" /> İptal/Cayma Oranı</div>
                                        <div className="flex items-center gap-2"><BarChart3 size={12} className="shrink-0 text-blue-400" /> Teslimat Baskısı</div>
                                        <div className="flex items-center gap-2"><BarChart3 size={12} className="shrink-0 text-blue-400" /> Gecikme Dağılımı (DPD)</div>
                                        <div className="flex items-center gap-2"><BarChart3 size={12} className="shrink-0 text-blue-400" /> Bölge/Vade/Tüzel Yoğunlaşma</div>
                                    </div>
                                </div>

                                <Button variant="primary" onClick={() => setIsUploadModalOpen(true)} leftIcon={<Upload size={16} />} className="mt-2">
                                    Veri Yükleyerek Başla
                                </Button>
                            </div>
                        </div>
                    </div>
                </DashboardWidget>

                <DataUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={loadData}
                />

                <RiskLimitsModal
                    isOpen={isLimitsModalOpen}
                    onClose={() => setIsLimitsModalOpen(false)}
                    onSuccess={loadData}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 1. DURUM ÇUBUĞU */}
            <div className={`p-6 rounded-2xl border ${isSafe ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isSafe ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {isSafe ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${isSafe ? 'text-emerald-900' : 'text-red-900'}`}>
                            {isSafe ? 'Tüm Göstergeler Sağlıklı' : `${kritikSayisi} Kritik Uyarı Mevcut`}
                        </h2>
                        <p className={`text-sm mt-0.5 ${isSafe ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isSafe
                                ? 'Baz senaryoda hiçbir yasal veya iç tüzük sınırı aşılmadı.'
                                : `${kritikSayisi} göstergede limit ihlali tespit edildi${uyariSayisi > 0 ? `, ${uyariSayisi} gösterge yakın izlemede` : ''}.`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Tooltip content="BDDK Likidite Yeterlilik Oranı haftalık raporunu CSV olarak indirir" position="bottom">
                        <Button variant="secondary" onClick={() => handleExportBddk('lyo')} leftIcon={<Download size={16} />} className="bg-white">Likidite Raporu</Button>
                    </Tooltip>
                    <Tooltip content="BDDK Takipteki Alacak aylık raporunu CSV olarak indirir" position="bottom">
                        <Button variant="secondary" onClick={() => handleExportBddk('npl')} leftIcon={<Download size={16} />} className="bg-white">Takip Raporu</Button>
                    </Tooltip>
                    <Button variant="secondary" onClick={() => setIsLimitsModalOpen(true)} leftIcon={<ShieldCheck size={16} />} className="bg-white">
                        Risk Limitleri (İştahı)
                    </Button>
                    <Button variant="primary" onClick={() => setIsUploadModalOpen(true)} leftIcon={<Upload size={16} />}>
                        Veri Yükle
                    </Button>
                </div>
            </div>

            {/* 2. ÖZET KPI KARTLARI */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Risk Göstergeleri</h3>
                    </div>
                    <Link href="/risk/scenarios" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                        Senaryo Analizi <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {riskData.map((kpi: any, idx: number) => {
                        let color: any = 'green';
                        let badgeText = 'Sağlıklı';

                        if (kpi.risk_seviyesi === 'RED') {
                            color = 'red';
                            badgeText = 'Limit İhlali';
                        } else if (kpi.risk_seviyesi === 'YELLOW') {
                            color = 'orange';
                            badgeText = 'Yakın İzleme';
                        }

                        const kpiLabel = KPI_LABELS[kpi.kpi_kodu] || kpi.kpi_kodu;
                        const kpiTooltip = KPI_TOOLTIPS[kpi.kpi_kodu];

                        const formatKpiValue = (code: string, value: number) => {
                            if (code === 'TESLIMAT_YUKUMLULUGU') {
                                return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            
                            const percentageKpis = [
                                'NPL', 'LCR', 'IPTAL_ORANI', 'DPD_DAGILIM', 
                                'KONSANTRASYON_BOLGE', 'KONSANTRASYON_VADE', 'KONSANTRASYON_TUZEL',
                                'FINANSMAN_LIMITI', 'OZKAYNAK_YETERLILIK', 'KONSANTRASYON_RISK_GRUBU'
                            ];
                            
                            if (percentageKpis.includes(code)) {
                                return `%${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            
                            return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        };

                        return (
                            <StatCard
                                key={idx}
                                title={kpiLabel}
                                value={formatKpiValue(kpi.kpi_kodu, Number(kpi.deger))}
                                color={color}
                                infoTooltip={kpiTooltip}
                            />
                        );
                    })}
                </div>
            </div>

            {/* 3. HIZLI ERİŞİM LINKLERI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/risk/alerts" className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Risk Uyarıları</h4>
                            <p className="text-xs text-gray-500">Eşik aşımları ve limit ihlalleri</p>
                        </div>
                    </div>
                </Link>

                <Link href="/risk/contracts" className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Sözleşme Analizi</h4>
                            <p className="text-xs text-gray-500">Portföy bazlı detaylı inceleme</p>
                        </div>
                    </div>
                </Link>

                <Link href="/risk/scenarios" className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Senaryo Analizi</h4>
                            <p className="text-xs text-gray-500">Stres testleri ve simülasyonlar</p>
                        </div>
                    </div>
                </Link>
            </div>

            <DataUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={loadData}
            />

            <RiskLimitsModal
                isOpen={isLimitsModalOpen}
                onClose={() => setIsLimitsModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
