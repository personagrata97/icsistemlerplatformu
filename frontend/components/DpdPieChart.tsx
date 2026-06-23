'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DpdPieChartProps {
    data: {
        toplam_tutar: number;
        toplam_sozlesme: number;
        genel_karsilik: number;
        ozel_karsilik: number;
        toplam_karsilik: number;
        gruplar: {
            grup1: { count: number; tutar: number; karsilikOran: number; ad: string };
            grup2: { count: number; tutar: number; karsilikOran: number; ad: string };
            grup3: { count: number; tutar: number; karsilikOran: number; ad: string };
            grup4: { count: number; tutar: number; karsilikOran: number; ad: string };
            grup5: { count: number; tutar: number; karsilikOran: number; ad: string };
        };
    };
}

export default function DpdPieChart({ data }: DpdPieChartProps) {
    if (!data?.gruplar) return null;

    const g = data.gruplar;
    const chartData = [
        { name: '1. Grup (0-30)', value: g.grup1.tutar, color: '#10b981' },
        { name: '2. Grup (31-90)', value: g.grup2.tutar, color: '#facc15' },
        { name: '3. Grup (91-180)', value: g.grup3.tutar, color: '#f97316' },
        { name: '4. Grup (181-365)', value: g.grup4.tutar, color: '#ea580c' },
        { name: '5. Grup (365+)', value: g.grup5.tutar, color: '#dc2626' },
    ].filter(item => item.value > 0);

    const formatMoney = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Gecikme Dağılımı ve Karşılıklar (TFRS 9)</h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [formatMoney(value), 'Hacim']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">Genel Karşılık (Grup 1-2)</div>
                    <div className="text-lg font-semibold text-gray-900">{formatMoney(data.genel_karsilik)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-500">Özel Karşılık (Grup 3-4-5)</div>
                    <div className="text-lg font-semibold text-red-600">{formatMoney(data.ozel_karsilik)}</div>
                </div>
            </div>
        </div>
    );
}
