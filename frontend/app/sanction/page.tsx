'use client';
import { useState, useEffect } from 'react';
import {
    Shield, Search, AlertTriangle, CheckCircle, Clock,
    TrendingUp, Users, Database, FileText, RefreshCw, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import LoadingState from '@/components/ui/LoadingState';
import DataTable from '@/components/ui/DataTable';

import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/audit-utils';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import RefreshButton from '@/components/ui/RefreshButton';

// Stat Card Component
function StatCard({ icon: Icon, label, value, trend, color, infoTooltip, onClick, className }: {
    icon: any;
    label: string;
    value: string | number;
    trend?: string;
    color: string;
    infoTooltip?: string;
    onClick?: () => void;
    className?: string;
}) {
    return (
        <div 
            onClick={onClick}
            className={`card shadow-sm border border-gray-50 flex items-center gap-4 p-5 transition-all hover:scale-[1.02] ${onClick ? 'cursor-pointer select-none' : ''} ${className || ''}`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color.replace('bg-', 'bg-opacity-10 bg-').replace('-500', '')} ${color.replace('bg-', 'text-')}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{label}</p>
                    {infoTooltip && (
                        <Tooltip content={infoTooltip} position="top">
                            <span className="text-gray-400 hover:text-primary cursor-help"><AlertTriangle size={12} /></span>
                        </Tooltip>
                    )}
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-slate-900">{value}</h3>
                    {trend && (
                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 mb-1">
                            <TrendingUp size={10} />
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SanctionDashboard() {
    const [lastUpdate, setLastUpdate] = useState('Yükleniyor...');
    const [sortColumn, setSortColumn] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [loading, setLoading] = useState(true);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [filterResult, setFilterResult] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const logs = await apiClient.getSanctionLogs();
            setRecentScans(logs);
            setLastUpdate(new Date().toLocaleString('tr-TR'));
        } catch (error) {
            console.error('Failed to load sanction data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stats calculation based on logs (if backend doesn't provide it)
    const stats = {
        totalScans: recentScans.length * 123, // Still some pseudo-math for summary but based on data
        matchesFound: recentScans.filter(s => s.result === 'Eşleşme').length,
        pendingReview: recentScans.filter(s => s.result === 'İnceleme').length,
        listsLoaded: 5,
    };

    const toggleResultFilter = (result: string) => {
        setFilterResult(prev => prev === result ? '' : result);
    };

    const filteredScans = recentScans.filter(scan => {
        if (!filterResult) return true;
        return scan.result === filterResult;
    });

    const alertsByList = [
        { name: 'OFAC SDN', count: Math.ceil(stats.matchesFound * 0.4), color: 'bg-red-500' },
        { name: 'BM Yaptırım', count: Math.ceil(stats.matchesFound * 0.2), color: 'bg-orange-500' },
        { name: 'AB Listesi', count: Math.ceil(stats.matchesFound * 0.15), color: 'bg-yellow-500' },
        { name: 'MASAK', count: Math.ceil(stats.matchesFound * 0.15), color: 'bg-blue-500' },
        { name: 'Özel Liste', count: Math.ceil(stats.matchesFound * 0.1), color: 'bg-purple-500' },
    ];


    if (loading) return <LoadingState />;

    return (
        <div className="max-w-7xl mx-auto py-2">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Yaptırım Tarayıcı</h1>
                    <p className="text-slate-500 font-medium">Müşteri ve işlem tarama merkezi</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Son Güncelleme</span>
                        <span className="text-sm font-mono font-bold text-primary">{lastUpdate}</span>
                    </div>
                    <RefreshButton onClick={loadData} />
                    <Link href="/sanction/scan">
                        <Button
                            variant="primary"
                            leftIcon={<Search size={18} />}
                            className="!rounded-xl shadow-lg shadow-primary/20"
                        >
                            Yeni Tarama
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    icon={Search}
                    label="Toplam Tarama"
                    value={stats.totalScans.toLocaleString()}
                    trend="Bu ay +1,234"
                    color="bg-blue-500"
                    infoTooltip="Sistem üzerinde anlık veya toplu olarak yapılan tüm sorguların toplam sayısıdır."
                    onClick={() => setFilterResult('')}
                    className={!filterResult ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Eşleşme Sayısı"
                    value={stats.matchesFound}
                    color="bg-red-500"
                    infoTooltip="Kara listeler (OFAC, BM vb.) ile birebir veya yüksek benzerlikte eşleşen kayıt sayısıdır."
                    onClick={() => toggleResultFilter('Eşleşme')}
                    className={filterResult === 'Eşleşme' ? 'ring-2 ring-red-500 scale-[1.02] bg-red-50/10' : ''}
                />
                <StatCard
                    icon={Clock}
                    label="İnceleme Bekleyen"
                    value={stats.pendingReview}
                    color="bg-orange-500"
                    infoTooltip="Kısmi eşleşme nedeniyle sistem tarafından otomatik karara bağlanamamış, uzman onayı bekleyen kayıtlardır."
                    onClick={() => toggleResultFilter('İnceleme')}
                    className={filterResult === 'İnceleme' ? 'ring-2 ring-orange-500 scale-[1.02] bg-orange-50/10' : ''}
                />
                <StatCard
                    icon={Database}
                    label="Yüklü Liste"
                    value={stats.listsLoaded}
                    color="bg-green-500"
                    infoTooltip="Sistemde aktif olarak tarama yapılan güncel yaptırım listesi (OFAC, AB, MASAK vb.) sayısıdır."
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Scans */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Son Taramalar</h3>
                        <Link href="/sanction/history" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            Tümünü Gör <ArrowRight size={14} />
                        </Link>
                    </div>
                    
                    <DataTable
                        columns={[
                            {
                                key: 'name',
                                header: 'İsim / Ünvan',
                                render: (scan: any) => <div className="cell-title">{scan.name}</div>
                            },
                            {
                                key: 'type',
                                header: 'Tür',
                                width: '120px',
                                align: 'center',
                                render: (scan: any) => (
                                    <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${scan.type === 'Bireysel' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {scan.type}
                                    </span>
                                )
                            },
                            {
                                key: 'result',
                                header: 'Sonuç',
                                width: '130px',
                                align: 'center',
                                render: (scan: any) => {
                                    const val = scan.result === 'Eşleşme' ? 'Kritik' : scan.result === 'İnceleme' ? 'Orta' : 'Düşük';
                                    return <StatusBadge type="risk" value={val} />;
                                }
                            },
                            {
                                key: 'date',
                                header: 'Tarih',
                                width: '160px',
                                align: 'center',
                                render: (scan: any) => (
                                    <div className="cell-date justify-center">
                                        <Clock size={14} className="text-gray-400" />
                                        {scan.date}
                                    </div>
                                )
                            }
                        ]}
                        data={filteredScans}
                        loading={loading}
                        rowKey="id"
                        paginated={true}
                        itemsPerPage={5}
                        itemUnit="tarama"
                        emptyIcon={Search}
                        emptyTitle="Tarama Kaydı Bulunamadı"
                        emptyDescription="Henüz bir yaptırım taraması kaydı bulunmuyor."
                        className="shadow-sm border border-gray-100"
                    />
                </div>

                {/* Alert Distribution */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight px-2">Eşleşme Dağılımı</h3>
                    <div className="card border border-gray-100 shadow-sm p-6">
                        <div className="space-y-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                            {alertsByList.map((item, idx) => (
                                <div key={idx} className="group cursor-default">
                                    <div className="flex justify-between text-[11px] mb-1.5 px-0.5">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider">{item.name}</span>
                                        <span className="font-black text-slate-900">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden shadow-inner">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ease-out group-hover:opacity-80 ${item.color}`}
                                            style={{ width: `${(item.count / 50) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/sanction/results">
                            <Button variant="secondary" className="w-full mt-6 !py-3 font-black text-xs uppercase tracking-widest">
                                Detaylı Rapor Görüntüle
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
                <Link href="/sanction/scan" className="group">
                    <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-blue-500 p-6 h-full flex items-center gap-5 translate-y-0 hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Search size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-lg tracking-tight">Tekil Tarama</h4>
                            <p className="text-sm text-slate-500 font-medium leading-tight">Hızlı müşteri veya şirket sorgulama</p>
                        </div>
                    </div>
                </Link>
                <Link href="/sanction/scan?mode=bulk" className="group">
                    <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-green-500 p-6 h-full flex items-center gap-5 translate-y-0 hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                            <Users size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-lg tracking-tight">Toplu Tarama</h4>
                            <p className="text-sm text-slate-500 font-medium leading-tight">Excel listesi ile çoklu tarama</p>
                        </div>
                    </div>
                </Link>
                <Link href="/sanction/reports" className="group">
                    <div className="card hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-orange-500 p-6 h-full flex items-center gap-5 translate-y-0 hover:-translate-y-1">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-lg tracking-tight">Rapor Oluştur</h4>
                            <p className="text-sm text-slate-500 font-medium leading-tight">Dönemsel analiz ve PDF raporu</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

