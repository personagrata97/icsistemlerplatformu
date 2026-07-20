'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Activity,
    ClipboardList,
    History,
    ShieldAlert,
    ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRiskTitle } from '@/context/RiskTitleContext';

// Sayfa başlık/alt başlık haritası — AuditSidebar ile aynı pattern
const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/risk/cockpit': { title: 'Risk Kokpiti', subtitle: 'Anlık risk göstergeleri ve KPI özeti' },
    '/risk/alerts': { title: 'Risk Uyarıları', subtitle: 'Eşik aşımları ve otomatik uyarılar' },
    '/risk/scenarios': { title: 'Senaryo Analizi', subtitle: 'Stres testi simülasyonları' },
    '/risk/contracts': { title: 'Sözleşme Analizi', subtitle: 'Portföy bazlı sözleşme incelemesi' },
    '/risk/logs': { title: 'Denetim İzi', subtitle: 'Risk modülü denetim izi kayıtları' },
};

export default function RiskSidebar() {
    const pathname = usePathname();
    const { hasRole } = useAuth();
    const { setTitle, setSubtitle } = useRiskTitle();

    // Sayfa değiştiğinde başlığı güncelle — AuditSidebar ile aynı pattern
    useEffect(() => {
        let pageInfo = PAGE_TITLES[pathname];
        if (!pageInfo) {
            const pathParts = pathname.split('/');
            if (pathParts.length > 2) {
                const parentPath = pathParts.slice(0, 3).join('/');
                pageInfo = PAGE_TITLES[parentPath];
            }
        }
        if (pageInfo) {
            setTitle(pageInfo.title);
            setSubtitle(pageInfo.subtitle || '');
        }
    }, [pathname, setTitle, setSubtitle]);

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    // Yetki kontrolleri
    const isRiskAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const isRiskManager = isRiskAdmin || hasRole('RISK_MANAGER') || hasRole('RISK_ANALYST');
    const isExecutive = isRiskAdmin || hasRole('EXECUTIVE');
    const isRiskStaff = isRiskManager || isExecutive;

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            {/* Logo — AuditSidebar ile aynı */}
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            {/* Menü İçeriği */}
            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-3 px-2 py-3">

                    {/* 1. GENEL BAKIŞ */}
                    <li>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Genel Bakış</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/cockpit" className={`nav-link ${isActive('/risk/cockpit') ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} />
                                    <span>Risk Kokpiti</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/alerts" className={`nav-link ${isActive('/risk/alerts') ? 'active' : ''}`}>
                                    <AlertTriangle size={18} />
                                    <span>Risk Uyarıları</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 2. ANALİZ & SİMÜLASYON */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Analiz & Simülasyon</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/scenarios" className={`nav-link ${isActive('/risk/scenarios') ? 'active' : ''}`}>
                                    <Activity size={18} />
                                    <span>Senaryo Analizi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/contracts" className={`nav-link ${isActive('/risk/contracts') ? 'active' : ''}`}>
                                    <FileText size={18} />
                                    <span>Sözleşme Analizi</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 3. SİSTEM */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Sistem</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/logs" className={`nav-link ${isActive('/risk/logs') ? 'active' : ''}`}>
                                    <History size={18} />
                                    <span>Denetim İzi</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

            {/* Alt Bilgi — AuditSidebar ile uyumlu */}
            <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    BDDK & TFRS 9 Uyumlu
                </div>
            </div>
        </aside>
    );
}
