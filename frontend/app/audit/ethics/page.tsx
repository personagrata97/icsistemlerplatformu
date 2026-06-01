'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Eye, ChevronDown, Download, RefreshCw, Plus, X, Edit2, MessageSquare, ExternalLink, UserPlus, LayoutDashboard, List, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { useToast } from '@/components/Toast';
import { useSearchParams } from 'next/navigation';
import { getRiskColor, formatDate } from '@/lib/audit-utils';
import { auditApi } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import CreateEthicsReportModal from '@/components/audit/modals/CreateEthicsReportModal';
import ViewEthicsReportModal from '@/components/audit/modals/ViewEthicsReportModal';
import AssignEthicsAdvisorModal from '@/components/audit/modals/AssignEthicsAdvisorModal';
import EthicsDashboard from '@/components/audit/EthicsDashboard';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import { useAuditTitle } from '@/context/AuditTitleContext';
import LoadingState from '@/components/ui/LoadingState';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import UserCell from '@/components/ui/UserCell';

interface EthicsReport {
    id: string;
    type: string;
    source: string;
    date: string;
    status: 'Yeni' | 'İnceleniyor' | 'Kapatıldı';
    priority: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';
    description?: string;
    reporter?: string;
    trackingCode?: string;
    slaDeadline?: string;
    created_at?: string;
    assignee?: { id: string; displayName: string; title?: string };
}

