import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import FormField from '@/components/ui/FormField';
import { AlertCircle } from 'lucide-react';

interface TrainingForm {
    name: string;
    provider: string;
    startDate: string;
    endDate: string;
    hours: string;
    status: string;
    description: string;
}

interface TrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    trainingForm: TrainingForm;
    setTrainingForm: (form: TrainingForm) => void;
    isEditing: boolean;
    loading: boolean;
}

export default function TrainingModal({
    isOpen,
    onClose,
    onSave,
    trainingForm,
    setTrainingForm,
    isEditing,
    loading
}: TrainingModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Eğitim Düzenle" : "Yeni Eğitim Girişi"}
            size="md"
            footer={(
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button type="submit" form="training-form" disabled={loading} isLoading={loading}>Kaydet</Button>
                </div>
            )}
        >
            <form id="training-form" onSubmit={onSave} className="space-y-4">
                <FormInput
                    label="Eğitim / Sertifika Adı"
                    type="text"
                    value={trainingForm.name}
                    onChange={e => setTrainingForm({ ...trainingForm, name: e.target.value })}
                    required={true}
                    placeholder="Örn: CISA Hazırlık Eğitimi, Suistimal Denetimi"
                />
                <FormInput
                    label="Eğitim Kurumu / Sağlayıcı"
                    type="text"
                    value={trainingForm.provider}
                    onChange={e => setTrainingForm({ ...trainingForm, provider: e.target.value })}
                    placeholder="Örn: ISACA, Kurum İçi"
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Başlangıç Tarihi">
                        <DatePicker 
                            value={trainingForm.startDate} 
                            onChange={(val) => setTrainingForm({ ...trainingForm, startDate: val })} 
                            required={true} 
                        />
                    </FormField>
                    <FormField label="Bitiş Tarihi">
                        <DatePicker 
                            value={trainingForm.endDate} 
                            onChange={(val) => setTrainingForm({ ...trainingForm, endDate: val })} 
                            required={true} 
                        />
                    </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="CPE / Eğitim Saati"
                        type="number"
                        value={trainingForm.hours}
                        onChange={e => setTrainingForm({ ...trainingForm, hours: e.target.value })}
                        placeholder="Örn: 16"
                    />
                    <FormField label="Durum">
                        <CustomSelect
                            value={trainingForm.status}
                            onChange={val => setTrainingForm({ ...trainingForm, status: val as string })}
                            options={[
                                { value: 'Planlandı', label: 'Planlandı' },
                                { value: 'Devam Ediyor', label: 'Devam Ediyor' },
                                { value: 'Tamamlandı', label: 'Tamamlandı' },
                                { value: 'İptal Edildi', label: 'İptal Edildi' }
                            ]}
                        />
                    </FormField>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p>Buraya girdiğiniz eğitim saati (CPE), personelin yıl sonu <strong>CPE Raporu</strong> hesaplamalarına otomatik olarak dahil edilecektir.</p>
                        <p className="text-xs opacity-80 pt-1 border-t border-blue-200/50">
                            <strong>Akıllı Puanlama İpucu:</strong> Eğitim adında <em>"Siber, Veri, Risk, SQL, Analiz, Fraud, Uyum"</em> gibi teknik kelimeler geçmesi, personelin <strong>Yetkinlik Matrisine (+0.5)</strong> otomatik olarak yansımasını sağlar.
                        </p>
                    </div>
                </div>
                <FormTextarea
                    label="Açıklama"
                    className="min-h-[80px]" 
                    value={trainingForm.description} 
                    onChange={e => setTrainingForm({ ...trainingForm, description: e.target.value })} 
                />
            </form>
        </Modal>
    );
}
