import PageHeader from '@/components/ui/PageHeader';
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import LoadingState from '@/components/ui/LoadingState';
import { CheckCircle2, Clock, AlertTriangle, FileCheck, ShieldCheck, Download, List, FileSignature, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { auditApi } from '@/lib/audit-api';

function FollowUpPageContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actions, setActions] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getFollowUpActions({ page, pageSize: 20 });
            const items = data?.items || (Array.isArray(data) ? data : []);
            setActions(items);
            setTotalItems(data?.total ?? items.length);
        } catch (error) {
            console.error('Aksiyonlar çekilemedi:', error);
            showToast('Aksiyon takibi verileri yüklenemedi', 'error');
            setActions([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActions();
    }, [page]);

    const handleApproveClosing = async () => {
        if (!selectedAction) return;
        setSubmitting(true);
        try {
            // Eğer aksiyonda evidence kaydı varsa onu onayla, yoksa aksiyonu TAMAMLANDI yap
            const evidence = selectedAction.evidences && selectedAction.evidences[0];
            if (evidence && evidence.id) {
                await auditApi.approveFollowUpEvidence(evidence.id, { onayDurumu: 'ONAYLANDI' });
            } else {
                await auditApi.updateFollowUpStatus(selectedAction.id, 'TAMAMLANDI');
            }
            showToast('Aksiyon kanıtı onaylandı. Bulgu kapatıldı.', 'success');
            setIsConfirmOpen(false);
            setSelectedAction(null);
            await fetchActions();
        } catch (error) {
            console.error('Onaylama hatası:', error);
            showToast('Aksiyon kanıtı onaylanırken hata oluştu.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectEvidence = async () => {
        if (!selectedAction) return;
        const evidence = selectedAction.evidences && selectedAction.evidences[0];
        if (!evidence || !evidence.id) {
            showToast('Reddedilecek kanıt bulunamadı.', 'info');
            return;
        }
        setSubmitting(true);
        try {
            await auditApi.approveFollowUpEvidence(evidence.id, { onayDurumu: 'REDDEDILDI', redGerekce: 'Kanıt yetersiz görüldü.' });
            showToast('Kanıt reddedildi, revizyon isteği birime iletildi.', 'info');
            setSelectedAction(null);
            await fetchActions();
        } catch (error) {
            console.error('Red hatası:', error);
            showToast('İşlem başarısız.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFollowUps = actions.filter((item: any) => {
        const konu = item.aksiyonTanimi || item.finding?.title || '';
        const id = item.id || '';
        const birim = item.sorumlu?.department || item.finding?.department || '';
        const sorumlu = item.sorumlu?.displayName || '';
        const query = searchTerm.toLowerCase();

        return konu.toLowerCase().includes(query) ||
            id.toLowerCase().includes(query) ||
            birim.toLowerCase().includes(query) ||
            sorumlu.toLowerCase().includes(query);
    });

    const navTabs = [
        { id: '/audit/findings', label: 'Tüm Bulgular', icon: List },
        { id: '/audit/conciliation', label: 'Tebliğ ve Mutabakat', icon: FileSignature },
        { id: '/audit/follow-up', label: 'Aksiyon Takip', icon: Clock }
    ];

    const pendingEvidences = actions.filter((a: any) => a.durum === 'KANIT_BEKLENIYOR' || (a.evidences && a.evidences.some((e: any) => e.onayDurumu === 'BEKLEMEDE'))).length;
    const completedActions = actions.filter((a: any) => a.durum === 'TAMAMLANDI' || a.durum === 'KAPATILDI').length;
    const overdueActions = actions.filter((a: any) => new Date(a.terminTarihi) < new Date() && a.durum !== 'TAMAMLANDI' && a.durum !== 'KAPATILDI').length;

    return (
        <div className="space-y-6">
            <PageHeader title="Bulgu Takip (Follow-Up)" subtitle="Kesinleşmiş bulguların aksiyon vadeleri ve kapatma doğrulamaları" />
            {/* Top Navigation Tabs */}
            <div className="mb-6">
                <PageToolbar
                    noSearch={true}
                    leftActions={
                        <SegmentedTabs
                            tabs={navTabs}
                            activeTab="/audit/follow-up"
                            onChange={(id) => router.push(id)}
                        />
                    }
                />
            </div>

            {/* StatCards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Takip Edilen Aksiyonlar"
                    value={actions.length}
                    icon={Clock}
                    color="blue"
                    infoTooltip="Saha çalışması bitip aksiyon takibine alınan tüm bulgu aksiyonları"
                />
                <StatCard
                    title="Onay Bekleyen Kanıtlar"
                    value={pendingEvidences}
                    icon={FileCheck}
                    color="amber"
                    infoTooltip="Birim tarafından tamamlanıp müfettiş onayına gönderilenler"
                />
                <StatCard
                    title="Gecikmiş Aksiyonlar"
                    value={overdueActions}
                    icon={AlertTriangle}
                    color="red"
                    infoTooltip="Termin süresi aşıldığı halde kanıt yüklenmeyen aksiyonlar"
                />
                <StatCard
                    title="Kapanan Aksiyonlar"
                    value={completedActions}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Müfettiş onayıyla kapatılan toplam aksiyon sayısı"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Aksiyon kodu, birim veya konu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={fetchActions} isLoading={loading}>
                        Yenile
                    </Button>
                }
            />

            {loading ? (
                <LoadingState message="Gerçek aksiyon takibi verileri veritabanından çekiliyor..." />
            ) : (
                <DataTable
                    columns={[
                        {
                            key: 'id',
                            header: 'Aksiyon Kodu',
                            width: '160px',
                            render: (item: any) => <CodeBadge code={item.id} />
                        },
                        {
                            key: 'konu',
                            header: 'Aksiyon Adı & Birim',
                            sortable: true,
                            render: (item: any) => (
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.aksiyonTanimi || item.finding?.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Bulgu: {item.finding?.code || item.findingId} • Sorumlu: {item.sorumlu?.displayName || 'TANIMSIZ'}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'terminTarihi',
                            header: 'Termin Tarihi',
                            width: '160px',
                            render: (item: any) => {
                                const termin = new Date(item.terminTarihi);
                                const diffDays = Math.ceil((termin.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                return (
                                    <div className="text-xs text-gray-700 font-mono">
                                        <div>{formatDate(item.terminTarihi)}</div>
                                        <div className={`text-[10px] font-bold ${diffDays < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {diffDays < 0 ? `${Math.abs(diffDays)} gün gecikmiş` : `${diffDays} gün kaldı`}
                                        </div>
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'durum',
                            header: 'Durum',
                            width: '180px',
                            render: (item: any) => <StatusBadge value={item.durum} type="status" />
                        },
                        {
                            key: 'actions',
                            header: 'Kanıt İncele',
                            width: '150px',
                            align: 'center',
                            render: (item: any) => (
                                <Button size="sm" variant="secondary" onClick={() => setSelectedAction(item)}>
                                    İncele & Kapat
                                </Button>
                            )
                        }
                    ]}
                    data={filteredFollowUps}
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

            {selectedAction && (
                <Modal
                    isOpen={!!selectedAction}
                    onClose={() => setSelectedAction(null)}
                    title={`Aksiyon Kanıt İnceleme ve Kapanış — ${selectedAction.id}`}
                    size="md"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" onClick={handleRejectEvidence} isLoading={submitting}>
                                Revizyon İste
                            </Button>
                            <Button variant="primary" leftIcon={<ShieldCheck size={16} />} onClick={() => setIsConfirmOpen(true)}>
                                Kanıtı Onayla ve Bulguyu Kapat
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900 text-sm">{selectedAction.aksiyonTanimi || selectedAction.finding?.title}</div>
                            <div><strong>Sorumlu:</strong> {selectedAction.sorumlu?.displayName || 'TANIMSIZ'}</div>
                            <div><strong>Termin:</strong> {formatDate(selectedAction.terminTarihi)}</div>
                        </div>

                        {selectedAction.evidences && selectedAction.evidences.length > 0 ? (
                            <div className="space-y-2">
                                <div className="font-bold text-gray-800">Yüklenen Kanıtlar ({selectedAction.evidences.length}):</div>
                                {selectedAction.evidences.map((ev: any) => (
                                    <div key={ev.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileCheck size={18} className="text-emerald-700" />
                                            <div>
                                                <span className="font-mono text-gray-800 font-bold block">{ev.dosyaAdi}</span>
                                                {ev.aciklama && <span className="text-[10px] text-gray-500">{ev.aciklama}</span>}
                                            </div>
                                        </div>
                                        <StatusBadge value={ev.onayDurumu} type="status" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl">
                                Henüz kanıt belgesi yüklenmemiştir. Aksiyon takibi devam etmektedir.
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleApproveClosing}
                title="Bulguyu Kapatmayı Onayla"
                message="Aksiyon kanıtı yeterli görülerek bulgu kapatılacaktır. Bu işlem veritabanına ve denetim izine kalıcı olarak kaydedilir. Onaylıyor musunuz?"
                confirmText="Evet, Bulguyu Kapat"
                variant="primary"
                isLoading={submitting}
            />
        </div>
    );
}

import RequireRole from '@/components/auth/RequireRole';

export default function FollowUpPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'AUDIT_MANAGER', 'AUDIT_LEAD', 'AUDITOR', 'SUPER_ADMIN']}>
            <Suspense fallback={<LoadingState message="Aksiyon Takip Yükleniyor..." />}>
                <FollowUpPageContent />
            </Suspense>
        </RequireRole>
    );
}
