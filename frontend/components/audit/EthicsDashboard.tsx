import React from 'react';
import StatCard from '@/components/ui/StatCard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Gavel, FileText, Users, AlertCircle, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EthicsStats {
    totalReports: number;
    openReports: number;
    investigating: number;
    closedReports: number;
    overdueReports: number;
    disciplinaryCount?: number;
    convertedToReport?: number;
    referrals?: number;
    categoryBreakdown: { category: string; count: number }[];
    outcomeBreakdown?: { outcome: string; count: number }[];
}

interface EthicsDashboardProps {
    stats: EthicsStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const OUTCOME_COLORS = {
    'Disiplin İşlemi Uygulandı': '#DC2626', // Red
    'Soruşturma Raporu Yazıldı': '#F59E0B', // Amber
    'Asılsız Bulundu': '#10B981', // Green
    'İK\'ya Devredildi': '#3B82F6', // Blue
    'İlgili Birime Aktarıldı': '#3B82F6', // Blue
    'Diğer': '#9CA3AF' // Gray
};

export default function EthicsDashboard({ stats }: EthicsDashboardProps) {

    // Prepare chart data
    const categoryData = stats.categoryBreakdown || [];
    const outcomeData = stats.outcomeBreakdown || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Disiplin İşlemi"
                    value={stats.disciplinaryCount || 0}
                    icon={<Gavel size={20} />}
                    color="red"
                    subtext="Sonuçlanan dosyalardan"
                    badgeText={`%${stats.closedReports > 0 ? Math.round(((stats.disciplinaryCount || 0) / stats.closedReports) * 100) : 0} Başarı`}
                    badgeColor="text-red-600 bg-red-50"
                    infoTooltip="İncelenen ve ihlali doğrulanarak disiplin kurulu/aksiyonu ile sonuçlanan bildirimlerin sayısı."
                />

                <StatCard
                    title="Rapora Dönüşen"
                    value={stats.convertedToReport || 0}
                    icon={<FileText size={20} />}
                    color="amber"
                    subtext="Resmi rapora bağlanan"
                    badgeText="Denetim"
                    badgeColor="text-amber-600 bg-amber-50"
                    infoTooltip="Yapılan inceleme neticesinde resmi denetim/soruşturma raporuna dönüştürülen etik ihbar sayısı."
                />

                <StatCard
                    title="Birim Devri (İK vb.)"
                    value={stats.referrals || 0}
                    icon={<Users size={20} />}
                    color="blue"
                    subtext="İlgili birimlere iletilen"
                    infoTooltip="Denetim komitesi dışında, aksiyon için yetkili departmanlara (İnsan Kaynakları vb.) yönlendirilen bildirimler."
                />

                <StatCard
                    title="SLA Aşımı"
                    value={stats.overdueReports || 0}
                    icon={<AlertCircle size={20} />}
                    color="purple"
                    subtext="Süresi geçen dosyalar"
                    badgeText={stats.overdueReports > 0 ? "Aksiyon Al" : undefined}
                    badgeColor="text-white bg-red-500 animate-pulse"
                    infoTooltip="Yönetmelikte belirlenen maksimum inceleme/sonuçlandırma süresini (SLA) aşmış olan bildirimlerin sayısı."
                />
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Outcome Analysis */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-600" />
                            Kapanış & Sonuç Analizi
                        </h3>
                        <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100">Kapatılan: {stats.closedReports}</span>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        {outcomeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={outcomeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="outcome" type="category" width={150} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f4f4f5' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value, name) => [value, name === 'count' ? 'Sayı' : name]}
                                    />
                                    <Bar dataKey="count" name="Sayı" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20}>
                                        {
                                            outcomeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={OUTCOME_COLORS[entry.outcome as keyof typeof OUTCOME_COLORS] || '#6366F1'} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <TrendingUp size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Henüz kapanmış dosya verisi yok.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ShieldAlert size={18} className="text-indigo-600" />
                        Kategori Dağılımı
                    </h3>
                    <div className="h-64 w-full">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Sayı' : name]} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p className="text-sm">Veri yok.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
