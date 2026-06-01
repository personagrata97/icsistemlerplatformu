import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
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
                    <div className="form-group">
                        <label className="form-label">İşlem Tipi</label>
                        <CustomSelect
                            value={promotionForm.type}
                            onChange={val => setPromotionForm({ ...promotionForm, type: val as string })}
                            options={[
                                { value: 'Terfi', label: 'Terfi' },
                                { value: 'Atama', label: 'Atama' },
                                { value: 'Geçici Görevlendirme', label: 'Geçici Görevlendirme' }
                            ]}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tarih</label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={promotionForm.promotionDate} 
                            onChange={e => setPromotionForm({ ...promotionForm, promotionDate: e.target.value })} 
                            required={true} 
                        />
                    </div>
                </div>
                {(promotionForm.type === 'Atama' || promotionForm.type === 'Geçici Görevlendirme') && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="form-group">
                            <label className="form-label">Yeni Üst Birim / Grup</label>
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
                        </div>
                        {selectedParentDept && (
                            <div className="form-group animate-in fade-in slide-in-from-top-1">
                                <label className="form-label">Yeni Birim / Servis</label>
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
                            </div>
                        )}
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">Yeni Ünvan</label>
                    <CustomSelect
                        value={promotionForm.title}
                        onChange={val => setPromotionForm({ ...promotionForm, title: val as string })}
                        options={TITLES.map(t => ({ value: t, label: t }))}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Notlar</label>
                    <textarea 
                        className="form-input min-h-[80px]" 
                        value={promotionForm.notes} 
                        onChange={e => setPromotionForm({ ...promotionForm, notes: e.target.value })} 
                    />
                </div>
            </form>
        </Modal>
    );
}
