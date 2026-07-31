'use client';
import PageHeader from '@/components/ui/PageHeader';

import React from 'react';
import ControlTestingSection from '@/components/control/ControlTestingSection';
import RequireRole from '@/components/auth/RequireRole';

function ControlTestingPageContent() {
    return (
        <div className="space-y-6">
            <PageHeader title="Kontrol Testleri & Saha" subtitle="Tasarım ve işletim etkinlik testlerinin yürütülmesi, kanıt toplanması ve değerlendirilmesi" />
            <ControlTestingSection />
        </div>
    );
}

export default function ControlTestingPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'CONTROL_ADMIN', 'CONTROL_OFFICER', 'CONTROL_MANAGER', 'SUPER_ADMIN']}>
            <ControlTestingPageContent />
        </RequireRole>
    );
}
