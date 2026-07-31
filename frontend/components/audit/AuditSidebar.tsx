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
import { isAuditManagerRole, isAuditInspectorRole, isAuditUnitRole } from '@/lib/permissions-map';

// Path to Title/Subtitle mapping
const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/audit': { title: 'Ana Panel', subtitle: 'Teftiş Kurulu genel performans göstergeleri ve anlık durum takibi' },
    '/audit/executive': { title: 'Yönetici Paneli', subtitle: 'Üst yönetim özet göstergeleri ve stratejik denetim metriklerinin takibi' },
    '/audit/plan': { title: 'Denetim Planı', subtitle: 'Risk odaklı yıllık denetim planlarının oluşturulması ve takibi' },
    '/audit/universe': { title: 'Denetim Evreni', subtitle: 'Denetlenebilir birimlerin risk skorlaması ve evren bileşenlerinin yönetimi' },
    '/audit/sampling': { title: 'Örnekleme', subtitle: 'Denetim sahası için istatistiksel ve yöntem bazlı örnekleme hesaplamaları' },
    '/audit/audits': { title: 'Denetimler', subtitle: 'Tüm aktif ve planlanmış denetim faaliyetlerinin merkezi takibi' },
    '/audit/findings': { title: 'Bulgular & Aksiyonlar', subtitle: 'Tespitlerden mutabakat ve aksiyon takibine kadar tüm bulgu süreçlerinin yönetimi' },
    '/audit/reports': { title: 'Raporlar', subtitle: 'Tamamlanan denetim raporlarının hazırlanması, dağıtımı ve analizi' },
    '/audit/quality': { title: 'Kalite Güvence', subtitle: 'İç denetim faaliyetlerinin kalite güvence ve geliştirme programı metriklerinin takibi' },
    '/audit/staff': { title: 'Denetim Ekibi', subtitle: 'Denetim ekibinin görev dağılımları ve kaynak yönetimi' },
    '/audit/staff/cpe': { title: 'Sürekli Mesleki Eğitim (CPE)', subtitle: 'Denetim ekibinin mesleki eğitim saatleri ve sertifikasyon takibi' },
    '/audit/staff/skills': { title: 'Yetkinlik Matrisi', subtitle: 'Denetçilerin uzmanlık alanları ve yetkinlik matrislerinin yönetimi' },
    '/audit/knowledge-base': { title: 'Bilgi Bankası', subtitle: 'Denetim rehberleri, çalışma kağıtları ve standart dokümanların yönetimi' },
    '/audit/ethics/submit': { title: 'Bildirim Yap', subtitle: 'İç denetim ve etik ihlal bildirimlerinin güvenli şekilde iletilmesi' },
    '/audit/ethics': { title: 'Gelen Bildirimler', subtitle: 'İletilen etik ve iç denetim bildirimlerinin inceleme ve takip süreçleri' },
    '/audit/ethics/reports': { title: 'Etik Raporları', subtitle: 'Etik ihlal bildirimlerinin dönemsel istatistikleri ve raporlaması' },
    '/audit/logs': { title: 'Denetim İzi', subtitle: 'Sistem işlem geçmişi ve güvenlik denetim izlerinin takibi' },
    '/audit/trash': { title: 'Silinen Kayıtlar', subtitle: 'Geri dönüştürülebilir silinmiş denetim ve bulgu kayıtlarının takibi' },
    '/audit/conciliation': { title: 'Tebliğ ve Mutabakat', subtitle: 'Tebliğ edilen bulguların birim mutabakat süreçleri ve yanıtlarının takibi' },
    '/audit/follow-up': { title: 'Aksiyon Takip', subtitle: 'Mutabık kalınan bulguların aksiyon planları ve kanıt yükleme süreçlerinin takibi' },
    '/audit/official-reporting': { title: 'Resmi Raporlama', subtitle: 'Mevzuat uyumlu resmi denetim raporlarının hazırlanması ve merkezi takibi' },
    '/audit/notifications': { title: 'Bildirimler', subtitle: 'Denetim süreçlerine ait anlık görev ve sistem bildirimlerinin takibi' },
};

export default function AuditSidebar() {
    const pathname = usePathname();
    const { user, hasRole, hasPermission } = useAuth();
    const { setTitle, setSubtitle, trashCount } = useAuditTitle();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
        ethics: false
    });

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

    // Centralized RBAC Role Checks
    const isManager = isAuditManagerRole(hasRole);
    const isInspector = isAuditInspectorRole(hasRole);
    const isAuditor = isManager || isInspector || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_MANAGER');
    const isUnit = isAuditUnitRole(hasRole);
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
                <ul className="nav-links space-y-2 px-2 py-2">
                    {/* 1. YÖNETİM VE ANALİZ / PORTAL */}
                    {(isAuditor || isUnit) && (
                        <li>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">{isUnit && !isAuditor ? 'BİRİM PORTALI' : 'YÖNETİM & ANALİZ'}</div>
                            <ul className="space-y-1">
                                <li className="nav-item">
                                    <Link href={isUnit && !isAuditor ? '/audit/unit' : '/audit'} className={`nav-link ${(pathname === '/audit/unit' || (pathname === '/audit' && !isUnit)) ? 'active' : ''}`}>
                                        <LayoutDashboard size={18} />
                                        <span>{isUnit && !isAuditor ? 'Özet Görünüm' : 'Ana Panel'}</span>
                                    </Link>
                                </li>
                            {isAuditor && (isManager || hasRole('EXECUTIVE')) && (
                                <li className="nav-item">
                                    <Link href="/audit/executive" className={`nav-link ${isActive('/audit/executive') ? 'active' : ''}`}>
                                        <Target size={18} />
                                        <span>Yönetici Paneli</span>
                                    </Link>
                                </li>
                            )}
                            {isAuditor && (
                                <li className="nav-item">
                                    <Link href="/audit/staff" className={`nav-link ${isActive('/audit/staff') && !isActive('/audit/staff/cpe') ? 'active' : ''}`}>
                                        <Users size={18} />
                                        <span>Denetim Ekibi</span>
                                    </Link>
                                </li>
                            )}
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

                {/* AUDITEE (İLGİLİ BİRİM) EKRANLARI */}
                {(!isAuditor && isUnit) && (
                    <li className="pt-1.5 border-t border-gray-100">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Denetim İşlemleri</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/audit/unit/audits" className={`nav-link ${isActive('/audit/unit/audits') ? 'active' : ''}`}>
                                    <ClipboardCheck size={18} />
                                    <span>Birim Denetimleri</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/audit/unit/findings" className={`nav-link ${isActive('/audit/unit/findings') || isActive('/audit/conciliation') || isActive('/audit/follow-up') ? 'active' : ''}`}>
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

                {/* 5. ETİK VE İHBAR PORTALI */}
                <li className="pt-1.5 border-t border-gray-100">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-2">Etik & İhbar Portalı</div>
                    <ul className="space-y-1">
                        <li className="nav-item">
                            <Link href="/audit/ethics/submit" className={`nav-link ${isActive('/audit/ethics/submit') ? 'active' : ''}`}>
                                <Send size={18} />
                                <span>Bildirim Yap</span>
                            </Link>
                        </li>
                        {(isAuditor || isManager) && (
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
            </ul>
            </div>
        </aside>
    );
}
