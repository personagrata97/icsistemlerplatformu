import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';

interface EditPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; description: string; status: string }) => void;
    initialData: { title: string; description: string; status: string };
}

export default function EditPlanModal({
    isOpen,
    onClose,
    onSave,
    initialData
}: EditPlanModalProps) {
    const [formData, setFormData] = useState(initialData);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Planı Düzenle"
            size="lg"
            footer={
                <div className="flex justify-end w-full">
                    <Button onClick={handleSave} variant="primary" className="px-6 shadow-md">
                        Güncelle
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Başlığı</label>
                    <input type="text" className="form-input w-full" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea className="form-textarea w-full" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="form-group">
                    <CustomSelect
                        label="Durum"
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val as string })}
                        options={[
                            { value: 'Taslak', label: 'Taslak' },
                            { value: 'Onay Bekliyor', label: 'Onay Bekliyor' },
                            { value: 'Onaylandı', label: 'Onaylandı' },
                            { value: 'İptal', label: 'İptal' }
                        ]}
                    />
                </div>
            </div>
        </Modal>
    );
}
