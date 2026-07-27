'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Award, BookOpen } from 'lucide-react';
import PageToolbar from '@/components/ui/PageToolbar';
import SegmentedTabs from '@/components/ui/SegmentedTabs';

export default function ControlStaffTabs() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="mb-6">
            <PageToolbar
                noSearch={true}
                leftActions={
                    <SegmentedTabs
                        tabs={[
                            { id: '/control/staff', label: 'Kontrolör Kadrosu & BKS', icon: Users },
                            { id: '/control/skills', label: 'Yetkinlik Matrisi', icon: Award },
                            { id: '/control/training', label: 'Eğitim Kataloğu & Takibi', icon: BookOpen },
                        ]}
                        activeTab={pathname}
                        onChange={(id) => router.push(id)}
                    />
                }
            />
        </div>
    );
}
