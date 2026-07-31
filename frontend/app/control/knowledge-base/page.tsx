'use client';
import RequireRole from '@/components/auth/RequireRole';
import PageHeader from '@/components/ui/PageHeader';
import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import TableActions from '@/components/ui/TableActions';
import { BookOpen, FileText, Download, ShieldCheck, CheckCircle2, Plus, Eye, Trash2, Scale, ClipboardList } from 'lucide-react';
import { useToast } from '@/components/Toast';

type DocCategory = 'IC_MERKEZ' | 'MEVZUAT' | 'SABLONLAR' | 'EGITIM';

const TAB_LABELS: Record<DocCategory, string> = {
    IC_MERKEZ: 'İç Kontrol ve Uyum',
    MEVZUAT: 'BDDK & Mevzuat',
    SABLONLAR: 'Şablonlar & Formlar',
    EGITIM: 'Eğitim Materyalleri'
};

function ControlKnowledgeBasePageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<string>('IC_MERKEZ');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);

    const allDocs = [
        // İç Kontrol ve Uyum
        { id: 'DOK-IK-001', ad: 'İç Kontrol Yıllık Faaliyet Planı 2026', kategori: 'IC_MERKEZ', tur: 'PDF Doküman', versiyon: 'v3.1', tarih: '2026-07-01', boyut: '4.2 MB', durum: 'YÜRÜRLÜKTE', aciklama: 'Yıllık kontrol testi planı, KÖD takvimi ve kaynak tahsis planı' },
        { id: 'DOK-IK-002', ad: 'Kontrol Testi Uygulama Prosedürü', kategori: 'IC_MERKEZ', tur: 'PDF Prosedür', versiyon: 'v2.0', tarih: '2026-06-15', boyut: '2.8 MB', durum: 'YÜRÜRLÜKTE', aciklama: 'Tasarım ve işletim etkinliği testi metodolojisi, örneklem belirleme ve raporlama standartları' },
        { id: 'DOK-IK-003', ad: 'Eksiklik Yönetimi ve Aksiyon Takip Rehberi', kategori: 'IC_MERKEZ', tur: 'PDF Rehber', versiyon: 'v1.5', tarih: '2026-05-20', boyut: '1.9 MB', durum: 'YÜRÜRLÜKTE', aciklama: 'Eksiklik sınıflandırma, aksiyon planı belirleme ve kanıt doğrulama süreçleri' },
        // BDDK & Mevzuat
        { id: 'DOK-IK-010', ad: 'BDDK İç Kontrol ve Risk Yönetimi Standartları Rehberi', kategori: 'MEVZUAT', tur: 'PDF Rehber', versiyon: 'v2.4', tarih: '2026-06-01', boyut: '3.4 MB', durum: 'YÜRÜRLÜKTE', aciklama: 'BDDK düzenlemeleri kapsamında iç kontrol sistemi gereksinimleri ve uygulama standartları' },
        { id: 'DOK-IK-011', ad: 'COSO İç Kontrol Bütünleşik Çerçeve Uygulama Kılavuzu', kategori: 'MEVZUAT', tur: 'Metodoloji Dokümanı', versiyon: 'v1.8', tarih: '2026-05-15', boyut: '5.1 MB', durum: 'YÜRÜRLÜKTE', aciklama: 'COSO 2013 çerçevesinin 5 bileşeni, 17 ilkesi ve uygulama rehberi' },
        { id: 'DOK-IK-012', ad: '5411 Sayılı Bankacılık Kanunu — İç Kontrol Maddeleri', kategori: 'MEVZUAT', tur: 'Kanun Metni', versiyon: 'v1.0', tarih: '2026-01-01', boyut: '0.8 MB', durum: 'YÜRÜRLÜKTE', aciklama: 'Bankacılık Kanunu iç kontrol, iç denetim ve risk yönetimine ilişkin maddeler' },
        // Şablonlar & Formlar
        { id: 'DOK-IK-020', ad: 'Birim Kontrol Öz Değerlendirme (KÖD) Çalışma Şablonu', kategori: 'SABLONLAR', tur: 'Excel Matris', versiyon: 'v3.0', tarih: '2026-07-10', boyut: '1.2 MB', durum: 'GÜNCEL', aciklama: 'KÖD sürecinde birim kontrol sorumlularının doldurması gereken standart matris' },
        { id: 'DOK-IK-021', ad: 'Kontrol Noktası Tanımlama Formu', kategori: 'SABLONLAR', tur: 'Word Form', versiyon: 'v2.2', tarih: '2026-06-20', boyut: '0.5 MB', durum: 'GÜNCEL', aciklama: 'Yeni kontrol noktası tanımlarken doldurulması gereken standart form' },
        { id: 'DOK-IK-022', ad: 'Eksiklik Bildirim ve Aksiyon Planı Formu', kategori: 'SABLONLAR', tur: 'Word Form', versiyon: 'v1.4', tarih: '2026-05-01', boyut: '0.4 MB', durum: 'GÜNCEL', aciklama: 'Tespit edilen eksikliklerin raporlanması ve düzeltici aksiyon planlarının hazırlanması' },
        // Eğitim Materyalleri
        { id: 'DOK-IK-030', ad: 'COSO İç Kontrol Çerçevesi Eğitim Sunumu', kategori: 'EGITIM', tur: 'PowerPoint', versiyon: 'v2.0', tarih: '2026-06-10', boyut: '8.5 MB', durum: 'GÜNCEL', aciklama: 'COSO eğitim programı için kullanılan detaylı sunum materyali' },
        { id: 'DOK-IK-031', ad: 'BKS Rol ve Sorumluluklar El Kitabı', kategori: 'EGITIM', tur: 'PDF Kitapçık', versiyon: 'v1.3', tarih: '2026-07-05', boyut: '2.1 MB', durum: 'GÜNCEL', aciklama: 'Birim Kontrol Sorumlularının görev tanımları, yetkileri ve sorumlulukları' },
    ];

    const filteredDocs = allDocs.filter(d => {
        if (d.kategori !== activeTab) return false;
        if (searchTerm && !d.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const [newDoc, setNewDoc] = useState({
        id: `DOK-IK-0${allDocs.length + 1}`,
        ad: '',
        kategori: activeTab,
        tur: 'PDF Rehber',
        versiyon: 'v1.0',
        tarih: '2026-07-27',
        boyut: '2.1 MB',
        durum: 'YÜRÜRLÜKTE',
        aciklama: ''
    });

    const handleSaveDoc = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.ad.trim()) {
            showToast('Lütfen doküman tanımını giriniz', 'warning');
            return;
        }
        setIsAddModalOpen(false);
        showToast(`Yeni doküman (${newDoc.id}) — ${TAB_LABELS[activeTab as DocCategory]} kategorisine başarıyla yüklendi`, 'success');
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Bilgi Bankası & Rehberler" subtitle="İç kontrol metodolojisi, mevzuat rehberleri ve çalışma kağıdı şablonları" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Kayıtlı Doküman" value={allDocs.length} icon={BookOpen} color="blue" />
                <StatCard title="Yürürlükteki Rehberler" value={allDocs.filter(d => d.durum === 'YÜRÜRLÜKTE').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Şablon & Form" value={allDocs.filter(d => d.kategori === 'SABLONLAR').length} icon={FileText} color="purple" />
                <StatCard title="Son 30 Gün İndirme" value="184 Kez" icon={Download} color="amber" />
            </div>

            <SegmentedTabs
                tabs={[
                    { id: 'IC_MERKEZ', label: 'İç Kontrol ve Uyum', icon: ShieldCheck },
                    { id: 'MEVZUAT', label: 'BDDK & Mevzuat', icon: Scale },
                    { id: 'SABLONLAR', label: 'Şablonlar & Formlar', icon: ClipboardList },
                    { id: 'EGITIM', label: 'Eğitim Materyalleri', icon: BookOpen },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id)}
            />

            <PageToolbar
                searchPlaceholder="Doküman adı, kodu veya kategorisi ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                        Yeni Doküman Yükle
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Doküman Kodu', width: '140px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Doküman Tanımı & Tür', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Tür: {item.tur} ({item.boyut})</div>
                        </div>
                    ) },
                    { key: 'versiyon', header: 'Versiyon', width: '100px', render: (item: any) => <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{item.versiyon}</span> },
                    { key: 'durum', header: 'Durum', width: '130px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Yayın Tarihi', type: 'date', width: '150px' },
                    { key: 'actions', header: 'İşlemler', width: '120px', render: (item: any) => (
                        <TableActions items={[
                            { label: 'Detay Görüntüle', icon: <Eye size={14} />, onClick: () => setSelectedDoc(item) },
                            { label: 'İndir (PDF)', icon: <Download size={14} />, onClick: () => showToast(`${item.ad} indiriliyor`, 'success') },
                            { label: 'Sil', icon: <Trash2 size={14} />, onClick: () => showToast(`${item.id} silindi`, 'success'), variant: 'danger' as any }
                        ]} />
                    ) }
                ]}
                data={filteredDocs}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Document Upload Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`${TAB_LABELS[activeTab as DocCategory]} — Yeni Doküman Yükle`} size="lg">
                <form onSubmit={handleSaveDoc} className="space-y-4">
                    <FormInput
                        label="Doküman Kodu"
                        value={newDoc.id}
                        readOnlyView
                        inputClassName="font-mono"
                    />
                    <FormInput
                        label="Doküman Tanımı"
                        required
                        placeholder="Örn: BDDK İç Kontrol Standartları Rehberi..."
                        value={newDoc.ad}
                        onChange={(e) => setNewDoc({ ...newDoc, ad: e.target.value })}
                    />
                    <FormTextarea
                        label="Açıklama"
                        rows={3}
                        placeholder="Doküman hakkında kısa açıklama..."
                        value={newDoc.aciklama}
                        onChange={(e) => setNewDoc({ ...newDoc, aciklama: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect label="Doküman Türü" options={[
                                { value: 'PDF Rehber', label: 'PDF Rehber' },
                                { value: 'PDF Prosedür', label: 'PDF Prosedür' },
                                { value: 'Excel Matris', label: 'Excel Matris' },
                                { value: 'Word Form', label: 'Word Form' },
                                { value: 'PowerPoint', label: 'PowerPoint' }
                            ]} value={newDoc.tur} onChange={(val) => setNewDoc({ ...newDoc, tur: val as string })} />
                        </div>
                        <FormInput
                            label="Versiyon"
                            value={newDoc.versiyon}
                            onChange={(e) => setNewDoc({ ...newDoc, versiyon: e.target.value })}
                            inputClassName="font-mono"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Dokümanı Yükle & Yayınla</Button>
                    </div>
                </form>
            </Modal>

            {/* Document Detail Modal */}
            {selectedDoc && (
                <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={`Doküman Detayı — ${selectedDoc.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <h4 className="font-bold text-sm text-slate-900">{selectedDoc.ad}</h4>
                            <p className="text-slate-500 font-medium">{selectedDoc.aciklama}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Kategori</span>
                                <span className="font-bold text-slate-900">{TAB_LABELS[selectedDoc.kategori as DocCategory]}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Tür & Boyut</span>
                                <span className="font-bold text-slate-900">{selectedDoc.tur} ({selectedDoc.boyut})</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Versiyon</span>
                                <span className="font-mono font-bold text-slate-900">{selectedDoc.versiyon}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedDoc(null)}>Kapat</Button>
                            <Button variant="primary" leftIcon={<Download size={14} />} onClick={() => showToast(`${selectedDoc.ad} indiriliyor`, 'success')}>İndir</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}


export default function ControlKnowledgeBasePage() {
    return (
        <RequireRole allowedRoles={['DENETCI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlKnowledgeBasePageContent />
        </RequireRole>
    );
}
