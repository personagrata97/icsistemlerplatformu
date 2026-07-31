import React from 'react';
import Badge from './Badge';

export interface DurationTextProps {
    days?: number | null;
    mode?: 'remaining' | 'elapsed' | 'plain';
    className?: string;
}

export const DurationText: React.FC<DurationTextProps> = ({ days, mode = 'plain', className = '' }) => {
    if (days === undefined || days === null) return <span className="text-gray-400">-</span>;

    if (mode === 'plain') {
        return <span className={`text-slate-700 ${className}`}>{days} Gün</span>;
    }

    if (mode === 'remaining') {
        if (days < 0) {
            return (
                <Badge variant="danger" className={`font-medium ${className}`}>
                    {Math.abs(days)} Gün Gecikti
                </Badge>
            );
        }
        if (days <= 7) {
            return (
                <Badge variant="warning" className={`font-medium ${className}`}>
                    {days} Gün Kaldı
                </Badge>
            );
        }
        return <span className={`text-slate-600 ${className}`}>{days} Gün Kaldı</span>;
    }

    if (mode === 'elapsed') {
        return <span className={`text-slate-600 ${className}`}>{days} Gün Geçti</span>;
    }

    return null;
};

export default DurationText;
