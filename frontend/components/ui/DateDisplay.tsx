import React from 'react';
import { Calendar } from 'lucide-react';

interface DateDisplayProps {
    date: string | Date | null | undefined;
    endDate?: string | Date | null | undefined;
    showIcon?: boolean;
    className?: string;
    iconSize?: number;
    format?: Intl.DateTimeFormatOptions;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
    date,
    endDate,
    showIcon = true,
    className = '',
    iconSize = 14,
    format = { day: '2-digit', month: '2-digit', year: 'numeric' }
}) => {
    if (!date) return <span className="text-gray-400">-</span>;

    const formatDate = (d: string | Date) => {
        try {
            const date = new Date(d);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('tr-TR', format);
        } catch (e) {
            return '-';
        }
    };

    const dateStr = formatDate(date);
    const endDateStr = endDate ? formatDate(endDate) : null;
    const finalStr = endDateStr ? `${dateStr} - ${endDateStr}` : dateStr;

    return (
        <div className={`flex items-center gap-2 text-gray-600 ${className}`}>
            {showIcon && <Calendar size={iconSize} className="text-gray-400 shrink-0" />}
            <span className="whitespace-nowrap font-medium text-sm">{finalStr}</span>
        </div>
    );
};
