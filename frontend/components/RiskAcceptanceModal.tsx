import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Upload, FileText, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import FormTextarea from '@/components/ui/FormTextarea';

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

                <FileUpload
                    label="Risk Kabulü Belgesi (Üst Yönetim/Yönetim Kurulu Kararı vb.)"
                    description="Belge yüklemek için tıklayın veya sürükleyin"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    multiple={false}
                    onFileSelect={(files) => setFile(files?.[0] || null)}
                />

                <FormTextarea
                    label="Gerekçe / Karar Özeti"
                    required
                    rows={4}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Örn: Yönetim Kurulu'nun 20.01.2024 tarih ve 2024/05 sayılı kararı ile maliyet kısıtları nedeniyle risk üstlenilmiştir."
                    helperText={`${justification.length}/500`}
                />
            </div>
        </Modal>
    );
}
