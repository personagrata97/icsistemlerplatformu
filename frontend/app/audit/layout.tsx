'use client';
import { ToastProvider } from '@/components/Toast';
import SharedAuditLayout from '@/components/audit/AuditLayout';
import '@/app/audit/audit-globals.css';
import { usePathname } from 'next/navigation';

export default function AuditLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();

    return (
        <ToastProvider>
            <SharedAuditLayout>
                {children}
            </SharedAuditLayout>
        </ToastProvider>
    )
}


