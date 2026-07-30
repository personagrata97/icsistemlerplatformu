'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import { Bell, Check, AlertTriangle, Info, CheckCheck, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/Toast';

interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'error';
    createdAt: string;
    isRead: boolean;
    category: string;
}

function ControlNotificationsPageContent() {
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 'NTF-IK-001',
            title: 'Eksiklik Aksiyonu Termin Hatırlatması',
            description: 'EKS-2026-001 — Müşteri Kimlik Doğrulama Formlarında İkinci Onay Eksikliği aksiyonunun termini 15 gün içinde dolacak (2026-08-15).',
            type: 'warning',
            createdAt: '2026-07-27T09:00:00',
            isRead: false,
            category: 'Eksiklik Takibi'
        },
        {
            id: 'NTF-IK-002',
            title: 'Yeni KÖD Değerlendirmesi Gönderildi',
            description: 'İnsan Kaynakları Müdürlüğü 2026 Q2 Birim Öz Değerlendirmesi (KÖD) onayınıza sunuldu. İncelemeniz beklenmektedir.',
            type: 'info',
            createdAt: '2026-07-26T14:30:00',
            isRead: false,
            category: 'Birim Öz Değerlendirmeleri'
        },
        {
            id: 'NTF-IK-003',
            title: 'Kontrol Testi Tamamlandı',
            description: 'TST-2026-089 — Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü testi tamamlandı. Sonuç: ETKİN. Raporunuz hazır.',
            type: 'success',
            createdAt: '2026-07-25T16:00:00',
            isRead: true,
            category: 'Kontrol Testleri'
        },
        {
            id: 'NTF-IK-004',
            title: 'BKS Eğitim Programı Hatırlatması',
            description: 'EGT-IK-003 — Kontrol Testi Tasarım ve İşletim Etkinliği Metodolojisi eğitimi 2026-08-20 tarihinde başlayacak. Kayıt süresi devam ediyor.',
            type: 'info',
            createdAt: '2026-07-24T10:00:00',
            isRead: true,
            category: 'Eğitim Kataloğu'
        },
        {
            id: 'NTF-IK-005',
            title: 'Kritik Eksiklik Tespit Edildi',
            description: 'Hazine Gün Sonu Pozisyon Limit Kontrolünde Manuel Gecikme eksikliği YÜKSEK öncelikli olarak kaydedildi. Aksiyonlarınızı tanımlayın.',
            type: 'error',
            createdAt: '2026-07-23T11:30:00',
            isRead: false,
            category: 'Eksiklik Takibi'
        },
        {
            id: 'NTF-IK-006',
            title: 'Dönem Raporu Onay İsteği',
            description: 'RPR-2026-Q2 — 2026 Q2 Dönemsel İç Kontrol Değerlendirme Raporu taslağı hazırlanmıştır. Üst yönetim onayı beklenmektedir.',
            type: 'info',
            createdAt: '2026-07-22T09:15:00',
            isRead: true,
            category: 'İç Kontrol Raporları'
        },
        {
            id: 'NTF-IK-007',
            title: 'Kontrol Envanteri Güncellendi',
            description: 'KNT-KVKK-008 — Müşteri İzin Formu Girişi ve Onay Kontrolü kontrol noktası frekansı değiştirildi. Güncellenmiş kontrol prosedürünü inceleyin.',
            type: 'success',
            createdAt: '2026-07-21T14:45:00',
            isRead: true,
            category: 'Kontrol Envanteri'
        },
        {
            id: 'NTF-IK-008',
            title: 'Yetkinlik Matrisi Güncelleme Hatırlatması',
            description: 'İç Kontrolör kadrosunun yetkinlik matrisleri 30 günden uzun süredir güncellenmemiştir. Lütfen değerlendirmelerinizi tamamlayın.',
            type: 'warning',
            createdAt: '2026-07-20T08:00:00',
            isRead: true,
            category: 'Yetkinlik Matrisi'
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast('Tüm bildirimler okundu olarak işaretlendi', 'success');
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        showToast('Bildirim silindi', 'success');
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' || (filter === 'unread' && !n.isRead);
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             n.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check size={20} className="text-emerald-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
            case 'error': return <AlertTriangle size={20} className="text-rose-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
            default: return <Info size={20} className="text-gray-500" />;
        }
    };

    const getBgColor = (type: string, isRead: boolean) => {
        if (isRead) return 'bg-white hover:bg-slate-50/50';
        switch (type) {
            case 'success': return 'bg-emerald-50/40 hover:bg-emerald-50/60 border-l-4 border-l-emerald-400';
            case 'warning': return 'bg-amber-50/40 hover:bg-amber-50/60 border-l-4 border-l-amber-400';
            case 'error': return 'bg-rose-50/40 hover:bg-rose-50/60 border-l-4 border-l-rose-400';
            case 'info': return 'bg-blue-50/40 hover:bg-blue-50/60 border-l-4 border-l-blue-400';
            default: return 'bg-white hover:bg-slate-50/50';
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Bildirim" value={notifications.length} icon={Bell} color="blue" />
                <StatCard title="Okunmamış" value={unreadCount} icon={AlertTriangle} color="amber" />
                <StatCard title="Uyarılar" value={notifications.filter(n => n.type === 'warning' || n.type === 'error').length} icon={AlertTriangle} color="rose" />
                <StatCard title="Başarılı İşlemler" value={notifications.filter(n => n.type === 'success').length} icon={Check} color="emerald" />
            </div>

            <div className="mb-2">
                <SegmentedTabs
                    tabs={[
                        { id: 'all', label: 'Tüm Bildirimler', icon: Bell },
                        { id: 'unread', label: `Okunmamış (${unreadCount})`, icon: AlertTriangle }
                    ]}
                    activeTab={filter}
                    onChange={(id) => setFilter(id)}
                />
            </div>

            <PageToolbar
                searchPlaceholder="Bildirim başlığı veya açıklaması ile ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                rightActions={
                    <Button variant="secondary" leftIcon={<CheckCheck size={16} />} onClick={markAllAsRead} disabled={unreadCount === 0}>
                        Tümünü Okundu İşaretle
                    </Button>
                }
            />

            {filteredNotifications.length === 0 ? (
                <EmptyState
                    icon={Bell}
                    title="Bildirim Bulunamadı"
                    description={filter === 'unread' ? 'Okunmamış bildiriminiz bulunmamaktadır.' : 'Arama kriterlerinize uygun bildirim bulunamadı.'}
                />
            ) : (
                <div className="space-y-2">
                    {filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl border border-slate-200/80 transition-all cursor-pointer ${getBgColor(notification.type, notification.isRead)}`}
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className={`text-sm ${notification.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                                            {notification.title}
                                            {!notification.isRead && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2 animate-pulse" />}
                                        </h4>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{notification.category}</span>
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                {new Date(notification.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors rounded"
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                title="Bildirimi sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notification.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


export default function ControlNotificationsPage() {
    return (
        <RequireRole allowedRoles={['DENETCI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlNotificationsPageContent />
        </RequireRole>
    );
}
