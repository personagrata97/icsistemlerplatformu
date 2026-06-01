import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import Checkbox from '@/components/ui/Checkbox';
import { DEPARTMENTS, HIERARCHY } from '@/lib/organization-constants';

interface ExperienceForm {
    companyName: string;
    department: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    careerPaths: string;
}

interface ExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    experienceForm: ExperienceForm;
    setExperienceForm: (form: ExperienceForm) => void;
    isEditing: boolean;
    loading: boolean;
    selectedParentExp: string;
    setSelectedParentExp: (val: string) => void;
}

export default function ExperienceModal({
    isOpen,
    onClose,
    onSave,
    experienceForm,
    setExperienceForm,
    isEditing,
    loading,
    selectedParentExp,
    setSelectedParentExp
}: ExperienceModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Deneyim Düzenle" : "Deneyim Ekle"}
            size="md"
            footer={(
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button type="submit" form="experience-form" disabled={loading} isLoading={loading}>Kaydet</Button>
                </div>
            )}
        >
            <form id="experience-form" onSubmit={onSave} className="space-y-4">
                <div className="form-group">
                    <label className="form-label">Şirket/Kurum</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        value={experienceForm.companyName} 
                        onChange={e => setExperienceForm({ ...experienceForm, companyName: e.target.value })} 
                        required={true} 
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Departman / Birim</label>
                    <div className="space-y-3">
                        <CustomSelect
                            value={selectedParentExp}
                            onChange={val => {
                                setSelectedParentExp(val as string);
                                setExperienceForm({ ...experienceForm, department: '' });
                            }}
                            options={HIERARCHY.flatMap(group =>
                                group.children.map(child => ({
                                    value: child.title,
                                    label: `${group.title} > ${child.title}`
                                }))
                            )}
                            placeholder="Üst Birim seçiniz..."
                        />
                        {selectedParentExp && (
                            <CustomSelect
                                value={experienceForm.department}
                                onChange={val => setExperienceForm({ ...experienceForm, department: val as string })}
                                options={(function () {
                                    const flatten = (items: Array<{ title: string; children?: any[] }>, level: number = 0): Array<{ value: string; label: string }> => {
                                        return items.flatMap(item => {
                                            const current = {
                                                value: item.title,
                                                label: (level > 0 ? '→ '.repeat(level) + ' ' : '') + item.title
                                            };
                                            if (item.children) {
                                                return [current, ...flatten(item.children, level + 1)];
                                            }
                                            return [current];
                                        });
                                    };

                                    for (const group of HIERARCHY) {
                                        const child = group.children.find(c => c.title === selectedParentExp);
                                        if (child && 'children' in child) {
                                            return flatten((child as { children: any[] }).children);
                                        }
                                    }
                                    return DEPARTMENTS.map(d => ({ value: d, label: d }));
                                })()}
                                placeholder="Alt Birim seçiniz..."
                            />
                        )}
                        {!selectedParentExp && (
                            <input
                                type="text"
                                className="form-input"
                                value={experienceForm.department}
                                onChange={e => setExperienceForm({ ...experienceForm, department: e.target.value })}
                                placeholder="Veya elle giriniz..."
                            />
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Pozisyon</label>
                    <input 
                        type="text" 
                        className="form-input" 
                        value={experienceForm.position} 
                        onChange={e => setExperienceForm({ ...experienceForm, position: e.target.value })} 
                        required={true} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">Başlangıç</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={experienceForm.startDate} 
                            onChange={e => setExperienceForm({ ...experienceForm, startDate: e.target.value })} 
                            required={true} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bitiş</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={experienceForm.endDate} 
                            onChange={e => setExperienceForm({ ...experienceForm, endDate: e.target.value })} 
                            disabled={experienceForm.isCurrent} 
                        />
                        <div className="mt-1">
                            <Checkbox
                                id="isCurrentExp"
                                checked={experienceForm.isCurrent}
                                onChange={checked => setExperienceForm({ ...experienceForm, isCurrent: checked })}
                                label="Devam Ediyor"
                            />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Kariyer Detayları (Ünvan & Yıllar)</label>
                    <textarea 
                        className="form-input min-h-[60px]" 
                        value={experienceForm.careerPaths} 
                        onChange={e => setExperienceForm({ ...experienceForm, careerPaths: e.target.value })} 
                        placeholder="Örn: 2020-2022: Uzman Yardımcısı, 2022-2024: Uzman (Her satıra bir ünvan)" 
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Açıklama / Başarılar</label>
                    <textarea 
                        className="form-input min-h-[100px]" 
                        value={experienceForm.description} 
                        onChange={e => setExperienceForm({ ...experienceForm, description: e.target.value })} 
                    />
                </div>
            </form>
        </Modal>
    );
}
