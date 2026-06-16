import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import FormTextarea from '@/components/ui/FormTextarea';
import FormField from '@/components/ui/FormField';
import { DEPARTMENTS, HIERARCHY } from '@/lib/organization-constants';

const TITLES = [
    'Müfettiş Yardımcısı', 
    'Yetkili Müfettiş Yardımcısı', 
    'Müfettiş', 
    'Kıdemli Müfettiş', 
    'Başmüfettiş', 
    'Teftiş Kurulu Müdürü'
];

interface PromotionForm {
    type: string;
    promotionDate: string;
    department: string;
    title: string;
    notes: string;
    previousTitle?: string;
    endDate?: string;
}

interface PromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    promotionForm: PromotionForm;
    setPromotionForm: (form: PromotionForm) => void;
    loading: boolean;
    selectedParentDept: string;
    setSelectedParentDept: (val: string) => void;
    editingStaffTitle?: string;
}

export default function PromotionModal({
    isOpen,
    onClose,
    onSave,
    promotionForm,
    setPromotionForm,
    loading,
    selectedParentDept,
    setSelectedParentDept,
    editingStaffTitle
}: PromotionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Yeni Terfi/Atama Ekle"
            size="md"
            footer={(
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button type="submit" form="promotion-form" disabled={loading} isLoading={loading}>Kaydet</Button>
                </div>
            )}
        >
            <form id="promotion-form" onSubmit={onSave} className="space-y-4">
                {editingStaffTitle && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-800 font-semibold">Mevcut Ünvan: {editingStaffTitle}</div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="İşlem Tipi">
                        <CustomSelect
                            value={promotionForm.type}
                            onChange={val => setPromotionForm({ ...promotionForm, type: val as string })}
                            options={[
                                { value: 'Terfi', label: 'Terfi' },
                                { value: 'Atama', label: 'Atama' },
                                { value: 'Geçici Görevlendirme', label: 'Geçici Görevlendirme' }
                            ]}
                        />
                    </FormField>
                    <FormField label="Tarih">
                        <DatePicker 
                            value={promotionForm.promotionDate} 
                            onChange={(val) => setPromotionForm({ ...promotionForm, promotionDate: val })} 
                            required={true} 
                        />
                    </FormField>
                </div>
                {(promotionForm.type === 'Atama' || promotionForm.type === 'Geçici Görevlendirme') && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <FormField label="Yeni Üst Birim / Grup">
                            <CustomSelect
                                value={selectedParentDept}
                                onChange={val => {
                                    setSelectedParentDept(val as string);
                                    setPromotionForm({ ...promotionForm, department: '' });
                                }}
                                options={HIERARCHY.flatMap(group =>
                                    group.children.map(child => ({
                                        value: child.title,
                                        label: `${group.title} > ${child.title}`
                                    }))
                                )}
                                placeholder="Grup seçiniz..."
                            />
                        </FormField>
                        {selectedParentDept && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                                <FormField label="Yeni Birim / Servis">
                                    <CustomSelect
                                        value={promotionForm.department}
                                        onChange={val => setPromotionForm({ ...promotionForm, department: val as string })}
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
                                                const child = group.children.find(c => c.title === selectedParentDept);
                                                if (child && 'children' in child) {
                                                    return flatten((child as { children: any[] }).children);
                                                }
                                            }
                                            return DEPARTMENTS.map(d => ({ value: d, label: d }));
                                        })()}
                                        placeholder="Birim seçiniz..."
                                    />
                                </FormField>
                            </div>
                        )}
                    </div>
                )}
                <FormField label="Yeni Ünvan">
                    <CustomSelect
                        value={promotionForm.title}
                        onChange={val => setPromotionForm({ ...promotionForm, title: val as string })}
                        options={TITLES.map(t => ({ value: t, label: t }))}
                    />
                </FormField>
                <FormTextarea
                    label="Notlar"
                    className="min-h-[80px]"
                    value={promotionForm.notes}
                    onChange={e => setPromotionForm({ ...promotionForm, notes: e.target.value })}
                />
            </form>
        </Modal>
    );
}
