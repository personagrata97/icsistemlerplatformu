import React from 'react';
import { clsx } from 'clsx';

export interface InfoRowProps {
    label: string | React.ReactNode;
    value: string | React.ReactNode;
    direction?: 'horizontal' | 'vertical';
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
}

export default function InfoRow({ 
    label, 
    value, 
    direction = 'horizontal', 
    className,
    labelClassName,
    valueClassName
}: InfoRowProps) {
    const isHorizontal = direction === 'horizontal';

    return (
        <div className={clsx(
            'flex',
            isHorizontal ? 'flex-row justify-between items-center py-2 border-b border-dashed border-slate-100 last:border-0' : 'flex-col items-start gap-1 py-2',
            className
        )}>
            <div className={clsx('text-slate-500 text-xs font-medium uppercase tracking-wider', labelClassName)}>
                {label}
            </div>
            <div className={clsx('text-slate-900 font-semibold', isHorizontal ? 'text-right text-sm' : 'text-sm', valueClassName)}>
                {value || '-'}
            </div>
        </div>
    );
}
