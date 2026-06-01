'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Info, X } from 'lucide-react';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { useRouter } from 'next/navigation';
import DropdownHeader from './ui/DropdownHeader';
import { auditApi } from '@/lib/audit-api';

interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'error';
    createdAt: string;
    isRead: boolean;
    link?: string;
}

interface NotificationDropdownProps {
    textColor?: string;
    badgeRingColor?: string;
}

export default function NotificationDropdown({ 
    textColor = 'text-gray-400', 
    badgeRingColor = 'ring-white' 
}: NotificationDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getNotifications();
            setNotifications(data || []);
            const unreadRes = await auditApi.getUnreadNotificationCount();
            setUnreadCount(unreadRes?.count || 0);
        } catch (error) {
            console.error('Bildirimler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll every 60 seconds
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            await auditApi.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Tümü okundu işaretlenemedi', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await auditApi.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Okundu işaretlenemedi', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check size={16} className="text-emerald-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'info': return <Info size={16} className="text-blue-500" />;
            default: return <Info size={16} className="text-gray-500" />;
        }
    };

    const displayNotifications = notifications.slice(0, 5);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 ${textColor} hover:text-primary hover:bg-primary/5 rounded-lg transition-colors relative`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={`absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ${badgeRingColor} flex items-center justify-center`}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <DropdownHeader title="Bildirimler">
                        <button 
                            onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                            disabled={unreadCount === 0}
                            className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${unreadCount === 0 ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-primary hover:bg-primary/5'}`}
                        >
                            Tümünü Okundu İşaretle
                        </button>
                    </DropdownHeader>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-gray-400 text-sm">Yükleniyor...</p>
                            </div>
                        ) : displayNotifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {displayNotifications.map(notification => (
                                    <div 
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 ${!notification.isRead ? 'bg-blue-50/10' : ''}`}
                                    >
                                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm`}>
                                            {getIcon(notification.type || 'info')}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {String(notification.title || '')}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                {String(notification.description || '')}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="mt-2 w-2 h-2 bg-primary rounded-full"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <Bell size={40} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-gray-400 text-sm">Hiç bildiriminiz yok</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t text-center">
                        <button 
                            onClick={() => { router.push('/audit/notifications'); setIsOpen(false); }}
                            className="text-xs text-gray-500 font-bold hover:text-gray-700"
                        >
                            Tüm Bildirimleri Gör
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
