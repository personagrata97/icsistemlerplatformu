import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Clock, Calendar } from 'lucide-react';
import CodeBadge from '@/components/ui/CodeBadge';
import { formatDate } from '@/lib/audit-utils';
import Button from '@/components/ui/Button';

interface ExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { requestedDeadline: string; reason: string }) => void;
    finding: any;
}

export default function ExtensionModal({
    isOpen,
    onClose,
    onConfirm,
    finding
}: ExtensionModalProps) {
    const [requestedDeadline, setRequestedDeadline] = useState('');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        onConfirm({ requestedDeadline, reason });
        // Reset form
        setRequestedDeadline('');
        setReason('');
    };

    if (!finding) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-primary">
                    <Clock size={24} />
                    <span>Süre Uzatım Talebi</span>
                </div>
            }
            size="md"
        >
            <div className="space-y-5">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-500">Bulgu:</span>
                        <div className="text-right">
                            <CodeBadge code={finding.code} size="sm" />
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{finding.title}</div>
                        </div>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span className="font-semibold text-gray-500">Mevcut Aksiyon Tarihi:</span>
                        <span className="font-mono font-medium text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {formatDate(finding.dueDate)}
                        </span>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        Yeni İstenen Aksiyon Tarihi
                    </label>
                    <input
                        type="date"
                        className="form-input focus:ring-primary/20 focus:border-primary border-gray-300 rounded-lg w-full p-2.5"
                        value={requestedDeadline}
                        onChange={e => setRequestedDeadline(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label text-gray-700 font-semibold mb-2 block">Uzatma Gerekçesi</label>
                    <textarea
                        className="form-input min-h-[100px] w-full focus:ring-primary/20 focus:border-primary border-gray-300 rounded-lg p-3"
                        placeholder="Gecikme nedenini ve alınan ek önlemleri buraya yazınız..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!requestedDeadline || !reason.trim()}
                        className="px-8"
                    >
                        Talep Gönder
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
