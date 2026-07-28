'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Target,
    Users,
    Activity,
    AlertTriangle,
    FileText,
    History,
    BookOpen,
    Trash2,
    ShieldAlert,
    Sliders,
    Layers,
    FileBarChart,
    Send,
    Shield
} from 'lucide-react';
import { useEffect } from 'react';
import { useRiskTitle } from '@/context/RiskTitleContext';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/risk': { title: 'Risk Kokpiti', subtitle: 'Anlık risk göstergeleri, eşik aşımları ve KPI özeti' },
    '/risk/cockpit': { title: 'Risk Kokpiti', subtitle: 'Anlık risk göstergeleri ve KPI özeti' },
    '/risk/executive': { title: 'Yönetici Risk Özeti', subtitle: 'Üst yönetim özet risk metrikleri ve sermaye yeterliliği göstergeleri' },
    '/risk/staff': { title: 'Risk Personeli Kadrosu', subtitle: 'Risk Analistleri ve Risk Yönetimi Uzman kadro takibi' },
    '/risk/inventory': { title: 'Risk Envanteri & Matrisi', subtitle: 'Tüm iş birimleri ve süreçler bazında tanımlı risk envanteri' },
    '/risk/scenarios': { title: 'Senaryo & Stres Testi', subtitle: 'Likidite ve sermaye yeterliliği stres testi simülasyonları' },
    '/risk/alerts': { title: 'Limit Aşımları & Uyarılar', subtitle: 'Mevzuat ve banka içi risk limiti ihlal uyarıları' },
    '/risk/conciliation': { title: 'Risk Mutabakatı & Tebliğ', subtitle: 'Limit aşımları ve risk bulgularının iş birimleri ile mutabakat süreci' },
    '/risk/follow-up': { title: 'Aksiyon & Limit Takibi', subtitle: 'Limit aşımı düzeltici aksiyon planları ve azaltım takibi' },
    '/risk/contracts': { title: 'Sözleşme & Portföy Analizi', subtitle: 'Portföy bazlı sözleşme incelemesi ve kredi riski haritası' },
    '/risk/quality': { title: 'Risk Modelleri & Kalite', subtitle: 'TFRS 9 ve Basel risk modellerinin validasyon ve kalite güvence takibi' },
    '/risk/knowledge-base': { title: 'Mevzuat & Yöntem Bankası', subtitle: 'BDDK, Basel III ve iç risk hesaplama yöntemi dokümanları' },
    '/risk/logs': { title: 'İşlem Kayıtları (Log)', subtitle: 'Risk modülü denetim izi ve değişiklik geçmişi kayıtları' },
    '/risk/notifications': { title: 'Bildirimler', subtitle: 'Risk limit aşımları ve otomatik sistem uyarı bildirimleri' },
    '/risk/trash': { title: 'Silinen Kayıtlar', subtitle: 'Geri dönüştürülebilir silinmiş risk ve limit kayıtlarının takibi' },
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
                <ul className="nav-links space-y-2 px-2 py-3">

                    {/* 1. YÖNETİM & ANALİZ (3 Item) */}
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
                                <Link href="/risk/cockpit" className={`nav-link ${isActive('/risk/executive') ? 'active' : ''}`}>
                                    <Target size={18} />
                                    <span>Yönetici Paneli</span>
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

                    {/* 2. RİSK ÇERÇEVESİ & İZLEME (3 Item) */}
                    <li className="pt-2 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">RİSK ÇERÇEVESİ & İZLEME</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/contracts" className={`nav-link ${isActive('/risk/contracts') ? 'active' : ''}`}>
                                    <Layers size={18} />
                                    <span>Risk Envanteri & Portföy</span>
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

                    {/* 3. MUTABAKAT & UYUM (3 Item) */}
                    <li className="pt-2 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">MUTABAKAT & AKSİYONLAR</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/alerts" className={`nav-link ${isActive('/risk/conciliation') ? 'active' : ''}`}>
                                    <Send size={18} />
                                    <span>Risk Mutabakatı & Tebliğ</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/alerts" className={`nav-link ${isActive('/risk/follow-up') ? 'active' : ''}`}>
                                    <ShieldAlert size={18} />
                                    <span>Aksiyon & Limit Takibi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/contracts" className={`nav-link ${isActive('/risk/reports') ? 'active' : ''}`}>
                                    <FileBarChart size={18} />
                                    <span>Risk Raporları</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 4. DOKÜMAN & SİSTEM (6 Item -> Toplam 15) */}
                    <li className="pt-2 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">DOKÜMAN & SİSTEM</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/risk/scenarios" className={`nav-link ${isActive('/risk/quality') ? 'active' : ''}`}>
                                    <Shield size={18} />
                                    <span>Model Validasyon & Kalite</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/knowledge-base" className={`nav-link ${isActive('/risk/knowledge-base') ? 'active' : ''}`}>
                                    <BookOpen size={18} />
                                    <span>Mevzuat & Yöntem Bankası</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/logs" className={`nav-link ${isActive('/risk/logs') ? 'active' : ''}`}>
                                    <History size={18} />
                                    <span>İşlem Kayıtları (Log)</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/risk/logs" className={`nav-link ${isActive('/risk/trash') ? 'active' : ''}`}>
                                    <Trash2 size={18} />
                                    <span>Geri Dönüşüm Kutusu</span>
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
