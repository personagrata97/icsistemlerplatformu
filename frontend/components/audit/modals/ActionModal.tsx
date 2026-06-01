import React, { useState } from 'react';
import { Calendar, User, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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
                <div className="form-group">
                    <label className="form-label">Sorumlu Kişi</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            className="form-input pl-10"
                            name="responsible"
                            placeholder="Örn: Ahmet Yılmaz"
                            required
                            value={action.responsible}
                            onChange={e => setAction({ ...action, responsible: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Termin Tarihi</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="date"
                            className="form-input pl-10"
                            name="dueDate"
                            required
                            value={action.dueDate}
                            onChange={e => setAction({ ...action, dueDate: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Yapılacak İş</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                        <textarea
                            className="form-textarea pl-10"
                            name="description"
                            rows={3}
                            placeholder="Aksiyon detaylarını buraya yazın..."
                            required
                            value={action.description}
                            onChange={e => setAction({ ...action, description: e.target.value })}
                        ></textarea>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
