import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, FileText, Download, Check } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import { formatDateTime } from '@/lib/audit-utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ConfirmModal';

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
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                        Bu dokümanın versiyon geçmişi bulunmamaktadır.
                    </div>
                ) : (
                    <div className="mt-2 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.map((record) => (
                            <div key={record.id} className="relative flex items-start p-3 border rounded-xl hover:bg-gray-50 transition-colors group">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-blue-50">
                                        v{record.version}
                                    </div>
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-gray-900 truncate pr-2">
                                            {record.fileName}
                                        </p>
                                        <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                            {(record.fileSize / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <span>{formatDateTime(record.uploadedAt)}</span>
                                        <span>•</span>
                                        <span className="font-medium text-gray-700">{record.uploadedBy}</span>
                                    </p>
                                    {record.changeReason && (
                                        <p className="text-xs text-gray-600 mt-2 italic border-l-2 border-blue-200 pl-2 py-0.5 bg-blue-50/50 rounded-r">
                                            "{record.changeReason}"
                                        </p>
                                    )}
                                </div>
                                <div className="ml-3 flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        title="Bu versiyona geri dön"
                                        onClick={() => handleRestore(record.id, record.version)}
                                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center justify-center"
                                        disabled={restoringId === record.id}
                                        type="button"
                                    >
                                        {restoringId === record.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                        ) : (
                                            <RotateCcw size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
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
