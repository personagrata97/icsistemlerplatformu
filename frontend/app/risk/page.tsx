'use client';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import KpiCard from '@/components/KpiCard';
import ProjectionChart from '@/components/ProjectionChart';
import DpdPieChart from '@/components/DpdPieChart';
import LiquidityStressChart from '@/components/LiquidityStressChart';
import CustomSelect from '@/components/ui/CustomSelect';
import RefreshButton from '@/components/ui/RefreshButton';
import { TrendingUp, Droplet, Package, Target, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
    const [riskData, setRiskData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState('BAZ');
    const [stressData, setStressData] = useState<any>(null);

    useEffect(() => {
        loadRiskData();
        loadStressData();
    }, [selectedScenario]);

    const loadStressData = async () => {
        try {
            const data = await apiClient.getLiquidityStress();
            setStressData(data);
        } catch (error) {
            console.error('Stres test verileri yüklenemedi:', error);
        }
    };

    const loadRiskData = async (showOverlay = true) => {
        try {
            if (showOverlay) setLoading(true);
            const data = await apiClient.getRiskSummary(selectedScenario);
            setRiskData(data);
        } catch (error) {
            console.error('Risk verileri yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of the component)

    {/* Charts Section */ }


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingState />
            </div>
        );
    }

    const kpiData = riskData?.ozet || [];

    // KPI'ları al
    const getNpl = kpiData.find((k: any) => k.kpi_kodu === 'NPL');
    const getLcr = kpiData.find((k: any) => k.kpi_kodu === 'LCR');
    const getTeslimat = kpiData.find((k: any) => k.kpi_kodu === 'TESLIMAT_BASKI');
    const getKonsBolge = kpiData.find((k: any) => k.kpi_kodu === 'KONSANTRASYON_BOLGE');
    const getKonsVade = kpiData.find((k: any) => k.kpi_kodu === 'KONSANTRASYON_VADE');
    const getDpd = kpiData.find((k: any) => k.kpi_kodu === 'DPD_DAGILIM');
    const getTeslimatYuk = kpiData.find((k: any) => k.kpi_kodu === 'TESLIMAT_YUKUMLULUGU');
    const getIptal = kpiData.find((k: any) => k.kpi_kodu === 'IPTAL_ORANI');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Risk Dashboard</h2>
                    <p className="text-gray-600 mt-1">Anlık risk göstergeleri ve trendler</p>
                </div>

                <div className="flex items-center gap-2">
                    <CustomSelect
                        value={selectedScenario}
                        onChange={(val) => setSelectedScenario(val as string)}
                        variant="secondary"
                        options={[
                            { value: 'BAZ', label: 'Baz Senaryo' },
                            { value: 'OLUMSUZ', label: 'Olumsuz Senaryo' },
                            { value: 'OLUMLU', label: 'Olumlu Senaryo' }
                        ]}
                    />

                    <RefreshButton onClick={() => loadRiskData(false)} />
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getNpl && (
                    <KpiCard
                        title="NPL Oranı"
                        value={parseFloat(getNpl.deger)}
                        unit="YUZDE"
                        riskLevel={getNpl.risk_seviyesi}
                        icon={<AlertTriangle className="w-8 h-8" />}
                    />
                )}

                {getLcr && (
                    <KpiCard
                        title="Likidite Oranı (LCR)"
                        value={parseFloat(getLcr.deger)}
                        unit="ORAN"
                        riskLevel={getLcr.risk_seviyesi}
                        icon={<Droplet className="w-8 h-8" />}
                    />
                )}

                {getTeslimat && (
                    <KpiCard
                        title="Teslimat Baskısı"
                        value={parseFloat(getTeslimat.deger)}
                        unit="ORAN"
                        riskLevel={getTeslimat.risk_seviyesi}
                        icon={<Package className="w-8 h-8" />}
                    />
                )}

                {getKonsBolge && (
                    <KpiCard
                        title="Bölge Konsantrasyonu"
                        value={parseFloat(getKonsBolge.deger)}
                        unit="YUZDE"
                        riskLevel={getKonsBolge.risk_seviyesi}
                        icon={<Target className="w-8 h-8" />}
                    />
                )}

                {getKonsVade && (
                    <KpiCard
                        title="Vade Konsantrasyonu"
                        value={parseFloat(getKonsVade.deger)}
                        unit="YUZDE"
                        riskLevel={getKonsVade.risk_seviyesi}
                        icon={<Clock className="w-8 h-8" />}
                    />
                )}

                {getDpd && (
                    <KpiCard
                        title="Gecikme (90+ Gün)"
                        value={parseFloat(getDpd.deger)}
                        unit="YUZDE"
                        riskLevel={getDpd.risk_seviyesi}
                        icon={<TrendingUp className="w-8 h-8" />}
                    />
                )}

                {getTeslimatYuk && (
                    <KpiCard
                        title="Teslimat Yükümlülüğü"
                        value={parseFloat(getTeslimatYuk.deger)}
                        unit="TUTAR"
                        riskLevel={getTeslimatYuk.risk_seviyesi}
                        icon={<Package className="w-8 h-8" />}
                    />
                )}

                {getIptal && (
                    <KpiCard
                        title="İptal Oranı"
                        value={parseFloat(getIptal.deger)}
                        unit="YUZDE"
                        riskLevel={getIptal.risk_seviyesi}
                        icon={<Package className="w-8 h-8" />} // Using Package for now, maybe UserMinus available?
                    />
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getDpd && getDpd.detay && (
                    <DpdPieChart data={getDpd.detay} />
                )}

                {stressData && (
                    <LiquidityStressChart data={stressData} />
                )}
            </div>

            {/* Info Card */}
            <div className="card bg-blue-50 border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900">Bilgilendirme</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Grafik ve projeksiyon verileri için "Senaryolar" sayfasından tüm senaryoları çalıştırmanız gerekmektedir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

