'use client';

import PageHeader from '@/components/audit/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { RefreshCw, Download, Globe, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function SanctionListsOverviewPage() {
    const { showToast } = useToast();

    const lists = [
        { id: 'masak', kod: 'MASAK_6415_7262', ad: 'MASAK & Resmî Gazete Malvarlığı Dondurma Listesi', kaynak: 'Resmî Gazete / MASAK API', kayitSayisi: 1420, sonGuncelleme: '2026-07-22 06:00', durum: 'AKTIF' },
        { id: 'ofac', kod: 'OFAC_SDN', ad: 'ABD Hazine Bakanlığı OFAC SDN Listesi', kaynak: 'US Treasury XML', kayitSayisi: 12450, sonGuncelleme: '2026-07-22 05:30', durum: 'AKTIF' },
        { id: 'un', kod: 'UN_SECURITY_COUNCIL', ad: 'Birleşmiş Milletler Güvenlik Konseyi Konsolide Listesi', kaynak: 'UN Security Council XML', kayitSayisi: 890, sonGuncelleme: '2026-07-21 23:00', durum: 'AKTIF' },
        { id: 'eu', kod: 'EU_CONSOLIDATED', ad: 'Avrupa Birliği Konsolide Yaptırım Listesi', kaynak: 'EU Financial Sanctions XML', kayitSayisi: 3200, sonGuncelleme: '2026-07-22 04:15', durum: 'AKTIF' },
        { id: 'custom', kod: 'INTERNAL_BLACK_LIST', ad: 'Kurum İçi Özel Kara Liste', kaynak: 'Emlak Katılım Teftiş / Uyum', kayitSayisi: 42, sonGuncelleme: '2026-07-20 14:10', durum: 'AKTIF' },
    ];

    const handleSync = (kod: string) => {
        showToast(`${kod} kaynağı ile canlı senkronizasyon başlatıldı...`, 'info');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Yaptırım Listeleri ve Kaynak Entegrasyonları"
                subtitle="MASAK, Resmî Gazete, OFAC, BM ve AB Yaptırım Listeleri Yönetimi"
            />

            <DataTable
                columns={[
                    { key: 'kod', header: 'Liste Kodu', width: '180px', render: (item: any) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.kod}</code> },
                    { key: 'ad', header: 'Yaptırım Listesi Adı', sortable: true },
                    { key: 'kaynak', header: 'Veri Kaynağı', width: '200px' },
                    { key: 'kayitSayisi', header: 'Kayıt Sayısı', width: '120px', align: 'right', render: (item: any) => item.kayitSayisi.toLocaleString('tr-TR') },
                    { key: 'sonGuncelleme', header: 'Son Güncelleme', width: '160px' },
                    {
                        key: 'action',
                        header: 'İşlemler',
                        width: '180px',
                        align: 'center',
                        render: (item: any) => (
                            <div className="flex gap-2 justify-center">
                                <Link href={`/sanction/lists/${item.id}`}>
                                    <Button size="sm" variant="secondary">Detay</Button>
                                </Link>
                                <Button size="sm" variant="primary" leftIcon={<RefreshCw size={14} />} onClick={() => handleSync(item.kod)}>Güncelle</Button>
                            </div>
                        )
                    }
                ]}
                data={lists}
                rowKey="id"
            />
        </div>
    );
}
