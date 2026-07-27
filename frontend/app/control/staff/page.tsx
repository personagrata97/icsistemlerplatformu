'use client';

import React from 'react';
import PageHeader from '@/components/audit/PageHeader';
import ControlStaffSection from '@/components/control/ControlStaffSection';

export default function ControlStaffPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="İç Kontrol Ekibi ve Birim Sorumluları"
                subtitle="İç Kontrolör kadrosu, Birim Kontrol Sorumluları (BKS) ve yetkinlik dağılımı"
            />
            <ControlStaffSection />
        </div>
    );
}
