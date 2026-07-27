'use client';

import React, { useState } from 'react';
import PageToolbar from '@/components/ui/PageToolbar';
import CustomSelect from '@/components/ui/CustomSelect';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import ExecutiveOverview from '@/components/audit/executive/ExecutiveOverview';
import ControlStaffSection from '@/components/control/ControlStaffSection';
import { Target, Shield, Users, BarChart3 } from 'lucide-react';
import { formatDateTime } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';

export default function ControlExecutiveDashboard() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'team'>('overview');
    const [selectedYear, setSelectedYear] = useState('Tümü');
    const [lastUpdate, setLastUpdate] = useState<string>(formatDateTime(new Date()));

    const availableYears = [
        { value: 'Tümü', label: 'Tüm Yıllar' },
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' }
    ];

    const handleRefresh = () => {
        setLastUpdate(formatDateTime(new Date()));
        showToast('Yönetici paneli verileri güncellendi', 'success');
    };

    const executiveStats = {
        activeAudits: 6,
        completedAudits: 14,
        totalAudits: 20,
        totalFindings: 12,
        openFindings: 4,
        criticalFindings: 1,
        highFindings: 3,
        mediumFindings: 6,
        lowFindings: 2,
        pendingApprovals: 2,
        pendingNotifications: 1,
        pendingVerification: 3,
        pendingRevisions: 0,
        overdueActionsCount: 1,
        dueSoonActionsCount: 4,
        avgDuration: 8,
        recentLogs: []
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                noSearch={true}
                onRefresh={handleRefresh}
                leftActions={
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Son güncelleme: {lastUpdate}</p>
                    </div>
                }
                filters={
                    <div className="w-[160px]">
                        <CustomSelect 
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(val as string)}
                            options={availableYears}
                        />
                    </div>
                }
            />

            <SegmentedTabs
                tabs={[
                    { id: 'overview', label: 'Stratejik Yönetici Özeti', icon: Target },
                    { id: 'quality', label: 'İç Kontrol Kalite Metrikleri', icon: Shield },
                    { id: 'team', label: 'Kontrol Kadrosu & Kaynak Dağılımı', icon: Users },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as any)}
            />

            {activeTab === 'overview' && (
                <ExecutiveOverview stats={executiveStats} />
            )}

            {activeTab === 'quality' && (
                <div className="space-y-6">
                    <ControlStaffSection />
                </div>
            )}

            {activeTab === 'team' && (
                <div className="space-y-6">
                    <ControlStaffSection />
                </div>
            )}
        </div>
    );
}
