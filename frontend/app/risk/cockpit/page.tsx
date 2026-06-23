'use client';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Download, ShieldCheck, RefreshCw, Upload, FileText, Briefcase } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';
import { useRiskTitle } from '@/context/RiskTitleContext';
import DataUploadModal from '@/components/risk/DataUploadModal';
import KpiCard from '@/components/KpiCard';

export default function RiskCockpitPage() {
    const { setTitle, setSubtitle } = useRiskTitle();
    const [riskData, setRiskData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        setTitle('Yönetim Kurulu Risk Kokpiti');
        setSubtitle('Otonom Traffic Light Raporu ve Temel Göstergeler');
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getRiskSummary('BAZ');
            const rawData = response.ozet || [];
            
            // DEDUPLICATION: Sadece en güncel (son eklenen) KPI'ları al
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
            const response = await fetch(`http://localhost:3011/api/risk/bddk-export/${type}`);
            const data = await response.json();
            
            let csvContent = '';
            
            if (type === 'lyo') {
                csvContent = "Kurum Kodu,Rapor Kodu,Rapor Donemi,KPI,Deger,Yasal Sinir,Durum\n";
                csvContent += `${data.kurum_kodu},${data.rapor_kodu},${data.rapor_donemi},HAFTALIK_ORTALAMA,${data.haftalik_ortalama_lyo},${data.yasal_sinir},${data.uyum_durumu}\n\n`;
                csvContent += "Tarih,KPI,Deger,Durum\n";
                data.gunluk_detaylar.forEach((row: any) => {
                    csvContent += `${row.rapor_tarihi},${row.kpi},${row.deger},${row.durum}\n`;
                });
            } else {
                csvContent = "Kurum Kodu,Rapor Kodu,Donem,NPL Orani,Yasal Sinir,Durum\n";
                csvContent += `${data.kurum_kodu},${data.rapor_kodu},${data.donem},${data.npl_orani},${data.yasal_sinir},${data.durum}\n`;
            }

            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BDDK_BVTS_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert('Rapor üretilirken hata oluştu. Lütfen bağlantınızı kontrol edin.');
        }
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <LoadingState message="Risk Motoru Verileri Hesaplarken Lütfen Bekleyin..." />
        </div>
    );

    const kritikSayisi = riskData.filter((k: any) => k.risk_seviyesi === 'RED').length;
    const isSafe = kritikSayisi === 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Üst Aksiyon ve Özet Çubuğu */}
            <div className={`p-6 rounded-xl border ${isSafe ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isSafe ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {isSafe ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${isSafe ? 'text-emerald-900' : 'text-red-900'}`}>
                            {isSafe ? 'Risk Motoru: Sistem Sağlıklı' : 'Risk Motoru: Kritik Uyarılar Mevcut'}
                        </h2>
                        <p className={`text-sm mt-0.5 ${isSafe ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isSafe 
                                ? 'Mevcut baz senaryoda hiçbir yasal veya finansal sınır aşılmadı.'
                                : `${kritikSayisi} adet göstergede BDDK veya İç Tüzük limitleri ihlal edildi.`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" onClick={() => handleExportBddk('lyo')} icon={Download} className="bg-white">BVTS LYO</Button>
                    <Button variant="secondary" onClick={() => handleExportBddk('npl')} icon={Download} className="bg-white">BVTS NPL</Button>
                    <Button variant="primary" onClick={() => setIsUploadModalOpen(true)} icon={Upload}>
                        Veri Yükle (Data Ops)
                    </Button>
                </div>
            </div>

            {/* Otonom Gösterge Tablosu - Audit StatCard Kullanımı */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5 text-indigo-500" />
                    Otonom Finansal Göstergeler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {riskData.map((kpi: any, idx: number) => {
                        let color: any = 'blue';
                        let badgeText = 'SAĞLIKLI';

                        if (kpi.risk_seviyesi === 'RED') {
                            color = 'red';
                            badgeText = 'KRİTİK İHLAL';
                        } else if (kpi.risk_seviyesi === 'YELLOW') {
                            color = 'amber';
                            badgeText = 'YAKIN İZLEME';
                        } else if (kpi.risk_seviyesi === 'GREEN') {
                            color = 'emerald';
                            badgeText = 'SAĞLIKLI';
                        }

                        return (
                            <StatCard
                                key={idx}
                                title={kpi.kpi_kodu.replace(/_/g, ' ')}
                                value={
                                    <div className="flex items-baseline gap-1">
                                        {Number(kpi.deger).toFixed(2)}
                                        {kpi.detay?.birim === 'YUZDE' && <span className="text-gray-500 font-medium text-lg">%</span>}
                                    </div>
                                }
                                icon={kpi.risk_seviyesi === 'RED' ? AlertTriangle : TrendingUp}
                                color={color}
                                badgeText={badgeText}
                                subtext={kpi.detay?.bddk_mesaji || 'Otomatik hesaplandı'}
                            />
                        );
                    })}
                    
                    {riskData.length === 0 && (
                        <div className="col-span-full text-center p-12 bg-white border border-gray-200 border-dashed rounded-2xl flex flex-col items-center justify-center">
                            <DatabaseIcon className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Veri Seti Bulunamadı</h3>
                            <p className="text-gray-500 mt-1 max-w-md mx-auto">
                                Risk motorunun hesaplama yapabilmesi için sistemde aktif sözleşme verisi bulunmamaktadır. Lütfen sağ üstteki "Veri Yükle" butonu ile veri setinizi entegre edin.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <DataUploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                onSuccess={loadData}
            />
        </div>
    );
}

function ActivityIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
}

function DatabaseIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;
}
