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
    className = ''
}) => {
    // Generate initial for avatar
    const initial = name && name !== '-' ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-200">
                {initial}
            </div>
            <div className="flex flex-col items-start overflow-hidden w-[150px]">
                <OverflowTooltip content={String(name || '-')} className="text-sm font-semibold text-gray-800">
                    {String(name || '-')}
                </OverflowTooltip>
                {title && (
                    <OverflowTooltip content={String(title)} className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                        {String(title)}
                    </OverflowTooltip>
                )}
            </div>
        </div>
    );
};

export default UserCell;
