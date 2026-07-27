'use client';

import Link from 'next/link';
import { Shield, FileText, ScanLine, ArrowRight, Settings, LogOut, Sliders } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Tooltip from '@/components/ui/Tooltip';
import { TERMS } from '@/lib/terminology';

export default function Home() {
    const { user, logout, hasRole } = useAuth();

    const isAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const canSeeRisk = hasRole('RISK_ADMIN') || hasRole('RISK_VIEWER') || hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('COMPLIANCE_ADMIN');
    const canSeeAudit = hasRole('AUDIT_ADMIN') || hasRole('AUDIT_INSPECTOR') || hasRole('AUDIT_UNIT') || hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const isUnitOnly = (hasRole('AUDIT_UNIT') || hasRole('AUDIT_VIEWER')) && !(hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_INSPECTOR') || hasRole('AUDIT_SUPERVISOR'));
    const canSeeSanction = hasRole('SANCTION_ADMIN') || hasRole('COMPLIANCE_ADMIN') || hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const canSeeControl = true; // All authenticated internal systems users can view Control

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
            {/* Top Bar with Logout */}
            <div className="h-[64px] bg-white border-b border-gray-200/80 pr-8 flex justify-between items-center shrink-0 shadow-xs">
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
                        <div className="text-sm font-bold text-slate-900">{user?.displayName || user?.username}</div>
                        <div className="text-xs text-slate-500 font-medium">{user?.roles?.[0]}</div>
                    </div>
                    <Tooltip content="Çıkış Yap">
                        <button
                            onClick={handleLogout}
                            className="p-2 ml-4 text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl transition-all shadow-xs"
                        >
                            <LogOut size={20} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="max-w-6xl mx-auto pt-6 px-4 pb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
                    Hoş Geldiniz, {user?.displayName || user?.username || 'Kullanıcı'}
                </h1>
                <p className="text-slate-600 font-medium mb-6">
                    İç Sistemler Platformu'na (Pharos) hoş geldiniz. Yetkiniz dahilindeki modülleri aşağıda görüntüleyebilirsiniz.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                    {/* Teftiş Kurulu — DOKUNULMAZ TAM BİREBİR EMLAK KATILIM LOGO YEŞİLİ (#009c45) */}
                    {canSeeAudit && (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-7 transition-all hover:shadow-lg hover:border-[#009c45] group flex flex-col h-full">
                            <div className="w-14 h-14 bg-[#009c45]/10 rounded-2xl flex items-center justify-center mb-5 text-[#009c45] group-hover:bg-[#009c45] group-hover:text-white transition-all duration-300">
                                <FileText size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-sans tracking-tight">{TERMS.auditModule} ({TERMS.birimKisa})</h3>
                            <p className="text-slate-600 text-sm mb-5 leading-relaxed font-sans">
                                {TERMS.auditModuleDescription}
                            </p>
                            <Link href={isUnitOnly ? "/audit/unit/findings" : "/audit"} className="inline-flex items-center text-[#009c45] font-bold hover:gap-2 transition-all text-sm font-sans mt-auto pt-3">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* İç Kontrol — MAVİ */}
                    {canSeeControl && (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-7 transition-all hover:shadow-lg hover:border-blue-600 group flex flex-col h-full">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                <Sliders size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-sans tracking-tight">{TERMS.controlModule} (İç Kontrol)</h3>
                            <p className="text-slate-600 text-sm mb-5 leading-relaxed font-sans">
                                {TERMS.controlModuleDescription}
                            </p>
                            <Link href="/control" className="inline-flex items-center text-blue-600 font-bold hover:gap-2 transition-all text-sm font-sans mt-auto pt-3">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* Risk Yönetimi — KIRMIZI */}
                    {canSeeRisk && (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-7 transition-all hover:shadow-lg hover:border-red-600 group flex flex-col h-full">
                            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-sans tracking-tight">{TERMS.riskModule} (Risk Yönetimi)</h3>
                            <p className="text-slate-600 text-sm mb-5 leading-relaxed font-sans">
                                {TERMS.riskModuleDescription}
                            </p>
                            <Link href="/risk" className="inline-flex items-center text-red-600 font-bold hover:gap-2 transition-all text-sm font-sans mt-auto pt-3">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* Uyum Yönetimi — MOR / İNDİGO */}
                    {canSeeSanction && (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-7 transition-all hover:shadow-lg hover:border-indigo-700 group flex flex-col h-full">
                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5 text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-all duration-300">
                                <ScanLine size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-sans tracking-tight">{TERMS.sanctionModule} (Uyum)</h3>
                            <p className="text-slate-600 text-sm mb-5 leading-relaxed font-sans">
                                {TERMS.sanctionModuleDescription}
                            </p>
                            <Link href="/sanction" className="inline-flex items-center text-indigo-700 font-bold hover:gap-2 transition-all text-sm font-sans mt-auto pt-3">
                                Uygulamaya Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}

                    {/* Sistem Ayarları (Sadece Admin) */}
                    {isAdmin && (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-7 transition-all hover:shadow-lg hover:border-gray-600 group flex flex-col h-full">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-5 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-all duration-300">
                                <Settings size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2.5 font-sans tracking-tight">{TERMS.adminModule} (Ayarlar)</h3>
                            <p className="text-slate-600 text-sm mb-5 leading-relaxed font-sans">
                                {TERMS.adminModuleDescription}
                            </p>
                            <Link href="/settings" className="inline-flex items-center text-gray-600 font-bold hover:gap-2 transition-all text-sm font-sans mt-auto pt-3">
                                Ayarlara Git <ArrowRight size={18} className="ml-1" />
                            </Link>
                        </div>
                    )}
                </div>

            </div>

            {/* Yetkisi olmayanlar için mesaj */}
            {(!canSeeRisk && !canSeeAudit && !canSeeSanction && !canSeeControl) && (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Herhangi bir modüle erişim yetkiniz bulunmamaktadır</p>
                </div>
            )}
        </div>
    );
}
