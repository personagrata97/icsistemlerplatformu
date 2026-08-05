'use client';
import RefreshButton from '@/components/ui/RefreshButton';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import TableActions from '@/components/ui/TableActions';
import PersonCell from '@/components/ui/PersonCell';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { MODULE_TERMS } from '@/lib/terminology';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { riskApi } from '@/lib/risk-api';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, Clock, AlertTriangle, ShieldCheck, CheckCircle2,
    ArrowRight, FileText, RefreshCw
} from 'lucide-react';

export default function RiskUnitDashboardPage() {
    return (
        <RequireRole allowedRoles={['BIRIM_KULLANICISI', 'RISK_UZMANI', 'RISK_YONETICI', 'ADMIN', 'SUPER_ADMIN']}>
            <RiskUnitDashboardContent />
        </RequireRole>
    );
}

function RiskUnitDashboardContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const department = user?.department || undefined;
            const data = await riskApi.getAlerts({ birimId: department });
            const list = Array.isArray(data) ? data : (data?.items || []);
            setAlerts(list);
        } catch (error) {
            console.error('Birim risk verileri yükleme hatası:', error);
            showToast('Birim risk verileri yüklenirken hata oluştu.', 'error');
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.department]);

    // Scorecard Stats
    const pendingCount = alerts.filter(a => a.durum === 'OPEN' || a.durum === 'ASSIGNED').length;
    const responseSubmittedCount = alerts.filter(a => a.durum === 'RESPONSE_SUBMITTED').length;
    const activeActionsCount = alerts.filter(a => a.durum === 'IN_ACTION').length;
    const closedCount = alerts.filter(a => a.durum === 'CLOSED').length;

    const columns: Column<any>[] = [
        {
            key: 'uyari_id',
            header: `${MODULE_TERMS.risk.tespitAdi} & Gösterge Kodu`,
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.kpi_kodu || row.uyari_id} />
                        <span
                            className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer"
                            onClick={() => router.push('/risk/unit/alerts')}
                        >
                            {row.mesaj || `${row.kpi_kodu} Limit Aşımı`}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'risk_seviyesi',
            header: 'Risk Seviyesi',
            sortable: true,
            render: (row: any) => <StatusBadge type="risk" value={row.risk_seviyesi} />
        },
        {
            key: 'durum',
            header: 'Durum',
            sortable: true,
            render: (row: any) => <StatusBadge type="status" value={row.durum} />
        },
        {
            key: 'birimYaniti',
            header: 'Birim Yanıtı',
            sortable: true,
            render: (row: any) => <StatusBadge type="status" value={row.birimYaniti || 'BEKLEMEDE'} />
        },
        {
            key: 'actions',
            header: 'İşlem',
            sortable: true,
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'Detay & Yanıt Ver',
                            icon: <FileText size={14} />,
                            onClick: () => router.push('/risk/unit/alerts')
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Sorumlu Birim Risk Portalı"
                subtitle={`Biriminizin (${user?.department || 'Tüm Birimler'}) sorumluluğundaki risk limit aşımları, uyarı bildirimleri ve aksiyon takip göstergeleri.`}
                actions={
                    <Button variant="primary" size="sm" onClick={() => router.push('/risk/unit/alerts')} leftIcon={<ArrowRight size={14} />}>
                        Uyarı & Aksiyon Listesi
                    </Button>
                }
            />

            {/* Scorecard Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Yanıt Bekleyen Uyarılar"
                    value={pendingCount}
                    icon={Clock}
                    color="amber"
                    onClick={() => router.push('/risk/unit/alerts')}
                />
                <StatCard
                    title="Yanıt Verilen"
                    value={responseSubmittedCount}
                    icon={CheckCircle2}
                    color="indigo"
                    onClick={() => router.push('/risk/unit/alerts')}
                />
                <StatCard
                    title="Aksiyondaki Limitler"
                    value={activeActionsCount}
                    icon={ShieldCheck}
                    color="blue"
                    onClick={() => router.push('/risk/unit/alerts')}
                />
                <StatCard
                    title="Kapanan Uyarılar"
                    value={closedCount}
                    icon={CheckCircle2}
                    color="emerald"
                    onClick={() => router.push('/risk/unit/alerts')}
                />
            </div>

            {/* Recent Alerts List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Son Bildirilen Limit Aşımları ({alerts.length})
                    </h3>
                    <RefreshButton onClick={loadData} />
                </div>

                {alerts.length === 0 && !loading ? (
                    <EmptyState
                        icon={LayoutDashboard}
                        title="Risk Uyarısı Bulunamadı"
                        description="Biriminizin sorumluluğunda tanımlı veya bildirilen risk limit aşımı uyarısı bulunmuyor."
                    />
                ) : (
                    <DataTable
                        data={alerts.slice(0, 10)}
                        columns={columns}
                        loading={loading}
                        rowKey="uyari_id"
                        onRowClick={() => router.push('/risk/unit/alerts')}
                    />
                )}
            </div>
        </div>
    );
}
