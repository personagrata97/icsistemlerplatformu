'use client';
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import Tooltip from './ui/Tooltip';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const lastMessage = useRef<{ message: string; time: number } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        // Prevent duplicate messages within 500ms
        const now = Date.now();
        if (lastMessage.current &&
            lastMessage.current.message === message &&
            now - lastMessage.current.time < 500) {
            return;
        }
        lastMessage.current = { message, time: now };

        const id = now;
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <XCircle size={20} />;
            case 'warning': return <AlertCircle size={20} />;
            case 'info': return <Info size={20} />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100001] flex flex-col gap-3 pointer-events-none p-4">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={clsx(
                            "bg-white border-l-4 rounded-lg shadow-xl pl-4 pr-3 py-4 flex items-start gap-4 min-w-[320px] max-w-[420px] pointer-events-auto ring-1 ring-black/5 transform transition-all duration-300 ease-out",
                            toast.type === 'success' ? "border-emerald-500" :
                                toast.type === 'error' ? "border-rose-500" :
                                    toast.type === 'warning' ? "border-amber-500" : "border-blue-500"
                        )}
                        style={{
                            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            willChange: 'transform, opacity'
                        }}
                    >
                        {/* Icon */}
                        <div className={clsx(
                            "mt-0.5 shrink-0",
                            toast.type === 'success' ? "text-emerald-500" :
                                toast.type === 'error' ? "text-rose-500" :
                                    toast.type === 'warning' ? "text-amber-500" : "text-blue-500"
                        )}>
                            {getIcon(toast.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className={clsx(
                                "text-sm font-bold mb-1",
                                toast.type === 'success' ? "text-emerald-900" :
                                    toast.type === 'error' ? "text-rose-900" :
                                        toast.type === 'warning' ? "text-amber-900" : "text-blue-900"
                            )}>
                                {toast.type === 'success' ? 'Başarılı' :
                                    toast.type === 'error' ? 'Hata' :
                                        toast.type === 'warning' ? 'Uyarı' : 'Bilgi'}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                {toast.message}
                            </p>
                        </div>

                        {/* Close Button */}
                        <Tooltip content="Kapat" position="top">
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-gray-400 bg-gray-50 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500/10 shadow-sm"
                                aria-label="Kapat"
                            >
                                <X size={16} />
                            </button>
                        </Tooltip>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
