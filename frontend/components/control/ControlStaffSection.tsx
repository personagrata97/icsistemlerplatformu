'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { Users, Award, BookOpen, ShieldCheck, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { useToast } from '@/components/Toast';

export default function ControlStaffSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const staffList = [
        {
            id: 'IKP-001',
            ad: 'Ahmet Yılmaz',
            unvan: 'Kıdemli İç Kontrolör',
            birim: 'İç Kontrol Merkezi / Finansal Kontroller',
            uzmanlik: 'Mali İşler, Hazine, Kredi Operasyonları',
            sertifikalar: ['İç Kontrol Uzmanlık Sertifikası', 'Risk Yönetimi Lisansı'],
            sorumluBirimSayisi: 4,
            durum: 'AKTİF',
            sonEgitimTarihi: '2026-06-10'
        },
        {
            id: 'IKP-002',
            ad: 'Zeynep Kaya',
            unvan: 'İç Kontrolör',
            birim: 'İç Kontrol Merkezi / Operasyonel Kontroller',
            uzmanlik: 'Şube Operasyonları, KVKK, Müşteri Hakları',
            sertifikalar: ['Uyum & Mevzuat Sertifikası'],
            sorumluBirimSayisi: 6,
            durum: 'AKTİF',
            sonEgitimTarihi: '2026-07-02'
        },
        {
            id: 'IKP-003',
            ad: 'Mehmet Demir',
            unvan: 'Birim Kontrol Sorumlusu (BKS)',
            birim: 'Kredi Operasyonları Müdürlüğü',
            uzmanlik: 'Kredi Tahsis Kontrolleri, Teminat Yönetimi',
            sertifikalar: ['Süreç İçi Kontrol İlkeleri'],
            sorumluBirimSayisi: 1,
            durum: 'AKTİF',
            sonEgitimTarihi: '2026-05-20'
        },
        {
            id: 'IKP-004',
            ad: 'Ayşe Şahin',
            unvan: 'Birim Kontrol Sorumlusu (BKS)',
            birim: 'Hazine ve Fon Yönetimi',
            uzmanlik: 'Piyasa Riski Kontrolleri, Likidite İzleme',
            sertifikalar: ['Sermaye Piyasaları Lisansı'],
            sorumluBirimSayisi: 1,
            durum: 'AKTİF',
            sonEgitimTarihi: '2026-06-25'
        },
        {
            id: 'IKP-005',
            ad: 'Canan Öztürk',
            unvan: 'Kıdemli İç Kontrolör',
            birim: 'İç Kontrol Merkezi / Bilgi Sistemleri Kontrolleri',
            uzmanlik: 'Veri Güvenliği, Yetki Matrisi, IT Genel Kontrolleri',
            sertifikalar: ['CISA Uluslararası Bilgi Sistemleri Kontrolörü', 'ISO 27001 Başdenetçi'],
            sorumluBirimSayisi: 3,
            durum: 'EĞİTİMDE',
            sonEgitimTarihi: '2026-07-20'
        }
    ];

    const filteredStaff = staffList.filter(s => {
        if (roleFilter !== 'ALL' && !s.unvan.includes(roleFilter)) return false;
        if (searchTerm && !s.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !s.birim.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="İç Kontrolör Kadrosu"
                    value={12}
                    icon={Users}
                    color="blue"
                    infoTooltip="Merkezi İç Kontrol biriminde görevli aktif kontrolör sayısı"
                />
                <StatCard
                    title="Birim Kontrol Sorumluları (BKS)"
                    value={28}
                    icon={UserCheck}
                    color="emerald"
                    infoTooltip="İş birimlerinde sürece bağlı görev yapan kontrol temsilcileri"
                />
                <StatCard
                    title="Sertifikalı Personel Oranı"
                    value="%92"
                    icon={Award}
                    color="purple"
                    infoTooltip="Mesleki sertifikaya sahip iç kontrol personeli yüzdesi"
                />
                <StatCard
                    title="Tamamlanan Yıllık Eğitim"
                    value="42 Saat"
                    icon={BookOpen}
                    color="amber"
                    infoTooltip="Personel başına ortalama yıllık tamamlanan kontrol eğitimi"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Personel adı, unvanı veya birimi ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<UserCheck size={18} />}
                        onClick={() => showToast('Birim Kontrol Sorumlusu atama ekranı açıldı', 'info')}
                    >
                        Kontrol Sorumlusu Atama
                    </Button>
                }
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={roleFilter !== 'ALL' ? 1 : 0}
                        onClear={() => setRoleFilter('ALL')}
                    >
                        <div>
                            <label className="form-label mb-1">Unvan Filtresi</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Personel' },
                                    { value: 'İç Kontrolör', label: 'Merkezi İç Kontrolörler' },
                                    { value: 'Birim Kontrol Sorumlusu', label: 'Birim Kontrol Sorumluları (BKS)' },
                                ]}
                                value={roleFilter}
                                onChange={(val) => setRoleFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'id',
                        header: 'Sicil / Kod',
                        width: '120px',
                        render: (item: any) => <CodeBadge code={item.id} />
                    },
                    {
                        key: 'ad',
                        header: 'Personel Adı & Unvanı',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-slate-900">{item.ad}</div>
                                <div className="text-xs text-slate-500 font-medium">{item.unvan}</div>
                            </div>
                        )
                    },
                    {
                        key: 'birim',
                        header: 'Bağlı Olduğu Birim',
                        render: (item: any) => (
                            <span className="text-xs text-slate-700 font-medium">{item.birim}</span>
                        )
                    },
                    {
                        key: 'uzmanlik',
                        header: 'Uzmanlık Alanı ve Kontroller',
                        render: (item: any) => (
                            <div className="text-xs text-slate-600">
                                <div>{item.uzmanlik}</div>
                                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">{item.sorumluBirimSayisi} Sorumlu Birim</div>
                            </div>
                        )
                    },
                    {
                        key: 'sertifikalar',
                        header: 'Sertifikalar',
                        render: (item: any) => (
                            <div className="flex flex-wrap gap-1">
                                {item.sertifikalar.map((s: string, idx: number) => (
                                    <span key={idx} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-100">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '120px',
                        render: (item: any) => <StatusBadge value={item.durum} type="status" />
                    }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setRoleFilter('ALL'); }}
                rowKey="id"
            />
        </div>
    );
}
