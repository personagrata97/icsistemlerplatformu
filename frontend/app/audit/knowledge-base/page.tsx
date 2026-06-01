'use client';
import { useState } from 'react';
import { DateDisplay } from '@/components/ui/DateDisplay';
import Button from '@/components/ui/Button';
import { ShieldCheck, Building2, Scale, ClipboardList, Bot, Download, FileText, Plus, Eye, X, Filter, Trash2 } from 'lucide-react';
import PageHeader from '@/components/audit/PageHeader';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Tooltip from '@/components/ui/Tooltip';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import RefreshButton from '@/components/ui/RefreshButton';
import DataTable from '@/components/ui/DataTable';
import { auditApi, API_BASE_URL } from '@/lib/audit-api';
import ActionMenu from '@/components/ui/ActionMenu';
import { useToast } from '@/components/Toast';
import PageToolbar from '@/components/ui/PageToolbar';
import { useEffect, useRef } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

type DocumentType = 'TEFTIS_KURULU' | 'DIGER_BIRIMLER' | 'MEVZUAT' | 'TEMPLATES' | 'AUDITRON';

// Doküman arayüz yapısı
interface Document {
    id: string;
    title: string;
    type: DocumentType;
    uploadDate: string;
    uploadedBy: string;
    size: string;
}

