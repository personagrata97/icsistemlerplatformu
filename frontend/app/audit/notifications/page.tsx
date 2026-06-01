'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Info, Search, Filter, ArrowLeft, CheckCheck, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { formatDate, formatDateTime } from '@/lib/audit-utils';
import { useAuditTitle } from '@/context/AuditTitleContext';
import PageHeader from '@/components/audit/PageHeader';
import EmptyState, { NoResultsState } from '@/components/ui/EmptyState';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import Pagination from '@/components/ui/Pagination';

interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'error';
    createdAt: string;
    isRead: boolean;
    category: string;
    link?: string;
}

const ITEMS_PER_PAGE = 20;

export default function NotificationsPage() {
    const { setTitle, setSubtitle } = useAuditTitle();
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getNotifications();
            setNotifications(data || []);
        } catch (error: any) {
            showToast(error.message || 'Bildirimler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setTitle('Bildirimler');
        setSubtitle('Sistem bildirimleri ve uyarılar');
        loadData();
    }, [setTitle, setSubtitle]);

    const markAllAsRead = async () => {
        try {
            await auditApi.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            showToast('Tüm bildirimler okundu işaretlendi', 'success');
        } catch (error) {
            showToast('Toplu okundu işaretleme başarısız', 'error');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || (filter === 'unread' && !n.isRead);
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check size={20} className="text-emerald-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
            default: return <Info size={20} className="text-gray-500" />;
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader title="Bildirimler" subtitle="Sistem bildirimleri ve uyarılar" />
            <div className="mb-2">
                <SegmentedTabs
                    tabs={[
                        { id: 'all', label: 'Tüm Bildirimler', icon: Bell },
                        { id: 'unread', label: `Okunmamış (${notifications.filter(n => !n.isRead).length})`, icon: AlertTriangle }
                    ]}
                    activeTab={filter}
                    onChange={(id) => setFilter(id)}
                />
            </div>
            
            <PageToolbar
                searchPlaceholder="Bildirimlerde ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onRefresh={loadData}
                rightActions={
                    <Button 
                        onClick={markAllAsRead}
                        variant="secondary"
                        disabled={notifications.filter(n => !n.isRead).length === 0}
                        leftIcon={<CheckCheck size={16} />}
                        className="gap-2"
                    >
                        Tümünü Okundu İşaretle
                    </Button>
                }
            />

            {/* Notifications List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 font-medium animate-pulse">Bildirimler yükleniyor...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    <>
                        <div className="divide-y divide-gray-100 flex-1">
                            {paginatedNotifications.map((n) => (
                                <div 
                                    key={n.id}
                                    className={`p-4 flex flex-col sm:flex-row gap-3 hover:bg-gray-50 transition-colors group relative ${!n.isRead ? 'bg-primary/[0.02]' : ''}`}
                                >
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105 mt-1 ${!n.isRead ? 'bg-white border-primary/20' : 'bg-gray-50 border-gray-100'}`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {String(n.title || '')}
                                                </h3>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">
                                                    {String(n.category || '')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                                    {n.createdAt ? formatDateTime(n.createdAt) : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed max-w-3xl pr-4">
                                            {String(n.description || '')}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Merkezi Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalItems={filteredNotifications.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                                itemUnit="bildirim"
                            />
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <NoResultsState 
                            searchTerm={searchQuery} 
                            onClear={() => { setFilter('all'); setSearchQuery(''); }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
