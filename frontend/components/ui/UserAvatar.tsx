import React from 'react';

type UserAvatarProps = {
    user?: any;
    name?: string;
    role?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showRole?: boolean;
    className?: string;
};

const UserAvatar: React.FC<UserAvatarProps> = ({ user, name, role, size = 'md', showRole = false, className = '' }) => {
    const displayName = name || user?.displayName || user?.user?.displayName || user?.firstName || 'Bilinmiyor';
    const displayRole = role || user?.title || user?.role || user?.user?.title || '';

    // İsimden baş harfleri alma
    const getInitials = (fullName: string) => {
        if (!fullName || fullName === 'Bilinmiyor') return '?';
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-base',
        xl: 'w-24 h-24 text-2xl'
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 border border-indigo-200 shadow-sm`}>
                {getInitials(displayName)}
            </div>
            {showRole && (
                <div className="flex flex-col justify-center">
                    <span className="font-semibold text-gray-800 text-sm leading-tight">{displayName}</span>
                    {displayRole && <span className="text-xs text-gray-500 leading-tight">{displayRole}</span>}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;
