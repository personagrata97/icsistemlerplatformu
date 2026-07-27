'use client';

import React from 'react';
import PageHeader from '@/components/audit/PageHeader';
import ControlStaffSection from '@/components/control/ControlStaffSection';

export default function ControlSkillsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Yetkinlik Matrisi"
                subtitle="İç Kontrolörlerin uzmanlık alanları, sertifikasyon seviyeleri ve rotasyon matrisi"
            />
            <ControlStaffSection />
        </div>
    );
}
