import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { UserPlus, ShieldCheck } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import Button from '@/components/ui/Button';

import Switch from '@/components/ui/Switch';

interface AssignEthicsAdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string | null;
    currentAssigneeId?: string | null;
    onAssign: () => void;
}

export default function AssignEthicsAdvisorModal({
    isOpen,
    onClose,
    reportId,
    currentAssigneeId,
    onAssign
}: AssignEthicsAdvisorModalProps) {
    const { showToast } = useToast();
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [justification, setJustification] = useState('');
    const [conflictDeclared, setConflictDeclared] = useState(false);
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadStaff();
            if (currentAssigneeId) setAssigneeIds([currentAssigneeId]);
            setJustification('');
            setConflictDeclared(false);
        }
    }, [isOpen, currentAssigneeId]);

    const loadStaff = async () => {
        try {
            const data = await auditApi.getStaff();
            setStaff(data);
        } catch (error) {
            console.error('Personel listesi yüklenemedi', error);
        }
    };

    const handleAssign = async () => {
        if (!reportId || assigneeIds.length === 0) return;

        // If reassignment (currentAssigneeId exists and is differentiating), require justification
        const isReassignment = currentAssigneeId && !assigneeIds.includes(currentAssigneeId);
        if (isReassignment && !justification.trim()) {
            showToast('Lütfen görev değişikliği sebebini (gerekçe) belirtiniz.', 'warning');
            return;
        }

        try {
            setLoading(true);
            await auditApi.assignEthicsReport(reportId, assigneeIds[0], false, justification);
            showToast('Atama başarıyla tamamlandı', 'success');
            onAssign();
            onClose();
        } catch (error) {
            console.error('Atama hatası', error);
            showToast('Atama yapılırken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl shadow-sm">
                        <UserPlus size={20} />
                    </div>
                    <span>İnceleme Sorumlusu Atama</span>
                </div>
            }
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button onClick={onClose} variant="secondary">
                        İptal
                    </Button>
                    <Button
                        onClick={handleAssign}
                        isLoading={loading}
                        disabled={assigneeIds.length === 0}
                        className="px-6"
                    >
                        Atamayı Tamamla
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-800">
                        Bu bildirimi incelemek üzere bir Kurul Üyesi görevlendiriniz. Atanan kişi bildirim detaylarına erişebilecektir.
                    </p>
                </div>

                <div className="space-y-4">
                    <CustomSelect
                        label="Sorumlu Kişi / Kurul *"
                        value={assigneeIds}
                        onChange={(v) => setAssigneeIds(v as string[])}
                        options={staff.map(s => ({
                            value: s.id,
                            label: s.name,
                            subtitle: s.title || 'Denetçi'
                        }))}
                        placeholder="Kişi veya kurul üyelerini seçiniz..."
                        showSearch
                        isMulti
                        checkAllOption
                    />

                    {currentAssigneeId && !assigneeIds.includes(currentAssigneeId) && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Değişiklik Gerekçesi *
                            </label>
                            <textarea
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder="Görevi neden devrettiğinizi/değiştirdiğinizi açıklayınız..."
                                className="form-input w-full h-20 resize-none text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Eski sorumlu bu bildirime erişimini kaybedecektir.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
