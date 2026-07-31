'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface SectionCardProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    subtitle,
    icon,
    actions,
    children,
    collapsible = false,
    defaultOpen = true,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
        if (collapsible) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className={`bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden ${className}`}>
            <div
                className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${
                    collapsible ? 'cursor-pointer select-none hover:bg-slate-50/50 transition-colors' : ''
                }`}
                onClick={toggleOpen}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {icon && (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 truncate leading-tight">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                    {collapsible && (
                        <button
                            type="button"
                            onClick={toggleOpen}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {(!collapsible || isOpen) && children && (
                <div className="p-6">{children}</div>
            )}
        </div>
    );
};

export default SectionCard;
