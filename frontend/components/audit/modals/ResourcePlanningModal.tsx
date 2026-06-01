import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';

interface ResourcePlanningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: { staffId: string; days: number }) => void;
    staffList: any[];
    planResources: any[];
}

export default function ResourcePlanningModal({
    isOpen,
    onClose,
    onAdd,
    staffList,
    planResources
}: ResourcePlanningModalProps) {
    const [staffId, setStaffId] = useState('');
    const [days, setDays] = useState(15);

    useEffect(() => {
        if (isOpen) {
            setStaffId('');
            setDays(15);
        }
    }, [isOpen]);

    const handleAdd = () => {
        onAdd({ staffId, days });
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Kaynak Planla"
            size="md"
            footer={
                <div className="flex justify-end w-full">
                    <Button onClick={handleAdd} variant="primary" className="px-6 shadow-md">
                        Ekle
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="form-group">
                    <CustomSelect
                        label="Personel Seç (Aktif Personel)"
                        value={staffId}
                        onChange={(val) => setStaffId(val as string)}
                        placeholder="Personel seçiniz..."
                        options={staffList
                            .filter(s => s.status === 'Aktif')
                            .filter(s => s.title !== 'Sistem Yöneticisi' && s.username !== 'admin')
                            .filter(s => !planResources?.some((r: any) => r.staffId === s.id))
                            .map(s => ({
                                value: s.id,
                                label: `${s.name || `${s.firstName} ${s.lastName}`} - ${s.title}`
                            }))
                        }
                    />
                    <p className="text-xs text-gray-500 mt-1">Personelin ünvanı otomatik olarak kaydedilir.</p>
                </div>
                <div className="form-group">
                    <label className="form-label">Planlanan Süre (Adam/Gün)</label>
                    <input
                        type="number"
                        className="form-input w-full"
                        min="1"
                        placeholder=""
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>
        </Modal>
    );
}
