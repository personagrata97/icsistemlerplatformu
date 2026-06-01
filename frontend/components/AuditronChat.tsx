'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Minimize2, Maximize2, ShieldCheck, Database, FileSpreadsheet, Upload, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import Tooltip from '@/components/ui/Tooltip';
import { checkAuditronStatus } from '@/lib/ai-service';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    ragContext?: string;
    type?: 'text' | 'file_status';
}

export default function AuditronChat() {
    const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Merhaba! Auditron AI asistanına hoş geldiniz. Denetim verileri, mevzuat dokümanları ve Excel dosyaları üzerinden analiz yapabilir, sorularınızı yanıtlayabilirim.\n\nNasıl yardımcı olabilirim?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    // AI durumunu kontrol et — kapali ise bilesen tamamen gizlenir
    useEffect(() => {
        checkAuditronStatus().then(setAiEnabled);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // AI kapali veya henuz kontrol edilmediyse hicbir sey gosterme
    if (aiEnabled !== true) return null;

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        
        const uploadMsg: Message = {
            id: `upload-${Date.now()}`,
            role: 'user',
            content: `📂 ${file.name} dosyası yükleniyor ve analiz ediliyor...`,
            timestamp: new Date(),
            type: 'file_status'
        };
        setMessages(prev => [...prev, uploadMsg]);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/auditron/upload-document`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            const aiResponse: Message = {
                id: `ai-upload-${Date.now()}`,
                role: 'assistant',
                content: data.success 
                    ? `✅ **${file.name}** başarıyla yapay zeka hafızasına aktarıldı. Artık bu dosyadaki veriler üzerinden bana soru sorabilir veya risk analizi yapmamı isteyebilirsiniz.` 
                    : `❌ Hata: ${data.message || 'Dosya işlenemedi.'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            showToast(data.success ? 'Dosya başarıyla analiz edildi' : 'Yükleme hatası', data.success ? 'success' : 'error');
        } catch (error) {
            console.error(error);
            showToast('Dosya yüklenemedi. Sunucu hatası.', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const response = await fetch(`${API_URL}/auditron/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
                }),
                signal: AbortSignal.timeout(300000)
            });

            const data = await response.json();

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.success ? data.response : (data.error || 'Yanıt alınamadı. Lütfen tekrar deneyin.'),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setLoading(false);

        } catch (error) {
            console.error(error);
            showToast('Mesaj gönderilemedi. AI servisi yanıt vermiyor.', 'error');
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Tooltip content="Auditron AI Asistanı" position="left">
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 bg-slate-800 text-teal-400 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 hover:bg-slate-700 z-[50] p-0 border border-slate-600 ring-4 ring-slate-800/30"
                >
                    <Bot size={28} />
                </button>
            </Tooltip>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[50] transition-all duration-300 flex flex-col ${isMinimized ? 'w-72 h-14' : 'w-[400px] h-[600px] md:w-[450px]'}`}>
            {/* Header */}
            <div className="bg-slate-800 p-4 flex items-center justify-between text-white cursor-pointer select-none" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Bot size={20} className="text-teal-400" />
                        <span className="font-bold text-gray-50 tracking-wide">Auditron AI</span>
                    </div>
                    {!isMinimized && (
                        <span className="text-[10px] text-teal-400 flex items-center gap-1 mt-1 opacity-90 font-medium tracking-wider">
                            <ShieldCheck size={12} /> Yapay Zeka Asistanı
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip content={isMinimized ? "Büyüt" : "Küçült"} position="bottom">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                            className="p-1.5 hover:bg-slate-700 rounded text-gray-300 transition-colors"
                        >
                            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                    </Tooltip>
                    <Tooltip content="Kapat" position="bottom">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-300 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {/* Info Banner */}
                        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-800 flex items-start gap-2">
                            <Database size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <p>
                                Auditron AI; <strong>Çalışma Kâğıtları</strong>, <strong>Bulgu Kanıtları</strong> ve yüklenen <strong>İç/Dış Mevzuat</strong> belgelerini kurumsal bir bilgi havuzunda analiz eder. Yanıtlarını doğrudan bu verilere dayandırarak bilgi doğruluğunu ve tutarlılığını sağlar.
                            </p>
                        </div>

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-slate-700 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                    }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <span className={`text-[10px] block mt-2 font-medium ${msg.role === 'user' ? 'text-slate-300' : 'text-gray-400'}`}>
                                        {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
                                    <Loader2 className="animate-spin text-teal-600" size={18} />
                                    <span className="text-xs font-medium text-gray-500">Auditron AI düşünüyor...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100 pb-6">
                        <form onSubmit={handleSend} className="relative flex flex-col gap-3">
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".xlsx,.xls,.pdf,.docx,.txt"
                                onChange={handleExcelUpload}
                            />

                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Auditron'a soru sorun..."
                                    className="w-full pl-4 pr-24 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-slate-800 focus:bg-white focus:border-slate-800 transition-all text-sm outline-none shadow-inner"
                                    disabled={loading || isUploading}
                                />
                                <div className="absolute right-2 top-1.5 flex items-center gap-1">
                                    <Tooltip content="Excel/Doküman Yükle (Risk Analizi)" position="top">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={loading || isUploading}
                                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all disabled:opacity-30"
                                        >
                                            <FileSpreadsheet size={20} />
                                        </button>
                                    </Tooltip>
                                    <button
                                        type="submit"
                                        disabled={loading || isUploading || !input.trim()}
                                        className="p-2 bg-slate-800 text-teal-400 rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                            </div>
                            
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
