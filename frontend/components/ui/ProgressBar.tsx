import React from 'react';

export interface ProgressBarProps {
    value: number; // 0 to 100
    colorClass?: string; // e.g. 'bg-emerald-500'
    trackClass?: string; // e.g. 'bg-slate-100'
    showLabel?: boolean;
    labelFormat?: (val: number) => string;
    height?: string; // e.g. 'h-2'
    className?: string;
}

export default function ProgressBar({
    value,
    colorClass = 'bg-primary-500',
    trackClass = 'bg-slate-100',
    showLabel = true,
    labelFormat = (val) => `%${val}`,
    height = 'h-2',
    className = ''
}: ProgressBarProps) {
    const safeValue = Math.max(0, Math.min(100, value));
    
    return (
        <div className={`flex items-center gap-2.5 w-full ${className}`}>
            <div className={`flex-1 ${height} ${trackClass} rounded-full overflow-hidden shadow-inner`}>
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
                    style={{ width: `${safeValue}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-bold text-slate-600 w-8 text-right shrink-0">
                    {labelFormat(safeValue)}
                </span>
            )}
        </div>
    );
}
