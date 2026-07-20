'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Save, Edit3, Info, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/Toast';

interface RiskLimit {
    id: string;
    kpi_kodu: string;
    esik_deger: number;
    karsilastirma: string;
    seviye: string;
    kpi?: {
        aciklama: string;
        birim: string;
    };
}

interface RiskLimitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RiskLimitsModal({ isOpen, onClose, onSuccess }: RiskLimitsModalProps) {
    const { showToast } = useToast();
    const [limits, setLimits] = useState<RiskLimit[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newValue, setNewValue] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadLimits();
        }
    }, [isOpen]);

    const loadLimits = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getLimits();
            setLimits(data);
        } catch (error) {
            console.error('Limitler yüklenemedi:', error);
            showToast('Risk limitleri yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (limit: RiskLimit) => {
        setEditingId(limit.id);
        setNewValue(String(limit.esik_deger));
    };

    const handleSave = async (id: string) => {
        const val = parseFloat(newValue);
        if (isNaN(val)) {
            showToast('Lütfen geçerli bir sayı giriniz.', 'error');
            return;
        }

        setSavingId(id);
        try {
            await apiClient.updateLimit(id, val);
            showToast('Risk eşik değeri başarıyla güncellendi.', 'success');
            setEditingId(null);
            loadLimits();
            onSuccess(); // Cockpit verilerini de tazele
        } catch (error) {
            console.error('Limit güncellenemedi:', error);
            showToast('Eşik değeri güncellenirken hata oluştu.', 'error');
        } finally {
            setSavingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Risk İştahı ve Limit Yönetimi</h2>
                            <p className="text-sm text-gray-500">Şirket içi risk limit eşik değerleri düzenleme paneli</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="bg-amber-50 border border-amber-150 rounded-xl p-4 flex gap-3 text-xs text-amber-900">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                            <p className="font-bold mb-1">Risk İştahı Eşik Belirleme Kriteri</p>
                            <p>Şirketin kendi risk limitleri (risk iştahı), yasal BDDK limitlerinden daha muhafazakar (daha güvenli seviyelerde) belirlenmelidir. Bu sayede yasal limit aşımı gerçekleşmeden önce uyarı (yakın izleme) mekanizmaları devreye girer.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-sm text-slate-500 font-medium">Risk limitleri yükleniyor...</div>
                    ) : (
                        <div className="border border-gray-150 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Gösterge (KPI)</th>
                                        <th className="px-4 py-3 text-center">Seviye</th>
                                        <th className="px-4 py-3 text-center">Kriter</th>
                                        <th className="px-4 py-3 text-right">Eşik Değeri</th>
                                        <th className="px-4 py-3 text-center w-[120px]">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {limits.map((limit) => (
                                        <tr key={limit.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-900">{limit.kpi?.aciklama || limit.kpi_kodu}</div>
                                                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase mt-0.5">{limit.kpi_kodu}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    limit.seviye === 'RED' || limit.seviye === 'KRITIK' 
                                                        ? 'bg-red-50 text-red-700 border border-red-100' 
                                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                    {limit.seviye === 'RED' || limit.seviye === 'KRITIK' ? 'Kritik / Kırmızı' : 'Yakın İzleme / Sarı'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-500">
                                                {limit.karsilastirma === 'GT' ? 'Büyüktür (>)' : limit.karsilastirma === 'LT' ? 'Küçüktür (<)' : 'Eşittir (=)'}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                                                {editingId === limit.id ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <input 
                                                            type="text" 
                                                            value={newValue}
                                                            onChange={(e) => setNewValue(e.target.value)}
                                                            className="w-20 px-2 py-1 text-sm border border-indigo-400 rounded-lg text-right font-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-slate-400 font-normal text-xs">
                                                            {limit.kpi?.birim === 'YUZDE' ? '%' : limit.kpi?.birim === 'TUTAR' ? '₺' : limit.kpi?.birim === 'ORAN' ? 'Oran' : limit.kpi?.birim}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span>
                                                        {limit.kpi?.birim === 'YUZDE' ? '%' : limit.kpi?.birim === 'TUTAR' ? '₺' : ''} {Number(limit.esik_deger).toFixed(2)} {limit.kpi?.birim === 'ORAN' ? 'Oran' : ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {editingId === limit.id ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={() => handleSave(limit.id)}
                                                            disabled={savingId === limit.id}
                                                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg transition-all"
                                                            title="Kaydet"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
                                                            title="Vazgeç"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleEdit(limit)}
                                                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all flex items-center justify-center mx-auto"
                                                        title="Düzenle"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                    <Button variant="secondary" onClick={onClose}>Kapat</Button>
                </div>
            </div>
        </div>
    );
}
