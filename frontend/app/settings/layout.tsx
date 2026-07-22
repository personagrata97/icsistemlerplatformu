'use client';

import SharedAuditLayout from '@/components/audit/AuditLayout';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <SharedAuditLayout hideSidebar={true}>
            {children}
        </SharedAuditLayout>
    );
}
