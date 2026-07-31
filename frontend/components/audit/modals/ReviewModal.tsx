import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { History as HistoryIcon, AlertTriangle } from 'lucide-react';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import FormTextarea from '@/components/ui/FormTextarea';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (notes: string) => void;
    finding: any; // Using any for flexibility, ideally should be Finding type
    initialNotes?: string;
}

export default function ReviewModal({
    isOpen,
    onClose,
    onConfirm,
    finding,
    initialNotes = ''
}: ReviewModalProps) {
    const [notes, setNotes] = useState(initialNotes);

    const handleConfirm = () => {
        onConfirm(notes);
        setNotes(''); // Reset after confirm
    };

    if (!finding) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-red-700">
                    <HistoryIcon size={24} />
                    <span>Revizyon Talebi</span>
                </div>
            }
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose}>
                        İptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={!notes.trim()}
                        className="px-6"
                    >
                        İade Et ve Revizyon İste
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800 space-y-1 shadow-inner">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-[10px] text-amber-600 mb-1">
                        <AlertTriangle size={12} /> İade Edilen Kayıt Bilgisi
                    </div>
                    <div><strong>Bulgu No:</strong> <CodeBadge code={finding.code} size="sm" variant="secondary" /></div>
                    <div><strong>Bulgu Başlığı:</strong> {finding.title}</div>
                </div>

                <FormTextarea
                    label="Revizyon Notu / Düzeltme Gerekçesi"
                    required
                    rows={4}
                    placeholder="Müfettişin düzeltmesi gereken alanları ve nedenlerini buraya detaylıca yazınız..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </div>
        </Modal>
    );
}
