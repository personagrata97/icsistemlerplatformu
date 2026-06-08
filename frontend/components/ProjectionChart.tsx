'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProjectionChartProps {
    data: Array<{ ay: string; deger: number }>;
    title: string;
    yAxisLabel?: string;
}

export default function ProjectionChart({ data, title, yAxisLabel = 'Değer' }: ProjectionChartProps) {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="ay"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px',
                        }}
                        formatter={(value: any) => `%${(value * 100).toFixed(2)}`}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="deger"
                        stroke="#009c45"
                        strokeWidth={2}
                        dot={{ fill: '#009c45', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Değer"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
