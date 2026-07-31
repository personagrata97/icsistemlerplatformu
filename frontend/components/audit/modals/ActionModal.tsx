import React, { useState } from 'react';
import { Calendar, User, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import DatePicker from '@/components/ui/DatePicker';
import FormTextarea from '@/components/ui/FormTextarea';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (action: any) => void;
    findingId?: string;
}

export default function ActionModal({ isOpen, onClose, onSave, findingId }: ActionModalProps) {
    const [action, setAction] = useState({
        responsible: '',
        dueDate: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...action, findingId, id: Date.now() });
        onClose();
        setAction({ responsible: '', dueDate: '', description: '' });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Yeni Aksiyon Ekle"
            size="md"
            footer={
                <div className="flex justify-end w-full">
                    <Button
                        type="submit"
                        form="createActionForm"
                        variant="primary"
                        className="min-w-[120px]"
                    >
                        Ekle
                    </Button>
                </div>
            }
        >
            <form id="createActionForm" onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Sorumlu Kişi"
                    required
                    leftIcon={<User size={18} />}
                    placeholder="Örn: Ahmet Yılmaz"
                    value={action.responsible}
                    onChange={e => setAction({ ...action, responsible: e.target.value })}
                />
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Termin Tarihi *</label>
                    <DatePicker
                        value={action.dueDate}
                        onChange={val => setAction({ ...action, dueDate: val })}
                    />
                </div>
                <FormTextarea
                    label="Yapılacak İş"
                    required
                    rows={3}
                    placeholder="Aksiyon detaylarını buraya yazın..."
                    value={action.description}
                    onChange={e => setAction({ ...action, description: e.target.value })}
                />
            </form>
        </Modal>
    );
}
