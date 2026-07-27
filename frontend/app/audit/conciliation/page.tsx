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
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import LoadingState from '@/components/ui/LoadingState';
import { Scale, Clock, CheckCircle2, AlertOctagon, Send, List, FileSignature, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';

function ConciliationPageContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedObjection, setSelectedObjection] = useState<any>(null);
    const [auditNote, setAuditNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const objections = [
        {
            id: 'ITR-2026-04',
            kod: 'BLG-2026-014',
            birim: 'Kredi Operasyonları Müdürlüğü',
            konu: 'Kredi Tahsis Sürecinde Yetki Limit Aşımları',
            onem: 'YÜKSEK',
            itirazTarihi: '2026-07-15',
            itirazSebep: 'Bölge onay belgesinin sisteme taranmasında teknik aksaklık yaşandığı, işlemin usule uygun tamamlandığı beyan edilmiştir.',
            durum: 'GÖZETİM_DEĞERLENDİRMESİNDE',
            mufettisGorus: 'Gözetim Sorumlusu tarafından son karara bağlanması uygun görülmüştür.'
        },
        {
            id: 'ITR-2026-08',
            kod: 'BLG-2026-022',
            birim: 'Müşteri İlişkileri ve Gişe Operasyonları',
            konu: 'KVKK İzin Formlarının Eksik Taranması',
            onem: 'ORTA',
            itirazTarihi: '2026-07-18',
            itirazSebep: 'Sözleşme tarihinde müşterinin fiziksel ıslak imzası alınmış olup arşiv klasöründe mevcuttur.',
            durum: 'MÜFETTİŞ_İNCELEMESİNDE',
            mufettisGorus: 'Fiziksel klasör kontrol edilecek.'
        }
    ];

    const handleConfirmDecision = async (decisionType: 'KABUL' | 'RED') => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setSubmitting(false);
        setSelectedObjection(null);
        showToast(`İtiraz değerlendirme kararı (${decisionType}) başarıyla kaydoldu.`, 'success');
    };

    const filteredObjections = objections.filter(item =>
        item.konu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.birim.toLowerCase().includes(searchTerm.toLowerCase())
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
                    title="Kabul Edilen İtirazlar"
                    value={3}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Müfettiş veya Gözetim tarafından haklı bulunan itirazlar"
                />
                <StatCard
                    title="Reddedilen İtirazlar"
                    value={5}
                    icon={AlertOctagon}
                    color="red"
                    infoTooltip="Gerekçesi yetersiz görülerek bulgusu aynen korunanlar"
                />
                <StatCard
                    title="Gözetim Kararı Bekleyenler"
                    value={1}
                    icon={Clock}
                    color="purple"
                    infoTooltip="Gözetim Sorumlusu onayına sunulan uzlaşmazlıklar"
                />
            </div>

            <PageToolbar
                searchPlaceholder="İtiraz kodu, birim veya bulgu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    {
                        key: 'id',
                        header: 'İtiraz Kodu',
                        width: '140px',
                        render: (item: any) => <CodeBadge code={item.id} />
                    },
                    {
                        key: 'konu',
                        header: 'Bulgu & İtiraz Detayı',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{item.konu}</div>
                                <div className="text-xs text-gray-500 mt-1">Birim: {item.birim} • İtiraz Tarihi: {formatDate(item.itirazTarihi)}</div>
                            </div>
                        )
                    },
                    {
                        key: 'onem',
                        header: 'Önem',
                        width: '130px',
                        render: (item: any) => <StatusBadge value={item.onem} type="risk" />
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
                        width: '140px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="primary" leftIcon={<ArrowRight size={14} />} onClick={() => setSelectedObjection(item)}>
                                Değerlendir
                            </Button>
                        )
                    }
                ]}
                data={filteredObjections}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {selectedObjection && (
                <Modal
                    isOpen={!!selectedObjection}
                    onClose={() => setSelectedObjection(null)}
                    title={`İtiraz Değerlendirme Alanı — ${selectedObjection.kod}`}
                    size="lg"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" onClick={() => handleConfirmDecision('RED')} disabled={submitting}>
                                İtirazı Reddet (Bulguyu Koru)
                            </Button>
                            <Button variant="primary" onClick={() => handleConfirmDecision('KABUL')} disabled={submitting}>
                                İtirazı Kabul Et (Bulguyu Kapat)
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900 text-sm">{selectedObjection.konu}</div>
                            <div><strong>Denetlenen Birim:</strong> {selectedObjection.birim}</div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
                            <strong>Birim İtiraz Gerekçesi:</strong> {selectedObjection.itirazSebep}
                        </div>

                        <div>
                            <label className="form-label mb-1 block font-bold text-gray-900">Müfettiş / Gözetim Değerlendirme Notu (Zorunlu)</label>
                            <textarea
                                className="form-input text-xs w-full"
                                rows={3}
                                placeholder="İtirazın kabul veya red gerekçesini teknik açıklamalarla yazınız..."
                                value={auditNote}
                                onChange={e => setAuditNote(e.target.value)}
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function ConciliationPage() {
    return (
        <Suspense fallback={<LoadingState message="Tebliğ ve Mutabakat Yükleniyor..." />}>
            <ConciliationPageContent />
        </Suspense>
    );
}
// HMR force refresh




