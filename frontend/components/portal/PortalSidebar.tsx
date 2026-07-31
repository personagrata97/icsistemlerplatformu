'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAuditTitle } from '@/context/AuditTitleContext';
import { useEffect } from 'react';

export default function PortalSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path || (path !== '/portal' && pathname.startsWith(`${path}/`));

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <ul className="nav-links space-y-3 px-2 py-3">
                    <li>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Genel Bakış</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/portal" className={`nav-link ${pathname === '/portal' ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} />
                                    <span>Dashboard</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Aksiyonlar</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/portal/findings" className={`nav-link ${isActive('/portal/findings') ? 'active' : ''}`}>
                                    <AlertCircle size={18} />
                                    <span>Bulgular (Aksiyonlarım)</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
