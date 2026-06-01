import React, { useState, useEffect } from 'react';
import { auditApi, API_BASE_URL } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import { FileText, CheckCircle, Trash2, Eye, Plus, Copy, History, Download, X, Paperclip, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/audit-utils';
import ConfirmModal from '../ConfirmModal';
import Modal from '../ui/Modal';
import DataTable, { Column } from '@/components/ui/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import ActionMenu from '@/components/ui/ActionMenu';
import UserCell from '@/components/ui/UserCell';

interface WorkpaperListProps {
    auditId: string;
    currentUser: any;
}

const getSecureUrl = (relativeUrl: string) => {
    if (!relativeUrl) return '#';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    
    let finalUrl = relativeUrl;
    if (!finalUrl.startsWith('/api/v1') && !finalUrl.startsWith('api/v1')) {
        finalUrl = `/api/v1${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
    } else if (finalUrl.startsWith('api/v1')) {
        finalUrl = `/${finalUrl}`;
    }
    
    // Host'u ekle
    finalUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}${finalUrl}`;
    
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + `token=${token}`;
        }
    }
    return finalUrl;
};

export default function WorkpaperList({ auditId, currentUser }: WorkpaperListProps) {
    const { showToast } = useToast();
    const [workpapers, setWorkpapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<any[]>([]);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
    const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, workpaper: any, history: any[], loading: boolean }>({ isOpen: false, workpaper: null, history: [], loading: false });

    const handleViewHistory = async (wp: any) => {
        setHistoryModal({ isOpen: true, workpaper: wp, history: [], loading: true });
        try {
            const data = await auditApi.getWorkpaperHistory(wp.id);
            setHistoryModal(prev => ({ ...prev, history: data || [], loading: false }));
        } catch (err) {
            showToast('Geçmiş yüklenemedi', 'error');
            setHistoryModal(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        loadWorkpapers();
    }, [auditId]);

    const loadWorkpapers = async () => {
        try {
            const data = await auditApi.getWorkpapers(auditId);
            setWorkpapers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await auditApi.getWorkpaperTemplates();
            setTemplates(data);
        } catch (err) {
            console.error('Failed to load templates:', err);
        }
    };

    const handleAddFromTemplate = async (templateId: string) => {
        try {
            setLoading(true);
            await auditApi.createWorkpaperFromTemplate(auditId, templateId);
            showToast('Çalışma kağıdı şablondan oluşturuldu', 'success');
            setShowTemplatesModal(false);
            loadWorkpapers();
        } catch (err) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOff = async (id: string) => {
        try {
            await auditApi.signOffWorkpaper(id);
            showToast('Çalışma kağıdı gözden geçirildi olarak işaretlendi', 'success');
            loadWorkpapers();
        } catch (err) {
            showToast('İşlem başarısız', 'error');
        }
    };

    const handleSupervisorApprove = async (id: string) => {
        try {
            await auditApi.approveWorkpaperAsSupervisor(id);
            showToast('Çalışma kağıdı süpervizör tarafından onaylandı', 'success');
            loadWorkpapers();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Onay işlemi başarısız', 'error');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            await auditApi.deleteWorkpaper(deleteConfirm.id);
            setWorkpapers(prev => prev.filter(w => w.id !== deleteConfirm.id));
            showToast('Çalışma kağıdı silindi', 'success');
        } catch (err) {
            showToast('Silinemedi', 'error');
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            await auditApi.uploadWorkpaper(auditId, file, 'Genel');
            showToast('Çalışma kağıdı yüklendi', 'success');
            loadWorkpapers();
        } catch (err) {
            console.error(err);
            showToast('Yükleme başarısız', 'error');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    // Column definitions for DataTable
    const columns: Column<any>[] = [
        {
            key: 'title',
            header: 'Başlık / Dosya',
            sortable: true,
            align: 'left',
            render: (wp: any) => (
                <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                        <div className="cell-title group-hover:text-primary transition-colors">{wp.title}</div>
                        <div className="cell-subtitle flex items-center gap-2 mt-0.5">
                            {wp.refCode && <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{wp.refCode}</span>}
                            <span>{wp.fileType}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'preparer',
            header: 'Hazırlayan',
            sortable: true,
            align: 'left',
            render: (wp: any) => (
                <div className="flex flex-col gap-1.5">
                    <UserCell name={wp.preparer?.displayName || 'Bilinmiyor'} className="!w-auto" />
                    <div className="cell-date flex items-center gap-1.5 justify-start">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(wp.preparedAt)}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Durum',
            sortable: true,
            width: '150px',
            align: 'center',
            render: (wp: any) => {
                let badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
                let label = wp.status || 'Taslak';
                if (wp.status === 'Gözden Geçirildi') badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                if (wp.status === 'Onaylandı') badgeClass = 'bg-green-100 text-green-800 border-green-200';
                if (wp.status === 'Revizyon Gerekli') badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';

                return (
                    <span className={`status-badge border ${badgeClass}`}>
                        {label}
                    </span>
                );
            }
        },
        {
            key: 'reviewer',
            header: 'Gözden Geçiren',
            sortable: true,
            align: 'left',
            render: (wp: any) => wp.reviewer ? (
                <div className="flex flex-col gap-1.5">
                    <UserCell name={wp.reviewer.displayName} className="!w-auto" />
                    <div className="cell-date flex items-center gap-1.5 justify-start">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(wp.reviewedAt)}
                    </div>
                </div>
            ) : (
                <span className="text-sm text-gray-400 px-3">-</span>
            )
        },
        {
            key: 'supervisor',
            header: 'Süpervizör',
            sortable: true,
            align: 'left',
            render: (wp: any) => wp.supervisor ? (
                <div className="flex flex-col gap-1.5">
                    <UserCell name={wp.supervisor.displayName} className="!w-auto" />
                    <div className="cell-date flex items-center gap-1.5 justify-start">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(wp.supervisorApprovedAt)}
                    </div>
                </div>
            ) : (
                <span className="text-sm text-gray-400 px-3">-</span>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '200px',
            align: 'center',
            render: (wp: any) => (
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu items={[
                        { label: 'Görüntüle', icon: Eye, onClick: () => window.open(getSecureUrl(wp.fileUrl), '_blank') },
                        { label: 'İndir', icon: Download, onClick: () => {
                            const link = document.createElement('a');
                            link.href = getSecureUrl(wp.fileUrl);
                            link.download = wp.title;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } },
                        { label: 'Versiyon Geçmişi', icon: History, onClick: () => handleViewHistory(wp) },
                        ...(wp.status === 'Taslak' ? [{ label: 'Gözden Geçir', icon: CheckCircle, variant: 'success' as const, onClick: () => handleSignOff(wp.id) }] : []),
                        ...(wp.status === 'Gözden Geçirildi' ? [{ label: 'Süpervizör Onayı', icon: CheckCircle, variant: 'success' as const, onClick: () => handleSupervisorApprove(wp.id) }] : []),
                        { type: 'divider' as const },
                        { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => handleDeleteClick(wp.id) }
                    ]} />
                </div>
            )
        }
    ];

    if (loading) return <div className="text-center py-4">Yükleniyor...</div>;

    return (
        <div className="card !p-0 shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Paperclip size={20} className="text-primary" /> Çalışma Kağıtları
                </h3>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            loadTemplates();
                            setShowTemplatesModal(true);
                        }}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Copy size={20} />}
                        className="gap-2"
                    >
                        Şablondan Ekle
                    </Button>
                    <input
                        type="file"
                        id="workpaper-upload"
                        className="hidden"
                        onChange={handleUpload}
                    />
                    <label
                        htmlFor="workpaper-upload"
                        className="cursor-pointer"
                    >
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus size={20} />}
                            className="gap-2 pointer-events-none"
                        >
                            Yeni Yükle
                        </Button>
                    </label>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={workpapers}
                loading={loading}
                rowKey="id"
                paginated={false}
                emptyTitle="Çalışma Kağıdı Bulunamadı"
                emptyDescription="Henüz çalışma kağıdı eklenmemiş."
                className="border-none shadow-none rounded-none"
                hoverable={true}
                striped={true}
            />

            {/* Templates Selection Modal */}
            <Modal
                isOpen={showTemplatesModal}
                onClose={() => setShowTemplatesModal(false)}
                title="Şablon Seçiniz"
                size="lg"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tpl) => (
                        <div
                            key={tpl.id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                            onClick={() => handleAddFromTemplate(tpl.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="p-2 bg-gray-100 rounded text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{tpl.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{tpl.description || 'Bilgi yok'}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="badge badge-gray text-[10px]">{tpl.category}</span>
                                            <span className="badge badge-blue text-[10px] uppercase">{tpl.format}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-8">
                            <p className="text-gray-500 mb-4">Henüz şablon bulunamadı.</p>
                            <Button
                                onClick={async () => {
                                    await auditApi.seedWorkpaperTemplates();
                                    loadTemplates();
                                }}
                                variant="primary"
                                size="sm"
                            >
                                Örnek Şablonları Yükle
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Çalışma Kağıdını Sil"
                message="Bu çalışma kağıdını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                type="danger"
            />
            {/* History Modal */}
            <Modal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
                title={`Versiyon Geçmişi - ${historyModal.workpaper?.title || ''}`}
                size="lg"
            >
                {historyModal.loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50/50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                            <div>
                                <h4 className="font-semibold text-gray-800 text-sm">Güncel Versiyon (v{historyModal.workpaper?.version || 1})</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    En son {formatDate(historyModal.workpaper?.updated_at)} tarihinde güncellendi.
                                </p>
                            </div>
                            <Button
                                onClick={() => window.open(getSecureUrl(historyModal.workpaper?.fileUrl), '_blank')}
                                variant="primary"
                                size="sm"
                                leftIcon={<Download size={16} />}
                                className="gap-2"
                            >
                                İndir / Görüntüle
                            </Button>
                        </div>

                        <h4 className="font-medium text-gray-700 text-sm mt-4 border-b pb-2">Eski Versiyonlar ({historyModal.history.length})</h4>

                        {historyModal.history.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">Bu çalışma kağıdı açısına ait eski bir versiyon bulunmuyor.</div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {historyModal.history.map((h, index) => (
                                    <div key={h.id || index} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="badge badge-gray text-xs font-bold">v{h.version}</span>
                                                <span className="text-sm font-medium text-gray-800">{h.storedFileName || historyModal.workpaper?.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                <span><span className="font-medium text-gray-700">İşlem:</span> {h.changeReason || 'Versiyon güncellendi'}</span>
                                                {h.createdAt && <span>• {formatDate(h.createdAt)}</span>}
                                            </div>
                                        </div>
                                        <Tooltip content="Versiyonu Görüntüle / İndir">
                                            <a href={getSecureUrl(h.fileUrl)} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors block">
                                                <Download size={18} />
                                            </a>
                                        </Tooltip>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
