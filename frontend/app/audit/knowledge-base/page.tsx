'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import CustomSelect from '@/components/ui/CustomSelect';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import RefreshButton from '@/components/ui/RefreshButton';
import RequireRole from '@/components/auth/RequireRole';
import { useToast } from '@/components/Toast';
import { auditApi } from '@/lib/audit-api';
import {
    FileText, Scale, Plus, AlertTriangle, Clock, RefreshCw, CheckCircle,
    Edit3, History, Link, Search, X, ShieldAlert, Eye, Calendar, Layers
} from 'lucide-react';

export default function KnowledgeBasePage() {
    return (
        <RequireRole allowedRoles={['AUDIT_MANAGER', 'AUDIT_SUPERVISOR', 'AUDIT_INSPECTOR', 'AUDIT_USER']}>
            <CompanyDocumentManagementPage />
        </RequireRole>
    );
}

function CompanyDocumentManagementPage() {
    const { showToast } = useToast();

    const [documents, setDocuments] = useState<any[]>([]);
    const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    // Form States
    const [ad, setAd] = useState('');
    const [tur, setTur] = useState('Yönetmelik');
    const [kod, setKod] = useState('');
    const [versiyon, setVersiyon] = useState('1.0');
    const [yururlukTarihi, setYururlukTarihi] = useState(new Date().toISOString().split('T')[0]);
    const [gozdenGecirmePeriyodu, setGozdenGecirmePeriyodu] = useState(12);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Version Update Form
    const [newVersion, setNewVersion] = useState('');
    const [newDurum, setNewDurum] = useState('Yürürlükte');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docs, expiring] = await Promise.all([
                auditApi.getCompanyDocuments(),
                auditApi.getExpiringCompanyDocuments()
            ]);
            setDocuments(Array.isArray(docs) ? docs : []);
            setExpiringDocs(Array.isArray(expiring) ? expiring : []);
        } catch (error: any) {
            console.error('Failed to load company documents:', error);
            showToast('Dokümanlar yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDocument = async () => {
        if (!ad.trim() || !kod.trim()) {
            showToast('Lütfen doküman adı ve kodunu giriniz.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await auditApi.createCompanyDocument({
                ad: ad.trim(),
                tur,
                kod: kod.trim().toUpperCase(),
                versiyon,
                yururlukTarihi,
                gozdenGecirmePeriyodu: Number(gozdenGecirmePeriyodu)
            });

            showToast('Şirket dokümanı / mevzuat kaydı oluşturuldu.', 'success');
            setShowCreateModal(false);
            resetCreateForm();
            loadData();
        } catch (error: any) {
            showToast(error.message || 'Doküman oluşturulamadı.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateVersion = async () => {
        if (!selectedDoc || !newVersion.trim()) {
            showToast('Lütfen yeni versiyon numarasını giriniz.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await auditApi.updateCompanyDocumentVersion(selectedDoc.id, {
                versiyon: newVersion.trim(),
                durum: newDurum,
                sonGozdenGecirmeTarihi: new Date().toISOString()
            });

            showToast('Doküman versiyonu ve gözden geçirme tarihi güncellendi.', 'success');
            setShowVersionModal(false);
            setSelectedDoc(null);
            setNewVersion('');
            loadData();
        } catch (error: any) {
            showToast(error.message || 'Versiyon güncellenemedi.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetCreateForm = () => {
        setAd('');
        setTur('Yönetmelik');
        setKod('');
        setVersiyon('1.0');
        setYururlukTarihi(new Date().toISOString().split('T')[0]);
        setGozdenGecirmePeriyodu(12);
    };

    // Filtering logic
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = !searchTerm ||
            doc.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.kod.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'ALL' || doc.tur === selectedType;
        const matchesStatus = selectedStatus === 'ALL' || doc.durum === selectedStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const columns = [
        {
            key: 'kod',
            header: 'Doküman Kodu & Adı',
            accessor: (row: any) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {row.kod}
                        </span>
                        <span className="font-semibold text-sm text-slate-800 hover:text-teal-700 cursor-pointer" onClick={() => { setSelectedDoc(row); setShowDetailModal(true); }}>
                            {row.ad}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Yürürlük: {new Date(row.yururlukTarihi).toLocaleDateString('tr-TR')}</span>
                        <span>•</span>
                        <span>Periyot: {row.gozdenGecirmePeriyodu || 12} Ay</span>
                    </div>
                </div>
            )
        },
        {
            key: 'tur',
            header: 'Tür',
            accessor: (row: any) => (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {row.tur}
                </span>
            )
        },
        {
            key: 'versiyon',
            header: 'Versiyon',
            accessor: (row: any) => (
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700">
                    <Layers size={14} className="text-slate-400" />
                    v{row.versiyon}
                </div>
            )
        },
        {
            key: 'durum',
            header: 'Durum',
            accessor: (row: any) => {
                let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                if (row.durum === 'Revizyonda') badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                if (row.durum === 'Yürürlükten Kalktı') badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
                return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
                        {row.durum}
                    </span>
                );
            }
        },
        {
            key: 'references',
            header: 'Denetim Atıfları',
            accessor: (row: any) => (
                <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Link size={14} className="text-blue-500" />
                    <span>{row.references?.length || 0} Atıf</span>
                </div>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            accessor: (row: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Edit3 size={12} />}
                        onClick={() => {
                            setSelectedDoc(row);
                            setNewVersion(row.versiyon);
                            setNewDurum(row.durum);
                            setShowVersionModal(true);
                        }}
                    >
                        Versiyon Güncelle
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eye size={12} />}
                        onClick={() => {
                            setSelectedDoc(row);
                            setShowDetailModal(true);
                        }}
                    >
                        Detay
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Şirket İçi Mevzuat ve Doküman Takibi"
                subtitle="Denetimlerde atıf yapılan yönetmelik, prosedür, talimat ve iç mevzuat dokümanlarının versiyon ve periyodik gözden geçirme yönetimi."
                actions={
                    <Button variant="primary" onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />}>
                        Yeni Doküman / Mevzuat Ekle
                    </Button>
                }
            />

            {/* Expiring Documents Warning Banner */}
            {expiringDocs.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                            <ShieldAlert size={20} className="text-amber-600" />
                            Gözden Geçirme Tarihi Yaklaşan / Dolan Şirket Dokümanları ({expiringDocs.length})
                        </div>
                        <span className="text-xs font-semibold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full">
                            Periyodik İnceleme Uyarısı
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {expiringDocs.map((doc: any) => (
                            <div key={doc.id} className="p-3 bg-white rounded-lg border border-amber-200 shadow-xs flex justify-between items-start">
                                <div>
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                        {doc.kod}
                                    </span>
                                    <h5 className="font-bold text-xs text-slate-800 mt-1">{doc.ad}</h5>
                                    <p className="text-[11px] text-amber-700 mt-0.5">
                                        Periyot: {doc.gozdenGecirmePeriyodu} Ay • v{doc.versiyon}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        setSelectedDoc(doc);
                                        setNewVersion(doc.versiyon);
                                        setNewDurum(doc.durum);
                                        setShowVersionModal(true);
                                    }}
                                >
                                    İncele
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <FormInput
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Doküman adı veya kod arayınız..."
                            className="pl-9 text-xs"
                        />
                    </div>
                    <CustomSelect
                        value={selectedType}
                        onChange={val => setSelectedType(val as string)}
                        options={[
                            { value: 'ALL', label: 'Tüm Doküman Türleri' },
                            { value: 'Yönetmelik', label: 'Yönetmelik' },
                            { value: 'Prosedür', label: 'Prosedür' },
                            { value: 'Talimat', label: 'Talimat' },
                            { value: 'Politika', label: 'Politika' },
                            { value: 'Form', label: 'Form / Şablon' }
                        ]}
                    />
                    <CustomSelect
                        value={selectedStatus}
                        onChange={val => setSelectedStatus(val as string)}
                        options={[
                            { value: 'ALL', label: 'Tüm Durumlar' },
                            { value: 'Yürürlükte', label: 'Yürürlükte' },
                            { value: 'Revizyonda', label: 'Revizyonda' },
                            { value: 'Yürürlükten Kalktı', label: 'Yürürlükten Kalktı' }
                        ]}
                    />
                </div>
                <RefreshButton onClick={loadData} loading={loading} />
            </div>

            {/* Table */}
            <DataTable
                data={filteredDocuments}
                columns={columns}
                loading={loading}
                rowKey="id"
                emptyTitle="Sistemde kayıtlı şirket dokümanı / mevzuat bulunamadı."
            />

            {/* Create Document Modal */}
            {showCreateModal && (
                <div className="modal-overlay open" onClick={() => setShowCreateModal(false)}>
                    <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">Yeni Şirket Dokümanı / Mevzuat Kaydı</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Doküman Kod / Referans *
                                    </label>
                                    <FormInput
                                        type="text"
                                        value={kod}
                                        onChange={e => setKod(e.target.value)}
                                        placeholder="Örn: YNT-KRE-001"
                                    />
                                </div>
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Doküman Türü *
                                    </label>
                                    <CustomSelect
                                        value={tur}
                                        onChange={val => setTur(val as string)}
                                        options={[
                                            { value: 'Yönetmelik', label: 'Yönetmelik' },
                                            { value: 'Prosedür', label: 'Prosedür' },
                                            { value: 'Talimat', label: 'Talimat' },
                                            { value: 'Politika', label: 'Politika' },
                                            { value: 'Form', label: 'Form' }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Doküman Adı *
                                </label>
                                <FormInput
                                    type="text"
                                    value={ad}
                                    onChange={e => setAd(e.target.value)}
                                    placeholder="Örn: Kredi Tahsis ve Risk Yönetimi Yönetmeliği"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Başlangıç Versiyonu
                                    </label>
                                    <FormInput
                                        type="text"
                                        value={versiyon}
                                        onChange={e => setVersiyon(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Yürürlük Tarihi *
                                    </label>
                                    <FormInput
                                        type="date"
                                        value={yururlukTarihi}
                                        onChange={e => setYururlukTarihi(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                        Periyot (Ay)
                                    </label>
                                    <FormInput
                                        type="number"
                                        min={1}
                                        value={gozdenGecirmePeriyodu}
                                        onChange={e => setGozdenGecirmePeriyodu(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleCreateDocument} disabled={isSubmitting}>
                                    {isSubmitting ? 'Kaydediliyor...' : 'Dokümanı Kaydet'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Version Update Modal */}
            {showVersionModal && selectedDoc && (
                <div className="modal-overlay open" onClick={() => setShowVersionModal(false)}>
                    <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">
                                Versiyon & Durum Güncelle: {selectedDoc.kod}
                            </h3>
                            <button onClick={() => setShowVersionModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Yeni Versiyon Numarası *
                                </label>
                                <FormInput
                                    type="text"
                                    value={newVersion}
                                    onChange={e => setNewVersion(e.target.value)}
                                    placeholder="Örn: 2.0"
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Doküman Durumu *
                                </label>
                                <CustomSelect
                                    value={newDurum}
                                    onChange={val => setNewDurum(val as string)}
                                    options={[
                                        { value: 'Yürürlükte', label: 'Yürürlükte' },
                                        { value: 'Revizyonda', label: 'Revizyonda' },
                                        { value: 'Yürürlükten Kalktı', label: 'Yürürlükten Kalktı' }
                                    ]}
                                />
                            </div>

                            <div className="p-3 bg-blue-50 text-blue-800 rounded text-xs">
                                <strong>Bilgi:</strong> Bu işlem son gözden geçirme tarihini bugüne günceller ve bir sonraki periyodik inceleme uyarısını sıfırlar.
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowVersionModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleUpdateVersion} disabled={isSubmitting}>
                                    {isSubmitting ? 'Güncelleniyor...' : 'Versiyonu Güncelle'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Detail & References Modal */}
            {showDetailModal && selectedDoc && (
                <div className="modal-overlay open" onClick={() => setShowDetailModal(false)}>
                    <div className="modal max-w-xl" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                                    {selectedDoc.kod}
                                </span>
                                <h3 className="text-base font-bold text-slate-800">{selectedDoc.ad}</h3>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                                <div><strong>Tür:</strong> {selectedDoc.tur}</div>
                                <div><strong>Versiyon:</strong> v{selectedDoc.versiyon}</div>
                                <div><strong>Durum:</strong> {selectedDoc.durum}</div>
                                <div><strong>Yürürlük Tarihi:</strong> {new Date(selectedDoc.yururlukTarihi).toLocaleDateString('tr-TR')}</div>
                                <div><strong>Son Gözden Geçirme:</strong> {selectedDoc.sonGozdenGecirmeTarihi ? new Date(selectedDoc.sonGozdenGecirmeTarihi).toLocaleDateString('tr-TR') : 'Yapılmadı'}</div>
                                <div><strong>İnceleme Periyodu:</strong> {selectedDoc.gozdenGecirmePeriyodu || 12} Ay</div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Link size={14} className="text-blue-600" />
                                    Atıf Yapılan Denetim Bulguları & Prosedürleri ({selectedDoc.references?.length || 0})
                                </h4>
                                {selectedDoc.references?.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Bu dokümana henüz herhangi bir bulgudan atıf yapılmamıştır.</p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedDoc.references?.map((ref: any) => (
                                            <div key={ref.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                                                <div>
                                                    <span className="font-bold text-slate-800">{ref.kaynakTuru} #{ref.kaynakId}</span>
                                                    {ref.aciklama && <p className="text-slate-600 italic">{ref.aciklama}</p>}
                                                </div>
                                                <span className="text-[10px] text-slate-400">{new Date(ref.createdAt).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                                    Kapat
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
