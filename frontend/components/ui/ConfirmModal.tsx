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
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isLoading?: boolean;
    requireReason?: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    onReasonChange?: (val: string) => void;
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
    type,
    variant = 'danger',
    isLoading = false,
    requireReason = false,
    reasonLabel = 'Gerekçe (Zorunlu)',
    reasonPlaceholder = 'Lütfen gerekçenizi giriniz...',
    onReasonChange,
    children
}: ConfirmModalProps) {
    const modalType = type || variant;
    const isDanger = modalType === 'danger';
    const isWarning = modalType === 'warning';
    const isSuccess = modalType === 'success';

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
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDanger ? 'danger' : 'primary'}
                        className="flex-1"
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText.toLowerCase().startsWith('evet') ? confirmText : `Evet, ${confirmText}`}
                    </Button>
                </div>
            }
        >
            <div className="text-center py-2">
                <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 ${colors.icon}`}>
                    {getIcon()}
                </div>
                {message && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {message}
                    </p>
                )}
                {requireReason && (
                    <div className="text-left mb-4">
                        <label className="form-label mb-1 block text-xs font-semibold text-gray-700">
                            {reasonLabel}
                        </label>
                        <textarea
                            className="form-input text-xs w-full"
                            rows={3}
                            placeholder={reasonPlaceholder}
                            onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
                        />
                    </div>
                )}
                {children}
            </div>
        </Modal>
    );
}
