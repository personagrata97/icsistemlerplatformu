import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Save } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import FormField from '@/components/ui/FormField';

interface LeaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (leaveData: any) => void;
    initialData?: any;
    isViewMode?: boolean;
    staffList?: any[]; // For proxy selection
    currentStaffId?: string; // Eklenen özellik: İzin giren kişinin id'si
}

const LEAVE_TYPES = [
    'Yıllık İzin',
    'Sağlık Raporu (Hastalık)',
    'Mazeret İzni',
    'Doğum / Babalık İzni',
    'Evlilik İzni',
    'Ölüm İzni',
    'Ücretsiz İzin',
    'İdari İzin'
];

const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onSave, initialData, isViewMode, staffList = [], currentStaffId }) => {
    const [leaveForm, setLeaveForm] = useState<any>({
        type: '',
        startDate: '',
        endDate: '',
        status: 'Planlandı',
        description: '',
        proxyUserId: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setLeaveForm({
                    ...initialData,
                    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                });
            } else {
                setLeaveForm({
                    type: '',
                    startDate: '',
                    endDate: '',
                    status: 'Planlandı',
                    description: '',
                    proxyUserId: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(leaveForm);
    };

    const proxyOptions = staffList
        .filter(s => s.id !== currentStaffId) // Kişi kendine vekalet edemez
        .map(s => ({ value: s.id, label: s.displayName || s.name || s.username }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? (isViewMode ? 'İzin Detayı' : 'İzni Düzenle') : 'Yeni İzin Ekle'}
            size="2xl"
            footer={
                !isViewMode && (
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="secondary" onClick={onClose}>İptal</Button>
                        <Button variant="primary" onClick={handleSubmit} leftIcon={<Save size={16} />}>Kaydet</Button>
                    </div>
                )
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <FormField label="İzin Türü" required>
                    <CustomSelect
                        value={leaveForm.type}
                        onChange={val => setLeaveForm({ ...leaveForm, type: val as string })}
                        options={LEAVE_TYPES.map(t => ({ value: t, label: t }))}
                        disabled={isViewMode}
                        placeholder="İzin Türü Seçiniz"
                    />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Başlangıç Tarihi" required>
                        <DatePicker
                            value={leaveForm.startDate}
                            onChange={(val) => setLeaveForm({ ...leaveForm, startDate: val })}
                            disabled={isViewMode}
                        />
                    </FormField>
                    <FormField label="Bitiş Tarihi" required>
                        <DatePicker
                            value={leaveForm.endDate}
                            onChange={(val) => setLeaveForm({ ...leaveForm, endDate: val })}
                            disabled={isViewMode}
                        />
                    </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Vekalet Edecek Kişi">
                        <CustomSelect
                            value={leaveForm.proxyUserId || ''}
                            onChange={val => setLeaveForm({ ...leaveForm, proxyUserId: val as string })}
                            options={proxyOptions}
                            disabled={isViewMode}
                            placeholder="Vekil Seçiniz (Opsiyonel)"
                        />
                    </FormField>
                    <FormField label="Durum">
                        <CustomSelect
                            value={leaveForm.status}
                            onChange={val => setLeaveForm({ ...leaveForm, status: val as string })}
                            options={[
                                { value: 'Planlandı', label: 'Planlandı' },
                                { value: 'Onaylandı', label: 'Onaylandı' },
                                { value: 'İptal Edildi', label: 'İptal Edildi' }
                            ]}
                            disabled={isViewMode}
                        />
                    </FormField>
                </div>

                <div className="form-group">
                    <FormTextarea
                        label="Açıklama (Opsiyonel)"
                        value={leaveForm.description || ''}
                        onChange={e => setLeaveForm({ ...leaveForm, description: e.target.value })}
                        disabled={isViewMode}
                        placeholder="İzin detayları, acil durumda ulaşılacak telefon vb."
                        className="min-h-[80px]"
                    />
                </div>
            </form>
        </Modal>
    );
};

export default LeaveModal;
