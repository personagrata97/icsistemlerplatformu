import React from 'react';
import { Trash2, AlertCircle, Info, RotateCcw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    children?: React.ReactNode;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Onay Gerekli',
    message = 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?',
    confirmText = 'Onayla',
    cancelText = 'İptal',
    type = 'danger',
    children
}: ConfirmModalProps) {

    const isDanger = type === 'danger';
    const isWarning = type === 'warning';
    const isSuccess = type === 'success';

    const getColors = () => {
        if (isDanger) return { icon: 'bg-red-50 text-red-600', btn: 'btn-danger' };
        if (isWarning) return { icon: 'bg-amber-50 text-amber-600', btn: 'btn-warning' };
        if (isSuccess) return { icon: 'bg-primary/10 text-primary', btn: 'btn-primary' };
        return { icon: 'bg-blue-50 text-blue-600', btn: 'btn-primary' };
    };

    const colors = getColors();

    const getIcon = () => {
        if (isDanger) return <Trash2 size={32} strokeWidth={1.5} />;
        if (isWarning) return <AlertCircle size={32} strokeWidth={1.5} />;
        if (isSuccess) return <RotateCcw size={32} strokeWidth={1.5} />;
        return <Info size={32} strokeWidth={1.5} />;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex gap-2 w-full">
                    <Button
                        variant="secondary"
                        type="button"
                        className="flex-1"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDanger ? 'danger' : isWarning ? 'primary' : 'primary'}
                        className="flex-1"
                        onClick={onConfirm}
                    >
                        {confirmText.toLowerCase().startsWith('evet') ? confirmText : `Evet, ${confirmText}`}
                    </Button>
                </div>
            }
        >
            <div className="text-center py-4">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${colors.icon}`}>
                    {getIcon()}
                </div>
                {message && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {message}
                    </p>
                )}
                {children}
            </div>
        </Modal>
    );
}
