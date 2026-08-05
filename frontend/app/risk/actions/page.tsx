'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import TableActions from '@/components/ui/TableActions';
import PersonCell from '@/components/ui/PersonCell';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { MODULE_TERMS } from '@/lib/terminology';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { riskApi } from '@/lib/risk-api';
import {
    Activity, Clock, CheckCircle2, AlertTriangle, ShieldCheck,
    RefreshCw, Upload, FileText
} from 'lucide-react';

export default function RiskActionsPage() {
    return (
        <RequireRole allowedRoles={['RISK_UZMANI', 'RISK_YONETICI', 'ADMIN', 'SUPER_ADMIN', 'BIRIM_KULLANICISI']}>
            <RiskActionsContent />
        </RequireRole>
    );
}

function RiskActionsContent() {
    const { showToast } = useToast();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actionsList, setActionsList] = useState<any[]>([]);
    const [selectedAction, setSelectedAction] = useState<any>(null);

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

    // Form inputs
    const [evidenceFileName, setEvidenceFileName] = useState('');
    const [evidenceDesc, setEvidenceDesc] = useState('');
    const [evidenceFilePath, setEvidenceFilePath] = useState('');
    const [approvalStatus, setApprovalStatus] = useState<'ONAYLANDI' | 'REDDEDILDI'>('ONAYLANDI');
    const [rejectionReason, setRejectionReason] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadActions = async () => {
        setLoading(true);
        try {
            const data = await riskApi.getActions();
            setActionsList(Array.isArray(data) ? data : (data?.items || []));
        } catch (error) {
            console.error('Risk aksiyonları yükleme hatası:', error);
            showToast('Risk aksiyon verileri yüklenirken hata oluştu.', 'error');
            setActionsList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActions();
    }, []);

    const handleUploadEvidence = async () => {
        if (!selectedAction || !evidenceFileName.trim() || !evidenceDesc.trim()) {
            showToast('Lütfen dosya adı ve açıklama alanlarını doldurunuz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.uploadActionEvidence(selectedAction.id, evidenceFileName.trim(), evidenceDesc.trim(), evidenceFilePath);
            showToast('Aksiyon kanıt belgesi başarıyla yüklendi.', 'success');
            setShowUploadModal(false);
            setEvidenceFileName('');
            setEvidenceDesc('');
            setEvidenceFilePath('');
            await loadActions();
        } catch (error) {
            showToast('Kanıt belgesi yüklenemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproveEvidence = async () => {
        if (!selectedEvidence) return;
        if (selectedEvidence.yukleyenId === user?.id) {
            showToast('Kanıtı yükleyen kişi kendi kanıtını onaylayamaz.', 'error');
            return;
        }
        if (approvalStatus === 'REDDEDILDI' && !rejectionReason.trim()) {
            showToast('Red kararı için gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.approveActionEvidence(selectedEvidence.id, approvalStatus, rejectionReason);
            showToast(`Kanıt değerlendirme kararı kaydedildi (${approvalStatus === 'ONAYLANDI' ? 'Onaylandı & Aksiyon Tamamlandı' : 'Reddedildi'}).`, 'success');
            setShowApprovalModal(false);
            setShowDetailModal(false);
            setSelectedEvidence(null);
            setRejectionReason('');
            await loadActions();
        } catch (error: any) {
            showToast(error.message || 'Değerlendirme kararı kaydedilemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus([]);
    };

    const filtered = actionsList.filter((a: any) => {
        const desc = a.aksiyonTanimi || '';
        const unit = a.sorumluBirimId || '';
        const q = searchTerm.toLowerCase();

        const matchesSearch = desc.toLowerCase().includes(q) || unit.toLowerCase().includes(q);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(a.durum);

        return matchesSearch && matchesStatus;
    });

    const isFiltered = searchTerm !== '' || selectedStatus.length > 0;
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Scorecard Stats
    const pendingCount = actionsList.filter(a => a.durum === 'Planlandı' || a.durum === 'Devam').length;
    const completedCount = actionsList.filter(a => a.durum === 'Tamamlandı').length;
    const delayedCount = actionsList.filter(a => {
        if (a.durum === 'Tamamlandı') return false;
        if (!a.terminTarihi) return false;
        return new Date(a.terminTarihi) < new Date();
    }).length;

    const columns: Column<any>[] = [
        {
            key: 'aksiyonTanimi',
            header: 'Aksiyon Tanımı',
            render: (row: any) => (
                <div className="space-y-1">
                    <span className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer" onClick={() => { setSelectedAction(row); setShowDetailModal(true); }}>
                        {row.aksiyonTanimi}
                    </span>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Sorumlu Birim: {row.sorumluBirimId || 'Belirtilmedi'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'sorumluId',
            header: 'Sorumlu',
            render: (row: any) => <PersonCell name={row.sorumluId || 'Atanmadı'} />
        },
        {
            key: 'durum',
            header: 'Durum',
            render: (row: any) => <StatusBadge type="status" value={row.durum} />
        },
        {
            key: 'terminTarihi',
            header: 'Termin Tarihi',
            render: (row: any) => row.terminTarihi ? <DateDisplay date={row.terminTarihi} /> : <span className="text-slate-400 font-mono text-xs">-</span>
        },
        {
            key: 'actions',
            header: 'İşlemler',
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'Aksiyon Detayı',
                            icon: <FileText size={14} />,
                            onClick: () => { setSelectedAction(row); setShowDetailModal(true); }
                        },
                        {
                            label: 'Kanıt Belgesi Yükle',
                            icon: <Upload size={14} />,
                            onClick: () => { setSelectedAction(row); setShowUploadModal(true); }
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Risk Aksiyon Takibi & Kanıt Yönetimi"
                subtitle={`Limit aşımı ve risk göstergeleri kaynaklı aksiyon planları, termin takibi, sorumlu birimler ve doğrulama kanıtları (${MODULE_TERMS.risk.birimKisa}).`}
                actions={
                    <Button variant="outline" size="sm" onClick={loadActions} leftIcon={<RefreshCw size={14} />}>
                        Yenile
                    </Button>
                }
            />

            {/* Scorecard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Devam Eden Aksiyonlar"
                    value={pendingCount}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    title="Geciken Aksiyonlar"
                    value={delayedCount}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Tamamlanan Aksiyonlar"
                    value={completedCount}
                    icon={CheckCircle2}
                    color="emerald"
                />
            </div>

            {/* Toolbar */}
            <PageToolbar
                searchPlaceholder="Aksiyon tanımı veya sorumlu birim arayınız..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadActions}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={selectedStatus.length}
                        onClear={clearFilters}
                    >
                        <div className="space-y-4 min-w-[220px]">
                            <CustomSelect
                                label="Aksiyon Durumu"
                                placeholder="Tümü"
                                isMulti
                                value={selectedStatus}
                                onChange={(val) => setSelectedStatus(val as string[])}
                                options={[
                                    { value: 'Planlandı', label: 'Planlandı' },
                                    { value: 'Devam', label: 'Devam Ediyor' },
                                    { value: 'Tamamlandı', label: 'Tamamlandı' },
                                    { value: 'Gecikmiş', label: 'Gecikmiş' }
                                ]}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            {/* Content */}
            {filtered.length === 0 && !loading ? (
                <EmptyState
                    icon={Activity}
                    title="Aksiyon Kaydı Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun risk aksiyonu bulunamadı. Filtreleri temizleyebilirsiniz.' : 'Henüz tanımlanmış aktif bir risk aksiyon kaydı bulunmuyor.'}
                    action={isFiltered ? { label: 'Filtreleri Temizle', onClick: clearFilters } : undefined}
                />
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={paginatedItems}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                        onRowClick={(row) => { setSelectedAction(row); setShowDetailModal(true); }}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Action Detail Modal */}
            {showDetailModal && selectedAction && (
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title={
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">{selectedAction.aksiyonTanimi}</span>
                        </div>
                    }
                    size="lg"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
                            <div><strong>Sorumlu Birim:</strong> {selectedAction.sorumluBirimId || 'Belirtilmedi'}</div>
                            <div><strong>Sorumlu Kişi:</strong> <PersonCell name={selectedAction.sorumluId || 'Atanmadı'} /></div>
                            <div><strong>Durum:</strong> <StatusBadge type="status" value={selectedAction.durum} /></div>
                            <div><strong>Termin Tarihi:</strong> {selectedAction.terminTarihi ? <DateDisplay date={selectedAction.terminTarihi} /> : 'Belirtilmedi'}</div>
                        </div>

                        {/* Evidence List & Approval */}
                        {selectedAction.evidences && selectedAction.evidences.length > 0 ? (
                            <div className="space-y-3 pt-4 border-t">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Yüklenen Aksiyon Kanıt Belgeleri</h4>
                                <div className="space-y-2">
                                    {selectedAction.evidences.map((ev: any) => (
                                        <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                            <div>
                                                <span className="font-bold text-slate-800">{ev.dosyaId}</span>
                                                <p className="text-slate-500">{ev.aciklama}</p>
                                                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                                    <span>Yükleyen: <PersonCell name={ev.yukleyenId || 'Kullanıcı'} /></span>
                                                    <span>• Durum: <StatusBadge type="status" value={ev.onayDurumu} /></span>
                                                </div>
                                            </div>
                                            {ev.onayDurumu === 'BEKLEMEDE' && (
                                                <Button size="sm" variant="secondary" onClick={() => { setSelectedEvidence(ev); setShowApprovalModal(true); }}>
                                                    Değerlendir
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                                Bu aksiyona henüz doğrulama kanıt belgesi yüklenmedi.
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                                Kanıt Yükle
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Evidence Upload Modal */}
            {showUploadModal && selectedAction && (
                <Modal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    title="Aksiyon Kanıt Belgesi Yükle"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Dosya Adı / Kodu *</label>
                            <FormInput
                                type="text"
                                value={evidenceFileName}
                                onChange={(e) => setEvidenceFileName(e.target.value)}
                                placeholder="Örn: Risk_Limit_Aksiyon_Raporu.pdf"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Açıklama *</label>
                            <FormTextarea
                                value={evidenceDesc}
                                onChange={(e) => setEvidenceDesc(e.target.value)}
                                placeholder="Aksiyonun nasıl tamamlandığına dair detaylar..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Dosya Yolu</label>
                            <FormInput
                                type="text"
                                value={evidenceFilePath}
                                onChange={(e) => setEvidenceFilePath(e.target.value)}
                                placeholder="/uploads/risk/doc.pdf"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleUploadEvidence} disabled={submitting}>
                                {submitting ? 'Yükleniyor...' : 'Kanıtı Yükle'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Evidence Approval Modal */}
            {showApprovalModal && selectedEvidence && (
                <Modal
                    isOpen={showApprovalModal}
                    onClose={() => setShowApprovalModal(false)}
                    title="Kanıt Değerlendirme Kararı"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div><strong>Dosya:</strong> {selectedEvidence.dosyaId}</div>
                            <div className="flex items-center gap-1">
                                <strong>Yükleyen:</strong> <PersonCell name={selectedEvidence.yukleyenId || 'Kullanıcı'} />
                            </div>
                        </div>

                        {selectedEvidence.yukleyenId === user?.id && (
                            <div className="p-3 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                                <span>Kendi yüklediğiniz kanıtı onaylayamazsınız. Başka bir risk yöneticisinin incelemesi gerekmektedir.</span>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Değerlendirme Kararı *</label>
                            <CustomSelect
                                value={approvalStatus}
                                onChange={(val) => setApprovalStatus(val as any)}
                                options={[
                                    { value: 'ONAYLANDI', label: 'Onayla & Aksiyonu Tamamla' },
                                    { value: 'REDDEDILDI', label: 'Reddet (Yetersiz Kanıt)' }
                                ]}
                            />
                        </div>

                        {approvalStatus === 'REDDEDILDI' && (
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Red Gerekçesi *</label>
                                <FormTextarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Kanıtın neden yetersiz olduğunu yazınız..."
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>İptal</Button>
                            <Button
                                variant="primary"
                                onClick={handleApproveEvidence}
                                disabled={submitting || selectedEvidence.yukleyenId === user?.id}
                            >
                                {submitting ? 'İşleniyor...' : 'Kararı Kaydet'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
