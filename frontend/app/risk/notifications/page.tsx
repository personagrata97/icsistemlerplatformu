'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PersonCell from '@/components/ui/PersonCell';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { MODULE_TERMS } from '@/lib/terminology';
import { useToast } from '@/components/Toast';
import { riskApi } from '@/lib/risk-api';
import { Bell, RefreshCw, ShieldAlert } from 'lucide-react';

export default function RiskNotificationsPage() {
    return (
        <RequireRole allowedRoles={['RISK_UZMANI', 'RISK_YONETICI', 'ADMIN', 'SUPER_ADMIN', 'BIRIM_KULLANICISI']}>
            <RiskNotificationsContent />
        </RequireRole>
    );
}

function RiskNotificationsContent() {
    const { showToast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await riskApi.getNotifications();
            const list = Array.isArray(data) ? data : (data?.items || []);
            setNotifications(list.filter((n: any) => n.module === 'risk' || !n.module));
        } catch (error) {
            console.error('Risk bildirimleri yükleme hatası:', error);
            showToast('Bildirimler yüklenirken hata oluştu.', 'error');
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const filtered = notifications.filter((n: any) => {
        const title = n.title || '';
        const desc = n.description || '';
        const q = searchTerm.toLowerCase();
        return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });

    const isFiltered = searchTerm !== '';
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns: Column<any>[] = [
        {
            key: 'title',
            header: 'Bildirim Başlığı & Detay',
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-600" />
                        <span className="font-bold text-sm text-slate-800">{row.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{row.description}</p>
                </div>
            )
        },
        {
            key: 'createdAt',
            header: 'Tarih',
            render: (row: any) => <DateDisplay date={row.createdAt || row.created_at || new Date()} />
        },
        {
            key: 'type',
            header: 'Tip',
            render: (row: any) => <StatusBadge type="status" value={row.type || 'Uyarı'} />
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Risk Yönetimi Bildirimleri"
                subtitle={`Limit aşımı, senaryo uyarıları ve risk aksiyon takip bildirimleri (${MODULE_TERMS.risk.birimKisa}).`}
                actions={
                    <Button variant="outline" size="sm" onClick={loadNotifications} leftIcon={<RefreshCw size={14} />}>
                        Yenile
                    </Button>
                }
            />

            {/* Page Toolbar */}
            <PageToolbar
                searchPlaceholder="Bildirim başlığı veya içerik arayınız..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadNotifications}
            />

            {/* Content Table or EmptyState */}
            {filtered.length === 0 && !loading ? (
                <EmptyState
                    icon={Bell}
                    title="Bildirim Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun risk bildirimi bulunamadı.' : 'Okunmamış veya kayıtlı risk bildirimi bulunmuyor.'}
                />
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={paginatedItems}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
