'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Calendar, Clock, Award, BookOpen, ShieldCheck } from 'lucide-react';
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
                            { id: '/control/staff', label: 'Denetçi Kadrosu & BKS', icon: Users },
                            { id: '/control/staff/calendar', label: 'Kapasite & Takvim', icon: Calendar },
                            { id: '/control/staff/timesheet', label: 'Efor & Zaman İzleme', icon: Clock },
                            { id: '/control/skills', label: 'Yetkinlik Matrisi', icon: Award },
                            { id: '/control/training', label: 'Eğitim Kataloğu & CPE', icon: BookOpen },
                            { id: '/control/staff/independence', label: 'Bağımsızlık & Uyum', icon: ShieldCheck }
                        ]}
                        activeTab={pathname}
                        onChange={(id) => router.push(id)}
                    />
                }
            />
        </div>
    );
}
