import React from 'react';
import OverflowTooltip from './OverflowTooltip';

interface UserCellProps {
    name?: string;
    title?: string;
    avatarUrl?: string;
    className?: string;
}

const UserCell: React.FC<UserCellProps> = ({
    name = '-',
    title,
    avatarUrl,
    className = ''
}) => {
    // Generate initial for avatar (up to 2 characters)
    const initial = name && name !== '-' 
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
        : '?';

    return (
        <div className={`flex items-center gap-3 py-1 ${className}`}>
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold tracking-tighter shadow-inner overflow-hidden shrink-0">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    initial
                )}
            </div>
            <div className="flex flex-col items-start min-w-0">
                <OverflowTooltip content={String(name || '-')} className="font-bold text-gray-900 truncate max-w-[200px]">
                    {String(name || '-')}
                </OverflowTooltip>
                {title && (
                    <OverflowTooltip content={String(title)} className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                        {String(title)}
                    </OverflowTooltip>
                )}
            </div>
        </div>
    );
};

export default UserCell;
