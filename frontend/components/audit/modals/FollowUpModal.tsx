import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

import CustomSelect from '@/components/ui/CustomSelect';
import StaffSelect from '@/components/audit/StaffSelect';

interface FollowUpFormData {
    action: string;
    findingCode: string;
    deadline: string;
    priority: 'Yüksek' | 'Orta' | 'Düşük';
    assignee: string;
    notes: string;
}

interface FollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FollowUpFormData) => Promise<void>;
    initialData?: FollowUpFormData | null;
    isEditing?: boolean;
}

export default function FollowUpModal({ isOpen, onClose, onSubmit, initialData, isEditing }: FollowUpModalProps) {
    const defaultState: FollowUpFormData = { action: '', findingCode: '', deadline: '', priority: 'Orta', assignee: '', notes: '' };
    const [formData, setFormData] = useState<FollowUpFormData>(defaultState);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData(initialData);
        } else if (isOpen) {
            setFormData(defaultState);
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Takip Kaydını Düzenle' : 'Yeni Takip Kaydı'}
            size="lg"
            footer={
                <div className="flex justify-end w-full">
                    <Button type="submit" form="followUpForm" variant="primary" className="px-8 shadow-md">Kaydet</Button>
                </div>
            }
        >
            <form id="followUpForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group"><label className="form-label">Aksiyon *</label><input type="text" className="form-input" required value={formData.action} onChange={e => setFormData({ ...formData, action: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4"><div className="form-group"><label className="form-label">Bulgu No</label><input type="text" className="form-input" placeholder="B-2024-XXX" value={formData.findingCode} onChange={e => setFormData({ ...formData, findingCode: e.target.value })} /></div><div className="form-group"><label className="form-label">Son Tarih *</label><input type="date" className="form-input" required value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} /></div></div>
                <div className="grid grid-cols-2 gap-4">
                    <StaffSelect
                        label="Sorumlu Kişi"
                        placeholder="Personel seçiniz..."
                        value={formData.assignee}
                        onChange={(val) => setFormData({ ...formData, assignee: val as string })}
                    />
                    <CustomSelect
                        label="Öncelik"
                        value={formData.priority}
                        onChange={(val) => setFormData({ ...formData, priority: val as any })}
                        options={[
                            { value: 'Yüksek', label: 'Yüksek' },
                            { value: 'Orta', label: 'Orta' },
                            { value: 'Düşük', label: 'Düşük' }
                        ]}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Açıklama / Notlar</label>
                    <textarea 
                        className="form-textarea min-h-[100px] resize-y" 
                        placeholder="Aksiyonla ilgili ek detaylar..." 
                        value={formData.notes || ''} 
                        onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                    />
                </div>
            </form>
        </Modal>
    )
}
