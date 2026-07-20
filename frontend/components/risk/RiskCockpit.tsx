import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Download, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function ExecutiveRiskCockpit() {
    const [riskData, setRiskData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Sadece Baz senaryo kpi verilerini çeker (Otonom Traffic Light Raporu)
            const response = await apiClient.getRiskSummary('BAZ');
            setRiskData(response.ozet || []);
        } catch (error) {
            console.error('Risk verisi çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportBddk = async (type: 'lyo' | 'npl') => {
        try {
            const response = await fetch(`${API_BASE}/risk/bddk-export/${type}`);
            const data = await response.json();
            
            // JSON verisini ekranda alert ile veya console ile gösterelim MVP için
            console.log(`BDDK BVTS Export (${type}):`, data);
            alert(`${type.toUpperCase()} BVTS raporu başarıyla üretildi. (Konsol'u kontrol edin)`);
        } catch (error) {
            alert('Rapor üretilirken hata oluştu.');
        }
    };

    const handleMasakScan = async () => {
        try {
            const response = await fetch(`${API_BASE}/sanction/masak/scan`);
            const data = await response.json();
            alert(`MASAK ŞİB Taraması Tamamlandı.\nTespit Edilen Şüpheli İşlem: ${data.tespit_edilen_supheli_islem_sayisi}`);
        } catch (error) {
            alert('MASAK taramasında hata.');
        }
    };

    if (loading) return <LoadingState message="Risk Kokpiti Hazırlanıyor..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Yönetim Kurulu Risk Kokpiti</h3>
                    <p className="text-sm text-gray-500">Otonom Traffic Light Raporu ve Uyum Bildirimleri</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleExportBddk('lyo')}>
                        <span className="flex items-center gap-2">
                            <Download size={16} />
                            BVTS LYO
                        </span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleExportBddk('npl')}>
                        <span className="flex items-center gap-2">
                            <Download size={16} />
                            BVTS NPL
                        </span>
                    </Button>
                    <Button variant="danger" onClick={handleMasakScan}>
                        <span className="flex items-center gap-2">
                            <ShieldCheck size={16} />
                            MASAK ŞİB Tara
                        </span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {riskData.map((kpi, idx) => {
                    let bgColor = 'bg-green-50 border-green-200';
                    let textColor = 'text-green-800';
                    let iconColor = 'text-green-600';
                    
                    if (kpi.risk_seviyesi === 'RED') {
                        bgColor = 'bg-red-50 border-red-200';
                        textColor = 'text-red-800';
                        iconColor = 'text-red-600';
                    } else if (kpi.risk_seviyesi === 'YELLOW') {
                        bgColor = 'bg-yellow-50 border-yellow-200';
                        textColor = 'text-yellow-800';
                        iconColor = 'text-yellow-600';
                    }

                    return (
                        <div key={idx} className={`p-4 border rounded-xl flex items-center justify-between ${bgColor}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 bg-white rounded-full shadow-sm ${iconColor}`}>
                                    {kpi.risk_seviyesi === 'RED' ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className={`font-semibold ${textColor}`}>{kpi.kpi_kodu.replace(/_/g, ' ')}</h4>
                                    <p className={`text-sm ${textColor} opacity-80`}>
                                        Güncel Değer: <span className="font-bold">{Number(kpi.deger).toFixed(2)}</span> 
                                        {kpi.detay?.bddk_mesaji ? ` — ${kpi.detay.bddk_mesaji}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white shadow-sm ${textColor}`}>
                                    {kpi.risk_seviyesi === 'RED' ? 'KRİTİK İHLAL' : kpi.risk_seviyesi === 'YELLOW' ? 'YAKIN İZLEME' : 'SAĞLIKLI'}
                                </span>
                            </div>
                        </div>
                    );
                })}
                
                {riskData.length === 0 && (
                    <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-500">
                        Henüz veri bulunmuyor. Senaryoları çalıştırın.
                    </div>
                )}
            </div>
        </div>
    );
}
