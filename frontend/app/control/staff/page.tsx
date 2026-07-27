'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import ActionMenu from '@/components/ui/ActionMenu';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { Users, Shield, Plus, Eye, Edit2, Mail, Phone, Award, Briefcase, Calendar, UserCheck, TrendingUp } from 'lucide-react';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';
import { DEPARTMENTS } from '@/lib/organization-constants';
import { useToast } from '@/components/Toast';

interface ControlStaff {
    id: string;
    ad: string;
    unvan: string;
    birim: string;
    email: string;
    telefon: string;
    iseBaslama: string;
    durum: string;
    rol: string;
    testSayisi: number;
    egitimSaat: number;
    sertifikalar: string[];
    uzmanlikAlanlari: string[];
}

export default function ControlStaffPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRol, setFilterRol] = useState<string[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<ControlStaff | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');

    const staffList: ControlStaff[] = [
        {
            id: 'IKM-001', ad: 'Ahmet Yılmaz', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            email: 'ahmet.yilmaz@banka.com', telefon: '+90 212 555 01 01', iseBaslama: '2018-03-15',
            durum: 'AKTİF', rol: 'İç Kontrolör', testSayisi: 14, egitimSaat: 32,
            sertifikalar: ['COSO Foundation Certificate', 'CIA Part I'],
            uzmanlikAlanlari: ['Tahsisat Servisi', 'Operasyonel Risk', 'COSO Çerçevesi']
        },
        {
            id: 'IKM-002', ad: 'Canan Öztürk', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            email: 'canan.ozturk@banka.com', telefon: '+90 212 555 01 02', iseBaslama: '2019-06-01',
            durum: 'AKTİF', rol: 'İç Kontrolör', testSayisi: 12, egitimSaat: 28,
            sertifikalar: ['COSO Foundation Certificate', 'İç Kontrol Test Uzmanı'],
            uzmanlikAlanlari: ['CRM ve Performans Servisi', 'KVKK Uyumu', 'BKS Koordinasyonu']
        },
        {
            id: 'IKM-003', ad: 'Zeynep Kaya', unvan: 'İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            email: 'zeynep.kaya@banka.com', telefon: '+90 212 555 01 03', iseBaslama: '2021-09-01',
            durum: 'AKTİF', rol: 'İç Kontrolör', testSayisi: 10, egitimSaat: 24,
            sertifikalar: ['COSO Foundation Certificate'],
            uzmanlikAlanlari: ['Finans Servisi', 'Muhasebe Servisi']
        },
        {
            id: 'IKM-004', ad: 'Emre Aksoy', unvan: 'İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            email: 'emre.aksoy@banka.com', telefon: '+90 212 555 01 04', iseBaslama: '2022-02-15',
            durum: 'AKTİF', rol: 'İç Kontrolör', testSayisi: 8, egitimSaat: 20,
            sertifikalar: ['İç Kontrol BKS Yetkinlik Belgesi'],
            uzmanlikAlanlari: ['Finans Servisi', 'Bütçe ve Raporlama Servisi']
        },
        {
            id: 'BKS-001', ad: 'Mehmet Demir', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Tahsisat Servisi',
            email: 'mehmet.demir@banka.com', telefon: '+90 212 555 02 01', iseBaslama: '2015-01-10',
            durum: 'AKTİF', rol: 'BKS', testSayisi: 4, egitimSaat: 16,
            sertifikalar: ['İç Kontrol BKS Yetkinlik Belgesi'],
            uzmanlikAlanlari: ['Tahsisat İşlemleri', 'Risk Takip']
        },
        {
            id: 'BKS-002', ad: 'Ali Koç', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Finans Servisi',
            email: 'ali.koc@banka.com', telefon: '+90 212 555 03 01', iseBaslama: '2016-05-20',
            durum: 'AKTİF', rol: 'BKS', testSayisi: 5, egitimSaat: 12,
            sertifikalar: ['İç Kontrol BKS Yetkinlik Belgesi'],
            uzmanlikAlanlari: ['FX İşlemleri', 'Finans Mutabakatı']
        },
        {
            id: 'BKS-003', ad: 'Fatma Yıldız', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Operasyon Servisi',
            email: 'fatma.yildiz@banka.com', telefon: '+90 212 555 04 01', iseBaslama: '2017-08-15',
            durum: 'AKTİF', rol: 'BKS', testSayisi: 6, egitimSaat: 18,
            sertifikalar: ['İç Kontrol BKS Yetkinlik Belgesi'],
            uzmanlikAlanlari: ['Ödeme Sistemleri', 'Transfer İşlemleri']
        },
        {
            id: 'BKS-004', ad: 'Selin Kara', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Bilgi Teknolojileri Servisi',
            email: 'selin.kara@banka.com', telefon: '+90 212 555 05 01', iseBaslama: '2020-11-01',
            durum: 'AKTİF', rol: 'BKS', testSayisi: 3, egitimSaat: 8,
            sertifikalar: [],
            uzmanlikAlanlari: ['BT Güvenliği', 'Erişim Kontrolleri']
        },
    ];

    const filteredStaff = staffList.filter(s => {
        if (activeTab === 'kontrolor' && s.rol !== 'İç Kontrolör') return false;
        if (activeTab === 'bks' && s.rol !== 'BKS') return false;
        if (searchTerm && !s.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !s.id.toLowerCase().includes(searchTerm.toLowerCase()) && !s.birim.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterRol.length > 0 && !filterRol.includes(s.rol)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <ControlStaffTabs />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kadro" value={staffList.length} icon={Users} color="blue" />
                <StatCard title="İç Kontrolör" value={staffList.filter(s => s.rol === 'İç Kontrolör').length} icon={Shield} color="emerald" />
                <StatCard title="Birim Kontrol Sorumlusu" value={staffList.filter(s => s.rol === 'BKS').length} icon={UserCheck} color="purple" />
                <StatCard title="Ort. Eğitim Saati" value={`${Math.round(staffList.reduce((a, b) => a + b.egitimSaat, 0) / staffList.length)}h`} icon={Award} color="amber" />
            </div>

            <SegmentedTabs
                tabs={[
                    { id: 'all', label: 'Tüm Kadro', icon: Users },
                    { id: 'kontrolor', label: `İç Kontrolörler (${staffList.filter(s => s.rol === 'İç Kontrolör').length})`, icon: Shield },
                    { id: 'bks', label: `BKS Personeli (${staffList.filter(s => s.rol === 'BKS').length})`, icon: UserCheck }
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id)}
            />

            <PageToolbar
                searchPlaceholder="İsim, sicil no veya birim ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                        Yeni Personel Ekle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Sicil No', width: '110px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Ad Soyad & Unvan', sortable: true, render: (item: any) => (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {item.ad.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-xs">{item.ad}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{item.unvan}</div>
                            </div>
                        </div>
                    ) },
                    { key: 'birim', header: 'Birim', width: '200px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.birim}</span> },
                    { key: 'rol', header: 'Rol', width: '130px', render: (item: any) => (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${item.rol === 'İç Kontrolör' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {item.rol}
                        </span>
                    ) },
                    { key: 'testSayisi', header: 'Test', width: '80px', render: (item: any) => <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{item.testSayisi}</span> },
                    { key: 'durum', header: 'Durum', width: '100px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'actions', header: 'İşlemler', width: '110px', render: (item: any) => (
                        <ActionMenu items={[
                            { label: 'Profil Detayı', icon: <Eye size={14} />, onClick: () => setSelectedStaff(item) },
                            { label: 'E-posta Gönder', icon: <Mail size={14} />, onClick: () => showToast(`${item.ad} adresine e-posta hazırlanıyor`, 'success') },
                            { label: 'Düzenle', icon: <Edit2 size={14} />, onClick: () => showToast(`${item.ad} düzenleme ekranı açılıyor`, 'info') },
                        ]} />
                    ) }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setFilterRol([]); }}
                rowKey="id"
            />

            {/* Staff Profile Detail Modal */}
            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Personel Profili — ${selectedStaff.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/60">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                                    {selectedStaff.ad.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-900">{selectedStaff.ad}</h3>
                                    <p className="text-slate-600 font-medium">{selectedStaff.unvan}</p>
                                    <p className="text-slate-500">{selectedStaff.birim}</p>
                                </div>
                                <div className="ml-auto">
                                    <StatusBadge value={selectedStaff.durum} type="status" />
                                </div>
                            </div>
                        </div>

                        {/* Contact & Info */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">E-posta</span>
                                <span className="font-semibold text-slate-900">{selectedStaff.email}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Telefon</span>
                                <span className="font-semibold text-slate-900">{selectedStaff.telefon}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">İşe Başlama</span>
                                <span className="font-semibold text-slate-900">{new Date(selectedStaff.iseBaslama).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Performance */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                                <span className="text-emerald-800 font-bold block">Tamamlanan Test Sayısı</span>
                                <span className="text-emerald-900 text-xl font-bold">{selectedStaff.testSayisi}</span>
                            </div>
                            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                                <span className="text-blue-800 font-bold block">Toplam Eğitim Saati</span>
                                <span className="text-blue-900 text-xl font-bold">{selectedStaff.egitimSaat}h</span>
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                            <span className="text-slate-700 font-bold block">Sertifikalar & Belgeler:</span>
                            {selectedStaff.sertifikalar.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedStaff.sertifikalar.map((cert, i) => (
                                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">{cert}</span>
                                    ))}
                                </div>
                            ) : <span className="text-slate-400 italic">Henüz sertifika kaydı yok</span>}
                        </div>

                        {/* Expertise */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                            <span className="text-slate-700 font-bold block">Uzmanlık Alanları:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedStaff.uzmanlikAlanlari.map((alan, i) => (
                                    <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">{alan}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add Staff Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni İç Kontrol Personeli Ekle" size="lg">
                <form onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); showToast('Yeni personel kaydı oluşturuldu', 'success'); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Ad Soyad (Zorunlu)</label>
                            <input type="text" className="form-input text-xs w-full" placeholder="Örn: Ayşe Demir" required />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Unvan</label>
                            <input type="text" className="form-input text-xs w-full" placeholder="Örn: İç Kontrolör" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">E-posta</label>
                            <input type="email" className="form-input text-xs w-full" placeholder="email@banka.com" />
                        </div>
                        <div>
                            <label className="form-label mb-1 block text-xs font-bold text-slate-700">Telefon</label>
                            <input type="tel" className="form-input text-xs w-full" placeholder="+90 212 555 XX XX" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect
                                label="Birim"
                                options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                                value="Tahsisat Servisi"
                                onChange={() => {}}
                            />
                        </div>
                        <div>
                            <CustomSelect label="Rol" options={[
                                { value: 'İç Kontrolör', label: 'İç Kontrolör' },
                                { value: 'BKS', label: 'Birim Kontrol Sorumlusu (BKS)' }
                            ]} value="İç Kontrolör" onChange={() => {}} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Personeli Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
