'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Calendar, History, FileText, TrendingUp, PieChart, Users, Zap, RefreshCw, ShieldAlert, FileSignature, ArrowRight } from 'lucide-react';
import RiskHeatmap from '@/components/audit/RiskHeatmap';
import ExecutiveActionCards from '@/components/audit/ExecutiveActionCards';
import Link from 'next/link';
import ActionLink from '@/components/ui/ActionLink';
import LoadingState from '@/components/ui/LoadingState';
import { auditApi } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import { useToast } from '@/components/Toast';
import { formatDate, formatDateTime } from '@/lib/audit-utils';
import StatusBadge from '@/components/ui/StatusBadge';
import { useRouter } from 'next/navigation';

import StatCard from '@/components/ui/StatCard';
import Tooltip from '@/components/ui/Tooltip';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/audit/PageHeader';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import CodeBadge from '@/components/ui/CodeBadge';
import DashboardListItem from '@/components/ui/DashboardListItem';
import DashboardWidget from '@/components/ui/DashboardWidget';
import StatsWidget from '@/components/ui/StatsWidget';
import EmptyState from '@/components/ui/EmptyState';
import { checkRole, ROLES } from '@/lib/auth-constants';
import { Search, FolderOpen, Activity as ActivityIcon } from 'lucide-react';

interface AuditStats {
    total: number;
    ongoing: number;
    completed: number;
    planned: number;
}

interface FindingStats {
    total: number;
    open: number;
    closed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}

interface ActivityLog {
    id: string;
    action: string;
    user: string;
    date: string;
    status: string;
    targetId?: string;
    targetType?: string;
    details?: string;
}