export default function KnowledgeBasePage() {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('TEFTIS_KURULU');
    const [searchTerm, setSearchTerm] = useState('');
    const [aiResults, setAiResults] = useState<string[]>([]);
    const [filterUploader, setFilterUploader] = useState<string[]>([]);
    const [filterYear, setFilterYear] = useState<string[]>([]);
    const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tabs = [
        { id: 'TEFTIS_KURULU', label: 'Teftiş Kurulu', icon: ShieldCheck },
        { id: 'DIGER_BIRIMLER', label: 'Diğer Birimler', icon: Building2 },
        { id: 'MEVZUAT', label: 'Mevzuat', icon: Scale },
        { id: 'TEMPLATES', label: 'Denetim Şablonları', icon: ClipboardList },
        { id: 'AUDITRON', label: 'Auditron (AI)', icon: Bot },
    ];

    useEffect(() => {
        loadStaff();
    }, []);

    // Sekme değiştiğinde dokümanları yeniden yükle
    useEffect(() => {
        loadDocuments();
    }, [activeTab]);

    const loadDocuments = async (showOverlay = true) => {
        try {
            if (showOverlay) setLoading(true);
            // Kategoriye göre yükle
            const data = await auditApi.getDocuments(activeTab);
            setDocuments(Array.isArray(data) ? data : []);
            setAiResults([]); // Sekme değiştiğinde AI sonucunu sıfırla
        } catch (error: any) {
            console.error('Doküman yükleme hatası:', error);
            showToast('Dokümanlar yüklenirken hata oluştu: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length > 2 && activeTab === 'AUDITRON') {
            try {
                const results = await auditApi.aiSearchDocuments(val);
                setAiResults(results);
            } catch (err) {
                console.error('AI arama hatası:', err);
            }
        }
    };

    const loadStaff = async () => {
        try {
            const data = await auditApi.getStaff();
            setStaff(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Personel listesi yükleme hatası:', error);
        }
    };

    const handleDownload = (doc: any) => {
        // API üzerinden doğrudan indirme
        window.open(`${API_BASE_URL}/documents/download/${doc.id}`, '_blank');
        showToast('Doküman indirme başlatıldı.', 'success');
    };

    const handleView = (doc: any) => {
        // Yeni sekmede API üzerinden görüntüleme
        const url = `${API_BASE_URL}/documents/view/${doc.id}`;
        window.open(url, '_blank');
    };

    const handleDelete = async () => {
        if (!confirmDeleteDoc) return;

        try {
            setLoading(true);
            await auditApi.deleteDocument(confirmDeleteDoc.id);
            showToast('Doküman silindi.', 'success');
            loadDocuments(false);
        } catch (error: any) {
            showToast('Silme hatası: ' + error.message, 'error');
        } finally {
            setConfirmDeleteDoc(null);
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', activeTab);
            formData.append('title', file.name.split('.').slice(0, -1).join('.'));

            await auditApi.uploadDocument(formData);
            showToast('Doküman başarıyla yüklendi.', 'success');
            loadDocuments();
        } catch (error: any) {
            showToast('Yükleme hatası: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = documents.filter(doc => {
        // Backend Enum değerleriyle doğrudan eşleştirme
        const docCategory = doc.category || 'TEFTIS_KURULU';
        const matchesTab = docCategory === activeTab;
        const title = doc.name || doc.title || '';
        const matchesTerm = title.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));

        const uploadedBy = doc.uploadedBy || 'Sistem';
        const matchesUploader = filterUploader.length === 0 || filterUploader.includes(uploadedBy);

        const uploadDate = doc.createdAt || doc.uploadDate || new Date().toISOString();
        const docYear = new Date(uploadDate).getFullYear().toString();
        const matchesYear = filterYear.length === 0 || filterYear.includes(docYear);

        return matchesTab && matchesTerm && matchesUploader && matchesYear;
    });

    const uploaders = Array.from(new Set([
        ...documents.map(d => d.uploadedBy || 'Sistem'),
        ...staff.map(s => s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim())
    ].filter(Boolean))).sort().map(name => ({ value: name, label: name }));

    const years = Array.from(new Set(documents.map(d => new Date(d.createdAt || d.uploadDate || Date.now()).getFullYear().toString()))).sort().reverse().map(y => ({ value: y, label: y }));

    return (
        <div className="p-6">
            <PageHeader
                title="Sürekli Gelişim ve Bilgi Bankası"
                subtitle="Denetim rehberleri, metodolojiler ve kurumsal hafıza merkezi"
            />

            {/* Tab Navigation - Centralized SegmentedTabs */}
            <div className="mb-8">
                <SegmentedTabs
                    tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
                    activeTab={activeTab}
                    onChange={(id) => {
                        setActiveTab(id as DocumentType);
                    }}
                />
            </div>

            {/* AI Search Highlights for Auditron Tab */}
            {activeTab === 'AUDITRON' && aiResults.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
                        <Bot size={20} />
                        <span>Auditron AI Zekası: İlgili Belge Kesitleri</span>
                    </div>
                    <div className="space-y-3">
                        {aiResults.map((res, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-blue-100 text-sm text-gray-700 shadow-sm transition-all hover:shadow-md">
                                {res}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Standardized Toolbar */}
            <PageToolbar
                searchPlaceholder={activeTab === 'AUDITRON' ? "AI ile belgeler içinde ara..." : "Belge ara..."}
                searchValue={searchTerm}
                onSearchChange={handleSearch}
                onRefresh={() => loadDocuments(false)}
                showAddButton={true}
                onAddClick={handleUploadClick}
                addButtonText="Doküman Ekle"
                filters={
                    <FilterDropdown
                        activeCount={filterUploader.length + filterYear.length}
                        onClear={() => {
                            setFilterUploader([]);
                            setFilterYear([]);
                            setSearchTerm('');
                        }}
                    >
                        <CustomSelect
                            label="Yükleyen"
                            placeholder="Tümü"
                            isMulti
                            value={filterUploader}
                            onChange={(val) => setFilterUploader(val as string[])}
                            options={uploaders}
                        />
                        <CustomSelect
                            label="Yıl"
                            placeholder="Tümü"
                            isMulti
                            value={filterYear}
                            onChange={(val) => setFilterYear(val as string[])}
                            options={years}
                        />
                    </FilterDropdown>
                }
            />
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Content Area - Using DataTable for consistency */}
            <DataTable
                rowKey="id"
                data={filteredDocs}
                loading={loading}
                paginated={true}
                itemsPerPage={10}
                columns={[
                    {
                        key: 'title',
                        header: 'Doküman Adı',
                        render: (doc: any) => (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="text-gray-500 w-5 h-5" />
                                </div>
                                <span className="cell-title">{doc.name || doc.title}</span>
                            </div>
                        )
                    },
                    {
                        key: 'size',
                        header: 'Boyut',
                        align: 'center',
                        width: '120px',
                        render: (doc: any) => (
                            <span className="font-mono text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 border border-slate-200/60 rounded inline-block">
                                {formatFileSize(doc.fileSize || doc.size)}
                            </span>
                        )
                    },
                    {
                        key: 'uploadedBy',
                        header: 'Yükleyen',
                        align: 'center',
                        width: '180px',
                        render: (doc: any) => <div className="cell-user justify-center">{doc.uploadedBy || 'Sistem'}</div>
                    },
                    {
                        key: 'uploadDate',
                        header: 'Tarih',
                        align: 'center',
                        width: '140px',
                        render: (doc: any) => (
                            <div className="cell-date text-center">
                                <DateDisplay date={doc.createdAt || doc.uploadDate || new Date().toISOString()} showIcon={false} className="justify-center" />
                            </div>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        align: 'center',
                        width: '220px',
                        render: (doc: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu
                                    items={[
                                        { label: 'İncele', icon: Eye, onClick: () => handleView(doc) },
                                        { label: 'İndir', icon: Download, onClick: () => handleDownload(doc) },
                                        { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => setConfirmDeleteDoc(doc) }
                                    ]}
                                />
                            </div>
                        )
                    }
                ]}
                emptyTitle="Doküman Bulunamadı"
                emptyDescription="Bu kategoride veya kriterlerde listelenecek doküman bulunamadı."
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilterUploader([]);
                    setFilterYear([]);
                }}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!confirmDeleteDoc}
                onClose={() => setConfirmDeleteDoc(null)}
                onConfirm={handleDelete}
                title="Dokümanı Sil"
                message={`"${confirmDeleteDoc?.name || confirmDeleteDoc?.title}" dokümanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Sil"
                type="danger"
            />
        </div>
    );
}
