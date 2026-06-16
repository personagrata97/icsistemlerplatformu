import React, { useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import FormInput from '@/components/ui/FormInput';
import CustomSelect from '@/components/ui/CustomSelect';
import FormField from '@/components/ui/FormField';
import { AlertCircle } from 'lucide-react';
import { AuditStaff } from '@/lib/audit-api';

interface BulkTrainingForm {
    name: string;
    provider: string;
    startDate: string;
    endDate: string;
    hours?: number | '';
    participantIds: string[];
}

interface BulkTrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    bulkTrainingForm: BulkTrainingForm;
    setBulkTrainingForm: (form: BulkTrainingForm) => void;
    staffList: AuditStaff[];
    loading: boolean;
}

export default function BulkTrainingModal({
    isOpen,
    onClose,
    onSave,
    bulkTrainingForm,
    setBulkTrainingForm,
    staffList,
    loading
}: BulkTrainingModalProps) {

    useEffect(() => {
        if (bulkTrainingForm.startDate && bulkTrainingForm.endDate) {
            const start = new Date(bulkTrainingForm.startDate);
            const end = new Date(bulkTrainingForm.endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
                let businessDays = 0;
                let current = new Date(start);
                while (current <= end) {
                    const day = current.getDay();
                    if (day !== 0 && day !== 6) { // Skip Sunday and Saturday
                        businessDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }
                setBulkTrainingForm({ ...bulkTrainingForm, hours: businessDays * 8 });
            }
        }
    }, [bulkTrainingForm.startDate, bulkTrainingForm.endDate]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Toplu Eğitim Tanımla"
            size="lg"
            footer={(
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button type="submit" form="bulk-training-form" disabled={loading} isLoading={loading}>Kaydı Oluştur</Button>
                </div>
            )}
        >
            <form id="bulk-training-form" onSubmit={onSave} className="space-y-6" noValidate>
                <div className="flex items-start gap-2 p-3 mb-4 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>Toplu atanan bu eğitim saatleri (CPE), seçili personelin yıl sonu <strong>CPE Raporu</strong> hesaplamalarına otomatik olarak dahil edilecektir.</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Eğitim Bilgileri</h3>
                        <FormInput
                            label="Eğitim Adı"
                            type="text"
                            value={bulkTrainingForm.name}
                            onChange={e => setBulkTrainingForm({ ...bulkTrainingForm, name: e.target.value })}
                            required={true}
                            placeholder="Örn: KVKK İleri Seviye Eğitimi"
                        />
                        <FormInput
                            label="Sağlayıcı"
                            type="text"
                            value={bulkTrainingForm.provider}
                            onChange={e => setBulkTrainingForm({ ...bulkTrainingForm, provider: e.target.value })}
                            required={true}
                            placeholder="Örn: TBB, ISACA"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Başlangıç">
                                <DatePicker 
                                    value={bulkTrainingForm.startDate} 
                                    onChange={(val) => setBulkTrainingForm({ ...bulkTrainingForm, startDate: val })} 
                                    required={true} 
                                />
                            </FormField>
                            <FormField label="Bitiş">
                                <DatePicker 
                                    value={bulkTrainingForm.endDate} 
                                    onChange={(val) => setBulkTrainingForm({ ...bulkTrainingForm, endDate: val })} 
                                    required={true} 
                                />
                            </FormField>
                        </div>
                        <FormInput
                            label="Eğitim Saati (CPE)"
                            type="number"
                            min="0"
                            value={bulkTrainingForm.hours === undefined ? '' : bulkTrainingForm.hours}
                            onChange={e => setBulkTrainingForm({ ...bulkTrainingForm, hours: e.target.value ? Number(e.target.value) : '' })}
                            placeholder="Otomatik hesaplandı, değiştirebilirsiniz"
                        />
                    </div>

                    <div className="flex-1 border-l pl-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Katılımcı Seçimi ({bulkTrainingForm.participantIds.length})</h3>
                        <div className="mt-2">
                            <CustomSelect
                                isMulti
                                value={bulkTrainingForm.participantIds}
                                onChange={(val) => setBulkTrainingForm({ ...bulkTrainingForm, participantIds: val as string[] })}
                                options={staffList.map(member => ({ value: member.id, label: `${member.name} (${member.title})` }))}
                                placeholder="Personel seçiniz..."
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
