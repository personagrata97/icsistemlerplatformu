'use client';

import React from 'react';
import ControlTestingSection from '@/components/control/ControlTestingSection';
import RequireRole from '@/components/auth/RequireRole';

function ControlTestingPageContent() {
    return (
        <div className="space-y-6">
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
