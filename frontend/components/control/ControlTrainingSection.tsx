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
import { BookOpen, Award, Users, Plus, Eye, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlTrainingSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<any>(null);

    const [trainingList, setTrainingList] = useState([
        {
            id: 'EGT-IK-001',
            ad: 'COSO İç Kontrol Çerçevesi Temel Eğitimi',
            egitmen: 'Prof. Dr. Halil Seyidoğlu (Dış Eğitmen)',
            hedefKitle: 'Denetçi Kadrosu',
            sure: '16 Saat (2 Gün)',
            tarih: '2026-06-10',
            katilimci: 12,
            durum: 'TAMAMLANDI',
            icerik: 'COSO 2013 Çerçevesi, 5 Ana Bileşen, 17 İlke ve Kontrol Ortamı Değerlendirmesi',
            sertifika: 'COSO Foundation Certificate'
        },
        {
            id: 'EGT-IK-002',
            ad: 'Birim Kontrol Sorumluları (BKS) Rol ve Sorumluluklar Eğitimi',
            egitmen: 'Canan Öztürk (İç Kontrol ve Uyum Müdürlüğü)',
            hedefKitle: 'Tüm BKS Personeli',
            sure: '8 Saat (1 Gün)',
            tarih: '2026-07-05',
            katilimci: 28,
            durum: 'TAMAMLANDI',
            icerik: 'BKS görev tanımı, KÖD süreci, eksiklik raporlama yükümlülükleri',
            sertifika: 'İç Kontrol BKS Yetkinlik Belgesi'
        },
        {
            id: 'EGT-IK-003',
            ad: 'Kontrol Testi Tasarım ve İşletim Etkinliği Metodolojisi',
            egitmen: 'Ahmet Yılmaz (İç Kontrol ve Uyum Müdürlüğü)',
            hedefKitle: 'Denetçi Kadrosu',
            sure: '12 Saat (1.5 Gün)',
            tarih: '2026-08-20',
            katilimci: 8,
            durum: 'PLANLANMIŞ',
            icerik: 'Tasarım etkinliği değerlendirme, örneklem büyüklüğü belirleme, walktrough prosedürleri',
            sertifika: 'İç Kontrol Test Uzmanı Belgesi'
        }
    ]);

    const [newTraining, setNewTraining] = useState({
        id: `EGT-IK-00${trainingList.length + 1}`,
        ad: '',
        egitmen: 'Canan Öztürk (İç Kontrol ve Uyum Müdürlüğü)',
        hedefKitle: 'Denetçi Kadrosu',
        sure: '8 Saat (1 Gün)',
        tarih: '2026-09-15',
        katilimci: 10,
        durum: 'PLANLANMIŞ',
        icerik: '',
        sertifika: 'İç Kontrol Yetkinlik Belgesi'
    });

    const handleSaveTraining = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTraining.ad.trim()) {
            showToast('Lütfen eğitim adını giriniz', 'warning');
            return;
        }

        setTrainingList([newTraining, ...trainingList]);
        setIsAddModalOpen(false);
        showToast(`Yeni Eğitim Programı (${newTraining.id}) başarıyla tanımlandı`, 'success');

        setNewTraining({
            id: `EGT-IK-00${trainingList.length + 2}`,
            ad: '',
            egitmen: 'Canan Öztürk (İç Kontrol ve Uyum Müdürlüğü)',
            hedefKitle: 'Denetçi Kadrosu',
            sure: '8 Saat (1 Gün)',
            tarih: '2026-09-15',
            katilimci: 10,
            durum: 'PLANLANMIŞ',
            icerik: '',
            sertifika: 'İç Kontrol Yetkinlik Belgesi'
        });
    };

    const filteredTraining = trainingList.filter(t => {
        if (searchTerm && !t.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Eğitim Programı" value={trainingList.length} icon={BookOpen} color="blue" />
                <StatCard title="Tamamlanan Eğitimler" value={trainingList.filter(t => t.durum === 'TAMAMLANDI').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Planlanan Eğitimler" value={trainingList.filter(t => t.durum === 'PLANLANMIŞ').length} icon={Calendar} color="amber" />
                <StatCard title="Sertifikalandırılan Personel" value={40} icon={Award} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Eğitim adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Yeni Eğitim Tanımla
                    </Button>
                }
            />

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
                    { key: 'actions', header: 'İncele', width: '100px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedTraining(item)}>
                            Detay
                        </Button>
                    ) }
                ]}
                data={filteredTraining}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Training Creation Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni İç Kontrol Eğitim Programı Tanımla" size="lg">
                <form onSubmit={handleSaveTraining} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim Kodu</label>
                        <input type="text" className="form-input text-xs w-full bg-slate-100 font-mono" value={newTraining.id} readOnly />
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim Başlığı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: Operasyonel Risk ve İç Kontrol Farkındalık Eğitimi..."
                            value={newTraining.ad}
                            onChange={(e) => setNewTraining({ ...newTraining, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitmen</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTraining.egitmen}
                                onChange={(e) => setNewTraining({ ...newTraining, egitmen: e.target.value })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Hedef Kitle"
                                options={[
                                    { value: 'İç Kontrolör Kadrosu', label: 'İç Kontrolör Kadrosu' },
                                    { value: 'Tüm BKS Personeli', label: 'Tüm BKS Personeli' },
                                    { value: 'Tüm Birim Yöneticileri', label: 'Tüm Birim Yöneticileri' }
                                ]}
                                value={newTraining.hedefKitle}
                                onChange={(val) => setNewTraining({ ...newTraining, hedefKitle: val as string })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim İçeriği Özeti</label>
                        <textarea
                            className="form-input text-xs w-full"
                            rows={3}
                            placeholder="Eğitim müfredatı ve konu başlıkları..."
                            value={newTraining.icerik}
                            onChange={(e) => setNewTraining({ ...newTraining, icerik: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Eğitimi Kaydet & Planla</Button>
                    </div>
                </form>
            </Modal>

            {/* Rich Training Detail Modal */}
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
        </div>
    );
}
