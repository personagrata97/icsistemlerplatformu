'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, FileText, Download, MoreVertical, Eye, Share2, Printer, Archive, Trash2, CheckCircle, Clock, AlertTriangle, FileBarChart, Shield, Activity, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuditHeader from '@/components/audit/AuditHeader';
import StatCard from '@/components/ui/StatCard';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import PageHeader from '@/components/audit/PageHeader';
import ReportGenerationModal from '@/components/audit/ReportGenerationModal';
import Pagination from '@/components/ui/Pagination';
import RefreshButton from '@/components/ui/RefreshButton';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import DataTable from '@/components/ui/DataTable';
import ActionMenu from '@/components/ui/ActionMenu';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';

interface ReportStats {
    totalAudits: number;
    completedAudits: number;
    openFindings: number;
    closedFindings: number;
    criticalFindings: number;
    avgDuration: number;
}

export default function ReportsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReportStats>({
        totalAudits: 0,
        completedAudits: 0,
        openFindings: 0,
        closedFindings: 0,
        criticalFindings: 0,
        avgDuration: 0
    });
    const [generatedReports, setGeneratedReports] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState<string>('generatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const itemsPerPage = 10;

    const REPORT_TYPE_LABELS: Record<string, string> = {
        'Faaliyet Raporu': 'Faaliyet Raporu',
        'activity': 'Faaliyet Raporu',
        'annual-activity': 'Yıllık Faaliyet Raporu',
        'Denetim Komitesi Sunumu': 'Denetim Komitesi Sunumu',
        'Yönetim Kurulu Raporu': 'Yönetim Kurulu Raporu',
        'board': 'Yönetim Kurulu Raporu',
        'Bulgu Özeti': 'Bulgu Özeti Raporu',
        'finding-summary': 'Bulgu Özeti Raporu',
        'Bulgu Yaşlandırma': 'Bulgu Yaşlandırma Raporu',
        'finding-aging': 'Bulgu Yaşlandırma Raporu',
        'Risk Matrisi': 'Denetim Evreni Risk Matrisi',
        'risk-assessment': 'Risk Değerlendirme Raporu',
        'risk-matrix': 'Risk Matrisi',
        'Denetim Planı İlerleme': 'Plan İlerleme Raporu',
        'plan-progress': 'Plan İlerleme Raporu',
        'audit_docx': 'Denetim Raporu (Word)',
    };

    /** Veritabanındaki İngilizce rapor başlığını Türkçeye çevirir ve çift 'Raporu' kelimesini engeller */
    const translateTitle = (title: string): string => {
        let translated = title;
        for (const [eng, tr] of Object.entries(REPORT_TYPE_LABELS)) {
            if (title.toLowerCase().startsWith(eng.toLowerCase())) {
                translated = title.replace(new RegExp(`^${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), tr);
                break;
            }
        }
        // "Raporu Raporu" tekrarını temizle
        return translated.replace(/Raporu\s+Raporu/gi, 'Raporu');
    };

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };



    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reports, statsData] = await Promise.all([
                auditApi.getGeneratedReports(),
                auditApi.getExecutiveStats()
            ]);

            setGeneratedReports(Array.isArray(reports) ? reports : []);

            setStats({
                totalAudits: statsData.totalAudits || 0,
                completedAudits: statsData.completedAudits || 0,
                openFindings: statsData.openFindings || 0,
                closedFindings: (statsData.totalFindings || 0) - (statsData.openFindings || 0),
                criticalFindings: statsData.criticalFindings || 0,
                avgDuration: statsData.avgDuration || 0
            });

        } catch (error) {
            console.error('Rapor verisi yükleme hatası:', error);
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (id: string, fileName: string) => {
        try {
            showToast('Rapor indiriliyor...', 'info');
            const blob = await auditApi.downloadReport(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            showToast('İndirme başarısız', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Raporlar"
                subtitle="Oluşturulan tüm denetim, risk ve faaliyet raporlarının merkezi arşivi"
            />

            {/* Stats Cards - Dashboard Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-2">
                <StatCard
                    title="Toplam Denetim"
                    value={stats.totalAudits}
                    color="blue"
                    icon={<FileBarChart size={20} />}
                    onClick={() => router.push('/audit')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-blue-500"
                />
                <StatCard
                    title="Tamamlanan"
                    value={stats.completedAudits}
                    color="green"
                    icon={<CheckCircle size={20} />}
                    subtext={`%${stats.totalAudits > 0 ? Math.round((stats.completedAudits / stats.totalAudits) * 100) : 0} Tamamlanma`}
                    onClick={() => router.push('/audit')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-green-500"
                />
                <StatCard
                    title="Açık Bulgu"
                    value={stats.openFindings}
                    color="yellow"
                    icon={<AlertTriangle size={20} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-yellow-500"
                />
                <StatCard
                    title="Kapalı Bulgu"
                    value={stats.closedFindings}
                    color="emerald"
                    icon={<Shield size={20} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-emerald-500"
                />
                <StatCard
                    title="Kritik Risk"
                    value={stats.criticalFindings}
                    color="rose"
                    icon={<Activity size={20} />}
                    onClick={() => router.push('/audit/findings')}
                    className="transition-all hover:scale-[1.02] cursor-pointer hover:ring-2 hover:ring-rose-500"
                />

                <StatCard
                    title="Ortalama Süre"
                    value={`${stats.avgDuration || 0} Gün`}
                    color="purple"
                    icon={<Activity size={20} />}
                />
            </div>

            {/* Standardized Toolbar */}
            <PageToolbar
                searchPlaceholder="Rapor ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showAddButton={true}
                onAddClick={() => setIsGenerateModalOpen(true)}
                addButtonText="Yeni Rapor Oluştur"
                rightActions={
                    <Button variant="secondary" leftIcon={<FileBarChart size={18} />} onClick={() => {
                        // Faaliyet raporu oluşturma
                        setIsGenerateModalOpen(true);
                    }}>Faaliyet Raporu</Button>
                }
            />

            {/* Generated Reports History Table - Standardized */}
            <DataTable
                columns={[
                    {
                        key: 'title',
                        header: 'Rapor Adı',
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                    <FileText size={18} />
                                </div>
                                <span className="font-medium text-gray-900">{translateTitle(item.title)}</span>
                            </div>
                        )
                    },
                    {
                        key: 'type',
                        header: 'Tür',
                        sortable: true,
                        render: (item: any) => (
                            <span className="bg-gray-100 text-gray-700 py-1 px-2.5 rounded text-xs font-medium border border-gray-200">
                                {REPORT_TYPE_LABELS[item.type] || item.type}
                            </span>
                        )
                    },
                    {
                        key: 'period',
                        header: 'Dönem',
                        sortable: true,
                        render: (item: any) => <span className="font-mono text-gray-600">{item.period}</span>
                    },
                    {
                        key: 'generatedBy',
                        header: 'Oluşturan',
                        type: 'user'
                    },
                    {
                        key: 'generatedAt',
                        header: 'Tarih',
                        type: 'datetime',
                        sortable: true
                    },
                    {
                        key: 'actions',
                        header: '',
                        width: '60px',
                        align: 'right',
                        render: (item: any) => (
                            <ActionMenu
                                items={[
                                    {
                                        label: 'Raporu İndir',
                                        icon: Download,
                                        onClick: () => handleDownloadReport(item.id, item.filePath || 'rapor.pdf')
                                    }
                                ]}
                            />
                        )
                    }
                ]}
                data={generatedReports.filter((item: any) => 
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.generatedBy && item.generatedBy.toLowerCase().includes(searchTerm.toLowerCase()))
                )}
                loading={loading}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
                paginated={true}
                itemsPerPage={itemsPerPage}
                itemUnit="rapor"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                emptyIcon={FileText}
                emptyTitle="Henüz Rapor Yok"
                emptyDescription="Sistemde henüz oluşturulmuş bir rapor kaydı bulunmuyor."
            />

            <ReportGenerationModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                onGenerate={loadData}
            />
        </div>
    );
}
