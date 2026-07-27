'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import { BookOpen, Award, CheckCircle2, GraduationCap, Clock, FileCheck, Play } from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';

export default function ControlTrainingSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const trainingList = [
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
    ];

    const filteredTrainings = trainingList.filter(t => {
        if (searchTerm && !t.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Aktif Eğitim Kataloğu"
                    value={14}
                    icon={BookOpen}
                    color="blue"
                    infoTooltip="İç Kontrol ve mevzuat uyum alanında tanımlı aktif eğitim modülleri"
                />
                <StatCard
                    title="Genel Katılım Oranı"
                    value="%93"
                    icon={GraduationCap}
                    color="emerald"
                    infoTooltip="Zorunlu İç Kontrol eğitimlerini tamamlayan birim personeli oranı"
                />
                <StatCard
                    title="Düzenlenen Sertifika"
                    value={454}
                    icon={Award}
                    color="purple"
                    infoTooltip="Başarıyla tamamlanan eğitimler sonucu verilen başarı sertifikaları"
                />
                <StatCard
                    title="Yaklaşan Eğitim Seansı"
                    value={3}
                    icon={Clock}
                    color="amber"
                    infoTooltip="Önümüzdeki 30 gün içinde takvimlenen canlı iç kontrol seansları"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Eğitim adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Play size={18} />}
                        onClick={() => showToast('Yeni Eğitim Seansı Oluşturma ekranı açıldı', 'info')}
                    >
                        Yeni Eğitim Tanımla
                    </Button>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'id',
                        header: 'Eğitim Kodu',
                        width: '130px',
                        render: (item: any) => <CodeBadge code={item.id} />
                    },
                    {
                        key: 'ad',
                        header: 'Eğitim Modülü & Kategori',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-slate-900">{item.ad}</div>
                                <div className="text-xs text-slate-500 font-medium">{item.kategori} • Kitle: {item.hedefKitle}</div>
                            </div>
                        )
                    },
                    {
                        key: 'sure',
                        header: 'Süre',
                        width: '140px',
                        render: (item: any) => (
                            <span className="text-xs font-semibold text-slate-700">{item.sure}</span>
                        )
                    },
                    {
                        key: 'katilimciSayisi',
                        header: 'Katılımcı / Oran',
                        width: '160px',
                        render: (item: any) => (
                            <div>
                                <div className="text-xs font-bold text-slate-900">{item.katilimciSayisi} Personel</div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${item.tamamlamaOrani}%` }}></div>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'zorunlu',
                        header: 'Zorunluluk',
                        width: '120px',
                        render: (item: any) => (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.zorunlu ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-700'}`}>
                                {item.zorunlu ? 'ZORUNLU' : 'SEÇMELİ'}
                            </span>
                        )
                    },
                    {
                        key: 'sonGuncelleme',
                        header: 'Son Güncelleme',
                        width: '140px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-slate-500">{formatDate(item.sonGuncelleme)}</span>
                        )
                    }
                ]}
                data={filteredTrainings}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}
