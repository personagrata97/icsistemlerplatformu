import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import Button from '@/components/ui/Button';

interface DeleteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, comment: string) => void;
    title: string;
    description: string;
}

const REASON_OPTIONS = [
    { value: 'Sehven Oluşturuldu', label: 'Sehven Oluşturuldu' },
    { value: 'Mükerrer Kayıt', label: 'Mükerrer Kayıt' },
    { value: 'Yanlış Veri Girişi', label: 'Yanlış Veri Girişi' },
    { value: 'Artık Geçerli Değil', label: 'Artık Geçerli Değil' },
    { value: 'Diğer', label: 'Diğer' }
];

export default function DeleteRequestModal({ isOpen, onClose, onConfirm, title, description }: DeleteRequestModalProps) {
    const [reason, setReason] = useState('');
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (!reason) return;
        onConfirm(reason, comment);
        setReason('');
        setComment('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button onClick={onClose} variant="secondary">İptal</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason}
                        variant="danger"
                    >
                        Talebi Gönder
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <p>{description}</p>
                </div>

                <div>
                    <CustomSelect
                        label="Silme Gerekçesi"
                        options={REASON_OPTIONS}
                        value={reason}
                        onChange={(val) => setReason(val as string)}
                        placeholder="Bir gerekçe seçin"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (İsteğe Bağlı)</label>
                    <textarea
                        className="form-input min-h-[100px]"
                        placeholder="Ek açıklama giriniz..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
}
