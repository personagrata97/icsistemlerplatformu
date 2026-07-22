'use client';

import React, { useState } from 'react';
import { Scale, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import IndependenceExceptionModal from './modals/IndependenceExceptionModal';

interface IndependenceQuickPanelProps {
    auditId: string;
    userId?: string;
    isDeclared?: boolean;
    onDeclared: () => void;
}

export function IndependenceQuickPanel({ auditId, onDeclared }: IndependenceQuickPanelProps) {
    const [isAgreed, setIsAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDeclared, setIsDeclared] = useState(false);
    const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);

    const handleQuickDeclare = async () => {
        if (!isAgreed) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/pharos/independence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    auditId,
                    hasConflict: false,
                    declarationText: 'Mesleki etik kurallara ve bağımsızlık ilkelerine uygun olduğumu beyan ederim. Bu denetim süreci boyunca tarafsızlığımı koruyacağımı taahhüt ederim.'
                })
            });

            if (res.ok) {
                setIsDeclared(true);
                onDeclared();
            } else {
                console.error('Bağımsızlık beyanı kaydedilemedi');
            }
        } catch (error) {
            console.error('Bağımsızlık beyan hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExceptionSubmit = async (reason: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/pharos/independence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    auditId,
                    hasConflict: true,
                    conflictReason: reason,
                    declarationText: 'İstisna bildirimi: ' + reason
                })
            });

            if (res.ok) {
                setIsDeclared(true);
                setIsExceptionModalOpen(false);
                onDeclared();
            } else {
                console.error('İstisna beyanı kaydedilemedi');
            }
        } catch (error) {
            console.error('İstisna beyan hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isDeclared) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-emerald-800">
                <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
                <div className="text-xs">
                    <span className="font-bold text-emerald-900 block text-sm">Bağımsızlık Beyanı Tamamlandı</span>
                    Bu denetim görevi için mesleki bağımsızlık beyanınız elektronik olarak imzalanıp kayda alınmıştır.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm ring-1 ring-blue-500/10">
            <div className="flex items-start gap-5">
                <div className="bg-blue-600 p-3.5 rounded-xl shadow-blue-200 shadow-lg text-white shrink-0">
                    <Scale size={24} />
                </div>

                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base font-bold text-blue-950">Bağımsızlık Beyanı</h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-md border border-blue-200 uppercase">Gerekli</span>
                        </div>

                        <p className="text-blue-900 text-xs leading-relaxed opacity-90">
                            Görev aldığınız bu denetim sürecine başlamadan önce, şirket içi mesleki etik kurallar ve ilgili yönetmelikler gereği, bağımsızlığınızı veya tarafsızlığınızı etkileyebilecek herhangi bir çıkar çatışması olmadığını beyan etmeniz gerekmektedir.
                        </p>
                        <p className="text-blue-800/80 text-[11px] mt-1.5 italic leading-relaxed">
                            * Bu beyan, yalnızca denetim ekibinde görevli müfettişler tarafından sistem üzerinden elektronik olarak verilir. Teftiş Kurulu Müdürü veya yalnızca yönetici rolünde olup doğrudan saha görevinde bulunmayan kişilerin beyan vermesi zorunlu değildir.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-white/70 px-3 py-2 rounded-lg border border-blue-100 shadow-2xs">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                            <span>Çıkar Çatışması Yok</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-white/70 px-3 py-2 rounded-lg border border-blue-100 shadow-2xs">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                            <span>Akrabalık / Bağ Yok</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-white/70 px-3 py-2 rounded-lg border border-blue-100 shadow-2xs">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                            <span>Eski Görev İlişkisi Yok</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-blue-200/60 space-y-4">
                        <Checkbox
                            id="independence-agree"
                            checked={isAgreed}
                            onChange={(checked) => setIsAgreed(checked)}
                            className="w-full items-start"
                            label={
                                <span className="text-xs font-semibold text-blue-950 leading-relaxed block pl-1">
                                    Mesleki etik kurallara ve bağımsızlık ilkelerine uygun olduğumu beyan ederim. Bu denetim süreci boyunca tarafsızlığımı koruyacağımı taahhüt ederim.
                                </span>
                            }
                        />

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full bg-blue-100/30 p-3.5 rounded-xl border border-blue-200/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExceptionModalOpen(true)}
                                className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-100/60 transition-colors shadow-none whitespace-nowrap"
                            >
                                İstisna Bildir (Risk Var)
                            </Button>
                            <Button
                                onClick={handleQuickDeclare}
                                disabled={loading || !isAgreed}
                                isLoading={loading}
                                size="md"
                                variant={isAgreed ? 'primary' : 'secondary'}
                                className="whitespace-nowrap px-6 text-xs font-bold shrink-0 min-h-[40px]"
                                rightIcon={<CheckCircle size={16} />}
                            >
                                {loading ? 'Kaydediliyor...' : 'Bağımsızlığı Beyan Et ve Başla'}
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

export default IndependenceQuickPanel;
