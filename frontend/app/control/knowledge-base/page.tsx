'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { BookOpen, FileText, Download, ShieldCheck, CheckCircle2, Search, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlKnowledgeBasePage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [docsList, setDocsList] = useState([
        {
            id: 'DOK-IK-001',
            ad: 'BDDK İç Kontrol ve Risk Yönetimi Standartları Rehberi',
            kategori: 'Mevzuat & Standartlar',
            tur: 'PDF Rehber',
            versiyon: 'v2.4',
            tarih: '2026-06-01',
            boyut: '3.4 MB',
            durum: 'YÜRÜRLÜKTE'
        },
        {
            id: 'DOK-IK-002',
            ad: 'COSO İç Kontrol Bütünleşik Çerçeve Uygulama Kılavuzu',
            kategori: 'Uluslararası Çerçeve',
            tur: 'Metodoloji Dokümanı',
            versiyon: 'v1.8',
            tarih: '2026-05-15',
            boyut: '5.1 MB',
            durum: 'YÜRÜRLÜKTE'
        },
        {
            id: 'DOK-IK-003',
            ad: 'Birim Kontrol Öz Değerlendirme (KÖD) Çalışma Şablonu',
            kategori: 'Şablonlar & Formlar',
            tur: 'Excel Matris',
            versiyon: 'v3.0',
            tarih: '2026-07-10',
            boyut: '1.2 MB',
            durum: 'GÜNCEL'
        },
        {
            id: 'DOK-IK-004',
            ad: 'Kredi Operasyonları Süreç İçi Kontrol Test Prosedürü',
            kategori: 'Kontrol Prosedürleri',
            tur: 'PDF Prosedür',
            versiyon: 'v2.1',
            tarih: '2026-07-02',
            boyut: '2.8 MB',
            durum: 'YÜRÜRLÜKTE'
        }
    ]);

    const [newDoc, setNewDoc] = useState({
        id: `DOK-IK-00${docsList.length + 1}`,
        ad: '',
        kategori: 'Mevzuat & Standartlar',
        tur: 'PDF Rehber',
        versiyon: 'v1.0',
        tarih: '2026-07-27',
        boyut: '2.1 MB',
        durum: 'YÜRÜRLÜKTE'
    });

    const handleSaveDoc = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.ad.trim()) {
            showToast('Lütfen doküman tanımını giriniz', 'warning');
            return;
        }

        setDocsList([newDoc, ...docsList]);
        setIsAddModalOpen(false);
        showToast(`Yeni İç Kontrol Dokümanı (${newDoc.id}) başarıyla yüklendi`, 'success');

        setNewDoc({
            id: `DOK-IK-00${docsList.length + 2}`,
            ad: '',
            kategori: 'Mevzuat & Standartlar',
            tur: 'PDF Rehber',
            versiyon: 'v1.0',
            tarih: '2026-07-27',
            boyut: '2.1 MB',
            durum: 'YÜRÜRLÜKTE'
        });
    };

    const filteredDocs = docsList.filter(d => {
        if (searchTerm && !d.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Kayıtlı Kontrol Dokümanı" value={docsList.length} icon={BookOpen} color="blue" />
                <StatCard title="Yürürlükteki Kılavuzlar" value={docsList.filter(d => d.durum === 'YÜRÜRLÜKTE').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Uygulama Şablonları" value={12} icon={FileText} color="purple" />
                <StatCard title="Son 30 Gün İndirme" value="184 Kez" icon={Download} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Doküman adı, kodu veya kategorisi ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Yeni Doküman Yükle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Doküman Kodu', width: '140px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Doküman Tanımı & Kategori', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Kategori: {item.kategori} • Tür: {item.tur} ({item.boyut})</div>
                        </div>
                    ) },
                    { key: 'versiyon', header: 'Versiyon', width: '100px', render: (item: any) => <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{item.versiyon}</span> },
                    { key: 'durum', header: 'Durum', width: '130px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Yayın Tarihi', type: 'date', width: '150px' },
                    { key: 'actions', header: 'İşlem', width: '120px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={() => showToast(`${item.ad} indiriliyor`, 'success')}>
                            İndir
                        </Button>
                    ) }
                ]}
                data={filteredDocs}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Real Interactive Knowledge Base Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="İç Kontrol Bilgi Bankasına Doküman Yükle" size="lg">
                <form onSubmit={handleSaveDoc} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Doküman Kodu</label>
                        <input type="text" className="form-input text-xs w-full bg-slate-100 font-mono" value={newDoc.id} readOnly />
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Doküman Tanımı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: BDDK İç Kontrol ve Risk Yönetimi Standartları Rehberi..."
                            value={newDoc.ad}
                            onChange={(e) => setNewDoc({ ...newDoc, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect
                                label="Kategori"
                                options={[
                                    { value: 'Mevzuat & Standartlar', label: 'Mevzuat & Standartlar' },
                                    { value: 'Uluslararası Çerçeve', label: 'Uluslararası Çerçeve' },
                                    { value: 'Şablonlar & Formlar', label: 'Şablonlar & Formlar' },
                                    { value: 'Kontrol Prosedürleri', label: 'Kontrol Prosedürleri' }
                                ]}
                                value={newDoc.kategori}
                                onChange={(val) => setNewDoc({ ...newDoc, kategori: val as string })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Versiyon</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full font-mono"
                                value={newDoc.versiyon}
                                onChange={(e) => setNewDoc({ ...newDoc, versiyon: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Dokümanı Yükle & Yayınla</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
