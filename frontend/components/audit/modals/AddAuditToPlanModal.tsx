import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';

interface AddAuditToPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void;
    planAudits: any[];
    availableAudits: any[];
    selectedAuditId: string;
    setSelectedAuditId: (id: string) => void;
}

export default function AddAuditToPlanModal({
    isOpen,
    onClose,
    onAdd,
    planAudits,
    availableAudits,
    selectedAuditId,
    setSelectedAuditId
}: AddAuditToPlanModalProps) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Plana Denetim Ekle"
            size="md"
            footer={
                <div className="flex justify-end w-full">
                    <Button onClick={onAdd} variant="primary" className="px-6 shadow-md">
                        Ekle
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="form-group">
                    <CustomSelect
                        label="Denetim Seç"
                        value={selectedAuditId}
                        onChange={(val) => setSelectedAuditId(val as string)}
                        placeholder="Denetim seçiniz..."
                        options={availableAudits
                            .filter(a => !planAudits?.some((pa: any) => pa.id === a.id))
                            .map(a => ({
                                value: a.id,
                                label: `${a.title} (${a.type})`
                            }))
                        }
                    />
                </div>
                <p className="text-xs text-gray-500">
                    Not: Sadece henüz bu plana eklenmemiş denetimler listelenir. Yeni denetim oluşturmak için Denetimler sayfasını kullanın.
                </p>
            </div>
        </Modal>
    );
}
