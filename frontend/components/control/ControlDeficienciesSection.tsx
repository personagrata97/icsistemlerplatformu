'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { AlertOctagon, CheckCircle2, Clock, Plus, Eye, Sliders, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlDeficienciesSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDeficiency, setSelectedDeficiency] = useState<any>(null);

    const [deficienciesList, setDeficienciesList] = useState([
        {
            id: 'EKS-2026-001',
            ad: 'Müşteri Kimlik Doğrulama Formlarında İkinci İntibak Onayı Eksikliği',
            birim: 'Müşteri İlişkileri ve Gişe',
            kontroKodu: 'KNT-KVKK-008',
            seviye: 'YÜKSEK',
            durum: 'AKSIYONDA',
            sorumlu: 'Zeynep Kaya (BKS)',
            hedetTarih: '2026-08-15',
            tespitTarihi: '2026-07-02',
            aksiyonPlani: 'Gişe yetkilileri için sisteme zorunlu 2. onay kontrolü yazılımsal olarak eklenecektir.',
            kökNeden: 'Sistem altyapısında kontrol kuralının opsiyonel bırakılmış olması.'
        },
        {
            id: 'EKS-2026-002',
            ad: 'Hazine Gün Sonu Pozisyon Limit Kontrolünde Manuel Gecikme',
            birim: 'Hazine ve Fon Yönetimi',
            kontroKodu: 'KNT-HZ-004',
            seviye: 'ORTA',
            durum: 'GÖZDEN_GEÇİRMEDE',
            sorumlu: 'Ayşe Şahin (BKS)',
            hedetTarih: '2026-08-30',
            tespitTarihi: '2026-07-10',
            aksiyonPlani: 'Pozisyon raporlama servisi saat 17:30 itibarıyla otomatik e-posta uyarısı tetikleyecektir.',
            kökNeden: 'Operasyonel yoğunluk kaynaklı manuel kontrol gecikmesi.'
        },
        {
            id: 'EKS-2026-003',
            ad: 'Kredi Dosyalarında Çapraz İpotek Şerhi Girişi Unutulması',
            birim: 'Kredi Operasyonları Müdürlüğü',
            kontroKodu: 'KNT-KRE-001',
            seviye: 'DÜŞÜK',
            durum: 'KAPANDI',
            sorumlu: 'Mehmet Demir (BKS)',
            hedetTarih: '2026-07-20',
            tespitTarihi: '2026-06-15',
            aksiyonPlani: 'Şablon dosyaya kontrol listesi (checklist) eklenmiş ve kapatılmıştır.',
            kökNeden: 'Manuel kontrol listesinin güncellenmemiş olması.'
        }
    ]);

    const [newDeficiency, setNewDeficiency] = useState({
        id: `EKS-2026-00${deficienciesList.length + 1}`,
        ad: '',
        birim: 'Kredi Operasyonları Müdürlüğü',
        kontroKodu: 'KNT-KRE-001',
        seviye: 'YÜKSEK',
        durum: 'AKSIYONDA',
        sorumlu: 'Mehmet Demir (BKS)',
        hedetTarih: '2026-09-15',
        tespitTarihi: '2026-07-27',
        aksiyonPlani: 'Düzeltici aksiyon tanımlanacaktır.',
        kökNeden: 'Süreç kontrol adımı eksikliği.'
    });

    const handleSaveDeficiency = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeficiency.ad.trim()) {
            showToast('Lütfen eksiklik tanımını giriniz', 'warning');
            return;
        }

        setDeficienciesList([newDeficiency, ...deficienciesList]);
        setIsAddModalOpen(false);
        showToast(`Kontrol Eksikliği Kaydı (${newDeficiency.id}) başarıyla oluşturuldu`, 'success');

        setNewDeficiency({
            id: `EKS-2026-00${deficienciesList.length + 2}`,
            ad: '',
            birim: 'Kredi Operasyonları Müdürlüğü',
            kontroKodu: 'KNT-KRE-001',
            seviye: 'YÜKSEK',
            durum: 'AKSIYONDA',
            sorumlu: 'Mehmet Demir (BKS)',
            hedetTarih: '2026-09-15',
            tespitTarihi: '2026-07-27',
            aksiyonPlani: 'Düzeltici aksiyon tanımlanacaktır.',
            kökNeden: 'Süreç kontrol adımı eksikliği.'
        });
    };

    const filteredDeficiencies = deficienciesList.filter(d => {
        if (searchTerm && !d.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kontrol Eksikliği" value={deficienciesList.length} icon={AlertOctagon} color="red" />
                <StatCard title="Aksiyondaki Eksiklikler" value={deficienciesList.filter(d => d.durum === 'AKSIYONDA').length} icon={Clock} color="amber" />
                <StatCard title="Kapatılan Eksiklikler" value={deficienciesList.filter(d => d.durum === 'KAPANDI').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Gecikmedeki Aksiyonlar" value={1} icon={Sliders} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Eksiklik tanımı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Eksiklik Kaydı Ekle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Eksiklik Kodu', width: '130px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Eksiklik Tanımı & İlgili Kontrol', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Birim: {item.birim} • Kontrol: {item.kontroKodu}</div>
                        </div>
                    ) },
                    { key: 'seviye', header: 'Önem Seviyesi', width: '130px', render: (item: any) => (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.seviye === 'YÜKSEK' ? 'bg-red-100 text-red-800' : item.seviye === 'ORTA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                            {item.seviye}
                        </span>
                    ) },
                    { key: 'sorumlu', header: 'Sorumlu BKS', width: '170px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.sorumlu}</span> },
                    { key: 'durum', header: 'Durum', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'hedetTarih', header: 'Hedef Termin', type: 'date', width: '150px' },
                    { key: 'actions', header: 'İncele', width: '100px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedDeficiency(item)}>
                            Detay
                        </Button>
                    ) }
                ]}
                data={filteredDeficiencies}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Modal for Adding Deficiency */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Kontrol Eksikliği Kaydı" size="lg">
                <form onSubmit={handleSaveDeficiency} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eksiklik Tanımı (Zorunlu)</label>
                        <textarea
                            className="form-input text-xs w-full"
                            rows={3}
                            placeholder="Örn: Müşteri Kimlik Doğrulama Formlarında İkinci İntibak Onayı Eksikliği..."
                            value={newDeficiency.ad}
                            onChange={(e) => setNewDeficiency({ ...newDeficiency, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">İlgili Kontrol Kodu</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full font-mono bg-slate-100"
                                value={newDeficiency.kontroKodu}
                                onChange={(e) => setNewDeficiency({ ...newDeficiency, kontroKodu: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Tespit Edilen Birim</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newDeficiency.birim}
                                onChange={(e) => setNewDeficiency({ ...newDeficiency, birim: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect
                                label="Önem Seviyesi"
                                options={[
                                    { value: 'YÜKSEK', label: 'YÜKSEK' },
                                    { value: 'ORTA', label: 'ORTA' },
                                    { value: 'DÜŞÜK', label: 'DÜŞÜK' }
                                ]}
                                value={newDeficiency.seviye}
                                onChange={(val) => setNewDeficiency({ ...newDeficiency, seviye: val as string })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Sorumlu Birim Kontrol Sorumlusu (BKS)</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newDeficiency.sorumlu}
                                onChange={(e) => setNewDeficiency({ ...newDeficiency, sorumlu: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Eksiklik Kaydını Oluştur</Button>
                    </div>
                </form>
            </Modal>

            {/* Rich Deficiency Detail Review Modal */}
            {selectedDeficiency && (
                <Modal isOpen={!!selectedDeficiency} onClose={() => setSelectedDeficiency(null)} title={`Kontrol Eksikliği Detayı — ${selectedDeficiency.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedDeficiency.ad}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">Birim: {selectedDeficiency.birim} • Kontrol Kodu: {selectedDeficiency.kontroKodu}</p>
                                </div>
                                <StatusBadge value={selectedDeficiency.durum} type="status" />
                            </div>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block">Kök Neden Analizi:</span>
                            <p className="text-slate-600 leading-relaxed">{selectedDeficiency.kökNeden}</p>
                        </div>

                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                            <span className="text-amber-900 font-bold block">Düzeltici Aksiyon Planı:</span>
                            <p className="text-amber-800 leading-relaxed">{selectedDeficiency.aksiyonPlani}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                <span className="text-slate-500 font-medium block">Sorumlu BKS</span>
                                <span className="font-bold text-slate-900">{selectedDeficiency.sorumlu}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                <span className="text-slate-500 font-medium block">Hedef Termin Tarihi</span>
                                <span className="font-bold text-slate-900">{selectedDeficiency.hedetTarih}</span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedDeficiency(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
