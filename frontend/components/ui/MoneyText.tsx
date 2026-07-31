import React from 'react';

export interface MoneyTextProps {
    value?: number | string | null;
    currency?: string;
    showSign?: boolean;
    compact?: boolean;
    className?: string;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
    value,
    currency = 'TRY',
    showSign = false,
    compact = false,
    className = '',
}) => {
    if (value === null || value === undefined || value === '') {
        return <span className={`text-slate-400 font-mono ${className}`}>-</span>;
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return <span className={`text-slate-400 font-mono ${className}`}>-</span>;
    }

    const isNegative = numValue < 0;
    const absValue = Math.abs(numValue);

    const getSymbol = (curr: string) => {
        switch (curr.toUpperCase()) {
            case 'TRY':
            case 'TL':
                return '₺';
            case 'USD':
                return '$';
            case 'EUR':
                return '€';
            case 'GBP':
                return '£';
            default:
                return curr;
        }
    };

    const currencySymbol = getSymbol(currency);

    let formattedValue = '';
    if (compact) {
        if (absValue >= 1_000_000_000) {
            formattedValue = (numValue / 1_000_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Milyar';
        } else if (absValue >= 1_000_000) {
            formattedValue = (numValue / 1_000_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Mn';
        } else if (absValue >= 1_000) {
            formattedValue = (numValue / 1_000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' B';
        } else {
            formattedValue = numValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    } else {
        formattedValue = absValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const sign = isNegative ? '-' : (showSign && numValue > 0 ? '+' : '');

    return (
        <span
            className={`font-mono text-right inline-block whitespace-nowrap ${
                isNegative ? 'text-red-600 font-semibold' : 'text-slate-900'
            } ${className}`}
        >
            {sign}{formattedValue} {currencySymbol}
        </span>
    );
};

export default MoneyText;
