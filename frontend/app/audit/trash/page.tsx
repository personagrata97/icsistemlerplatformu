'use client';

import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Loader2, FileText, AlertCircle, X, ShieldX, Calendar, Search, Filter, RefreshCw, ChevronDown, User, Eye } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import PageToolbar from '@/components/ui/PageToolbar';
import { auditApi } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import { useToast } from '@/components/Toast';
import { getStatusColor, getRiskColor, formatDate, formatDateTime } from '@/lib/audit-utils';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingState from '@/components/ui/LoadingState';
import CustomSelect from '@/components/ui/CustomSelect';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuditTitle } from '@/context/AuditTitleContext';
import Tooltip from '@/components/ui/Tooltip';
import { DateDisplay } from '@/components/ui/DateDisplay';
import Button from '@/components/ui/Button';
import ActionMenu, { ActionMenuItem } from '@/components/ui/ActionMenu';
import DataTable, { Column } from '@/components/ui/DataTable';
import PageHeader from '@/components/audit/PageHeader';
import StatCard from '@/components/ui/StatCard';

interface DeletedItems {
    audits: any[];
    findings: any[];
    documents: any[];
    ethics: any[];
    plans: any[];
}

type TabType = 'all' | 'audits' | 'findings' | 'documents' | 'ethics' | 'plans';

