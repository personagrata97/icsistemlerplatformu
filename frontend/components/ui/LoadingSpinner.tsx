'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
    fullPage?: boolean;
    showLogo?: boolean;
}

export default function LoadingSpinner({
    size = 'md',
    className = '',
    text,
    fullPage = false,
    showLogo = false
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-5 w-5 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
        xl: 'h-16 w-16 border-4'
    }[size];

    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            {showLogo && (size === 'lg' || size === 'xl') && (
                <div className="mb-2 animate-pulse">
                    <img src="/logo.png" alt="Logo" className={`${size === 'xl' ? 'h-12' : 'h-8'} object-contain mix-blend-multiply`} />
                </div>
            )}
            <div
                className={`animate-spin rounded-full border-primary/30 border-t-primary ${sizeClasses}`}
                role="status"
                aria-label="Yükleniyor"
            />
            {text && (
                <p className="text-sm text-gray-500 font-bold tracking-tight animate-pulse uppercase">{text}</p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}
