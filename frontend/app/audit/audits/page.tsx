'use client';
import { SearchInput } from '@/components/ui/SearchInput';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
    Filter, Plus, FileText, Calendar, Loader2, X, CheckSquare, Save, Eye, Download, CheckCircle, Clock, AlertCircle, Trash2, ChevronDown, RefreshCw, Activity, Search
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Tooltip from '@/components/ui/Tooltip';
import OverflowTooltip from '@/components/ui/OverflowTooltip';
import { auditApi, AuditStaff } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import { getStatusColor, formatDate } from '@/lib/audit-utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import ConfirmModal from '@/components/ConfirmModal';
import CreateAuditModal from '@/components/audit/CreateAuditModal';
import CustomSelect from '@/components/ui/CustomSelect';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import DataTable, { Column } from '@/components/ui/DataTable';
import AuditTable from '@/components/audit/AuditTable'; // Özel mantık için korunuyor
import AuditActionButtons from '@/components/audit/AuditActionButtons';
import PageHeader from '@/components/audit/PageHeader';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import { getStatusBadgeClass } from '@/lib/audit-utils';

function AuditsPageContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [audits, setAudits] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Silme onay durumu
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    // Arama ve filtre durumları
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterInspector, setFilterInspector] = useState<string[]>([]);

    const searchParams = useSearchParams();
    const linkedStatus = searchParams.get('status');

    useEffect(() => {
        if (linkedStatus) {
            setFilterStatus(linkedStatus.split(','));
        }
    }, [linkedStatus]);


    // Form durumu
    const [newAudit, setNewAudit] = useState({
        code: '', // Manuel kod girişi
        title: '',
        type: 'Şube Denetimi',
        status: 'Planlandı',
        period: '2024-Q1',
        // Kapsam ve amaçlar
        objective: '',
        scope: '',
        methodology: '',
        criteria: '',
        riskLevel: 'Orta',
        plannedStartDate: '',
        plannedEndDate: '',
        // API'den dönen ek alanlar
        startDate: '',
        endDate: '',
        auditors: [] as string[],
        supervisor: ''
    });

    const [editingId, setEditingId] = useState<number | string | null>(null);

    useEffect(() => {
        loadAudits(true);
        loadStaff(); // Sayfa yüklenirken personel listesini al
    }, []);

    const loadAudits = async (showOverlay = true) => {
        if (showOverlay) setIsLoading(true);
        try {
            const data = await auditApi.getAudits();
            const mappedData = Array.isArray(data) ? data.map((audit: any) => ({
                ...audit,
                code: audit.auditCode || `D-${audit.id}`
            })) : [];
            setAudits(mappedData);
        } catch (error) {
            console.error('Denetimler yüklenirken hata:', error);
            showToast('Veriler yüklenemedi. Backend bağlantısını kontrol edin.', 'error');
            setAudits([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStaff = async () => {
        try {
            const data = await auditApi.getStaff();
            if (Array.isArray(data)) {
                setStaffList(data);
            } else {
                setStaffList([]);
            }
        } catch (error) {
            console.error('Personel listesi yükleme hatası:', error);
            setStaffList([]);
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (editingId) {
                await auditApi.updateAudit(editingId.toString(), data);
                showToast('Denetim başarıyla güncellendi', 'success');
            } else {
                await auditApi.createAudit(data);
                showToast('Denetim başarıyla oluşturuldu', 'success');
            }
            await loadAudits(false);
        } catch (error) {
            console.error('Denetim kaydetme hatası:', error);
            showToast(editingId ? 'Güncelleme başarısız' : 'Oluşturma başarısız', 'error');
        } finally {
            setIsCreateModalOpen(false);
            setEditingId(null);
        }
    };

    const handleEditClick = (item: any) => {
        // Gerekirse öğeyi form yapısına dönüştür
        setNewAudit({
            ...newAudit,
            ...item,
            // Gerekli dizi/metin dönüşümlerini garanti et
            auditors: Array.isArray(item.auditors) ? item.auditors : [],
        });
        setEditingId(item.id);
        setIsCreateModalOpen(true);
    };

    // Yetki kontrolü
    const { hasRole, user } = useAuth();
    const isAuditor = hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_INSPECTOR') || hasRole('SYSTEM_ADMIN');
    const isUnit = checkRole(hasRole, ROLES.UNIT);
    const canDelete = checkRole(hasRole, ROLES.AUDIT_DELETE);

    // Denetim silme - tıklama işleyicisi
    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Satır tıklama yayılımını durdur
        if (!canDelete) {
            showToast('Bu işlem için yetkiniz bulunmamaktadır (Sadece Müdür yetkili)', 'error');
            return;
        }
        setDeleteConfirm({ isOpen: true, id });
    };

    // Gerçek silme işlemi
    const handleConfirmDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            await auditApi.deleteAudit(deleteConfirm.id);
            setAudits(prev => prev.filter(a => a.id !== deleteConfirm.id));
            showToast('Denetim başarıyla silindi', 'success');
        } catch (error) {
            console.error(error);
            showToast('Denetim silinirken hata oluştu', 'error');
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    // SAYFALAMA MANTIĞI
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filtre değiştiğinde sayfayı sıfırla
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterStatus, filterInspector]);

    // Filtrelenmiş liste
    const filteredAudits = audits.filter(audit => {
        const matchesSearch = (audit.title?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (audit.code?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'));

        const matchesType = filterType.length === 0 || filterType.includes(audit.type);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(audit.status);

        // Inspector Filter
        let auditAuditors: string[] = [];
        try {
            if (Array.isArray(audit.auditors)) auditAuditors = audit.auditors;
            else if (typeof audit.auditors === 'string') auditAuditors = JSON.parse(audit.auditors);
        } catch { auditAuditors = []; }

        const matchesInspector = filterInspector.length === 0 || auditAuditors.some(a => filterInspector.includes(a));

        // Birim Filtrelemesi: Birim kullanıcısı ise sadece kendi birimine ait denetimleri görsün
        const matchesUnit = (isUnit && !isAuditor) ? (() => {
            if (!user?.department) return true;
            const unitName = audit.unit?.name || audit.unitName;
            if (!unitName) return true;
            return unitName.toLocaleLowerCase('tr-TR').trim() === user.department.toLocaleLowerCase('tr-TR').trim();
        })() : true;

        return matchesSearch && matchesType && matchesStatus && matchesInspector && matchesUnit;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAudits = filteredAudits.slice(indexOfFirstItem, indexOfLastItem);    // Calculate stats based on active search, type, and inspector filters
    const statsTotal = audits.filter(audit => {
        const matchesSearch = (audit.title?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (audit.code?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesType = filterType.length === 0 || filterType.includes(audit.type);
        
        let auditAuditors: string[] = [];
        try {
            if (Array.isArray(audit.auditors)) auditAuditors = audit.auditors;
            else if (typeof audit.auditors === 'string') auditAuditors = JSON.parse(audit.auditors);
        } catch { auditAuditors = []; }
        const matchesInspector = filterInspector.length === 0 || auditAuditors.some(a => filterInspector.includes(a));
        
        return matchesSearch && matchesType && matchesInspector;
    });

    const toggleStatusFilter = (status: string) => {
        if (filterStatus.includes(status)) {
            setFilterStatus(filterStatus.filter(s => s !== status));
        } else {
            setFilterStatus([status]);
        }
    };

    return (
        <>
            <PageHeader
                title="Denetim Görevleri"
                subtitle="Tüm aktif ve planlanmış denetim faaliyetlerinin merkezi takibi"
            />
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Toplam Denetim"
                    value={statsTotal.length}
                    icon={<FileText size={20} />}
                    color="blue"
                    onClick={() => setFilterStatus([])}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.length === 0 ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />
                <StatCard
                    title="Devam Eden"
                    value={statsTotal.filter(a => a.status === 'Devam Ediyor').length}
                    icon={<Activity size={20} />}
                    color="yellow"
                    onClick={() => toggleStatusFilter('Devam Ediyor')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Devam Ediyor') ? 'ring-2 ring-yellow-500 scale-[1.02] bg-yellow-50/10' : ''}`}
                />
                <StatCard
                    title="Tamamlandı"
                    value={statsTotal.filter(a => a.status === 'Tamamlandı').length}
                    icon={<CheckCircle size={20} />}
                    color="green"
                    onClick={() => toggleStatusFilter('Tamamlandı')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Tamamlandı') ? 'ring-2 ring-green-500 scale-[1.02] bg-green-50/10' : ''}`}
                />
                <StatCard
                    title="Planlandı"
                    value={statsTotal.filter(a => a.status === 'Planlandı').length}
                    icon={<Calendar size={20} />}
                    color="purple"
                    onClick={() => toggleStatusFilter('Planlandı')}
                    className={`transition-all hover:scale-[1.02] ${filterStatus.includes('Planlandı') ? 'ring-2 ring-purple-500 scale-[1.02] bg-purple-50/10' : ''}`}
                />
            </div>

            {/* Standardized Toolbar */}
            <PageToolbar
                searchPlaceholder="Denetim ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadAudits(false)}
                showAddButton={isAuditor}
                onAddClick={() => {
                    setEditingId(null);
                    setIsCreateModalOpen(true);
                }}
                addButtonText="Yeni Denetim"
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(filteredAudits.map(a => ({ No: a.code, Başlık: a.title, Tür: a.type, Tarih: a.dates, Durum: a.status })), 'Denetimler')}
                filters={
                    <FilterDropdown
                        activeCount={filterType.length + filterStatus.length + filterInspector.length}
                        onClear={() => { setFilterType([]); setFilterStatus([]); setFilterInspector([]); setSearchTerm(''); }}
                    >
                        <CustomSelect
                            label="Denetim Türü"
                            value={filterType}
                            onChange={(val) => setFilterType(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={[
                                { value: 'Süreç Denetimi', label: 'Süreç Denetimi' },
                                { value: 'Şube Denetimi', label: 'Şube Denetimi' },
                                { value: 'Birim Denetimi', label: 'Birim Denetimi' },
                                { value: 'Danışmanlık Denetimi', label: 'Danışmanlık Denetimi' },
                                { value: 'Takip Denetimi', label: 'Takip Denetimi' },
                                { value: 'Soruşturma', label: 'Soruşturma' },
                                { value: 'İnceleme', label: 'İnceleme' }
                            ]}
                        />
                        <CustomSelect
                            label="Durum"
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={[
                                { value: 'Taslak', label: 'Taslak' },
                                { value: 'Planlandı', label: 'Planlandı' },
                                { value: 'Devam Ediyor', label: 'Devam Ediyor' },
                                { value: 'Gözden Geçirme', label: 'Gözden Geçirme' },
                                { value: 'Tamamlandı', label: 'Tamamlandı' }
                            ]}
                        />
                        <CustomSelect
                            label="Sorumlu Müfettiş"
                            value={filterInspector}
                            onChange={(val) => setFilterInspector(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={staffList.map(s => ({ value: s.id, label: s.name }))}
                        />
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'code',
                        header: 'Denetim No',
                        type: 'code',
                        sortable: true,
                        width: '120px'
                    },
                    {
                        key: 'title',
                        header: 'Denetim Adı',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex flex-col items-start text-left w-full min-w-0">
                                <div className="cell-title w-full min-w-0">
                                    <OverflowTooltip content={item.title} className="max-w-full min-w-0">
                                        {item.title}
                                    </OverflowTooltip>
                                </div>
                                <div className="cell-subtitle flex items-center gap-2 mt-1 justify-start w-full min-w-0">
                                    <span>{item.type}</span>
                                    {item.linkedEthicsReportId && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-blue-300"></span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tight">
                                                <Search size={10} /> Etik Bağlantılı
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'startDate',
                        header: 'Tarih Aralığı',
                        width: '180px',
                        render: (item: any) => (
                            <div className="cell-date">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{formatDate(item.startDate)}</span>
                                {item.endDate && (
                                    <>
                                        <span className="mx-1 text-gray-300">-</span>
                                        <span>{formatDate(item.endDate)}</span>
                                    </>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        header: 'Durum',
                        type: 'status',
                        sortable: true,
                        width: '150px'
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '120px',
                        align: 'center',
                        render: (item: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu
                                    items={[
                                        {
                                            label: 'Detayı İncele',
                                            icon: Eye,
                                            onClick: () => router.push(`/audit/audits/${item.id}`)
                                        }
                                    ]}
                                />
                            </div>
                        )
                    }
                ]}
                data={filteredAudits}
                loading={isLoading}
                rowKey="id"
                onRowClick={(item) => router.push(`/audit/audits/${item.id}`)}
                className="shadow-sm border border-gray-100"
                paginated={true}
                itemsPerPage={itemsPerPage}
                itemUnit="denetim"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilterType([]);
                    setFilterStatus([]);
                    setFilterInspector([]);
                }}
            />

            {/* CREATE AUDIT MODAL */}
            <CreateAuditModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setEditingId(null); }}
                onSuccess={() => loadAudits(false)} // Kaydetme sonrası listeyi yenile
                initialData={editingId ? newAudit : undefined}
                isEditMode={!!editingId}
                staffList={staffList}
            />

            {/* CONFIRM MODAL */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Denetim Sil"
                message="Bu denetimi silmek istediğinize emin misiniz?"
                confirmText="Evet, Sil"

                type="danger"
            />
        </>
    );
}

export default function AuditsPage() {
    return (
        <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
            <AuditsPageContent />
        </Suspense>
    );
}

