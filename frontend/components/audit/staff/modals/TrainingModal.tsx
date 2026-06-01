import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';

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
                <div className="form-group">
                    <label className="form-label">Eğitim / Sertifika Adı</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        value={trainingForm.name} 
                        onChange={e => setTrainingForm({ ...trainingForm, name: e.target.value })} 
                        required={true} 
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Eğitim Kurumu / Sağlayıcı</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        value={trainingForm.provider} 
                        onChange={e => setTrainingForm({ ...trainingForm, provider: e.target.value })} 
                        placeholder="Örn: ISACA, Kurum İçi" 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Başlangıç Tarihi</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={trainingForm.startDate} 
                            onChange={e => setTrainingForm({ ...trainingForm, startDate: e.target.value })} 
                            required={true} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bitiş Tarihi</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={trainingForm.endDate} 
                            onChange={e => setTrainingForm({ ...trainingForm, endDate: e.target.value })} 
                            required={true} 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">CPE / Eğitim Saati</label>
                        <input 
                            type="number" 
                            className="form-input" 
                            value={trainingForm.hours} 
                            onChange={e => setTrainingForm({ ...trainingForm, hours: e.target.value })} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Durum</label>
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
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Açıklama</label>
                    <textarea 
                        className="form-input min-h-[80px]" 
                        value={trainingForm.description} 
                        onChange={e => setTrainingForm({ ...trainingForm, description: e.target.value })} 
                    />
                </div>
            </form>
        </Modal>
    );
}
