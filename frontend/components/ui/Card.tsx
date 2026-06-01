import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx("p-5 border-b border-slate-100/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: CardProps) {
    return (
        <h3 className={clsx("text-lg font-bold text-slate-800 leading-none", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx("p-5", className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: CardProps) {
    return (
        <div className={clsx("p-5 border-t border-slate-100/80 flex items-center bg-slate-50/30", className)} {...props}>
            {children}
        </div>
    );
}
