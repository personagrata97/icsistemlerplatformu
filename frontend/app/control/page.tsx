'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import DashboardWidget from '@/components/ui/DashboardWidget';
import DashboardListItem from '@/components/ui/DashboardListItem';
import EntityIcon from '@/components/ui/EntityIcon';
import { DateDisplay } from '@/components/ui/DateDisplay';
import ExecutiveActionCards from '@/components/audit/ExecutiveActionCards';
import { 
    Layers, FileCheck, CheckCircle2, Sliders, 
    ShieldCheck, AlertOctagon, Users, BookOpen, 
    Plus, Activity, Target, Shield, Award, BarChart3, TrendingUp, Cpu,
    Clock, AlertTriangle, ArrowRight, RefreshCw, FileText
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDateTime } from '@/lib/audit-utils';
import { useRouter } from 'next/navigation';

function PharosControlDashboardContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [selectedYear, setSelectedYear] = useState('Tümü');
    const [lastUpdate, setLastUpdate] = useState<string>(formatDateTime(new Date()));

    const availableYears = [
        { value: 'Tümü', label: 'Tüm Yıllar' },
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' }
    ];

    const handleRefresh = () => {
        setLastUpdate(formatDateTime(new Date()));
        showToast('İç Kontrol verileri başarıyla güncellendi', 'success');
    };

    const actionCards = [
        { id: '1', title: 'Bekleyen Öz Değerlendirmeler', count: 3, label: 'İnceleme Bekliyor', color: 'border-l-amber-500 bg-amber-50/40 text-amber-900', href: '/control/rcsa' },
        { id: '2', title: 'Devam Eden Kontrol Testleri', count: 6, label: 'Saha Çalışmasında', color: 'border-l-blue-500 bg-blue-50/40 text-blue-900', href: '/control/testing' },
        { id: '3', title: 'Yüksek Öncelikli Eksiklikler', count: 4, label: 'Aksiyon Planında', color: 'border-l-rose-500 bg-rose-50/40 text-rose-900', href: '/control/deficiencies' },
        { id: '4', title: 'Termini Yaklaşan Aksiyonlar', count: 8, label: '15 Gün İçinde', color: 'border-l-purple-500 bg-purple-50/40 text-purple-900', href: '/control/deficiencies' }
    ];

    const recentTests = [
        { id: 'TST-2026-089', title: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü', code: 'KNT-KRE-001', status: 'ETKİN', date: '2026-07-15' },
        { id: 'TST-2026-090', title: 'Müşteri İzin Formu Girişi ve Onay Kontrolü', code: 'KNT-KVKK-008', status: 'GELİŞİME_AÇIK', date: '2026-07-10' },
        { id: 'TST-2026-091', title: 'Gün Sonu Genel Muhasebe Mutabakatı', code: 'KNT-MUH-012', status: 'ETKİN', date: '2026-07-21' },
    ];

    const recentDeficiencies = [
        { id: 'EKS-2026-001', title: 'Müşteri Kimlik Doğrulama Formlarında İkinci Onay Eksikliği', code: 'KNT-KVKK-008', status: 'AKSIYONDA', date: '2026-08-15' },
        { id: 'EKS-2026-002', title: 'Hazine Gün Sonu Pozisyon Limit Kontrolünde Manuel Gecikme', code: 'KNT-HZ-004', status: 'GÖZDEN_GEÇİRMEDE', date: '2026-08-30' },
    ];

    return (
        <div className="space-y-6">
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
                    basePath="/control"
                    pendingApprovals={3}
                    ongoingAudits={6}
                    pendingNotifications={4}
                    pendingVerification={3}
                    pendingRevisions={1}
                    overdueActionsCount={1}
                    dueSoonActionsCount={4}
                />
            </DashboardWidget>

            {/* 2. SATIR: Performans & KPI Metrikleri */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardWidget widgetType="metrics" className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 h-[calc(100%-3rem)]">
                        <StatCard
                            title="Kontrol Etkinlik Oranı"
                            value="%88"
                            color="green"
                            infoTooltip="Yapılan testler sonucunda tasarımı ve işletimi uygun bulunan kontroller. Hedef: %90"
                        />
                        <StatCard
                            title="KÖD Tamamlama Oranı"
                            value="%94"
                            color="blue"
                            infoTooltip="İş birimlerinin zamanında tamamladığı Birim Öz Değerlendirme oranı. Hedef: %95"
                        />
                        <StatCard
                            title="Ort. Test Tamamlama Süresi"
                            value="8 İş Günü"
                            color="orange"
                            infoTooltip="Saha kontrol testlerinin ortalama yürütülme süresi"
                        />
                        <StatCard
                            title="Yüksek Öncelikli Eksiklik"
                            value="4"
                            color="purple"
                            infoTooltip="Aksiyon takibi devam eden kritik ve yüksek seviyeli kontrol eksiklikleri"
                        />
                    </div>
                </DashboardWidget>

                {/* Risk & Öncelik Dağılım Widget'ı */}
                <DashboardWidget 
                    widgetType="risk"
                    infoTooltip="Tespit edilen kontrol eksikliklerinin önem derecesine göre oransal dağılımı"
                >
                    <div className="space-y-4">
                        {[
                            { label: 'Yüksek Önem', count: 4, colorClass: 'bg-rose-600', percent: 35 },
                            { label: 'Orta Önem', count: 6, colorClass: 'bg-amber-500', percent: 45 },
                            { label: 'Düşük Önem', count: 2, colorClass: 'bg-emerald-500', percent: 20 },
                        ].map((item) => (
                            <div 
                                key={item.label} 
                                className="cursor-pointer hover:bg-slate-50 p-1.5 -mx-1 rounded transition-colors"
                                onClick={() => router.push('/control/deficiencies')}
                            >
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 font-medium">{item.label}</span>
                                    <span className="font-bold font-mono text-slate-900">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${item.colorClass}`}
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Toplam Açık Eksiklik</span>
                        <span className="font-bold text-lg font-mono text-slate-900">12</span>
                    </div>
                </DashboardWidget>
            </div>

            {/* 3. SATIR: Son Kontrol Testleri & Aksiyon Listeleri */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardWidget 
                    title="Son Kontrol Testleri" 
                    subtitle="Denetçiler tarafından yürütülen son etkinlik testleri" 
                    widgetType="audits" 
                    actionHref="/control/testing" 
                    actionLabel="Tüm Testlere Git"
                >
                    {recentTests.map(t => (
                        <DashboardListItem
                            key={t.id}
                            icon={<EntityIcon type="AUDIT" variant="solid" size={16} />}
                            title={t.title}
                            subtitle={<span className="text-xs text-slate-500 font-mono">Kod: {t.code} • Tarih: {t.date}</span>}
                            rightContent={<StatusBadge value={t.status} type="status" />}
                        />
                    ))}
                </DashboardWidget>

                <DashboardWidget 
                    title="Aksiyondaki Kontrol Eksiklikleri" 
                    subtitle="Düzeltici aksiyon planı yürürlükte olan kayıtlar" 
                    widgetType="findings" 
                    actionHref="/control/deficiencies" 
                    actionLabel="Tüm Eksikliklere Git"
                >
                    {recentDeficiencies.map(d => (
                        <DashboardListItem
                            key={d.id}
                            href="/control/deficiencies"
                            code={d.id}
                            title={d.title}
                            subtitle={<span className="text-xs text-slate-500">Hedef Termin: <DateDisplay date={d.date} /></span>}
                            status={d.status}
                        />
                    ))}
                </DashboardWidget>
            </div>
        </div>
    );
}


export default function PharosControlDashboard() {
    return (
        <RequireRole allowedRoles={['DENETCI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <PharosControlDashboardContent />
        </RequireRole>
    );
}
