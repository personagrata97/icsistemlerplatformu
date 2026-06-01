'use client';

import React from 'react';
import { Award, Save, CheckCircle, Lightbulb, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import Tooltip from '@/components/ui/Tooltip';

interface AuditOpinionSectionProps {
    selectedOpinion: string;
    setSelectedOpinion: (val: string) => void;
    opinionOptions: any[];
    onSaveOpinion: () => void;
    currentSavedOpinion: string;
    findings?: { riskLevel?: string; risk?: string; status: string }[];
}

// Bulgu bazlı otomatik görüş önerisi
const getSuggestedOpinion = (findings: { riskLevel?: string; risk?: string; status: string }[]) => {
    if (!findings || findings.length === 0) return null;

    // Sadece kapanmamış ve iptal edilmemiş bulguları dikkate al (Açık, Taslak vb.)
    const activeFindings = findings.filter(f => !['Tamamlandı', 'Kapalı', 'Risk Kabul Edildi', 'Silindi', 'Kapatıldı'].includes(f.status));
    const total = activeFindings.length;
    if (total === 0) {
        return { value: 'Olumlu - Etkin', reason: 'Tüm bulgular aksiyona bağlanarak kapatılmış veya hiç açık bulgu yok.' };
    }

    const kritik = activeFindings.filter(f => (f.riskLevel || f.risk) === 'Kritik').length;
    const yuksek = activeFindings.filter(f => (f.riskLevel || f.risk) === 'Yüksek').length;
    const orta = activeFindings.filter(f => (f.riskLevel || f.risk) === 'Orta').length;
    const highRiskRatio = (kritik + yuksek) / total;

    if (kritik > 0 && highRiskRatio > 0.5) return { value: 'Yetersiz - Kritik', reason: `${kritik} kritik, ${yuksek} yüksek riskli bulgu (toplam bulguların %${Math.round(highRiskRatio * 100)}'i yüksek+kritik)` };
    if (kritik > 0 || highRiskRatio > 0.3) return { value: 'Yetersiz - Zayıf', reason: `${kritik} kritik, ${yuksek} yüksek riskli bulgu mevcut` };
    if (yuksek > 0 && highRiskRatio > 0.2) return { value: 'Gelişime Açık - Önemli', reason: `${yuksek} yüksek riskli bulgu, iyileştirme alanları önemli` };
    if (orta > 0 || yuksek > 0) return { value: 'Gelişime Açık - Orta', reason: `${orta} orta, ${yuksek} yüksek düzeyde bulgu` };
    return { value: 'Olumlu - Etkin', reason: 'Ağırlıklı olarak düşük riskli bulgular, kontroller etkin' };
};

const AuditOpinionSection: React.FC<AuditOpinionSectionProps> = ({
    selectedOpinion,
    setSelectedOpinion,
    opinionOptions,
    onSaveOpinion,
    currentSavedOpinion,
    findings
}) => {
    const suggestion = getSuggestedOpinion(findings || []);

    return (
        <div className="card !p-0 shadow-sm">
            <div className="p-4 border-b bg-gray-50/50 rounded-t-lg flex items-center gap-3">
                <Award size={20} className="text-gray-600" />
                <h3 className="font-semibold text-gray-800">Denetim Görüşü</h3>
            </div>

            <div className="p-5 space-y-4">
                {/* Otomatik Öneri Banner */}
                {suggestion && !currentSavedOpinion && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                        <Lightbulb size={16} className="text-blue-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800">Önerilen Görüş: {suggestion.value}</p>
                            <p className="text-xs text-blue-600 mt-0.5">{suggestion.reason}</p>
                            <button
                                onClick={() => setSelectedOpinion(suggestion.value)}
                                className="text-xs text-blue-700 font-bold underline mt-1 hover:text-blue-900"
                            >
                                Bu öneriyi kullan →
                            </button>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Görüş Türü *</label>
                    <CustomSelect
                        value={selectedOpinion}
                        onChange={(val) => setSelectedOpinion(val as string)}
                        options={opinionOptions}
                        placeholder="Görüş türü seçiniz..."
                        className="w-full"
                    />
                </div>

                {selectedOpinion && (
                    <div className={`p-3 rounded-lg text-sm ${selectedOpinion.includes('Olumlu') ? 'bg-green-50 border border-green-200 text-green-700' :
                        selectedOpinion.includes('Gelişime') ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                            selectedOpinion.includes('Yetersiz') ? 'bg-red-50 border border-red-200 text-red-700' :
                                'bg-gray-50 border border-gray-200 text-gray-700'
                        }`}>
                        <strong>Seçilen Görüş:</strong> {selectedOpinion}
                    </div>
                )}

                {/* HATA/UYARI: Kritik bulgu varken Olumlu görüş seçilirse */}
                {selectedOpinion && selectedOpinion.includes('Olumlu') && findings && findings.filter(f => (f.riskLevel || f.risk) === 'Kritik' && !['Tamamlandı', 'Kapalı', 'Risk Kabul Edildi', 'Silindi', 'Kapatıldı'].includes(f.status)).length > 0 && (
                    <div className="p-3 mt-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">Uyumsuzluk Uyarısı!</p>
                            <p className="text-xs text-red-700 mt-0.5">Sistemde {findings.filter(f => (f.riskLevel || f.risk) === 'Kritik' && !['Tamamlandı', 'Kapalı', 'Risk Kabul Edildi', 'Silindi', 'Kapatıldı'].includes(f.status)).length} adet <strong>Açık Kritik</strong> riskli bulgu varken "Olumlu" görüş bildiriyorsunuz. Lütfen bu durumu Rapor Yönetici Özeti'nde gerekçelendirin.</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Tooltip content="Seçilen denetim görüşünü kaydet">
                        <Button className="gap-2" onClick={onSaveOpinion}>
                            <Save size={16} /> Görüşü Kaydet
                        </Button>
                    </Tooltip>
                </div>

                {currentSavedOpinion && (
                    <div className={`p-3 rounded-lg text-sm ${currentSavedOpinion.includes('Olumlu') ? 'bg-green-50 border border-green-200' :
                        currentSavedOpinion.includes('Gelişime') ? 'bg-yellow-50 border border-yellow-200' :
                            currentSavedOpinion.includes('Yetersiz') ? 'bg-red-50 border border-red-200' :
                                'bg-gray-50 border border-gray-200'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-primary" />
                            <strong>Kayıtlı Görüş:</strong>
                        </div>
                        <span>{currentSavedOpinion}</span>
                        <p className="text-xs text-gray-500 mt-2">Bu görüş nihai raporda Yönetici Özeti bölümünde yer alacaktır.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditOpinionSection;
