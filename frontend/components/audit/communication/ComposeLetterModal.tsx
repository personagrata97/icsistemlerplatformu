'use client';

import React, { useState } from 'react';
import { Mail, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { ORG } from '@/lib/org-config';

interface ComposeLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    auditDetails: any;
    initialData?: any;
}

export default function ComposeLetterModal({ isOpen, onClose, onSubmit, auditDetails, initialData }: ComposeLetterModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || undefined,
        type: initialData?.type || 'NOTIFICATION',
        subject: initialData?.subject || '',
        content: initialData?.content || '',
        status: initialData?.status || 'Gönderildi'
    });

    const handleTypeChange = (type: string) => {
        let defaultSubject = '';
        let defaultContent = '';

        if (type === 'NOTIFICATION') {
            defaultSubject = `${auditDetails?.title || 'Denetim'} - Görevlendirme ve Kapsam Bildirimi`;
            defaultContent = `Sayın İlgili Yöneticiler,\n\n${auditDetails?.department || 'İlgili birim'} nezdinde yürütülecek olan "${auditDetails?.title || 'Denetim'}" isimli planlı iç denetim çalışmamızın kapsamı ve hedefleri ekteki gibidir.\n\nSürecin sağlıklı yürütülebilmesi adına açılış toplantısına katılımınızı ve talep edilecek bilgi/belgelerin en kısa sürede tarafımıza iletilmesini rica ederiz.\n\nSaygılarımızla,\n${ORG.letterSignature}`;
        } else if (type === 'DRAFT_REPORT') {
            defaultSubject = `${auditDetails?.title || 'Denetim'} - Taslak Rapor Tebliği`;
            defaultContent = `Sayın İlgili Yöneticiler,\n\nTamamlanan "${auditDetails?.title || 'Denetim'}" çalışmamıza ilişkin bulguları içeren taslak denetim raporumuz tartışmaya açılmıştır.\n\nRapor bulgularına ilişkin aksiyon planlarınızı ve mutabakat/itiraz durumlarınızı sisteme girmenizi önemle rica ederiz.\n\nSaygılarımızla,\n${ORG.letterSignature}`;
        } else if (type === 'FINAL_REPORT') {
            defaultSubject = `${auditDetails?.title || 'Denetim'} - Kesinleşmiş Denetim Raporu`;
            defaultContent = `Sayın İlgili Yöneticiler,\n\n"${auditDetails?.title || 'Denetim'}" çalışmamızın nihai raporu yayınlanmıştır.\nBulgulara ilişkin periyodik takip süreci resmi olarak başlamıştır.\n\nSaygılarımızla,\n${ORG.letterSignature}`;
        }

        setFormData({ ...formData, type, subject: defaultSubject, content: defaultContent });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Yeni Mail / Bildirim Gönder"
            size="lg"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} isLoading={loading}>
                        Gönder & Kaydet
                    </Button>
                </div>
            }
        >
            <form id="composeLetterForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3 mb-4">
                    <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-blue-700">
                        Bu alandan göndereceğiniz mesajlar denetimin resmi iletişim günlüğüne kaydedilecek ve ilgili birim yöneticilerine bildirim olarak iletilecektir.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group md:col-span-2">
                        <CustomSelect
                            label="İletişim Türü / Konsept"
                            value={formData.type}
                            onChange={(val) => handleTypeChange(val as string)}
                            options={[
                                { value: 'NOTIFICATION', label: 'Görevlendirme ve Kapsam Bildirimi' },
                                { value: 'DRAFT_REPORT', label: 'Taslak Rapor Bildirimi' },
                                { value: 'FINAL_REPORT', label: 'Kesin Rapor Bildirimi' },
                                { value: 'OTHER', label: 'Diğer Kurumsal Yazışmalar' },
                            ]}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Konu Başlığı</label>
                    <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Yazışma konusu..."
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label flex justify-between">
                        <span>İçerik (Mail Metni)</span>
                    </label>
                    <textarea
                        required
                        className="form-textarea min-h-[250px] font-sans text-sm leading-relaxed"
                        placeholder="Sayın ilgili..."
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <CustomSelect
                        label="Durum"
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val as string })}
                        options={[
                            { value: 'Taslak', label: 'Taslağa Kaydet (Gönderme)' },
                            { value: 'Gönderildi', label: 'Gönderildi Olarak İşaretle' }
                        ]}
                    />
                </div>
            </form>
        </Modal>
    );
}
