'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface DataQualityReport {
    toplam_satir: number;
    kabul_edilen: number;
    reddedilen: number;
    hatalar: string[];
    uyarilar: string[];
    eksik_bagimliliklar: string[];
    is_valid: boolean;
}

interface DataUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DataUploadModal({ isOpen, onClose, onSuccess }: DataUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<DataQualityReport | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setReport(null); // Yeni dosya seçildiğinde eski raporu sıfırla
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // confirm=false ile sadece ön inceleme (pre-flight) yapıyoruz
            const response = await fetch(`${API_BASE}/risk/upload-excel`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            
            if (result.report) {
                setReport(result.report);
            } else {
                alert(result.mesaj || 'Analiz sırasında hata oluştu.');
            }
        } catch (error) {
            console.error(error);
            alert('Sunucuya bağlanırken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // confirm=true ile veritabanına kalıcı yazıyoruz
            const response = await fetch(`${API_BASE}/risk/upload-excel?confirm=true`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            
            if (result.basari) {
                alert(result.mesaj);
                onSuccess();
                onClose();
            } else {
                alert('Yükleme hatası: ' + result.mesaj);
            }
        } catch (error) {
            console.error(error);
            alert('Yükleme sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = (
        <span className="flex items-center gap-3 font-normal">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0 flex items-center justify-center">
                <DatabaseUploadIcon className="w-5 h-5" />
            </span>
            <span className="flex flex-col text-left">
                <span className="text-lg font-bold text-gray-900 block leading-tight">Veri Entegrasyonu</span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">Excel / CSV Veri Seti Yükleme Motoru</span>
            </span>
        </span>
    );

    const modalFooter = (
        <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
            
            {!report ? (
                <Button 
                    variant="primary" 
                    onClick={handleAnalyze} 
                    disabled={!file || loading}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            Analiz Ediliyor...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Upload size={16} />
                            Veri Kalitesini İncele
                        </span>
                    )}
                </Button>
            ) : (
                <>
                    <Button variant="secondary" onClick={() => setReport(null)} disabled={loading}>
                        Yeniden Dosya Seç
                    </Button>
                    {report.is_valid && (
                        <Button 
                            variant="primary" 
                            onClick={handleConfirmUpload} 
                            disabled={loading}
                        >
                            {loading ? 'Yükleniyor...' : 'Veriyi Risk Motoruna Yükle'}
                        </Button>
                    )}
                </>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            footer={modalFooter}
            size="lg"
        >
            {!report ? (
                <div className="space-y-6">
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 hover:border-indigo-400 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base font-medium text-gray-900">Excel Dosyası Seçin</h3>
                        <p className="text-sm text-gray-500 mt-1">Akıllı veri motoru sütunları otomatik eşleştirecektir.</p>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx,.xls,.csv" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {file && (
                            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-medium flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Ön İnceleme (Pre-Flight Check) Devrede</p>
                            <p>Yüklediğiniz dosya doğrudan veritabanına yazılmaz. Önce sistem tarafından analiz edilir, eksik sütunlar (Gecikme Günü, Sözleşme Tutarı vb.) veya tip uyuşmazlıkları tespit edilip size "Veri Kalite Raporu" sunulur.</p>
                        </div>
                    </div>

                    {/* Şablon Kılavuzu */}
                    <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            📋 Excel Sütun & Ölçüm Rehberi
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1 text-[11px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    NPL, DPD & Yoğunlaşma Analizi için:
                                </div>
                                <p className="text-slate-500 mb-2 text-[10px]">Excel'inizde aşağıdaki sütunların bulunması zorunludur:</p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-indigo-600 font-bold">ad_soyad</code>
                                        <span className="text-slate-400">Müşteri Adı Soyadı</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-indigo-600 font-bold">sozlesme_no</code>
                                        <span className="text-slate-400">Sözleşme ID / Numarası</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-indigo-600 font-bold">toplam_tutar</code>
                                        <span className="text-slate-400">Toplam Finansal Tutar (₺)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-indigo-600 font-bold">vade</code>
                                        <span className="text-slate-400">Sözleşme Vadesi (Ay)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-indigo-600 font-bold">gecikme_gunu</code>
                                        <span className="text-slate-400">Gecikme Günü (DPD)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="font-mono text-indigo-600 font-bold">segment, bolge, sube</code>
                                        <span className="text-slate-400">Lokasyon & Tip</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1 text-[11px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    LCR (Likidite Yeterlilik) Analizi için:
                                </div>
                                <p className="text-slate-500 mb-2 text-[10px]">Günlük nakit akışı ve likidite pozisyon verileri için:</p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-emerald-600 font-bold">tarih</code>
                                        <span className="text-slate-400">İşlem Tarihi (YYYY-MM-DD)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-emerald-600 font-bold">kasa_nakit</code>
                                        <span className="text-slate-400">Kasadaki Hazır Değer (₺)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-emerald-600 font-bold">bankalar</code>
                                        <span className="text-slate-400">Bankalardaki Mevduat (₺)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1">
                                        <code className="font-mono text-emerald-600 font-bold">girişler</code>
                                        <span className="text-slate-400">Beklenen Taksit Tahsilatı (₺)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <code className="font-mono text-emerald-600 font-bold">çıkışlar</code>
                                        <span className="text-slate-400">Planlanan Teslimat Ödemeleri</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className={`p-4 border rounded-xl flex items-start gap-4 ${report.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`p-2 rounded-full ${report.is_valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {report.is_valid ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${report.is_valid ? 'text-green-800' : 'text-red-800'}`}>
                                {report.is_valid ? 'Veri Seti Onaylandı' : 'Kritik Kalite Hataları Tespit Edildi'}
                            </h3>
                            <p className={`text-sm mt-1 ${report.is_valid ? 'text-green-700' : 'text-red-700'}`}>
                                Toplam {report.toplam_satir} satır okundu. {report.kabul_edilen} satır sağlıklı, {report.reddedilen} satır reddedildi.
                            </p>
                        </div>
                    </div>

                    {report.eksik_bagimliliklar.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Eksik Bağımlılıklar (Hesaplanamayacak Modüller)</h4>
                            <ul className="space-y-2">
                                {report.eksik_bagimliliklar.map((dep, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        {dep}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {report.hatalar.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Veri Hataları</h4>
                            <ul className="space-y-1">
                                {report.hatalar.map((err, idx) => (
                                    <li key={idx} className="text-sm text-red-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}

function DatabaseUploadIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            <path d="M21 8.5c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M12 15v4"></path>
            <path d="M8 19h8"></path>
        </svg>
    );
}
