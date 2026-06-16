'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Globe,
    ClipboardCheck,
    AlertCircle,
    Bell,
    List,
    Briefcase,
    ShieldAlert,
    Send,
    History,
    ChevronDown,
    Building2,
    ShieldCheck,
    FileBarChart,
    Users,
    GraduationCap,
    FileText,
    Scale,
    Clock,
    Trash2,
    Shield,
    ClipboardList,
    Star,
    Target,
    Layers,
    CalendarDays,
    Mail,
    Wrench,
    Bot
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuditTitle } from '@/context/AuditTitleContext';

// Path to Title/Subtitle mapping
const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/audit': { title: 'Ana Panel', subtitle: 'Teftiş Kurulu anlık durum özeti ve performans göstergeleri' },
    '/audit/executive': { title: 'Yönetici Paneli', subtitle: 'Yönetim özeti ve performans göstergeleri' },
    '/audit/plan': { title: 'Denetim Planı', subtitle: 'Yıllık denetim planlaması' },
    '/audit/universe': { title: 'Denetim Evreni', subtitle: 'Denetlenebilir birimler ve risk değerlendirmesi' },
    '/audit/sampling': { title: 'Örnekleme', subtitle: 'İstatistiksel örnekleme araçları' },
    '/audit/audits': { title: 'Denetimler', subtitle: 'Aktif ve geçmiş denetimler' },
    '/audit/findings': { title: 'Bulgular & Aksiyonlar', subtitle: 'Tespitlerden mutabakat ve aksiyon takibine kadar tüm bulgu süreçlerinin yönetimi.' },
    '/audit/reports': { title: 'Raporlar', subtitle: 'Denetim raporları ve analizler' },
    '/audit/quality': { title: 'Kalite Güvence', subtitle: 'İç denetim kalite güvence metrikleri' },
    '/audit/staff': { title: 'Denetim Ekibi', subtitle: 'Personel bilgileri ve yönetimi' },
    '/audit/staff/cpe': { title: 'Sürekli Mesleki Eğitim (CPE)', subtitle: 'Personel eğitim istatistikleri ve yıllık kazanım analizleri' },
    '/audit/staff/skills': { title: 'Yetkinlik Matrisi', subtitle: 'Denetim ekibinin yetkinlik ve kaynak yönetimi' },
    '/audit/knowledge-base': { title: 'Bilgi Bankası', subtitle: 'Arama ve doküman yönetimi' },
    '/audit/ethics/submit': { title: 'Bildirim Yap', subtitle: 'Anonim veya kimlikli bildirim yapın' },
    '/audit/ethics': { title: 'Gelen Bildirimler', subtitle: 'Bildirim listesi ve takibi' },
    '/audit/ethics/reports': { title: 'Etik Raporları', subtitle: 'Etik hat istatistikleri' },
    '/audit/logs': { title: 'Denetim İzi', subtitle: 'Sistem log kayıtları' },
    '/audit/trash': { title: 'Silinen Kayıtlar', subtitle: 'Silinen denetim ve bulgular' },
    '/audit/conciliation': { title: 'Bulgular & Aksiyonlar', subtitle: 'Tespitlerden mutabakat ve aksiyon takibine kadar tüm bulgu süreçlerinin yönetimi.' },
    '/audit/follow-up': { title: 'Bulgular & Aksiyonlar', subtitle: 'Tespitlerden mutabakat ve aksiyon takibine kadar tüm bulgu süreçlerinin yönetimi.' },
    '/audit/official-reporting': { title: 'Resmi Raporlama', subtitle: 'Mevzuat uyumlu raporlama merkezi' },
    '/audit/notifications': { title: 'Bildirimler', subtitle: 'Sistem ve süreç bildirimleri' },
};