// SLA calculation helper
const getSlaStatus = (item: EthicsReport) => {
    if (!item.slaDeadline || item.status === 'Kapatıldı') return null;
    const deadline = new Date(item.slaDeadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} Gün Gecikti`, color: 'text-red-600', isOverdue: true };
    if (diffDays <= 3) return { text: `${diffDays} Gün Kaldı`, color: 'text-amber-600', isOverdue: false };
    return { text: `${diffDays} Gün Kaldı`, color: 'text-green-600', isOverdue: false };
};

const TYPE_MAP: Record<string, string> = {
    'Cikar': 'Çıkar Çatışması',
    'Soruşturma': 'Soruşturma',
    'Inceleme': 'İnceleme',
    'Diger': 'Diğer',
    'Yolsuzluk': 'Yolsuzluk',
    'Mevzuat': 'Mevzuat İhlali',
    'Genel Sikayet': 'Genel Şikayet'
};

const SOURCE_MAP: Record<string, string> = {
    'Public Web': 'Açık Web',
    'Internal Portal': 'İç Portal',
    'E-posta': 'E-posta',
    'Yüz Yüze': 'Yüz Yüze',
    'Web Form': 'Web Formu',
    'Manuel Giriş': 'Manuel Giriş',
};

export default function EthicsPage() {
    const { setTitle, setSubtitle } = useAuditTitle();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterPriority, setFilterPriority] = useState<string[]>([]);
    const [filterOverdue, setFilterOverdue] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<EthicsReport | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [items, setItems] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        setTitle('Etik Bildirim Hattı');
        setSubtitle('Etik ihlal bildirimleri ve inceleme süreçleri');
        loadData();
    }, []);

    // URL parametrelerini doğrudan bağlantı için işle
    const searchParams = useSearchParams();
    const linkedId = searchParams.get('id');

    useEffect(() => {
        if (linkedId && items.length > 0) {
            const linkedReport = items.find(item => item.id === linkedId || item.trackingCode === linkedId);
            if (linkedReport) {
                // Determine if we should switch to list view or just open modal
                // Let's just open the modal, user can see background
                setSelectedItem(linkedReport);
                setShowViewModal(true);
                // Optional: Scroll to item or switch view? 
                // Creating a seamless experience:
                if (viewMode !== 'list') setViewMode('list');
            }
        }
    }, [linkedId, items]);

    const loadData = async (showOverlay = true) => {
        try {
            if (showOverlay) setLoading(true);
            const [reportsData, statsData] = await Promise.all([
                auditApi.getEthicsReports(),
                auditApi.getEthicsStats()
            ]);
            setItems(reportsData);
            setStats(statsData);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReport = async (data: any, files: File[]) => {
        try {
            const report = await auditApi.createEthicsReport({
                ...data,
                source: data.source || 'Manuel Giriş'
            });

            if (files && files.length > 0 && report.trackingCode) {
                // Upload files one by one
                for (const file of files) {
                    try {
                        await auditApi.uploadEthicsEvidence(report.trackingCode, file);
                    } catch (uploadError) {
                        console.error('File upload failed', uploadError);
                        showToast(`${file.name} yüklenemedi`, 'warning');
                    }
                }
            }

            showToast('Bildirim eklendi', 'success');
            loadData();
            return report;
        } catch (error) {
            showToast('Bildirim eklenirken hata oluştu', 'error');
            throw error;
        }
    };

    const handleView = (item: EthicsReport) => {
        setSelectedItem(item);
        setShowViewModal(true);
    };

    const handleStatusChange = async (item: any, newStatus: string) => {
        try {
            await auditApi.updateEthicsReport(item.id, newStatus);
            showToast(`Durum güncellendi: ${newStatus}`, 'success');
            loadData();
        } catch (error) {
            showToast('Durum güncellerken hata oluştu', 'error');
        }
    };

    const clearFilters = () => {
        setFilterStatus([]);
        setFilterPriority([]);
        setFilterOverdue(false);
        setSearchTerm('');
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.type.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            item.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(item.status);
        const matchesPriority = filterPriority.length === 0 || filterPriority.includes(item.priority);
        
        const sla = getSlaStatus(item);
        const matchesOverdue = !filterOverdue || !!sla?.isOverdue;

        return matchesSearch && matchesStatus && matchesPriority && matchesOverdue;
    });

    // DİNAMİK SCORECARD SAYILARI - DİĞER FİLTRELERLE UYUMLU ENTEGRE
    const activeOpenCount = items.filter(item => {
        const matchesSearch = item.type.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            item.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesPriority = filterPriority.length === 0 || filterPriority.includes(item.priority);
        const sla = getSlaStatus(item);
        const matchesOverdue = !filterOverdue || !!sla?.isOverdue;
        return matchesSearch && matchesPriority && matchesOverdue && item.status === 'Yeni';
    }).length;

    const activeInvestigatingCount = items.filter(item => {
        const matchesSearch = item.type.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            item.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesPriority = filterPriority.length === 0 || filterPriority.includes(item.priority);
        const sla = getSlaStatus(item);
        const matchesOverdue = !filterOverdue || !!sla?.isOverdue;
        return matchesSearch && matchesPriority && matchesOverdue && item.status === 'İnceleniyor';
    }).length;

    const activeClosedCount = items.filter(item => {
        const matchesSearch = item.type.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            item.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesPriority = filterPriority.length === 0 || filterPriority.includes(item.priority);
        const sla = getSlaStatus(item);
        const matchesOverdue = !filterOverdue || !!sla?.isOverdue;
        return matchesSearch && matchesPriority && matchesOverdue && item.status === 'Kapatıldı';
    }).length;

    const activeOverdueCount = items.filter(item => {
        const matchesSearch = item.type.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            item.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesPriority = filterPriority.length === 0 || filterPriority.includes(item.priority);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(item.status);
        const sla = getSlaStatus(item);
        return matchesSearch && matchesPriority && matchesStatus && !!sla?.isOverdue;
    }).length;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterPriority, filterOverdue]);

    return (
        <>
            <CreateEthicsReportModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddReport}
            />

            <ViewEthicsReportModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                report={selectedItem}
                onStatusChange={handleStatusChange}
                onRefresh={loadData}
            />

            {loading && items.length === 0 && <LoadingState fullscreen message="Etik bildirimleri yükleniyor..." />}

            {/* View Switcher at the top level */}
            <div className="mb-4">
                <SegmentedTabs
                    tabs={[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'list', label: 'Liste', icon: List }
                    ]}
                    activeTab={viewMode}
                    onChange={(id) => setViewMode(id as 'list' | 'dashboard')}
                />
            </div>

            {/* Content Area */}
            {viewMode === 'dashboard' && stats ? (
                <EthicsDashboard stats={stats} />
            ) : (
                /* List View Content */
                <div className="space-y-6">
                    {/* Basic KPI Cards for List View - DYNAMIC & INTERACTIVE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                        <StatCard
                            title="Açık (Yeni)"
                            value={activeOpenCount}
                            color="red"
                            icon={<AlertTriangle size={20} />}
                            onClick={() => {
                                if (filterStatus.includes('Yeni')) {
                                    setFilterStatus(filterStatus.filter(s => s !== 'Yeni'));
                                } else {
                                    setFilterStatus([...filterStatus, 'Yeni']);
                                }
                            }}
                            className={filterStatus.includes('Yeni') ? 'ring-2 ring-red-500 border-red-500 bg-red-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                        />
                        <StatCard
                            title="İnceleniyor"
                            value={activeInvestigatingCount}
                            color="blue"
                            icon={<Search size={20} />}
                            onClick={() => {
                                if (filterStatus.includes('İnceleniyor')) {
                                    setFilterStatus(filterStatus.filter(s => s !== 'İnceleniyor'));
                                } else {
                                    setFilterStatus([...filterStatus, 'İnceleniyor']);
                                }
                            }}
                            className={filterStatus.includes('İnceleniyor') ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                        />
                        <StatCard
                            title="Kapatılan"
                            value={activeClosedCount}
                            color="green"
                            icon={<CheckCircle size={20} />}
                            onClick={() => {
                                if (filterStatus.includes('Kapatıldı')) {
                                    setFilterStatus(filterStatus.filter(s => s !== 'Kapatıldı'));
                                } else {
                                    setFilterStatus([...filterStatus, 'Kapatıldı']);
                                }
                            }}
                            className={filterStatus.includes('Kapatıldı') ? 'ring-2 ring-green-500 border-green-500 bg-green-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                        />
                        <StatCard
                            title="Geciken"
                            value={activeOverdueCount}
                            color="purple"
                            icon={<AlertTriangle size={20} />}
                            onClick={() => setFilterOverdue(!filterOverdue)}
                            className={filterOverdue ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                        />
                    </div>

                    <PageToolbar
                        searchPlaceholder="Bildirim ara..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onRefresh={() => loadData(false)}
                        showAddButton={true}
                        onAddClick={() => setShowAddModal(true)}
                        addButtonText="Manuel Bildirim Ekle"
                        showExportButton={true}
                        onExportClick={() => { auditApi.exportToExcel(items, 'Etik_Hatti_Bildirimleri'); showToast('Etik bildirimleri dışa aktarıldı', 'success'); }}
                        filters={
                            <FilterDropdown
                                activeCount={filterStatus.length + filterPriority.length}
                                onClear={clearFilters}
                            >
                                <CustomSelect
                                    label="Durum"
                                    value={filterStatus}
                                    onChange={(v) => setFilterStatus(v as string[])}
                                    options={[
                                        { value: 'Yeni', label: 'Yeni' },
                                        { value: 'İnceleniyor', label: 'İnceleniyor' },
                                        { value: 'Kapatıldı', label: 'Kapatıldı' }
                                    ]}
                                    placeholder="Durum Seçiniz"
                                    isMulti
                                />
                                <CustomSelect
                                    label="Öncelik"
                                    value={filterPriority}
                                    onChange={(v) => setFilterPriority(v as string[])}
                                    options={[
                                        { value: 'Kritik', label: 'Kritik' },
                                        { value: 'Yüksek', label: 'Yüksek' },
                                        { value: 'Orta', label: 'Orta' },
                                        { value: 'Düşük', label: 'Düşük' }
                                    ]}
                                    placeholder="Öncelik Seçiniz"
                                    isMulti
                                />
                            </FilterDropdown>
                        }
                    />

                    <DataTable
                        columns={[
                            {
                                key: 'type',
                                header: 'Bildirim Konusu',
                                sortable: true,
                                render: (item: any) => (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/5 text-primary rounded-lg shrink-0">
                                            <MessageSquare size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-semibold line-clamp-1">{TYPE_MAP[item.type] || item.type}</span>
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{item.trackingCode || 'NO-CODE'}</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'source',
                                header: 'Kaynak',
                                sortable: true,
                                width: '150px',
                                render: (item: any) => {
                                    const srcName = item.source || 'Web Form';
                                    return <span className="text-gray-600 font-medium">{SOURCE_MAP[srcName] || srcName}</span>;
                                }
                            },
                            {
                                key: 'date',
                                header: 'Tarih / Süre',
                                sortable: true,
                                width: '180px',
                                render: (item: any) => {
                                    const sla = getSlaStatus(item);
                                    return (
                                        <div className="flex flex-col">
                                            <div className="cell-date mb-0.5">
                                                <Calendar size={14} className="text-gray-400 shrink-0" />
                                                {item.created_at ? formatDate(item.created_at) : (item.date || '-')}
                                            </div>
                                            {sla && (
                                                <span className={`text-[10px] font-bold ${sla.color}`}>
                                                    {sla.text}
                                                </span>
                                            )}
                                        </div>
                                    );
                                }
                            },
                            {
                                key: 'assignee',
                                header: 'Sorumlu',
                                sortable: true,
                                width: '180px',
                                render: (item: any) => (
                                    <UserCell name={item.assignee?.displayName || 'Atama Bekliyor'} className="!w-auto text-xs" />
                                )
                            },
                            {
                                key: 'priority',
                                header: 'Öncelik',
                                sortable: true,
                                type: 'risk',
                                width: '120px',
                                render: (item: any) => <StatusBadge type="risk" value={item.priority === 'Düşük' ? 'Düşük' : item.priority} />
                            },
                            {
                                key: 'status',
                                header: 'Durum',
                                sortable: true,
                                width: '150px',
                                render: (item: any) => <StatusBadge type="status" value={item.status} />
                            },
                            {
                                key: 'actions',
                                header: 'İşlemler',
                                width: '150px',
                                align: 'center',
                                render: (item: any) => (
                                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                        <ActionMenu
                                            items={[
                                                { label: 'Detayı İncele', icon: Eye, onClick: () => handleView(item) }
                                            ]}
                                        />
                                    </div>
                                )
                            }
                        ]}
                        data={filteredItems}
                        loading={loading}
                        rowKey="id"
                        paginated={true}
                        itemsPerPage={itemsPerPage}
                        itemUnit="bildirim"
                        emptyIcon={MessageSquare}
                        emptyTitle="Bildirim Bulunamadı"
                        emptyDescription="Arama kriterlerinize uygun veya sistemde kayıtlı bir etik bildirim bulunmuyor."
                        className="shadow-sm border border-gray-100"
                        searchTerm={searchTerm}
                        onClearFilters={() => {
                            setSearchTerm('');
                            setFilterStatus([]);
                            setFilterPriority([]);
                        }}
                    />
                </div>
            )}

            <AssignEthicsAdvisorModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                reportId={selectedItem?.id || null}
                currentAssigneeId={selectedItem?.assignee?.id} // Assuming assignee object has id, adapt if needed
                onAssign={loadData}
            />
        </>
    );
}
