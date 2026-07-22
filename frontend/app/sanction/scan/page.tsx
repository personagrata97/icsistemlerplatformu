'use client';

import { useState } from 'react';
import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { Search, ShieldAlert, CheckCircle, RefreshCw, UserCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default function SanctionScanPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [scanType, setScanType] = useState('ANLIK');
    const [scoreFilter, setScoreFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const handleRunScan = async () => {
        setLoading(true);
        showToast('MASAK, OFAC, BM ve AB listeleri üzerinden tarama yürütülüyor...', 'info');
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setResults([
                { id: '1', musteriId: 'M-1029', adSoyad: 'Mehmet Yılmaz', tckn: '***1234', skor: 98, eslesmeTuru: 'TAM İSİM', liste: 'MASAK 6415', durum: 'ACIK' },
                { id: '2', musteriId: 'M-1044', adSoyad: 'Ali Demir', tckn: '***5678', skor: 88, eslesmeTuru: 'BULANIK', liste: 'OFAC SDN', durum: 'INCELEMEDE' },
            ]);
            showToast('Tarama tamamlandı! 2 potansiyel eşleşme bulundu.', 'warning');
        } catch (e) {
            showToast('Tarama sırasında hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(r => {
        if (scoreFilter === 'HIGH' && r.skor < 95) return false;
        if (scoreFilter === 'MEDIUM' && (r.skor < 85 || r.skor >= 95)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Müşteri & İşlem Yaptırım Taraması"
                subtitle="MASAK, Resmî Gazete 6415/7262, OFAC ve BM Listeleri Canlı Sorgulaması"
            />

            <div className="card p-6 bg-white border border-gray-200 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="form-label mb-1">Müşteri Ad Soyad veya TCKN / Vergi No</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="form-input pl-10"
                                placeholder="Örn: Ahmet Yılmaz veya 12345678901"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="form-label mb-1">Tarama Modu</label>
                        <CustomSelect
                            options={[
                                { value: 'ANLIK', label: 'Anlık Manuel Sorgulama' },
                                { value: 'PORTFOLIO', label: 'Tüm Portföyü Yeniden Tara' },
                                { value: 'PEP', label: 'Siyasi Nüfuzlu Kişi (PEP) Kontrolü' },
                            ]}
                            value={scanType}
                            onChange={(val) => setScanType(val as string)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <Button variant="secondary" onClick={() => setSearchTerm('')}>Temizle</Button>
                    <Button variant="primary" isLoading={loading} leftIcon={<Search size={18} />} onClick={handleRunScan}>
                        Yaptırım Taramasını Başlat
                    </Button>
                </div>
            </div>

            {results.length > 0 && (
                <div className="space-y-4">
                    <PageToolbar
                        searchPlaceholder="Sonuçlarda filtrele..."
                        filters={
                            <FilterDropdown
                                label="Filtrele"
                                activeCount={scoreFilter !== 'ALL' ? 1 : 0}
                                onClear={() => setScoreFilter('ALL')}
                            >
                                <div>
                                    <label className="form-label mb-1">Skor Eşiği</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'ALL', label: 'Tüm Eşleşmeler (%85+)' },
                                            { value: 'HIGH', label: 'Kritik Eşleşmeler (%95+)' },
                                            { value: 'MEDIUM', label: 'İnceleme Adayları (%85-%94)' },
                                        ]}
                                        value={scoreFilter}
                                        onChange={(val) => setScoreFilter(val as string)}
                                    />
                                </div>
                            </FilterDropdown>
                        }
                    />

                    <DataTable
                        columns={[
                            { key: 'musteriId', header: 'Müşteri No', width: '120px' },
                            { key: 'adSoyad', header: 'Müşteri Ad Soyad', sortable: true },
                            { key: 'tckn', header: 'TCKN / Kimlik', width: '120px' },
                            { key: 'liste', header: 'Hedef Yaptırım Listesi', width: '160px' },
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
                                key: 'action',
                                header: 'İşlem',
                                width: '160px',
                                align: 'center',
                                render: (item: any) => (
                                    <Link href={`/audit/ethics/submit?target=${encodeURIComponent(item.adSoyad)}&source=SANCTION_HIT`}>
                                        <Button size="sm" variant="danger" className="!text-xs">İnceleme Başlat</Button>
                                    </Link>
                                )
                            }
                        ]}
                        data={filteredResults}
                        rowKey="id"
                    />
                </div>
            )}
        </div>
    );
}
