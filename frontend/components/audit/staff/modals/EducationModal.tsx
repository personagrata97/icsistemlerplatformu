import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';

interface EducationForm {
    schoolName: string;
    faculty: string;
    department: string;
    degree: string;
    graduationYear: string;
}

interface EducationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    educationForm: EducationForm;
    setEducationForm: (form: EducationForm) => void;
    isEditing: boolean;
    loading: boolean;
}

export default function EducationModal({
    isOpen,
    onClose,
    onSave,
    educationForm,
    setEducationForm,
    isEditing,
    loading
}: EducationModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Eğitim Düzenle" : "Eğitim Ekle"}
            size="md"
            footer={(
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button type="submit" form="education-form" disabled={loading} isLoading={loading}>Kaydet</Button>
                </div>
            )}
        >
            <form id="education-form" onSubmit={onSave} className="space-y-4">
                <div className="form-group">
                    <label className="form-label">Kurum</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        value={educationForm.schoolName} 
                        onChange={e => setEducationForm({ ...educationForm, schoolName: e.target.value })} 
                        required={true} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Fakülte</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={educationForm.faculty} 
                            onChange={e => setEducationForm({ ...educationForm, faculty: e.target.value })} 
                            placeholder="Örn: İşletme Fakültesi" 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bölüm</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={educationForm.department} 
                            onChange={e => setEducationForm({ ...educationForm, department: e.target.value })} 
                            placeholder="Örn: İktisat" 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Derece</label>
                        <CustomSelect
                            value={educationForm.degree}
                            onChange={val => setEducationForm({ ...educationForm, degree: val as string })}
                            options={[
                                { value: 'Lisans', label: 'Lisans' },
                                { value: 'Yüksek Lisans', label: 'Yüksek Lisans' },
                                { value: 'Doktora', label: 'Doktora' }
                            ]}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mezuniyet Yılı</label>
                        <input 
                            type="number" 
                            className="form-input" 
                            value={educationForm.graduationYear} 
                            onChange={e => setEducationForm({ ...educationForm, graduationYear: e.target.value })} 
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}
