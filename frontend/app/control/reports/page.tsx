import PageHeader from '@/components/ui/PageHeader';
'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import DateDisplay from '@/components/ui/DateDisplay';
import CustomSelect from '@/components/ui/CustomSelect';
import ActionMenu from '@/components/ui/ActionMenu';
import { FileBarChart, CheckCircle2, Download, Plus, Eye, Trash2, Send, FileText, Printer } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { DEPARTMENTS } from '@/lib/organization-constants';

function ControlReportsPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    const [reportsList, setReportsList] = useState([
        { id: 'RPR-2026-Q2', ad: '2026 Q2 Dönemsel İç Kontrol Değerlendirme Raporu', birim: 'İç Kontrol ve Uyum Müdürlüğü', tarih: '2026-07-20', durum: 'ONAYLANDI', yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)', icerik: 'İç kontrol sistemi 2026 ikinci çeyrek genel etkinlik değerlendirmesi. 86 test, 12 eksiklik, %91 kontrol etkinlik oranı.' },
        { id: 'RPR-2026-KRE', ad: 'Kredi Operasyonları Süreç İçi Kontrol Etkinlik Raporu', birim: 'Tahsisat Servisi', tarih: '2026-07-15', durum: 'ONAYLANDI', yazar: 'Canan Öztürk (Kıdemli Kontrolör)', icerik: 'Kredi süreçlerindeki kontrol noktalarının tasarım ve işletim etkinliği değerlendirmesi. 14 test noktası, %95 etkinlik oranı.' },
        { id: 'RPR-2026-KVKK', ad: 'Müşteri Hakları ve KVKK Kontrol Uyum Raporu', birim: 'Satış Servisi', tarih: '2026-07-10', durum: 'TASLAK', yazar: 'Zeynep Kaya (İç Kontrolör)', icerik: 'KVKK uyumlu müşteri veri işleme kontrollerinin değerlendirmesi. 2 eksiklik tespit edildi.' },
        { id: 'RPR-2026-HZ', ad: 'Hazine İşlemleri Kontrol Testi Sonuç Raporu', birim: 'Finans Servisi', tarih: '2026-06-28', durum: 'ONAYLANDI', yazar: 'Emre Aksoy (İç Kontrolör)', icerik: 'Hazine pozisyon limitleri, gün sonu mutabakatları ve FX kontrollerinin testi. 1 yüksek öncelikli eksiklik.' },
    ]);

    const [newReport, setNewReport] = useState({
        id: `RPR-2026-00${reportsList.length + 1}`,
        ad: '',
        birim: 'İç Kontrol ve Uyum Müdürlüğü',
        tarih: '2026-07-27',
        durum: 'TASLAK',
        yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)',
        icerik: ''
    });

    const handleSaveReport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReport.ad.trim()) {
            showToast('Lütfen rapor tanımını giriniz', 'warning');
            return;
        }

        setReportsList([newReport, ...reportsList]);
        setIsAddModalOpen(false);
        showToast(`Yeni İç Kontrol Rapor Taslağı (${newReport.id}) başarıyla oluşturuldu`, 'success');

        setNewReport({
            id: `RPR-2026-00${reportsList.length + 2}`,
            ad: '',
            birim: 'İç Kontrol ve Uyum Müdürlüğü',
            tarih: '2026-07-27',
            durum: 'TASLAK',
            yazar: 'Ahmet Yılmaz (Kıdemli Kontrolör)',
            icerik: ''
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Raporlar" subtitle="Dönemsel iç kontrol faaliyet raporları, kurul sunumları ve analiz belgeleri" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Dönem Raporu" value={reportsList.length} icon={FileBarChart} color="blue" />
                <StatCard title="Onaylanan Raporlar" value={reportsList.filter(r => r.durum === 'ONAYLANDI').length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Taslak Raporlar" value={reportsList.filter(r => r.durum === 'TASLAK').length} icon={FileText} color="amber" />
                <StatCard title="Denetim Komitesine Sunulan" value={2} icon={Send} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Rapor adı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                        Yeni Rapor Oluştur
                    </Button>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Rapor Kodu', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'ad', header: 'Rapor Tanımı', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900">{item.ad}</div>
                            <div className="text-xs text-slate-500 font-medium">Birim: {item.birim} • Hazırlayan: {item.yazar}</div>
                        </div>
                    ) },
                    { key: 'durum', header: 'Durum', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                    { key: 'tarih', header: 'Rapor Tarihi', type: 'date', width: '150px' },
                    { key: 'actions', header: 'İşlemler', width: '120px', render: (item: any) => (
                        <ActionMenu items={[
                            { label: 'Detay Görüntüle', icon: Eye, onClick: () => setSelectedReport(item) },
                            { label: 'PDF İndir', icon: Download, onClick: () => showToast(`${item.ad} PDF olarak indiriliyor`, 'success') },
                            { label: 'Word Oluştur', icon: FileText, onClick: () => showToast(`${item.ad} Word formatında oluşturuluyor`, 'success') },
                            { label: 'Yazdır', icon: Printer, onClick: () => showToast(`${item.ad} yazdırılmak üzere hazırlanıyor`, 'success') },
                            { label: 'Denetim Komitesine Gönder', icon: Send, onClick: () => showToast(`${item.ad} Denetim Komitesine iletildi`, 'success') },
                            { label: 'Sil', icon: Trash2, onClick: () => showToast(`${item.id} silindi`, 'success'), variant: 'danger' as any }
                        ]} />
                    ) }
                ]}
                data={reportsList.filter(r => !searchTerm || r.ad.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase()))}
                rowKey="id"
            />

            {/* Report Detail Modal */}
            {selectedReport && (
                <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title={`Rapor Detayı — ${selectedReport.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedReport.ad}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">Hazırlayan: {selectedReport.yazar}</p>
                                </div>
                                <StatusBadge value={selectedReport.durum} type="status" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Sorumlu Birim</span>
                                <span className="font-bold text-slate-900">{selectedReport.birim}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Rapor Tarihi</span>
                                <DateDisplay value={selectedReport.tarih} className="font-bold text-slate-900" />
                            </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                            <span className="text-slate-700 font-bold block">Rapor Özeti:</span>
                            <p className="text-slate-600 leading-relaxed">{selectedReport.icerik}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedReport(null)}>Kapat</Button>
                            <Button variant="primary" leftIcon={<Download size={14} />} onClick={() => showToast(`${selectedReport.ad} PDF indiriliyor`, 'success')}>PDF İndir</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Report Creation Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Yeni İç Kontrol Dönem Raporu Oluştur" size="lg">
                <form onSubmit={handleSaveReport} className="space-y-4">
                    <FormInput
                        label="Rapor Kodu"
                        value={newReport.id}
                        readOnlyView
                        inputClassName="font-mono"
                    />
                    <FormInput
                        label="Rapor Başlığı / Tanımı"
                        required
                        placeholder="Örn: 2026 Q3 Dönemsel İç Kontrol Değerlendirme Raporu..."
                        value={newReport.ad}
                        onChange={(e) => setNewReport({ ...newReport, ad: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomSelect
                                label="Sorumlu Birim (Resmi Şema)"
                                options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                                value={newReport.birim}
                                onChange={(val) => setNewReport({ ...newReport, birim: val as string })}
                            />
                        </div>
                        <FormInput
                            label="Hazırlayan İç Kontrolör"
                            value={newReport.yazar}
                            onChange={(e) => setNewReport({ ...newReport, yazar: e.target.value })}
                        />
                    </div>
                    <FormTextarea
                        label="Rapor İçerik Özeti"
                        rows={3}
                        placeholder="Rapor kapsamı, test edilen kontroller, tespit edilen eksiklikler..."
                        value={newReport.icerik}
                        onChange={(e) => setNewReport({ ...newReport, icerik: e.target.value })}
                    />
                    <div>
                        <CustomSelect label="Rapor Durumu" options={[
                            { value: 'TASLAK', label: 'TASLAK' },
                            { value: 'ONAYLANDI', label: 'ONAYLANDI' }
                        ]} value={newReport.durum} onChange={(val) => setNewReport({ ...newReport, durum: val as string })} />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Rapor Taslağını Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}


export default function ControlReportsPage() {
    return (
        <RequireRole allowedRoles={['DENETCI', 'KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlReportsPageContent />
        </RequireRole>
    );
}
