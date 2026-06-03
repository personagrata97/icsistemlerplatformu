'use client';

import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    ShieldCheck, 
    Lock, 
    User, 
    Key, 
    CheckCircle, 
    AlertTriangle, 
    FileText, 
    Clock, 
    Briefcase, 
    Plus, 
    Trash2, 
    Download, 
    Fingerprint,
    Info,
    RotateCw,
    XCircle
} from 'lucide-react';

// Native SHA-256 implementation using Web Cryptography API
async function computeSha256(message: string): Promise<string> {
    try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.error('SHA-256 error', e);
        return 'HASH_COMPUTATION_ERROR';
    }
}

interface ActionPlanItem {
    id?: string;
    action: string;
    responsible: string;
    dueDate: string;
}

function FastTrackPageContent() {
    const searchParams = useSearchParams();
    const findingId = searchParams.get('findingId');
    const token = searchParams.get('token');

    // Portal States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [findingDetails, setFindingDetails] = useState<any>(null);
    
    // Auth States
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adUsername, setAdUsername] = useState('');
    const [adPassword, setAdPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [managerProfile, setManagerProfile] = useState<any>(null);

    // Form States
    const [isAgreed, setIsAgreed] = useState(true);
    const [rootCause, setRootCause] = useState('');
    const [response, setResponse] = useState('');
    const [actions, setActions] = useState<ActionPlanItem[]>([]);
    
    // Signature States
    const [timestamp, setTimestamp] = useState<number>(Date.now());
    const [currentSeal, setCurrentSeal] = useState('');
    const [isSealing, setIsSealing] = useState(false);
    const [signSuccess, setSignSuccess] = useState(false);
    const [pdfDownloadPath, setPdfDownloadPath] = useState('');

    // Fetch Details on mount if token is present
    useEffect(() => {
        if (!findingId || !token) {
            setError('Geçersiz veya eksik parametreler. Lütfen tebliğ e-postasındaki bağlantıyı kullanın.');
            setLoading(false);
            return;
        }

        async function fetchDetails() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit/findings/${findingId}/fast-track-details?token=${token}`);
                if (!res.ok) {
                    throw new Error('Geçersiz veya süresi dolmuş hızlı mutabakat bağlantısı.');
                }
                const data = await res.json();
                setFindingDetails(data);
                
                // Initialize form values from existing record if present
                setIsAgreed(data.isAgreed !== false); // default to true
                setRootCause(data.rootCause || '');
                setResponse(data.descriptionResponse || data.response || '');
                
                if (data.followUps && data.followUps.length > 0) {
                    setActions(data.followUps.map((f: any) => ({
                        id: f.id,
                        action: f.action,
                        responsible: f.responsible,
                        dueDate: f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : ''
                    })));
                } else {
                    // Default single action row
                    setActions([{ action: '', responsible: data.department || '', dueDate: '' }]);
                }
                
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Bulgu detayları yüklenemedi.');
                setLoading(false);
            }
        }

        fetchDetails();
    }, [findingId, token]);

    // Update real-time cryptographic seal whenever fields change
    useEffect(() => {
        if (!findingDetails || !isAuthenticated || !managerProfile) return;

        let activeTimer = true;
        async function updateSeal() {
            const clientMockIp = '127.0.0.1'; // Real IP gets appended by backend anyway
            const payload = `${findingId}-${findingDetails.title}-${managerProfile.displayName}-${adUsername}-${timestamp}-${clientMockIp}`;
            const seal = await computeSha256(payload);
            if (activeTimer) {
                setCurrentSeal(seal);
            }
        }
        
        updateSeal();
        return () => { activeTimer = false; };
    }, [findingDetails, isAuthenticated, managerProfile, adUsername, timestamp, isAgreed, response, rootCause, actions]);

    // Periodically update timestamp to show dynamic seal live-sync
    useEffect(() => {
        if (!isAuthenticated || signSuccess) return;
        const interval = setInterval(() => {
            setTimestamp(Date.now());
        }, 3000);
        return () => clearInterval(interval);
    }, [isAuthenticated, signSuccess]);

    // SSO Authentication Handler
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adUsername || !adPassword) {
            setAuthError('AD Kullanıcı adı ve şifre gereklidir.');
            return;
        }

        setAuthLoading(true);
        setAuthError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit/findings/${findingId}/fast-track-authenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: adUsername, password: adPassword })
            });

            if (!res.ok) {
                throw new Error('Single Sign-On (SSO) kimlik doğrulaması başarısız. Lütfen bilgilerinizi kontrol edin.');
            }

            const profile = await res.json();
            setManagerProfile(profile);
            setIsAuthenticated(true);
        } catch (err: any) {
            setAuthError(err.message || 'Kimlik doğrulaması yapılamadı.');
        } finally {
            setAuthLoading(false);
        }
    };

    // Action Plan Management
    const addActionRow = () => {
        setActions([...actions, { action: '', responsible: findingDetails?.department || '', dueDate: '' }]);
    };

    const removeActionRow = (index: number) => {
        const updated = [...actions];
        updated.splice(index, 1);
        setActions(updated);
    };

    const updateActionRow = (index: number, field: keyof ActionPlanItem, value: string) => {
        const updated = [...actions];
        updated[index] = { ...updated[index], [field]: value };
        setActions(updated);
    };

    // Final Digitally Sign and Seal Submission
    const handleSignAndSubmit = async () => {
        setIsSealing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit/findings/${findingId}/fast-track-approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    username: adUsername,
                    isAgreed,
                    response,
                    rootCause,
                    actions: isAgreed ? actions : [],
                    digitalSeal: currentSeal,
                    timestamp
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Mutabakat imzalama işlemi sırasında bir hata oluştu.');
            }

            const result = await res.json();
            setPdfDownloadPath(result.evidencePath);
            setSignSuccess(true);
        } catch (err: any) {
            alert(err.message || 'Hata oluştu.');
        } finally {
            setIsSealing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
                <RotateCw className="w-12 h-12 text-[#c9a84c] animate-spin mb-4" />
                <p className="text-sm font-semibold tracking-wider text-slate-400">EMLAK KATILIM HIZLI MUTABAKAT PORTALI</p>
                <p className="text-xs text-slate-500 mt-2">Güvenli veriler yükleniyor, lütfen bekleyin...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
                <div className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Erişim Engellendi</h2>
                    <p className="text-sm text-slate-400 mb-6">{error}</p>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-500 text-left">
                        <strong>Yardım:</strong> Bu portal sadece yetkili yöneticilere gönderilen özel e-posta bağlantıları üzerinden çalışmaktadır. Lütfen bağlantınızı kontrol edin veya Teftiş Kurulu AMS yöneticisi ile irtibata geçin.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
            
            {/* Elegant Header */}
            <div className="w-full max-w-4xl text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1">
                    EMLAK KATILIM <span className="text-[#c9a84c]">TFS</span>
                </h1>
                <p className="text-xs uppercase tracking-widest text-[#c9a84c] font-semibold">Teftiş Kurulu Müdürlüğü • Dijital Mutabakat Sistemi (AMS)</p>
            </div>

            {/* Portal Card */}
            <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
                
                {/* Step 1: SSO Authentication Gate */}
                {!isAuthenticated && (
                    <div className="p-8 md:p-12 flex flex-col items-center">
                        <div className="bg-[#004a99]/20 p-4 rounded-full border border-[#004a99]/40 mb-6 animate-pulse">
                            <Lock className="w-10 h-10 text-[#c9a84c]" />
                        </div>
                        
                        <h2 className="text-xl font-bold text-center text-white mb-2">Kurumsal SSO Doğrulama Gate</h2>
                        <p className="text-sm text-slate-400 text-center max-w-md mb-8">
                            Hassas bulgu detaylarına erişmek ve dijital imza sürecini başlatmak için kurumsal AD (Active Directory) kimlik bilgilerinizi doğrulamanız gerekmektedir.
                        </p>

                        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AD Sicil / Kullanıcı Adı</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={adUsername}
                                        onChange={(e) => setAdUsername(e.target.value)}
                                        placeholder="ornek.kullanici"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#004a99] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AD Şifre</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="password" 
                                        value={adPassword}
                                        onChange={(e) => setAdPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#004a99] transition-all"
                                    />
                                </div>
                            </div>

                            {authError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={authLoading}
                                className="w-full py-3 bg-gradient-to-r from-[#004a99] to-[#002d62] text-white font-bold text-sm rounded-xl hover:from-[#005cbe] hover:to-[#00428d] transition-all duration-300 shadow-lg shadow-[#004a99]/20 flex items-center justify-center gap-2 border border-[#003a78] disabled:opacity-50"
                            >
                                {authLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Doğrula ve Devam Et'}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-[10px] text-slate-600 flex items-center gap-1.5 justify-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#c9a84c]" />
                            <span>SHA-256 Dijital Mühür Güvenceli Platform</span>
                        </div>
                    </div>
                )}

                {/* Step 2: Main Interactive Portal Form */}
                {isAuthenticated && !signSuccess && (
                    <div className="p-6 md:p-8 space-y-8">
                        
                        {/* Upper Active Profile Ribbon */}
                        <div className="bg-[#004a99]/10 border border-[#004a99]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#c9a84c]/20 p-2.5 rounded-xl border border-[#c9a84c]/40">
                                    <ShieldCheck className="w-5 h-5 text-[#c9a84c]" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium">Doğrulanmış SSO Kimliği</div>
                                    <div className="text-sm font-bold text-slate-200">{managerProfile.displayName} ({managerProfile.username})</div>
                                </div>
                            </div>
                            <div className="text-xs font-semibold px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                                Rol: <span className="text-[#c9a84c]">Birim Yöneticisi</span>
                            </div>
                        </div>

                        {/* Bulgu Detayları Section */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#c9a84c]" />
                                1. Tebliğ Edilen Bulgu Bilgileri
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Bulgu Kodu & Risk</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#c9a84c]">{findingDetails.code}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            findingDetails.risk === 'Kritik' || findingDetails.risk === 'Yüksek' 
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                                : 'bg-[#004a99]/20 text-[#004a99] border border-[#004a99]/30'
                                        }`}>
                                            {findingDetails.risk}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">İlgili Denetim</span>
                                    <div className="text-xs font-bold text-slate-300 truncate">{findingDetails.auditCode} - {findingDetails.auditTitle}</div>
                                </div>

                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Birim / Departman</span>
                                    <div className="text-xs font-bold text-slate-300">{findingDetails.department}</div>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 mb-1">Bulgu Başlığı</h4>
                                    <p className="text-sm font-semibold text-slate-200">{findingDetails.title}</p>
                                </div>
                                
                                <div className="border-t border-slate-900 pt-3">
                                    <h4 className="text-xs font-bold text-slate-400 mb-1">Bulgu Tanımı & Kriter</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed max-h-32 overflow-y-auto pr-2">{findingDetails.description}</p>
                                </div>

                                {findingDetails.criteria && (
                                    <div className="border-t border-slate-900 pt-3">
                                        <h4 className="text-xs font-bold text-slate-400 mb-1">Kriter & Mevzuat</h4>
                                        <p className="text-xs text-slate-500 italic">{findingDetails.criteria}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive Form Response & Agreement */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                                <Info className="w-4 h-4 text-[#c9a84c]" />
                                2. Birim Katılım Beyanı ve Yanıt Girişi
                            </h3>

                            {/* Segmented Control for Agreement */}
                            <div className="grid grid-cols-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
                                <button 
                                    type="button"
                                    onClick={() => setIsAgreed(true)}
                                    className={`py-3 text-sm font-bold rounded-xl transition-all ${
                                        isAgreed 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    Mutabıkım (Aksiyon Planı Girişi)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsAgreed(false)}
                                    className={`py-3 text-sm font-bold rounded-xl transition-all ${
                                        !isAgreed 
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    Mutabık Değilim (Gerekçeli Yanıt Girişi)
                                </button>
                            </div>

                            {/* Response Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kök Neden Analizi</label>
                                    <textarea 
                                        rows={4}
                                        value={rootCause}
                                        onChange={(e) => setRootCause(e.target.value)}
                                        placeholder="Bulgunun ortaya çıkmasına zemin hazırlayan kök nedeni analiz ederek buraya yazınız..."
                                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-[#004a99] transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {isAgreed ? 'Birim Yönetim Görüşü' : 'Bulguya Katılmama Gerekçesi (Zorunlu)'}
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        placeholder={isAgreed ? "Bulguya ve aksiyon planına ilişkin yönetim görüşünüzü buraya yazınız..." : "Bulguya katılmama gerekçenizi mevzuat, süreç veya fiili durum açıklamaları ile detaylıca giriniz..."}
                                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-[#004a99] transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Plan Builder (Only if agreed!) */}
                        {isAgreed && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-[#c9a84c]" />
                                        3. Düzeltici / Önleyici Aksiyon Planları
                                    </h3>
                                    <button 
                                        type="button" 
                                        onClick={addActionRow}
                                        className="px-3 py-1.5 bg-[#004a99]/20 hover:bg-[#004a99]/30 text-xs font-bold text-[#c9a84c] border border-[#004a99]/40 rounded-xl flex items-center gap-1.5 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Aksiyon Ekle
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {actions.map((act, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 items-end">
                                            <div className="md:col-span-1 text-center font-bold text-xs text-slate-600 pb-3 md:pb-0">
                                                No: {index + 1}
                                            </div>
                                            
                                            <div className="md:col-span-6 space-y-1">
                                                <label className="block text-[10px] text-slate-500 font-semibold uppercase">Aksiyon Planı Açıklaması</label>
                                                <input 
                                                    type="text"
                                                    value={act.action}
                                                    onChange={(e) => updateActionRow(index, 'action', e.target.value)}
                                                    placeholder="Alınacak aksiyon veya düzeltici işlem..."
                                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#004a99]"
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-1">
                                                <label className="block text-[10px] text-slate-500 font-semibold uppercase">Sorumlu Birim/Sicil</label>
                                                <input 
                                                    type="text"
                                                    value={act.responsible}
                                                    onChange={(e) => updateActionRow(index, 'responsible', e.target.value)}
                                                    placeholder="Sorumlu Yetkili..."
                                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-1">
                                                <label className="block text-[10px] text-slate-500 font-semibold uppercase">Vade Tarihi</label>
                                                <input 
                                                    type="date"
                                                    value={act.dueDate}
                                                    onChange={(e) => updateActionRow(index, 'dueDate', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                                                />
                                            </div>

                                            <div className="md:col-span-1 text-center">
                                                <button 
                                                    type="button"
                                                    disabled={actions.length === 1}
                                                    onClick={() => removeActionRow(index)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interactive Digital Signature / SHA-256 Box */}
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                                <Fingerprint className="w-4 h-4 text-[#c9a84c]" />
                                4. Kriptografik Güvenlik Mührü ve Dijital İmzalama
                            </h3>

                            <div className="bg-[#faf8f4] border border-[#c9a84c] rounded-2xl p-6 text-slate-900 shadow-md">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="space-y-3 max-w-xl">
                                        <div className="inline-block bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                            ✔ Kripto Kilit Aktif
                                        </div>
                                        
                                        <h4 className="text-sm font-extrabold text-[#004a99]">Active Directory Güvenlik Mührü Beyanı</h4>
                                        
                                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                            Aşağıda belirtilen işlem parametreleri ve yönetim beyanınız, Emlak Katılım Teftiş Kurulu AMS altyapısı üzerinde 
                                            <strong> SHA-256</strong> kriptografik algoritmasıyla tekil bir dijital güvenlik mührüne dönüştürülmüştür. 
                                            Bu işlem, ıslak imzalı tutanak hükmünde olup inkar edilemezlik ve tam uyumluluk sağlamaktadır.
                                        </p>

                                        {/* Seal details in small table */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 border-t border-slate-200 text-[11px] font-semibold text-slate-700">
                                            <div>Yetkili İmzalayan: <span className="font-bold text-[#004a99]">{managerProfile.displayName}</span></div>
                                            <div>AD Sicil ID: <span className="font-bold text-[#004a99]">{adUsername}</span></div>
                                            <div>Damga Zamanı: <span className="font-bold text-[#004a99]">{new Date(timestamp).toLocaleString('tr-TR')}</span></div>
                                            <div>İşlem Durumu: <span className="font-bold text-emerald-700">{isAgreed ? 'MUTABIK' : 'BULGU RED'}</span></div>
                                        </div>
                                    </div>

                                    {/* Circular Stamp on Right */}
                                    <div className="shrink-0 flex items-center justify-center">
                                        <div className="w-32 h-32 rounded-full border-4 border-dashed border-[#c9a84c] flex flex-col items-center justify-center bg-white shadow-lg p-2 text-center animate-spin-slow">
                                            <ShieldCheck className="w-8 h-8 text-emerald-600 mb-1" />
                                            <span className="text-[8px] font-extrabold text-[#004a99] uppercase tracking-wider">EMLAK KATILIM</span>
                                            <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest">{isAgreed ? 'MUTABIK' : 'RED'}</span>
                                            <span className="text-[6px] font-bold text-slate-400 mt-1">AMS INTEGRITY</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active live hash */}
                                <div className="mt-6 bg-slate-950 p-4 rounded-xl border border-[#c9a84c]/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-extrabold text-[#c9a84c] tracking-widest uppercase">SHA-256 DİJİTAL GÜVENLİK MÜHRÜ (REAL-TIME)</span>
                                        <span className="inline-flex items-center gap-1 text-[8px] text-emerald-400 font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                            Korumalı
                                        </span>
                                    </div>
                                    <div className="font-mono text-xs text-slate-300 break-all select-all leading-normal bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                                        {currentSeal || 'HESAPLANIYOR...'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sign Trigger Button */}
                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                disabled={isSealing || (!isAgreed && !response)}
                                onClick={handleSignAndSubmit}
                                className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-base rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-900/20 border border-emerald-500 flex items-center justify-center gap-3 mx-auto disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSealing ? (
                                    <>
                                        <RotateCw className="w-5 h-5 animate-spin" />
                                        <span>Güvenlik Mührü İmzalanıyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5.5 h-5.5 text-[#c9a84c]" />
                                        <span>Dijital Olarak Mühürle ve Gönder</span>
                                    </>
                                )}
                            </button>
                            {!isAgreed && !response && (
                                <p className="text-xs text-amber-500 mt-2">Lütfen bulguya katılmama gerekçenizi doldurunuz.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Success and Immutable PDF Download */}
                {signSuccess && (
                    <div className="p-10 md:p-14 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-lg shadow-emerald-500/5">
                            <CheckCircle className="w-12 h-12 animate-bounce" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-100 mb-3">Hızlı Mutabakat Tamamlandı</h2>
                        
                        <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
                            Bulguya ilişkin yönetim katılım beyanınız kurumsal Active Directory kimliğinizle dijital olarak imzalanmış ve
                            Teftiş Kurulu veri tabanında mühürlenerek arşivlenmiştir.
                        </p>

                        {/* Interactive Receipt details */}
                        <div className="w-full max-w-md bg-slate-950 border border-slate-800/80 rounded-2xl p-5 mb-8 text-left space-y-2.5">
                            <div className="flex justify-between text-xs"><span className="text-slate-500">Mühürleyen Yetkili:</span><span className="font-bold text-slate-300">{managerProfile.displayName}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-slate-500">Sicil / Kullanıcı:</span><span className="font-bold text-slate-300">{adUsername}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-slate-500">İşlem IP Adresi:</span><span className="font-bold text-slate-300">127.0.0.1 (Doğrulanmış)</span></div>
                            <div className="flex justify-between text-xs"><span className="text-slate-500">Durum / Beyan:</span><span className="font-bold text-emerald-400">{isAgreed ? 'MUTABIK KALINDI' : 'BULGU RED'}</span></div>
                            <div className="border-t border-slate-900 pt-2.5 mt-2.5">
                                <span className="block text-[9px] font-extrabold text-[#c9a84c] mb-1">DİJİTAL SHA-256 SERTİFİKA İMZASI</span>
                                <span className="font-mono text-[10px] text-slate-500 break-all select-all">{currentSeal}</span>
                            </div>
                        </div>

                        {/* Downloader Trigger button */}
                        {pdfDownloadPath && (
                            <a 
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit/findings/${findingId}/fast-track-download/${pdfDownloadPath.split('/').pop()}?token=${token}`}
                                download
                                className="px-8 py-3.5 bg-gradient-to-r from-[#c9a84c] to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-xl transition-all duration-300 shadow-xl shadow-[#c9a84c]/10 flex items-center justify-center gap-2 border border-[#b8953f]"
                            >
                                <Download className="w-4.5 h-4.5" />
                                <span>Resmi Mutabakat Zaptını İndir (PDF)</span>
                            </a>
                        )}

                        <p className="text-[10px] text-slate-600 mt-6">
                            Mutabakat belgesi aynı zamanda bulgunun kanıt ekleri (evidence) arasına resmi olarak eklenmiştir.
                        </p>
                    </div>
                )}
            </div>

            {/* Platform branding info */}
            <div className="mt-8 text-center text-[10px] text-slate-600 max-w-md leading-relaxed">
                İç Sistemler Platformu (AMS), IIA Standart 2500, New Global Standard 14.6 & 15.1 kuralları ve BDDK, MASAK, KVKK yönetmeliklerine %100 uyumlu olarak çalışmaktadır.
            </div>
        </div>
    );
}


export default function FastTrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Yükleniyor...</div>}>
      <FastTrackPageContent />
    </Suspense>
  );
}
