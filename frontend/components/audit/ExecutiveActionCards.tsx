import React from 'react';
import Link from 'next/link';
import { Clock, FileText, AlertTriangle, ArrowRight, CheckCircle, RotateCcw, Activity } from 'lucide-react';

interface ExecutiveActionCardsProps {
    pendingApprovals: number;
    ongoingAudits: number;
    pendingNotifications: number;
    pendingVerification: number;
    pendingRevisions?: number;
    overdueActionsCount?: number;
    dueSoonActionsCount?: number;
    variant?: 'executive' | 'dashboard';
}

const ExecutiveActionCards: React.FC<ExecutiveActionCardsProps> = ({
    pendingApprovals,
    ongoingAudits,
    pendingNotifications,
    pendingVerification,
    pendingRevisions = 0,
    overdueActionsCount = 0,
    dueSoonActionsCount = 0,
    variant = 'executive'
}) => {
    const gridCols = variant === 'dashboard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-4';
    return (
        <div className={`grid gap-4 ${gridCols}`}>
            {variant === 'executive' ? (
                <>
                    {/* 1. Onay Bekleyen Bulgular - Mavi */}
                    <Link href="/audit/findings?status=Onay%20Bekliyor" className="group relative overflow-hidden bg-blue-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingApprovals}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <Clock size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Onay Bekleyenler</h4>
                            <p className="text-blue-100 text-[11px] mb-2 leading-tight">Gözetim sorumlusu onayı gereken rapor ve bulgular</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 2. Aktif Denetimler - Koyu Gri/Mavi */}
                    <Link href="/audit/audits?status=Devam%20Ediyor" className="group relative overflow-hidden bg-slate-700 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{ongoingAudits}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <FileText size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Aktif Denetimler</h4>
                            <p className="text-slate-200 text-[11px] mb-2 leading-tight">Sahada devam eden denetim faaliyetleri</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 3. Mutabakat Bekleyen - Mor */}
                    <Link href="/audit/conciliation?status=Tebliğ%20Edildi,Birim%20Yanıtladı" className="group relative overflow-hidden bg-purple-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingNotifications}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <FileText size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Mutabakat Bekleyenler</h4>
                            <p className="text-purple-100 text-[11px] mb-2 leading-tight">Birim yanıtı beklenen tebliğler</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 4. Doğrulama/Aksiyon Bekleyen - Zümrüt Yeşili */}
                    <Link href="/audit/follow-up?status=Doğrulama%20Bekliyor" className="group relative overflow-hidden bg-emerald-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingVerification}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <CheckCircle size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Doğrulama Bekleyenler</h4>
                            <p className="text-emerald-100 text-[11px] mb-2 leading-tight">Aksiyon kontrolü yapılacak tamamlanmış bulgular</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                </>
            ) : (
                <>
                    {/* DASHBOARD VARYANTI (Kronolojik 6-Adımlı Komuta Merkezi) */}
                    
                    {/* --- SATIR 1: SAHA VE RAPORLAMA --- */}
                    
                    {/* 1. Aktif Denetimlerim - Koyu Gri/Mavi */}
                    <Link href="/audit/audits?status=Devam%20Ediyor" className="group relative overflow-hidden bg-slate-700 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{ongoingAudits}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <Activity size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Aktif Denetimler</h4>
                            <p className="text-slate-200 text-[11px] mb-2 leading-tight">Sahada devam eden denetim faaliyetleri</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 2. Revizyon Bekleyenler - Kırmızı (Kritik) */}
                    <Link href="/audit/findings?status=Revizyon%20Gerekli" className="group relative overflow-hidden bg-rose-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingRevisions}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <RotateCcw size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Revizyon Bekleyenler</h4>
                            <p className="text-rose-100 text-[11px] mb-2 leading-tight">Acil düzeltme bekleyen kayıtlar</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 3. Onay Bekliyor (Rapor/Denetim onayları) - Mavi */}
                    <Link href="/audit/findings?status=Onay%20Bekliyor" className="group relative overflow-hidden bg-blue-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingApprovals}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <Clock size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Onay Bekleyenler</h4>
                            <p className="text-blue-100 text-[11px] mb-2 leading-tight">Gözetim sorumlusu onayı gereken rapor ve bulgular</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* --- SATIR 2: BULGU VE AKSİYON --- */}

                    {/* 4. Mutabakat Bekliyor (Birim yanıtı) - Mor */}
                    <Link href="/audit/conciliation?status=Tebliğ%20Edildi,Birim%20Yanıtladı" className="group relative overflow-hidden bg-purple-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingNotifications}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <FileText size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Mutabakat Bekleyenler</h4>
                            <p className="text-purple-100 text-[11px] mb-2 leading-tight">Birim yanıtı beklenen tebliğler</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 5. Aksiyon Takibi (Vadesi Yaklaşan & Geciken Birleşik) - Turuncu/Kırmızı (Dinamik) */}
                    <Link href="/audit/follow-up?status=Takip%20Ediliyor" className={`group relative overflow-hidden rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px] ${overdueActionsCount > 0 ? 'bg-rose-600' : 'bg-amber-500'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-end gap-1.5">
                                <span className="text-3xl font-bold text-white">{overdueActionsCount + dueSoonActionsCount}</span>
                            </div>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <AlertTriangle size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Aksiyon Takibi</h4>
                            <p className={`${overdueActionsCount > 0 ? 'text-rose-100' : 'text-amber-100'} text-[11px] mb-2 leading-tight font-medium`}>
                                {overdueActionsCount > 0 && <span className="text-white font-bold bg-white/20 px-1 py-0.5 rounded mr-1.5">{overdueActionsCount} Geciken</span>}
                                {dueSoonActionsCount > 0 && <span>{dueSoonActionsCount} Yaklaşan</span>}
                                {overdueActionsCount === 0 && dueSoonActionsCount === 0 && 'Vade takibindeki bulgu aksiyonları'}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    {/* 6. Doğrulama Bekliyor (Teyit) - Zümrüt Yeşili */}
                    <Link href="/audit/follow-up?status=Doğrulama%20Bekliyor" className="group relative overflow-hidden bg-emerald-600 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[110px]">
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-bold text-white">{pendingVerification}</span>
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <CheckCircle size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-base text-white mb-0.5">Doğrulama Bekleyenler</h4>
                            <p className="text-emerald-100 text-[11px] mb-2 leading-tight">Aksiyon kontrolü yapılacak tamamlanmış bulgular</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
                                Görüntüle <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                </>
            )}
        </div>
    );
};

export default ExecutiveActionCards;
