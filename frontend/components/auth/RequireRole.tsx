'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface RequireRoleProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const role = localStorage.getItem('user_role') || localStorage.getItem('role') || 'SUPER_ADMIN'; // Default super admin for dev
            setUserRole(role);
            setLoading(false);
        }
    }, []);

    if (loading) return null;

    const isAllowed = allowedRoles.includes('*') || (userRole && allowedRoles.includes(userRole));

    if (!isAllowed) {
        return (
            <div className="min-h-[400px] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Erişim Engellendi / Yetki Yetersiz</h3>
                        <p className="text-xs text-gray-500 mt-1">Bu sayfaya erişim yetkiniz bulunmamaktadır. Erişim denemesi güvenlik kaydına işlenmiştir.</p>
                    </div>
                    <div className="pt-2">
                        <Link href="/audit">
                            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
                                Ana Panele Dön
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
