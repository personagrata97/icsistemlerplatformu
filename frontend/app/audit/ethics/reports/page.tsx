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
import RequireRole from '@/components/auth/RequireRole';

function EthicsReportsPageContent() {
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

    if (loading) return <LoadingState message="İstatistikler yükleniyor..." />;

    const recentReports = stats?.recentReports || [];
    const filteredReports = recentReports.filter((r: any) =>
        r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Etik Bildirim İstatistikleri"
                subtitle="Sistemdeki toplam bildirimler, öncelik dağılımları ve kategori bazlı vaka analizleri."
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Bildirim"
                    value={stats?.totalReports || 0}
                    icon={Shield}
                    color="blue"
                    infoTooltip="Sisteme kaydedilen toplam etik ihbar ve bildirim sayısı"
                />
                <StatCard
                    title="Açık Vakalar"
                    value={stats?.openReports || 0}
                    icon={AlertTriangle}
                    color="amber"
                    infoTooltip="Henüz karara bağlanmamış incelemedeki vakalar"
                />
                <StatCard
                    title="İncelenen Vakalar"
                    value={stats?.investigating || 0}
                    icon={Users}
                    color="purple"
                    infoTooltip="Müfettiş/Etik Kurul ataması yapılmış detaylı incelemedekiler"
                />
                <StatCard
                    title="Kapatılan Vakalar"
                    value={stats?.closedReports || 0}
                    icon={CheckCircle}
                    color="emerald"
                    infoTooltip="Karara bağlanarak arşive kaldırılan bildirimler"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Rapor ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                data={filteredReports}
                columns={[
                    {
                        key: 'id',
                        header: 'KOD',
                        align: 'left',
                        render: (item: any) => <CodeBadge code={item.trackingCode || item.id} />
                    },
                    {
                        key: 'type',
                        header: 'KATEGORİ / KONU',
                        align: 'left',
                        sortable: true
                    },
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
                rowKey="id"
            />
        </div>
    );
}

export default function EthicsReportsPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'ETHICS_OFFICER', 'BOARD_CHAIRMAN', 'SUPER_ADMIN', 'AUDIT_MANAGER']}>
            <EthicsReportsPageContent />
        </RequireRole>
    );
}
