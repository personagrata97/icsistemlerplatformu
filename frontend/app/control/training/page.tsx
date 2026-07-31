'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import ActionMenu from '@/components/ui/ActionMenu';
import { BookOpen, Award, Users, Plus, Eye, Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';

function ControlTrainingPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<string>('catalog');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<any>(null);
    const [selectedPerson, setSelectedPerson] = useState<any>(null);

    const trainingList = [
        {
            id: 'EGT-IK-001', ad: 'COSO İç Kontrol Çerçevesi Temel Eğitimi',
            egitmen: 'Prof. Dr. Halil Seyidoğlu (Dış Eğitmen)', hedefKitle: 'İç Kontrolör Kadrosu',
            sure: '16 Saat (2 Gün)', tarih: '2026-06-10', katilimci: 12,
            durum: 'TAMAMLANDI', icerik: 'COSO 2013 Çerçevesi, 5 Ana Bileşen, 17 İlke ve Kontrol Ortamı Değerlendirmesi',
            sertifika: 'COSO Foundation Certificate'
        },
        {
            id: 'EGT-IK-002', ad: 'Birim Kontrol Sorumluları (BKS) Rol ve Sorumluluklar Eğitimi',
            egitmen: 'Canan Öztürk (İç Kontrol ve Uyum Müdürlüğü)', hedefKitle: 'Tüm BKS Personeli',
            sure: '8 Saat (1 Gün)', tarih: '2026-07-05', katilimci: 28,
            durum: 'TAMAMLANDI', icerik: 'BKS görev tanımı, KÖD süreci, eksiklik raporlama yükümlülükleri',
            sertifika: 'İç Kontrol BKS Yetkinlik Belgesi'
        },
        {
            id: 'EGT-IK-003', ad: 'Kontrol Testi Tasarım ve İşletim Etkinliği Metodolojisi',
            egitmen: 'Ahmet Yılmaz (İç Kontrol ve Uyum Müdürlüğü)', hedefKitle: 'İç Kontrolör Kadrosu',
            sure: '12 Saat (1.5 Gün)', tarih: '2026-08-20', katilimci: 8,
            durum: 'PLANLANMIŞ', icerik: 'Tasarım etkinliği değerlendirme, örneklem büyüklüğü belirleme, walktrough prosedürleri',
            sertifika: 'İç Kontrol Test Uzmanı Belgesi'
        },
        {
            id: 'EGT-IK-004', ad: 'Operasyonel Risk ve İç Kontrol Farkındalık Eğitimi',
            egitmen: 'Ahmet Yılmaz (İç Kontrol ve Uyum Müdürlüğü)', hedefKitle: 'Tüm Birim Yöneticileri',
            sure: '4 Saat (Yarım Gün)', tarih: '2026-09-15', katilimci: 35,
            durum: 'PLANLANMIŞ', icerik: 'Operasyonel risk kavramı, iç kontrol sistemi nedir, birim sorumluluğu ve KÖD süreci',
            sertifika: 'Katılım Belgesi'
        },
    ];

    const personnelTraining = [
        { ad: 'Ahmet Yılmaz', unvan: 'Kıdemli İç Kontrolör', toplamSaat: 32, tamamlanan: 3, planlanan: 1, sertifika: 2, hedef: 40 },
        { ad: 'Canan Öztürk', unvan: 'Kıdemli İç Kontrolör', toplamSaat: 28, tamamlanan: 2, planlanan: 1, sertifika: 2, hedef: 40 },
        { ad: 'Zeynep Kaya', unvan: 'İç Kontrolör', toplamSaat: 24, tamamlanan: 2, planlanan: 2, sertifika: 1, hedef: 40 },
        { ad: 'Emre Aksoy', unvan: 'İç Kontrolör', toplamSaat: 20, tamamlanan: 2, planlanan: 1, sertifika: 1, hedef: 40 },
        { ad: 'Mehmet Demir', unvan: 'BKS — İnsan Kaynakları', toplamSaat: 16, tamamlanan: 1, planlanan: 1, sertifika: 1, hedef: 20 },
        { ad: 'Ali Koç', unvan: 'BKS — Hazine', toplamSaat: 12, tamamlanan: 1, planlanan: 1, sertifika: 1, hedef: 20 },
        { ad: 'Fatma Yıldız', unvan: 'BKS — Operasyonlar', toplamSaat: 18, tamamlanan: 2, planlanan: 0, sertifika: 1, hedef: 20 },
        { ad: 'Selin Kara', unvan: 'BKS — Krediler', toplamSaat: 8, tamamlanan: 1, planlanan: 1, sertifika: 0, hedef: 20 },
    ];

    const filteredTraining = trainingList.filter(t => {
        if (searchTerm && !t.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const filteredPersonnel = personnelTraining.filter(p => {
        if (searchTerm && !p.ad.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <ControlStaffTabs />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Eğitim Programı" value={trainingList.length} icon={BookOpen} color="blue" />
                <StatCard title="Tamamlanan Eğitimler" value={trainingList.filter(t => t.durum === 'TAMAMLANDI').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Planlanan Eğitimler" value={trainingList.filter(t => t.durum === 'PLANLANMIŞ').length} icon={Calendar} color="amber" />
                <StatCard title="Sertifikalandırılan Personel" value={40} icon={Award} color="purple" />
            </div>

            <SegmentedTabs
                tabs={[
                    { id: 'catalog', label: 'Eğitim Kataloğu', icon: BookOpen },
                    { id: 'personnel', label: 'Kişi Bazlı Eğitim Takibi', icon: Users }
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id)}
            />

            <PageToolbar
                searchPlaceholder={activeTab === 'catalog' ? "Eğitim adı veya kodu ile ara..." : "Personel adı ile ara..."}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={activeTab === 'catalog' ? (
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                        Yeni Eğitim Tanımla
                    </Button>
                ) : undefined}
            />

            {/* ===== EĞİTİM KATALOĞU SEKMESİ ===== */}
            {activeTab === 'catalog' && (
                <DataTable
                    columns={[
                        { key: 'id', header: 'Eğitim Kodu', width: '130px', render: (item: any) => <CodeBadge code={item.id} /> },
                        { key: 'ad', header: 'Eğitim Tanımı & Eğitmen', sortable: true, render: (item: any) => (
                            <div>
                                <div className="font-bold text-slate-900">{item.ad}</div>
                                <div className="text-xs text-slate-500 font-medium">Eğitmen: {item.egitmen}</div>
                            </div>
                        ) },
                        { key: 'hedefKitle', header: 'Hedef Kitle', width: '180px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.hedefKitle}</span> },
                        { key: 'katilimci', header: 'Katılımcı', width: '100px', render: (item: any) => <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{item.katilimci} Kişi</span> },
                        { key: 'durum', header: 'Durum', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                        { key: 'tarih', header: 'Eğitim Tarihi', type: 'date', width: '140px' },
                        { key: 'actions', header: 'İşlem', width: '100px', render: (item: any) => (
                            <ActionMenu items={[
                                { label: 'Detay Görüntüle', icon: <Eye size={14} />, onClick: () => setSelectedTraining(item) },
                            ]} />
                        ) }
                    ]}
                    data={filteredTraining}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="id"
                />
            )}

            {/* ===== KİŞİ BAZLI EĞİTİM TAKİBİ SEKMESİ ===== */}
            {activeTab === 'personnel' && (
                <DataTable
                    columns={[
                        { key: 'ad', header: 'Personel', sortable: true, render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {item.ad.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-xs">{item.ad}</div>
                                    <div className="text-[11px] text-slate-500">{item.unvan}</div>
                                </div>
                            </div>
                        ) },
                        { key: 'toplamSaat', header: 'Toplam Saat', width: '120px', sortable: true, render: (item: any) => (
                            <div className="space-y-1">
                                <span className="font-mono text-xs font-bold text-slate-800">{item.toplamSaat}h / {item.hedef}h</span>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full transition-all ${(item.toplamSaat / item.hedef) >= 0.8 ? 'bg-emerald-500' : (item.toplamSaat / item.hedef) >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((item.toplamSaat / item.hedef) * 100, 100)}%` }} />
                                </div>
                            </div>
                        ) },
                        { key: 'tamamlanan', header: 'Tamamlanan', width: '110px', render: (item: any) => <StatusBadge value="Tamamlandı" type="status" /> },
                        { key: 'planlanan', header: 'Planlanan', width: '110px', render: (item: any) => <StatusBadge value="Planlandı" type="status" /> },
                        { key: 'sertifika', header: 'Sertifika', width: '110px', render: (item: any) => <StatusBadge value={item.sertifika > 0 ? 'Onaylandı' : 'Taslak'} type="approval" /> },
                        { key: 'actions', header: 'İncele', width: '90px', render: (item: any) => (
                            <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedPerson(item)}>Detay</Button>
                        ) }
                    ]}
                    data={filteredPersonnel}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="ad"
                />
            )}

            {/* Training Detail Modal */}
            {selectedTraining && (
                <Modal isOpen={!!selectedTraining} onClose={() => setSelectedTraining(null)} title={`Eğitim Detayı — ${selectedTraining.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedTraining.ad}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">Eğitmen: {selectedTraining.egitmen}</p>
                                </div>
                                <StatusBadge value={selectedTraining.durum} type="status" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Hedef Kitle</span>
                                <span className="font-bold text-slate-900">{selectedTraining.hedefKitle}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Süre</span>
                                <span className="font-bold text-slate-900">{selectedTraining.sure}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Katılımcı Sayısı</span>
                                <span className="font-bold text-slate-900">{selectedTraining.katilimci} Kişi</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block">Eğitim Müfredatı & İçerik:</span>
                            <p className="text-slate-600 leading-relaxed">{selectedTraining.icerik}</p>
                        </div>
                        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                            <span className="text-purple-900 font-bold block">Verilen Sertifika / Belge:</span>
                            <p className="text-purple-800 font-mono font-medium">{selectedTraining.sertifika}</p>
                        </div>
                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedTraining(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Personnel Training Detail Modal */}
            {selectedPerson && (
                <Modal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} title={`Eğitim Profili — ${selectedPerson.ad}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/60">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                    {selectedPerson.ad.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900">{selectedPerson.ad}</h3>
                                    <p className="text-slate-600">{selectedPerson.unvan}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 text-center">
                                <span className="text-blue-800 font-bold block">Toplam Saat</span>
                                <span className="text-blue-900 text-xl font-bold">{selectedPerson.toplamSaat}h</span>
                                <div className="text-[10px] text-blue-600">Hedef: {selectedPerson.hedef}h</div>
                            </div>
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1 text-center">
                                <span className="text-emerald-800 font-bold block">Tamamlanan</span>
                                <span className="text-emerald-900 text-xl font-bold">{selectedPerson.tamamlanan}</span>
                            </div>
                            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1 text-center">
                                <span className="text-amber-800 font-bold block">Planlanan</span>
                                <span className="text-amber-900 text-xl font-bold">{selectedPerson.planlanan}</span>
                            </div>
                            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1 text-center">
                                <span className="text-purple-800 font-bold block">Sertifika</span>
                                <span className="text-purple-900 text-xl font-bold">{selectedPerson.sertifika}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block">Yıllık Eğitim Hedefi İlerleme:</span>
                            <div className="w-full bg-slate-100 rounded-full h-3 mt-2">
                                <div className={`h-3 rounded-full transition-all ${(selectedPerson.toplamSaat / selectedPerson.hedef) >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((selectedPerson.toplamSaat / selectedPerson.hedef) * 100, 100)}%` }} />
                            </div>
                            <p className="text-right text-[10px] text-slate-500 font-medium mt-1">%{Math.round((selectedPerson.toplamSaat / selectedPerson.hedef) * 100)} tamamlandı</p>
                        </div>
                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedPerson(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add Training Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni İç Kontrol Eğitim Programı Tanımla" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); showToast('Yeni Eğitim Programı başarıyla tanımlandı', 'success'); }} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim Başlığı (Zorunlu)</label>
                        <input type="text" className="form-input text-xs w-full" placeholder="Örn: Operasyonel Risk ve İç Kontrol Farkındalık Eğitimi..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitmen</label>
                            <input type="text" className="form-input text-xs w-full" placeholder="Eğitmen adı..." />
                        </div>
                        <div>
                            <CustomSelect label="Hedef Kitle" options={[
                                { value: 'İç Kontrolör Kadrosu', label: 'İç Kontrolör Kadrosu' },
                                { value: 'Tüm BKS Personeli', label: 'Tüm BKS Personeli' },
                                { value: 'Tüm Birim Yöneticileri', label: 'Tüm Birim Yöneticileri' }
                            ]} value="İç Kontrolör Kadrosu" onChange={() => {}} />
                        </div>
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim İçeriği Özeti</label>
                        <textarea className="form-input text-xs w-full" rows={3} placeholder="Eğitim müfredatı ve konu başlıkları..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Eğitimi Kaydet & Planla</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}


export default function ControlTrainingPage() {
    return (
        <RequireRole allowedRoles={['KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlTrainingPageContent />
        </RequireRole>
    );
}
