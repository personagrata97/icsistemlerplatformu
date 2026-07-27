'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import PageHeader from '@/components/audit/PageHeader';
import { 
    Layers, FileCheck, CheckCircle2, Sliders, 
    ShieldCheck, AlertOctagon, Users, BookOpen, 
    Plus, Activity, Database
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

import ControlStaffSection from '@/components/control/ControlStaffSection';
import ControlTrainingSection from '@/components/control/ControlTrainingSection';
import ControlDeficienciesSection from '@/components/control/ControlDeficienciesSection';
import ControlTestingSection from '@/components/control/ControlTestingSection';

import Modal from '@/components/ui/Modal';

export default function PharosControlPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'inventory' | 'kod' | 'testing' | 'deficiencies' | 'staff' | 'training'>('inventory');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [newControl, setNewControl] = useState({
        id: `KNT-${Math.floor(100 + Math.random() * 900)}`,
        ad: '',
        surec: 'Kredi Tahsis ve Operasyon',
        tur: 'ÖNLEYİCİ',
        yontem: 'OTOMATİK',
        siklik: 'GÜNLÜK',
        sahip: 'Kredi Operasyonları Müdürlüğü',
        dayandigiRisk: '',
        etkinlikSkoru: 90,
        durum: 'ETKİN',
        sonTest: '2026-07-27'
    });

    const [controlsList, setControlsList] = useState([
        {
            id: 'KNT-KRE-001',
            ad: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü',
            surec: 'Kredi Tahsis ve Operasyon',
            tur: 'ÖNLEYİCİ',
            yontem: 'OTOMATİK',
            siklik: 'GÜNLÜK',
            sahip: 'Kredi Operasyonları Müdürlüğü',
            dayandigiRisk: 'Yetkisiz Kredi Kullandırımı Riski',
            etkinlikSkoru: 95,
            durum: 'ETKİN',
            sonTest: '2026-07-15'
        },
        {
            id: 'KNT-KVKK-008',
            ad: 'Müşteri İzin Formu Girişi ve Onay Kontrolü',
            surec: 'Müşteri İlişkileri ve Gişe',
            tur: 'TESPİT EDİCİ',
            yontem: 'MANUEL',
            siklik: 'HAFTALIK',
            sahip: 'Birim Uyum Sorumlusu',
            dayandigiRisk: 'KVKK İhlali ve İdari Para Cezası Riski',
            etkinlikSkoru: 65,
            durum: 'GELİŞİME_AÇIK',
            sonTest: '2026-07-10'
        },
        {
            id: 'KNT-MUH-012',
            ad: 'Gün Sonu Genel Muhasebe Mutabakatı',
            surec: 'Mali İşler ve Muhasebe',
            tur: 'TESPİT EDİCİ',
            yontem: 'OTOMATİK',
            siklik: 'GÜNLÜK',
            sahip: 'Genel Muhasebe Müdürlüğü',
            dayandigiRisk: 'Mali Tablo Hataları Riski',
            etkinlikSkoru: 98,
            durum: 'ETKİN',
            sonTest: '2026-07-21'
        },
        {
            id: 'KNT-HZ-004',
            ad: 'Hazine Gün Sonu Pozisyon Limit Kontrolü',
            surec: 'Hazine ve Fon Yönetimi',
            tur: 'ÖNLEYİCİ',
            yontem: 'YARI_OTOMATİK',
            siklik: 'GÜNLÜK',
            sahip: 'Hazine Operasyon Servisi',
            dayandigiRisk: 'Piyasa ve Likidite Limiti Aşımı Riski',
            etkinlikSkoru: 88,
            durum: 'ETKİN',
            sonTest: '2026-07-18'
        }
    ]);

    const handleSaveControl = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newControl.ad.trim()) {
            showToast('Lütfen kontrol tanımını giriniz', 'warning');
            return;
        }
        setControlsList([newControl, ...controlsList]);
        setIsAddModalOpen(false);
        showToast(`Yeni Kontrol Noktası (${newControl.id}) başarıyla eklendi`, 'success');
        setNewControl({
            id: `KNT-${Math.floor(100 + Math.random() * 900)}`,
            ad: '',
            surec: 'Kredi Tahsis ve Operasyon',
            tur: 'ÖNLEYİCİ',
            yontem: 'OTOMATİK',
            siklik: 'GÜNLÜK',
            sahip: 'Kredi Operasyonları Müdürlüğü',
            dayandigiRisk: '',
            etkinlikSkoru: 90,
            durum: 'ETKİN',
            sonTest: '2026-07-27'
        });
    };

    const selfAssessments = [
        { id: 'KÖD-2026-Q2-01', birim: 'Kredi Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 92, tarih: '2026-07-15', sorumlusu: 'Mehmet Demir (BKS)' },
        { id: 'KÖD-2026-Q2-02', birim: 'Hazine ve Fon Yönetimi', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 96, tarih: '2026-07-18', sorumlusu: 'Ayşe Şahin (BKS)' },
        { id: 'KÖD-2026-Q2-03', birim: 'Şube Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'DEĞERLENDİRMEDE', skor: 78, tarih: '2026-07-20', sorumlusu: 'Zeynep Kaya (İç Kontrolör)' },
        { id: 'KÖD-2026-Q2-04', birim: 'Bilgi Teknolojileri ve Altyapı', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 94, tarih: '2026-07-22', sorumlusu: 'Canan Öztürk (Kıdemli Kontrolör)' },
    ];

    const filteredControls = controlsList.filter(c => {
        if (statusFilter !== 'ALL' && c.durum !== statusFilter) return false;
        if (searchTerm && !c.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !c.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${TERMS.controlModule} — İç Kontrol Çerçevesi ve Süreç Yönetimi`}
                subtitle={TERMS.controlModuleDescription}
            />

            <SegmentedTabs
                tabs={[
                    { id: 'inventory', label: 'Kontrol Envanteri & Çerçeve', icon: Layers },
                    { id: 'kod', label: 'Birim Öz Değerlendirmeleri (KÖD)', icon: FileCheck },
                    { id: 'testing', label: 'Kontrol Testleri & Saha', icon: ShieldCheck },
                    { id: 'deficiencies', label: 'Eksiklik & Aksiyon Takibi', icon: AlertOctagon },
                    { id: 'staff', label: 'Personel & Yetkinlik Matrisi', icon: Users },
                    { id: 'training', label: 'Eğitim & Sertifikasyon', icon: BookOpen },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as any)}
            />

            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Toplam Kontrol Noktası"
                            value={48}
                            icon={Layers}
                            color="blue"
                            infoTooltip="Süreçlerde tanımlı aktif iç kontrol faaliyetleri envanteri"
                        />
                        <StatCard
                            title="Etkin Kontroller (%80+)"
                            value={38}
                            icon={CheckCircle2}
                            color="emerald"
                            infoTooltip="Yapılan testler sonucunda etkin bulunan kontrol oranı"
                        />
                        <StatCard
                            title="Gelişime Açık Kontroller"
                            value={7}
                            icon={Sliders}
                            color="amber"
                            infoTooltip="İyileştirme gereken süreç içi kontrol noktaları"
                        />
                        <StatCard
                            title="Otomatik Kontrol Oranı"
                            value="%65"
                            icon={Activity}
                            color="purple"
                            infoTooltip="Sistem üzerinde otomatik veya yarı otomatik çalışan kontroller"
                        />
                    </div>

                    <PageToolbar
                        searchPlaceholder="Kontrol kodu, tanımı veya süreci ile ara..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        rightActions={
                            <Button
                                variant="primary"
                                leftIcon={<Plus size={18} />}
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                Yeni Kontrol Tanımla
                            </Button>
                        }
                        filters={
                            <FilterDropdown
                                label="Filtrele"
                                activeCount={statusFilter !== 'ALL' ? 1 : 0}
                                onClear={() => setStatusFilter('ALL')}
                            >
                                <div>
                                    <label className="form-label mb-1">Kontrol Etkinlik Durumu</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'ALL', label: 'Tüm Kontroller' },
                                            { value: 'ETKİN', label: 'Etkin Kontroller' },
                                            { value: 'GELİŞİME_AÇIK', label: 'Gelişime Açık Kontroller' },
                                            { value: 'ETKİNSİZ', label: 'Etkisiz Kontroller' },
                                        ]}
                                        value={statusFilter}
                                        onChange={(val) => setStatusFilter(val as string)}
                                    />
                                </div>
                            </FilterDropdown>
                        }
                    />

                    <DataTable
                        columns={[
                            {
                                key: 'id',
                                header: 'Kontrol Kodu',
                                width: '140px',
                                render: (item: any) => <CodeBadge code={item.id} />
                            },
                            {
                                key: 'ad',
                                header: 'Kontrol Tanımı ve Süreç',
                                sortable: true,
                                render: (item: any) => (
                                    <div>
                                        <div className="font-bold text-slate-900">{item.ad}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">Süreç: {item.surec} • Sahip: {item.sahip}</div>
                                    </div>
                                )
                            },
                            {
                                key: 'tur',
                                header: 'Tür / Yöntem',
                                width: '160px',
                                render: (item: any) => (
                                    <div className="text-xs text-slate-700 font-medium">
                                        <div>{item.tur}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{item.yontem} ({item.siklik})</div>
                                    </div>
                                )
                            },
                            {
                                key: 'dayandigiRisk',
                                header: 'Dayandığı Risk',
                                width: '200px',
                                render: (item: any) => (
                                    <span className="text-xs text-slate-600 font-medium">{item.dayandigiRisk}</span>
                                )
                            },
                            {
                                key: 'etkinlikSkoru',
                                header: 'Etkinlik Skoru',
                                width: '130px',
                                render: (item: any) => (
                                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${item.etkinlikSkoru >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        %{item.etkinlikSkoru}
                                    </span>
                                )
                            },
                            {
                                key: 'durum',
                                header: 'Durum',
                                width: '130px',
                                render: (item: any) => <StatusBadge value={item.durum} type="status" />
                            }
                        ]}
                        data={filteredControls}
                        searchTerm={searchTerm}
                        onClearFilters={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                        rowKey="id"
                    />
                </div>
            )}

            {activeTab === 'kod' && (
                <div className="space-y-4">
                    <PageToolbar
                        searchPlaceholder="Birim veya dönem ile ara..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        rightActions={
                            <Button
                                variant="primary"
                                leftIcon={<FileCheck size={18} />}
                                onClick={() => showToast('Yeni Dönem Birim Öz Değerlendirme (KÖD) Dönemi Başlatıldı', 'info')}
                            >
                                Yeni Öz Değerlendirme Başlat
                            </Button>
                        }
                    />
                    <DataTable
                        columns={[
                            {
                                key: 'id',
                                header: 'Form Kodu',
                                width: '150px',
                                render: (item: any) => <CodeBadge code={item.id} />
                            },
                            { key: 'birim', header: 'Değerlendirilen Birim', sortable: true },
                            { key: 'donem', header: 'Dönem', width: '120px' },
                            {
                                key: 'sorumlusu',
                                header: 'Birim Sorumlusu',
                                render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.sorumlusu}</span>
                            },
                            {
                                key: 'skor',
                                header: 'Öz Değerlendirme Skoru',
                                width: '160px',
                                render: (item: any) => (
                                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                                        %{item.skor}
                                    </span>
                                )
                            },
                            {
                                key: 'durum',
                                header: 'Durum',
                                width: '160px',
                                render: (item: any) => <StatusBadge value={item.durum} type="status" />
                            },
                            {
                                key: 'tarih',
                                header: 'Tamamlanma Tarihi',
                                width: '150px',
                                render: (item: any) => (
                                    <span className="font-mono text-xs text-slate-500">{formatDate(item.tarih)}</span>
                                )
                            }
                        ]}
                        data={selfAssessments}
                        rowKey="id"
                    />
                </div>
            )}

            {activeTab === 'testing' && <ControlTestingSection />}
            {activeTab === 'deficiencies' && <ControlDeficienciesSection />}
            {activeTab === 'staff' && <ControlStaffSection />}
            {activeTab === 'training' && <ControlTrainingSection />}

            {/* Live New Control Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Kontrol Noktası Tanımla" size="lg">
                <form onSubmit={handleSaveControl} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Kontrol Kodu</label>
                        <input type="text" className="form-input text-xs w-full bg-slate-100 font-mono" value={newControl.id} readOnly />
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Kontrol Tanımı (Zorunlu)</label>
                        <input type="text" className="form-input text-xs w-full" placeholder="Örn: Gün Sonu Genel Muhasebe Mutabakatı..." value={newControl.ad} onChange={(e) => setNewControl({ ...newControl, ad: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">İlgili Süreç</label>
                            <input type="text" className="form-input text-xs w-full" value={newControl.surec} onChange={(e) => setNewControl({ ...newControl, surec: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Sorumlu Birim</label>
                            <input type="text" className="form-input text-xs w-full" value={newControl.sahip} onChange={(e) => setNewControl({ ...newControl, sahip: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Dayandığı Risk Tanımı</label>
                        <input type="text" className="form-input text-xs w-full" placeholder="Örn: Hatalı Muhasebe Girişi Riski" value={newControl.dayandigiRisk} onChange={(e) => setNewControl({ ...newControl, dayandigiRisk: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Kontrolü Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