export default function AuditSidebar() {
    const pathname = usePathname();
    const { user, hasRole, hasPermission } = useAuth();
    const { setTitle, setSubtitle, trashCount } = useAuditTitle();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
        ethics: false
    });

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    // Role Checks
    const isManager = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('Sistem Yöneticisi') || hasRole('Teftiş Kurulu Müdürü') || hasRole('Admin') || hasRole('Yönetici');
    const isInspector = hasRole('AUDIT_INSPECTOR') || hasRole('Müfettiş') || hasRole('Başmüfettiş') || hasRole('Kıdemli Müfettiş') || hasRole('Müfettiş Yardımcısı') || hasRole('Yetkili Müfettiş Yardımcısı');
    // Core Audit Staff (Inspectors + Managers + Supervisors)
    const isAuditor = isManager || isInspector || hasRole('AUDIT_SUPERVISOR');

    // Unit / Auditee (Can see findings assigned to them)
    // If not an auditor and not a standard employee, assume Unit/Viewer role
    // Or check explicit AUDIT_UNIT role
    const isUnit = hasRole('AUDIT_UNIT') || hasRole('AUDIT_VIEWER');

    // Standard Employee: Has NO audit roles and is NOT a unit viewer
    // If user has NO roles, or only STANDARD_EMPLOYEE, treating as Standard Employee
    const isStandardEmployee = !isAuditor && !isUnit && !hasRole('SYSTEM_ADMIN');

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

    const toggleSubmenu = (key: string) => {
        setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
    };



    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-3 px-2 py-3">
                    {/* 1. YÖNETİM VE ANALİZ */}
                    {isAuditor && (
                        <li>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">YÖNETİM & ANALİZ</div>
                            <ul className="space-y-1">
                                <li className="nav-item">
                                    <Link href="/audit" className={`nav-link ${pathname === '/audit' ? 'active' : ''}`}>
                                        <LayoutDashboard size={18} />
                                        <span>Ana Panel</span>
                                    </Link>
                                </li>
                            {(isManager || hasRole('EXECUTIVE')) && (
                                <li className="nav-item">
                                    <Link href="/audit/executive" className={`nav-link ${isActive('/audit/executive') ? 'active' : ''}`}>
                                        <Target size={18} />
                                        <span>Yönetici Paneli</span>
                                    </Link>
                                </li>
                            )}
                            <li className="nav-item">
                                <Link href="/audit/staff" className={`nav-link ${isActive('/audit/staff') && !isActive('/audit/staff/cpe') ? 'active' : ''}`}>
                                    <Users size={18} />
                                    <span>Denetim Ekibi</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                )}

                {/* 2. PLANLAMA BAĞLAMI */}
                {isAuditor && (
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Planlama</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/audit/universe" className={`nav-link ${isActive('/audit/universe') ? 'active' : ''}`}>
                                    <Globe size={18} />
                                    <span>Denetim Evreni</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/audit/plan" className={`nav-link ${isActive('/audit/plan') ? 'active' : ''}`}>
                                    <Calendar size={18} />
                                    <span>Denetim Planı</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/audit/sampling" className={`nav-link ${isActive('/audit/sampling') ? 'active' : ''}`}>
                                    <Layers size={18} />
                                    <span>Örnekleme</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                )}

                {/* 3. SAHA BAĞLAMI */}
                {isAuditor && (
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Denetim İşlemleri</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/audit/audits" className={`nav-link ${isActive('/audit/audits') ? 'active' : ''}`}>
                                    <ClipboardCheck size={18} />
                                    <span>Denetimler</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/audit/findings" className={`nav-link ${isActive('/audit/findings') ? 'active' : ''}`}>
                                    <AlertCircle size={18} />
                                    <span>Bulgular & Aksiyonlar</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                )}

                {/* AUDITEE (İLGİLİ BİRİM) SADECE BULGULARI GÖRÜR */}
                {(!isAuditor && isUnit) && (
                    <li>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Denetim İşlemleri</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/audit/findings" className={`nav-link ${isActive('/audit/findings') ? 'active' : ''}`}>
                                    <AlertCircle size={18} />
                                    <span>Bulgular (Aksiyonlarım)</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                )}

                {/* 4. RAPORLAMA BAĞLAMI */}
                {isAuditor && (
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Raporlama & Kalite</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/audit/reports" className={`nav-link ${isActive('/audit/reports') ? 'active' : ''}`}>
                                    <FileBarChart size={18} />
                                    <span>Raporlar</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/audit/quality" className={`nav-link ${isActive('/audit/quality') ? 'active' : ''}`}>
                                    <Shield size={18} />
                                    <span>Kalite Güvence</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/audit/official-reporting" className={`nav-link ${isActive('/audit/official-reporting') ? 'active' : ''}`}>
                                    <ClipboardList size={18} />
                                    <span>Resmi Raporlama</span>
                                </Link>
                            </li>

                        </ul>
                    </li>
                )}

                {/* 5. ETİK VE UYUM */}
                {!isUnit && (
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Etik & Uyum</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/audit/ethics/submit" className={`nav-link ${isActive('/audit/ethics/submit') ? 'active' : ''}`}>
                                    <Send size={18} />
                                    <span>Bildirim Yap</span>
                                </Link>
                            </li>
                            {isAuditor && (
                                <>
                                    <li className="nav-item">
                                        <Link href="/audit/ethics" className={`nav-link ${isActive('/audit/ethics') && !isActive('/audit/ethics/submit') && !isActive('/audit/ethics/reports') ? 'active' : ''}`}>
                                            <Scale size={18} />
                                            <span>Gelen Bildirimler</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/audit/ethics/reports" className={`nav-link ${isActive('/audit/ethics/reports') ? 'active' : ''}`}>
                                            <FileBarChart size={18} />
                                            <span>Etik Raporları</span>
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </li>
                )}
            </ul>
            </div>
        </aside>
    );
}
