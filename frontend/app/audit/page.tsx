'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Calendar, History, FileText, TrendingUp, PieChart, Users, Zap, RefreshCw, ShieldAlert, FileSignature, ArrowRight } from 'lucide-react';
import RiskHeatmap from '@/components/audit/RiskHeatmap';
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
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/audit/PageHeader';
import DataTable from '@/components/ui/DataTable';

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

    // Erişim Kontrolü
    const isManager = hasRole('ADMIN') || hasRole('AUDIT_ADMIN');
    const isInspector = hasRole('AUDIT_INSPECTOR');
    const isSupervisor = hasRole('AUDIT_SUPERVISOR');
    const isAuditor = isManager || isInspector || isSupervisor;
    const isUnit = hasRole('AUDIT_UNIT') || hasRole('AUDIT_VIEWER');

    // Kısıtlı Görünüm: Denetçi veya Sistem Yöneticisi OLMAYAN kullanıcılar.
    // Standart çalışanlar ve Birim kullanıcıları bu gruba dahildir.
    // Bu kullanıcılar Ana Panel yerine Portal görünümünü görmelidir.
    const isRestrictedUser = !isAuditor && !hasRole('SYSTEM_ADMIN');

    // Gerçek veriden istatistik hesaplama
    const auditStats: AuditStats = {
        total: audits.length,
        ongoing: audits.filter(a => a.status === 'Devam Ediyor').length,
        completed: audits.filter(a => a.status === 'Tamamlandı').length,
        planned: audits.filter(a => a.status === 'Planlandı').length,
    };

    const CLOSED_STATUSES = ['Kapalı', 'Kapalı (Mutabık Değil)', 'Tamamlandı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'];
    const findingStats: FindingStats = {
        total: findings.length,
        open: findings.filter(f => !CLOSED_STATUSES.includes(f.status)).length,
        closed: findings.filter(f => CLOSED_STATUSES.includes(f.status)).length,
        critical: findings.filter(f => (f.risk || f.riskLevel) === 'Kritik').length,
        high: findings.filter(f => (f.risk || f.riskLevel) === 'Yüksek').length,
        medium: findings.filter(f => (f.risk || f.riskLevel) === 'Orta').length,
        low: findings.filter(f => (f.risk || f.riskLevel) === 'Düşük').length,
    };

    // Son 6 ay için aylık açık/kapalı bulgu verisi oluştur (Grafik için)
    const monthlyChartData = Array.from({ length: 6 }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthName = date.toLocaleString('tr-TR', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const open = findings.filter((f: any) => {
            const d = new Date(f.created_at || f.createdAt);
            return d >= monthStart && d <= monthEnd && !CLOSED_STATUSES.includes(f.status);
        }).length;

        const closed = findings.filter((f: any) => {
            const d = new Date(f.closedAt || f.updatedAt || f.updated_at || f.created_at);
            return d >= monthStart && d <= monthEnd && CLOSED_STATUSES.includes(f.status);
        }).length;

        return {
            month: monthName,
            open,
            closed
        };
    });

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        // Kısıtlı kullanıcılar için veri yüklemeyi atla
        if (isRestrictedUser) {
            setLoading(false);
            return;
        }

        try {
            const [auditsData, findingsData, unitsData] = await Promise.all([
                auditApi.getAudits(),
                auditApi.getFindings(),
                auditApi.getAuditableUnits()
            ]);

            setAudits(Array.isArray(auditsData) ? auditsData : []);
            setFindings(Array.isArray(findingsData) ? findingsData : []);
            setUnits(Array.isArray(unitsData) ? unitsData : []);

            // Son verilerden aktivite logu oluştur
            const recentActivities: ActivityLog[] = [];

            // Son denetimleri aktivite olarak ekle
            (Array.isArray(auditsData) ? auditsData : []).slice(0, 3).forEach((audit: any, idx: number) => {
                recentActivities.push({
                    id: `audit-${audit.id || idx}`,
                    action: `Denetim: ${audit.title || audit.auditNumber || 'Güncellendi'}`,
                    user: audit.supervisor || audit.creatorName || 'Sistem',
                    date: audit.updatedAt ? formatDate(audit.updatedAt) : 'Bugün',
                    status: audit.status || 'Bilinmiyor'
                });
            });

            // Son bulguları aktivite olarak ekle
            (Array.isArray(findingsData) ? findingsData : []).slice(0, 3).forEach((finding: any, idx: number) => {
                recentActivities.push({
                    id: `finding-${finding.id || idx}`,
                    action: `Bulgu: ${finding.title || finding.code || 'Güncellendi'}`,
                    user: finding.assignedUser?.displayName || finding.assignedTo || finding.creatorName || 'Müfettiş',
                    date: finding.updated_at ? formatDate(finding.updated_at) : (finding.updatedAt ? formatDate(finding.updatedAt) : 'Bugün'),
                    status: finding.status || 'Açık'
                });
            });

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
            <PageHeader title="Ana Panel" subtitle="Yönetim paneli ve genel işlemler" />
            {/* Header with Refresh */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-sm text-gray-500">Son güncelleme: {lastUpdate}</p>
                </div>
                <RefreshButton onClick={handleRefresh} />
            </div>

            {/* Stats Grid - REAL DATA */}
            <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-4 pb-2 mb-8 overflow-x-auto snap-x hide-scrollbar">
                <StatCard
                    title="Toplam Denetim"
                    value={auditStats.total}
                    subtext={`${auditStats.planned} planlandı`}
                    color="blue"
                    icon={<FileText size={24} />}
                    onClick={() => router.push('/audit/universe')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-blue-500"
                />

                <StatCard
                    title="Devam Eden"
                    value={auditStats.ongoing}
                    subtext="aktif denetim"
                    color="yellow"
                    icon={<Activity size={24} />}
                    onClick={() => router.push('/audit/universe')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-yellow-500"
                />

                <StatCard
                    title="Açık Bulgular"
                    value={findingStats.open}
                    subtext={`${findingStats.critical} kritik`}
                    color="red"
                    icon={<AlertTriangle size={24} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-red-500"
                />

                <StatCard
                    title="Tamamlanan"
                    value={auditStats.completed}
                    subtext={`${findingStats.closed} bulgu kapatıldı`}
                    color="green"
                    icon={<CheckCircle size={24} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-green-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activities Table - REAL DATA */}
                <div className="lg:col-span-2">
                    <div className="card h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <History size={20} className="text-primary" />
                                Son Aktiviteler
                            </h3>
                            <ActionLink href="/audit/logs" variant="primary">Tümünü Gör</ActionLink>
                        </div>

                        <DataTable
                            columns={[
                                {
                                    key: 'action',
                                    header: 'Aktivite / Denetim No',
                                    sortable: true,
                                    render: (item: any) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-700 group-hover/row:text-emerald-700 transition-colors">{String(item.action || '')}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'user',
                                    header: 'Kullanıcı',
                                    sortable: true,
                                    render: (item: any) => (
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold border border-white shadow-sm shrink-0">
                                                {String(item.user || '').split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                                            </div>
                                            <span className="text-sm text-gray-600 group-hover/row:text-gray-800">{String(item.user || '')}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'date',
                                    header: 'Tarih',
                                    sortable: true,
                                    render: (item: any) => <span className="text-gray-500 text-sm font-medium">{String(item.date || '')}</span>
                                },
                                {
                                    key: 'status',
                                    header: 'Durum',
                                    sortable: true,
                                    render: (item: any) => (
                                        <StatusBadge value={item.status} />
                                    )
                                }
                            ]}
                            data={activities}
                            rowKey="id"
                            emptyIcon={History}
                            rowClassName={() => "group/row hover:bg-emerald-50/30 transition-colors"}
                            className="border-none shadow-none"
                        />
                    </div>
                </div>

                {/* Risk Distribution - REAL DATA */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                        <PieChart size={20} className="text-primary" />
                        Bulgu Risk Dağılımı
                    </h3>

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
                </div>
            </div>

            {/* Risk Heatmap Row - NEW */}
            <div className="mt-8">
                <RiskHeatmap units={units} />
            </div>

            {/* Trend Charts & Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Monthly Trend Chart */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-primary" />
                        Aylık Denetim Trendi
                    </h3>
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => {
                            const date = new Date();
                            date.setMonth(date.getMonth() - (5 - i));
                            const monthName = date.toLocaleString('tr-TR', { month: 'long' });
                            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                            // Gerçek veriden aylık dağılım hesaplaması
                            const completed = audits.filter((a: any) => {
                                const d = new Date(a.updatedAt || a.updated_at || a.created_at);
                                return a.status === 'Tamamlandı' && d >= monthStart && d <= monthEnd;
                            }).length;
                            const found = findings.filter((f: any) => {
                                const d = new Date(f.created_at || f.createdAt);
                                return d >= monthStart && d <= monthEnd;
                            }).length;

                            const maxAudit = Math.max(...Array.from({ length: 6 }).map((_, j) => {
                                const md = new Date(); md.setMonth(md.getMonth() - (5 - j));
                                return audits.filter((a: any) => { const d = new Date(a.updatedAt || a.updated_at || a.created_at); return a.status === 'Tamamlandı' && d.getMonth() === md.getMonth() && d.getFullYear() === md.getFullYear(); }).length;
                            }), 1);
                            const maxFinding = Math.max(...Array.from({ length: 6 }).map((_, j) => {
                                const md = new Date(); md.setMonth(md.getMonth() - (5 - j));
                                return findings.filter((f: any) => { const d = new Date(f.created_at || f.createdAt); return d.getMonth() === md.getMonth() && d.getFullYear() === md.getFullYear(); }).length;
                            }), 1);

                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="w-16 text-sm text-gray-500">{monthName}</span>
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${(completed / maxAudit) * 100}%` }} />
                                        </div>
                                        <span className="text-sm font-medium w-6">{completed}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className="h-full bg-red-400 rounded-full transition-all duration-1000" style={{ width: `${(found / maxFinding) * 100}%` }} />
                                        </div>
                                        <span className="text-sm font-medium w-6">{found}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex justify-center gap-6 mt-4 text-sm">
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500" /> Tamamlanan Denetim</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-400" /> Açılan Bulgu</span>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Zap size={20} className="text-primary" />
                        Performans Göstergeleri
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                            <div className="text-3xl font-bold text-blue-700">
                                %{auditStats.total > 0 ? Math.round((auditStats.completed / auditStats.total) * 100) : 0}
                            </div>
                            <div className="text-sm text-blue-600">Denetim Tamamlama Oranı</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                            <div className="text-3xl font-bold text-green-700">
                                %{findingStats.total > 0 ? Math.round((findingStats.closed / findingStats.total) * 100) : 0}
                            </div>
                            <div className="text-sm text-green-600">Bulgu Kapatma Oranı</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                            <div className="text-3xl font-bold text-orange-700">
                                {(() => {
                                    const completedAudits = audits.filter((a: any) => a.status === 'Tamamlandı' && a.startDate && a.endDate);
                                    if (completedAudits.length === 0) return '-';
                                    const totalDays = completedAudits.reduce((sum: number, a: any) => {
                                        const start = new Date(a.startDate);
                                        const end = new Date(a.endDate);
                                        return sum + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                    }, 0);
                                    return Math.round(totalDays / completedAudits.length);
                                })()}
                            </div>
                            <div className="text-sm text-orange-600">Ort. Denetim Süresi (Gün)</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                            <div className="text-3xl font-bold text-purple-700">
                                {findingStats.critical + findingStats.high}
                            </div>
                            <div className="text-sm text-purple-600">Yüksek Öncelikli Bulgu</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Son 30 günde kapatılan bulgu</span>
                            <span className="font-bold text-green-600">+{findings.filter(f => {
                                if (!CLOSED_STATUSES.includes(f.status)) return false;
                                const kapanisTarihi = f.closedAt || f.updatedAt;
                                if (!kapanisTarihi) return false;
                                const otuzGunOnce = new Date();
                                otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);
                                return new Date(kapanisTarihi) >= otuzGunOnce;
                            }).length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - REAL DATA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Toplam Denetim"
                    value={auditStats.total}
                    subtext={`${auditStats.planned} planlandı`}
                    color="blue"
                    icon={<FileText size={24} />}
                    onClick={() => router.push('/audit/universe')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-blue-500"
                />

                <StatCard
                    title="Devam Eden"
                    value={auditStats.ongoing}
                    subtext="aktif denetim"
                    color="yellow"
                    icon={<Activity size={24} />}
                    onClick={() => router.push('/audit/universe')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-yellow-500"
                />

                <StatCard
                    title="Açık Bulgular"
                    value={findingStats.open}
                    subtext={`${findingStats.critical} kritik`}
                    color="red"
                    icon={<AlertTriangle size={24} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-red-500"
                />

                <StatCard
                    title="Tamamlanan"
                    value={auditStats.completed}
                    subtext={`${findingStats.closed} bulgu kapatıldı`}
                    color="green"
                    icon={<CheckCircle size={24} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-green-500"
                />
            </div>

            {/* Rest of the content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Sol Taraf: Grafik ve Aktivite Akışı */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Grafik Kartı */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-primary" />
                                    Bulgu Dağılımı (Aylık)
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Bulgu durumlarının aylık trend analizi</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Açık</span>
                                <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>Kapalı</span>
                            </div>
                        </div>

                        {/* Custom Pure CSS Chart (Emlak Katılım Renk Paleti Uyumlu) */}
                        <div className="h-64 flex flex-col justify-between">
                            <div className="flex-1 flex items-end gap-6 md:gap-8 lg:gap-12 px-4 border-b border-gray-100 pb-2">
                                {monthlyChartData.map((d, i) => {
                                    const maxVal = Math.max(...monthlyChartData.map(x => x.open + x.closed));
                                    const openHeight = maxVal > 0 ? (d.open / maxVal) * 100 : 0;
                                    const closedHeight = maxVal > 0 ? (d.closed / maxVal) * 100 : 0;

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                                            <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-20">
                                                    <span className="font-bold">{d.month}</span>: {d.open} Açık, {d.closed} Kapalı
                                                </div>

                                                {/* Açık Bar - Kırmızı */}
                                                <div 
                                                    style={{ height: `${openHeight}%` }} 
                                                    className="w-3 md:w-4 rounded-t-full bg-gradient-to-t from-red-500 to-rose-400 group-hover:brightness-110 transition-all duration-300 shadow-sm"
                                                />
                                                {/* Kapalı Bar - Emlak Katılım Yeşil */}
                                                <div 
                                                    style={{ height: `${closedHeight}%` }} 
                                                    className="w-3 md:w-4 rounded-t-full bg-gradient-to-t from-green-600 to-emerald-500 group-hover:brightness-110 transition-all duration-300 shadow-sm"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 mt-2 group-hover:text-gray-700 transition-colors uppercase tracking-wider">{d.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Son Bulgular Kartı */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-red-500" />
                                    Son Eklenen Bulgular
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Aksiyon takibindeki en güncel tespitler</p>
                            </div>
                            <Link href="/audit/findings" className="btn btn-ghost text-xs hover:bg-slate-100 font-semibold gap-1">
                                Tümünü Gör <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {findings.slice(0, 3).map((finding) => (
                                <div key={finding.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between group hover:bg-slate-50/50 transition-colors rounded-lg px-2 -mx-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${
                                            finding.risk === 'Kritik' ? 'bg-red-600 animate-pulse' :
                                            finding.risk === 'Yüksek' ? 'bg-orange-500' :
                                            finding.risk === 'Orta' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`} />
                                        <div>
                                            <div className="font-bold text-sm text-gray-800 group-hover:text-primary transition-colors">{finding.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{finding.department} • Vade: {new Date(finding.dueDate || '').toLocaleDateString('tr-TR')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            finding.risk === 'Kritik' ? 'bg-red-50 text-red-600' :
                                            finding.risk === 'Yüksek' ? 'bg-orange-50 text-orange-600' :
                                            finding.risk === 'Orta' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {finding.risk}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            finding.status === 'Açık' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                            {finding.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Sistem Logları / Son İşlemler */}
                <div className="card h-full flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Activity size={20} className="text-primary" />
                                    Son İşlem Logları
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Platform genelindeki son kullanıcı izleri</p>
                            </div>
                            <Link href="/audit/logs" className="btn btn-ghost text-xs hover:bg-slate-100 font-semibold gap-1">
                                Tüm Loglar <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {activities.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-slate-100 pl-4 py-1 hover:border-primary transition-all duration-300">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">{log.user}</div>
                                        <div className="text-slate-500 mt-0.5">{log.action || log.status}</div>
                                        <div className="text-[10px] text-gray-400 mt-1 font-medium">
                                            {log.date}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bekleyen İşlemler (Eski Yönetici Görev Paneli) */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-primary" />
                    Bekleyen İşlemler
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Onay Bekleyen Bulgular - Mavi */}
                    <Link href="/audit/findings?status=Onay%20Bekliyor" className="group relative overflow-hidden bg-blue-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <span className="text-4xl font-bold text-white">{findings.filter(f => f.status === 'Onay Bekliyor').length}</span>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Calendar size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-lg text-white mb-1">Onay Bekliyor</h4>
                            <p className="text-blue-100 text-xs mb-4">Gözetim sorumlusu onayı gereken bulgular</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                                Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                            </div>
                        </div>
                    </Link>

                    {/* Aktif Denetimler - Turuncu/Sarı */}
                    <Link href="/audit/audits?status=Devam%20Ediyor" className="group relative overflow-hidden bg-amber-500 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <span className="text-4xl font-bold text-white">{auditStats.ongoing}</span>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <FileText size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-lg text-white mb-1">Aktif Denetim</h4>
                            <p className="text-amber-100 text-xs mb-4">Devam eden denetim faaliyetleri</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                                Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                            </div>
                        </div>
                    </Link>

                    {/* Mutabakat Bekleyen - Mor */}
                    <Link href="/audit/conciliation" className="group relative overflow-hidden bg-purple-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <span className="text-4xl font-bold text-white">{findings.filter(f => f.status === 'Tebliğ Edildi' || f.status === 'Birim Yanıtladı').length}</span>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <FileText size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-lg text-white mb-1">Mutabakat Bekliyor</h4>
                            <p className="text-purple-100 text-xs mb-4">Birim yanıtı beklenen tebliğler</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                                Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                            </div>
                        </div>
                    </Link>

                    {/* Doğrulama/Aksiyon Bekleyen - Kırmızı */}
                    <Link href="/audit/follow-up" className="group relative overflow-hidden bg-rose-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <span className="text-4xl font-bold text-white">{findings.filter(f => f.status === 'Doğrulama Bekliyor').length}</span>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <AlertTriangle size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-lg text-white mb-1">Doğrulama Bekliyor</h4>
                            <p className="text-rose-100 text-xs mb-4">Aksiyon kontrolü yapılacak bulgular</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                                Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <Link href="/audit/audits" className="card hover:shadow-lg transition-shadow cursor-pointer flex items-center gap-3 !py-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800">Denetimler</div>
                        <div className="text-xs text-gray-500">{auditStats.total} kayıt</div>
                    </div>
                </Link>
                <Link href="/audit/findings" className="card hover:shadow-lg transition-shadow cursor-pointer flex items-center gap-3 !py-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800">Bulgular</div>
                        <div className="text-xs text-gray-500">{findingStats.open} açık</div>
                    </div>
                </Link>
                <Link href="/audit/staff" className="card hover:shadow-lg transition-shadow cursor-pointer flex items-center gap-3 !py-4">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800">Personel</div>
                        <div className="text-xs text-gray-500">Ekip yönetimi</div>
                    </div>
                </Link>
                <Link href="/audit/plan" className="card hover:shadow-lg transition-shadow cursor-pointer flex items-center gap-3 !py-4">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800">Denetim Planı</div>
                        <div className="text-xs text-gray-500">Yıllık plan</div>
                    </div>
                </Link>
            </div>
        </>
    );
}
