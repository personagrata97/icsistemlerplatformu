'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import { Users, Award, BookOpen, UserCheck } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { useToast } from '@/components/Toast';

export default function ControlStaffSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const [staffList, setStaffList] = useState([
        {
            id: 'IKP-001',
            ad: 'Ahmet Yılmaz',
            unvan: 'Kıdemli İç Kontrolör',
            birim: 'İç Kontrol Merkezi / Finansal Kontroller',
            uzmanlik: 'Mali İşler, Hazine, Kredi Operasyonları',
            sertifikalar: ['İç Kontrol Uzmanlık Sertifikası', 'Risk Yönetimi Lisansı'],
            sorumluBirimSayisi: 4,
            durum: 'AKTİF'
        },
        {
            id: 'IKP-002',
            ad: 'Zeynep Kaya',
            unvan: 'İç Kontrolör',
            birim: 'İç Kontrol Merkezi / Operasyonel Kontroller',
            uzmanlik: 'Şube Operasyonları, KVKK, Müşteri Hakları',
            sertifikalar: ['Uyum & Mevzuat Sertifikası'],
            sorumluBirimSayisi: 6,
            durum: 'AKTİF'
        },
        {
            id: 'IKP-003',
            ad: 'Mehmet Demir',
            unvan: 'Birim Kontrol Sorumlusu (BKS)',
            birim: 'Kredi Operasyonları Müdürlüğü',
            uzmanlik: 'Kredi Tahsis Kontrolleri, Teminat Yönetimi',
            sertifikalar: ['Süreç İçi Kontrol İlkeleri'],
            sorumluBirimSayisi: 1,
            durum: 'AKTİF'
        },
        {
            id: 'IKP-004',
            ad: 'Ayşe Şahin',
            unvan: 'Birim Kontrol Sorumlusu (BKS)',
            birim: 'Hazine ve Fon Yönetimi',
            uzmanlik: 'Piyasa Riski Kontrolleri, Likidite İzleme',
            sertifikalar: ['Sermaye Piyasaları Lisansı'],
            sorumluBirimSayisi: 1,
            durum: 'AKTİF'
        },
        {
            id: 'IKP-005',
            ad: 'Canan Öztürk',
            unvan: 'Kıdemli İç Kontrolör',
            birim: 'İç Kontrol Merkezi / Bilgi Sistemleri Kontrolleri',
            uzmanlik: 'Veri Güvenliği, Yetki Matrisi, IT Genel Kontrolleri',
            sertifikalar: ['CISA Uluslararası Bilgi Sistemleri Kontrolörü'],
            sorumluBirimSayisi: 3,
            durum: 'EĞİTİMDE'
        }
    ]);

    const [newStaff, setNewStaff] = useState({
        id: `IKP-00${staffList.length + 1}`,
        ad: '',
        unvan: 'Birim Kontrol Sorumlusu (BKS)',
        birim: 'Kredi Operasyonları Müdürlüğü',
        uzmanlik: 'Süreç İçi Kontrol ve Risk İzleme',
        sertifikalar: 'Süreç İçi Kontrol Sertifikası',
        sorumluBirimSayisi: 1,
        durum: 'AKTİF'
    });

    const handleAssignStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaff.ad.trim()) {
            showToast('Lütfen personel adını ve soyadını giriniz', 'warning');
            return;
        }

        const createdItem = {
            ...newStaff,
            sertifikalar: newStaff.sertifikalar.split(',').map(s => s.trim())
        };

        setStaffList([createdItem, ...staffList]);
        setIsAssignModalOpen(false);
        showToast(`Birim Kontrol Sorumlusu (${newStaff.ad}) başarıyla atandı`, 'success');

        setNewStaff({
            id: `IKP-00${staffList.length + 2}`,
            ad: '',
            unvan: 'Birim Kontrol Sorumlusu (BKS)',
            birim: 'Kredi Operasyonları Müdürlüğü',
            uzmanlik: 'Süreç İçi Kontrol ve Risk İzleme',
            sertifikalar: 'Süreç İçi Kontrol Sertifikası',
            sorumluBirimSayisi: 1,
            durum: 'AKTİF'
        });
    };

    const filteredStaff = staffList.filter(s => {
        if (roleFilter !== 'ALL' && !s.unvan.includes(roleFilter)) return false;
        if (searchTerm && !s.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !s.birim.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="İç Kontrolör Kadrosu" value={staffList.filter(s => s.unvan.includes('Kontrolör')).length} icon={Users} color="blue" />
                <StatCard title="Birim Kontrol Sorumluları (BKS)" value={staffList.filter(s => s.unvan.includes('BKS')).length} icon={UserCheck} color="emerald" />
                <StatCard title="Sertifikalı Personel Oranı" value="%92" icon={Award} color="purple" />
                <StatCard title="Tamamlanan Yıllık Eğitim" value="42 Saat" icon={BookOpen} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Personel adı, unvanı veya birimi ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<UserCheck size={18} />}
                        onClick={() => setIsAssignModalOpen(true)}
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
                                    { value: 'Birim Kontrol Sorumlusu', label: 'Birim Kontrol Sorumluları (BKS)' }
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
                    { key: 'id', header: 'Sicil / Kod', width: '120px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Personel Adı & Unvanı', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">{item.unvan}</div>
                        </div>
                    ) },
                    { key: 'birim', header: 'Bağlı Olduğu Birim', render: (item: any) => <span className="text-xs text-slate-700 font-medium">{item.birim}</span> },
                    { key: 'uzmanlik', header: 'Uzmanlık Alanı ve Kontroller', render: (item: any) => (
                        <div className="text-xs text-slate-600">
                            <div>{item.uzmanlik}</div>
                            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">{item.sorumluBirimSayisi} Sorumlu Birim</div>
                        </div>
                    ) },
                    { key: 'sertifikalar', header: 'Sertifikalar', render: (item: any) => (
                        <div className="flex flex-wrap gap-1">
                            {item.sertifikalar.map((s: string, idx: number) => (
                                <span key={idx} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-100">
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) },
                    { key: 'durum', header: 'Durum', width: '120px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setRoleFilter('ALL'); }}
                rowKey="id"
            />

            {/* Modal for Assigning BKS Staff */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Kontrol Sorumlusu (BKS) Atama Formu" size="lg">
                <form onSubmit={handleAssignStaff} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Personel Adı Soyadı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: Serkan Arslan..."
                            value={newStaff.ad}
                            onChange={(e) => setNewStaff({ ...newStaff, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect
                                label="Unvan"
                                options={[
                                    { value: 'Birim Kontrol Sorumlusu (BKS)', label: 'Birim Kontrol Sorumlusu (BKS)' },
                                    { value: 'İç Kontrolör', label: 'İç Kontrolör' },
                                    { value: 'Kıdemli İç Kontrolör', label: 'Kıdemli İç Kontrolör' }
                                ]}
                                value={newStaff.unvan}
                                onChange={(val) => setNewStaff({ ...newStaff, unvan: val as string })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Görevli Olduğu Birim</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newStaff.birim}
                                onChange={(e) => setNewStaff({ ...newStaff, birim: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Uzmanlık Alanları ve Sorumlu Olduğu Kontroller</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            value={newStaff.uzmanlik}
                            onChange={(e) => setNewStaff({ ...newStaff, uzmanlik: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Sertifikalar (Virgülle Ayırın)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            value={newStaff.sertifikalar}
                            onChange={(e) => setNewStaff({ ...newStaff, sertifikalar: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAssignModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Sorumluyu Ata ve Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
