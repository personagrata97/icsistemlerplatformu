import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { hesaplaBirimKarnesi, BirimKarnesi } from '@/lib/audit-utils';
import { auditApi } from '@/lib/audit-api';
import { AlertCircle, Target, Clock, TrendingUp, CheckCircle, ShieldAlert } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

interface UnitScorecardModalProps {
    isOpen: boolean;
    onClose: () => void;
    unitName: string;
}

export default function UnitScorecardModal({ isOpen, onClose, unitName }: UnitScorecardModalProps) {
    const [scorecard, setScorecard] = useState<BirimKarnesi | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && unitName) {
            loadScorecard();
        }
    }, [isOpen, unitName]);

    const loadScorecard = async () => {
        setLoading(true);
        try {
            const findings = await auditApi.getFindings();
            const safeFindings = Array.isArray(findings) ? findings : [];
            const karn = hesaplaBirimKarnesi(unitName, safeFindings);
            setScorecard(karn);
        } catch (error) {
            console.error('Birim karnesi yükleme hatası:', error);
            setScorecard(null);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${unitName} - Birim Karnesi (SLA Performansı)`}
            size="lg"
        >
            {loading ? (
                <div className="py-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : !scorecard || scorecard.toplamBulgu === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center font-poppins">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4"><AlertCircle size={32} /></div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">Veri Bulunamadı</h4>
                    <p className="text-slate-500 text-sm max-w-sm">Bu birim için henüz atanmış bir bulgu veya denetim geçmişi bulunmadığından karne oluşturulamamıştır.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Toplam Bulgu"
                            value={scorecard.toplamBulgu}
                            icon={<Target size={20} />}
                            color="blue"
                            infoTooltip="Birimle ilişkilendirilmiş, tüm zamanlardaki açık veya kapalı toplam bulgu sayısıdır."
                        />
                        <StatCard
                            title="Açık Bulgu"
                            value={scorecard.acikBulgu}
                            icon={<AlertCircle size={20} />}
                            color="red"
                            infoTooltip="Henüz aksiyon alınmamış, doğrulanmamış veya süreci devam eden bulgu sayısıdır."
                        />
                        <StatCard
                            title="Kapanan Bulgu"
                            value={scorecard.kapaliBulgu}
                            icon={<CheckCircle size={20} />}
                            color="green"
                            infoTooltip="Aksiyonu alınmış ve denetçi tarafından onaylanarak tamamen kapatılmış bulgu sayısıdır."
                        />
                        <StatCard
                            title="Tekerrür"
                            value={scorecard.tekrarlayanBulgu}
                            icon={<TrendingUp size={20} />}
                            color="orange"
                            infoTooltip="Geçmiş denetimlerde tespit edilip kapatılmasına rağmen, sonraki denetimlerde aynı birimde tekrar eden bulguların sayısıdır."
                        />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-gray-500" /> Hizmet Seviyesi (SLA) Metrikleri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Ort. Cevaplanma Süresi</p>
                                <div className="text-2xl font-bold text-gray-800">{scorecard.ortalamaCevaplanmaSuresi} <span className="text-sm font-normal text-gray-500">gün</span></div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Ort. Giderilme Süresi</p>
                                <div className="text-2xl font-bold text-gray-800">{scorecard.ortalamaGiderulmeSuresi} <span className="text-sm font-normal text-gray-500">gün</span></div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">SLA Uyum Oranı</p>
                                <div className="text-2xl font-bold text-green-600">%{scorecard.slaUyumOrani}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-gray-500" /> Risk Dağılımı
                        </h3>
                        <div className="flex gap-4">
                            {Object.entries(scorecard.riskDagilimi).map(([risk, count]) => (
                                <div key={risk} className="bg-white border rounded-lg px-4 py-2 flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${risk === 'Kritik' ? 'bg-red-900' : risk === 'Yüksek' ? 'bg-red-500' : risk === 'Orta' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                                    <div>
                                        <div className="text-xs text-gray-500">{risk}</div>
                                        <div className="font-bold text-gray-800">{count}</div>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(scorecard.riskDagilimi).length === 0 && (
                                <div className="text-sm text-gray-500 italic">Bulgu kaydı bulunmuyor.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
