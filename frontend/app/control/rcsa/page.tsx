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
import { FileCheck, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlRCSAPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [selfAssessments, setSelfAssessments] = useState([
        { id: 'KÖD-2026-Q2-01', birim: 'Kredi Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 92, tarih: '2026-07-15', sorumlusu: 'Mehmet Demir (BKS)' },
        { id: 'KÖD-2026-Q2-02', birim: 'Hazine ve Fon Yönetimi', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 96, tarih: '2026-07-18', sorumlusu: 'Ayşe Şahin (BKS)' },
        { id: 'KÖD-2026-Q2-03', birim: 'Şube Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'DEĞERLENDİRMEDE', skor: 78, tarih: '2026-07-20', sorumlusu: 'Zeynep Kaya (İç Kontrolör)' },
        { id: 'KÖD-2026-Q2-04', birim: 'Bilgi Teknolojileri ve Altyapı', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 94, tarih: '2026-07-22', sorumlusu: 'Canan Öztürk (Kıdemli Kontrolör)' },
    ]);

    const [newForm, setNewForm] = useState({
        id: `KÖD-2026-Q3-0${selfAssessments.length + 1}`,
        birim: 'Operasyonel Risk Müdürlüğü',
        donem: '2026 Q3',
        durum: 'DEĞERLENDİRMEDE',
        skor: 90,
        tarih: '2026-07-27',
        sorumlusu: 'Zeynep Kaya (BKS)'
    });

    const handleSaveForm = (e: React.FormEvent) => {
        e.preventDefault();
        setSelfAssessments([newForm, ...selfAssessments]);
        setIsAddModalOpen(false);
        showToast(`Yeni Öz Değerlendirme Formu (${newForm.id}) başlatıldı`, 'success');

        setNewForm({
            id: `KÖD-2026-Q3-0${selfAssessments.length + 2}`,
            birim: 'Operasyonel Risk Müdürlüğü',
            donem: '2026 Q3',
            durum: 'DEĞERLENDİRMEDE',
            skor: 90,
            tarih: '2026-07-27',
            sorumlusu: 'Zeynep Kaya (BKS)'
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Aktif Dönem Formları" value={selfAssessments.length} icon={FileCheck} color="blue" />
                <StatCard title="Tamamlanma Oranı" value="%88" icon={CheckCircle2} color="emerald" />
                <StatCard title="Ortalama Birim Skoru" value="%90" icon={CheckCircle2} color="purple" />
                <StatCard title="Değerlendirmede" value={selfAssessments.filter(a => a.durum === 'DEĞERLENDİRMEDE').length} icon={Clock} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Birim veya dönem ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Yeni Dönem Başlat
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Form Kodu', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'birim', header: 'Değerlendirilen Birim', sortable: true },
                    { key: 'donem', header: 'Dönem', width: '120px' },
                    { key: 'sorumlusu', header: 'Birim Sorumlusu', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.sorumlusu}</span> },
                    { key: 'skor', header: 'Skor', width: '130px', render: (item: any) => (
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">%{item.skor}</span>
                    ) },
                    { key: 'durum', header: 'Durum', width: '160px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Tamamlanma Tarihi', type: 'date', width: '150px' }
                ]}
                data={selfAssessments}
                rowKey="id"
            />

            {/* Real Interactive RCSA Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Öz Değerlendirme (KÖD) Dönemi Başlat" size="lg">
                <form onSubmit={handleSaveForm} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Form Kodu</label>
                        <input type="text" className="form-input text-xs w-full bg-slate-100 font-mono" value={newForm.id} readOnly />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Değerlendirilen Birim</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newForm.birim}
                                onChange={(e) => setNewForm({ ...newForm, birim: e.target.value })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Değerlendirme Dönemi"
                                options={[
                                    { value: '2026 Q3', label: '2026 Q3' },
                                    { value: '2026 Q4', label: '2026 Q4' }
                                ]}
                                value={newForm.donem}
                                onChange={(val) => setNewForm({ ...newForm, donem: val as string })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Birim Kontrol Sorumlusu (BKS)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            value={newForm.sorumlusu}
                            onChange={(e) => setNewForm({ ...newForm, sorumlusu: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Öz Değerlendirme Formunu Başlat</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
