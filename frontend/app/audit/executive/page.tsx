'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Users, CheckSquare, XCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import RefreshButton from '@/components/ui/RefreshButton';
import { formatDateTime } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/audit/PageHeader';
import PendingDeletionsModal from '@/components/audit/PendingDeletionsModal';
import PageToolbar from '@/components/ui/PageToolbar';
import CustomSelect from '@/components/ui/CustomSelect';
import QualityMetrics from '@/components/audit/QualityMetrics';
import ExecutiveOverview from '@/components/audit/executive/ExecutiveOverview';
import ExecutiveTeam from '@/components/audit/executive/ExecutiveTeam';
import EmptyState from '@/components/ui/EmptyState';
import { useExecutiveCalculations } from '@/hooks/useExecutiveCalculations';
import { AccessDenied } from '@/components/audit/AuditLogComponents';

export default function ExecutiveDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const isExecutive = checkRole(hasRole, ROLES.EXECUTIVE);

    const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'team'>('overview');
    const [stats, setStats] = useState<any>(null);
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const [selectedYear, setSelectedYear] = useState<string>('Tümü');
    const availableYears = [
        { value: 'Tümü', label: 'Tüm Yıllar' },
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' },
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' }
    ];

    useEffect(() => {
        if (!isExecutive) {
            setLoading(false);
            showToast('Bu sayfayı görüntüleme yetkiniz yok.', 'error');
            router.push('/audit');
            return;
        }
        loadData();
    }, [selectedYear, isExecutive, router]);

    const loadData = async (showOverlay = true) => {
        if (!isExecutive) {
            setLoading(false);
            return;
        }

        if (showOverlay) setLoading(true);
        try {
            const data = await auditApi.getExecutiveStats(selectedYear);
            setStats(data);
            setPendingItems(data.pendingItems || []);
            setLastUpdate(formatDateTime(new Date()));
        } catch (error) {
            console.error('Yönetici paneli veri yükleme hatası:', error);
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            if (showOverlay) setLoading(false);
        }
    };

    const handleApproveDelete = async (id: string, type: 'Audit' | 'Finding') => {
        try {
            if (type === 'Audit') {
                await auditApi.approveDeleteAudit(id);
            } else {
                await auditApi.approveDeleteFinding(id);
            }
            showToast('Silme işlemi onaylandı', 'success');
            loadData();
            if (pendingItems.length <= 1) setShowPendingModal(false);
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };

    const handleRejectDelete = async () => {
        // İptal logici
        setShowPendingModal(false);
    };

    const {
        sortedSkills,
        weakestSkill,
        strongestSkill,
        minScore,
        weakestSkillsList,
        pendingLeaves,
        activeLeaves,
        upcomingLeaves,
        pendingDeclarations
    } = useExecutiveCalculations(stats);

    if (!isExecutive) {
        return <AccessDenied />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[600px]">
                <LoadingState message="Yönetici özeti oluşturuluyor..." />
            </div>
        );
    }

    return (
        <>
            <PageHeader title="Yönetici Paneli" subtitle="Yönetim özeti, onay işlemleri ve performans göstergeleri takibi" />

            {pendingItems.length > 0 && (
                <div className="mb-6">
                    <Alert 
                        variant="warning"
                        title={`Silinme Onayı Bekleyen ${pendingItems.length} Kayıt Var`}
                        description="Müfettiş veya uzmanlar tarafından silinmek istenen kayıtlar onayınızı bekliyor."
                        action={<Button variant="secondary" onClick={() => setShowPendingModal(true)}>İncele ve Yönet</Button>}
                    />
                </div>
            )}

            <PageToolbar
                noSearch={true}
                onRefresh={() => loadData(false)}
                leftActions={
                    <div className="flex items-center gap-4">
                        <SegmentedTabs
                            tabs={[
                                { id: 'overview', label: 'Genel Bakış', icon: Briefcase },
                                { id: 'team', label: 'Kadro & Onaylar', icon: Users },
                                { id: 'quality', label: 'Kalite Metrikleri', icon: CheckCircle }
                            ]}
                            activeTab={activeTab}
                            onChange={(id) => setActiveTab(id as any)}
                        />
                        {lastUpdate && <p className="text-sm text-gray-500 font-medium hidden md:block border-l pl-4 border-gray-200">Son güncelleme: {lastUpdate}</p>}
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

            {activeTab === 'quality' ? (
                <QualityMetrics />
            ) : activeTab === 'team' ? (
                <ExecutiveTeam 
                    pendingLeaves={pendingLeaves}
                    activeLeaves={activeLeaves}
                    upcomingLeaves={upcomingLeaves}
                    pendingDeclarations={pendingDeclarations}
                    sortedSkills={sortedSkills}
                    weakestSkill={weakestSkill}
                    strongestSkill={strongestSkill}
                    minScore={minScore}
                    weakestSkillsList={weakestSkillsList}
                    staffs={stats?.staffs || []}
                    onDataChange={() => loadData(false)}
                />
            ) : (
                <ExecutiveOverview
                    stats={stats}
                />
            )}

            <PendingDeletionsModal
                isOpen={showPendingModal}
                onClose={() => setShowPendingModal(false)}
                items={pendingItems}
                onApprove={handleApproveDelete}
                onReject={handleRejectDelete}
            />
        </>
    );
}
