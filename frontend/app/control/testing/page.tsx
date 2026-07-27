'use client';

import React from 'react';
import PageHeader from '@/components/audit/PageHeader';
import ControlTestingSection from '@/components/control/ControlTestingSection';

export default function ControlTestingPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Kontrol Testleri ve Saha Çalışması"
                subtitle="İç Kontrolörler tarafından gerçekleştirilen kontrol tasarım ve işletim etkinlik testleri"
            />
            <ControlTestingSection />
        </div>
    );
}
