import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import FormInput from '@/components/ui/FormInput';
import FormField from '@/components/ui/FormField';

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
                <FormInput
                    label="Kurum"
                    type="text"
                    value={educationForm.schoolName}
                    onChange={e => setEducationForm({ ...educationForm, schoolName: e.target.value })}
                    required={true}
                    placeholder="Örn: Boğaziçi Üniversitesi, ODTÜ"
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Fakülte"
                        type="text"
                        value={educationForm.faculty}
                        onChange={e => setEducationForm({ ...educationForm, faculty: e.target.value })}
                        placeholder="Örn: İşletme Fakültesi"
                    />
                    <FormInput
                        label="Bölüm"
                        type="text"
                        value={educationForm.department}
                        onChange={e => setEducationForm({ ...educationForm, department: e.target.value })}
                        placeholder="Örn: İktisat"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Derece">
                        <CustomSelect
                            value={educationForm.degree}
                            onChange={val => setEducationForm({ ...educationForm, degree: val as string })}
                            options={[
                                { value: 'Lisans', label: 'Lisans' },
                                { value: 'Yüksek Lisans', label: 'Yüksek Lisans' },
                                { value: 'Doktora', label: 'Doktora' }
                            ]}
                        />
                    </FormField>
                    <FormInput
                        label="Mezuniyet Yılı"
                        type="number"
                        value={educationForm.graduationYear}
                        onChange={e => setEducationForm({ ...educationForm, graduationYear: e.target.value })}
                    />
                </div>
            </form>
        </Modal>
    );
}
