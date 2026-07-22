'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { Scale, Clock, CheckCircle2, AlertOctagon, Send, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function ConciliationPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedObjection, setSelectedObjection] = useState<any>(null);
    const [auditNote, setAuditNote] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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

    const handleConfirmDecision = async (decisionType: 'KABUL' | 'RED' | 'REVİZE') => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setSubmitting(false);
        setIsConfirmOpen(false);
        setSelectedObjection(null);
        showToast(`İtiraz değerlendirme kararı (${decisionType}) denetim izine kaydoldu.`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Uzlaşma ve İtiraz Değerlendirme Modülü</h2>
                    <p className="text-slate-300 text-xs mt-1">Denetlenen birimler tarafından tebliğ edilen bulgulara yapılan itirazların müfettiş ve gözetim değerlendirmesi</p>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold border border-slate-700">
                    IIA 2600 Uyumlu
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        width: '130px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                {item.id}
                            </code>
                        )
                    },
                    {
                        key: 'konu',
                        header: 'Bulgu & İtiraz Detayı',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900">{item.konu}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Birim: {item.birim} • İtiraz Tarihi: {formatDate(item.itirazTarihi)}</div>
                            </div>
                        )
                    },
                    {
                        key: 'onem',
                        header: 'Önem',
                        width: '110px',
                        render: (item: any) => <StatusBadge value={item.onem} type="risk" />
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '160px',
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
                data={objections}
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
                            <Button variant="secondary" onClick={() => handleConfirmDecision('RED')}>
                                İtirazı Reddet (Bulguyu Koru)
                            </Button>
                            <Button variant="primary" onClick={() => handleConfirmDecision('KABUL')}>
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
                                placeholder="İtirazın kabul veya red gerekçesini teknik ve mevzuat açıklamalarıyla yazınız..."
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
