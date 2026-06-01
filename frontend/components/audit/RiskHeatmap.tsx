import React, { useMemo } from 'react';
import { AuditableUnit } from '@/lib/audit-api';
import { Activity, Info } from 'lucide-react';

interface RiskHeatmapProps {
    units: AuditableUnit[];
    onCellClick?: (inherentRisk: string, controlEffectiveness: string) => void;
}

export default function RiskHeatmap({ units, onCellClick }: RiskHeatmapProps) {
    // 3x3 Matrix Data Calculation
    const matrix = useMemo(() => {
        const data: Record<string, Record<string, number>> = {
            'Yüksek': { 'Zayıf': 0, 'Orta': 0, 'Güçlü': 0 },
            'Orta': { 'Zayıf': 0, 'Orta': 0, 'Güçlü': 0 },
            'Düşük': { 'Zayıf': 0, 'Orta': 0, 'Güçlü': 0 }
        };

        units.forEach(unit => {
            const inherent = (unit.inherentRisk || 'Orta') as string;
            const control = (unit.controlEffectiveness || 'Orta') as string;

            if (data[inherent] && data[inherent][control] !== undefined) {
                data[inherent][control]++;
            }
        });

        return data;
    }, [units]);

    const getCellColor = (inherent: string, control: string) => {
        if (inherent === 'Yüksek') {
            if (control === 'Zayıf') return 'bg-[#7f1d1d] text-white'; // Kritik (Bordo)
            if (control === 'Orta') return 'bg-[#dc2626] text-white';  // Yüksek (Kırmızı)
            return 'bg-[#f97316] text-white'; // Orta-Yüksek (Turuncu)
        }
        if (inherent === 'Orta') {
            if (control === 'Zayıf') return 'bg-[#dc2626] text-white';  // Yüksek (Kırmızı)
            if (control === 'Orta') return 'bg-[#f97316] text-white';   // Orta (Turuncu)
            return 'bg-[#facc15] text-[#854d0e]'; // Orta-Düşük (Sarı)
        }
        // Düşük
        if (control === 'Zayıf') return 'bg-[#f97316] text-white';    // Orta (Turuncu)
        if (control === 'Orta') return 'bg-[#facc15] text-[#854d0e]'; // Düşük (Sarı)
        return 'bg-emerald-100 text-emerald-800'; // En Düşük (Yeşil)
    };

    const getRiskLabel = (inherent: string, control: string) => {
        if (inherent === 'Yüksek' && control === 'Zayıf') return 'Kritik';
        if ((inherent === 'Yüksek' && control === 'Orta') || (inherent === 'Orta' && control === 'Zayıf')) return 'Yüksek';
        if (inherent === 'Düşük' && control === 'Güçlü') return 'Düşük';
        return 'Orta';
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                <Activity size={20} className="text-primary" />
                Risk Isı Haritası
            </h3>

            <div className="flex flex-col items-center">
                {/* Y-Axis Label */}
                <div className="flex w-full">
                    <div className="w-8 flex items-center justify-center -rotate-90 font-bold text-gray-500 text-xs tracking-wider whitespace-nowrap h-[300px]">
                        DOĞAL RİSK
                    </div>

                    <div className="flex-1">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {/* Kontrol Etkinliği Başlıkları (Alt) */}
                            {/* Izgara satırları */}
                            {['Yüksek', 'Orta', 'Düşük'].map((inherent) => (
                                <React.Fragment key={inherent}>
                                    {['Zayıf', 'Orta', 'Güçlü'].map((control) => (
                                        <div
                                            key={`${inherent}-${control}`}
                                            className={`
                                                h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer
                                                transition-all hover:scale-[1.02] hover:shadow-md
                                                ${getCellColor(inherent, control)}
                                            `}
                                            onClick={() => onCellClick && onCellClick(inherent, control)}
                                        >
                                            <span className="text-2xl font-bold">{matrix[inherent] && matrix[inherent][control]}</span>
                                            <span className="text-[10px] uppercase opacity-80 font-semibold mt-1">
                                                {getRiskLabel(inherent, control)}
                                            </span>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* X-Axis Label */}
                <div className="w-full pl-8">
                    <div className="grid grid-cols-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <div>Zayıf</div>
                        <div>Orta</div>
                        <div>Güçlü</div>
                    </div>
                    <div className="text-center text-xs font-bold text-gray-500 tracking-wider">
                        KONTROL ETKİNLİĞİ
                    </div>
                </div>

                <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg w-full">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <p>
                        Bu matris, denetim evrenindeki birimlerin <strong>Doğal Risk</strong> ve <strong>Kontrol Etkinliği</strong> seviyelerine göre dağılımını gösterir.
                        Kırmızı alanlar (Sol Üst) en yüksek riskli ve öncelikli denetlenmesi gereken alanları temsil eder.
                    </p>
                </div>
            </div>
        </div>
    );
}
