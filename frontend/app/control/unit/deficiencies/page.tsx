'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TableActions from '@/components/ui/TableActions';
import PersonCell from '@/components/ui/PersonCell';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { MODULE_TERMS } from '@/lib/terminology';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { controlApi } from '@/lib/control-api';
import {
    AlertOctagon, FileText, Send, Upload,
    RefreshCw
} from 'lucide-react';

export default function ControlUnitDeficienciesPage() {
    return (
        <RequireRole allowedRoles={['BIRIM_KULLANICISI', 'KONTROL_UZMANI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlUnitDeficienciesContent />
        </RequireRole>
    );
}

function ControlUnitDeficienciesContent() {
    const { showToast } = useToast();
    const { user } = useAuth();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deficiencies, setDeficiencies] = useState<any[]>([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState<any>(null);

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Form States
    const [unitResponse, setUnitResponse] = useState<'KATILIYOR' | 'KISMEN_KATILIYOR' | 'KATILMIYOR'>('KATILIYOR');
    const [unitResponseReason, setUnitResponseReason] = useState('');
    const [actionPlanText, setActionPlanText] = useState('');
    const [evidenceFileName, setEvidenceFileName] = useState('');
    const [evidenceDesc, setEvidenceDesc] = useState('');
    const [evidenceFilePath, setEvidenceFilePath] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadDeficiencies = async () => {
        setLoading(true);
        try {
            const department = user?.department || undefined;
            const data = await controlApi.getDeficiencies({ department });
            const list = Array.isArray(data) ? data : (data?.items || []);
            setDeficiencies(list);
        } catch (error) {
            console.error('Birim eksiklikleri yükleme hatası:', error);
            showToast('Eksiklik verileri yüklenirken hata oluştu.', 'error');
            setDeficiencies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeficiencies();
    }, [user?.department]);

    // Submit Handlers
    const handleSubmitResponse = async () => {
        if (!selectedDeficiency) return;
        if ((unitResponse === 'KISMEN_KATILIYOR' || unitResponse === 'KATILMIYOR') && !unitResponseReason.trim()) {
            showToast('Kısmen katılma veya katılmama durumunda gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.submitUnitResponse(selectedDeficiency.id, unitResponse, unitResponseReason);
            showToast('Mutabakat yanıtınız kaydedildi.', 'success');
            setShowResponseModal(false);
            setShowDetailModal(false);
            setUnitResponseReason('');
            await loadDeficiencies();
        } catch (error) {
            showToast('Yanıt kaydedilemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateActionPlan = async () => {
        if (!selectedDeficiency || !actionPlanText.trim()) {
            showToast('Lütfen aksiyon planı açıklamasını giriniz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.updateDeficiencyStatus(selectedDeficiency.id, 'Aksiyonda', actionPlanText);
            showToast('Aksiyon planı başarıyla kaydedildi.', 'success');
            setShowActionPlanModal(false);
            setShowDetailModal(false);
            setActionPlanText('');
            await loadDeficiencies();
        } catch (error) {
            showToast('Aksiyon planı güncellenemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadEvidence = async () => {
        if (!selectedDeficiency || !evidenceFileName.trim() || !evidenceDesc.trim()) {
            showToast('Lütfen dosya adı ve açıklamasını giriniz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await controlApi.uploadEvidence(selectedDeficiency.id, evidenceFileName.trim(), evidenceDesc.trim(), evidenceFilePath);
            showToast('Aksiyon kanıtı başarıyla yüklendi.', 'success');
            setShowUploadModal(false);
            setEvidenceFileName('');
            setEvidenceDesc('');
            setEvidenceFilePath('');
            await loadDeficiencies();
        } catch (error) {
            showToast('Kanıt yüklenemedi.', 'error');
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

    const filtered = deficiencies.filter((d: any) => {
        const title = d.title || '';
        const code = d.code || d.id || '';
        const q = searchTerm.toLowerCase();

        const matchesSearch = title.toLowerCase().includes(q) || code.toLowerCase().includes(q);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(d.status);
        const matchesSeverity = selectedSeverity.length === 0 || selectedSeverity.includes(d.severity);

        return matchesSearch && matchesStatus && matchesSeverity;
    });

    const isFiltered = searchTerm !== '' || selectedStatus.length > 0 || selectedSeverity.length > 0;
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns: Column<any>[] = [
        {
            key: 'code',
            header: `${MODULE_TERMS.control.tespitAdi} Kodu & Tanım`,
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.code || row.id} />
                        <span
                            className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer"
                            onClick={() => { setSelectedDeficiency(row); setShowDetailModal(true); }}
                        >
                            {row.title}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
                </div>
            )
        },
        {
            key: 'severity',
            header: 'Önem Düzeyi',
            render: (row: any) => <StatusBadge type="risk" value={row.severity} />
        },
        {
            key: 'status',
            header: 'Durum',
            render: (row: any) => <StatusBadge type="status" value={row.status} />
        },
        {
            key: 'unitResponse',
            header: 'Birim Yanıtı',
            render: (row: any) => <StatusBadge type="status" value={row.unitResponse || 'BEKLEMEDE'} />
        },
        {
            key: 'dueDate',
            header: 'Termin Tarihi',
            render: (row: any) => row.dueDate ? <DateDisplay date={row.dueDate} /> : <span className="text-slate-400 font-mono text-xs">-</span>
        },
        {
            key: 'actions',
            header: 'İşlemler',
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'İncele & Yanıtla',
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
                title="Birim Kontrol Eksiklikleri & Aksiyon Yönetimi"
                subtitle="Biriminizle ilgili tebliğ edilen kontrol eksiklikleri, mutabakat bildirimleri, aksiyon planları ve kanıt belgeleri."
                actions={
                    <Button variant="outline" size="sm" onClick={loadDeficiencies} leftIcon={<RefreshCw size={14} />}>
                        Yenile
                    </Button>
                }
            />

            {/* Page Toolbar */}
            <PageToolbar
                searchPlaceholder="Eksiklik kodu veya tanım arayınız..."
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
                    icon={AlertOctagon}
                    title="Birim Eksikliği Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun eksiklik kaydı bulunamadı. Filtreleri temizleyebilirsiniz.' : 'Biriminizin sorumluluğunda aktif kontrol eksikliği kaydı bulunmuyor.'}
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

            {/* Detail & Action Modal */}
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
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
                            <div><strong>Önem Düzeyi:</strong> <StatusBadge type="risk" value={selectedDeficiency.severity} /></div>
                            <div><strong>İş Akış Durumu:</strong> <StatusBadge type="status" value={selectedDeficiency.status} /></div>
                            <div><strong>Birim Yanıtı:</strong> <StatusBadge type="status" value={selectedDeficiency.unitResponse || 'BEKLEMEDE'} /></div>
                            <div><strong>Termin Tarihi:</strong> {selectedDeficiency.dueDate ? <DateDisplay date={selectedDeficiency.dueDate} /> : 'Belirtilmedi'}</div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1 text-xs">
                            <strong className="text-slate-700 uppercase">Kontrol Eksikliği Açıklaması:</strong>
                            <p className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700">{selectedDeficiency.description}</p>
                        </div>

                        {/* Current Action Plan */}
                        {selectedDeficiency.actionPlan && (
                            <div className="space-y-1 text-xs">
                                <strong className="text-slate-700 uppercase">Kayıtlı Aksiyon Planı:</strong>
                                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium">{selectedDeficiency.actionPlan}</p>
                            </div>
                        )}

                        {/* Quick Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" size="sm" onClick={() => setShowResponseModal(true)}>
                                Mutabakat Yanıtı Ver
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => setShowActionPlanModal(true)}>
                                Aksiyon Planı Gir
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                                Kanıt Yükle
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Unit Response Modal */}
            {showResponseModal && selectedDeficiency && (
                <Modal
                    isOpen={showResponseModal}
                    onClose={() => setShowResponseModal(false)}
                    title="Birim Mutabakat Yanıtı"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Mutabakat Görüşünüz *</label>
                            <CustomSelect
                                value={unitResponse}
                                onChange={(val) => setUnitResponse(val as any)}
                                options={[
                                    { value: 'KATILIYOR', label: 'Katılıyorum (Aksiyon Alınacak)' },
                                    { value: 'KISMEN_KATILIYOR', label: 'Kısmen Katılıyorum' },
                                    { value: 'KATILMIYOR', label: 'Katılmıyorum' }
                                ]}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">
                                Yanıt Gerekçesi {(unitResponse === 'KISMEN_KATILIYOR' || unitResponse === 'KATILMIYOR') && '*'}
                            </label>
                            <FormTextarea
                                value={unitResponseReason}
                                onChange={(e) => setUnitResponseReason(e.target.value)}
                                placeholder="Mutabakat görüşünüzün ayrıntılı gerekçesini yazınız..."
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowResponseModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleSubmitResponse} disabled={submitting}>
                                {submitting ? 'Kaydediliyor...' : 'Yanıtı Gönder'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Action Plan Modal */}
            {showActionPlanModal && selectedDeficiency && (
                <Modal
                    isOpen={showActionPlanModal}
                    onClose={() => setShowActionPlanModal(false)}
                    title="Aksiyon Planı Tanımla"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Aksiyon Planı Açıklaması *</label>
                            <FormTextarea
                                value={actionPlanText}
                                onChange={(e) => setActionPlanText(e.target.value)}
                                placeholder="Eksikliği gidermek için yapılacak adımlar, sorumlu ve hedeflenen tarih..."
                                rows={4}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowActionPlanModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleUpdateActionPlan} disabled={submitting}>
                                {submitting ? 'Kaydediliyor...' : 'Aksiyon Planını Kaydet'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Evidence Upload Modal */}
            {showUploadModal && selectedDeficiency && (
                <Modal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    title="Aksiyon Kanıt Belgesi Yükle"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Kanıt Belge Adı *</label>
                            <FormInput
                                type="text"
                                value={evidenceFileName}
                                onChange={(e) => setEvidenceFileName(e.target.value)}
                                placeholder="Örn: Ek_Kontrol_Raporu.pdf"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Açıklama *</label>
                            <FormTextarea
                                value={evidenceDesc}
                                onChange={(e) => setEvidenceDesc(e.target.value)}
                                placeholder="Yüklenen kanıt belgesinin içeriği ve tamamlanan aksiyon..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Dosya Yolu / URL</label>
                            <FormInput
                                type="text"
                                value={evidenceFilePath}
                                onChange={(e) => setEvidenceFilePath(e.target.value)}
                                placeholder="/uploads/evidences/doc.pdf"
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
        </div>
    );
}
