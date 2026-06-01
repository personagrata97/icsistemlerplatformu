import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { ETHICS_CATEGORIES } from '@/lib/audit-utils';
import Button from '@/components/ui/Button';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';

interface CreateEthicsReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any, files: File[]) => Promise<{ trackingCode?: string }>;
}

export default function CreateEthicsReportModal({
    isOpen,
    onClose,
    onSave
}: CreateEthicsReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [successData, setSuccessData] = useState<{ trackingCode?: string } | null>(null);
    const [formData, setFormData] = useState({
        type: ETHICS_CATEGORIES[0].value,
        source: 'E-posta',
        priority: 'Orta' as const,
        description: '',
        name: '',
        email: '',
        anonymous: false
    });

    const handleClose = () => {
        setFormData({
            type: ETHICS_CATEGORIES[0].value,
            source: 'E-posta',
            priority: 'Orta' as const,
            description: '',
            name: '',
            email: '',
            anonymous: false
        });
        setSelectedFiles([]);
        setSuccessData(null);
        onClose();
    };

    const handleSave = async () => {
        if (!formData.description) return;
        try {
            setLoading(true);
            const result = await onSave(formData, selectedFiles);
            if (result && result.trackingCode) {
                setSuccessData(result);
            } else {
                handleClose();
            }
        } catch (error) {
            console.error('Save error', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2 text-primary text-lg font-bold">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Plus size={20} />
                    </div>
                    <span>{successData ? 'Bildirim Başarıyla Eklendi' : 'Manuel Etik Bildirimi Ekle'}</span>
                </div>
            }
            size="lg"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    {successData ? (
                        <Button onClick={handleClose} type="button" variant="primary">
                            Kapat
                        </Button>
                    ) : (
                        <>
                            <Button onClick={handleClose} type="button" variant="secondary">
                                İptal
                            </Button>
                            <Button
                                onClick={handleSave}
                                isLoading={loading}
                                disabled={!formData.description}
                                variant="primary"
                            >
                                Bildirimi Kaydet
                            </Button>
                        </>
                    )}
                </div>
            }
        >
            {successData ? (
                <div className="py-8 flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                        <Check size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">Bildirim Sisteme Kaydedildi</h3>
                        <p className="text-gray-500 max-w-sm">
                            Manuel bildirim başarıyla oluşturulmuştur. Takip kodu aşağıdadır:
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl w-full max-w-xs transition-all hover:border-primary/30">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Takip Kodu</span>
                        <span className="text-2xl font-mono font-black text-primary tracking-wider">{successData.trackingCode}</span>
                    </div>
                    <p className="text-xs text-amber-600 font-medium bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2 items-center">
                        <AlertCircle size={14} />
                        Bu kod ile bildirim takibi yapılabilir. Sorumlu kişi ataması yaparak süreci başlatabilirsiniz.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <CustomSelect
                            label="Kategori *"
                            value={formData.type}
                            onChange={(v) => setFormData({ ...formData, type: v as string })}
                            options={ETHICS_CATEGORIES}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <CustomSelect
                                label="Kaynak"
                                value={formData.source}
                                onChange={(val) => setFormData({ ...formData, source: val as string })}
                                options={[
                                    { value: 'E-posta', label: 'E-posta' },
                                    { value: 'Telefon', label: 'Telefon' },
                                    { value: 'Yüz Yüze', label: 'Yüz Yüze' },
                                    { value: 'Dilekce', label: 'Dilekçe / Mektup' }
                                ]}
                            />
                            <CustomSelect
                                label="Öncelik"
                                value={formData.priority}
                                onChange={(v) => setFormData({ ...formData, priority: v as any })}
                                options={[
                                    { value: 'Düşük', label: 'Düşük' },
                                    { value: 'Orta', label: 'Orta' },
                                    { value: 'Yüksek', label: 'Yüksek' },
                                    { value: 'Kritik', label: 'Kritik' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">Bildiren Ad-Soyad</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Belirtilmedi (Anonim)"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">İrtibat Bilgisi</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="E-posta veya Telefon"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1">Bildirim Detayı *</label>
                        <textarea
                            className="form-input h-32 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Bildirim detaylarını buraya giriniz..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase px-1">Kanıt / Ek Dosyalar</label>
                        <FileUpload
                            onFileSelect={(files) => setSelectedFiles(Array.from(files || []))}
                            maxSizeMB={20}
                            accept=".pdf,.doc,.docx,.jpg,.png,.jpeg,.xlsx"
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
}
