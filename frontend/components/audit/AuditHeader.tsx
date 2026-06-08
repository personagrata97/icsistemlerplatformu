'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ShieldCheck, Bell, History, Settings, User, LogOut, BookOpen, ShieldAlert, Key, Trash2, Home } from 'lucide-react';

import Tooltip from '@/components/ui/Tooltip';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationDropdown from '../NotificationDropdown';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import DropdownHeader from '../ui/DropdownHeader';

const ROLE_MAP: Record<string, string> = {
    'ADMIN': 'Sistem Yöneticisi',
    'SYSTEM_ADMIN': 'Sistem Yöneticisi',
    'AUDIT_ADMIN': 'Denetim Yöneticisi',
    'AUDIT_MANAGER': 'Müdür',
    'AUDIT_SUPERVISOR': 'Gözetim Sorumlusu',
    'AUDIT_INSPECTOR': 'Müfettiş',
    'AUDIT_UNIT': 'Denetlenen Birim',
    'AUDIT_VIEWER': 'İzleyici',
    'BOARD': 'Yönetim Kurulu'
};

export default function AuditHeader({ title, subtitle, onToggleSidebar, hideSidebarToggle = false, hideLogout = false }: { title: string, subtitle?: string, onToggleSidebar?: () => void, hideSidebarToggle?: boolean, hideLogout?: boolean }) {
    const router = useRouter();
    const { user, hasRole, logout } = useAuth();
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(settingsRef, () => setIsSettingsOpen(false));
    
    const isAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_MANAGER');
    const isAuditor = isAdmin || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_INSPECTOR');

    return (
        <header className="header flex items-center justify-between h-20 bg-white border-b border-gray-200 px-8">
            <div className="flex items-center">
                {!hideSidebarToggle && (
                    <button
                        title="Menüyü Aç/Kapat"
                        onClick={onToggleSidebar}
                        className="mr-4 p-2 text-gray-600 hover:text-primary rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <ShieldCheck size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none" id="page-title">{title}</h1>
                        {subtitle && (
                            <p className="text-xs text-gray-500 font-medium mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sağ menü (Global Butonlar) */}
            <div className="flex items-center gap-4">
                <Tooltip content="Ana Ekran (Modül Seçimi)" position="bottom">
                    <Link 
                        href="/" 
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <Home size={20} />
                    </Link>
                </Tooltip>
                
                {/* Knowledge Base */}
                {isAuditor && (
                    <Tooltip content="Bilgi Bankası" position="bottom">
                        <Link 
                            href="/audit/knowledge-base" 
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            <BookOpen size={20} />
                        </Link>
                    </Tooltip>
                )}



                <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

                <Tooltip content="Bildirimler" position="bottom">
                    <div>
                        <NotificationDropdown textColor="text-gray-400" badgeRingColor="ring-white" />
                    </div>
                </Tooltip>
                
                {user && (
                    <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800 leading-none">{String(user.displayName || '')}</p>
                            <p className="text-xs text-gray-500 mt-1">{ROLE_MAP[user.roles[0]] || user.roles[0]?.replace('AUDIT_', '') || 'Kullanıcı'}</p>
                        </div>
                        
                        {/* MFA / Sistem ve Güvenlik Ayarları Dropdown */}
                        {isAuditor ? (
                            <div className="relative" ref={settingsRef}>
                                <Tooltip content="Sistem Ayarları" position="bottom">
                                    <button 
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={`p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors ${isSettingsOpen ? 'bg-primary/5 text-primary' : 'bg-gray-50'}`}
                                    >
                                        <Settings size={18} />
                                    </button>
                                </Tooltip>
                                
                                {isSettingsOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <DropdownHeader title="Sistem & Güvenlik" />
                                        <div className="p-2 space-y-1">

                                            <Link href="/audit/logs" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors group">
                                                <div className="flex items-center gap-3 w-full">
                                                    <History size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                                                    <span>Denetim İzi</span>
                                                </div>
                                            </Link>
                                            <div className="h-px bg-gray-100 my-1"></div>
                                            <Link href="/audit/trash" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
                                                <div className="flex items-center gap-3 w-full">
                                                    <Trash2 size={16} className="text-red-400 group-hover:text-red-600 transition-colors" />
                                                    <span>Silinen Kayıtlar</span>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Çıkış */}
                        {!hideLogout && (
                            <Tooltip content="Çıkış Yap" position="bottom">
                                <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
