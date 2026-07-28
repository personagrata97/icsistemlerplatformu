'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
    LayoutDashboard,
    Layers,
    FileCheck,
    ShieldCheck,
    AlertOctagon,
    Users,
    BookOpen,
    FileBarChart,
    Award,
    Target,
    History,
    Bell,
    Trash2
} from 'lucide-react';
import { useAuditTitle } from '@/context/AuditTitleContext';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/control': { title: 'Ana Panel', subtitle: 'İç Kontrol genel performans göstergeleri ve durum takibi' },
    '/control/executive': { title: 'Yönetici Paneli', subtitle: 'Üst yönetim özet göstergeleri ve stratejik iç kontrol metriklerinin takibi' },
    '/control/staff': { title: 'Kontrolör Kadrosu (BKS)', subtitle: 'İç Kontrolör kadrosu ve Birim Kontrol Sorumluları (BKS) yönetimi' },
    '/control/inventory': { title: 'Süreç & Kontrol Envanteri', subtitle: 'Tüm operasyonel süreçlerde tanımlı kontrol noktaları ve etkinlik matrisi' },
    '/control/rcsa': { title: 'Birim Öz Değerlendirmeleri', subtitle: 'İş birimlerinin kendi süreç içi kontrollerini dönemsel değerlendirdiği öz değerlendirme modülü' },
    '/control/testing': { title: 'Kontrol Testleri & Saha', subtitle: 'İç Kontrolörler tarafından gerçekleştirilen tasarım ve işletim etkinlik testleri' },
    '/control/deficiencies': { title: 'Eksiklik Takibi', subtitle: 'Süreç içi kontrol testlerinde tespit edilen eksiklikler ve düzeltici aksiyon planları' },
    '/control/reports': { title: 'Raporlar', subtitle: 'Üst Yönetim ve Denetim Komitesi sunumuna hazır Dönem Raporları' },
    '/control/training': { title: 'Eğitim Kataloğu', subtitle: 'İç Kontrol personeli ve Birim Kontrol Sorumluları için eğitim programları' },
    '/control/skills': { title: 'Yetkinlik Matrisi', subtitle: 'İç Kontrolörlerin uzmanlık alanları ve yetkinlik matrislerinin yönetimi' },
    '/control/knowledge-base': { title: 'Bilgi Bankası', subtitle: 'İç kontrol rehberleri, COSO/BDDK standartları, prosedürler ve çalışma şablonları' },
    '/control/logs': { title: 'Denetim İzi', subtitle: 'İç Kontrol modülü işlem geçmişi ve değişiklik kayıtlarının takibi' },
    '/control/notifications': { title: 'Bildirimler', subtitle: 'İç Kontrol süreçlerine ait görev hatırlatmaları ve sistem bildirimlerinin takibi' },
    '/control/trash': { title: 'Silinen Kayıtlar', subtitle: 'Geri dönüştürülebilir silinmiş iç kontrol kayıtlarının takibi' },
};

export default function ControlSidebar() {
    const pathname = usePathname();
    const { setTitle, setSubtitle } = useAuditTitle();

    const isActive = (path: string) => pathname === path || (path !== '/control' && pathname.startsWith(path));

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

    return (
        <aside className="sidebar flex flex-col h-screen overflow-hidden bg-white border-r shadow-sm z-50">
            <div className="h-[64px] flex items-center justify-center bg-gray-50 border-b border-gray-200 shrink-0">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105" />
            </div>

            <div className="sidebar-content flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <ul className="nav-links space-y-2 px-2 py-3">
                    {/* 1. YÖNETİM & ANALİZ */}
                    <li>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">YÖNETİM & ANALİZ</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/control" className={`nav-link ${pathname === '/control' ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} />
                                    <span>Ana Panel</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/executive" className={`nav-link ${isActive('/control/executive') ? 'active' : ''}`}>
                                    <Target size={18} />
                                    <span>Yönetici Paneli</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/staff" className={`nav-link ${isActive('/control/staff') ? 'active' : ''}`}>
                                    <Users size={18} />
                                    <span>Denetçi Kadrosu (BKS)</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 2. KONTROL ÇERÇEVESİ & İZLEME */}
                    <li className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Kontrol Çerçevesi & İzleme</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/control/inventory" className={`nav-link ${isActive('/control/inventory') ? 'active' : ''}`}>
                                    <Layers size={18} />
                                    <span>Süreç & Kontrol Envanteri</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/rcsa" className={`nav-link ${isActive('/control/rcsa') ? 'active' : ''}`}>
                                    <FileCheck size={18} />
                                    <span>Birim Öz Değerlendirmeleri</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/testing" className={`nav-link ${isActive('/control/testing') ? 'active' : ''}`}>
                                    <ShieldCheck size={18} />
                                    <span>Kontrol Testleri & Saha</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 3. EKSİKLİK, MUTABAKAT & AKSİYON YÖNETİMİ */}
                    <li className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Eksiklik & Mutabakat</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/control/deficiencies" className={`nav-link ${isActive('/control/deficiencies') ? 'active' : ''}`}>
                                    <AlertOctagon size={18} />
                                    <span>Eksiklik Takibi</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/conciliation" className={`nav-link ${isActive('/control/conciliation') ? 'active' : ''}`}>
                                    <FileCheck size={18} />
                                    <span>Mutabakat ve Tebliğ</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/reports" className={`nav-link ${isActive('/control/reports') ? 'active' : ''}`}>
                                    <FileBarChart size={18} />
                                    <span>Raporlar</span>
                                </Link>
                            </li>
                        </ul>
                    </li>

                    {/* 4. EĞİTİM & YETKİNLİK */}
                    <li className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-2">Eğitim & Yetkinlik</div>
                        <ul className="space-y-1">
                            <li className="nav-item">
                                <Link href="/control/training" className={`nav-link ${isActive('/control/training') ? 'active' : ''}`}>
                                    <BookOpen size={18} />
                                    <span>Eğitim Kataloğu</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/control/skills" className={`nav-link ${isActive('/control/skills') ? 'active' : ''}`}>
                                    <Award size={18} />
                                    <span>Yetkinlik Matrisi</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
