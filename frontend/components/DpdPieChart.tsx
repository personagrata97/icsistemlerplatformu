'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DpdPieChartProps {
    data: {
        guncel: number;
        dpd_1_30: number;
        dpd_31_90: number;
        dpd_90_plus: number;
    };
}

export default function DpdPieChart({ data }: DpdPieChartProps) {
    const chartData = [
        { name: 'Güncel', value: data.guncel, color: '#10b981' }, // Green
        { name: '1-30 Gün', value: data.dpd_1_30, color: '#facc15' }, // Yellow
        { name: '31-90 Gün', value: data.dpd_31_90, color: '#f97316' }, // Orange
        { name: '90+ Gün', value: data.dpd_90_plus, color: '#ef4444' }, // Red
    ].filter(item => item.value > 0);

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gecikme Dağılımı (Sözleşme Adedi)</h3>

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
                            formatter={(value: number) => [value + ' Adet', 'Sözleşme Sayısı']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
