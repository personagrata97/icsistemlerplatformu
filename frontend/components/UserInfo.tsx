'use client';

import { useAuth } from '@/context/AuthContext';

export default function UserInfo() {
    const { user } = useAuth();
    return (
        <>
            <div className="text-sm font-semibold text-gray-900">{user?.displayName || 'Kullanıcı'}</div>
            <div className="text-xs text-gray-500">{user?.roles?.[0] || 'Kullanıcı'}</div>
        </>
    );
}
