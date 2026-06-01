'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface LiquidityStressChartProps {
    data: Array<{
        senaryo_ad: string;
        lcr_deger: number;
        risk_seviyesi: string;
    }>;
}

export default function LiquidityStressChart({ data }: LiquidityStressChartProps) {
    // Senaryo adlarını daha okunaklı hale getir
    const formattedData = data.map(item => {
        let name = item.senaryo_ad;
        if (name === 'TESLIMAT_ARTIS_25') name = 'Teslimat (+%25)';
        if (name === 'IPTAL_ARTIS_20') name = 'İptal (+%20)';
        if (name === 'TAHSILAT_DUSUS_15') name = 'Tahsilat (-%15)';
        return { ...item, name };
    });

    const getBarColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'RED': return '#ef4444';
            case 'YELLOW': return '#facc15';
            case 'GREEN': return '#10b981';
            default: return '#3b82f6';
        }
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Likidite Stres Testi (LCR)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis domain={[0, 'auto']} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="lcr_deger" name="LCR Değeri" radius={[4, 4, 0, 0]}>
                            {formattedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.risk_seviyesi)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-500">
                <p>* LCR {'>'} 1.0 olması beklenir (Yeşil bölge).</p>
            </div>
        </div>
    );
}
