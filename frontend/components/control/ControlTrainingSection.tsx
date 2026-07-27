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
import { BookOpen, Award, GraduationCap, Clock, Play } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlTrainingSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);

    const [trainingList, setTrainingList] = useState([
        {
            id: 'EGT-IK-101',
            ad: 'İç Kontrol İlkeleri ve Süreç İçi Kontrol Tasarımı',
            kategori: 'Temel İç Kontrol',
            hedefKitle: 'Tüm Birim Kontrol Sorumluları (BKS)',
            sure: '12 Saat (Online + Atölye)',
            katilimciSayisi: 84,
            tamamlamaOrani: 96,
            zorunlu: true,
            sonGuncelleme: '2026-06-15'
        },
        {
            id: 'EGT-IK-202',
            ad: 'Birim Kontrol Öz Değerlendirme (RCSA) Metodolojisi',
            kategori: 'Öz Değerlendirme',
            hedefKitle: 'Birim Müdürleri ve Kontrolörler',
            sure: '8 Saat',
            katilimciSayisi: 42,
            tamamlamaOrani: 90,
            zorunlu: true,
            sonGuncelleme: '2026-07-01'
        },
        {
            id: 'EGT-IK-305',
            ad: 'KVKK ve Veri Güvenliği Kontrol Standartları',
            kategori: 'Mevzuat & Uyum',
            hedefKitle: 'Şube ve Operasyon Personeli',
            sure: '6 Saat',
            katilimciSayisi: 310,
            tamamlamaOrani: 88,
            zorunlu: true,
            sonGuncelleme: '2026-05-20'
        },
        {
            id: 'EGT-IK-410',
            ad: 'Kredi ve Hazine Kontrollerinde Otomasyon ve Robotik Süreçler',
            kategori: 'İleri Kontrol Teknikleri',
            hedefKitle: 'Kıdemli İç Kontrolörler',
            sure: '16 Saat',
            katilimciSayisi: 18,
            tamamlamaOrani: 100,
            zorunlu: false,
            sonGuncelleme: '2026-07-10'
        }
    ]);

    const [newTraining, setNewTraining] = useState({
        id: `EGT-IK-${Math.floor(500 + Math.random() * 400)}`,
        ad: '',
        kategori: 'Temel İç Kontrol',
        hedefKitle: 'Birim Kontrol Sorumluları (BKS)',
        sure: '8 Saat',
        katilimciSayisi: 0,
        tamamlamaOrani: 0,
        zorunlu: true,
        sonGuncelleme: '2026-07-27'
    });

    const handleSaveTraining = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTraining.ad.trim()) {
            showToast('Lütfen eğitim başlığını giriniz', 'warning');
            return;
        }

        setTrainingList([newTraining, ...trainingList]);
        setIsTrainingModalOpen(false);
        showToast(`Yeni Eğitim Seansı (${newTraining.id}) başarıyla oluşturuldu`, 'success');

        setNewTraining({
            id: `EGT-IK-${Math.floor(500 + Math.random() * 400)}`,
            ad: '',
            kategori: 'Temel İç Kontrol',
            hedefKitle: 'Birim Kontrol Sorumluları (BKS)',
            sure: '8 Saat',
            katilimciSayisi: 0,
            tamamlamaOrani: 0,
            zorunlu: true,
            sonGuncelleme: '2026-07-27'
        });
    };

    const filteredTrainings = trainingList.filter(t => {
        if (searchTerm && !t.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Aktif Eğitim Kataloğu" value={trainingList.length} icon={BookOpen} color="blue" />
                <StatCard title="Genel Katılım Oranı" value="%93" icon={GraduationCap} color="emerald" />
                <StatCard title="Düzenlenen Sertifika" value={454} icon={Award} color="purple" />
                <StatCard title="Yaklaşan Eğitim Seansı" value={3} icon={Clock} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Eğitim adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Play size={18} />}
                        onClick={() => setIsTrainingModalOpen(true)}
                    >
                        Yeni Eğitim Tanımla
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Eğitim Kodu', width: '130px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Eğitim Modülü & Kategori', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">{item.kategori} • Kitle: {item.hedefKitle}</div>
                        </div>
                    ) },
                    { key: 'sure', header: 'Süre', width: '140px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.sure}</span> },
                    { key: 'katilimciSayisi', header: 'Katılımcı / Oran', width: '160px', render: (item: any) => (
                        <div>
                            <div className="text-xs font-bold text-slate-900">{item.katilimciSayisi} Personel</div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${item.tamamlamaOrani}%` }}></div>
                            </div>
                        </div>
                    ) },
                    { key: 'zorunlu', header: 'Zorunluluk', width: '120px', render: (item: any) => (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.zorunlu ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-700'}`}>
                            {item.zorunlu ? 'ZORUNLU' : 'SEÇMELİ'}
                        </span>
                    ) },
                    { key: 'sonGuncelleme', header: 'Son Güncelleme', width: '150px', render: (item: any) => <DateDisplay date={item.sonGuncelleme} /> }
                ]}
                data={filteredTrainings}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Modal for Creating Training */}
            <Modal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} title="Yeni İç Kontrol Eğitimi Tanımla" size="lg">
                <form onSubmit={handleSaveTraining} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim Modül Adı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: İç Kontrol İlkeleri ve Süreç İçi Kontrol Tasarımı..."
                            value={newTraining.ad}
                            onChange={(e) => setNewTraining({ ...newTraining, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Kategori</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTraining.kategori}
                                onChange={(e) => setNewTraining({ ...newTraining, kategori: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Hedef Kitle</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTraining.hedefKitle}
                                onChange={(e) => setNewTraining({ ...newTraining, hedefKitle: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Eğitim Süresi</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newTraining.sure}
                                onChange={(e) => setNewTraining({ ...newTraining, sure: e.target.value })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Zorunluluk Durumu"
                                options={[
                                    { value: 'true', label: 'ZORUNLU EĞİTİM' },
                                    { value: 'false', label: 'SEÇMELİ EĞİTİM' }
                                ]}
                                value={newTraining.zorunlu ? 'true' : 'false'}
                                onChange={(val) => setNewTraining({ ...newTraining, zorunlu: val === 'true' })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsTrainingModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Eğitim Seansını Yayınla</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
