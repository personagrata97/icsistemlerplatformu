'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    AlertTriangle,
    FileText,
    Activity,
    History,
    Users,
    BookOpen,
    Bell,
    Trash2,
    Layers,
    Calendar,
    CheckCircle2,
    Sliders,
    Database,
    FileBarChart
} from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRiskTitle } from '@/context/RiskTitleContext';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/risk': { title: 'Risk Kokpiti', subtitle: 'Anlık risk göstergeleri, eşik aşımları ve KPI özeti' },
    '/risk/cockpit': { title: 'Risk Kokpiti', subtitle: 'Anlık risk göstergeleri ve KPI özeti' },
    '/risk/alerts': { title: 'Limit Aşımları & Uyarılar', subtitle: 'Mevzuat ve banka içi risk limiti ihlal uyarıları' },
    '/risk/scenarios': { title: 'Senaryo & Stres Testi', subtitle: 'Likidite ve sermaye yeterliliği stres testi simülasyonları' },
    '/risk/contracts': { title: 'Sözleşme & Portföy Analizi', subtitle: 'Portföy bazlı sözleşme incelemesi ve kredi riski haritası' },
    '/risk/staff': { title: 'Risk Personeli Kadrosu', subtitle: 'Risk Analistleri ve Risk Yönetimi Uzman kadro takibi' },
    '/risk/knowledge-base': { title: 'Mevzuat & Yöntem Bankası', subtitle: 'BDDK, Basel III ve iç risk hesaplama yöntemi dokümanları' },
    '/risk/logs': { title: 'İşlem Kayıtları (Log)', subtitle: 'Risk modülü denetim izi ve değişiklik geçmişi kayıtları' },
    '/risk/notifications': { title: 'Bildirimler', subtitle: 'Risk limit aşımları ve otomatik sistem uyarı bildirimleri' },
    '/risk/trash': { title: 'Geri Dönüşüm Kutusu', subtitle: 'Silinmiş risk ve limit kayıtlarının takibi' },
};

export default function RiskSidebar() {
    const pathname = usePathname();
    const { setTitle, setSubtitle } = useRiskTitle();

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

    const isActive = (path: string) => pathname === path || (path !== '/risk' && pathname.startsWith(path));

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-3 px-2 py-3">

                    {/* 1. YÖNETİM & ANALİZ */}
                    <li>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Yönetim & Analiz</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/cockpit" className={`nav-link ${isActive('/risk/cockpit') || pathname === '/risk' ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} />
                                    <span>Risk Kokpiti</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/alerts" className={`nav-link ${isActive('/risk/alerts') ? 'active' : ''}`}>
                                    <AlertTriangle size={18} />
                                    <span>Limit Aşımları & Uyarılar</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/staff" className={`nav-link ${isActive('/risk/staff') ? 'active' : ''}`}>
                                    <Users size={18} />
                                    <span>Risk Personeli Kadrosu</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 2. RİSK ÇERÇEVESİ & İZLEME */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Risk Çerçevesi & İzleme</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/scenarios" className={`nav-link ${isActive('/risk/scenarios') ? 'active' : ''}`}>
                                    <Activity size={18} />
                                    <span>Senaryo & Stres Testi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/contracts" className={`nav-link ${isActive('/risk/contracts') ? 'active' : ''}`}>
                                    <FileText size={18} />
                                    <span>Sözleşme & Portföy Analizi</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 3. DOKÜMAN & BİLGİ BANKASI */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Doküman & Bilgi</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/knowledge-base" className={`nav-link ${isActive('/risk/knowledge-base') ? 'active' : ''}`}>
                                    <BookOpen size={18} />
                                    <span>Mevzuat & Yöntem Bankası</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 4. SİSTEM KAYITLARI */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Sistem Kayıtları</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/logs" className={`nav-link ${isActive('/risk/logs') ? 'active' : ''}`}>
                                    <History size={18} />
                                    <span>İşlem Kayıtları (Log)</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    BDDK & Basel III Uyumlu
                </div>
            </div>
        </aside>
    );
}
