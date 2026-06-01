import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LoadingStateProps {
    message?: string;
    description?: string;
    fullscreen?: boolean;
    className?: string;
}

export default function LoadingState({
    message,
    description,
    fullscreen = false,
    className = ''
}: LoadingStateProps) {
    // Merkezi ve tutarlı mesaj kullanımı
    const displayMessage = message || 'Yükleniyor...';

    const content = (
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
            {/* Corporate Logo with clean background */}
            <div className="mb-1">
                <img 
                    src="/logo.png" 
                    alt="Emlak Katılım" 
                    className="w-[120px] h-auto mix-blend-multiply" 
                />
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size={fullscreen ? "lg" : "md"} />
                <p className="text-slate-500 font-medium text-sm antialiased">
                    {displayMessage}
                </p>
            </div>
        </div>
    );

    if (fullscreen) {
        return (
            <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl flex items-center justify-center z-[9999] p-6 ${className}`}>
                {content}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-12 w-full min-h-[400px] flex-grow ${className}`}>
            {content}
        </div>
    );
}
