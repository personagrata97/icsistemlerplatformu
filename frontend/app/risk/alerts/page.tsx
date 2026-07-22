'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { AlertTriangle, CheckCircle, X, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import RefreshButton from '@/components/ui/RefreshButton';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';

import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { formatDate } from '@/lib/audit-utils';
import ConfirmModal from '@/components/ConfirmModal';
import ActionMenu from '@/components/ui/ActionMenu';

import PageToolbar from '@/components/ui/PageToolbar';
import PageHeader from '@/components/audit/PageHeader';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('OPEN'); // OPEN, CLOSED, ALL
    const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);

    useEffect(() => {
        loadAlerts();
    }, [filter]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAlerts(
                filter === 'ALL' ? undefined : { durum: filter }
            );
            setAlerts(data);
        } catch (error) {
            console.error('Uyarılar yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAlert = (id: string) => {
        setConfirmCloseId(id);
    };

    const executeCloseAlert = async () => {
        if (!confirmCloseId) return;

        try {
            await apiClient.closeAlert(confirmCloseId);
            loadAlerts(); // Listeyi yenile
        } catch (error) {
            console.error('Uyarı kapatılamadı:', error);
        } finally {
            setConfirmCloseId(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Risk İkaz ve Limit İhlalleri"
                subtitle="Otomatik Hesaplanan Erken Uyarılar ve Alarm Kayıtları"
            />
            <PageToolbar
                noSearch={true}
                onRefresh={loadAlerts}
                filters={
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <Button
                            variant={filter === 'OPEN' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('OPEN')}
                            className={`!h-8 !px-4 text-xs font-semibold rounded-md transition-all ${filter === 'OPEN' ? 'shadow-sm text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Açık
                        </Button>
                        <Button
                            variant={filter === 'CLOSED' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('CLOSED')}
                            className={`!h-8 !px-4 text-xs font-semibold rounded-md transition-all ${filter === 'CLOSED' ? 'shadow-sm text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Kapalı
                        </Button>
                        <Button
                            variant={filter === 'ALL' ? 'primary' : 'ghost'}
                            onClick={() => setFilter('ALL')}
                            className={`!h-8 !px-4 text-xs font-semibold rounded-md transition-all ${filter === 'ALL' ? 'shadow-sm text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Tümü
                        </Button>
                    </div>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'created_at',
                        header: 'Tarih',
                        width: '180px',
                        align: 'center',
                        render: (alert: any) => (
                            <div className="cell-date justify-center">
                                <Clock size={14} className="text-gray-400" />
                                {formatDate(alert.created_at)}
                            </div>
                        )
                    },
                    {
                        key: 'kpi_kodu',
                        header: 'KPI & Açıklama',
                        render: (alert: any) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="cell-title">{alert.kpi.aciklama}</div>
                                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">{alert.kpi_kodu}</div>
                            </div>
                        )
                    },
                    {
                        key: 'senaryo_kodu',
                        header: 'Senaryo',
                        width: '120px',
                        align: 'center',
                        render: (alert: any) => (
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider border border-slate-200">
                                {alert.senaryo_kodu}
                            </span>
                        )
                    },
                    {
                        key: 'gerceklesen_deger',
                        header: 'Değerler (G/E)',
                        width: '150px',
                        align: 'center',
                        render: (alert: any) => (
                            <div className="flex flex-col items-center">
                                <div className="text-sm font-black text-slate-900">
                                    {Number(alert.gerceklesen_deger).toFixed(4)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Eşik: {Number(alert.esik_deger).toFixed(4)}
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'risk_seviyesi',
                        header: 'Risk Seviyesi',
                        width: '130px',
                        align: 'center',
                        render: (alert: any) => {
                            const val = alert.risk_seviyesi === 'KRITIK' || alert.risk_seviyesi === 'YUKSEK' ? 'Kritik' : 
                                       alert.risk_seviyesi === 'ORTA' ? 'Orta' : 'Düşük';
                            return <StatusBadge type="risk" value={val} />;
                        }
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '120px',
                        align: 'center',
                        render: (alert: any) => (
                            <StatusBadge 
                                type="status" 
                                value={alert.durum === 'OPEN' ? 'Yeni' : 'Tamamlandı'} 
                            />
                        )
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '100px',
                        align: 'center',
                        render: (alert: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                {alert.durum === 'OPEN' ? (
                                    <ActionMenu items={[{ label: 'Uyarıyı Kapat', icon: X, variant: 'danger' as const, onClick: () => handleCloseAlert(alert.uyari_id) }]} />
                                ) : (
                                    <div className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-50 rounded-lg border border-green-100 shadow-inner">
                                        <CheckCircle size={20} />
                                    </div>
                                )}
                            </div>
                        )
                    }
                ]}
                data={alerts}
                loading={loading}
                rowKey="uyari_id"
                paginated={true}
                itemsPerPage={10}
                itemUnit="uyarı"
                emptyIcon={AlertTriangle}
                emptyTitle="Aktif Uyarı Bulunmuyor"
                emptyDescription="Şu an için sistemde takip edilen bir risk uyarısı bulunmamaktadır."
                className="shadow-sm border border-gray-100"
            />

            <ConfirmModal
                isOpen={!!confirmCloseId}
                onClose={() => setConfirmCloseId(null)}
                onConfirm={executeCloseAlert}
                title="Uyarıyı Kapat"
                message="Bu risk uyarısını kapatmak istediğinize emin misiniz? Uyarı arşive taşınacaktır."
                confirmText="Evet, Kapat"
            />
        </div>
    );
}

