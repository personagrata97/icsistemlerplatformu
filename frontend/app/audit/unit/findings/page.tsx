'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { Suspense } from 'react';
import LoadingState from '@/components/ui/LoadingState';
import FindingsPage from '@/app/audit/findings/page';

function UnitFindingsPageContent() {
    return (
        <Suspense fallback={<LoadingState message="Bulgular ve Aksiyon Takip Yükleniyor..." />}>
            <FindingsPage />
        </Suspense>
    );
}




export default function UnitFindingsPage() {
    return (
        <RequireRole allowedRoles={['BIRIM_KULLANICISI', 'MUFETTIS', 'GOZETIM_SORUMLUSU', 'ADMIN', 'SUPER_ADMIN']}>
            <UnitFindingsPageContent />
        </RequireRole>
    );
}
