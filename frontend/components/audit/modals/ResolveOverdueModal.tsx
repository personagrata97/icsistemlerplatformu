import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, CheckCircle, X, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Education {
    id: string;
    title: string;
    // other fields if needed for display
}

interface ResolveOverdueModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Education | null;
    onResolve: (action: 'complete' | 'cancel' | 'postpone', date?: string) => void;
}

export default function ResolveOverdueModal({
    isOpen,
    onClose,
    item,
    onResolve
}: ResolveOverdueModalProps) {
    const [postponeDate, setPostponeDate] = useState('');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    if (!isOpen || !item) return null;

    const handlePostpone = () => {
        if (!postponeDate) return;
        onResolve('postpone', postponeDate);
        setPostponeDate('');
    };

    const handleCancelClick = () => {
        setShowCancelConfirm(true);
    };

    const confirmCancel = () => {
        onResolve('cancel');
        setShowCancelConfirm(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={24} />
                    <span>Eğitim Süresi Geçmiş!</span>
                </div>
            }
            size="md"
        >
            <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                    <p className="text-sm text-red-700">
                        <span className="font-bold">"{item.title}"</span> eğitimi planlanan tarihte tamamlanmamış.
                    </p>
                </div>

                {showCancelConfirm ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center p-4">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X size={32} />
                            </div>
                            <h4 className="font-bold text-gray-800 text-lg mb-2">Eğitimi İptal Et?</h4>
                            <p className="text-gray-600 text-sm mb-6">
                                Bu eğitimi iptal etmek istediğinize emin misiniz? Bu işlem geri alınabilir ancak eğitim takvimden kaldırılacaktır.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowCancelConfirm(false)}
                                    variant="secondary"
                                    className="flex-1 h-11"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    onClick={confirmCancel}
                                    variant="danger"
                                    className="flex-1 h-11"
                                >
                                    Evet, İptal Et
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 text-sm font-medium">Bu eğitim için ne yapmak istersiniz?</p>

                        <div className="space-y-3">
                            {/* Complete Option */}
                            <Button
                                onClick={() => onResolve('complete')}
                                variant="secondary"
                                className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 group transition-all h-auto"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="text-left font-normal">
                                        <span className="font-bold text-gray-800 group-hover:text-green-700 block">Eğitim Tamamlandı</span>
                                        <span className="text-xs text-gray-500">Kaydet ve kapat</span>
                                    </div>
                                </div>
                            </Button>

                            {/* Cancel Option */}
                            <Button
                                onClick={handleCancelClick}
                                variant="secondary"
                                className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-gray-500 hover:bg-gray-50 group transition-all h-auto"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        <X size={20} />
                                    </div>
                                    <div className="text-left font-normal">
                                        <span className="font-bold text-gray-800 block">Eğitim İptal Edildi</span>
                                        <span className="text-xs text-gray-500">İptal statüsüne al</span>
                                    </div>
                                </div>
                            </Button>

                            {/* Postpone Option */}
                            <div className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all bg-white hover:shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-800 block">Ertele</span>
                                        <span className="text-xs text-gray-500">Yeni bir tarih belirle</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="date"
                                        className="form-input w-full h-11"
                                        value={postponeDate}
                                        onChange={(e) => setPostponeDate(e.target.value)}
                                    />
                                    <Button
                                        onClick={handlePostpone}
                                        disabled={!postponeDate}
                                        variant="primary"
                                        className="w-full h-11 text-base font-medium shadow-md disabled:opacity-50 disabled:shadow-none transition-all"
                                    >
                                        Ertele
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
