'use client';
import RefreshButton from '@/components/ui/RefreshButton';
import PageHeader from '@/components/ui/PageHeader';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import FormTextarea from '@/components/ui/FormTextarea';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import EmptyState from '@/components/ui/EmptyState';
import DataTable from '@/components/ui/DataTable';
import { DateDisplay } from '@/components/ui/DateDisplay';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import LoadingState from '@/components/ui/LoadingState';
import { Scale, Clock, CheckCircle2, AlertOctagon, Send, List, FileSignature, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { auditApi } from '@/lib/audit-api';

function ConciliationPageContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedObjection, setSelectedObjection] = useState<any>(null);
    const [auditNote, setAuditNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [objections, setObjections] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchObjections = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getConciliationObjections({ page, pageSize: 20 });
            const items = data?.items || (Array.isArray(data) ? data : []);
            setObjections(items);
            setTotalItems(data?.total ?? items.length);
        } catch (error) {
            console.error('İtirazlar çekilemedi:', error);
            showToast('İtiraz ve uzlaşma verileri yüklenemedi', 'error');
            setObjections([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchObjections();
    }, [page]);

    const handleConfirmDecision = async (decisionType: 'KABUL_EDILDI' | 'REDDEDILDI') => {
        if (!selectedObjection) return;
        setSubmitting(true);
        try {
            await auditApi.decideConciliationObjection(selectedObjection.id, {
                durum: decisionType,
                kararGerekce: auditNote || 'Gözetim değerlendirmesi tamamlandı.',
            });
            showToast(`İtiraz kararı (${decisionType === 'KABUL_EDILDI' ? 'KABUL EDİLDİ - Risk Kabulü Yapıldı' : 'REDDEDİLDİ'}) başarıyla kaydedildi.`, 'success');
            setSelectedObjection(null);
            setAuditNote('');
            await fetchObjections();
        } catch (error) {
            console.error('Karar kaydedilemedi:', error);
            showToast('İtiraz kararı kaydedilirken hata oluştu.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredObjections = objections.filter((item: any) => {
        const konu = item.finding?.title || item.itirazGerekce || '';
        const id = item.id || '';
        const birim = item.itirazEden?.department || item.finding?.department || '';
        const query = searchTerm.toLowerCase();

        return konu.toLowerCase().includes(query) ||
            id.toLowerCase().includes(query) ||
            birim.toLowerCase().includes(query);
    });

    const navTabs = [
        { id: '/audit/findings', label: 'Tüm Bulgular', icon: List },
        { id: '/audit/conciliation', label: 'Tebliğ ve Mutabakat', icon: FileSignature },
        { id: '/audit/follow-up', label: 'Aksiyon Takip', icon: Clock }
    ];

    const pendingObjections = objections.filter((o: any) => o.durum === 'BEKLEMEDE').length;
    const acceptedObjections = objections.filter((o: any) => o.durum === 'KABUL_EDILDI').length;
    const rejectedObjections = objections.filter((o: any) => o.durum === 'REDDEDILDI').length;

    return (
        <div className="space-y-6">
            <PageHeader title="Mutabakat & Tebliğ Süreci" subtitle="Taslak rapor bulgularının birimlerle mutabakatı ve tebliğ süreçleri" />
            {/* Top Navigation Tabs */}
            <div className="mb-6">
                <PageToolbar
                    noSearch={true}
                    leftActions={
                        <SegmentedTabs
                            tabs={navTabs}
                            activeTab="/audit/conciliation"
                            onChange={(id) => router.push(id)}
                        />
                    }
                />
            </div>

            {/* StatCards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="İncelemedeki İtirazlar"
                    value={objections.length}
                    icon={Scale}
                    color="amber"
                    infoTooltip="Birimler tarafından yapılan ve karara bağlanmayı bekleyen itirazlar"
                />
                <StatCard
                    title="Bekleyen İtirazlar"
                    value={pendingObjections}
                    icon={Clock}
                    color="purple"
                    infoTooltip="Gözetim Sorumlusu onayına sunulan uzlaşmazlıklar"
                />
                <StatCard
                    title="Kabul Edilen İtirazlar"
                    value={acceptedObjections}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Müfettiş veya Gözetim tarafından haklı bulunan itirazlar"
                />
                <StatCard
                    title="Reddedilen İtirazlar"
                    value={rejectedObjections}
                    icon={AlertOctagon}
                    color="red"
                    infoTooltip="Gerekçesi yetersiz görülerek bulgusu aynen korunanlar"
                />
            </div>

            <PageToolbar
                searchPlaceholder="İtiraz kodu, birim veya bulgu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <RefreshButton onClick={fetchObjections} />
                }
            />

            {loading ? (
                <LoadingState message="Gerçek uzlaşma ve itiraz verileri veritabanından çekiliyor..." />
            ) : (
                <DataTable
                    columns={[
                        {
                            key: 'id',
                            header: 'İtiraz Kodu',
                            width: '160px',
                            render: (item: any) => <CodeBadge code={item.id} />
                        },
                        {
                            key: 'konu',
                            header: 'Bulgu & İtiraz Detayı',
                            sortable: true,
                            render: (item: any) => (
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.finding?.title || 'Bulgu Başlığı'}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        İtiraz Eden: {item.itirazEden?.displayName || 'TANIMSIZ'} • İtiraz Tarihi: {formatDate(item.itirazTarihi)}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'durum',
                            header: 'Durum',
                            width: '180px',
                            render: (item: any) => <StatusBadge value={item.durum} type="status" />
                        },
                        {
                            key: 'actions',
                            header: 'İncele',
                            width: '150px',
                            align: 'center',
                            render: (item: any) => (
                                <Button size="sm" variant="secondary" onClick={() => { setSelectedObjection(item); setAuditNote(item.mufettisGorusu || ''); }}>
                                    Değerlendir
                                </Button>
                            )
                        }
                    ]}
                    data={filteredObjections}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="id"
                    paginated={true}
                    manualPagination={true}
                    currentPage={page}
                    totalItems={totalItems}
                    onPageChange={setPage}
                    itemsPerPage={20}
                />
            )}

            {selectedObjection && (
                <Modal
                    isOpen={!!selectedObjection}
                    onClose={() => setSelectedObjection(null)}
                    title={`Bulgu İtirazı Değerlendirme — ${selectedObjection.id}`}
                    size="lg"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="danger" onClick={() => handleConfirmDecision('REDDEDILDI')} isLoading={submitting}>
                                İtirazı Reddet (Bulguyu Koru)
                            </Button>
                            <Button variant="primary" onClick={() => handleConfirmDecision('KABUL_EDILDI')} isLoading={submitting}>
                                İtirazı Kabul Et (Riski Kabul Et)
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900 text-sm">{selectedObjection.finding?.title}</div>
                            <div><strong>İtiraz Eden:</strong> {selectedObjection.itirazEden?.displayName} ({selectedObjection.itirazEden?.department || 'Birim'})</div>
                            <div><strong>İtiraz Tarihi:</strong> {formatDate(selectedObjection.itirazTarihi)}</div>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900">Birim İtiraz Gerekçesi:</div>
                            <p className="text-gray-700 leading-relaxed">{selectedObjection.itirazGerekce}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-gray-800">Müfettiş / Gözetim Değerlendirme Notu:</label>
                            <FormTextarea
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                rows={3}
                                placeholder="Gerekçe veya ek açıklama giriniz..."
                                value={auditNote}
                                onChange={(e) => setAuditNote(e.target.value)}
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

import RequireRole from '@/components/auth/RequireRole';

export default function ConciliationPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'AUDIT_MANAGER', 'AUDIT_LEAD', 'AUDITOR', 'SUPER_ADMIN']}>
            <Suspense fallback={<LoadingState message="Uzlaşma & Tebliğ Yükleniyor..." />}>
                <ConciliationPageContent />
            </Suspense>
        </RequireRole>
    );
}
