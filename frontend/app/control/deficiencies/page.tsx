'use client';

import React from 'react';
import ControlDeficienciesSection from '@/components/control/ControlDeficienciesSection';
import RequireRole from '@/components/auth/RequireRole';

function ControlDeficienciesPageContent() {
    return (
        <div className="space-y-6">
            <ControlDeficienciesSection />
        </div>
    );
}

export default function ControlDeficienciesPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'CONTROL_ADMIN', 'CONTROL_OFFICER', 'CONTROL_MANAGER', 'SUPER_ADMIN']}>
            <ControlDeficienciesPageContent />
        </RequireRole>
    );
}
