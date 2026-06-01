'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Copy, RefreshCw, Lightbulb, Scale, FileText, X, Zap, Activity, ShieldCheck, Database, Bot, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { checkAuditronStatus, analyzeWithAuditron, AiAnalysisResult } from '@/lib/ai-service';
import { getRiskColor } from '@/lib/audit-utils';
import Tooltip from '@/components/ui/Tooltip';

interface AuditronSuggestionPanelProps {
    findingData: any;
    onApplySuggestion?: (field: string, value: any) => void;
    className?: string;
}

export default function AuditronSuggestionPanel({ findingData, onApplySuggestion, className = '' }: AuditronSuggestionPanelProps) {
    const [isAuditronRunning, setIsAuditronRunning] = useState<boolean | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AiAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        checkAuditronStatus().then(setIsAuditronRunning);
    }, []);

    // Debounced analysis trigger
    useEffect(() => {
        const title = findingData?.title || '';
        const content = findingData?.content || '';

        if (title.length + content.length < 15) {
            setResult(null);
            return;
        }

        const timer = setTimeout(() => {
            runAnalysis();
        }, 2000);

        return () => clearTimeout(timer);
    }, [findingData?.title, findingData?.content]);

    const runAnalysis = useCallback(async () => {
        const title = findingData?.title || '';
        const content = findingData?.content || '';

        if (title.length + content.length < 15) return;

        // AI kapali veya erisilemediyse hic analiz yapma
        if (!isAuditronRunning) {
            setResult(null);
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const aiResult = await analyzeWithAuditron(findingData);
            if (aiResult) {
                setResult(aiResult);
            } else {
                setResult(null);
                setError('AI yanit uretemedi. Lutfen tekrar deneyin.');
            }
        } catch (err) {
            setError('AI servisine erisilemedi.');
            setResult(null);
        } finally {
            setIsAnalyzing(false);
        }
    }, [findingData, isAuditronRunning]);


    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1500);
    };

    const handleApply = (field: string, value: any) => {
        if (onApplySuggestion) {
            onApplySuggestion(field, value);
        }
    };

    // AI kapali veya erisilemediyse paneli tamamen gizle
    if (isAuditronRunning !== true) return null;

    if (isMinimized) {
        return (
            <Button
                variant="secondary"
                onClick={() => setIsMinimized(false)}
                className={`flex items-center gap-2 bg-slate-800 text-teal-400 py-2 px-4 rounded-xl shadow-md hover:bg-slate-700 transition-colors border border-slate-600 ${className} shadow-none`}
                leftIcon={<Bot size={18} />}
            >
                <span className="font-bold text-sm tracking-wide">Auditron ile İyileştir</span>
            </Button>
        );
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-slate-800 p-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <Bot size={20} className="text-teal-400" />
                    <div>
                        <h4 className="font-bold tracking-wide text-gray-50 flex items-center gap-2">
                            Auditron AI <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded border border-teal-500/30">Dahili Bilgi Havuzu Kullanımda</span>
                        </h4>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <button
                        title="Bağlantıyı Kontrol Et"
                        onClick={() => { setIsAuditronRunning(null); checkAuditronStatus().then(setIsAuditronRunning); }}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors"
                        type="button"
                    >
                        <Activity size={20} />
                    </button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        className="h-9 hover:bg-slate-700 rounded-lg text-teal-400 font-bold flex items-center gap-1 text-xs px-3 bg-slate-700/50 border-none shadow-none"
                        leftIcon={isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    >
                        OKU VE GELİŞTİR
                    </Button>
                    <button
                        title="Gizle"
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-gray-300 rounded-lg transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 bg-gray-50/30">

                {/* Status Messages */}
                {isAnalyzing && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <Loader2 size={20} className="animate-spin text-teal-600" />
                        <span className="text-sm font-medium text-slate-700">Auditron AI kurum içi bilgi havuzunu tarıyor ve bulguyu iyileştiriyor...</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-3 shadow-sm">
                        <AlertCircle size={16} className="text-red-500" />
                        <span className="text-sm text-red-700 font-medium">{error}</span>
                    </div>
                )}

                {/* No Content Warning */}
                {!result && !isAnalyzing && ((findingData?.title || '').length + (findingData?.content || '').length) < 15 && (
                    <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <Lightbulb size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">Analiz için en az 15 karakter yazın</p>
                    </div>
                )}

                {/* Results */}
                {result && !isAnalyzing && (
                    <div className="space-y-3">
                        {/* Risk Level */}
                        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Seviyesi</span>
                                <span
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm ${result.riskLevel === 'Yüksek' || result.riskLevel === 'Kritik' ? 'bg-red-500' :
                                        result.riskLevel === 'Orta' ? 'bg-orange-500' :
                                            'bg-teal-500'
                                        }`}
                                >
                                    {result.riskLevel}
                                </span>
                            </div>
                            {result.riskReason && (
                                <p className="text-xs text-slate-600 leading-relaxed">{result.riskReason}</p>
                            )}
                        </div>

                        {/* Title Suggestion */}
                        {result.titleSuggestion && (
                            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                                <div className="flex items-center gap-2">
                                    <Activity size={20} className="text-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Auditron™ Analiz</span>
                                    {isAnalyzing && <Loader2 size={20} className="animate-spin text-blue-400" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={20} className="text-amber-500 animate-pulse" />
                                    <button
                                        title="Kapat"
                                        onClick={() => setIsMinimized(true)}
                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                                        type="button"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lightbulb size={20} className="text-teal-500" /> Başlık Önerisi
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="Kopyala"
                                            onClick={() => handleCopy(result.titleSuggestion, 'title')}
                                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                            type="button"
                                        >
                                            {copiedField === 'title' ? <CheckCircle size={20} className="text-teal-500" /> : <Copy size={20} />}
                                        </button>
                                        {onApplySuggestion && (
                                            <button
                                                title="Uygula"
                                                onClick={() => handleApply('title', result.titleSuggestion)}
                                                className="p-1 hover:bg-teal-50 rounded-md text-teal-600 transition-colors"
                                                type="button"
                                            >
                                                <Zap size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-800">{result.titleSuggestion}</p>
                            </div>
                        )}

                        {/* Content Suggestions */}
                        {result.contentSuggestions && result.contentSuggestions.length > 0 && (
                            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                    <FileText size={14} className="text-teal-500" /> İçerik Önerileri
                                </span>
                                <ul className="text-xs text-slate-700 space-y-2">
                                    {result.contentSuggestions.map((s: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                                            <span className="text-teal-500 translate-y-0.5">•</span>
                                            <span className="leading-relaxed">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Related Legislation */}
                        {result.relatedLegislation && result.relatedLegislation.length > 0 && (
                            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                    <Scale size={14} className="text-teal-500" /> İlgili Mevzuat
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.relatedLegislation.map((l: string, i: number) => (
                                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200 font-medium">
                                            {l}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Suggestion */}
                        {result.categorySuggestion && (
                            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={14} className="text-teal-500" /> Önerilen Kategori
                                </span>
                                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full border border-teal-100">
                                    {result.categorySuggestion}
                                </span>
                            </div>
                        )}

                        {/* Grammar & Editorial Check */}
                        {result.grammarCheck && result.grammarCheck.length > 0 && (
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>
                                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 mb-3 relative z-10">
                                    <Zap size={14} className="text-blue-500" /> Editör Önerileri
                                </span>
                                <ul className="text-xs text-blue-900 space-y-2 list-disc pl-5 relative z-10 font-medium leading-relaxed">
                                    {result.grammarCheck.map((g: string, i: number) => (
                                        <li key={i}>{g}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Root Cause & Effect Suggestions */}
                        {(result.rootCauseSuggestion || result.effectSuggestion) && (
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50/30 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5 mb-3 relative z-10">
                                    <Sparkles size={14} className="text-purple-500" /> Kök Neden & Etki Analizi
                                </span>
                                <div className="space-y-3 relative z-10">
                                    {result.rootCauseSuggestion && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1 text-xs text-purple-700 font-bold">
                                                <span>Önerilen Kök Neden</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        title="Uygula"
                                                        onClick={() => handleApply('rootCause', result.rootCauseSuggestion)}
                                                        className="p-1 hover:bg-purple-100 rounded-md text-purple-600 transition-colors"
                                                        type="button"
                                                    >
                                                        <Zap size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-purple-900 border-l-2 border-purple-300 pl-2">{result.rootCauseSuggestion}</p>
                                        </div>
                                    )}
                                    {result.effectSuggestion && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1 text-xs text-purple-700 font-bold">
                                                <span>Önerilen Risk Etkisi</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        title="Uygula"
                                                        onClick={() => handleApply('effect', result.effectSuggestion)}
                                                        className="p-1 hover:bg-purple-100 rounded-md text-purple-600 transition-colors"
                                                        type="button"
                                                    >
                                                        <Zap size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-purple-900 border-l-2 border-purple-300 pl-2">{result.effectSuggestion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CAE General Notes */}
                        {result.generalNotes && (
                            <div className="p-4 bg-slate-800 rounded-xl shadow-sm border border-slate-700 text-white relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <ShieldCheck size={64} className="text-teal-400" />
                                </div>
                                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 relative z-10">
                                    <Bot size={14} /> CAE / YÖNETİCİ NOTU
                                </span>
                                <p className="text-xs leading-relaxed text-gray-200 relative z-10 border-l-2 border-teal-500 pl-3">
                                    "{result.generalNotes}"
                                </p>
                            </div>
                        )}

                        {/* Confidence */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t font-semibold tracking-wide">
                            <span>GÜVEN SKORU: %{Math.round(result.confidence * 100)}</span>
                            <span className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                <Database size={12} /> {isAuditronRunning ? 'RAG Desteği Aktif' : 'Temel Analiz Modu'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
