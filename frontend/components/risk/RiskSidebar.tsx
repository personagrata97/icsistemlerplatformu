'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Activity,
    AlertTriangle,
    FileText,
    Layers,
    Building2,
    CheckSquare,
    Bell,
    BookOpen
} from 'lucide-react';

export default function RiskSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const isUnitUser = user?.roles?.includes('BIRIM_KULLANICISI');

    const isActive = (path: string) => pathname === path || (path !== '/risk' && pathname.startsWith(path));

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-2 px-2 py-3">
                    {/* BİRİM PORTALI */}
                    <li>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">BİRİM PORTALI</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/unit" className={`nav-link ${pathname === '/risk/unit' ? 'active' : ''}`}>
                                    <Building2 size={18} />
                                    <span>Birim Paneli</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/unit/alerts" className={`nav-link ${isActive('/risk/unit/alerts') ? 'active' : ''}`}>
                                    <CheckSquare size={18} />
                                    <span>Birim Uyarıları & Aksiyonlar</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* Show remaining management menus if NOT pure BIRIM_KULLANICISI */}
                    {!isUnitUser && (
                        <>
                            {/* 1. YÖNETİM & ANALİZ */}
                            <li className="pt-2 border-t border-slate-100">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">YÖNETİM & ANALİZ</div>
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
                            <li className="pt-2 border-t border-slate-100">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">RİSK ÇERÇEVESİ & İZLEME</div>
                                <ul className="space-y-1">
                                    <li className="nav-item">
                                        <Link href="/risk/inventory" className={`nav-link ${isActive('/risk/inventory') ? 'active' : ''}`}>
                                            <Layers size={18} />
                                            <span>Risk Göstergeleri Envanteri</span>
                                        </Link>
                                    </li>
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
                                </ul>
                            </li>

                            {/* 3. UYARI & AKSİYONLAR */}
                            <li className="pt-2 border-t border-slate-100">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">UYARI & AKSİYONLAR</div>
                                <ul className="space-y-1">
                                    <li className="nav-item">
                                        <Link href="/risk/alerts" className={`nav-link ${isActive('/risk/alerts') ? 'active' : ''}`}>
                                            <AlertTriangle size={18} />
                                            <span>Limit Aşımları & Uyarılar</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/risk/actions" className={`nav-link ${isActive('/risk/actions') ? 'active' : ''}`}>
                                            <CheckSquare size={18} />
                                            <span>Aksiyon Takibi & Kanıtlar</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/risk/notifications" className={`nav-link ${isActive('/risk/notifications') ? 'active' : ''}`}>
                                            <Bell size={18} />
                                            <span>Bildirimler</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/risk/knowledge-base" className={`nav-link ${isActive('/risk/knowledge-base') ? 'active' : ''}`}>
                                            <BookOpen size={18} />
                                            <span>Bilgi Bankası</span>
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </aside>
    );
}
