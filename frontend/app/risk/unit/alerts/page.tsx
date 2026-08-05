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
import { riskApi } from '@/lib/risk-api';
import {
    AlertOctagon, FileText, Send, Upload, RefreshCw
} from 'lucide-react';

export default function RiskUnitAlertsPage() {
    return (
        <RequireRole allowedRoles={['BIRIM_KULLANICISI', 'RISK_UZMANI', 'RISK_YONETICI', 'ADMIN', 'SUPER_ADMIN']}>
            <RiskUnitAlertsContent />
        </RequireRole>
    );
}

function RiskUnitAlertsContent() {
    const { showToast } = useToast();
    const { user } = useAuth();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedRisk, setSelectedRisk] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<any>(null);

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
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

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const department = user?.department || undefined;
            const data = await riskApi.getAlerts({ birimId: department });
            const list = Array.isArray(data) ? data : (data?.items || []);
            setAlerts(list);
        } catch (error) {
            console.error('Birim uyarıları yükleme hatası:', error);
            showToast('Risk uyarı verileri yüklenirken hata oluştu.', 'error');
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, [user?.department]);

    // Handlers
    const handleSubmitResponse = async () => {
        if (!selectedAlert) return;
        if ((unitResponse === 'KISMEN_KATILIYOR' || unitResponse === 'KATILMIYOR') && !unitResponseReason.trim()) {
            showToast('Kısmen katılma veya katılmama durumunda gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.submitUnitResponse(selectedAlert.uyari_id, unitResponse, unitResponseReason);
            showToast('Birim uyarı yanıtı başarıyla kaydedildi.', 'success');
            setShowResponseModal(false);
            setShowDetailModal(false);
            setUnitResponseReason('');
            await loadAlerts();
        } catch (error) {
            showToast('Yanıt kaydedilemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateAction = async () => {
        if (!selectedAlert || !actionPlanText.trim()) {
            showToast('Lütfen aksiyon planı açıklamasını giriniz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.createAction(selectedAlert.uyari_id, actionPlanText, user?.id, user?.department || undefined);
            showToast('Risk aksiyonu başarıyla tanımlandı.', 'success');
            setShowActionModal(false);
            setShowDetailModal(false);
            setActionPlanText('');
            await loadAlerts();
        } catch (error) {
            showToast('Aksiyon tanımlanamadı.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadEvidence = async () => {
        if (!selectedAlert || !evidenceFileName.trim() || !evidenceDesc.trim()) {
            showToast('Lütfen dosya adı ve açıklama alanlarını doldurunuz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            const firstAction = selectedAlert.actions?.[0];
            if (!firstAction) {
                const newAction = await riskApi.createAction(selectedAlert.uyari_id, 'Önlem Aksiyonu', user?.id, user?.department || undefined);
                await riskApi.uploadActionEvidence(newAction.id, evidenceFileName.trim(), evidenceDesc.trim(), evidenceFilePath);
            } else {
                await riskApi.uploadActionEvidence(firstAction.id, evidenceFileName.trim(), evidenceDesc.trim(), evidenceFilePath);
            }
            showToast('Kanıt belgesi yüklendi.', 'success');
            setShowUploadModal(false);
            setEvidenceFileName('');
            setEvidenceDesc('');
            setEvidenceFilePath('');
            await loadAlerts();
        } catch (error) {
            showToast('Kanıt yüklenemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus([]);
        setSelectedRisk([]);
    };

    const filtered = alerts.filter((a: any) => {
        const kpi = a.kpi_kodu || '';
        const msg = a.mesaj || '';
        const q = searchTerm.toLowerCase();

        const matchesSearch = kpi.toLowerCase().includes(q) || msg.toLowerCase().includes(q);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(a.durum);
        const matchesRisk = selectedRisk.length === 0 || selectedRisk.includes(a.risk_seviyesi);

        return matchesSearch && matchesStatus && matchesRisk;
    });

    const isFiltered = searchTerm !== '' || selectedStatus.length > 0 || selectedRisk.length > 0;
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns: Column<any>[] = [
        {
            key: 'uyari_id',
            header: `${MODULE_TERMS.risk.tespitAdi} & Gösterge`,
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.kpi_kodu || row.uyari_id} />
                        <span
                            className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer"
                            onClick={() => { setSelectedAlert(row); setShowDetailModal(true); }}
                        >
                            {row.mesaj || `${row.kpi_kodu} Limit Aşımı`}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'risk_seviyesi',
            header: 'Risk Seviyesi',
            render: (row: any) => <StatusBadge type="risk" value={row.risk_seviyesi} />
        },
        {
            key: 'durum',
            header: 'Durum',
            render: (row: any) => <StatusBadge type="status" value={row.durum} />
        },
        {
            key: 'birimYaniti',
            header: 'Birim Yanıtı',
            render: (row: any) => <StatusBadge type="status" value={row.birimYaniti || 'BEKLEMEDE'} />
        },
        {
            key: 'tarih',
            header: 'Tarih',
            render: (row: any) => <DateDisplay date={row.tarih || row.created_at} />
        },
        {
            key: 'actions',
            header: 'İşlemler',
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'Yanıt Ver & Detay',
                            icon: <FileText size={14} />,
                            onClick: () => { setSelectedAlert(row); setShowDetailModal(true); }
                        },
                        {
                            label: 'Kanıt Belgesi Yükle',
                            icon: <Upload size={14} />,
                            onClick: () => { setSelectedAlert(row); setShowUploadModal(true); }
                        }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Birim Risk Limit Aşımları & Yanıt Yönetimi"
                subtitle={`Biriminizle ilgili bildirilen risk gösterge ihlalleri, mutabakat yanıtları ve aksiyon planları (${MODULE_TERMS.risk.birimKisa}).`}
                actions={
                    <Button variant="outline" size="sm" onClick={loadAlerts} leftIcon={<RefreshCw size={14} />}>
                        Yenile
                    </Button>
                }
            />

            {/* Toolbar */}
            <PageToolbar
                searchPlaceholder="Gösterge kodu veya uyarı mesajı arayınız..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadAlerts}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={selectedStatus.length + selectedRisk.length}
                        onClear={clearFilters}
                    >
                        <div className="space-y-4 min-w-[220px]">
                            <CustomSelect
                                label="Durum"
                                placeholder="Tümü"
                                isMulti
                                value={selectedStatus}
                                onChange={(val) => setSelectedStatus(val as string[])}
                                options={[
                                    { value: 'OPEN', label: 'Açık' },
                                    { value: 'ASSIGNED', label: 'Birime Atandı' },
                                    { value: 'RESPONSE_SUBMITTED', label: 'Yanıt Verildi' },
                                    { value: 'IN_ACTION', label: 'Aksiyonda' },
                                    { value: 'CLOSED', label: 'Kapalı' }
                                ]}
                            />
                            <CustomSelect
                                label="Risk Seviyesi"
                                placeholder="Tümü"
                                isMulti
                                value={selectedRisk}
                                onChange={(val) => setSelectedRisk(val as string[])}
                                options={[
                                    { value: 'DUSUK', label: 'Düşük' },
                                    { value: 'ORTA', label: 'Orta' },
                                    { value: 'YUKSEK', label: 'Yüksek' },
                                    { value: 'KRITIK', label: 'Kritik' }
                                ]}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            {/* Content Table or EmptyState */}
            {filtered.length === 0 && !loading ? (
                <EmptyState
                    icon={AlertOctagon}
                    title="Birim Uyarısı Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun risk uyarısı bulunamadı. Filtreleri temizleyebilirsiniz.' : 'Biriminizin sorumluluğunda bildirilmiş aktif risk limit aşımı uyarısı bulunmuyor.'}
                    action={isFiltered ? { label: 'Filtreleri Temizle', onClick: clearFilters } : undefined}
                />
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={paginatedItems}
                        columns={columns}
                        loading={loading}
                        rowKey="uyari_id"
                        onRowClick={(row) => { setSelectedAlert(row); setShowDetailModal(true); }}
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
            {showDetailModal && selectedAlert && (
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title={
                        <div className="flex items-center gap-3">
                            <CodeBadge code={selectedAlert.kpi_kodu || selectedAlert.uyari_id} />
                            <span className="font-bold text-slate-800">{selectedAlert.mesaj || `${selectedAlert.kpi_kodu} Limit İhlali`}</span>
                        </div>
                    }
                    size="lg"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
                            <div><strong>Risk Seviyesi:</strong> <StatusBadge type="risk" value={selectedAlert.risk_seviyesi} /></div>
                            <div><strong>Durum:</strong> <StatusBadge type="status" value={selectedAlert.durum} /></div>
                            <div><strong>Birim Yanıtı:</strong> <StatusBadge type="status" value={selectedAlert.birimYaniti || 'BEKLEMEDE'} /></div>
                            <div><strong>Bildirim Tarihi:</strong> <DateDisplay date={selectedAlert.tarih || selectedAlert.created_at} /></div>
                        </div>

                        {selectedAlert.birimYaniti && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                                <strong>Kayıtlı Birim Yanıtı & Gerekçesi:</strong>
                                <p className="text-slate-700 italic">{selectedAlert.yanitGerekcesi || 'Gerekçe belirtilmedi.'}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" size="sm" onClick={() => setShowResponseModal(true)}>
                                Birim Yanıtı Ver
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => setShowActionModal(true)}>
                                Aksiyon Tanımla
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                                Kanıt Yükle
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Response Modal */}
            {showResponseModal && selectedAlert && (
                <Modal
                    isOpen={showResponseModal}
                    onClose={() => setShowResponseModal(false)}
                    title="Birim Limit Aşımı Yanıtı"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Görüşünüz *</label>
                            <CustomSelect
                                value={unitResponse}
                                onChange={(val) => setUnitResponse(val as any)}
                                options={[
                                    { value: 'KATILIYOR', label: 'Katılıyorum (Düzeltici Aksiyon Alınacak)' },
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
                                placeholder="Görüşünüzün detaylı açıklamasını giriniz..."
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

            {/* Action Modal */}
            {showActionModal && selectedAlert && (
                <Modal
                    isOpen={showActionModal}
                    onClose={() => setShowActionModal(false)}
                    title="Risk Aksiyon Planı Tanımla"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Aksiyon Tanımı *</label>
                            <FormTextarea
                                value={actionPlanText}
                                onChange={(e) => setActionPlanText(e.target.value)}
                                placeholder="Limit aşımını gidermek için alınacak tedbirler..."
                                rows={4}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowActionModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleCreateAction} disabled={submitting}>
                                {submitting ? 'Kaydediliyor...' : 'Aksiyonu Kaydet'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Upload Modal */}
            {showUploadModal && selectedAlert && (
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
                                placeholder="Örn: Rasyo_Duzeltme_Raporu.pdf"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Açıklama *</label>
                            <FormTextarea
                                value={evidenceDesc}
                                onChange={(e) => setEvidenceDesc(e.target.value)}
                                placeholder="Kanıt belgesi ve tamamlanan aksiyon detayları..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Dosya Yolu</label>
                            <FormInput
                                type="text"
                                value={evidenceFilePath}
                                onChange={(e) => setEvidenceFilePath(e.target.value)}
                                placeholder="/uploads/risk/evidence.pdf"
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
