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
import { Users, Award, UserCheck, Plus, Eye, BookOpen, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlStaffSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const [staffList, setStaffList] = useState([
        { id: 'KNT-01', ad: 'Canan Öztürk', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol Merkezi', rol: 'KONTROLÖR', uzmanlik: 'Kredi Operasyonları, Bilgi Teknolojileri', sertifikalar: 'CIA, CISA, ISO 27001 LA', tecrube: '8 Yıl' },
        { id: 'KNT-02', ad: 'Ahmet Yılmaz', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol Merkezi', rol: 'KONTROLÖR', uzmanlik: 'Hazine, Fon Yönetimi, Mali İşler', sertifikalar: 'CFA, FRM, SPK Düzey 3', tecrube: '10 Yıl' },
        { id: 'KNT-03', ad: 'Zeynep Kaya', unvan: 'İç Kontrolör', birim: 'İç Kontrol Merkezi', rol: 'KONTROLÖR', uzmanlik: 'KVKK, Müşteri İlişkileri, Uyum', sertifikalar: 'CPA, KVKK Uzmanlığı', tecrube: '5 Yıl' },
        { id: 'BKS-01', ad: 'Mehmet Demir', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Kredi Operasyonları Müdürlüğü', rol: 'BKS', uzmanlik: 'Kredi Tahsis ve Teminat İşlemleri', sertifikalar: 'Kredi Derecelendirme Sertifikası', tecrube: '12 Yıl' },
        { id: 'BKS-02', ad: 'Ayşe Şahin', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Hazine ve Fon Yönetimi', rol: 'BKS', uzmanlik: 'Piyasa Riski, Likidite Kontrolü', sertifikalar: 'Hazine Lisansı', tecrube: '9 Yıl' },
    ]);

    const [newStaff, setNewStaff] = useState({
        id: `BKS-0${staffList.length + 1}`,
        ad: '',
        unvan: 'Birim Kontrol Sorumlusu (BKS)',
        birim: 'Şube Operasyonları Müdürlüğü',
        rol: 'BKS',
        uzmanlik: 'Operasyonel Risk, Gişe Kontrolleri',
        sertifikalar: 'Temel Bankacılık Sertifikası',
        tecrube: '6 Yıl'
    });

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaff.ad.trim()) {
            showToast('Lütfen personel adını giriniz', 'warning');
            return;
        }

        setStaffList([newStaff, ...staffList]);
        setIsAddModalOpen(false);
        showToast(`Yeni BKS / Kontrolör Ataması (${newStaff.ad}) başarıyla yapıldı`, 'success');

        setNewStaff({
            id: `BKS-0${staffList.length + 2}`,
            ad: '',
            unvan: 'Birim Kontrol Sorumlusu (BKS)',
            birim: 'Şube Operasyonları Müdürlüğü',
            rol: 'BKS',
            uzmanlik: 'Operasyonel Risk, Gişe Kontrolleri',
            sertifikalar: 'Temel Bankacılık Sertifikası',
            tecrube: '6 Yıl'
        });
    };

    const filteredStaff = staffList.filter(s => {
        if (searchTerm && !s.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !s.unvan.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="İç Kontrol Kadrosu" value={staffList.filter(s => s.rol === 'KONTROLÖR').length} icon={Users} color="blue" />
                <StatCard title="Birim Kontrol Sorumluları (BKS)" value={staffList.filter(s => s.rol === 'BKS').length} icon={UserCheck} color="emerald" />
                <StatCard title="Sertifikalı Personel" value={4} icon={Award} color="purple" />
                <StatCard title="Kapsanan Birim Sayısı" value={28} icon={ShieldCheck} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Personel adı, unvanı veya birimi ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        BKS Atama
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Kod', width: '100px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Personel Adı & Unvan', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">{item.unvan}</div>
                        </div>
                    ) },
                    { key: 'birim', header: 'Görevli Birim', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.birim}</span> },
                    { key: 'uzmanlik', header: 'Uzmanlık Alanı', render: (item: any) => <span className="text-xs text-slate-600 font-medium">{item.uzmanlik}</span> },
                    { key: 'rol', header: 'Rol Türü', width: '130px', render: (item: any) => (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.rol === 'KONTROLÖR' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {item.rol}
                        </span>
                    ) },
                    { key: 'actions', header: 'İncele', width: '100px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedStaff(item)}>
                            Detay
                        </Button>
                    ) }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Modal for BKS Assignment */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Birim Kontrol Sorumlusu (BKS) Atama" size="lg">
                <form onSubmit={handleSaveStaff} className="space-y-4">
                    <div>
                        <label className="form-label mb-1 block text-xs font-bold text-slate-700">Personel Adı Soyadı (Zorunlu)</label>
                        <input
                            type="text"
                            className="form-input text-xs w-full"
                            placeholder="Örn: Selin Aksoy..."
                            value={newStaff.ad}
                            onChange={(e) => setNewStaff({ ...newStaff, ad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Unvan</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newStaff.unvan}
                                onChange={(e) => setNewStaff({ ...newStaff, unvan: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Atandığı Birim</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newStaff.birim}
                                onChange={(e) => setNewStaff({ ...newStaff, birim: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect
                                label="Rol Türü"
                                options={[
                                    { value: 'BKS', label: 'Birim Kontrol Sorumlusu (BKS)' },
                                    { value: 'KONTROLÖR', label: 'İç Kontrolör' }
                                ]}
                                value={newStaff.rol}
                                onChange={(val) => setNewStaff({ ...newStaff, rol: val as string })}
                            />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Uzmanlık Alanları</label>
                            <input
                                type="text"
                                className="form-input text-xs w-full"
                                value={newStaff.uzmanlik}
                                onChange={(e) => setNewStaff({ ...newStaff, uzmanlik: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Atamayı Tamamla</Button>
                    </div>
                </form>
            </Modal>

            {/* Rich Staff Detail Profile Modal */}
            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Personel Yetkinlik Profili — ${selectedStaff.ad}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedStaff.ad}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">{selectedStaff.unvan} • {selectedStaff.birim}</p>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${selectedStaff.rol === 'KONTROLÖR' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                    {selectedStaff.rol}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Mesleki Tecrübe</span>
                                <span className="font-bold text-slate-900">{selectedStaff.tecrube}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Uzmanlık Alanları</span>
                                <span className="font-bold text-slate-900">{selectedStaff.uzmanlik}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                            <span className="text-purple-900 font-bold block">Sahip Olduğu Sertifikalar & Lisanslar:</span>
                            <p className="text-purple-800 font-mono font-medium">{selectedStaff.sertifikalar}</p>
                        </div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