export default function TrashPage() {
    const { showToast } = useToast();
    const { user, hasRole } = useAuth();
    const [loading, setLoading] = useState(true);

    const isManager = hasRole('ADMIN') || hasRole('AUDIT_ADMIN');
    // Data States
    const [deletedItems, setDeletedItems] = useState<DeletedItems>({
        audits: [],
        findings: [],
        documents: [],
        ethics: [],
        plans: []
    });

    // UI States
    const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>([]);
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; type: TabType }>({ isOpen: false, id: '', type: 'all' });
    const [confirmRestore, setConfirmRestore] = useState<{ isOpen: boolean; id: string; type: TabType }>({ isOpen: false, id: '', type: 'all' });
    const [trashSortCol, setTrashSortCol] = useState('');
    const [trashSortDir, setTrashSortDir] = useState<'asc' | 'desc'>('desc');

    // Yetki kontrolü
    const isAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (isAdmin) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    const { setTitle, setSubtitle, refreshTrashCount } = useAuditTitle();

    // Reset secondary filters when record types change
    useEffect(() => {
        // Opsiyonel: Diğer filtreleri sıfırla veya koru? Korumak daha iyi kullanıcı deneyimi.
        // Ama önceki davranışla tutarlılık için:
        // setTypeFilter([]);
        // setStatusFilter([]);
    }, [selectedRecordTypes]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [audits, findings, plans, ethics, documents] = await Promise.all([
                auditApi.getDeletedAudits().catch(() => []),
                auditApi.getDeletedFindings().catch(() => []),
                auditApi.getDeletedPlans().catch(() => []),
                auditApi.getDeletedEthics().catch(() => []),
                auditApi.getDeletedDocuments().catch(() => [])
            ]);

            setDeletedItems({
                audits: Array.isArray(audits) ? audits : [],
                findings: Array.isArray(findings) ? findings : [],
                plans: Array.isArray(plans) ? plans : [],
                ethics: Array.isArray(ethics) ? ethics : [],
                documents: Array.isArray(documents) ? documents : []
            });
        } catch (error) {
            console.error('Çöp kutusu yükleme hatası:', error);
            showToast('Silinen kayıtlar yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = (id: string, type: TabType) => {
        // YETKİ KONTROLÜ: Yalnızca Admin geri yükleyebilir
        if (!hasRole('ADMIN')) {
            showToast('Bu işlem için "Yönetici" yetkisine sahip olmalısınız.', 'error');
            return;
        }
        setConfirmRestore({ isOpen: true, id, type });
    };

    const confirmRestoreAction = async () => {
        const { id, type } = confirmRestore;
        if (type === 'all' || !id) return;
        try {
            // Genel geri yükleme endpoint'i veya spesifik eşleştirme varsayılıyor
            switch (type) {
                case 'audits': await auditApi.restoreAudit(id); break;
                case 'findings': await auditApi.restoreFinding(id); break;
                case 'documents': await auditApi.restoreDocument(id); break;
                case 'ethics': await auditApi.restoreEthics(id); break;
                case 'plans': await auditApi.restorePlan(id); break;
                default: throw new Error(`Bilinmeyen geri yükleme türü: ${type}`);
            }

            setDeletedItems(prev => ({
                ...prev,
                [type]: prev[type].filter(i => i.id !== id)
            }));
            showToast('Öğe başarıyla geri yüklendi', 'success');
            refreshTrashCount();
        } catch (error) {
            console.error('Geri yükleme hatası:', error);
            showToast('Geri yükleme başarısız', 'error');
        } finally {
            setConfirmRestore({ isOpen: false, id: '', type: 'all' });
            setShowViewModal(false);
        }
    };

    const handlePermanentDelete = async (id: string, type: TabType) => {
        // YETKİ KONTROLÜ: Yalnızca Yönetici (ADMIN veya AUDIT_ADMIN) kalıcı silme yapabilir
        if (!isManager) {
            showToast('Kalıcı silme yetkisi sadece "Yönetici" ve "Denetim Yöneticisi" rollerine aittir.', 'error');
            return;
        }
        setConfirmDelete({ isOpen: true, id, type });
    };

    const confirmPermanentDelete = async () => {
        const { id, type } = confirmDelete;
        if (type === 'all' || !id) return;

        try {
            // Genel kalıcı silme endpoint'i veya spesifik eşleştirme varsayılıyor
            switch (type) {
                case 'audits': await auditApi.permanentDeleteAudit(id); break;
                case 'findings': await auditApi.permanentDeleteFinding(id); break;
                case 'documents': await auditApi.permanentDeleteDocument(id); break;
                case 'ethics': await auditApi.permanentDeleteEthics(id); break;
                case 'plans': await auditApi.permanentDeletePlan(id); break;
                default: throw new Error(`Bilinmeyen kalıcı silme türü: ${type}`);
            }

            setDeletedItems(prev => ({
                ...prev,
                [type]: prev[type].filter(i => i.id !== id)
            }));
            showToast('Öğe kalıcı olarak silindi', 'success');
            refreshTrashCount();
        } catch (error) {
            console.error('Kalıcı silme hatası:', error);
            showToast('Kalıcı silme başarısız', 'error');
        } finally {
            setConfirmDelete({ isOpen: false, id: '', type: 'all' });
        }
    };

    const handleEmptyTrash = async () => {
        // YETKİ KONTROLÜ: Yalnızca Yönetici (ADMIN veya AUDIT_ADMIN) çöp kutusunu boşaltabilir
        if (!isManager) {
            setShowEmptyConfirm(false); // Açıksa modalı kapat
            showToast('Silinen kayıtları temizleme yetkisi sadece "Yönetici" ve "Denetim Yöneticisi" rollerine aittir.', 'error');
            return;
        }

        try {
            await auditApi.emptyTrash();
            setDeletedItems({
                audits: [],
                findings: [],
                documents: [],
                ethics: [],
                plans: []
            });
            setShowEmptyConfirm(false);
            showToast('Tüm kayıtlar kalıcı olarak silindi', 'success');
            refreshTrashCount();
        } catch (error) {
            console.error('Çöp kutusu boşaltma hatası:', error);
            showToast('İşlem başarısız oldu', 'error');
        }
    };

    const getUniqueTypes = () => {
        // Collect types from currently visible items
        const currentList = getFilteredList();
        // Note: getFilteredList calls this, infinite loop risk if not careful.
        // Better: aggregate based on selectedRecordTypes
        let types = new Set<string>();

        if (selectedRecordTypes.length === 0 || selectedRecordTypes.includes('documents')) {
            deletedItems.documents.forEach(i => i.category && types.add(i.category));
        }
        if (selectedRecordTypes.length === 0 || selectedRecordTypes.includes('audits')) {
            deletedItems.audits.forEach(i => i.type && types.add(i.type));
        }
        return Array.from(types);
    };

    const getUniqueStatuses = () => {
        let statuses = new Set<string>();
        // Durum bilgisi genellikle denetim, bulgu ve etik kayıtlarında bulunur
        if (selectedRecordTypes.length === 0 || selectedRecordTypes.includes('audits')) {
            deletedItems.audits.forEach(i => i.status && statuses.add(i.status));
        }
        if (selectedRecordTypes.length === 0 || selectedRecordTypes.includes('findings')) {
            deletedItems.findings.forEach(i => i.status && statuses.add(i.status));
        }
        if (selectedRecordTypes.length === 0 || selectedRecordTypes.includes('ethics')) {
            deletedItems.ethics.forEach(i => i.status && statuses.add(i.status));
        }
        return Array.from(statuses);
    };

    const getFilteredList = () => {
        // Always combine all first, then filter by selected types
        const allItems = [
            ...deletedItems.audits.map(i => ({ ...i, sourceType: 'audits', typeLabel: 'Denetim' })),
            ...deletedItems.findings.map(i => ({ ...i, sourceType: 'findings', typeLabel: 'Bulgu' })),
            ...deletedItems.documents.map(i => ({ ...i, sourceType: 'documents', typeLabel: 'Doküman' })),
            ...deletedItems.ethics.map(i => ({ ...i, sourceType: 'ethics', typeLabel: 'Etik' })),
            ...deletedItems.plans.map(i => ({ ...i, sourceType: 'plans', typeLabel: 'Plan' }))
        ];

        return allItems.filter(item => {
            // 1. Filter by Record Type (Source Type)
            if (selectedRecordTypes.length > 0 && !selectedRecordTypes.includes(item.sourceType)) {
                return false;
            }

            // 2. Search
            const searchBase = `${item.title || ''} ${item.code || ''} ${item.auditCode || ''} ${item.description || ''}`.toLocaleLowerCase('tr-TR');
            const matchesSearch = searchBase.includes(searchTerm.toLocaleLowerCase('tr-TR'));

            if (!matchesSearch) return false;

            // 3. Sub-Type Filter (e.g. Audit Type, Document Category)
            // typeFilter applies if item has 'type' (audit) or 'category' (document) matching one of the selected types
            const itemSubType = item.type || item.category;
            const matchesType = typeFilter.length === 0 || (itemSubType && typeFilter.includes(itemSubType));

            if (!matchesType) return false;

            // 4. Status Filter
            const matchesStatus = statusFilter.length === 0 || (item.status && statusFilter.includes(item.status));

            if (!matchesStatus) return false;

            // 5. Date Filter
            const deletedDate = item.deletedAt ? new Date(item.deletedAt) : null;
            let matchesDate = true;
            if (deletedDate) {
                if (startDate && new Date(startDate) > deletedDate) matchesDate = false;
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59);
                    if (end < deletedDate) matchesDate = false;
                }
            }

            return matchesDate;
        });
    };

    const currentItems = getFilteredList();
    const totalItems = currentItems.length;

    const toggleRecordTypeFilter = (type: string) => {
        if (selectedRecordTypes.includes(type)) {
            setSelectedRecordTypes(selectedRecordTypes.filter(t => t !== type));
        } else {
            setSelectedRecordTypes([type]);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <ShieldX size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Engellendi</h2>
                <p className="text-gray-600 max-w-md">
                    Silinen kayıtlar ekranına sadece <strong>Sistem Yöneticisi</strong> yetkisine sahip kullanıcılar erişebilir.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex justify-center p-12">
                    <LoadingState message="Silinen öğeler yükleniyor..." />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Çöp Kutusu" subtitle="Silinen veya arşive kaldırılan tüm denetim verileri" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
                <StatCard
                    title="Toplam Silinen"
                    value={deletedItems.audits.length + deletedItems.findings.length + deletedItems.ethics.length + deletedItems.plans.length}
                    color="gray"
                    icon={<Trash2 size={20} />}
                    infoTooltip="Çöp kutusunda yer alan tüm türlerdeki (denetim, bulgu, vb.) toplam kayıt sayısıdır."
                    onClick={() => setSelectedRecordTypes([])}
                    className={`transition-all hover:scale-[1.02] ${selectedRecordTypes.length === 0 ? 'ring-2 ring-gray-400 scale-[1.02] bg-gray-50/10' : ''}`}
                />
                <StatCard
                    title="Silinen Denetim"
                    value={deletedItems.audits.length}
                    color="blue"
                    icon={<FileText size={20} />}
                    infoTooltip="Kullanıcılar tarafından sistemden silinmiş ve kalıcı olarak silinmeyi/geri yüklenmeyi bekleyen denetim görevleridir."
                    onClick={() => toggleRecordTypeFilter('audits')}
                    className={`transition-all hover:scale-[1.02] ${selectedRecordTypes.includes('audits') ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />
                <StatCard
                    title="Silinen Bulgu"
                    value={deletedItems.findings.length}
                    color="rose"
                    icon={<AlertTriangle size={20} />}
                    infoTooltip="Denetimler sırasında eklenmiş ancak sonradan geçersiz kılınarak silinen bulgu kayıtlarıdır."
                    onClick={() => toggleRecordTypeFilter('findings')}
                    className={`transition-all hover:scale-[1.02] ${selectedRecordTypes.includes('findings') ? 'ring-2 ring-rose-500 scale-[1.02] bg-rose-50/10' : ''}`}
                />
                <StatCard
                    title="Silinen Etik"
                    value={deletedItems.ethics.length}
                    color="amber"
                    icon={<AlertCircle size={20} />}
                    infoTooltip="Etik bildirim sisteminden silinen ancak kalıcı olarak yok edilmeyi bekleyen ihbar dosyalarıdır."
                    onClick={() => toggleRecordTypeFilter('ethics')}
                    className={`transition-all hover:scale-[1.02] ${selectedRecordTypes.includes('ethics') ? 'ring-2 ring-amber-500 scale-[1.02] bg-amber-50/10' : ''}`}
                />
                <StatCard
                    title="Silinen Plan"
                    value={deletedItems.plans.length}
                    color="indigo"
                    icon={<Calendar size={20} />}
                    infoTooltip="Denetim evreninden veya yıllık plandan silinmiş, aktif olmayan taslak planların sayısıdır."
                    onClick={() => toggleRecordTypeFilter('plans')}
                    className={`transition-all hover:scale-[1.02] ${selectedRecordTypes.includes('plans') ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />
            </div>

            {/* Standardized Toolbar */}
            <PageToolbar
                searchPlaceholder="Öğe veya sildiği kişi ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                rightActions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowEmptyConfirm(true)}
                            className="text-red-600 hover:bg-red-50 border-red-200 gap-2 shadow-sm"
                            disabled={loading || currentItems.length === 0}
                            leftIcon={<Trash2 size={18} />}
                        >
                            Tümünü Temizle
                        </Button>
                    </div>
                }
                filters={
                    <FilterDropdown
                        activeCount={selectedRecordTypes.length + typeFilter.length + statusFilter.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)}
                        onClear={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setStatusFilter([]); setTypeFilter([]); setSelectedRecordTypes([]); }}
                    >
                        <CustomSelect
                            label="Kayıt Türü"
                            value={selectedRecordTypes}
                            onChange={(val) => setSelectedRecordTypes(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={[
                                { value: "audits", label: "Denetim" },
                                { value: "findings", label: "Bulgular" },
                                { value: "documents", label: "Dökümanlar" },
                                { value: "ethics", label: "Etik Bildirimleri" },
                                { value: "plans", label: "Planlar" }
                            ]}
                        />
                        <CustomSelect
                            label="Alt Tür"
                            value={typeFilter}
                            onChange={(val) => setTypeFilter(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={getUniqueTypes().map(t => ({ value: t, label: t }))}
                        />
                        <CustomSelect
                            label="Durum"
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={getUniqueStatuses().map(s => ({ value: s, label: s }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Başlangıç</label>
                                <input
                                    type="date"
                                    className="form-input text-sm w-full focus:ring-primary/20 focus:border-primary"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Bitiş</label>
                                <input
                                    type="date"
                                    className="form-input text-sm w-full focus:ring-primary/20 focus:border-primary"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </FilterDropdown>
                }
            />

            <DataTable
                data={currentItems}
                sortColumn={trashSortCol || 'deletedAt'}
                sortDirection={trashSortDir || 'desc'}
                rowKey={(item) => item.id + '-' + item.sourceType}
                columns={([
                    {
                        key: 'title',
                        header: 'SİLİNEN KAYIT ADI',
                        sortable: true,
                        align: 'left',
                        width: '400px',
                        render: (item: any) => (
                            <div className="flex items-center justify-start gap-3">
                                {(selectedRecordTypes.length !== 1 || (selectedRecordTypes.length === 1 && selectedRecordTypes[0] !== 'findings')) && (item.code || item.auditCode) && (
                                    <div className="shrink-0">
                                        <CodeBadge code={item.code || item.auditCode} size="sm" />
                                    </div>
                                )}
                                <Tooltip content={item.title}>
                                    <span className="font-medium text-gray-900 group-hover:text-red-700 transition-colors truncate max-w-[400px]">
                                        {item.title}
                                    </span>
                                </Tooltip>
                            </div>
                        )
                    },
                    ...(selectedRecordTypes.length !== 1 ? [{
                        key: 'typeLabel',
                        header: 'KAYIT TÜRÜ',
                        align: 'center' as const,
                        width: '120px',
                        render: (item: any) => <StatusBadge type="status" value={item.typeLabel} size="sm" />
                    }] : []),
                    ...(selectedRecordTypes.length === 1 && selectedRecordTypes[0] === 'audits' ? [
                        { key: 'type', header: 'TÜR', align: 'center' as const, render: (item: any) => <span className="badge badge-gray">{item.type}</span> },
                        {
                            key: 'status',
                            header: 'DURUM',
                            align: 'center' as const,
                            render: (item: any) => (
                                <span className={`badge ${item.status === 'Tamamlandı' ? 'badge-green' : item.status === 'Devam Ediyor' ? 'badge-blue' : 'badge-gray'}`}>
                                    {item.status}
                                </span>
                            )
                        }
                    ] : []),
                    ...(selectedRecordTypes.length === 1 && selectedRecordTypes[0] === 'findings' ? [
                        { key: 'code', header: 'KOD', align: 'center' as const, type: 'code' },
                        { key: 'auditTitle', header: 'İLGİLİ DENETİM', align: 'left' as const, render: (item: any) => <div className="cell-subtitle line-clamp-1">{item.audit?.title || '-'}</div> },
                        {
                            key: 'riskLevel',
                            header: 'RİSK',
                            align: 'center' as const,
                            type: 'risk'
                        },
                        { key: 'status', header: 'DURUM', align: 'center' as const, type: 'status' }
                    ] : []),
                    ...(selectedRecordTypes.length === 1 && selectedRecordTypes[0] === 'documents' ? [
                        { key: 'category', header: 'KATEGORİ', align: 'left' as const, render: (item: any) => <div className="cell-title">{item.category}</div> }
                    ] : []),
                    ...(selectedRecordTypes.length === 1 && selectedRecordTypes[0] === 'ethics' ? [
                        { key: 'category', header: 'KATEGORİ', align: 'left' as const },
                        { key: 'status', header: 'DURUM', align: 'center' as const, type: 'status' }
                    ] : []),
                    ...(selectedRecordTypes.length === 1 && selectedRecordTypes[0] === 'plans' ? [
                        { key: 'year', header: 'YIL', align: 'center' as const, render: (item: any) => <div className="cell-title">{item.year}</div> },
                        { key: 'status', header: 'DURUM', align: 'center' as const, type: 'status' }
                    ] : []),
                    {
                        key: 'deletedAt',
                        header: 'SİLİNDİĞİ TARİH',
                        sortable: true,
                        align: 'center',
                        width: '180px',
                        type: 'datetime'
                    },
                    {
                        key: 'deletedBy',
                        header: 'SİLEN KİŞİ',
                        align: 'center',
                        width: '180px',
                        type: 'user'
                    },
                    {
                        key: 'actions',
                        header: 'İŞLEMLER',
                        align: 'center',
                        width: '120px',
                        render: (item: any) => {
                            return (
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                    <ActionMenu items={[
                                        { label: 'İncele', icon: Eye, onClick: () => { setSelectedItem(item); setShowViewModal(true); } },
                                        { label: 'Geri Yükle', icon: RotateCcw, onClick: () => handleRestore(item.id, item.sourceType) },
                                        ...(isManager ? [{ label: 'Kalıcı Sil', icon: ShieldX, variant: 'danger' as const, onClick: () => handlePermanentDelete(item.id, item.sourceType) }] : [])
                                    ]} />
                                </div>
                            );
                        }
                    }
                ] as Column<any>[])}
                className="shadow-none border-none"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                    setStatusFilter([]);
                    setTypeFilter([]);
                    setSelectedRecordTypes([]);
                }}
            />

            {/* View Modal */}
            {/* View Modal - Using Portal via simple conditional check if document exists or createPortal */}
            <Modal
                isOpen={showViewModal && !!selectedItem}
                onClose={() => setShowViewModal(false)}
                size="lg"
                title={
                    selectedItem && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{selectedItem.title}</h3>
                            <div className="flex gap-2 mt-1">
                                <StatusBadge type="status" value={selectedItem.typeLabel || selectedItem.sourceType} size="sm" />
                            </div>
                        </div>
                    )
                }
            >
                {selectedItem && (
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Açıklama / İçerik</h4>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px] text-sm leading-relaxed">
                                {selectedItem.description || 'Açıklama yok.'}
                            </p>
                        </section>
                        <div className="grid grid-cols-2 gap-6">
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Kayıt Bilgileri</h4>
                                <ul className="space-y-3">
                                    <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Tür:</span><span className="font-semibold text-gray-900">{selectedItem.typeLabel || selectedItem.sourceType}</span></li>
                                    <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Kod:</span><span className="font-semibold text-gray-900">{selectedItem.code || selectedItem.auditCode || '-'}</span></li>
                                    <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Durum:</span><span className="text-gray-900">{selectedItem.status || '-'}</span></li>
                                    {selectedItem.riskLevel && <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Risk:</span><span className="font-bold text-gray-900">{selectedItem.riskLevel}</span></li>}
                                    {selectedItem.risk && !selectedItem.riskLevel && <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Risk:</span><span className="font-bold text-gray-900">{selectedItem.risk}</span></li>}
                                    {(selectedItem.audit?.title || selectedItem.auditTitle) && <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Denetim:</span><Tooltip content={selectedItem.audit?.title || selectedItem.auditTitle} position="left"><span className="text-right truncate max-w-[200px] text-gray-900">{selectedItem.audit?.title || selectedItem.auditTitle}</span></Tooltip></li>}
                                    {selectedItem.period && <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Dönem:</span><span className="text-gray-900">{selectedItem.period}</span></li>}
                                    {selectedItem.category && <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Kategori:</span><span className="text-gray-900">{selectedItem.category}</span></li>}
                                </ul>
                            </section>
                            <section>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Silme Bilgileri</h4>
                                <ul className="space-y-3">
                                    <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Silindiği Tarih:</span><span className="font-semibold text-gray-900">{formatDateTime(selectedItem.deletedAt)}</span></li>
                                    <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Silen Kişi:</span><span className="font-semibold text-gray-900">{selectedItem.deletedBy?.name || 'Sistem'}</span></li>
                                    <li className="flex justify-between text-sm items-center"><span className="text-gray-600 font-medium">Silen Rol:</span><span className="text-sm text-gray-700">{selectedItem.deletedBy?.roles?.map((r: any) => typeof r === 'string' ? r : (r.name || r.code)).join(', ') || '-'}</span></li>
                                </ul>
                            </section>
                        </div>

                        {/* Detailed Content Mapping */}
                        {(selectedItem.impact || selectedItem.recommendation || selectedItem.criteria || selectedItem.scope || selectedItem.objective || selectedItem.condition || selectedItem.cause) && (
                            <section className="space-y-4 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Detaylı Bilgiler</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedItem.condition && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1"><AlertCircle size={16} className="text-primary" /> Durum / Tespit</label>
                                            <div className="text-sm p-3 bg-white text-gray-800 rounded-lg border border-gray-200 whitespace-pre-wrap shadow-sm">{selectedItem.condition}</div>
                                        </div>
                                    )}
                                    {selectedItem.impact && (
                                        <div>
                                            <label className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-1"><AlertTriangle size={16} /> Etki / Risk</label>
                                            <div className="text-sm p-3 bg-red-50 text-red-900 rounded-lg border border-red-100 whitespace-pre-wrap shadow-sm">{selectedItem.impact}</div>
                                        </div>
                                    )}
                                    {selectedItem.cause && (
                                        <div>
                                            <label className="text-xs font-semibold text-orange-600 flex items-center gap-1 mb-1"><AlertCircle size={16} /> Neden</label>
                                            <div className="text-sm p-3 bg-orange-50 text-orange-900 rounded-lg border border-orange-100 whitespace-pre-wrap shadow-sm">{selectedItem.cause}</div>
                                        </div>
                                    )}
                                    {selectedItem.recommendation && (
                                        <div>
                                            <label className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1"><RefreshCw size={16} /> Öneri</label>
                                            <div className="text-sm p-3 bg-green-50 text-green-900 rounded-lg border border-green-100 whitespace-pre-wrap shadow-sm">{selectedItem.recommendation}</div>
                                        </div>
                                    )}
                                    {selectedItem.criteria && (
                                        <div>
                                            <label className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-1"><FileText size={16} /> Kriter</label>
                                            <div className="text-sm p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 whitespace-pre-wrap shadow-sm">{selectedItem.criteria}</div>
                                        </div>
                                    )}
                                    {selectedItem.objective && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">Denetim Amacı</label>
                                            <div className="text-sm p-3 bg-white text-gray-800 rounded-lg border border-gray-200 whitespace-pre-wrap shadow-sm">{selectedItem.objective}</div>
                                        </div>
                                    )}
                                    {selectedItem.scope && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">Denetim Kapsamı</label>
                                            <div className="text-sm p-3 bg-white text-gray-800 rounded-lg border border-gray-200 whitespace-pre-wrap shadow-sm">{selectedItem.scope}</div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Raw Data Toggle */}
                        <section className="pt-4 border-t border-gray-100">
                            <details className="group">
                                <summary className="text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-2">
                                    <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                    Tüm Ham Veri (Sistem Kaydı)
                                </summary>
                                <div className="mt-3">
                                    <pre className="text-[10px] p-4 bg-gray-900 text-green-400 rounded-xl overflow-x-auto max-h-[300px] shadow-inner thin-scrollbar">
                                        {JSON.stringify(selectedItem, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </section>
                    </div>
                )}
            </Modal>

            {/* Confirm Modals */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: '', type: 'all' })}
                onConfirm={confirmPermanentDelete}
                title="Kalıcı Olarak Sil"
                message="Bu öğeyi ve ilgili tüm verileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                type="danger"
            />

            <ConfirmModal
                isOpen={confirmRestore.isOpen}
                onClose={() => setConfirmRestore({ isOpen: false, id: '', type: 'all' })}
                onConfirm={confirmRestoreAction}
                title="Geri Yükle"
                message="Bu öğeyi geri yüklemek istediğinize emin misiniz? Öğe ilgili listeye tekrar eklenecektir."
                confirmText="Geri Yükle"
                type="success"
            />

            <ConfirmModal
                isOpen={showEmptyConfirm}
                onClose={() => setShowEmptyConfirm(false)}
                onConfirm={handleEmptyTrash}
                title="Silinen Kayıtları Temizle"
                message="Silinen kayıtlardaki tüm öğeleri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Tümünü Sil"
                type="danger"
            />
        </div >
    );
}
