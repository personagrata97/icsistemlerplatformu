'use client';

import React from 'react';
import PageHeader from '@/components/audit/PageHeader';
import ControlTrainingSection from '@/components/control/ControlTrainingSection';

export default function ControlTrainingPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Eğitim Kataloğu ve Sertifikasyon"
                subtitle="İç Kontrol personeli ve Birim Kontrol Sorumluları için zorunlu ve seçmeli eğitim programları"
            />
            <ControlTrainingSection />
        </div>
    );
}
