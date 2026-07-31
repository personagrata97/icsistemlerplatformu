import React from 'react';
import OverflowTooltip from './OverflowTooltip';

export interface UserCellProps {
    name?: string;
    title?: string;
    avatarUrl?: string;
    sicilNo?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export const UserCell: React.FC<UserCellProps> = ({
    name,
    title,
    avatarUrl,
    sicilNo,
    size = 'md',
    className = ''
}) => {
    if (!name || name === '-') {
        return <span className={`text-slate-400 font-mono ${className}`}>-</span>;
    }

    const initials = name
        ? name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    const avatarSizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
    const titleTextSizeClass = size === 'sm' ? 'text-[11px]' : 'text-xs';

    const subtitleText = [title, sicilNo ? `Sicil: ${sicilNo}` : null].filter(Boolean).join(' • ');

    return (
        <div className={`flex items-center gap-2.5 py-0.5 ${className}`}>
            <div className={`${avatarSizeClass} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold tracking-tight shadow-xs overflow-hidden shrink-0`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    initials
                )}
            </div>
            <div className="flex flex-col items-start min-w-0">
                <OverflowTooltip content={name} className="font-semibold text-slate-900 truncate max-w-[220px]">
                    {name}
                </OverflowTooltip>
                {subtitleText && (
                    <OverflowTooltip content={subtitleText} className={`${titleTextSizeClass} text-slate-500 mt-0.5 truncate max-w-[220px]`}>
                        {subtitleText}
                    </OverflowTooltip>
                )}
            </div>
        </div>
    );
};

export const PersonCell = UserCell;
export default UserCell;
