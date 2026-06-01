import React, { useState } from 'react';
import { Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/audit-utils';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';

interface PendingItem {
    id: string;
    code: string;
    title?: string;
    deletionReason: string;
    deletionComment?: string;
    type: 'Audit' | 'Finding';
}

interface PendingDeletionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: PendingItem[];
    onApprove: (id: string, type: 'Audit' | 'Finding') => void;
    onReject: (id: string, type: 'Audit' | 'Finding') => void;
}

export default function PendingDeletionsModal({ isOpen, onClose, items, onApprove, onReject }: PendingDeletionsModalProps) {
    if (!items || items.length === 0) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Silinme Onayı Bekleyen Kayıtlar"
            size="lg"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose}>Kapat</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-orange-50 p-3 rounded-lg flex items-start gap-3 text-orange-800 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>Aşağıdaki kayıtlar silinmek üzere işaretlenmiştir. İşlemi onaylarsanız kayıtlar "Silinen Kayıtlar" arşivine taşınacaktır. Reddederseniz kayıtlar normal duruma dönecektir.</p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {items.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`badge ${item.type === 'Audit' ? 'badge-blue' : 'badge-orange'}`}>
                                            {item.type === 'Audit' ? 'Denetim' : 'Bulgu'}
                                        </span>
                                        <span className="font-mono text-xs text-gray-500">{item.code}</span>
                                    </div>
                                    <Tooltip content={item.title || item.code}>
                                        <h4 className="font-medium text-gray-900 mb-2 truncate max-w-[400px]">
                                            {item.title || item.code}
                                        </h4>
                                    </Tooltip>

                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                                        <p><span className="font-semibold">Gerekçe:</span> {item.deletionReason}</p>
                                        {item.deletionComment && (
                                            <p className="mt-1"><span className="font-semibold">Açıklama:</span> {item.deletionComment}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0 w-[120px]">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onApprove(item.id, item.type)}
                                        className="w-full justify-center text-green-600 border-green-200 hover:bg-green-50"
                                    >
                                        Onayla
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => onReject(item.id, item.type)}
                                        className="w-full justify-center"
                                    >
                                        Reddet
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
