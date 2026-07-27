'use client';

import React, { Suspense } from 'react';
import LoadingState from '@/components/ui/LoadingState';
import FindingsPage from '@/app/audit/findings/page';

export default function UnitFindingsPage() {
    return (
        <Suspense fallback={<LoadingState message="Bulgular ve Aksiyon Takip Yükleniyor..." />}>
            <FindingsPage />
        </Suspense>
    );
}


