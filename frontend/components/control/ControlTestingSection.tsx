import FormInput from '@/components/ui/FormInput';
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
import { DateDisplay } from '@/components/ui/DateDisplay';
import { ShieldCheck, CheckCircle2, Clock, Plus, Eye, FileText, UserCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlTestingSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<any>(null);

    const [testsList, setTestsList] = useState([
        {
            id: 'TST-2026-089',
            ad: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrol Testi',
            kontrolKodu: 'KNT-KRE-001',
            birim: 'Kredi Operasyonları Müdürlüğü',
            yürüten: 'Canan Öztürk (Başdenetçi)',
            durum: 'ETKİN',
            orneklem: '150 Adet İşlem',
            baslangic: '2026-07-01',
            bitis: '2026-07-15',
            tasarimEtkinligi: 'ETKİN (%95)',
            isletimEtkinligi: 'ETKİN (%92)',
            notlar: 'Sistem üzerinden 150 adet yetki aşımı denemesi simüle edilmiş, blokaj mekanizmasının %100 oranında çalıştığı doğrulanmıştır.'
        },
        {
            id: 'TST-2026-090',
            ad: 'Müşteri İzin Formu Girişi ve KVKK Uyum Testi',
            kontrolKodu: 'KNT-KVKK-008',
            birim: 'Müşteri İlişkileri ve Gişe',
            yürüten: 'Zeynep Kaya (Denetçi)',
            durum: 'GELİŞİME_AÇIK',
            orneklem: '50 Adet Müşteri Dosyası',
            baslangic: '2026-07-05',
            bitis: '2026-07-10',
            tasarimEtkinligi: 'KISMEN ETKİN (%70)',
            isletimEtkinligi: 'GELİŞİME AÇIK (%65)',
            notlar: 'İncelenen 50 dosyadan 4 tanesinde ikinci onay imzasının taranıp sisteme yüklenmediği tespit edilmiştir.'
        },
        {
            id: 'TST-2026-091',
            ad: 'Gün Sonu Genel Muhasebe Mutabakat Testi',
            kontrolKodu: 'KNT-MUH-012',
            birim: 'Mali İşler ve Muhasebe',
            yürüten: 'Ahmet Yılmaz (Başdenetçi)',
            durum: 'ETKİN',
            orneklem: '30 Günlük Otomatik Log',
            baslangic: '2026-07-10',
            bitis: '2026-07-21',
            tasarimEtkinligi: 'ETKİN (%98)',
            isletimEtkinligi: 'ETKİN (%96)',
            notlar: 'Gün sonu bakiye eşleşmelerinin otomatik betikler tarafından tam uyumla sağlandığı görülmüştür.'
        }
    ]);

    const [newTest, setNewTest] = useState({
        id: `TST-2026-09${testsList.length + 2}`,
        ad: '',
        kontrolKodu: 'KNT-KRE-001',
        birim: 'Kredi Operasyonları Müdürlüğü',
        yürüten: 'Canan Öztürk (Başdenetçi)',
        durum: 'DEVAM_EDİYOR',
        orneklem: '100 Adet Örneklem',
        baslangic: '2026-07-27',
        bitis: '2026-08-15',
        tasarimEtkinligi: 'TEST EDİLİYOR',
        isletimEtkinligi: 'TEST EDİLİYOR',
        notlar: 'Test çalışması yeni başlatılmıştır.'
    });

    const handleSaveTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTest.ad.trim()) {
            showToast('Lütfen test adını giriniz', 'warning');
            return;
        }

        setTestsList([newTest, ...testsList]);
        setIsAddModalOpen(false);
        showToast(`Yeni Kontrol Testi (${newTest.id}) başarıyla başlatıldı`, 'success');

        setNewTest({
            id: `TST-2026-09${testsList.length + 3}`,
            ad: '',
            kontrolKodu: 'KNT-KRE-001',
            birim: 'Kredi Operasyonları Müdürlüğü',
            yürüten: 'Canan Öztürk (Başdenetçi)',
            durum: 'DEVAM_EDİYOR',
            orneklem: '100 Adet Örneklem',
            baslangic: '2026-07-27',
            bitis: '2026-08-15',
            tasarimEtkinligi: 'TEST EDİLİYOR',
            isletimEtkinligi: 'TEST EDİLİYOR',
            notlar: 'Test çalışması yeni başlatılmıştır.'
        });
    };

    const filteredTests = testsList.filter(t => {
        if (searchTerm && !t.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Saha Testi" value={testsList.length} icon={ShieldCheck} color="blue" />
                <StatCard title="Etkin Test Sonuçları" value={testsList.filter(t => t.durum === 'ETKİN').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Devam Eden Testler" value={testsList.filter(t => t.durum === 'DEVAM_EDİYOR').length} icon={Clock} color="amber" />
                <StatCard title="Gelişime Açık Testler" value={testsList.filter(t => t.durum === 'GELİŞİME_AÇIK').length} icon={ShieldCheck} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Test adı, kodu veya süreci ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Yeni Test Çalışması Başlat
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Test Kodu', width: '130px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Kontrol Testi Tanımı & İlgili Kontrol', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Birim: {item.birim} • Kontrol Kodu: {item.kontrolKodu}</div>
                        </div>
                    ) },
                    { key: 'yürüten', header: 'Yürüten Kontrolör', width: '180px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.yürüten}</span> },
                    { key: 'durum', header: 'Test Sonucu', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'bitis', header: 'Tamamlanma', type: 'date', width: '140px' },
                    { key: 'actions', header: 'İncele', width: '100px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedTest(item)}>
                            Detay
                        </Button>
                    ) }
                ]}
                data={filteredTests}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Test Creation Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Kontrol Test Çalışması Başlat" size="lg">
                <form onSubmit={handleSaveTest} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Test Kodu</label>
                        <FormInput type="text" className="form-input text-xs w-full bg-slate-100 font-mono" value={newTest.id} readOnly />
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Kontrol Test Tanımı (Zorunlu)</label>
                        <FormInput
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: Kredi Limit Aşımlarının Otomatik Blokaj Kontrol Testi..."
                            value={newTest.ad}
                            onChange={(e) => setNewTest({ ...newTest, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">İlgili Kontrol Kodu</label>
                            <FormInput
                                type="text"
                                className="form-input text-xs w-full font-mono"
                                value={newTest.kontrolKodu}
                                onChange={(e) => setNewTest({ ...newTest, kontrolKodu: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Test Edilecek Birim</label>
                            <FormInput
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTest.birim}
                                onChange={(e) => setNewTest({ ...newTest, birim: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Yürüten İç Kontrolör</label>
                            <FormInput
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTest.yürüten}
                                onChange={(e) => setNewTest({ ...newTest, yürüten: e.target.value })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Test Durumu"
                                options={[
                                    { value: 'DEVAM_EDİYOR', label: 'DEVAM EDİYOR' },
                                    { value: 'ETKİN', label: 'ETKİN' },
                                    { value: 'GELİŞİME_AÇIK', label: 'GELİŞİME AÇIK' }
                                ]}
                                value={newTest.durum}
                                onChange={(val) => setNewTest({ ...newTest, durum: val as string })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Test Çalışmasını Başlat</Button>
                    </div>
                </form>
            </Modal>

            {/* Rich Test Detail Review Modal */}
            {selectedTest && (
                <Modal isOpen={!!selectedTest} onClose={() => setSelectedTest(null)} title={`Kontrol Testi Detayı — ${selectedTest.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedTest.ad}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">Birim: {selectedTest.birim} • Kontrol Kodu: {selectedTest.kontrolKodu}</p>
                                </div>
                                <StatusBadge value={selectedTest.durum} type="status" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Tasarım Etkinliği</span>
                                <span className="font-bold text-slate-900 text-xs font-mono">{selectedTest.tasarimEtkinligi}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">İşletim Etkinliği</span>
                                <span className="font-bold text-slate-900 text-xs font-mono">{selectedTest.isletimEtkinligi}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-500 font-medium block">Örneklem & Test Metodolojisi</span>
                            <span className="font-bold text-slate-800">{selectedTest.orneklem}</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block">İç Kontrolör Test Değerlendirme Notu:</span>
                            <p className="text-slate-600 leading-relaxed">{selectedTest.notlar}</p>
                        </div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedTest(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
