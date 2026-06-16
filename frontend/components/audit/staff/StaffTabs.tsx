'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Calendar, Clock, Shield, Award, ShieldCheck } from 'lucide-react';
import PageToolbar from '@/components/ui/PageToolbar';
import SegmentedTabs from '@/components/ui/SegmentedTabs';

export default function StaffTabs() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="mb-8">
            <PageToolbar
                noSearch={true}
                leftActions={
                    <SegmentedTabs
                        tabs={[
                            { id: '/audit/staff', label: 'Kadro & Özlük', icon: Users },
                            { id: '/audit/staff/calendar', label: 'Kapasite & Takvim', icon: Calendar },
                            { id: '/audit/staff/timesheet', label: 'Efor & Zaman İzleme', icon: Clock },
                            { id: '/audit/staff/skills', label: 'Yetkinlik Matrisi', icon: Shield },
                            { id: '/audit/staff/cpe', label: 'CPE & Eğitim', icon: Award },
                            { id: '/audit/staff/independence', label: 'Bağımsızlık İzleme', icon: ShieldCheck }
                        ]}
                        activeTab={pathname}
                        onChange={(id) => router.push(id)}
                    />
                }
            />
        </div>
    );
}
