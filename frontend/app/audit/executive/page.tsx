'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Users, CheckSquare, XCircle, Clock, Calendar } from 'lucide-react';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import RefreshButton from '@/components/ui/RefreshButton';
import { formatDateTime, calculateDynamicSkills } from '@/lib/audit-utils';
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

    // Teftiş Kurulu Yetkinlik Analizi (Skill Gap) Hesaplaması
    const skillAverages: Record<string, any> = {
        risk_assessment: { label: 'Risk Yönetimi', total: 0, scores: [] },
        it_audit: { label: 'BT ve Siber', total: 0, scores: [] },
        financial_audit: { label: 'Finansal & Uyum', total: 0, scores: [] },
        data_analysis: { label: 'Veri Analitiği', total: 0, scores: [] },
        reporting_english: { label: 'Raporlama', total: 0, scores: [] }
    };

    if (stats?.staffs && stats.staffs.length > 0) {
        stats.staffs.forEach((staff: any) => {
            const dynamic = calculateDynamicSkills(staff);
            const name = staff.displayName || staff.user?.displayName || staff.firstName || 'Personel';
            
            skillAverages.risk_assessment.total += dynamic.risk_assessment.total;
            skillAverages.risk_assessment.scores.push({ name, val: dynamic.risk_assessment.total });
            
            skillAverages.it_audit.total += dynamic.it_audit.total;
            skillAverages.it_audit.scores.push({ name, val: dynamic.it_audit.total });
            
            skillAverages.financial_audit.total += dynamic.financial_audit.total;
            skillAverages.financial_audit.scores.push({ name, val: dynamic.financial_audit.total });
            
            skillAverages.data_analysis.total += dynamic.data_analysis.total;
            skillAverages.data_analysis.scores.push({ name, val: dynamic.data_analysis.total });
            
            skillAverages.reporting_english.total += dynamic.reporting_english.total;
            skillAverages.reporting_english.scores.push({ name, val: dynamic.reporting_english.total });
        });
        
        Object.keys(skillAverages).forEach(k => {
            const sk = skillAverages[k];
            sk.total = Number((sk.total / stats.staffs.length).toFixed(1));
            sk.breakdowns = sk.scores
                .sort((a: any, b: any) => b.val - a.val)
                .slice(0, 3)
                .map((s: any) => ({ label: s.name, value: Number(s.val.toFixed(1)) }));
        });
    }

    const sortedSkills = Object.values(skillAverages).sort((a, b) => a.total - b.total);
    const weakestSkill = stats?.staffs?.length > 0 ? sortedSkills[0] : null;
    const strongestSkill = stats?.staffs?.length > 0 ? sortedSkills[sortedSkills.length - 1] : null;
    const minScore = weakestSkill ? weakestSkill.total : 0;
    const weakestSkillsList = sortedSkills.filter(s => s.total === minScore);

    const pendingLeaves: any[] = [];
    const activeLeaves: any[] = [];
    const upcomingLeaves: any[] = [];
    const pendingDeclarations: any[] = [];
    const now = new Date();
    
    if (stats?.staffs) {
        stats.staffs.forEach((staff: any) => {
            const name = staff.displayName || staff.user?.displayName || staff.firstName || 'Personel';
            if (staff.leaves) {
                staff.leaves.forEach((leave: any) => {
                    if (leave.status === 'İptal Edildi') return;
                    const sDate = new Date(leave.startDate);
                    const eDate = new Date(leave.endDate);
                    if (leave.status === 'Planlandı') pendingLeaves.push({ ...leave, name, staffId: staff.id });
                    if (now >= sDate && now <= eDate) activeLeaves.push({ name, type: leave.type, eDate, status: leave.status });
                    else if (sDate > now && (sDate.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000) upcomingLeaves.push({ name, type: leave.type, sDate, eDate, status: leave.status });
                });
            }
            if (staff.declarations) {
                staff.declarations.forEach((decl: any) => {
                    if (decl.status === 'Bekliyor') pendingDeclarations.push({ ...decl, name, staffId: staff.id });
                });
            }
        });
    }

    if (!isExecutive) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full gap-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-2xl font-bold">!</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Yetkisiz Erişim</h2>
            </div>
        );
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
