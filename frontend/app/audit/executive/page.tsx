'use client';

import React, { useState, useEffect } from 'react';
import {
    Briefcase, CheckCircle, PieChart, RefreshCw, AlertCircle, Calendar,
    AlertTriangle, FileText, TrendingUp
} from 'lucide-react';
import ExecutiveActionCards from '@/components/audit/ExecutiveActionCards';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Link from 'next/link';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import RefreshButton from '@/components/ui/RefreshButton';
import { formatDateTime } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import { useRouter } from 'next/navigation';

import QualityMetrics from '@/components/audit/QualityMetrics';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/audit/PageHeader';
import PendingDeletionsModal from '@/components/audit/PendingDeletionsModal';
import EmptyState from '@/components/ui/EmptyState';
import ActionLink from '@/components/ui/ActionLink';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import CustomSelect from '@/components/ui/CustomSelect';
import Alert from '@/components/ui/Alert';
import DashboardListItem from '@/components/ui/DashboardListItem';
import DashboardWidget from '@/components/ui/DashboardWidget';

export default function ExecutiveDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const isExecutive = checkRole(hasRole, ROLES.EXECUTIVE);

    const [activeTab, setActiveTab] = useState<'overview' | 'quality'>('overview');
    const [audits, setAudits] = useState<any[]>([]);
    const [findings, setFindings] = useState<any[]>([]);
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const [selectedYear, setSelectedYear] = useState<string>('Tümü');
    const [availableYears, setAvailableYears] = useState<{value: string, label: string}[]>([
        { value: 'Tümü', label: 'Tüm Yıllar' }
    ]);

    const extractYear = (dateValue: any) => {
        if (!dateValue) return null;
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return null;
        return d.getFullYear().toString();
    };

    const filterByYear = (items: any[], dateFields: string[]) => {
        if (selectedYear === 'Tümü') return items;
        return items.filter(item => {
            return dateFields.some(field => {
                const year = extractYear(item[field]);
                return year === selectedYear;
            });
        });
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading && !isExecutive) {
            router.push('/audit');
        }
    }, [loading, isExecutive, router]);

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        try {
            const [auditsData, findingsData] = await Promise.all([
                auditApi.getAudits(),
                auditApi.getFindings()
            ]);
            const normalizedFindings = (Array.isArray(findingsData) ? findingsData : []).map(f => {
                let status = f.status || 'Taslak';
                if (status === 'Açık') status = 'Tebliğ Edildi';
                if (status === 'Çözüldü' || status === 'Kapalı' || status === 'Kapalı (Mutabık Değil)') status = 'Tamamlandı';
                return { ...f, status };
            });

            setAudits(Array.isArray(auditsData) ? auditsData : []);
            setFindings(normalizedFindings);

            // Yıl filtresi seçeneklerini oluştur
            const years = new Set<string>();
            const addYear = (dateStr: string) => {
                if (dateStr) {
                    const year = new Date(dateStr).getFullYear().toString();
                    if (!isNaN(Number(year))) years.add(year);
                }
            };
            
            (Array.isArray(auditsData) ? auditsData : []).forEach((a: any) => {
                if (a.createdAt) addYear(a.createdAt);
                if (a.startDate) addYear(a.startDate);
                if (a.created_at) addYear(a.created_at);
            });
            normalizedFindings.forEach((f: any) => {
                if (f.createdAt) addYear(f.createdAt);
                if (f.created_at) addYear(f.created_at);
                if (f.updated_at) addYear(f.updated_at);
            });
            
            const sortedYears = Array.from(years).sort().reverse();
            setAvailableYears([
                { value: 'Tümü', label: 'Tüm Yıllar' },
                ...sortedYears.map(y => ({ value: y, label: y }))
            ]);

            // Silinme onayı bekleyen kayıtları filtrele
            const pAudits = (Array.isArray(auditsData) ? auditsData : []).filter((a: any) => a.status === 'Silinme Onayı Bekliyor').map((a: any) => ({
                id: a.id,
                code: a.auditCode || a.code, // farklı alan adları
                title: a.title,
                deletionReason: a.deletionReason,
                deletionComment: a.deletionComment,
                type: 'Audit'
            }));

            const pFindings = (Array.isArray(findingsData) ? findingsData : []).filter((f: any) => f.status === 'Silinme Onayı Bekliyor').map((f: any) => ({
                id: f.id,
                code: f.code,
                title: f.headline || f.title, // farklı alan adları
                deletionReason: f.deletionReason,
                deletionComment: f.deletionComment,
                type: 'Finding'
            }));

            setPendingItems([...pAudits, ...pFindings]);
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
            loadData(); // Listeyi yenile
            if (pendingItems.length <= 1) setShowPendingModal(false);
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };

    const handleRejectDelete = async (id: string, type: 'Audit' | 'Finding') => {
        try {
            if (type === 'Audit') {
                await auditApi.rejectDeleteAudit(id);
            } else {
                await auditApi.rejectDeleteFinding(id);
            }
            showToast('Silme talebi reddedildi', 'success');
            loadData();
            if (pendingItems.length <= 1) setShowPendingModal(false);
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };


    // İstatistik hesaplama
    const filteredAudits = filterByYear(audits, ['startDate', 'createdAt', 'created_at', 'updatedAt']);
    const filteredFindings = filterByYear(findings, ['createdAt', 'created_at', 'updatedAt']);

    const pendingApprovals = filteredFindings.filter(f => f.status === 'Onay Bekliyor').length;
    const activeAudits = filteredAudits.filter(a => a.status === 'Devam Ediyor').length;
    const pendingNotifications = filteredFindings.filter(f => f.status === 'Tebliğ Edildi' || f.status === 'Birim Yanıtladı').length;
    const pendingVerification = filteredFindings.filter(f => f.status === 'Doğrulama Bekliyor').length;
    const criticalFindings = filteredFindings.filter(f => f.riskLevel === 'Kritik' || f.riskLevel === 'Yüksek').length;
    const completedAudits = filteredAudits.filter(a => a.status === 'Tamamlandı').length;
    const pendingRevisions = filteredFindings.filter(f => f.status === 'Revizyon Gerekli').length + filteredAudits.filter(a => a.status === 'Revizyon Gerekli').length;

    let overdueActionsCount = 0;
    let dueSoonActionsCount = 0;
    const now = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);
    const CLOSED_STATUSES = ['Tamamlandı', 'Kapatıldı', 'İptal', 'Kapalı', 'Çözüldü'];

    filteredFindings.forEach((f: any) => {
        if (!CLOSED_STATUSES.includes(f.status) && f.status !== 'İptal') {
            const actions = f.actions || f.followUps;
            if (Array.isArray(actions)) {
                actions.forEach((a: any) => {
                    if (a.status !== 'Kapalı' && a.status !== 'Tamamlandı' && (a.deadline || a.dueDate)) {
                        const deadline = new Date(a.deadline || a.dueDate);
                        if (deadline < now) overdueActionsCount++;
                        else if (deadline <= fifteenDaysFromNow) dueSoonActionsCount++;
                    }
                });
            }
        }
    });

    // Yetkisiz kullanıcıları yönlendir
    if (!isExecutive) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                <LoadingState message="Yönlendiriliyorsunuz..." className="bg-transparent" />
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
                        description="Denetçi veya uzmanlar tarafından silinmek istenen kayıtlar onayınızı bekliyor."
                        action={
                            <Button
                                variant="secondary"
                                onClick={() => setShowPendingModal(true)}
                            >
                                İncele ve Yönet
                            </Button>
                        }
                    />
                </div>
            )}

            {/* Tab Navigation ve Yenile Butonu */}
            <PageToolbar
                noSearch={true}
                onRefresh={() => loadData(false)}
                leftActions={
                    <div className="flex items-center gap-4">
                        <SegmentedTabs
                            tabs={[
                                { id: 'overview', label: 'Genel Bakış', icon: Briefcase },
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
            ) : (
                <>
                    {/* İş Akışı Özeti */}
                    <DashboardWidget 
                        widgetType="actions" 
                        variant="transparent"
                        infoTooltip="Yöneticinin ilgilenmesi gereken acil aksiyonlar, onay bekleyen raporlar ve gecikmiş görevlerin özet görünümüdür."
                    >
                        <ExecutiveActionCards
                            variant="dashboard"
                            pendingApprovals={pendingApprovals}
                            ongoingAudits={activeAudits}
                            pendingNotifications={pendingNotifications}
                            pendingVerification={pendingVerification}
                            pendingRevisions={pendingRevisions}
                            overdueActionsCount={overdueActionsCount}
                            dueSoonActionsCount={dueSoonActionsCount}
                        />
                    </DashboardWidget>

                    {/* Genel İstatistikler */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Denetim Durumu */}
                        <DashboardWidget 
                            widgetType="status"
                            infoTooltip="Sistemde kayıtlı olan denetimlerin güncel iş akışı durumlarına göre sayısal dağılımıdır."
                        >
                            <div className="grid grid-cols-3 gap-4">
                                <StatCard
                                    title="Toplam"
                                    value={filteredAudits.length.toString()}
                                    color="blue"
                                />
                                <StatCard
                                    title="Devam Ediyor"
                                    value={activeAudits.toString()}
                                    color="yellow"
                                />
                                <StatCard
                                    title="Tamamlandı"
                                    value={completedAudits.toString()}
                                    color="green"
                                />
                            </div>
                        </DashboardWidget>

                        {/* Bulgu Risk Dağılımı */}
                        <DashboardWidget 
                            widgetType="risk"
                            infoTooltip="Bulguların risk seviyelerine göre dağılımı. Kritik veya Yüksek bulgular için sistem ek uyarı üretebilir."
                        >
                            <div className="grid grid-cols-4 gap-3">
                                <StatCard
                                    title="Kritik"
                                    value={filteredFindings.filter(f => f.riskLevel === 'Kritik').length.toString()}
                                    color="rose"
                                />
                                <StatCard
                                    title="Yüksek"
                                    value={filteredFindings.filter(f => f.riskLevel === 'Yüksek').length.toString()}
                                    color="red"
                                />
                                <StatCard
                                    title="Orta"
                                    value={filteredFindings.filter(f => f.riskLevel === 'Orta').length.toString()}
                                    color="orange"
                                />
                                <StatCard
                                    title="Düşük"
                                    value={filteredFindings.filter(f => f.riskLevel === 'Düşük').length.toString()}
                                    color="yellow"
                                />
                            </div>
                            {criticalFindings > 0 && (
                                <div className="mt-4">
                                    <Alert
                                        variant="error"
                                        size="sm"
                                        title={`${criticalFindings} adet yüksek/kritik öncelikli bulgu mevcut`}
                                        description="Bu bulguların aksiyon planlarının ivedilikle gözden geçirilmesi gerekmektedir."
                                    />
                                </div>
                            )}
                        </DashboardWidget>
                    </div>

                    {/* Son Aktiviteler & Yaklaşan Tarihler */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Son Bulgular */}
                        {/* Son Eklenen Bulgular */}
                        <DashboardWidget 
                            widgetType="findings"
                            infoTooltip="Sisteme yakın zamanda işlenmiş olan güncel bulguları içerir."
                            actionHref="/audit/findings" 
                            actionLabel="Tüm Bulguları Görüntüle"
                        >
                            {filteredFindings.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                    <EmptyState variant="minimal" entityType="FINDING" title="Kayıt Bulunamadı" description="Görüntülenecek bulgu kaydı bulunmuyor." />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredFindings.slice(0, 5).map((finding: any) => {
                                        const displayStatus = finding.status === 'Çözüldü' ? 'Kapalı' : finding.status;
                                        return (
                                            <DashboardListItem 
                                                key={finding.id}
                                                href={`/audit/findings?id=${finding.id}`}
                                                code={finding.code || (typeof finding.id === 'string' ? `#${finding.id.substring(0, 7)}` : `#${finding.id}`)}
                                                title={finding.title || 'İsimsiz Bulgu'}
                                                subtitle={finding.unit || finding.businessUnit || 'Birim Yok'}
                                                status={displayStatus}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </DashboardWidget>

                        {/* Denetim Takvimi */}
                        <DashboardWidget 
                            widgetType="audits"
                            infoTooltip="Durumu 'Devam Ediyor' olan denetimlerin anlık özet listesidir."
                            actionHref="/audit/audits?status=Devam%20Ediyor" 
                            actionLabel="Tüm Denetimleri Görüntüle"
                        >
                            {filteredAudits.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                    <EmptyState variant="minimal" entityType="AUDIT" title="Kayıt Bulunamadı" description="Görüntülenecek denetim kaydı bulunmuyor." />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredAudits.filter(a => a.status === 'Devam Ediyor').slice(0, 5).map((audit: any) => (
                                        <DashboardListItem 
                                            key={audit.id}
                                            href={`/audit/audits/${audit.id}`}
                                            code={audit.code || audit.auditCode || (typeof audit.id === 'string' ? `#${audit.id.substring(0, 7)}` : `#${audit.id}`)}
                                            title={audit.title || 'İsimsiz Denetim'}
                                            subtitle={audit.auditableUnit?.name || audit.scope || '-'}
                                            status={audit.status}
                                        />
                                    ))}
                                </div>
                            )}
                        </DashboardWidget>
                    </div>
                </>
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
