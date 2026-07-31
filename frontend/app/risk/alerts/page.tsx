'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { AlertTriangle, CheckCircle, X, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import RefreshButton from '@/components/ui/RefreshButton';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { formatDate } from '@/lib/audit-utils';
import ConfirmModal from '@/components/ConfirmModal';
import TableActions from '@/components/ui/TableActions';

import PageToolbar from '@/components/ui/PageToolbar';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';

function AlertsPageContent() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('OPEN');
    const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadAlerts();
    }, [filter, page, pageSize]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAlerts(
                filter === 'ALL' ? { page, pageSize } : { durum: filter, page, pageSize }
            );
            setAlerts(data.items || (Array.isArray(data) ? data : []));
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Uyarılar yüklenemedi:', error);
            setAlerts([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAlert = async (id: string) => {
        try {
            await apiClient.closeAlert(id);
            setAlerts(alerts.map(a => a.id === id ? { ...a, durum: 'CLOSED' } : a));
            setConfirmCloseId(null);
        } catch (error) {
            console.error('Uyarı kapatılamadı:', error);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Limit Aşımları & Uyarılar"
                subtitle="Mevzuat ve banka içi risk limiti ihlal uyarılarının takibi"
            />

            <PageToolbar
                searchPlaceholder="Uyarı ara..."
                searchValue=""
                onSearchChange={() => {}}
                rightActions={
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'OPEN' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('OPEN')}
                        >
                            Açık Uyarılar
                        </Button>
                        <Button
                            variant={filter === 'CLOSED' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('CLOSED')}
                        >
                            Kapatılanlar
                        </Button>
                        <Button
                            variant={filter === 'ALL' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('ALL')}
                        >
                            Tümü
                        </Button>
                        <RefreshButton onClick={loadAlerts} loading={loading} />
                    </div>
                }
            />

            {loading ? (
                <LoadingState message="Limit aşımları ve uyarılar yükleniyor..." />
            ) : (
                <DataTable
                    columns={[
                        { key: 'kod', header: 'Uyarı Kodu', width: '130px' },
                        { key: 'baslik', header: 'Uyarı Başlığı & Detay', sortable: true, render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{item.baslik}</div>
                                <div className="text-xs text-gray-500">{item.aciklama}</div>
                            </div>
                        ) },
                        { key: 'seviye', header: 'Önem Seviyesi', width: '140px', render: (item: any) => <StatusBadge value={item.seviye} type="status" /> },
                        { key: 'durum', header: 'Durum', width: '130px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                        { key: 'olusturmaTarihi', header: 'Tarih', width: '140px', render: (item: any) => formatDate(item.olusturmaTarihi) },
                        { key: 'actions', header: 'İşlem', width: '120px', render: (item: any) => (
                            item.durum === 'OPEN' ? (
                                <Button variant="secondary" size="sm" onClick={() => setConfirmCloseId(item.id)}>
                                    Kapat
                                </Button>
                            ) : (
                                <span className="text-xs text-gray-400">Kapalı</span>
                            )
                        ) }
                    ]}
                    data={alerts}
                    rowKey="id"
                />
            )}

            <Pagination
                currentPage={page}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={setPage}
            />

            <ConfirmModal
                isOpen={!!confirmCloseId}
                onClose={() => setConfirmCloseId(null)}
                title="Uyarıyı Kapat"
                message="Bu risk uyarısını kapatmak istediğinize emin misiniz?"
                confirmText="Evet, Kapat"
                onConfirm={() => confirmCloseId && handleCloseAlert(confirmCloseId)}
            />
        </div>
    );
}

export default function AlertsPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'RISK_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'SUPER_ADMIN']}>
            <AlertsPageContent />
        </RequireRole>
    );
}
