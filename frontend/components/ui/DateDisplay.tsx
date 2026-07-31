import React from 'react';
import { Calendar } from 'lucide-react';

export type DateFormatOption = 'date' | 'datetime' | 'relative' | Intl.DateTimeFormatOptions;

export interface DateDisplayProps {
    date: string | Date | number | null | undefined;
    endDate?: string | Date | number | null | undefined;
    showIcon?: boolean;
    className?: string;
    iconSize?: number;
    format?: DateFormatOption;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
    date,
    endDate,
    showIcon = true,
    className = '',
    iconSize = 14,
    format = 'date',
}) => {
    if (!date) return <span className={`text-slate-400 font-mono ${className}`}>-</span>;

    const formatDateValue = (d: string | Date | number): string => {
        try {
            const dateObj = new Date(d);
            if (isNaN(dateObj.getTime())) return '-';

            if (format === 'datetime') {
                const dateStr = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                return `${dateStr} ${timeStr}`;
            }

            if (format === 'relative') {
                const now = new Date();
                const diffMs = now.getTime() - dateObj.getTime();
                const diffSec = Math.floor(diffMs / 1000);
                const diffMin = Math.floor(diffSec / 60);
                const diffHour = Math.floor(diffMin / 60);
                const diffDay = Math.floor(diffHour / 24);

                if (diffSec < 60) return 'Şimdi';
                if (diffMin < 60) return `${diffMin} dakika önce`;
                if (diffHour < 24) return `${diffHour} saat önce`;
                if (diffDay < 30) return `${diffDay} gün önce`;
                return dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }

            if (format === 'date' || typeof format === 'string') {
                return dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }

            // Custom Intl options
            return dateObj.toLocaleDateString('tr-TR', format);
        } catch (e) {
            return '-';
        }
    };

    const dateStr = formatDateValue(date);
    if (dateStr === '-') return <span className={`text-slate-400 font-mono ${className}`}>-</span>;

    const endDateStr = endDate ? formatDateValue(endDate) : null;
    const finalStr = endDateStr && endDateStr !== '-' ? `${dateStr} - ${endDateStr}` : dateStr;

    return (
        <div className={`flex items-center gap-1.5 text-slate-600 ${className}`}>
            {showIcon && <Calendar size={iconSize} className="text-slate-400 shrink-0" />}
            <span className="whitespace-nowrap font-medium text-sm">{finalStr}</span>
        </div>
    );
};

export default DateDisplay;
