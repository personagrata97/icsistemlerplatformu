import { CheckCircle, Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/audit-utils';

interface FollowUpItem {
    id: string;
    action: string;
    findingCode?: string;
    deadline: string;
    remainingDays: number;
    priority: 'Yüksek' | 'Orta' | 'Düşük';
    assignee: string;
    status: 'Açık' | 'Tamamlandı' | 'Gecikmiş';
    notes?: string;
}

interface FollowUpDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: FollowUpItem | null;
    onComplete: (item: FollowUpItem) => void;
    onEdit?: (item: FollowUpItem) => void;
    onDelete?: (id: string) => void;
}

export default function FollowUpDetailModal({ isOpen, onClose, item, onComplete, onEdit, onDelete }: FollowUpDetailModalProps) {
    if (!isOpen || !item) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Takip Detayı"
            footer={
                <div className="flex justify-between w-full">
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button variant="secondary" onClick={() => { onClose(); onEdit(item); }}>Düzenle</Button>
                        )}
                        {onDelete && (
                            <Button variant="danger" onClick={() => { onClose(); onDelete(item.id); }}>Sil</Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Kapat</Button>
                        {item.status !== 'Tamamlandı' && (
                            <Button
                                onClick={() => { onComplete(item); onClose(); }}
                                variant="primary"
                            >
                                Tamamla
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex gap-2">
                    <StatusBadge type="risk" value={item.priority} />
                    <StatusBadge type="status" value={item.status} />
                    {item.status === 'Gecikmiş' && (
                         <div className="px-2 py-0.5 rounded-md text-xs font-medium border bg-red-100 text-red-700 border-red-200">
                             Eskalasyon: Kritik
                         </div>
                    )}
                </div>
                <h4 className="font-semibold text-lg text-slate-800">{item.action}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div><span className="text-gray-500 block text-xs">Sorumlu Birim/Kişi</span> <span className="font-medium">{item.assignee}</span></div>
                    <div><span className="text-gray-500 block text-xs">Son Tarih</span> <span className={`font-medium ${item.status === 'Gecikmiş' ? 'text-red-600' : ''}`}>{formatDate(item.deadline)}</span></div>
                    {item.findingCode && <div><span className="text-gray-500 block text-xs">Bağlı Bulgu</span> <span className="font-medium text-blue-600">{item.findingCode}</span></div>}
                </div>
                
                {item.notes && (
                    <div className="mt-4 border-t pt-4 border-slate-100">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Açıklama / Notlar</label>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                            {item.notes}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
