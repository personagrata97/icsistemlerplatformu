'use client';

import React, { useState } from 'react';
import { Scale, CheckCircle, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import Button from '@/components/ui/Button';
import IndependenceExceptionModal from '@/components/audit/modals/IndependenceExceptionModal';
import Checkbox from '@/components/ui/Checkbox';

interface IndependenceQuickPanelProps {
    auditId: string;
    userId: string;
    onDeclared: () => void;
    isDeclared?: boolean;
}

export default function IndependenceQuickPanel({ auditId, userId, onDeclared, isDeclared }: IndependenceQuickPanelProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);

    if (isDeclared) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-200">
                        <ShieldCheck className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-900 text-sm">Bağımsızlık Beyanı Onaylandı</h3>
                        <p className="text-emerald-700 text-xs opacity-80">Bu denetim için tarafsızlık taahhüdünüz kaydedilmiştir.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={20} />
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">Aktif</span>
                </div>
            </div>
        );
    }

    const handleQuickDeclare = async () => {
        if (!isAgreed) {
            showToast('Lütfen beyanı onayladığınızı belirten kutucuğu işaretleyin.', 'warning');
            return;
        }

        setLoading(true);
        try {
            await auditApi.createIndependenceDeclaration({
                auditId,
                declarationType: 'Denetim Bazlı',
                year: new Date().getFullYear(),
                status: 'Onaylandı', // Smart declaration is auto-approved as it's a positive declaration
                hasConflict: false,
                hasFinancialLink: false,
                hasFamilyLink: false,
                hasPreviousRole: false,
                hasOtherIssue: false,
                declaredAt: new Date().toISOString()
            });

            showToast('Bağımsızlık beyanınız başarıyla kaydedildi. Denetime başlayabilirsiniz.', 'success');
            onDeclared();
        } catch (error: any) {
            console.error('Declaration error:', error);
            showToast(error.message || 'Beyan kaydedilirken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExceptionSubmit = async (data: any) => {
        try {
            await auditApi.createIndependenceDeclaration({
                auditId,
                declarationType: 'Denetim Bazlı',
                year: new Date().getFullYear(),
                status: 'Beklemede', // Requires human review
                hasConflict: true, // Marked as exception
                hasFinancialLink: data.hasFinancialLink,
                hasFamilyLink: data.hasFamilyLink,
                hasPreviousRole: data.hasPreviousRole,
                hasOtherIssue: data.hasOtherIssue,
                notes: data.explanation,
                declaredAt: new Date().toISOString()
            });
            showToast('İstisna bildiriminiz yöneticinize / kalite güvence ekibine iletilmiştir.', 'success');
            setIsExceptionModalOpen(false);
            onDeclared();
        } catch (error: any) {
            console.error('Exception declaration error:', error);
            showToast(error.message || 'İstisna bildirimi kaydedilirken hata oluştu.', 'error');
        }
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm ring-1 ring-blue-500/10">
            <div className="flex items-start gap-5">
                <div className="bg-blue-600 p-3 rounded-lg shadow-blue-200 shadow-lg">
                    <Scale className="text-white" size={24} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-blue-900">Bağımsızlık Beyanı</h3>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 uppercase tracking-wider">Gerekli</span>
                    </div>

                    <p className="text-blue-800 text-sm mb-2 leading-relaxed opacity-90">
                        Görev aldığınız bu denetim sürecine başlamadan önce, şirket içi mesleki etik kurallar ve ilgili yönetmelikler gereği, bağımsızlığınızı veya tarafsızlığınızı etkileyebilecek herhangi bir çıkar çatışması olmadığını beyan etmeniz gerekmektedir.
                    </p>
                    <p className="text-blue-800/80 text-xs mb-4 italic leading-relaxed">
                        * Bu beyan, yalnızca denetim ekibinde görevli müfettişler tarafından sistem üzerinden elektronik olarak verilir. Teftiş Kurulu Müdürü veya yalnızca yönetici rolünde olup doğrudan saha görevinde bulunmayan kişilerin beyan vermesi zorunlu değildir.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-white/50 p-2 rounded-lg border border-blue-100">
                            <ShieldCheck size={16} className="text-blue-500" />
                            Çıkar Çatışması Yok
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-white/50 p-2 rounded-lg border border-blue-100">
                            <ShieldCheck size={16} className="text-blue-500" />
                            Akrabalık / Bağ Yok
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-white/50 p-2 rounded-lg border border-blue-100">
                            <ShieldCheck size={16} className="text-blue-500" />
                            Eski Görev İlişkisi Yok
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 pt-5 border-t border-blue-200/50">
                        <Checkbox
                            id="independence-agree"
                            checked={isAgreed}
                            onChange={(checked) => setIsAgreed(checked)}
                            className="w-full"
                            label={
                                <span className="text-sm font-semibold text-blue-900 leading-relaxed block pl-1">
                                    Mesleki etik kurallara ve bağımsızlık ilkelerine uygun olduğumu beyan ederim. Bu denetim süreci boyunca tarafsızlığımı koruyacağımı taahhüt ederim.
                                </span>
                            }
                        />

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full bg-blue-100/20 p-4 rounded-xl border border-blue-100/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExceptionModalOpen(true)}
                                className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-colors shadow-none whitespace-nowrap"
                            >
                                İstisna Bildir (Risk Var)
                            </Button>
                            <Button
                                onClick={handleQuickDeclare}
                                disabled={loading || !isAgreed}
                                isLoading={loading}
                                className={`px-10 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 w-full sm:w-auto ${isAgreed
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200/50 active:transform active:scale-95'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed border-none shadow-none'
                                    }`}
                                rightIcon={<CheckCircle size={20} />}
                            >
                                {loading ? 'Kaydediliyor...' : 'Bağımsızlığımı Beyan Et ve Başla'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <IndependenceExceptionModal 
                isOpen={isExceptionModalOpen} 
                onClose={() => setIsExceptionModalOpen(false)} 
                onSubmit={handleExceptionSubmit} 
            />
        </div>
    );
}
