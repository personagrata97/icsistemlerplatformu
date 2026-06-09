'use client';

import Link from 'next/link';
import { Shield, FileText, ScanLine, ArrowRight, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Tooltip from '@/components/ui/Tooltip';

export default function Home() {
    const { user, logout } = useAuth();
    const roles = user?.roles || [];

    // Daha kesin rol kontrolü için (Örn: COMPLIANCE_ADMIN'in ADMIN olarak algılanmasını önlemek için)
    const hasRole = (roleCodes: string[]) =>
        roles.some(role => roleCodes.includes(role));

    const isAdmin = hasRole(['ADMIN', 'SYSTEM_ADMIN']);
    const canSeeRisk = hasRole(['RISK_ADMIN', 'RISK_VIEWER', 'ADMIN', 'SYSTEM_ADMIN', 'COMPLIANCE_ADMIN']);
    const canSeeAudit = hasRole(['AUDIT_ADMIN', 'AUDIT_INSPECTOR', 'AUDIT_UNIT', 'ADMIN', 'SYSTEM_ADMIN']);
    const isUnitOnly = hasRole(['AUDIT_UNIT', 'AUDIT_VIEWER']) && !hasRole(['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_ADMIN', 'AUDIT_INSPECTOR', 'AUDIT_SUPERVISOR']);
    const canSeeSanction = hasRole(['SANCTION_ADMIN', 'COMPLIANCE_ADMIN', 'ADMIN', 'SYSTEM_ADMIN']);

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar with Logout */}
            <div className="h-[64px] bg-white border-b border-gray-200 pr-8 flex justify-between items-center shrink-0">
                <div className="w-[260px] flex items-center justify-center shrink-0">
                    <img
                        src="/logo.png"
                        alt="Emlak Katılım"
                        className="h-10 w-auto object-contain mix-blend-multiply transition-transform hover:scale-105"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/150x50?text=LOGO';
                        }}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-gray-900">{user?.displayName || user?.username}</div>
                        <div className="text-xs text-gray-500">{user?.roles?.[0]}</div>
                    </div>
                        {/* MFA / Ayarlar butonu (istersen ekleyebilirsin ama ana ekranda şart değil) */}
                        <Tooltip content="Çıkış Yap">
                            <button
                                onClick={handleLogout}
                                className="p-2 ml-4 text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                            >
                                <LogOut size={20} />
                            </button>
                        </Tooltip>
                </div>
            </div>

            <div className="max-w-6xl mx-auto pt-12 px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Hoş Geldiniz, {user?.displayName || user?.username || 'Kullanıcı'}
                </h1>
                <p className="text-gray-600 mb-8">
                    İç Sistemler Platformu'na hoş geldiniz. Yetkiniz dahilindeki modülleri aşağıda görüntüleyebilirsiniz
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Teftiş Kurulu */}
                    {canSeeAudit && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 transition-all hover:shadow-md hover:border-purple-500 group">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Teftiş Kurulu</h3>
                            <p className="text-gray-500 mb-6">
                                Şube ve süreç denetimlerini planlayın, bulguları takip edin ve raporlayın
                            </p>
                            <Link href={isUnitOnly ? "/portal" : "/audit"} className="inline-flex items-center text-purple-600 font-semibold hover:gap-2 transition-all">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* Risk Yönetimi */}
                    {canSeeRisk && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 transition-all hover:shadow-md hover:border-blue-500 group">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Risk Yönetimi</h3>
                            <p className="text-gray-500 mb-6">
                                Piyasa riski ve likidite riski senaryolarını yönetin ve izleyin
                            </p>
                            <Link href="/risk" className="inline-flex items-center text-blue-600 font-semibold hover:gap-2 transition-all">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* Uyum Yönetimi */}
                    {canSeeSanction && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 transition-all hover:shadow-md hover:border-red-500 group">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <ScanLine size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Uyum Yönetimi</h3>
                            <p className="text-gray-500 mb-6">
                                Müşteri ve işlem taramalarını gerçekleştirin, yaptırım listelerini kontrol edin
                            </p>
                            <Link href="/sanction" className="inline-flex items-center text-red-600 font-semibold hover:gap-2 transition-all">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* Sistem Ayarları (Sadece Admin) */}
                    {isAdmin && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 transition-all hover:shadow-md hover:border-gray-500 group">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                <Settings size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Sistem Ayarları</h3>
                            <p className="text-gray-500 mb-6">
                                Kullanıcı yetkileri, modül erişimleri ve genel sistem yapılandırması
                            </p>
                            <Link href="/settings" className="inline-flex items-center text-gray-600 font-semibold hover:gap-2 transition-all">
                                Ayarlara Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}
                </div>

            </div>

            {/* Yetkisi olmayanlar için mesaj (Eğer hiçbir şey göremiyorsa) */}
            {(!canSeeRisk && !canSeeAudit && !canSeeSanction) && (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Herhangi bir modüle erişim yetkiniz bulunmamaktadır</p>
                </div>
            )}
        </div>
    );
}

