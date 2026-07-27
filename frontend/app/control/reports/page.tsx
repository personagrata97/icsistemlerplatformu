'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { FileBarChart, CheckCircle2, Download, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlReportsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [reportsList, setReportsList] = useState([
        { id: 'RPR-2026-Q2', ad: '2026 Q2 Dönemsel İç Kontrol Değerlendirme Raporu', birim: 'İç Kontrol Merkezi', tarih: '2026-07-20', durum: 'ONAYLANDI', yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)' },
        { id: 'RPR-2026-KRE', ad: 'Kredi Operasyonları Süreç İçi Kontrol Etkinlik Raporu', birim: 'Kredi Operasyonları Müdürlüğü', tarih: '2026-07-15', durum: 'ONAYLANDI', yazar: 'Canan Öztürk (Kıdemli Kontrolör)' },
        { id: 'RPR-2026-KVKK', ad: 'Müşteri Hakları ve KVKK Kontrol Uyum Raporu', birim: 'Müşteri İlişkileri', tarih: '2026-07-10', durum: 'TASLAK', yazar: 'Zeynep Kaya (İç Kontrolör)' },
    ]);

    const [newReport, setNewReport] = useState({
        id: `RPR-2026-00${reportsList.length + 1}`,
        ad: '',
        birim: 'İç Kontrol Merkezi',
        tarih: '2026-07-27',
        durum: 'TASLAK',
        yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)'
    });

    const handleSaveReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReport.ad.trim()) {
            showToast('Lütfen rapor tanımını giriniz', 'warning');
            return;
        }

        setReportsList([newReport, ...reportsList]);
        setIsAddModalOpen(false);
        showToast(`Yeni İç Kontrol Rapor Taslağı (${newReport.id}) başarıyla oluşturuldu`, 'success');

        setNewReport({
            id: `RPR-2026-00${reportsList.length + 2}`,
            ad: '',
            birim: 'İç Kontrol Merkezi',
            tarih: '2026-07-27',
            durum: 'TASLAK',
            yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)'
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Yayınlanan Dönem Raporu" value={reportsList.length} icon={FileBarChart} color="blue" />
                <StatCard title="Onaylanan Raporlar" value={reportsList.filter(r => r.durum === 'ONAYLANDI').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Taslak Raporlar" value={reportsList.filter(r => r.durum === 'TASLAK').length} icon={FileBarChart} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Rapor adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Yeni Rapor Oluştur
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Rapor Kodu', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Rapor Tanımı', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Birim: {item.birim} • Hazırlayan: {item.yazar}</div>
                        </div>
                    ) },
                    { key: 'durum', header: 'Durum', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Rapor Tarihi', type: 'date', width: '150px' },
                    { key: 'actions', header: 'İşlem', width: '120px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={() => showToast(`${item.ad} PDF indiriliyor`, 'success')}>
                            İndir
                        </Button>
                    ) }
                ]}
                data={reportsList}
                rowKey="id"
            />

            {/* Real Interactive Report Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni İç Kontrol Dönem Raporu Oluştur" size="lg">
                <form onSubmit={handleSaveReport} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Rapor Kodu</label>
                        <input type="text" className="form-input text-xs w-full bg-slate-100 font-mono" value={newReport.id} readOnly />
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Rapor Başlığı / Tanımı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: 2026 Q3 Dönemsel İç Kontrol Değerlendirme Raporu..."
                            value={newReport.ad}
                            onChange={(e) => setNewReport({ ...newReport, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Sorumlu Birim</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newReport.birim}
                                onChange={(e) => setNewReport({ ...newReport, birim: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Hazırlayan İç Kontrolör</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newReport.yazar}
                                onChange={(e) => setNewReport({ ...newReport, yazar: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <CustomSelect
                            label="Rapor Durumu"
                            options={[
                                { value: 'TASLAK', label: 'TASLAK' },
                                { value: 'ONAYLANDI', label: 'ONAYLANDI' }
                            ]}
                            value={newReport.durum}
                            onChange={(val) => setNewReport({ ...newReport, durum: val as string })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Rapor Taslağını Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
