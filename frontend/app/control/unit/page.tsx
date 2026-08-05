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
import { controlApi } from '@/lib/control-api';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, Clock, AlertTriangle, ShieldCheck, CheckCircle2,
    ArrowRight, FileText, RefreshCw
} from 'lucide-react';

export default function ControlUnitDashboardPage() {
    return (
        <RequireRole allowedRoles={['BIRIM_KULLANICISI', 'KONTROL_UZMANI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlUnitDashboardContent />
        </RequireRole>
    );
}

function ControlUnitDashboardContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [deficiencies, setDeficiencies] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const department = user?.department || undefined;
            const data = await controlApi.getDeficiencies({ department });
            const list = Array.isArray(data) ? data : (data?.items || []);
            setDeficiencies(list);
        } catch (error) {
            console.error('Birim kontrol verileri yükleme hatası:', error);
            showToast('Birim kontrol verileri yüklenirken hata oluştu.', 'error');
            setDeficiencies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.department]);

    // Scorecard calculations
    const pendingResponsesCount = deficiencies.filter(d => d.unitResponse === 'BEKLEMEDE' && d.status === 'Mutabakata Gönderildi').length;
    const activeActionsCount = deficiencies.filter(d => d.status === 'Aksiyonda' || d.status === 'Tebliğ Edildi').length;
    const overdueCount = deficiencies.filter(d => {
        if (d.status === 'Kapalı') return false;
        if (!d.dueDate) return false;
        return new Date(d.dueDate) < new Date();
    }).length;
    const closedCount = deficiencies.filter(d => d.status === 'Kapalı').length;

    const columns: Column<any>[] = [
        {
            key: 'code',
            header: `${MODULE_TERMS.control.tespitAdi} Kodu & Tanım`,
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.code || row.id} />
                        <span
                            className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer"
                            onClick={() => router.push('/control/unit/deficiencies')}
                        >
                            {row.title}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
                </div>
            )
        },
        {
            key: 'severity',
            header: 'Önem Düzeyi',
            sortable: true,
            render: (row: any) => <StatusBadge type="risk" value={row.severity} />
        },
        {
            key: 'status',
            header: 'İş Akış Durumu',
            sortable: true,
            render: (row: any) => <StatusBadge type="status" value={row.status} />
        },
        {
            key: 'unitResponse',
            header: 'Birim Yanıtı',
            sortable: true,
            render: (row: any) => <StatusBadge type="status" value={row.unitResponse || 'BEKLEMEDE'} />
        },
        {
            key: 'actions',
            header: 'İşlem',
            sortable: true,
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'Detaya Git',
                            icon: <FileText size={14} />,
                            onClick: () => router.push('/control/unit/deficiencies')
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Sorumlu Birim Kontrol Portalı"
                subtitle={`Biriminizin (${user?.department || 'Tüm Birimler'}) sorumluluğundaki kontrol eksiklikleri, mutabakat yanıtları ve aksiyon takip göstergeleri.`}
                actions={
                    <Button variant="primary" size="sm" onClick={() => router.push('/control/unit/deficiencies')} leftIcon={<ArrowRight size={14} />}>
                        Eksiklik & Aksiyon Listesi
                    </Button>
                }
            />

            {/* Scorecard Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Yanıt Bekleyen Mutabakatlar"
                    value={pendingResponsesCount}
                    icon={Clock}
                    color="amber"
                    onClick={() => router.push('/control/unit/deficiencies')}
                />
                <StatCard
                    title="Süren Aksiyonlar"
                    value={activeActionsCount}
                    icon={ShieldCheck}
                    color="blue"
                    onClick={() => router.push('/control/unit/deficiencies')}
                />
                <StatCard
                    title="Geciken Aksiyonlar"
                    value={overdueCount}
                    icon={AlertTriangle}
                    color="red"
                    onClick={() => router.push('/control/unit/deficiencies')}
                />
                <StatCard
                    title="Kapanan Eksiklikler"
                    value={closedCount}
                    icon={CheckCircle2}
                    color="emerald"
                    onClick={() => router.push('/control/unit/deficiencies')}
                />
            </div>

            {/* Recent Deficiencies List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Son Tebliğ Edilen Kontrol Eksiklikleri ({deficiencies.length})
                    </h3>
                    <RefreshButton onClick={loadData} />
                </div>

                {deficiencies.length === 0 && !loading ? (
                    <EmptyState
                        icon={LayoutDashboard}
                        title="Eksiklik Kaydı Bulunamadı"
                        description="Biriminizin sorumluluğunda tanımlı veya tebliğ edilmiş kontrol eksikliği kaydı bulunmuyor."
                    />
                ) : (
                    <DataTable
                        data={deficiencies.slice(0, 10)}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                        onRowClick={() => router.push('/control/unit/deficiencies')}
                    />
                )}
            </div>
        </div>
    );
}
