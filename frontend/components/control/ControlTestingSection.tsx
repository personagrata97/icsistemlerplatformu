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
import { ShieldCheck, CheckCircle2, RefreshCw, FileCheck, Layers } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlTestingSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);

    const [testList, setTestList] = useState([
        {
            id: 'TST-2026-089',
            kontrolKodu: 'KNT-KRE-001',
            kontrolAdi: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü',
            testTürü: 'İŞLETİM ETKİNLİĞİ',
            orneklemBüyüklügü: 50,
            basariliOrneklem: 49,
            testEden: 'Canan Öztürk (Kıdemli Kontrolör)',
            sonuc: 'ETKİN',
            testTarihi: '2026-07-15'
        },
        {
            id: 'TST-2026-090',
            kontrolKodu: 'KNT-KVKK-008',
            kontrolAdi: 'Müşteri İzin Formu Girişi ve Onay Kontrolü',
            testTürü: 'TASARIM VE İŞLETİM',
            orneklemBüyüklügü: 30,
            basariliOrneklem: 21,
            testEden: 'Zeynep Kaya (İç Kontrolör)',
            sonuc: 'GELİŞİME_AÇIK',
            testTarihi: '2026-07-10'
        },
        {
            id: 'TST-2026-091',
            kontrolKodu: 'KNT-MUH-012',
            kontrolAdi: 'Gün Sonu Genel Muhasebe Mutabakatı',
            testTürü: 'OTOMATİK KONTROL TESTİ',
            orneklemBüyüklügü: 100,
            basariliOrneklem: 98,
            testEden: 'Ahmet Yılmaz (Kıdemli Kontrolör)',
            sonuc: 'ETKİN',
            testTarihi: '2026-07-21'
        }
    ]);

    const [newTest, setNewTest] = useState({
        id: `TST-2026-09${testList.length + 2}`,
        kontrolKodu: 'KNT-HZ-004',
        kontrolAdi: 'Hazine Gün Sonu Pozisyon Limit Kontrolü',
        testTürü: 'İŞLETİM ETKİNLİĞİ',
        orneklemBüyüklügü: 40,
        basariliOrneklem: 40,
        testEden: 'Ahmet Yılmaz (Kıdemli Kontrolör)',
        sonuc: 'ETKİN',
        testTarihi: '2026-07-27'
    });

    const handleStartTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTest.kontrolAdi.trim()) {
            showToast('Lütfen test edilecek kontrol tanımını giriniz', 'warning');
            return;
        }

        setTestList([newTest, ...testList]);
        setIsTestModalOpen(false);
        showToast(`Kontrol Etkinlik Testi (${newTest.id}) başarıyla başlatıldı`, 'success');

        setNewTest({
            id: `TST-2026-09${testList.length + 3}`,
            kontrolKodu: 'KNT-HZ-004',
            kontrolAdi: 'Hazine Gün Sonu Pozisyon Limit Kontrolü',
            testTürü: 'İŞLETİM ETKİNLİĞİ',
            orneklemBüyüklügü: 40,
            basariliOrneklem: 40,
            testEden: 'Ahmet Yılmaz (Kıdemli Kontrolör)',
            sonuc: 'ETKİN',
            testTarihi: '2026-07-27'
        });
    };

    const filteredTests = testList.filter(t => {
        if (searchTerm && !t.kontrolAdi.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Tamamlanan Kontrol Testi" value={testList.length} icon={FileCheck} color="blue" />
                <StatCard title="Etkin Bulunan Kontroller" value="%86" icon={CheckCircle2} color="emerald" />
                <StatCard title="Test Edilen Örneklem" value="2,450 Kayıt" icon={Layers} color="purple" />
                <StatCard title="Devam Eden Test Çalışması" value={6} icon={RefreshCw} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Kontrol adı veya test kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<ShieldCheck size={18} />}
                        onClick={() => setIsTestModalOpen(true)}
                    >
                        Yeni Test Çalışması Başlat
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Test Kodu', width: '130px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'kontrolAdi', header: 'Test Edilen Kontrol', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.kontrolAdi}</div>
                            <div className="text-xs text-slate-500 font-medium">Kontrol Kodu: {item.kontrolKodu} • Tür: {item.testTürü}</div>
                        </div>
                    ) },
                    { key: 'orneklemBüyüklügü', header: 'Örneklem Başarısı', width: '160px', render: (item: any) => (
                        <div>
                            <div className="text-xs font-bold text-slate-900">{item.basariliOrneklem} / {item.orneklemBüyüklügü} Başarılı</div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(item.basariliOrneklem / item.orneklemBüyüklügü) * 100}%` }}></div>
                            </div>
                        </div>
                    ) },
                    { key: 'testEden', header: 'Test Eden Kontrolör', width: '180px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.testEden}</span> },
                    { key: 'sonuc', header: 'Test Sonucu', width: '140px', render: (item: any) => <StatusBadge value={item.sonuc} type="status" /> },
                    { key: 'testTarihi', header: 'Test Tarihi', width: '150px', render: (item: any) => <DateDisplay date={item.testTarihi} /> }
                ]}
                data={filteredTests}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Modal for Starting Test */}
            <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title="Yeni Kontrol Etkinlik Testi Başlat" size="lg">
                <form onSubmit={handleStartTest} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Test Edilecek Kontrol Tanımı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: Hazine Gün Sonu Pozisyon Limit Kontrolü..."
                            value={newTest.kontrolAdi}
                            onChange={(e) => setNewTest({ ...newTest, kontrolAdi: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Kontrol Kodu</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full font-mono bg-slate-100"
                                value={newTest.kontrolKodu}
                                onChange={(e) => setNewTest({ ...newTest, kontrolKodu: e.target.value })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Test Türü"
                                options={[
                                    { value: 'İŞLETİM ETKİNLİĞİ', label: 'İŞLETİM ETKİNLİĞİ' },
                                    { value: 'TASARIM ETKİNLİĞİ', label: 'TASARIM ETKİNLİĞİ' },
                                    { value: 'OTOMATİK KONTROL TESTİ', label: 'OTOMATİK KONTROL TESTİ' }
                                ]}
                                value={newTest.testTürü}
                                onChange={(val) => setNewTest({ ...newTest, testTürü: val as string })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">İncelenecek Örneklem Büyüklüğü</label>
                            <input
                                type="number"
                                className="form-input text-xs w-full font-mono"
                                value={newTest.orneklemBüyüklügü}
                                onChange={(e) => setNewTest({ ...newTest, orneklemBüyüklügü: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Test Eden Kontrolör</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTest.testEden}
                                onChange={(e) => setNewTest({ ...newTest, testEden: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsTestModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Test Çalışmasını Başlat</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
