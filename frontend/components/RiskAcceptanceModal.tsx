import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Upload, FileText, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface RiskAcceptanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (justification: string, file: File | null) => Promise<void>;
    findingTitle?: string;
}

export default function RiskAcceptanceModal({ isOpen, onClose, onConfirm, findingTitle }: RiskAcceptanceModalProps) {
    const [justification, setJustification] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!justification.trim()) return;
        setLoading(true);
        try {
            await onConfirm(justification, file);
            setLoading(false);
            setJustification('');
            setFile(null);
            onClose();
        } catch (error) {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <ShieldAlert size={20} className="text-amber-600" />
                    <span>Risk Kabulü</span>
                </div>
            }
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose}>İptal</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!justification.trim() || loading}
                        className="min-w-[140px]"
                    >
                        {loading ? 'İşleniyor...' : 'Riski Kabul Et'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-sm text-blue-800">
                    <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <div>
                        <span className="font-semibold block mb-1">Yönetim Kararı ile Kapatma</span>
                        Bu işlem, ilgili bulgu için yönetimin riski üstlendiğini belgeler. Bulgu <strong>"Risk Kabul Edildi"</strong> statüsünde raporlanacaktır.
                    </div>
                </div>

                {findingTitle && (
                    <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-600">
                        <strong>Bulgu:</strong> {findingTitle}
                    </div>
                )}

                <div>
                    <label className="form-label text-gray-700 font-semibold mb-2 block">
                        Risk Kabulü Belgesi (Üst Yönetim/Yönetim Kurulu Kararı vb.)
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all hover:border-primary/50 group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {file ? (
                                <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                        <FileText size={24} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 text-center max-w-[200px] truncate">{file.name}</p>
                                    <p className="text-xs text-green-600 font-medium">Dosya seçildi</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-primary transition-colors">
                                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-primary/10 transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <p className="text-sm font-medium">Belge yüklemek için tıklayın</p>
                                    <p className="text-xs text-gray-400">PDF, DOC, DOCX, IMG (Maks. 100MB)</p>
                                </div>
                            )}
                        </div>
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.jpg,.png" />
                    </label>
                    {file && (
                        <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-xs text-red-500 hover:text-red-700 mt-2 font-medium flex items-center gap-1">
                            <X size={12} /> Dosyayı Kaldır
                        </button>
                    )}
                </div>

                <div>
                    <label className="form-label text-gray-700 font-semibold mb-2 block">
                        Gerekçe / Karar Özeti <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        className="form-input min-h-[100px] focus:ring-amber-500/20 focus:border-amber-500 border-gray-300 rounded-lg w-full p-3 text-sm placeholder:text-gray-400"
                        placeholder="Örn: Yönetim Kurulu'nun 20.01.2024 tarih ve 2024/05 sayılı kararı ile maliyet kısıtları nedeniyle risk üstlenilmiştir."
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{justification.length}/500</p>
                </div>
            </div>
        </Modal>
    );
}
