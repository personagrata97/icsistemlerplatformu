import React from 'react';
import Link from 'next/link';
import { Clock, FileText, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExecutiveActionCardsProps {
    pendingApprovals: number;
    ongoingAudits: number;
    pendingNotifications: number;
    pendingVerification: number;
}

const ExecutiveActionCards: React.FC<ExecutiveActionCardsProps> = ({
    pendingApprovals,
    ongoingAudits,
    pendingNotifications,
    pendingVerification
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Onay Bekleyen Bulgular - Mavi */}
            <Link href="/audit/findings?status=Onay%20Bekliyor" className="group relative overflow-hidden bg-blue-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <span className="text-4xl font-bold text-white">{pendingApprovals}</span>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                        <Clock size={24} className="text-white" />
                    </div>
                </div>
                <div className="mt-auto">
                    <h4 className="font-bold text-lg text-white mb-1">Onay Bekliyor</h4>
                    <p className="text-blue-100 text-xs mb-4">Gözetim sorumlusu onayı gereken bulgular</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                        Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                    </div>
                </div>
            </Link>

            {/* Aktif Denetimler - Turuncu/Sarı */}
            <Link href="/audit/audits?status=Devam%20Ediyor" className="group relative overflow-hidden bg-amber-500 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <span className="text-4xl font-bold text-white">{ongoingAudits}</span>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                        <FileText size={24} className="text-white" />
                    </div>
                </div>
                <div className="mt-auto">
                    <h4 className="font-bold text-lg text-white mb-1">Aktif Denetim</h4>
                    <p className="text-amber-100 text-xs mb-4">Devam eden denetim faaliyetleri</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                        Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                    </div>
                </div>
            </Link>

            {/* Mutabakat Bekleyen - Mor */}
            <Link href="/audit/conciliation" className="group relative overflow-hidden bg-purple-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <span className="text-4xl font-bold text-white">{pendingNotifications}</span>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                        <FileText size={24} className="text-white" />
                    </div>
                </div>
                <div className="mt-auto">
                    <h4 className="font-bold text-lg text-white mb-1">Mutabakat Bekliyor</h4>
                    <p className="text-purple-100 text-xs mb-4">Birim yanıtı beklenen tebliğler</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                        Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                    </div>
                </div>
            </Link>

            {/* Doğrulama/Aksiyon Bekleyen - Kırmızı */}
            <Link href="/audit/follow-up" className="group relative overflow-hidden bg-rose-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <span className="text-4xl font-bold text-white">{pendingVerification}</span>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                        <AlertTriangle size={24} className="text-white" />
                    </div>
                </div>
                <div className="mt-auto">
                    <h4 className="font-bold text-lg text-white mb-1">Doğrulama Bekliyor</h4>
                    <p className="text-rose-100 text-xs mb-4">Aksiyon kontrolü yapılacak bulgular</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                        Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ExecutiveActionCards;
