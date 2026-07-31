import React from 'react';

export interface PercentTextProps {
    value?: number | null;
    decimals?: number;
    showBar?: boolean;
    thresholds?: { good: number; warn: number };
    className?: string;
}

export const PercentText: React.FC<PercentTextProps> = ({
    value,
    decimals = 1,
    showBar = false,
    thresholds,
    className = ''
}) => {
    if (value === undefined || value === null) return <span className="text-gray-400">-</span>;

    let colorClass = 'text-slate-700';
    let barColorClass = 'bg-primary';

    if (thresholds) {
        if (value >= thresholds.good) {
            colorClass = 'text-emerald-600 font-medium';
            barColorClass = 'bg-emerald-500';
        } else if (value >= thresholds.warn) {
            colorClass = 'text-amber-600 font-medium';
            barColorClass = 'bg-amber-500';
        } else {
            colorClass = 'text-rose-600 font-medium';
            barColorClass = 'bg-rose-500';
        }
    }

    const formattedValue = `%${value.toFixed(decimals)}`;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={colorClass}>{formattedValue}</span>
            {showBar && (
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div
                        className={`h-full ${barColorClass} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default PercentText;
