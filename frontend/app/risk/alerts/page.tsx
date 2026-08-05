'use client';
import RefreshButton from '@/components/ui/RefreshButton';

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
    AlertTriangle, ShieldCheck, Clock, CheckCircle2,
    RefreshCw, Send, Upload, FileText, UserCheck
} from 'lucide-react';

export default function RiskAlertsPage() {
    return (
        <RequireRole allowedRoles={['RISK_UZMANI', 'RISK_YONETICI', 'ADMIN', 'SUPER_ADMIN', 'BIRIM_KULLANICISI']}>
            <RiskAlertsContent />
        </RequireRole>
    );
}

function RiskAlertsContent() {
    const { showToast } = useToast();
    const { user } = useAuth();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedRisk, setSelectedRisk] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alertsList, setAlertsList] = useState<any[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<any>(null);

    // Modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

    // Form inputs
    const [assignUnitId, setAssignUnitId] = useState('');
    const [assignUserId, setAssignUserId] = useState('');
    const [closeReason, setCloseReason] = useState('');
    const [evidenceFileName, setEvidenceFileName] = useState('');
    const [evidenceDesc, setEvidenceDesc] = useState('');
    const [evidenceFilePath, setEvidenceFilePath] = useState('');
    const [approvalStatus, setApprovalStatus] = useState<'ONAYLANDI' | 'REDDEDILDI'>('ONAYLANDI');
    const [rejectionReason, setRejectionReason] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const data = await riskApi.getAlerts();
            setAlertsList(Array.isArray(data) ? data : (data?.items || []));
        } catch (error) {
            console.error('Risk uyarıları yükleme hatası:', error);
            showToast('Risk uyarı verileri yüklenirken hata oluştu.', 'error');
            setAlertsList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    // Handlers
    const handleAssignAlert = async () => {
        if (!selectedAlert || !assignUnitId.trim()) {
            showToast('Lütfen atanacak birimi seçiniz.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.assignAlert(selectedAlert.uyari_id, assignUnitId, assignUserId || undefined);
            showToast('Uyarı sorumlu birime başarıyla atandı.', 'success');
            setShowAssignModal(false);
            setShowDetailModal(false);
            setAssignUnitId('');
            setAssignUserId('');
            await loadAlerts();
        } catch (error) {
            showToast('Atama işlemi başarısız.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseAlertWithEvidence = async () => {
        if (!selectedAlert || !closeReason.trim()) {
            showToast('Uyarı kapatılırken gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.closeAlertWithEvidence(selectedAlert.uyari_id, closeReason);
            showToast('Risk uyarısı başarıyla kapatıldı.', 'success');
            setShowCloseModal(false);
            setShowDetailModal(false);
            setCloseReason('');
            await loadAlerts();
        } catch (error: any) {
            showToast(error.message || 'Uyarı kapatılamadı.', 'error');
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
            let actionId = selectedAlert.actions?.[0]?.id;
            if (!actionId) {
                const newAction = await riskApi.createAction(selectedAlert.uyari_id, 'Önlem Aksiyonu', user?.id, user?.department || undefined);
                actionId = newAction.id;
            }
            await riskApi.uploadActionEvidence(actionId, evidenceFileName.trim(), evidenceDesc.trim(), evidenceFilePath);
            showToast('Aksiyon kanıt belgesi yüklendi.', 'success');
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

    const handleApproveEvidence = async () => {
        if (!selectedEvidence) return;
        if (selectedEvidence.yukleyenId === user?.id) {
            showToast('Kanıtı yükleyen kişi kendi kanıtını onaylayamaz.', 'error');
            return;
        }
        if (approvalStatus === 'REDDEDILDI' && !rejectionReason.trim()) {
            showToast('Red Kararı için gerekçe yazılması zorunludur.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await riskApi.approveActionEvidence(selectedEvidence.id, approvalStatus, rejectionReason);
            showToast(`Kanıt kararı başarıyla kaydedildi (${approvalStatus === 'ONAYLANDI' ? 'Onaylandı & Aksiyon Tamamlandı' : 'Reddedildi'}).`, 'success');
            setShowApprovalModal(false);
            setShowDetailModal(false);
            setSelectedEvidence(null);
            setRejectionReason('');
            await loadAlerts();
        } catch (error: any) {
            showToast(error.message || 'Değerlendirme kararı verilemedi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedStatus([]);
        setSelectedRisk([]);
    };

    const filtered = alertsList.filter((a: any) => {
        const msg = a.mesaj || '';
        const kpi = a.kpi_kodu || '';
        const unit = a.birimId || '';
        const q = searchTerm.toLowerCase();

        const matchesSearch = msg.toLowerCase().includes(q) || kpi.toLowerCase().includes(q) || unit.toLowerCase().includes(q);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(a.durum);
        const matchesRisk = selectedRisk.length === 0 || selectedRisk.includes(a.risk_seviyesi);

        return matchesSearch && matchesStatus && matchesRisk;
    });

    const isFiltered = searchTerm !== '' || selectedStatus.length > 0 || selectedRisk.length > 0;
    const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Stage progression tracker helper
    const getStageStep = (a: any) => {
        if (a.durum === 'CLOSED') return 4;
        if (a.durum === 'IN_ACTION' || (a.actions && a.actions.length > 0)) return 3;
        if (a.durum === 'RESPONSE_SUBMITTED' || a.birimYaniti) return 2;
        if (a.durum === 'ASSIGNED' || a.birimId) return 1;
        return 0; // OPEN / Oluşturuldu
    };

    const columns: Column<any>[] = [
        {
            key: 'uyari_id',
            header: `${MODULE_TERMS.risk.tespitAdi} & Gösterge Kodu`,
            render: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CodeBadge code={row.kpi_kodu || row.uyari_id} />
                        <span
                            className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer"
                            onClick={() => { setSelectedAlert(row); setShowDetailModal(true); }}
                        >
                            {row.mesaj || `${row.kpi_kodu} Limit İhlali`}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Gerçekleşen: {row.gerceklesen_deger}</span>
                        <span>• Eşik: {row.esik_deger}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'birimId',
            header: 'Sorumlu Birim',
            sortable: true,
            render: (row: any) => (
                <span className="text-xs font-medium text-slate-700">{row.birimId || 'Atanmadı'}</span>
            )
        },
        {
            key: 'risk_seviyesi',
            header: 'Risk Seviyesi',
            sortable: true,
            render: (row: any) => <StatusBadge type="risk" value={row.risk_seviyesi} />
        },
        {
            key: 'durum',
            header: 'İş Akış Durumu',
            sortable: true,
            render: (row: any) => <StatusBadge type="status" value={row.durum} />
        },
        {
            key: 'birimYaniti',
            header: 'Birim Yanıtı',
            sortable: true,
            render: (row: any) => <StatusBadge type="status" value={row.birimYaniti || 'BEKLEMEDE'} />
        },
        {
            key: 'actions',
            header: 'İşlemler',
            sortable: true,
            render: (row: any) => (
                <TableActions
                    items={[
                        {
                            label: 'Detay & İş Akışı',
                            icon: <FileText size={14} />,
                            onClick: () => { setSelectedAlert(row); setShowDetailModal(true); }
                        },
                        {
                            label: 'Birime Ata',
                            icon: <UserCheck size={14} />,
                            onClick: () => { setSelectedAlert(row); setShowAssignModal(true); }
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
                title="Risk Limit Aşımları & Akış Yönetimi"
                subtitle={`Risk göstergelerinde oluşan limit aşımlarının birimlere atanması, mutabakat yanıtları, aksiyon ve kanıt takibi (${MODULE_TERMS.risk.birimKisa}).`}
                actions={
                    <RefreshButton onClick={loadAlerts} />
                }
            />

            {/* Scorecard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Açık Limit Aşımları"
                    value={alertsList.filter(a => a.durum === 'OPEN' || a.durum === 'ASSIGNED').length}
                    icon={AlertTriangle}
                    color="amber"
                />
                <StatCard
                    title="Birim Yanıtı Verilen"
                    value={alertsList.filter(a => a.durum === 'RESPONSE_SUBMITTED').length}
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="Aksiyondaki Limitler"
                    value={alertsList.filter(a => a.durum === 'IN_ACTION').length}
                    icon={ShieldCheck}
                    color="indigo"
                />
                <StatCard
                    title="Kapanan Limitler"
                    value={alertsList.filter(a => a.durum === 'CLOSED').length}
                    icon={CheckCircle2}
                    color="emerald"
                />
            </div>

            {/* Toolbar */}
            <PageToolbar
                searchPlaceholder="Gösterge kodu, mesaj veya birim arayınız..."
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
                                label="İş Akış Durumu"
                                placeholder="Tümü"
                                isMulti
                                value={selectedStatus}
                                onChange={(val) => setSelectedStatus(val as string[])}
                                options={[
                                    { value: 'OPEN', label: 'Açık' },
                                    { value: 'ASSIGNED', label: 'Birime Atandı' },
                                    { value: 'RESPONSE_SUBMITTED', label: 'Birim Yanıtı Verildi' },
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
                    icon={AlertTriangle}
                    title="Risk Limit Aşımı Bulunamadı"
                    description={isFiltered ? 'Arama kriterlerinize uygun risk uyarısı bulunamadı. Filtreleri temizleyebilirsiniz.' : 'Sistemde henüz kayıtlı risk limit aşımı veya uyarı bulunmuyor.'}
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

            {/* Detail & Stage Progression Modal */}
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
                        {/* Visual Stage Stepper */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                                İş Akış Aşamaları & İzlenebilirlik
                            </h4>
                            <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                                {[
                                    { stage: 'Tespit', step: 0, detail: selectedAlert.tarih ? <DateDisplay date={selectedAlert.tarih} /> : '-' },
                                    { stage: 'Birime Atandı', step: 1, detail: selectedAlert.birimId || 'Bekliyor' },
                                    { stage: 'Birim Yanıtı', step: 2, detail: selectedAlert.birimYaniti || 'Bekliyor' },
                                    { stage: 'Aksiyonda', step: 3, detail: selectedAlert.durum === 'IN_ACTION' ? 'Aksiyon Sürüyor' : '-' },
                                    { stage: 'Kapalı', step: 4, detail: selectedAlert.durum === 'CLOSED' ? 'Kapatıldı' : '-' }
                                ].map((item, idx) => {
                                    const currentStep = getStageStep(selectedAlert);
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

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                            <div><strong>Sorumlu Birim:</strong> {selectedAlert.birimId || 'Atanmadı'}</div>
                            <div><strong>Risk Seviyesi:</strong> <StatusBadge type="risk" value={selectedAlert.risk_seviyesi} /></div>
                            <div><strong>Durum:</strong> <StatusBadge type="status" value={selectedAlert.durum} /></div>
                            <div><strong>Birim Yanıtı:</strong> <StatusBadge type="status" value={selectedAlert.birimYaniti || 'BEKLEMEDE'} /></div>
                        </div>

                        {/* Unit Rationale */}
                        {selectedAlert.yanitGerekcesi && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
                                <strong>Birim Yanıt Gerekçesi:</strong>
                                <p className="text-slate-700 italic">{selectedAlert.yanitGerekcesi}</p>
                            </div>
                        )}

                        {/* Action List in Alert Detail */}
                        {selectedAlert.actions && selectedAlert.actions.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanımlı Risk Aksiyonları & Kanıtlar</h4>
                                <div className="space-y-2">
                                    {selectedAlert.actions.map((act: any) => (
                                        <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-800">{act.aksiyonTanimi}</span>
                                                <StatusBadge type="status" value={act.durum} />
                                            </div>
                                            {act.evidences && act.evidences.length > 0 && (
                                                <div className="pl-3 border-l-2 border-slate-300 space-y-1 text-[11px]">
                                                    <span className="font-semibold text-slate-600">Kanıt Belgeleri:</span>
                                                    {act.evidences.map((ev: any) => (
                                                        <div key={ev.id} className="flex justify-between items-center text-slate-700">
                                                            <span>{ev.dosyaId} - {ev.aciklama}</span>
                                                            <div className="flex items-center gap-2">
                                                                <StatusBadge type="status" value={ev.onayDurumu} />
                                                                {ev.onayDurumu === 'BEKLEMEDE' && (
                                                                    <Button size="sm" variant="secondary" onClick={() => { setSelectedEvidence(ev); setShowApprovalModal(true); }}>
                                                                        Değerlendir
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Workflow Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            {selectedAlert.durum === 'OPEN' && (
                                <Button variant="primary" size="sm" onClick={() => setShowAssignModal(true)}>
                                    Birime Ata
                                </Button>
                            )}

                            {selectedAlert.durum !== 'CLOSED' && (
                                <Button variant="secondary" size="sm" onClick={() => setShowCloseModal(true)}>
                                    Uyarıyı Kapat
                                </Button>
                            )}

                            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                                Kanıt Yükle
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Assign Modal */}
            {showAssignModal && selectedAlert && (
                <Modal
                    isOpen={showAssignModal}
                    onClose={() => setShowAssignModal(false)}
                    title="Risk Uyarısını Birime Ata"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Sorumlu Birim *</label>
                            <CustomSelect
                                value={assignUnitId}
                                onChange={(val) => setAssignUnitId(val as string)}
                                options={[
                                    { value: 'Hazine ve Finansman', label: 'Hazine ve Finansman Müdürlüğü' },
                                    { value: 'Kredi Tahsis', label: 'Kredi Tahsis Müdürlüğü' },
                                    { value: 'Operasyon', label: 'Operasyon Müdürlüğü' },
                                    { value: 'Bilgi Teknolojileri', label: 'Bilgi Teknolojileri Müdürlüğü' }
                                ]}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Atanan Sorumlu Kullanıcı ID</label>
                            <FormInput
                                type="text"
                                value={assignUserId}
                                onChange={(e) => setAssignUserId(e.target.value)}
                                placeholder="Örn: USR-102"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleAssignAlert} disabled={submitting}>
                                {submitting ? 'Atanıyor...' : 'Atamayı Kaydet'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Close Modal (closeAlertWithEvidence with mandatory rationale) */}
            {showCloseModal && selectedAlert && (
                <Modal
                    isOpen={showCloseModal}
                    onClose={() => setShowCloseModal(false)}
                    title="Risk Uyarısını Kapat"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Kapanış Gerekçesi *</label>
                            <FormTextarea
                                value={closeReason}
                                onChange={(e) => setCloseReason(e.target.value)}
                                placeholder="Risk limit aşımının giderildiğine ve aksiyonların tamamlandığına dair açıklama..."
                                rows={4}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setShowCloseModal(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleCloseAlertWithEvidence} disabled={submitting}>
                                {submitting ? 'Kapatılıyor...' : 'Uyarıyı Kapat'}
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

            {/* Approval Modal */}
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
