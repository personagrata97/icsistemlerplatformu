'use client';

import React, { useState, Suspense } from 'react';
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
import { CheckCircle2, Clock, AlertTriangle, FileCheck, ShieldCheck, Download, List, FileSignature } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';

function FollowUpPageContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const followUps = [
        {
            id: 'AKS-2026-101',
            kod: 'BLG-2026-014',
            birim: 'Kredi Operasyonları Müdürlüğü',
            konu: 'Kredi Tahsis Yetki Limitlerinin Sistemsel Kısıtlanması',
            sorumlu: 'Ahmet YILMAZ',
            terminTarihi: '2026-08-15',
            kalanGun: 24,
            durum: 'AKSIYON_TAMAMLANDI_ONAY_BEKLENIYOR',
            kanit: 'limit_kısıtlama_sistem_ekran_goruntusu.pdf'
        },
        {
            id: 'AKS-2026-104',
            kod: 'BLG-2026-022',
            birim: 'Müşteri İlişkileri ve Gişe Operasyonları',
            konu: 'KVKK İzin Formu Girişinin Zorunlu Alana Dönüştürülmesi',
            sorumlu: 'Mehmet DEMİR',
            terminTarihi: '2026-08-01',
            kalanGun: 10,
            durum: 'DEVAM_EDIYOR',
            kanit: null
        }
    ];

    const handleApproveClosing = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setSubmitting(false);
        setIsConfirmOpen(false);
        setSelectedAction(null);
        showToast('Aksiyon kanıtı onaylandı. Bulgu kapatıldı.', 'success');
    };

    const filteredFollowUps = followUps.filter(item =>
        item.konu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.birim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sorumlu.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const navTabs = [
        { id: '/audit/findings', label: 'Tüm Bulgular', icon: List },
        { id: '/audit/conciliation', label: 'Tebliğ ve Mutabakat', icon: FileSignature },
        { id: '/audit/follow-up', label: 'Aksiyon Takip', icon: Clock }
    ];

    return (
        <div className="space-y-6">
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
                    value={followUps.length}
                    icon={Clock}
                    color="blue"
                    infoTooltip="Saha çalışması bitip aksiyon takibine alınan tüm bulgu aksiyonları"
                />
                <StatCard
                    title="Onay Bekleyen Kanıtlar"
                    value={1}
                    icon={FileCheck}
                    color="amber"
                    infoTooltip="Birim tarafından tamamlanıp müfettiş onayına gönderilenler"
                />
                <StatCard
                    title="Gecikmiş Aksiyonlar"
                    value={0}
                    icon={AlertTriangle}
                    color="red"
                    infoTooltip="Termin süresi aşıldığı halde kanıt yüklenmeyen aksiyonlar"
                />
                <StatCard
                    title="Kapanan Aksiyonlar (2026)"
                    value={18}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Müfettiş onayıyla kapatılan toplam aksiyon sayısı"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Aksiyon kodu, birim veya konu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    {
                        key: 'id',
                        header: 'Aksiyon Kodu',
                        width: '140px',
                        render: (item: any) => <CodeBadge code={item.id} />
                    },
                    {
                        key: 'konu',
                        header: 'Aksiyon Adı & Birim',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{item.konu}</div>
                                <div className="text-xs text-gray-500 mt-1">Birim: {item.birim} • Sorumlu: {item.sorumlu}</div>
                            </div>
                        )
                    },
                    {
                        key: 'terminTarihi',
                        header: 'Termin Tarihi',
                        width: '160px',
                        render: (item: any) => (
                            <div className="text-xs text-gray-700 font-mono">
                                <div>{formatDate(item.terminTarihi)}</div>
                                <div className="text-[10px] text-emerald-700 font-bold">{item.kalanGun} gün kaldı</div>
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
            />

            {selectedAction && (
                <Modal
                    isOpen={!!selectedAction}
                    onClose={() => setSelectedAction(null)}
                    title={`Aksiyon Kanıt İnceleme ve Kapanış — ${selectedAction.id}`}
                    size="md"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" onClick={() => showToast('Revizyon isteği birime iletildi.', 'info')}>
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
                            <div className="font-bold text-gray-900 text-sm">{selectedAction.konu}</div>
                            <div><strong>Birim / Sorumlu:</strong> {selectedAction.birim} — {selectedAction.sorumlu}</div>
                        </div>

                        {selectedAction.kanit ? (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileCheck size={18} className="text-emerald-700" />
                                    <span className="font-mono text-gray-800 font-bold">{selectedAction.kanit}</span>
                                </div>
                                <Button size="sm" variant="secondary" leftIcon={<Download size={14} />}>İndir</Button>
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl">
                                Henüz kanıt belgesi yüklenmemiştir. Aksiyon süreci devam etmektedir.
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
                message="Aksiyon kanıtı yeterli görülerek bulgu kapatılacaktır. Bu işlem kalıcı olarak kaydedilir. Onaylıyor musunuz?"
                confirmText="Evet, Bulguyu Kapat"
                variant="primary"
                isLoading={submitting}
            />
        </div>
    );
}

export default function FollowUpPage() {
    return (
        <Suspense fallback={<LoadingState message="Aksiyon Takip Yükleniyor..." />}>
            <FollowUpPageContent />
        </Suspense>
    );
}
// HMR force refresh



