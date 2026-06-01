import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import Tooltip from './Tooltip';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    className?: string;
    hideCloseButton?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className = '',
    hideCloseButton = false
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !hideCloseButton) onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, hideCloseButton]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
        full: 'max-w-full m-4'
    }[size];

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={!hideCloseButton ? onClose : undefined}
        >
            {/* Modal Overlay / Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={!hideCloseButton ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`
                    relative z-10 w-full bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] 
                    animate-in fade-in zoom-in-95 duration-200
                    ${sizeClasses}
                    ${className}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-xl font-bold text-gray-800 truncate pr-4">
                        {title}
                    </h3>
                    {!hideCloseButton && (
                        <Tooltip content="Kapat" position="top">
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500/10 shadow-sm"
                                aria-label="Kapat"
                            >
                                <X size={20} />
                            </button>
                        </Tooltip>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center shrink-0 rounded-b-xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
