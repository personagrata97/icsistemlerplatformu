import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import FormInput from '@/components/ui/FormInput';
import { AlertCircle } from 'lucide-react';
import { AuditStaff } from '@/lib/audit-api';

interface BulkTrainingForm {
    name: string;
    provider: string;
    startDate: string;
    endDate: string;
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
            <form id="bulk-training-form" onSubmit={onSave} className="space-y-6">
                <div className="flex items-start gap-2 p-3 mb-4 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>Toplu atanan bu eğitim saatleri (CPE), seçili personellerin yıl sonu <strong>CPE Raporu</strong> hesaplamalarına otomatik olarak dahil edilecektir.</p>
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
                        />
                        <FormInput
                            label="Sağlayıcı"
                            type="text"
                            value={bulkTrainingForm.provider}
                            onChange={e => setBulkTrainingForm({ ...bulkTrainingForm, provider: e.target.value })}
                            required={true}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Başlangıç</label>
                                <DatePicker 
                                    value={bulkTrainingForm.startDate} 
                                    onChange={(val) => setBulkTrainingForm({ ...bulkTrainingForm, startDate: val })} 
                                    required={true} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bitiş</label>
                                <DatePicker 
                                    value={bulkTrainingForm.endDate} 
                                    onChange={(val) => setBulkTrainingForm({ ...bulkTrainingForm, endDate: val })} 
                                    required={true} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-l pl-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Katılımcı Seçimi ({bulkTrainingForm.participantIds.length})</h3>
                        <div className="max-h-[300px] overflow-y-auto border rounded-xl divide-y">
                            {staffList.map((member: AuditStaff) => (
                                <label key={member.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <Checkbox
                                        id={`member-${member.id}`}
                                        checked={bulkTrainingForm.participantIds.includes(member.id)}
                                        onChange={checked => {
                                            const ids = checked
                                                ? [...bulkTrainingForm.participantIds, member.id]
                                                : bulkTrainingForm.participantIds.filter(id => id !== member.id);
                                            setBulkTrainingForm({ ...bulkTrainingForm, participantIds: ids });
                                        }}
                                        label={
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                                <div className="text-[11px] text-gray-500">{member.title}</div>
                                            </div>
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
