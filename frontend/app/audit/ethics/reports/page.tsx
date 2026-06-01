'use client';
import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import {
    Shield, PieChart, BarChart, TrendingUp, AlertTriangle, CheckCircle,
    Calendar, Download, ArrowLeft, Users, RefreshCw, Eye
} from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import CodeBadge from '@/components/ui/CodeBadge';
import LoadingState from '@/components/ui/LoadingState';
import Link from 'next/link';
import { useAuditTitle } from '@/context/AuditTitleContext';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ActionLink from '@/components/ui/ActionLink';
import ActionMenu from '@/components/ui/ActionMenu';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/ui/DataTable';
import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import InfoRow from '@/components/ui/InfoRow';

export default function EthicsReportsPage() {
    const { setTitle, setSubtitle } = useAuditTitle();
    const router = useRouter();
    const { showToast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        setTitle('Etik Raporları');
        setSubtitle('Etik bildirim istatistikleri ve vaka analizleri');
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getEthicsStats();
            setStats(data);
        } catch (error) {
            console.error('Etik rapor istatistikleri yükleme hatası:', error);
            setStats({
                totalReports: 0,
                openReports: 0,
                investigating: 0,
                closedReports: 0,
                categoryStats: [],
                priorityStats: { critical: 0, high: 0, medium: 0, low: 0 },
                recentReports: []
            });
            showToast('Rapor verileri yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingState fullscreen message="Raporlar yükleniyor..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Etik Raporları" subtitle="Etik bildirim istatistikleri ve vaka analizleri" />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Bildirim"
                    value={stats?.totalReports}
                    color="blue"
                    icon={<Users size={20} />}
                />
                <StatCard
                    title="Açık / Yeni"
                    value={stats?.openReports}
                    color="red"
                    icon={<AlertTriangle size={20} />}
                />
                <StatCard
                    title="İnceleniyor"
                    value={stats?.investigating}
                    color="yellow"
                    icon={<TrendingUp size={20} />}
                />
                <StatCard
                    title="Sonuçlanan"
                    value={stats?.closedReports}
                    color="green"
                    icon={<CheckCircle size={20} />}
                />
            </div>

            {/* Analysis Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart size={20} className="text-gray-500" /> Kategori Dağılımı
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats?.categoryStats?.map((cat: any, index: number) => (
                            <div key={index}>
                                <InfoRow 
                                    label={cat.name} 
                                    value={cat.count} 
                                    className="!py-1 !border-none" 
                                    labelClassName="normal-case tracking-normal text-sm text-gray-700 font-medium"
                                />
                                <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
                                    <div
                                        className="bg-purple-600 h-2.5 rounded-full"
                                        style={{ width: `${(cat.count / stats.totalReports) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-gray-500" /> Öncelik Dağılımı
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-rose-50 rounded-lg shadow-sm border border-rose-100">
                            <div className="text-rose-600 font-bold text-xl">{stats?.priorityStats?.critical}</div>
                            <div className="text-xs text-rose-500 font-medium mt-1">Kritik</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg shadow-sm border border-orange-100">
                            <div className="text-orange-600 font-bold text-xl">{stats?.priorityStats?.high}</div>
                            <div className="text-xs text-orange-500 font-medium mt-1">Yüksek</div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg shadow-sm border border-amber-100">
                            <div className="text-amber-600 font-bold text-xl">{stats?.priorityStats?.medium}</div>
                            <div className="text-xs text-amber-500 font-medium mt-1">Orta</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-100">
                            <div className="text-slate-600 font-bold text-xl">{stats?.priorityStats?.low}</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">Düşük</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar Area */}
            <PageToolbar
                onRefresh={loadData}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Vaka no, konu veya müfettiş ara..."
                showExportButton={true}
                onExportClick={() => window.print()}
            />

            {/* Recent Reports Table */}
            <DataTable
                title="Son Bildirimler"
                description="Sisteme düşen son bildirimler ve güncel durumları"
                rightElement={<ActionLink href="/audit/ethics" variant="primary">Tümünü Gör</ActionLink>}
                data={(stats?.recentReports || []).filter((item: any) => 
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.assignee && item.assignee.toLowerCase().includes(searchTerm.toLowerCase()))
                )}
                rowKey="id"
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                sortColumn={sortColumn}
                sortDirection={sortDir}
                columns={[
                    { key: 'date', header: 'TARİH', align: 'left', width: '120px', sortable: true, type: 'date' },
                    {
                        key: 'id',
                        header: 'VAKA NO',
                        align: 'left',
                        width: '120px',
                        sortable: true,
                        render: (item: any) => <CodeBadge code={item.id} size="sm" variant="secondary" />
                    },
                    { key: 'title', header: 'KONU', align: 'left', sortable: true, render: (item: any) => <span className="font-medium text-gray-900">{item.title}</span> },
                    { key: 'source', header: 'KAYNAK', align: 'left', sortable: true },
                    {
                        key: 'assignee',
                        header: 'MÜFETTİŞ',
                        align: 'left',
                        sortable: true,
                        render: (item: any) => (
                            item.assignee ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                        {item.assignee.charAt(0)}
                                    </div>
                                    {item.assignee}
                                </div>
                            ) : (
                                <span className="text-gray-400 italic">Atanmadı</span>
                            )
                        )
                    },
                    { key: 'duration', header: 'GEÇEN SÜRE', align: 'left', sortable: true },
                    {
                        key: 'priority',
                        header: 'ÖNCELİK',
                        align: 'left',
                        sortable: true,
                        type: 'risk'
                    },
                    {
                        key: 'status',
                        header: 'DURUM',
                        align: 'left',
                        sortable: true,
                        type: 'status'
                    },
                    {
                        key: 'actions',
                        header: 'İŞLEM',
                        align: 'center',
                        render: (item: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu items={[{ label: 'Detayı İncele', icon: Eye, onClick: () => router.push(`/audit/ethics?id=${item.id}`) }]} />
                            </div>
                        )
                    }
                ]}
                className="border-none"
            />
        </div>
    );
}
