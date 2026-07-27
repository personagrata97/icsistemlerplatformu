'use client';

import React from 'react';
import PageHeader from '@/components/audit/PageHeader';
import ControlDeficienciesSection from '@/components/control/ControlDeficienciesSection';

export default function ControlDeficienciesPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Kontrol Eksiklikleri ve Aksiyon Takibi"
                subtitle="Süreç içi kontrol testlerinde tespit edilen eksiklikler ve düzeltici aksiyon planları"
            />
            <ControlDeficienciesSection />
        </div>
    );
}
