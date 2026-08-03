'use client';
import UnitBadge from '@/components/ui/UnitBadge';
import FormInput from '@/components/ui/FormInput';
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
        { id: 'KNT-01', ad: 'Canan Öztürk', unvan: 'Başdenetçi', birim: 'İç Kontrol ve Uyum Müdürlüğü', rol: 'DENETÇİ', uzmanlik: 'Tahsisat Servisi, Bilgi Teknolojileri Servisi', sertifikalar: 'CIA, CISA, ISO 27001 LA', tecrube: '8 Yıl' },
        { id: 'KNT-02', ad: 'Ahmet Yılmaz', unvan: 'Başdenetçi', birim: 'İç Kontrol ve Uyum Müdürlüğü', rol: 'DENETÇİ', uzmanlik: 'Finans Servisi, Muhasebe Servisi', sertifikalar: 'CFA, FRM, SPK Düzey 3', tecrube: '10 Yıl' },
        { id: 'KNT-03', ad: 'Zeynep Kaya', unvan: 'Denetçi', birim: 'İç Kontrol ve Uyum Müdürlüğü', rol: 'DENETÇİ', uzmanlik: 'CRM ve Performans Servisi, Uyum', sertifikalar: 'CPA, KVKK Uzmanlığı', tecrube: '5 Yıl' },
        { id: 'BKS-01', ad: 'Mehmet Demir', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Tahsisat Servisi', rol: 'BKS', uzmanlik: 'Tahsisat ve Teminat İşlemleri', sertifikalar: 'Kredi Derecelendirme Sertifikası', tecrube: '12 Yıl' },
        { id: 'BKS-02', ad: 'Ayşe Şahin', unvan: 'Birim Kontrol Sorumlusu (BKS)', birim: 'Finans Servisi', rol: 'BKS', uzmanlik: 'Piyasa Riski, Likidite Kontrolü', sertifikalar: 'Hazine Lisansı', tecrube: '9 Yıl' },
    ]);

    const [newStaff, setNewStaff] = useState({
        id: `BKS-0${staffList.length + 1}`,
        ad: '',
        unvan: 'Birim Kontrol Sorumlusu (BKS)',
        birim: 'Operasyon Servisi',
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
            birim: 'Operasyon Servisi',
            rol: 'BKS',
            uzmanlik: 'Operasyonel Risk, Gişe Kontrolleri',
            sertifikalar: 'Temel Bankacılık Sertifikası',
            tecrube: '6 Yıl'
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="İç Kontrolörler" value={staffList.filter(s => s.rol === 'DENETÇİ').length} icon={Users} color="emerald" subtext="Merkezi İç Kontrol Ekibi" />
                <StatCard title="Birim Kontrol Sorumluları (BKS)" value={staffList.filter(s => s.rol === 'BKS').length} icon={UserCheck} color="blue" subtext="Saha & İş Birimi Temsilcileri" />
                <StatCard title="Sertifikalı Personel" value={staffList.filter(s => s.sertifikalar).length} icon={Award} color="purple" subtext="Uluslararası lisans sahibi" />
            </div>

            <PageToolbar
                searchPlaceholder="Personel adı, birim veya unvana göre ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                showAddButton
                onAddClick={() => setIsAddModalOpen(true)}
                addButtonText="Yeni BKS / Kontrolör Ataması"
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Sicil / Kod', render: (item) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Adı Soyadı', render: (item) => <span className="font-bold text-slate-900 cursor-pointer hover:text-emerald-700" onClick={() => setSelectedStaff(item)}>{item.ad}</span> },
                    { key: 'unvan', header: 'Unvan', render: (item) => <span className="text-slate-700 font-medium">{item.unvan}</span> },
                    { key: 'birim', header: 'Görevli Birim', render: (item) => <UnitBadge name={item.birim} /> },
                    { key: 'uzmanlik', header: 'Uzmanlık Alanları', render: (item) => <span className="text-slate-600 truncate max-w-xs block">{item.uzmanlik}</span> },
                    { key: 'tecrube', header: 'Tecrübe', render: (item) => <span className="font-mono text-slate-700">{item.tecrube}</span> },
                    { key: 'actions', header: 'İşlem', align: 'right', render: (item) => (
                        <Button variant="ghost" leftIcon={<Eye size={14} />} onClick={() => setSelectedStaff(item)}>Detay</Button>
                    ) }
                ]}
                data={staffList.filter(s => !searchTerm || s.ad.toLowerCase().includes(searchTerm.toLowerCase()) || s.birim.toLowerCase().includes(searchTerm.toLowerCase()))}
                rowKey="id"
            />

            {/* Detail Modal */}
            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Personel Profili — ${selectedStaff.ad}`} size="md">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base text-slate-900">{selectedStaff.ad}</h4>
                                    <p className="text-slate-500 font-semibold mt-0.5">{selectedStaff.unvan}</p>
                                </div>
                                <StatusBadge value={selectedStaff.rol} type="status" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Bağlı Birim</span>
                                <span className="font-bold text-slate-900"><UnitBadge name={selectedStaff.birim} /></span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Sektör Tecrübesi</span>
                                <span className="font-bold text-slate-900">{selectedStaff.tecrube}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> Sertifikalar & Lisanslar</span>
                            <p className="text-slate-600">{selectedStaff.sertifikalar || 'Kayıt yok'}</p>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block flex items-center gap-1.5"><BookOpen size={14} className="text-blue-600" /> Sorumlu Olduğu Kontrol Süreçleri</span>
                            <p className="text-slate-600">{selectedStaff.uzmanlik}</p>
                        </div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add Staff Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni Birim Kontrol Sorumlusu / Kontrolör Ataması" size="md">
                <form onSubmit={handleSaveStaff} className="space-y-4">
                    <FormInput
                        label="Sicil / Kod"
                        value={newStaff.id}
                        readOnlyView
                    />
                    <FormInput
                        label="Personel Adı Soyadı *"
                        required
                        placeholder="Örn: Mehmet Demir"
                        value={newStaff.ad}
                        onChange={e => setNewStaff({ ...newStaff, ad: e.target.value })}
                    />
                    <CustomSelect
                        label="Atanacağı Görev Unvanı"
                        options={[
                            { value: 'Birim Kontrol Sorumlusu (BKS)', label: 'Birim Kontrol Sorumlusu (BKS)' },
                            { value: 'İç Kontrolör', label: 'İç Kontrolör' },
                            { value: 'Kıdemli İç Kontrolör', label: 'Kıdemli İç Kontrolör' }
                        ]}
                        value={newStaff.unvan}
                        onChange={val => setNewStaff({ ...newStaff, unvan: val as string })}
                    />
                    <CustomSelect
                        label="Sorumlu Olacağı Birim"
                        options={['İç Kontrol ve Uyum Müdürlüğü', 'Teftiş Kurulu Müdürlüğü', 'Risk Yönetimi Müdürlüğü', 'Mali İşler Direktörlüğü', 'Operasyon Direktörlüğü', 'Bilgi Teknolojileri Müdürlüğü', 'Muhasebe Servisi', 'Bütçe ve Raporlama Servisi', 'Finans Servisi', 'Operasyon Servisi', 'Tahsisat Servisi', 'Satış Servisi'].map(d => ({ value: d, label: d }))}
                        value={newStaff.birim}
                        onChange={val => setNewStaff({ ...newStaff, birim: val as string })}
                    />
                    <FormInput
                        label="Uzmanlık / Sorumluluk Kapsamı"
                        placeholder="Örn: Kredi Tahsisat Kontrolleri, Gişe İşlemleri..."
                        value={newStaff.uzmanlik}
                        onChange={e => setNewStaff({ ...newStaff, uzmanlik: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Atamayı Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
