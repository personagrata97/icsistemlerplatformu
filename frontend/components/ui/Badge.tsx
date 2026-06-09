import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'primary' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    children: React.ReactNode;
}

export default function Badge({ variant = 'gray', size = 'md', className, children, ...props }: BadgeProps) {
    const baseClasses = 'inline-flex items-center justify-center font-bold rounded-full border transition-colors whitespace-nowrap';

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
    };

    const variantClasses = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        gray: 'bg-slate-50 text-slate-700 border-slate-200',
        primary: 'bg-primary/10 text-primary border-primary/20',
        outline: 'bg-transparent text-slate-600 border-slate-300'
    };

    return (
        <span className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)} {...props}>
            {children}
        </span>
    );
}
