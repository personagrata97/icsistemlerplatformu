'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
    Shield, Search, AlertTriangle, FileText, Settings, Clock,
    Database, Globe, ShieldAlert
} from 'lucide-react';
import { useSanctionTitle } from '@/context/SanctionTitleContext';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/sanction': { title: 'Yaptırım Kokpiti', subtitle: 'MASAK, OFAC ve BM Yaptırım Taramaları Özeti' },
    '/sanction/scan': { title: 'Müşteri & İşlem Taraması', subtitle: 'MASAK, Resmî Gazete 6415/7262 ve OFAC Canlı Sorgulaması' },
    '/sanction/results': { title: 'Tarama Sonuçları & Karar Havuzu', subtitle: 'Yaptırım Uyarıları ve Karar Bağlama Süreçleri' },
    '/sanction/lists': { title: 'Yaptırım Listeleri Yönetimi', subtitle: 'MASAK, OFAC, BM ve AB Yaptırım Kaynakları' },
    '/sanction/lists/ofac': { title: 'ABD OFAC SDN Listesi', subtitle: 'Office of Foreign Assets Control Specially Designated Nationals List' },
    '/sanction/lists/un': { title: 'BM Güvenlik Konseyi Listesi', subtitle: 'UN Security Council Consolidated Sanctions List' },
    '/sanction/lists/eu': { title: 'AB Konsolide Yaptırım Listesi', subtitle: 'EU Financial Sanctions Consolidated List' },
    '/sanction/lists/masak': { title: 'MASAK & Resmî Gazete Listesi', subtitle: '6415 ve 7262 Sayılı Kanun Malvarlığı Dondurma Kararları' },
    '/sanction/lists/custom': { title: 'Kurum İçi Özel Kara Liste', subtitle: 'Teftiş ve Uyum Tarafından Tanımlanan Dahili Yasaklı Listesi' },
    '/sanction/reports': { title: 'Yaptırım ve Uyum Raporları', subtitle: 'Denetim Kurulu ve Uyum Başkanlığı Rapor Arşivi' },
    '/sanction/history': { title: 'Tarama Geçmişi & Audit İzi', subtitle: 'Otomatik ve Anlık Tarama Günlük Kayıtları' },
    '/sanction/settings': { title: 'Yaptırım Ayarları', subtitle: 'Eşik Değerleri ve Otomatik Tarama Parametreleri' },
};

export default function SanctionSidebar() {
    const pathname = usePathname();
    const { setTitle, setSubtitle } = useSanctionTitle();

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

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            {/* Logo — AuditSidebar & RiskSidebar ile birebir aynı */}
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Emlak Katılım Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            {/* Menü İçeriği — Gruplanmış Başlıklar */}
            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-3 px-2 py-3">

                    {/* 1. GENEL BAKIŞ */}
                    <li>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Genel Bakış</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/sanction" className={`nav-link ${pathname === '/sanction' ? 'active' : ''}`}>
                                    <Shield size={18} />
                                    <span>Yaptırım Kokpiti</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/scan" className={`nav-link ${isActive('/sanction/scan') ? 'active' : ''}`}>
                                    <Search size={18} />
                                    <span>Müşteri Tarama</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/results" className={`nav-link ${isActive('/sanction/results') ? 'active' : ''}`}>
                                    <AlertTriangle size={18} />
                                    <span>Tarama Sonuçları</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 2. LİSTE YÖNETİMİ */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Yaptırım Listeleri</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/sanction/lists/masak" className={`nav-link ${isActive('/sanction/lists/masak') ? 'active' : ''}`}>
                                    <ShieldAlert size={18} />
                                    <span>MASAK (5549/6415/7262)</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/lists/ofac" className={`nav-link ${isActive('/sanction/lists/ofac') ? 'active' : ''}`}>
                                    <Globe size={18} />
                                    <span>OFAC SDN Listesi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/lists/un" className={`nav-link ${isActive('/sanction/lists/un') ? 'active' : ''}`}>
                                    <Database size={18} />
                                    <span>BM Güvenlik Konseyi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/lists/eu" className={`nav-link ${isActive('/sanction/lists/eu') ? 'active' : ''}`}>
                                    <Globe size={18} />
                                    <span>AB Konsolide Listesi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/lists/custom" className={`nav-link ${isActive('/sanction/lists/custom') ? 'active' : ''}`}>
                                    <Shield size={18} />
                                    <span>Kurum İçi Özel Liste</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 3. RAPORLAMA & SİSTEM */}
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Raporlama & Sistem</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/sanction/reports" className={`nav-link ${isActive('/sanction/reports') ? 'active' : ''}`}>
                                    <FileText size={18} />
                                    <span>Uyum Raporları</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/history" className={`nav-link ${isActive('/sanction/history') ? 'active' : ''}`}>
                                    <Clock size={18} />
                                    <span>Tarama Geçmişi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/sanction/settings" className={`nav-link ${isActive('/sanction/settings') ? 'active' : ''}`}>
                                    <Settings size={18} />
                                    <span>Yaptırım Ayarları</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

        </aside>
    );
}