export default function AuditDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [audits, setAudits] = useState<any[]>([]);
    const [findings, setFindings] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [heatmapModal, setHeatmapModal] = useState<{isOpen: boolean, inherent: string, control: string, list: any[]}>({ isOpen: false, inherent: '', control: '', list: [] });
    const [selectedYear, setSelectedYear] = useState<string>('Tümü');
    const [availableYears, setAvailableYears] = useState<{value: string, label: string}[]>([
        { value: 'Tümü', label: 'Tüm Yıllar' }
    ]);

    // Erişim Kontrolü
    const isManager = checkRole(hasRole, ROLES.DASHBOARD_MANAGER);
    const isInspector = hasRole('AUDIT_INSPECTOR');
    const isSupervisor = hasRole('AUDIT_SUPERVISOR');
    const isAuditor = isManager || isInspector || isSupervisor;
    const isUnit = checkRole(hasRole, ROLES.UNIT);

    // Kısıtlı Görünüm: Denetçi veya Sistem Yöneticisi OLMAYAN kullanıcılar.
    // Standart çalışanlar ve Birim kullanıcıları bu gruba dahildir.
    // Bu kullanıcılar Ana Panel yerine Portal görünümünü görmelidir.
    const isRestrictedUser = !isAuditor && !hasRole('SYSTEM_ADMIN');

    const extractYear = (dateValue: any) => {
        if (!dateValue) return null;
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return null;
        return d.getFullYear().toString();
    };

    const filterByYear = (items: any[], dateFields: string[]) => {
        if (selectedYear === 'Tümü') return items;
        return items.filter(item => {
            // Check if any of the provided date fields match the selected year
            return dateFields.some(field => {
                const year = extractYear(item[field]);
                return year === selectedYear;
            });
        });
    };

    const filteredAudits = filterByYear(audits, ['startDate', 'createdAt', 'created_at', 'updatedAt']);
    const filteredFindings = filterByYear(findings, ['createdAt', 'created_at', 'updatedAt']);

    // Gerçek veriden istatistik hesaplama
    const auditStats: AuditStats = {
        total: filteredAudits.length,
        ongoing: filteredAudits.filter(a => a.status === 'Devam Ediyor').length,
        completed: filteredAudits.filter(a => a.status === 'Tamamlandı').length,
        planned: filteredAudits.filter(a => a.status === 'Planlandı').length,
    };

    const CLOSED_STATUSES = ['Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'];
    const findingStats: FindingStats = {
        total: filteredFindings.length,
        open: filteredFindings.filter(f => !CLOSED_STATUSES.includes(f.status)).length,
        closed: filteredFindings.filter(f => CLOSED_STATUSES.includes(f.status)).length,
        critical: filteredFindings.filter(f => (f.risk || f.riskLevel) === 'Kritik').length,
        high: filteredFindings.filter(f => (f.risk || f.riskLevel) === 'Yüksek').length,
        medium: filteredFindings.filter(f => (f.risk || f.riskLevel) === 'Orta').length,
        low: filteredFindings.filter(f => (f.risk || f.riskLevel) === 'Düşük').length,
    };

    // Seçilen yıla ait 12 aylık açık/kapalı bulgu verisi oluştur (Grafik için)
    const targetYearForChart = selectedYear === 'Tümü' ? new Date().getFullYear() : parseInt(selectedYear);
    const monthlyChartData = Array.from({ length: 12 }).map((_, i) => {
        const monthStart = new Date(targetYearForChart, i, 1);
        const monthEnd = new Date(targetYearForChart, i + 1, 0);
        const monthName = monthStart.toLocaleString('tr-TR', { month: 'short' });

        const open = filteredFindings.filter((f: any) => {
            const d = new Date(f.created_at || f.createdAt);
            return d >= monthStart && d <= monthEnd && !CLOSED_STATUSES.includes(f.status);
        }).length;

        const closed = filteredFindings.filter((f: any) => {
            const d = new Date(f.closedAt || f.updatedAt || f.updated_at || f.created_at);
            return d >= monthStart && d <= monthEnd && CLOSED_STATUSES.includes(f.status);
        }).length;

        return {
            month: monthName,
            open,
            closed
        };
    });

    const handleHeatmapClick = (inherentRisk: string, controlEffectiveness: string) => {
        const filteredUnits = units.filter(u => 
            (u.inherentRisk || 'Orta') === inherentRisk && 
            (u.controlEffectiveness || 'Orta') === controlEffectiveness
        );
        if (filteredUnits.length > 0) {
            setHeatmapModal({
                isOpen: true,
                inherent: inherentRisk,
                control: controlEffectiveness,
                list: filteredUnits
            });
        } else {
            showToast('Bu risk seviyesinde birim bulunmamaktadır.', 'info');
        }
    };

    let overdueActionsCount = 0;
    let dueSoonActionsCount = 0;
    const now = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);

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

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        // Kısıtlı kullanıcılar için veri yüklemeyi atla
        if (isRestrictedUser) {
            setLoading(false);
            return;
        }

        try {
            const [auditsData, findingsData, unitsData, logsData] = await Promise.all([
                auditApi.getAudits(),
                auditApi.getFindings(),
                auditApi.getAuditableUnits(),
                auditApi.getLogs().catch(() => [])
            ]);

            let parsedAudits = Array.isArray(auditsData) ? auditsData : [];
            let parsedFindings = (Array.isArray(findingsData) ? findingsData : []).map(f => {
                let status = f.status || 'Taslak';
                if (status === 'Açık') status = 'Tebliğ Edildi';
                if (status === 'Çözüldü' || status === 'Kapalı' || status === 'Kapalı (Mutabık Değil)') status = 'Tamamlandı';
                return { ...f, status };
            });
            let parsedUnits = Array.isArray(unitsData) ? unitsData : [];

            // ROL BAZLI FİLTRELEME (RBAC)
            if (isInspector && !isManager && !isSupervisor && user?.id) {
                // Sadece yetkili olduğu denetimleri getir (Kendi oluşturduğu veya ekibinde olduğu)
                parsedAudits = parsedAudits.filter((a: any) => 
                    String(a.auditorId) === String(user.id) || 
                    String(a.supervisorId) === String(user.id) ||
                    (Array.isArray(a.team) && a.team.some((t: any) => String(t.id) === String(user.id)))
                );
                
                const myAuditIds = new Set(parsedAudits.map((a: any) => String(a.id)));

                // Sadece kendi denetimlerine VEYA kendisine atanmış bulguları getir
                parsedFindings = parsedFindings.filter((f: any) => 
                    String(f.assignedUserId) === String(user.id) || 
                    myAuditIds.has(String(f.auditId))
                );
            }

            setAudits(parsedAudits);
            setFindings(parsedFindings);
            setUnits(parsedUnits);

            const years = new Set<string>();
            const addYear = (dateStr: string) => {
                if (dateStr) {
                    const year = new Date(dateStr).getFullYear().toString();
                    if (!isNaN(Number(year))) years.add(year);
                }
            };
            
            parsedAudits.forEach((a: any) => {
                if (a.startDate) addYear(a.startDate);
                else if (a.createdAt) addYear(a.createdAt);
                else if (a.created_at) addYear(a.created_at);
            });
            parsedFindings.forEach((f: any) => {
                if (f.createdAt) addYear(f.createdAt);
                else if (f.created_at) addYear(f.created_at);
            });
            
            const sortedYears = Array.from(years).sort().reverse();
            setAvailableYears([
                { value: 'Tümü', label: 'Tüm Yıllar' },
                ...sortedYears.map(y => ({ value: y, label: y }))
            ]);

            let recentActivities: ActivityLog[] = [];

            if (Array.isArray(logsData) && logsData.length > 0) {
                let filteredLogs = logsData;
                
                if (isInspector && !isManager && !isSupervisor && user?.id) {
                    const myAuditIds = new Set(parsedAudits.map((a: any) => String(a.id)));
                    const myFindingIds = new Set(parsedFindings.map((f: any) => String(f.id)));
                    
                    filteredLogs = logsData.filter((l: any) => 
                        (l.targetType === 'Audit' && myAuditIds.has(String(l.targetId))) ||
                        (l.targetType === 'Finding' && myFindingIds.has(String(l.targetId))) ||
                        String(l.user) === String(user.displayName) ||
                        String(l.userId) === String(user.id)
                    );
                }

                recentActivities = filteredLogs.slice(0, 8).map((log: any) => ({
                    id: log.id,
                    action: log.action || 'İşlem',
                    user: log.user || 'Sistem',
                    date: log.date ? formatDate(log.date) : 'Bugün',
                    status: 'Bilgi',
                    targetId: log.targetId,
                    targetType: log.targetType,
                    details: log.details
                }));
            } else {
                // Fallback to old mock logic if logs fail
                parsedAudits.slice(0, 3).forEach((audit: any, idx: number) => {
                    recentActivities.push({
                        id: `audit-${audit.id || idx}`,
                        action: `Denetim: ${audit.title || audit.auditNumber || 'Güncellendi'}`,
                        user: audit.supervisor || audit.creatorName || 'Sistem',
                        date: audit.updatedAt ? formatDate(audit.updatedAt) : 'Bugün',
                        status: audit.status || 'Bilinmiyor',
                        targetId: audit.id,
                        targetType: 'Audit'
                    });
                });

                parsedFindings.slice(0, 3).forEach((finding: any, idx: number) => {
                    recentActivities.push({
                        id: `finding-${finding.id || idx}`,
                        action: `Bulgu: ${finding.title || finding.code || 'Güncellendi'}`,
                        user: finding.assignedUser?.displayName || finding.assignedTo || finding.creatorName || 'Müfettiş',
                        date: finding.updated_at ? formatDate(finding.updated_at) : (finding.updatedAt ? formatDate(finding.updatedAt) : 'Bugün'),
                        status: finding.status || 'Tebliğ Edildi',
                        targetId: finding.id,
                        targetType: 'Finding'
                    });
                });
            }

            setActivities(recentActivities.slice(0, 5));
            setLastUpdate(formatDateTime(new Date()));
            showToast('Veriler başarıyla yüklendi', 'success');
        } catch (error) {
            console.error('Ana panel veri yükleme hatası:', error);
            // Demo veriye geçme — boş durum göster
            setAudits([]);
            setFindings([]);
            setActivities([]);
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            if (showOverlay) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading && isRestrictedUser && !isUnit) {
            router.push('/audit/ethics/submit');
        }
    }, [loading, isRestrictedUser, isUnit, router]);

    const handleRefresh = () => {
        loadData(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                <LoadingState message="Veriler yükleniyor, lütfen bekleyin..." className="bg-transparent" />
            </div>
        );
    }

    // KISITLI KULLANICILAR İÇİN GÖRÜNÜM (Standart Çalışan ve Birim)
    if (isRestrictedUser) {
        // Standart Çalışan -> Etik Portalı'na yönlendir
        if (!isUnit) {
            return (
                <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                    <LoadingState message="Yönlendiriliyorsunuz..." className="bg-transparent" />
                </div>
            );
        }

        // Birim Görünümü
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 max-w-2xl mx-auto h-[80vh]">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Teftiş Kurulu Portalı</h2>

                <p className="text-gray-500 text-lg max-w-lg mx-auto">
                    Sorumluluğunuzdaki denetim bulgularını ve aksiyon planlarını bu ekran üzerinden yönetebilirsiniz
                </p>
                <div className="pt-8">
                    <Link href="/audit/conciliation" className="btn btn-primary btn-lg gap-3 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all">
                        <FileSignature size={24} />
                        Tebliğ ve Mutabakat
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader title="Ana Panel" subtitle="Teftiş Kurulu anlık durum özeti ve performans göstergeleri" />
            {/* Header with Refresh and Year Filter */}
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

            {/* 1. SATIR: Acil Aksiyonlar (Focus Zone) */}
            <DashboardWidget widgetType="actions" variant="transparent">
                <ExecutiveActionCards 
                    variant="dashboard"
                    pendingApprovals={filteredAudits.filter(a => a.status === 'Onay Bekliyor').length}
                    ongoingAudits={filteredAudits.filter(a => a.status === 'Devam Ediyor' || a.status === 'Sürüyor').length}
                    pendingNotifications={filteredFindings.filter(f => f.status === 'Tebliğ Edildi' || f.status === 'Birim Yanıtladı').length}
                    pendingVerification={filteredFindings.filter(f => f.status === 'Doğrulama Bekliyor').length}
                    pendingRevisions={filteredFindings.filter(f => f.status === 'Revizyon Gerekli').length + filteredAudits.filter(a => a.status === 'Revizyon Gerekli').length}
                    overdueActionsCount={overdueActionsCount}
                    dueSoonActionsCount={dueSoonActionsCount}
                />
            </DashboardWidget>

            {/* 2. SATIR: Stratejik Risk (Risk Heatmap) */}
            <div className="mb-8">
                <RiskHeatmap units={units} onCellClick={handleHeatmapClick} />
            </div>

            {/* 3. SATIR: Performans ve Makro Görünüm */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* KPI Metrics */}
                <DashboardWidget widgetType="metrics" className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 h-[calc(100%-3rem)]">
                        <StatCard
                            title="Denetim Tamamlama Oranı"
                            value={`%${auditStats.total > 0 ? Math.round((auditStats.completed / auditStats.total) * 100) : 0}`}
                            color="blue"
                            infoTooltip="Tamamlanan denetimlerin toplam denetimlere oranını ifade eder. Hedef: %90"
                        />
                        <StatCard
                            title="Bulgu Kapatma Oranı"
                            value={`%${findingStats.total > 0 ? Math.round((findingStats.closed / findingStats.total) * 100) : 0}`}
                            color="green"
                            infoTooltip="Kapatılan veya tamamlanan bulguların tüm açık/kapalı bulgulara oranını gösterir. Hedef: %85"
                        />
                        <StatCard
                            title="Ort. Denetim Süresi (Gün)"
                            value={(() => {
                                const completedAudits = filteredAudits.filter((a: any) => a.status === 'Tamamlandı' && a.startDate && a.endDate);
                                if (completedAudits.length === 0) return '-';
                                const totalDays = completedAudits.reduce((sum: number, a: any) => {
                                    const start = new Date(a.startDate);
                                    const end = new Date(a.endDate);
                                    return sum + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                }, 0);
                                return Math.round(totalDays / completedAudits.length).toString();
                            })()}
                            color="orange"
                            infoTooltip="Sadece 'Tamamlandı' statüsündeki denetimlerin başlangıç ve bitiş tarihleri arasındaki net gün sayısının ortalamasıdır. Hedef: Maks 30 gün"
                        />
                        <StatCard
                            title="Yüksek Öncelikli Bulgu"
                            value={(findingStats.critical + findingStats.high).toString()}
                            color="purple"
                            infoTooltip="Sistemdeki durumu henüz kapanmamış olan Kritik ve Yüksek riskli bulguların toplam sayısıdır."
                        />
                    </div>
                </DashboardWidget>

                {/* Risk Distribution - Pie Chart */}
                <DashboardWidget 
                    widgetType="risk"
                    infoTooltip="Sistemdeki bulguların risk ağırlıklarına (Kritik, Yüksek, Orta, Düşük) göre oransal dağılımını gösterir."
                >

                    <div className="space-y-4">
                        {[
                            { label: 'Kritik', count: findingStats.critical, color: '#881337', percent: (findingStats.critical / Math.max(findingStats.total, 1)) * 100 },
                            { label: 'Yüksek', count: findingStats.high, color: '#ef4444', percent: (findingStats.high / Math.max(findingStats.total, 1)) * 100 },
                            { label: 'Orta', count: findingStats.medium, color: '#f97316', percent: (findingStats.medium / Math.max(findingStats.total, 1)) * 100 },
                            { label: 'Düşük', count: findingStats.low, color: '#facc15', percent: (findingStats.low / Math.max(findingStats.total, 1)) * 100 },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{item.label}</span>
                                    <span className="font-semibold">{item.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Toplam Bulgu</span>
                            <span className="font-bold text-lg">{findingStats.total}</span>
                        </div>
                    </div>
                </DashboardWidget>
            </div>

            {/* 4. SATIR: Operasyonel Akış (Micro View) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Bulgu Dağılımı (Aylık) CSS Chart */}
                <DashboardWidget 
                    widgetType="trend" 
                    title="Bulgu Dağılımı" 
                    subtitle="Aylık trend analizi" 
                    infoTooltip="Yıl içerisindeki açılan ve kapatılan bulguların aylar bazında karşılaştırmalı trend analizidir."
                    className="flex flex-col justify-between"
                >

                        <div className="h-48 flex flex-col justify-end">
                            {monthlyChartData.some(d => d.open > 0 || d.closed > 0) ? (
                                <div className="flex-1 flex items-end gap-2 px-1 border-b border-gray-100 pb-2">
                                    {monthlyChartData.map((d, i) => {
                                        const maxVal = Math.max(...monthlyChartData.map(x => x.open + x.closed));
                                        const openHeight = maxVal > 0 ? (d.open / maxVal) * 100 : 0;
                                        const closedHeight = maxVal > 0 ? (d.closed / maxVal) * 100 : 0;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                                                <Tooltip content={<><span className="font-bold">{d.month}</span>: {d.open} Açık, {d.closed} Kapalı</>} position="top">
                                                    <div className="w-full flex items-end justify-center gap-0.5 h-full relative">
                                                        <div style={{ height: `${openHeight}%` }} className="w-2.5 rounded-t-sm bg-gradient-to-t from-red-500 to-rose-400 group-hover:brightness-110 transition-all duration-300 shadow-sm" />
                                                        <div style={{ height: `${closedHeight}%` }} className="w-2.5 rounded-t-sm bg-gradient-to-t from-green-600 to-emerald-500 group-hover:brightness-110 transition-all duration-300 shadow-sm" />
                                                    </div>
                                                </Tooltip>
                                                <span className="text-[9px] font-bold text-gray-400 mt-2 group-hover:text-gray-700 transition-colors tracking-wider">{d.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                    <EmptyState 
                                        variant="minimal" 
                                        icon={TrendingUp} 
                                        title="Kayıt Bulunamadı" 
                                        description="Görüntülenecek trend verisi bulunmuyor." 
                                    />
                                </div>
                            )}
                        </div>
                </DashboardWidget>

                {/* Son Eklenen Bulgular */}
                <DashboardWidget 
                    widgetType="findings" 
                    subtitle="Sisteme eklenen son bulgu kayıtları"
                    infoTooltip="Sisteme yakın zamanda eklenen ve henüz kapanmamış veya yeni kapanmış güncel bulguları listeler."
                    actionHref="/audit/findings" 
                    actionLabel="Tüm Bulguları Görüntüle"
                >

                    {filteredFindings.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-[200px] bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                            <EmptyState 
                                variant="minimal" 
                                icon={FolderOpen} 
                                title="Kayıt Bulunamadı" 
                                description="Görüntülenecek bulgu kaydı bulunmuyor." 
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredFindings.slice(0, 5).map((finding) => {
                                const displayStatus = finding.status;
                                const isClosed = CLOSED_STATUSES.includes(displayStatus);
                                return (
                                    <DashboardListItem
                                        key={finding.id}
                                        href={`/audit/findings?id=${finding.id}`}
                                        code={finding.code || (typeof finding.id === 'string' ? `#${finding.id.substring(0, 7)}` : `#${finding.id}`)}
                                        title={finding.title || finding.headline}
                                        subtitle={
                                            <div className="flex items-center text-[11px] text-gray-400">
                                                {finding.department || 'Birim Belirtilmedi'}
                                                <span className="mx-1.5">•</span>
                                                Vade: <span className={!finding.dueDate ? (isClosed ? 'text-gray-500' : 'italic text-amber-600') : ''}>{
                                                    finding.dueDate ? formatDate(finding.dueDate) : (isClosed ? 'Kapatıldı' : 'Bekleniyor')
                                                }</span>
                                            </div>
                                        }
                                        status={displayStatus}
                                    />
                                );
                            })}
                        </div>
                    )}
                </DashboardWidget>

                {/* Son Denetim İzleri */}
                <DashboardWidget 
                    widgetType="activities"
                    subtitle="Sisteme eklenen son denetim izleri"
                    infoTooltip="Sistem içerisinde kullanıcılar tarafından gerçekleştirilen son kritik eylemlerin (giriş, düzenleme vb.) denetim izi kayıtlarıdır."
                    actionHref="/audit/logs" 
                    actionLabel="Tüm Aktiviteleri Görüntüle"
                    className="flex flex-col justify-between"
                >

                        {activities.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center min-h-[200px] bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState 
                                    variant="minimal" 
                                    icon={ActivityIcon} 
                                    title="Kayıt Bulunamadı" 
                                    description="Görüntülenecek denetim izi bulunmuyor." 
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activities.slice(0, 5).map((activity) => {
                                    const isLogin = activity.action.includes('Giriş');
                                    const isAudit = (activity as any).entityType === 'Denetim' || activity.action.includes('Denetim');
                                    
                                    return (
                                        <DashboardListItem
                                            key={activity.id}
                                            icon={
                                                <div className={`p-2 rounded-lg ${
                                                    isLogin ? 'bg-blue-50 text-blue-600' : 
                                                    isAudit ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'
                                                }`}>
                                                    {isLogin ? <ShieldAlert size={16} /> : isAudit ? <RefreshCw size={16} /> : <FileSignature size={16} />}
                                                </div>
                                            }
                                            title={activity.action}
                                            subtitle={
                                                <div className="flex items-center text-[11px] text-gray-400">
                                                    <span className="font-semibold text-gray-600">{activity.user}</span>
                                                    <span className="mx-1.5">•</span>
                                                    {activity.details || 'Sistem kaydı oluşturuldu'}
                                                </div>
                                            }
                                            rightContent={
                                                <div className="text-[11px] font-bold text-gray-400 whitespace-nowrap">
                                                    {activity.date}
                                                </div>
                                            }
                                        />
                                    );
                                })}
                            </div>
                        )}
                </DashboardWidget>
            </div>

            {/* Heatmap Modal */}
            <Modal
                isOpen={heatmapModal.isOpen}
                onClose={() => setHeatmapModal({ ...heatmapModal, isOpen: false })}
                title="Risk Kategorisi Detayı"
                size="md"
            >
                <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2 font-medium">Seçilen Risk Seviyesi:</p>
                    <div className="flex gap-2 items-center">
                        <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-md text-xs font-bold shadow-sm">Doğal Risk: {heatmapModal.inherent}</span>
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold shadow-sm">Kontrol Etkinliği: {heatmapModal.control}</span>
                    </div>
                </div>
                
                <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Bu Kategorideki Birimler ({heatmapModal.list.length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {heatmapModal.list.map(unit => (
                        <div key={unit.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center hover:border-primary/30 transition-colors group">
                            <div>
                                <div className="font-bold text-sm text-gray-800 group-hover:text-primary transition-colors">{unit.name}</div>
                                {unit.department && <div className="text-xs text-gray-500 mt-0.5">{unit.department}</div>}
                            </div>
                            <ActionLink href={`/audit/universe/${unit.id}`} variant="primary">Detay</ActionLink>
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}
