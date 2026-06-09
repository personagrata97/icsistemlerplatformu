'use client';

import { ToastProvider } from '@/components/Toast';
import PortalLayoutComponent from '@/components/portal/PortalLayout';
import AuditronChat from '@/components/AuditronChat';
import { AuditTitleProvider } from '@/context/AuditTitleContext';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ToastProvider>
            <AuditTitleProvider>
                <PortalLayoutComponent>
                    {children}
                    <AuditronChat />
                </PortalLayoutComponent>
            </AuditTitleProvider>
        </ToastProvider>
    )
}
