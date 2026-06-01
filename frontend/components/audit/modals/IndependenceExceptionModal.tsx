import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/Toast';

interface IndependenceExceptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export default function IndependenceExceptionModal({ isOpen, onClose, onSubmit }: IndependenceExceptionModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        selectedReasons: [] as string[],
        explanation: ''
    });

    const reasonsObj: Record<string, keyof typeof formData> = {
        'financial': 'hasFinancialLink' as keyof typeof formData,
        'family': 'hasFamilyLink' as keyof typeof formData,
        'previous': 'hasPreviousRole' as keyof typeof formData,
        'other': 'hasOtherIssue' as keyof typeof formData
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (formData.selectedReasons.length === 0) {
            showToast('Lütfen en az bir istisna nedeni seçiniz.', 'error');
            return;
        }

        if (!formData.explanation.trim()) {
            showToast('Lütfen detaylı açıklama giriniz.', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                hasFinancialLink: formData.selectedReasons.includes('financial'),
                hasFamilyLink: formData.selectedReasons.includes('family'),
                hasPreviousRole: formData.selectedReasons.includes('previous'),
                hasOtherIssue: formData.selectedReasons.includes('other'),
                explanation: formData.explanation
            };
            await onSubmit(submitData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="İstisna / Çıkar Çatışması Bildirimi"
            size="lg"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={loading}>Bildirimi Gönder</Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-4">
                    Bu denetim görevi ile ilgili bağımsızlığınızı veya tarafsızlığınızı zedeleyebilecek potansiyel çıkar çatışmalarını aşağıda belirterek yöneticinizin onayına sunabilirsiniz.
                </div>

                <div className="space-y-4">
                    <CustomSelect
                        label="İstisna / Çıkar Çatışması Sebepleri *"
                        value={formData.selectedReasons}
                        onChange={(val) => setFormData({ ...formData, selectedReasons: val as string[] })}
                        isMulti
                        checkAllOption
                        placeholder="Neden seçiniz..."
                        options={[
                            { value: 'financial', label: 'Denetlenen birim veya kişilerle maddi / ticari ilişkim bulunmaktadır.' },
                            { value: 'family', label: 'Denetlenen birimde çalışan yakın akrabam/bağım bulunmaktadır.' },
                            { value: 'previous', label: 'Son 1 yıl içerisinde denetlenen birimde görev aldım.' },
                            { value: 'other', label: 'Diğer (Bağımsızlığımı zedeleyebilecek farklı bir istisnai durum)' }
                        ]}
                    />
                </div>

                <div className="form-group mt-4">
                    <label className="form-label text-sm font-semibold">Detaylı Açıklama *</label>
                    <textarea 
                        className="form-textarea min-h-[120px]" 
                        required 
                        placeholder="Lütfen istisna veya çıkar çatışması durumunuzu detaylandırınız. Bu bildirim ilgili yönetici/kalite güvencesi sorumlusunun incelemesine düşecektir."
                        value={formData.explanation}
                        onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                    />
                </div>
            </form>
        </Modal>
    );
}
