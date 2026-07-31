import React from 'react';
import Badge from './Badge';

export interface UnitBadgeProps {
    name?: string;
    type?: string;
    code?: string;
    className?: string;
}

export const UnitBadge: React.FC<UnitBadgeProps> = ({ name, type, code, className = '' }) => {
    if (!name || name === '-') return <span className="text-gray-400">-</span>;

    return (
        <div className={`flex flex-col items-start gap-1 ${className}`}>
            <div className="font-medium text-slate-800 text-sm leading-tight">{name}</div>
            {(type || code) && (
                <div className="flex items-center gap-1.5">
                    {type && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                            {type}
                        </Badge>
                    )}
                    {code && (
                        <span className="text-xs text-slate-500 font-mono">{code}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default UnitBadge;
