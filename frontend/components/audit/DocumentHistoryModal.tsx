import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, FileText, Download, Check } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import { formatDateTime } from '@/lib/audit-utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ConfirmModal';
import Timeline, { TimelineEvent } from '@/components/ui/Timeline';

interface DocumentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    docId: string;
    docName: string;
    onRestore: () => void;
}

interface HistoryRecord {
    id: string;
    version: number;
    fileName: string;
    uploadedBy: string;
    uploadedAt: string;
    changeReason?: string;
    fileSize: number;
}

export default function DocumentHistoryModal({ isOpen, onClose, docId, docName, onRestore }: DocumentHistoryModalProps) {
    const { showToast } = useToast();
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [restoreConfirm, setRestoreConfirm] = useState<{ id: string, version: number } | null>(null);

    useEffect(() => {
        if (isOpen && docId) {
            loadHistory();
        }
    }, [isOpen, docId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getDocumentHistory(docId);
            setHistory(data);
        } catch (error) {
            console.error('History load error:', error);
            showToast('Geçmiş yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmRestore = async () => {
        if (!restoreConfirm) return;
        
        const { id: versionId, version } = restoreConfirm;
        setRestoringId(versionId);
        setRestoreConfirm(null);
        
        try {
            await auditApi.restoreDocumentVersion(docId, versionId);
            showToast(`Belge v${version} sürümüne geri döndürüldü`, 'success');
            onRestore(); // Parent list refresh
            loadHistory(); // Reload to see the new restored entry
        } catch (error) {
            console.error('Restore error:', error);
            showToast('Geri yükleme başarısız', 'error');
        } finally {
            setRestoringId(null);
        }
    };

    const handleRestore = (versionId: string, version: number) => {
        setRestoreConfirm({ id: versionId, version });
    };

    if (!isOpen) return null;

    const footer = (
        <div className="flex justify-end w-full">
            <Button
                variant="secondary"
                onClick={onClose}
            >
                Kapat
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Clock size={20} className="text-primary" />
                    <span>Versiyon Geçmişi</span>
                </div>
            }
            size="md"
            footer={footer}
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-500 break-all bg-gray-50 p-3 rounded-lg border border-gray-100">
                    Doküman: <strong className="text-gray-700">{docName}</strong>
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="mt-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <Timeline 
                            events={history.map((record) => ({
                                id: record.id,
                                timestamp: formatDateTime(record.uploadedAt),
                                user: record.uploadedBy,
                                title: `${record.fileName} (v${record.version})`,
                                actionType: record.version === 1 ? 'create' : 'update',
                                description: (
                                    <div className="flex flex-col gap-2">
                                        {record.changeReason && (
                                            <p className="text-sm text-slate-700 italic border-l-2 border-primary/30 pl-2 py-0.5">
                                                "{record.changeReason}"
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                                {(record.fileSize / 1024).toFixed(1)} KB
                                            </span>
                                            <button
                                                title="Bu versiyona geri dön"
                                                onClick={() => handleRestore(record.id, record.version)}
                                                className="text-primary hover:bg-primary/5 px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-primary/20"
                                                disabled={restoringId === record.id}
                                                type="button"
                                            >
                                                {restoringId === record.id ? (
                                                    <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                                                ) : (
                                                    <RotateCcw size={12} />
                                                )}
                                                Geri Dön
                                            </button>
                                        </div>
                                    </div>
                                )
                            }))}
                            emptyStateMessage="Bu dokümanın versiyon geçmişi bulunmamaktadır."
                        />
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!restoreConfirm}
                onClose={() => setRestoreConfirm(null)}
                onConfirm={confirmRestore}
                title="Versiyonu Geri Yükle"
                message={`Dokümanı v${restoreConfirm?.version} sürümüne geri döndürmek istediğinize emin misiniz? Güncel versiyon arşivlenecektir.`}
                confirmText="Evet, Geri Al"
                cancelText="İptal"
                type="warning"
            />
        </Modal>
    );
}
