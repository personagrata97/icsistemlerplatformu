'use client';

import { useState } from 'react';
import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { ShieldAlert, CheckCircle, XCircle, FileText, AlertOctagon } from 'lucide-react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';

export default function SanctionResultsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const matches = [
        { id: '1', musteriAd: 'Zelımkhan YANDARBIEV', tckn: '***8812', liste: 'MASAK 6415 (Terörün Finansmanı)', skor: 100, durum: 'ACIK', tarih: '2026-07-22' },
        { id: '2', musteriAd: 'Viktor BOUT', tckn: '***4421', liste: 'OFAC SDN Listesi', skor: 96, durum: 'INCELEMEDE', tarih: '2026-07-21' },
        { id: '3', musteriAd: 'Mehmet Yılmaz (Yanlış Eşleşme)', tckn: '***1102', liste: 'BM Güvenlik Konseyi', skor: 86, durum: 'YANLIS_ESLESME', tarih: '2026-07-20' },
    ];

    const handleDecide = (status: 'YANLIS_ESLESME' | 'DOGRULANDI') => {
        showToast(`Karar kaydedildi: ${status === 'DOGRULANDI' ? 'Eşleşme Doğrulandı (Malvarlığı Dondurma Süreci Başlatıldı)' : 'Yanlış Eşleşme Olarak Kapatıldı'}`, status === 'DOGRULANDI' ? 'error' : 'success');
        setSelectedMatch(null);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Yaptırım Eşleşme Karar ve İnceleme Havuzu"
                subtitle="MASAK mevzuatı uyarınca karar bağlanmamış tüm yaptırım uyarıları"
            />

            <PageToolbar
                searchPlaceholder="Eşleşme ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    { key: 'musteriAd', header: 'Müşteri Ad Soyad', sortable: true },
                    { key: 'tckn', header: 'TCKN / Kimlik', width: '120px' },
                    { key: 'liste', header: 'Tespit Edilen Yaptırım Listesi' },
                    {
                        key: 'skor',
                        header: 'Eşleşme Skoru',
                        width: '130px',
                        render: (item: any) => (
                            <span className={`font-mono font-bold px-2 py-1 rounded text-xs ${item.skor >= 95 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                %{item.skor}
                            </span>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '140px',
                        render: (item: any) => (
                            <StatusBadge
                                value={item.durum === 'ACIK' ? 'Kritik' : item.durum === 'INCELEMEDE' ? 'İnceleniyor' : 'Kapatıldı'}
                                type={item.durum === 'ACIK' ? 'risk' : 'status'}
                            />
                        )
                    },
                    {
                        key: 'actions',
                        header: 'Karar Ver',
                        width: '140px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="secondary" onClick={() => setSelectedMatch(item)}>İncele & Karar</Button>
                        )
                    }
                ]}
                data={matches}
                rowKey="id"
            />

            {selectedMatch && (
                <Modal
                    isOpen={!!selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                    title={`Yaptırım Eşleşme Karar Ekranı — ${selectedMatch.musteriAd}`}
                    size="md"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" leftIcon={<XCircle size={16} />} onClick={() => handleDecide('YANLIS_ESLESME')}>
                                Yanlış Eşleşme (Kapat)
                            </Button>
                            <Button variant="danger" leftIcon={<AlertOctagon size={16} />} onClick={() => handleDecide('DOGRULANDI')}>
                                Doğrula & Dondurma Süreci Başlat
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-sm text-gray-700">
                        <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                            <strong>Dikkat:</strong> MASAK ve 6415 sayılı Kanun gereği kararsız bırakılan uyarılarda kurum yükümlü tutulur. Karar gerekçesi denetim izine otomatik yazılır.
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><strong>Müşteri:</strong> {selectedMatch.musteriAd}</div>
                            <div><strong>Hedef Liste:</strong> {selectedMatch.liste}</div>
                            <div><strong>Skor:</strong> %{selectedMatch.skor}</div>
                            <div><strong>Tarih:</strong> {selectedMatch.tarih}</div>
                        </div>

                        <div>
                            <label className="form-label mb-1">Karar Gerekçesi (Zorunlu)</label>
                            <textarea className="form-input text-xs" rows={3} placeholder="Eşleşmenin doğrulama veya yanlış eşleşme gerekçesini giriniz..."></textarea>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
