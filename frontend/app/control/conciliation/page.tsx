'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import CustomSelect from '@/components/ui/CustomSelect';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TableActions from '@/components/ui/TableActions';
import ConfirmModal from '@/components/ConfirmModal';
import PersonCell from '@/components/ui/PersonCell';
import { DateDisplay } from '@/components/ui/DateDisplay';
import RequireRole from '@/components/auth/RequireRole';
import { MODULE_TERMS } from '@/lib/terminology';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { controlApi } from '@/lib/control-api';
import {
    Scale, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Send,
    Upload, FileText, Clock
} from 'lucide-react';

export default function ControlConciliationPage() {
    return (
        <RequireRole allowedRoles={['KONTROL_UZMANI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN', 'BIRIM_KULLANICISI']}>
            <ControlConciliationPageContent />
        </RequireRole>
    );
}

function ControlConciliationPageContent() {
    const { showToast } = useToast();
    const { user } = useAuth();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deficienciesList, setDeficienciesList] = useState<any[]>([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState<any>(null);

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

    // Form inputs
    const [unitResponseText, setUnitResponseText] = useState('');
    const [decisionType, setDecisionType] = useState<'UZLASILDI' | 'UST_YONETIM'>('UZLASILDI');
    const [decisionReason, setDecisionReason] = useState('');
    const [evidenceFileName, setEvidenceFileName] = useState('');
    const [evidenceDesc, setEvidenceDesc] = useState('');
    const [evidenceFilePath, setEvidenceFilePath] = useState('');
    const [approvalStatus, setApprovalStatus] = useState<'ONAYLANDI' | 'REDDEDILDI'>('ONAYLANDI');
    const [rejectionReason, setRejectionReason] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadDeficiencies = async () => {
        setLoading(true);
        try {
            const data = await controlApi.getDeficiencies();
            setDeficienciesList(Array.isArray(data) ? data : (data?.items || []));
        } catch (error) {
            console.error('Mutabakat verileri yükleme hatası:', error);
            showToast('Mutabakat verileri yüklenirken hata oluştu', 'error');
            setDeficienciesList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeficiencies();
    }, []);

    // Workflows
    const handleSendToConciliation = async (id: string) => {
        setSubmitting(true);
        try {
            await controlApi.sendToConciliation(id);
            showToast(`${MODULE_TERMS.control.tespitAdi} mutabakat için sorumlu birime gönderildi.`, 'success');
            setShowDetailModal(false);
            await loadDeficiencies();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitResponse = async (response: 'KATILIYOR' | 'KISMEN_KATILIYOR' | 'KATILMIYOR') => {
        if (!selectedDeficiency) return;
        if ((response === 'KISMEN_KATILIYOR' || response === 'KATILMIYOR') && !unitResponseText.trim()) {
            showToast('Lütfen yanıt gerekçenizi giriniz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.submitUnitResponse(selectedDeficiency.id, response, unitResponseText);
            showToast('Birim mutabakat yanıtı kaydedildi.', 'success');
            setShowDetailModal(false);
            setUnitResponseText('');
            await loadDeficiencies();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecideConciliation = async () => {
        if (!selectedDeficiency) return;
        if (decisionType === 'UST_YONETIM' && !decisionReason.trim()) {
            showToast('Uyuşmazlık kararı için gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.decideConciliation(selectedDeficiency.id, decisionType, decisionReason);
            showToast(`Mutabakat kararı kaydedildi (${decisionType === 'UZLASILDI' ? 'Uzlaşıldı' : 'Üst Yönetime Sevk'}).`, 'success');
            setShowDecisionModal(false);
            setShowDetailModal(false);
            setDecisionReason('');
            await loadDeficiencies();
        } catch (error) {
            showToast('Karar kaydedilemedi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOfficiallyNotify = async (id: string) => {
        setSubmitting(true);
        try {
            await controlApi.officiallyNotify(id);
            showToast(`${MODULE_TERMS.control.tespitAdi} resmen tebliğ edildi. Aksiyon takibi başladı.`, 'success');
            setShowDetailModal(false);
            await loadDeficiencies();
        } catch (error) {
            showToast('Tebliğ işlemi başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadEvidence = async () => {
        if (!selectedDeficiency || !evidenceFileName.trim() || !evidenceDesc.trim()) {
            showToast('Lütfen dosya adı ve açıklama alanlarını doldurunuz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.uploadEvidence(selectedDeficiency.id, evidenceFileName.trim(), evidenceDesc.trim(), evidenceFilePath);
            showToast('Aksiyon/Test kanıtı başarıyla yüklendi.', 'success');
            setShowUploadModal(false);
            setEvidenceFileName('');
            setEvidenceDesc('');
            setEvidenceFilePath('');
            await loadDeficiencies();
        } catch (error) {
            showToast('Kanıt yüklenemedi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproveEvidence = async () => {
        if (!selectedEvidence) return;
        if (selectedEvidence.uploadedById === user?.id) {
            showToast('Kanıtı yükleyen kişi kendi kanıtını onaylayamaz.', 'error');
            return;
        }
        if (approvalStatus === 'REDDEDILDI' && !rejectionReason.trim()) {
            showToast('Red Kararı için gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.approveEvidence(selectedEvidence.id, approvalStatus, rejectionReason);
            showToast(`Kanıt kararı başarıyla kaydedildi (${approvalStatus === 'ONAYLANDI' ? 'Onaylandı & Eksiklik Kapatıldı' : 'Reddedildi'}).`, 'success');
            setShowApprovalModal(false);
            setShowDetailModal(false);
            setSelectedEvidence(null);
            setRejectionReason('');
            await loadDeficiencies();
        } catch (error: any) {
            showToast(error.message || 'Kanıt değerlendirme başarısız oldu.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Filters & Pagination
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus([]);
        setSelectedSeverity([]);
    };

    const filtered = deficienciesList.filter((d: any) => {
        const title = d.title || '';
        const code = d.code || d.id || '';
        const unit = d.responsibleUnit || d.control?.department || '';
        const q = searchTerm.toLowerCase();

        const matchesSearch = title.toLowerCase().includes(q) || code.toLowerCase().includes(q) || unit.toLowerCase().includes(q);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(d.status);
        const matchesSeverity = selectedSeverity.length === 0 || selectedSeverity.includes(d.severity);

        return matchesSearch && matchesStatus && matchesSeverity;
    });

    const isFiltered = searchTerm !== '' || selectedStatus.length > 0 || selectedSeverity.length > 0;
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const getStageStep = (d: any) => {
        if (d.status === 'Kapalı') return 5;
        if (d.status === 'Aksiyonda') return 4;
        if (d.status === 'Tebliğ Edildi') return 3;
        if (d.conciliationStatus === 'UZLASILDI' || d.conciliationStatus === 'UST_YONETIM') return 2;
        if (d.status === 'Mutabakata Gönderildi' || d.unitResponse) return 1;
        return 0;
    };

    const columns: Column<any>[] = [
        {
            key: 'code',
            header: `${MODULE_TERMS.control.tespitAdi} Kodu & Tanım`,
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.code || row.id} />
                        <span className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer" onClick={() => { setSelectedDeficiency(row); setShowDetailModal(true); }}>
                            {row.title}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
                </div>
            )
        },
        {
            key: 'responsibleUnit',
            header: 'Sorumlu Birim',
            render: (row: any) => (
                <span className="text-xs font-medium text-slate-700">{row.responsibleUnit || row.control?.department || '-'}</span>
            )
        },
        {
            key: 'severity',
            header: 'Önem Düzeyi',
            render: (row: any) => <StatusBadge type="risk" value={row.severity} />
        },
        {
            key: 'status',
            header: 'İş Akış Durumu',
            render: (row: any) => <StatusBadge type="status" value={row.status} />
        },
        {
            key: 'unitResponse',
            header: 'Birim Yanıtı',
            render: (row: any) => <StatusBadge type="status" value={row.unitResponse || 'BEKLEMEDE'} />
        },
        {
            key: 'actions',
            header: 'İşlemler',
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'Detay & Süreç Takibi',
                            icon: <FileText size={14} />,
                            onClick: () => { setSelectedDeficiency(row); setShowDetailModal(true); }
                        },
                        {
                            label: 'Kanıt Yükle',
                            icon: <Upload size={14} />,
                            onClick: () => { setSelectedDeficiency(row); setShowUploadModal(true); }
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="İç Kontrol Mutabakat & Tebliğ Yönetimi"
                subtitle="Testler sonucu oluşan kontrol eksikliklerinin birimlerle mutabakat, resmi tebliğ, aksiyon takibi ve kanıt doğrulama süreçleri."
                actions={
                    <Button variant="outline" size="sm" onClick={loadDeficiencies} leftIcon={<RefreshCw size={14} />}>
                        Yenile
                    </Button>
                }
            />

            {/* Scorecard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Mutabakata Gönderilen"
                    value={deficienciesList.filter(d => d.status === 'Mutabakata Gönderildi').length}
                    icon={Send}
                    color="blue"
                />
                <StatCard
                    title="Birim Yanıtı Bekleyen"
                    value={deficienciesList.filter(d => d.unitResponse === 'BEKLEMEDE' && d.status === 'Mutabakata Gönderildi').length}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    title="Tebliğ Edilen & Aksiyonda"
                    value={deficienciesList.filter(d => d.status === 'Tebliğ Edildi' || d.status === 'Aksiyonda').length}
                    icon={ShieldCheck}
                    color="indigo"
                />
                <StatCard
                    title="Kapanan Eksiklikler"
                    value={deficienciesList.filter(d => d.status === 'Kapalı').length}
                    icon={CheckCircle2}
                    color="emerald"
                />
            </div>

            {/* Filter Toolbar */}
            <PageToolbar
                searchPlaceholder="Eksiklik kodu, tanım veya birim arayın..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadDeficiencies}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={selectedStatus.length + selectedSeverity.length}
                        onClear={clearFilters}
                    >
                        <div className="space-y-4 min-w-[220px]">
                            <CustomSelect
                                label="İş Akış Durumu"
                                placeholder="Tümü"
                                isMulti
                                value={selectedStatus}
                                onChange={(val) => setSelectedStatus(val as string[])}
                                options={[
                                    { value: 'Taslak', label: 'Taslak' },
                                    { value: 'Mutabakata Gönderildi', label: 'Mutabakata Gönderildi' },
                                    { value: 'Tebliğ Edildi', label: 'Tebliğ Edildi' },
                                    { value: 'Aksiyonda', label: 'Aksiyonda' },
                                    { value: 'Kapalı', label: 'Kapalı' }
                                ]}
                            />
                            <CustomSelect
                                label="Önem Düzeyi"
                                placeholder="Tümü"
                                isMulti
                                value={selectedSeverity}
                                onChange={(val) => setSelectedSeverity(val as string[])}
                                options={[
                                    { value: 'Düşük', label: 'Düşük' },
                                    { value: 'Orta', label: 'Orta' },
                                    { value: 'Yüksek', label: 'Yüksek' },
                                    { value: 'Kritik', label: 'Kritik' }
                                ]}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            {/* Table or EmptyState */}
            {filtered.length === 0 && !loading ? (
                <EmptyState
                    icon={Scale}
                    title="Mutabakat Kaydı Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun kontrol eksikliği kaydı bulunamadı. Filtreleri temizleyebilirsiniz.' : 'Sistemde henüz kayıtlı mutabakat veya tebliğ süreci bulunmuyor.'}
                    action={isFiltered ? { label: 'Filtreleri Temizle', onClick: clearFilters } : undefined}
                />
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={paginatedItems}
                        columns={columns}
                        loading={loading}
                        rowKey="id"
                        onRowClick={(row) => { setSelectedDeficiency(row); setShowDetailModal(true); }}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Detail & Stage Tracker Modal */}
            {showDetailModal && selectedDeficiency && (
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title={
                        <div className="flex items-center gap-3">
                            <CodeBadge code={selectedDeficiency.code || selectedDeficiency.id} />
                            <span className="font-bold text-slate-800">{selectedDeficiency.title}</span>
                        </div>
                    }
                    size="lg"
                >
                    <div className="space-y-6">
                        {/* Stage Stepper */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                İş Akış Aşamaları & İzlenebilirlik
                            </h4>
                            <div className="grid grid-cols-6 gap-2 text-center text-[11px]">
                                {[
                                    { stage: 'Taslak', step: 0, detail: selectedDeficiency.createdAt ? <DateDisplay date={selectedDeficiency.createdAt} /> : '-' },
                                    { stage: 'Mutabakat', step: 1, detail: selectedDeficiency.sentToUnitAt ? <DateDisplay date={selectedDeficiency.sentToUnitAt} /> : 'Bekliyor' },
                                    { stage: 'Karar', step: 2, detail: selectedDeficiency.conciliationStatus || 'Karar Bekliyor' },
                                    { stage: 'Tebliğ', step: 3, detail: selectedDeficiency.notifiedAt ? <DateDisplay date={selectedDeficiency.notifiedAt} /> : 'Yapılmadı' },
                                    { stage: 'Aksiyonda', step: 4, detail: selectedDeficiency.status === 'Aksiyonda' ? 'Aksiyon Sürüyor' : '-' },
                                    { stage: 'Kapalı', step: 5, detail: selectedDeficiency.closedAt ? <DateDisplay date={selectedDeficiency.closedAt} /> : '-' }
                                ].map((item, idx) => {
                                    const currentStep = getStageStep(selectedDeficiency);
                                    const isDone = currentStep >= item.step;
                                    const isCurrent = currentStep === item.step;
                                    return (
                                        <div key={idx} className={`p-2 rounded-lg border ${isCurrent ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' : isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-400'}`}>
                                            <div className="text-[10px] uppercase">{item.stage}</div>
                                            <div className="mt-1 font-mono text-[10px]">{item.detail}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Def Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                            <div><strong>Sorumlu Birim:</strong> {selectedDeficiency.responsibleUnit || selectedDeficiency.control?.department || '-'}</div>
                            <div><strong>Önem Düzeyi:</strong> <StatusBadge type="risk" value={selectedDeficiency.severity} /></div>
                            <div><strong>Durum:</strong> <StatusBadge type="status" value={selectedDeficiency.status} /></div>
                            <div><strong>Birim Yanıtı:</strong> <StatusBadge type="status" value={selectedDeficiency.unitResponse || 'BEKLEMEDE'} /></div>
                        </div>

                        {/* Unit Response Rationale */}
                        {selectedDeficiency.unitResponseReason && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
                                <strong>Birim Yanıt Gerekçesi:</strong>
                                <p className="text-slate-700 italic">{selectedDeficiency.unitResponseReason}</p>
                            </div>
                        )}

                        {/* Workflow Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            {selectedDeficiency.status === 'Taslak' && (
                                <Button variant="primary" size="sm" onClick={() => handleSendToConciliation(selectedDeficiency.id)} disabled={submitting}>
                                    Mutabakata Gönder
                                </Button>
                            )}

                            {selectedDeficiency.status === 'Mutabakata Gönderildi' && selectedDeficiency.unitResponse !== 'BEKLEMEDE' && (
                                <Button variant="primary" size="sm" onClick={() => setShowDecisionModal(true)}>
                                    Mutabakat Kararı Ver
                                </Button>
                            )}

                            {(selectedDeficiency.conciliationStatus === 'UZLASILDI' || selectedDeficiency.status === 'Mutabakata Gönderildi') && selectedDeficiency.status !== 'Tebliğ Edildi' && selectedDeficiency.status !== 'Kapalı' && (
                                <Button variant="secondary" size="sm" onClick={() => handleOfficiallyNotify(selectedDeficiency.id)} disabled={submitting}>
                                    Resmen Tebliğ Et
                                </Button>
                            )}

                            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                                Kanıt Yükle
                            </Button>
                        </div>

                        {/* Evidence List & Approval */}
                        {selectedDeficiency.evidences && selectedDeficiency.evidences.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Yüklenen Aksiyon Kanıtları</h4>
                                <div className="space-y-2">
                                    {selectedDeficiency.evidences.map((ev: any) => (
                                        <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                            <div>
                                                <span className="font-bold text-slate-800">{ev.fileName}</span>
                                                <p className="text-slate-500">{ev.description}</p>
                                                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                                    <span>Yükleyen: <PersonCell name={ev.uploadedById || 'Birim Kullanıcısı'} /></span>
                                                    <span>• Durum: <StatusBadge type="status" value={ev.approvalStatus} /></span>
                                                </div>
                                            </div>
                                            {ev.approvalStatus === 'BEKLEMEDE' && (
                                                <Button size="sm" variant="secondary" onClick={() => { setSelectedEvidence(ev); setShowApprovalModal(true); }}>
                                                    Değerlendir
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Decision Modal (decideConciliation) */}
            {showDecisionModal && (
                <Modal
                    isOpen={showDecisionModal}
                    onClose={() => setShowDecisionModal(false)}
                    title="İç Kontrol Mutabakat Kararı"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Karar Türü *</label>
                            <CustomSelect
                                value={decisionType}
                                onChange={(val) => setDecisionType(val as any)}
                                options={[
                                    { value: 'UZLASILDI', label: 'Uzlaşıldı (Mutabık Kalındı)' },
                                    { value: 'UST_YONETIM', label: 'Uyuşmazlık (Üst Yönetime Sevk)' }
                                ]}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">
                                Karar Gerekçesi {decisionType === 'UST_YONETIM' && '*'}
                            </label>
                            <FormTextarea
                                value={decisionReason}
                                onChange={(e) => setDecisionReason(e.target.value)}
                                placeholder="Karar açıklamasını ve görüşlerinizi yazınız..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowDecisionModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleDecideConciliation} disabled={submitting}>
                                {submitting ? 'Kaydediliyor...' : 'Kararı Kaydet'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Upload Evidence Modal (uploadEvidence) */}
            {showUploadModal && (
                <Modal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    title="Aksiyon / Test Kanıtı Yükle"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Dosya Adı *</label>
                            <FormInput
                                type="text"
                                value={evidenceFileName}
                                onChange={(e) => setEvidenceFileName(e.target.value)}
                                placeholder="Örn: Prosedür_Revizyon_Onayı.pdf"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Kanıt Açıklaması *</label>
                            <FormTextarea
                                value={evidenceDesc}
                                onChange={(e) => setEvidenceDesc(e.target.value)}
                                placeholder="Giderilen eksiklik ve tamamlanan aksiyon detayları..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Dosya Yolu / Bağlantı</label>
                            <FormInput
                                type="text"
                                value={evidenceFilePath}
                                onChange={(e) => setEvidenceFilePath(e.target.value)}
                                placeholder="/uploads/evidences/file.pdf"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleUploadEvidence} disabled={submitting}>
                                {submitting ? 'Yükleniyor...' : 'Kanıtı Kaydet'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Approve Evidence Modal (approveEvidence with self-approval rule) */}
            {showApprovalModal && selectedEvidence && (
                <Modal
                    isOpen={showApprovalModal}
                    onClose={() => setShowApprovalModal(false)}
                    title="Kanıt Değerlendirme Kararı"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div><strong>Kanıt:</strong> {selectedEvidence.fileName}</div>
                            <div className="flex items-center gap-1">
                                <strong>Yükleyen:</strong> <PersonCell name={selectedEvidence.uploadedById || 'Birim Kullanıcısı'} />
                            </div>
                        </div>

                        {selectedEvidence.uploadedById === user?.id && (
                            <div className="p-3 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                                <span>Kendi yüklediğiniz kanıtı onaylayamazsınız. Başka bir kontrol yöneticisinin incelemesi gerekmektedir.</span>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Onay Kararı *</label>
                            <CustomSelect
                                value={approvalStatus}
                                onChange={(val) => setApprovalStatus(val as any)}
                                options={[
                                    { value: 'ONAYLANDI', label: 'Onayla & Eksikliği Kapat' },
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
                                disabled={submitting || selectedEvidence.uploadedById === user?.id}
                            >
                                {submitting ? 'İşleniyor...' : 'Kararı Onayla'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
