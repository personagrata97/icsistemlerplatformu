'use client';
import React from 'react';
import { Menu, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface RiskHeaderProps {
    title: string;
    subtitle?: string;
    onToggleSidebar: () => void;
    hideSidebarToggle?: boolean;
    hideLogout?: boolean;
}

export default function RiskHeader({ 
    title, 
    subtitle, 
    onToggleSidebar, 
    hideSidebarToggle = false,
    hideLogout = false 
}: RiskHeaderProps) {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center">
                {!hideSidebarToggle && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 mr-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Menüyü aç/kapat"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-sm font-semibold text-gray-900">{user?.displayName || 'Kullanıcı'}</span>
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5">
                        {user?.roles?.[0]?.replace(/_/g, ' ') || 'YETKİSİZ'}
                    </span>
                </div>
                
                {!hideLogout && (
                    <button
                        onClick={logout}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 group"
                        title="Çıkış Yap"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>
        </header>
    );
}
