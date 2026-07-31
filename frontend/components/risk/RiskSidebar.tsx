'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Activity,
    AlertTriangle,
    FileText,
    Layers,
    FileBarChart
} from 'lucide-react';
import { useEffect } from 'react';
export default function RiskSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path || (path !== '/risk' && pathname.startsWith(path));

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-2 px-2 py-3">

                    {/* 1. YÖNETİM & ANALİZ */}
                    <li>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">YÖNETİM & ANALİZ</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/cockpit" className={`nav-link ${isActive('/risk/cockpit') || pathname === '/risk' ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} />
                                    <span>Risk Kokpiti</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/staff" className={`nav-link ${isActive('/risk/staff') ? 'active' : ''}`}>
                                    <Users size={18} />
                                    <span>Risk Kadrosu</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 2. RİSK ÇERÇEVESİ & İZLEME */}
                    <li className="pt-2 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">RİSK ÇERÇEVESİ & İZLEME</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/contracts" className={`nav-link ${isActive('/risk/contracts') ? 'active' : ''}`}>
                                    <FileText size={18} />
                                    <span>Sözleşme & Portföy Analizi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/scenarios" className={`nav-link ${isActive('/risk/scenarios') ? 'active' : ''}`}>
                                    <Activity size={18} />
                                    <span>Senaryo & Stres Testi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/alerts" className={`nav-link ${isActive('/risk/alerts') ? 'active' : ''}`}>
                                    <AlertTriangle size={18} />
                                    <span>Limit Aşımları & Uyarılar</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
