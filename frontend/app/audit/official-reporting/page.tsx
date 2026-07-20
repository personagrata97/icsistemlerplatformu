'use client';
import { useState, useEffect } from 'react';
import {
    FileBarChart, Download, Calendar, Filter, RefreshCw, CheckCircle,
    AlertTriangle, BarChart3, TrendingUp, Shield, Building2,
    FileText, Printer, Send, ChevronRight, Trash2,
    ShieldCheck, Landmark, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import LoadingState from '@/components/ui/LoadingState';
import PageHeader from '@/components/audit/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import RefreshButton from '@/components/ui/RefreshButton';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';
import ActionMenu from '@/components/ui/ActionMenu';
import Button from '@/components/ui/Button';
import { auditApi } from '@/lib/audit-api';
import { DateDisplay } from '@/components/ui/DateDisplay';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';
import EntityIcon from '@/components/ui/EntityIcon';
import DashboardWidget from '@/components/ui/DashboardWidget';
import { EntityType, ENTITY_CONFIG, getColorClasses } from '@/lib/entity-config';

// Resmi Kurum Raporlama Türleri
const REPORT_TYPES = [
    {
        id: 'annual-activity',
        name: 'Yıllık Faaliyet Raporu',
        description: 'İç denetim faaliyetlerinin yıllık özet raporu',
        entityType: 'ACTIVITY',
        frequency: 'Yıllık'
    },
    {
        id: 'risk-assessment',
        name: 'Risk Değerlendirme Raporu',
        description: 'Kurum geneli risk değerlendirme sonuçları',
        entityType: 'HEATMAP',
        frequency: 'Dönemsel'
    },
    {
        id: 'plan-compliance',
        name: 'Denetim Planı Uyum Raporu',
        description: 'Yıllık denetim planı gerçekleşme oranları',
        entityType: 'AUDIT',
        frequency: 'Çeyreklik'
    },
    {
        id: 'finding-summary',
        name: 'Bulgu Özet Raporu',
        description: 'Denetim bulguları, risk dağılımları ve aksiyon takibi',
        entityType: 'FINDING',
        frequency: 'Aylık'
    },
    {
        id: 'it-audit',
        name: 'Bilgi Sistemleri Denetim Raporu',
        description: 'BT denetimleri ve bilgi güvenliği bulguları',
        entityType: 'USER',
        frequency: 'Yıllık'
    },
    {
        id: 'quality-assurance',
        name: 'Kalite Güvence Raporu',
        description: 'İç ve dış kalite değerlendirme sonuçları',
        entityType: 'REPORT',
        frequency: '5 Yıllık (Dış) / Yıllık (İç)'
    }
];

interface ReportHistory {
    id: string;
    type: string;
    period: string;
    generatedAt: string;
    generatedBy: string;
    status: 'Taslak' | 'Onaylandı' | 'Gönderildi';
    fileSize?: string;
}

import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import { AccessDenied } from '@/components/audit/AuditLogComponents';

export default function OfficialReportingPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const isInspector = hasRole('AUDIT_INSPECTOR');
    const isSupervisor = hasRole('AUDIT_SUPERVISOR');
    const isManager = checkRole(hasRole, ROLES.BASIC_MANAGER) || hasRole('ADMIN');
    const isAuditor = isInspector || isSupervisor || isManager;
    const isUnit = checkRole(hasRole, ROLES.UNIT);

    if (isUnit && !isAuditor) {
        return <AccessDenied />;
    }

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
    const [generatingReport, setGeneratingReport] = useState<string | null>(null);
    const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
    const [sortCol, setSortCol] = useState('generatedAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

    useEffect(() => {
        loadStats(true);
        loadReportHistory();
    }, []);

    const loadReportHistory = async () => {
        try {
            const data = await auditApi.getGeneratedReports();
            setReportHistory(data);
        } catch (error) {
            console.error('Rapor geçmişi yükleme hatası:', error);
        }
    };

    const loadStats = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [execStats, qualityStats] = await Promise.all([
                auditApi.getExecutiveStats().catch(() => null),
                auditApi.getQualityStats().catch(() => null),
            ]);
            setStats({ executive: execStats, quality: qualityStats });
        } catch (error) {
            console.error('İstatistik yükleme hatası:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    const handleGenerateReport = async (reportId: string) => {
        setGeneratingReport(reportId);
        try {
            await auditApi.generateReport(reportId, selectedPeriod);
            showToast('Rapor başarıyla oluşturuldu.', 'success');
            loadReportHistory(); // Refresh history
        } catch (error: any) {
            showToast(error.message || 'Rapor oluşturulurken hata oluştu.', 'error');
        } finally {
            setGeneratingReport(null);
        }
    };

    const handleDownload = async (report: ReportHistory) => {
        try {
            const blob = await auditApi.downloadReport(report.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = report.id + '.pdf'; // Ideally use real filename but this is a fallback
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            showToast(error.message || 'Rapor indirilirken hata oluştu.', 'error');
        }
    };

    const handleDeleteReport = (id: string) => {
        setDeleteReportId(id);
    };

    const confirmDeleteReport = async () => {
        if (!deleteReportId) return;
        try {
            await auditApi.deleteReport(deleteReportId);
            showToast('Rapor başarıyla silindi.', 'success');
            loadReportHistory();
            setDeleteReportId(null);
        } catch (error: any) {
            showToast(error.message || 'Rapor silinirken hata oluştu.', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        return <StatusBadge value={status} />;
    };

    if (loading) return <LoadingState />;

    const totalAudits = stats?.executive?.totalAudits || 0;
    const completedAudits = stats?.executive?.completedAudits || 0;
    const totalFindings = stats?.executive?.totalFindings || 0;
    const openFindings = stats?.executive?.openFindings || 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Yasal ve Kurumsal Raporlama"
                subtitle="Regülasyon kurumları ve üst yönetim için periyodik raporlar"
            />
            <PageToolbar
                noSearch={true}
                onRefresh={() => loadStats(false)}
                filters={
                    <div className="w-[160px]">
                        <CustomSelect
                            value={selectedPeriod}
                            onChange={(val) => setSelectedPeriod(val as string)}
                            options={[
                                { value: '2026', label: '2026' },
                                { value: '2025', label: '2025' },
                                { value: '2024', label: '2024' }
                            ]}
                        />
                    </div>
                }
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Toplam Denetim"
                    value={totalAudits}
                    entityType="AUDIT"
                    subtext={`${completedAudits} tamamlandı`}
                    infoTooltip="Seçili dönem (yıl) içerisindeki onaylanmış toplam denetim sayısıdır."
                    onClick={() => router.push('/audit')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-blue-500"
                />
                <StatCard
                    title="Toplam Bulgu"
                    value={totalFindings}
                    entityType="FINDING"
                    subtext={`${openFindings} açık`}
                    infoTooltip="Dönem içerisindeki denetimlerden elde edilen veya raporlanmış olan toplam bulgu sayısıdır."
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-yellow-500"
                />
                <StatCard
                    title="Oluşturulan Rapor"
                    value={reportHistory.length}
                    entityType="REPORT"
                    subtext="Bu dönem"
                    infoTooltip="Resmi kurumlar için sistem üzerinden otomatik oluşturulmuş ve kaydedilmiş resmi rapor sayısıdır."
                    onClick={() => router.push('/audit/reports')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-emerald-500"
                />
                <StatCard
                    title="Plan Uyum Oranı"
                    value={totalAudits > 0 ? `%${Math.round((completedAudits / totalAudits) * 100)}` : '%0'}
                    entityType="TREND"
                    subtext="Gerçekleşme Oranı"
                    infoTooltip="Yıllık denetim planında yer alan denetimlerden tamamlananların yüzdesel oranıdır."
                    onClick={() => router.push('/audit')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-purple-500"
                />
            </div>

            {/* Report Types Grid */}
            <DashboardWidget
                widgetType="reports"
                title="Mevzuat Uyumlu Rapor Şablonları"
                subtitle="Resmi düzenlemelere uygun standart rapor formatları"
                infoTooltip="BDDK, SPK, KVKK ve TCMB gibi düzenleyici kurumların standartlarına uygun otomatik olarak oluşturulabilen resmi rapor şablonlarını listeler."
                className="mb-8"
            >

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {REPORT_TYPES.map(report => {
                        const isGenerating = generatingReport === report.id;
                        const config = ENTITY_CONFIG[report.entityType as EntityType];
                        const colors = getColorClasses(config.color);

                        return (
                            <div
                                key={report.id}
                                className={`p-5 border rounded-2xl transition-all hover:shadow-md group ${colors.bg} ${colors.border}`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2.5 bg-white/80 rounded-xl shadow-sm">
                                        <EntityIcon type={report.entityType as EntityType} size={22} variant="text-only" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm">{report.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{report.description}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    {/* Regulation and Frequency removed as requested */}
                                </div>

                                <Button
                                    onClick={() => handleGenerateReport(report.id)}
                                    disabled={isGenerating}
                                    variant="secondary"
                                    className="w-full bg-white text-gray-700 border border-gray-200"
                                    leftIcon={isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                                >
                                    {isGenerating ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </DashboardWidget>

            {/* Report History Table */}
            <DashboardWidget
                widgetType="activities"
                title="Rapor Geçmişi"
                subtitle="Oluşturulan ve gönderilen raporlar"
            >

                <DataTable
                    data={reportHistory}
                    sortColumn="generatedAt"
                    sortDirection="desc"
                    rowKey="id"
                    columns={[
                        {
                            key: 'type',
                            header: 'Rapor Türü',
                            sortable: true,
                            render: (report: any) => {
                                const reportTemplate = REPORT_TYPES.find(r => r.name === report.type);
                                const eType = reportTemplate ? reportTemplate.entityType : 'REPORT';
                                return (
                                    <div className="flex items-center gap-2">
                                        <EntityIcon type={eType as EntityType} size={16} variant="text-only" className="opacity-60" />
                                        <span className="text-sm font-medium text-gray-800">{report.type}</span>
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'period',
                            header: 'Dönem',
                            sortable: true,
                            render: (report: any) => (
                                <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded">{report.period}</span>
                            )
                        },
                        {
                            key: 'generatedAt',
                            header: 'Oluşturma Tarihi',
                            sortable: true,
                            type: 'datetime'
                        },
                        {
                            key: 'generatedBy',
                            header: 'Oluşturan',
                            sortable: true,
                            type: 'user'
                        },
                        {
                            key: 'fileSize',
                            header: 'Boyut',
                            sortable: true,
                            type: 'filesize'
                        },
                        {
                            key: 'status',
                            header: 'Durum',
                            sortable: true,
                            type: 'status'
                        },
                        {
                            key: 'actions',
                            header: 'İşlemler',
                            align: 'center',
                            width: '180px',
                            render: (report: any) => (
                                <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="secondary" size="sm" onClick={() => handleDownload(report)} className="px-3 whitespace-nowrap">İndir</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteReport(report.id)} className="px-3">Sil</Button>
                                </div>
                            )
                        }
                    ]}
                    className="border-none shadow-none"
                />

                {reportHistory.length === 0 && (
                    <EmptyState
                        entityType="REPORT"
                        title="Henüz rapor oluşturulmamış"
                        description="Yukarıdaki şablonlardan birini kullanarak ilk raporunuzu oluşturun."
                    />
                )}
            </DashboardWidget>

            <ConfirmModal
                isOpen={!!deleteReportId}
                onClose={() => setDeleteReportId(null)}
                onConfirm={confirmDeleteReport}
                title="Raporu Sil"
                message="Bu rapor kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                type="danger"
            />
        </div>
    );
}
