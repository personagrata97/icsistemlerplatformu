'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, FolderOpen, Activity as ActivityIcon } from 'lucide-react';
import RiskHeatmap from '@/components/audit/RiskHeatmap';
import ExecutiveActionCards from '@/components/audit/ExecutiveActionCards';
import Link from 'next/link';
import ActionLink from '@/components/ui/ActionLink';
import LoadingState from '@/components/ui/LoadingState';
import { auditApi } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import { useToast } from '@/components/Toast';
import { formatDate, formatDateTime, extractYear, filterByYear } from '@/lib/audit-utils';
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
import Badge from '@/components/ui/Badge';
import EntityIcon from '@/components/ui/EntityIcon';

import EmptyState from '@/components/ui/EmptyState';
import { checkRole, ROLES } from '@/lib/auth-constants';

import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

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

    // Kısıtlı Görünüm: Müfettiş veya Sistem Yöneticisi OLMAYAN kullanıcılar.
    // Standart çalışanlar ve Birim kullanıcıları bu gruba dahildir.
    // Bu kullanıcılar Ana Panel yerine Portal görünümünü görmelidir.
    const isRestrictedUser = !isAuditor && !hasRole('SYSTEM_ADMIN');



    const [stats, setStats] = useState<any>(null);

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

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        // GÜVENLİK VE MANTIK: Kısıtlı kullanıcılar (Örn: Etik İhbarcı) sayfaya girmeden yönlendirilir,
        // bu yüzden veri yüklemeyi tamamen kilitliyoruz.
        // ANCAK! Kullanıcı bir Birim (Unit) ise, kendi paneli için veriye ihtiyacı vardır.
        if (isRestrictedUser && !isUnit) {
            setLoading(false);
            return;
        }

        try {
            let auditsData: any = [];
            let findingsData: any = [];
            let unitsData: any = [];
            let logsData: any = [];

            if (isUnit) {
                // Sadece Birim yetkilisi ise: Gereksiz risk haritası veya sistem loglarını çekme
                const [auditsData, findingsData] = await Promise.all([
                    auditApi.getAudits(),
                    auditApi.getFindings()
                ]);
                
                setAudits(Array.isArray(auditsData) ? auditsData : []);
                setFindings(Array.isArray(findingsData) ? findingsData : []);
            } else {
                // Müfettiş veya Yönetici: Tüm paneli besleyecek dataları Server-Side'dan çek (Data Leakage Fix)
                const [execStats, unitsData] = await Promise.all([
                    auditApi.getExecutiveStats(selectedYear),
                    auditApi.getAuditableUnits()
                ]);
                
                setStats(execStats);
                setUnits(Array.isArray(unitsData) ? unitsData : []);
                if (execStats.recentLogs) {
                    setActivities(execStats.recentLogs.map((log: any) => ({
                        id: log.id,
                        action: log.action || 'İşlem',
                        user: log.user || 'Sistem',
                        date: log.date ? formatDate(log.date) : 'Bugün',
                        status: 'Bilgi',
                        targetId: log.targetId,
                        targetType: log.targetType,
                        details: log.details
                    })));
                }
            }

            // Yıl filtresi seçeneklerini (Şimdilik statik tutuyoruz)
            setAvailableYears([
                { value: 'Tümü', label: 'Tüm Yıllar' },
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' }
            ]);

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
    }, [selectedYear]);

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
        // Merkezi Bileşenlerle Gerçek Birim Görünümü (Unit Dashboard)
        const unitAudits = filterByYear(audits, ['startDate', 'createdAt', 'created_at'], selectedYear);
        const unitFindings = filterByYear(findings, ['createdAt', 'created_at'], selectedYear); 
        
        const requiresAction = unitFindings.filter(f => ['Tebliğ Edildi', 'Revizyon Gerekli'].includes(f.status)).length;
        const followUp = unitFindings.filter(f => f.status === 'Takip Ediliyor').length;
        const pendingReview = unitFindings.filter(f => ['Birim Yanıtladı', 'Doğrulama Bekliyor'].includes(f.status)).length;

        return (
            <>
                <PageHeader title={`${user?.department || 'Birim'} Portalı`} subtitle="Sorumluluğunuzdaki denetim bulgularını ve aksiyon planlarını yönetin" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
                    <StatCard 
                        title="Yanıt Bekleyen" 
                        value={requiresAction.toString()} 
                        color="red"
                        infoTooltip="Aksiyon planı girmeniz gereken bulgular"
                    />
                    <StatCard 
                        title="Kanıt Bekleyen" 
                        value={followUp.toString()} 
                        color="orange"
                        infoTooltip="Aksiyonu tamamlayıp kanıt yüklemeniz gereken bulgular"
                    />
                    <StatCard 
                        title="Onayda Bekleyen" 
                        value={pendingReview.toString()} 
                        color="blue"
                        infoTooltip="Müfettişin incelediği yanıt/kanıtlar"
                    />
                    <StatCard 
                        title="Toplam Bulgu" 
                        value={unitFindings.length.toString()} 
                        color="green"
                        infoTooltip="Tüm aktif ve kapanmış bulgular"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardWidget title="Aksiyon Bekleyen Bulgular" subtitle="Öncelikli olarak yanıtlamanız gereken tespitler" actionHref="/audit/conciliation" actionLabel="Mutabakat Ekranına Git" widgetType="findings">
                        {unitFindings.filter(f => ['Tebliğ Edildi', 'Revizyon Gerekli', 'Takip Ediliyor'].includes(f.status)).slice(0, 5).map(f => (
                            <DashboardListItem
                                key={f.id}
                                href={`/audit/conciliation`}
                                code={f.code || `#${String(f.id).substring(0, 7)}`}
                                title={f.title || f.headline}
                                subtitle={<span className="text-xs text-gray-500">Vade:&nbsp;{f.dueDate ? formatDate(f.dueDate) : 'Belirtilmedi'}</span>}
                                status={f.status}
                            />
                        ))}
                        {unitFindings.filter(f => ['Tebliğ Edildi', 'Revizyon Gerekli', 'Takip Ediliyor'].includes(f.status)).length === 0 && (
                            <div className="p-6 text-center text-gray-500">Aksiyon bekleyen bulgu bulunmamaktadır.</div>
                        )}
                    </DashboardWidget>

                    <DashboardWidget title="Biriminizin Son Denetimleri" subtitle="Geçmiş ve devam eden denetimler" widgetType="audits" actionHref="/audit/audits" actionLabel="Tüm Denetimlere Git">
                        {unitAudits.slice(0, 5).map(a => (
                            <DashboardListItem
                                key={a.id}
                                icon={<EntityIcon type="AUDIT" variant="square" size={16} />}
                                title={a.title}
                                subtitle={<span className="text-xs text-gray-500">{a.year || extractYear(a.startDate) || '2026'}</span>}
                                rightContent={<StatusBadge status={a.status} />}
                            />
                        ))}
                    </DashboardWidget>
                </div>
            </>
        );
    }

    const CLOSED_STATUSES = ['Kapalı', 'Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'];

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
                    pendingApprovals={stats?.pendingApprovals || 0}
                    ongoingAudits={stats?.activeAudits || 0}
                    pendingNotifications={stats?.pendingNotifications || 0}
                    pendingVerification={stats?.pendingVerification || 0}
                    pendingRevisions={stats?.pendingRevisions || 0}
                    overdueActionsCount={stats?.overdueActionsCount || 0}
                    dueSoonActionsCount={stats?.dueSoonActionsCount || 0}
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
                            value={`%${stats?.totalAudits > 0 ? Math.round((stats.completedAudits / stats.totalAudits) * 100) : 0}`}
                            color="blue"
                            infoTooltip="Tamamlanan denetimlerin toplam denetimlere oranını ifade eder. Hedef: %90"
                        />
                        <StatCard
                            title="Bulgu Kapatma Oranı"
                            value={`%${stats?.totalFindings > 0 ? Math.round(((stats.totalFindings - stats.openFindings) / stats.totalFindings) * 100) : 0}`}
                            color="green"
                            infoTooltip="Kapatılan veya tamamlanan bulguların tüm açık/kapalı bulgulara oranını gösterir. Hedef: %85"
                        />
                        <StatCard
                            title="Ort. Denetim Süresi (İş Günü)"
                            value={(stats?.avgDuration || '-').toString()}
                            color="orange"
                            infoTooltip="Sadece 'Tamamlandı' statüsündeki denetimlerin başlangıç ve bitiş tarihleri arasındaki net iş günü sayısının ortalamasıdır. (Hafta sonları hariç) Hedef: Maks 20 iş günü"
                        />
                        <StatCard
                            title="Yüksek Öncelikli Bulgu"
                            value={((stats?.criticalFindings || 0) + (stats?.highFindings || 0)).toString()}
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
                            { label: 'Kritik', count: stats?.criticalFindings || 0, colorClass: 'bg-rose-900', percent: ((stats?.criticalFindings || 0) / Math.max(stats?.totalFindings || 1, 1)) * 100 },
                            { label: 'Yüksek', count: stats?.highFindings || 0, colorClass: 'bg-red-500', percent: ((stats?.highFindings || 0) / Math.max(stats?.totalFindings || 1, 1)) * 100 },
                            { label: 'Orta', count: stats?.mediumFindings || 0, colorClass: 'bg-orange-500', percent: ((stats?.mediumFindings || 0) / Math.max(stats?.totalFindings || 1, 1)) * 100 },
                            { label: 'Düşük', count: stats?.lowFindings || 0, colorClass: 'bg-yellow-400', percent: ((stats?.lowFindings || 0) / Math.max(stats?.totalFindings || 1, 1)) * 100 },
                        ].map((item) => (
                            <div 
                                key={item.label} 
                                className="cursor-pointer hover:bg-gray-50/50 p-1 -mx-1 rounded transition-colors"
                                onClick={() => router.push(`/audit/findings?risk=${item.label}`)}
                            >
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 group-hover:text-gray-900">{item.label}</span>
                                    <span className="font-semibold">{item.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${item.colorClass}`}
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Toplam Bulgu</span>
                            <span className="font-bold text-lg">{stats?.totalFindings || 0}</span>
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
                            {stats?.monthlyChartData && stats.monthlyChartData.some((d: any) => d.open > 0 || d.closed > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.monthlyChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="open" name="Açık" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={12} onClick={() => router.push('/audit/findings?status=Açık')} style={{ cursor: 'pointer' }} />
                                        <Bar dataKey="closed" name="Kapalı" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} onClick={() => router.push('/audit/findings?status=Kapalı')} style={{ cursor: 'pointer' }} />
                                    </BarChart>
                                </ResponsiveContainer>
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

                    {!stats?.recentFindings || stats.recentFindings.length === 0 ? (
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
                            {stats.recentFindings.map((finding: any) => {
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
                                                Vade:&nbsp;<span className={!finding.dueDate ? (isClosed ? 'text-gray-500' : 'italic text-amber-600') : ''}>{
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
                                    const avatarInitials = activity.user && activity.user !== 'Sistem' 
                                        ? activity.user.substring(0, 2).toUpperCase() 
                                        : 'SYS';
                                    const avatarColor = activity.user === 'Sistem' ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary';
                                    
                                    return (
                                        <DashboardListItem
                                            key={activity.id}
                                            icon={
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor}`}>
                                                    {avatarInitials}
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
                        <Badge variant="danger" size="md">Doğal Risk: {heatmapModal.inherent}</Badge>
                        <Badge variant="secondary" size="md">Kontrol Etkinliği: {heatmapModal.control}</Badge>
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
