'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PlayCircle, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { RiskLogger } from '@/lib/risk-logger';

const scenarios = [
    {
        code: 'BAZ',
        title: 'Baz Senaryo',
        description: 'Mevcut ekonomik koşulların devam ettiği varsayımı.',
        params: { iptal: '%0', gecikme: '%0', teslimat: '%0', likidite: '%0' },
        color: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600'
    },
    {
        code: 'OLUMSUZ',
        title: 'Olumsuz Senaryo',
        description: 'Ekonomik daralma ve yüksek volatilite koşulları.',
        params: { iptal: '%+20', gecikme: '%+15', teslimat: '%+10', likidite: '%-12' },
        color: 'bg-red-50 border-red-200',
        iconColor: 'text-red-600'
    },
    {
        code: 'OLUMLU',
        title: 'Olumlu Senaryo',
        description: 'Ekonomik büyüme ve iyileşme beklentisi.',
        params: { iptal: '%-10', gecikme: '%-8', teslimat: '%-5', likidite: '%+12' },
        color: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600'
    }
];

import { useToast } from '@/components/Toast';

export default function ScenariosPage() {
    const { showToast } = useToast();
    const [running, setRunning] = useState(false);
    const [lastRun, setLastRun] = useState<Date | null>(null);
    const router = useRouter();

    const handleRunAll = async () => {
        try {
            setRunning(true);

            // Log Before Action
            RiskLogger.addLog({
                action: 'Senaryo Başlatıldı',
                description: 'Tüm risk senaryoları tetiklendi.',
                module: 'Risk',
                user: 'Risk Yönetimi', // In real app, get from Context
                details: {
                    status: 'Başlatılıyor',
                    triggeredBy: 'Manual',
                    timestamp: new Date().toISOString()
                }
            });

            const result = await apiClient.runAllScenarios();
            setLastRun(result.tarih ? new Date(result.tarih) : new Date());

            // Log After Action
            RiskLogger.addLog({
                action: 'Senaryo Tamamlandı',
                description: 'Risk senaryoları başarıyla tamamlandı.',
                module: 'Risk',
                user: 'Risk Yönetimi',
                details: {
                    status: 'Tamamlandı',
                    scenariosRun: ['BAZ', 'OLUMSUZ', 'OLUMLU']
                }
            });

            // 2 saniye bekle kullanıcı görsün
            await new Promise(resolve => setTimeout(resolve, 2000));

            router.push('/risk');
        } catch (error) {
            console.error('Senaryolar çalıştırılamadı:', error);

            // Log Error
            RiskLogger.addLog({
                action: 'Senaryo Hatası',
                description: 'Senaryo çalıştırılırken hata oluştu.',
                module: 'Risk',
                user: 'Risk Yönetimi',
                details: { error: String(error) }
            });

            showToast('Senaryo çalıştırma hatası!', 'error');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Senaryo Analizi</h2>
                <p className="text-gray-600 mt-1">Stres testleri ve simülasyon yönetimi</p>
            </div>

            <div className="card border-l-4 border-primary bg-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <PlayCircle className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Tüm Senaryoları Çalıştır</h3>
                            <p className="text-gray-600 mt-1 max-w-xl">
                                Tüm risk motorları seçili parametrelerle yeniden hesaplanacak ve yeni risk skorları üretilecektir. Bu işlem birkaç saniye sürebilir.
                            </p>
                            {lastRun && (
                                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Son çalıştırma: {lastRun.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handleRunAll}
                        isLoading={running}
                        className="px-8 !py-4 text-lg min-w-[200px]"
                        leftIcon={<PlayCircle size={18} />}
                    >
                        Analizi Başlat
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {scenarios.map((s) => (
                    <div key={s.code} className={clsx('card border', s.color)}>
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900">{s.title}</h3>
                            <AlertTriangle className={clsx('w-6 h-6', s.iconColor)} />
                        </div>

                        <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                            {s.description}
                        </p>

                        <div className="space-y-3 bg-white/50 p-4 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">İptal Artışı:</span>
                                <span className="font-semibold">{s.params.iptal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Gecikme Artışı:</span>
                                <span className="font-semibold">{s.params.gecikme}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Teslimat Baskısı:</span>
                                <span className="font-semibold">{s.params.teslimat}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Likidite Değişimi:</span>
                                <span className="font-semibold">{s.params.likidite}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

