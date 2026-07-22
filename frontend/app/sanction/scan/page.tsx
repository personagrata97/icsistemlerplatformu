'use client';

import { useState } from 'react';
import PageToolbar from '@/components/ui/PageToolbar';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { Search, ShieldAlert, CheckCircle, RefreshCw, UserCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';
import { sanctionApi } from '@/lib/sanction-api';

export default function SanctionScanPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [scanType, setScanType] = useState('ANLIK');
    const [scoreFilter, setScoreFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [hasScanned, setHasScanned] = useState(false);

    const handleRunScan = async () => {
        setLoading(true);
        showToast('MASAK, OFAC, BM ve AB listeleri üzerinde canlı yaptırım taraması yürütülüyor...', 'info');
        try {
            let resData;
            if (scanType === 'PORTFOLIO') {
                resData = await sanctionApi.screenPortfolio();
                showToast(`Portföy taraması tamamlandı! ${resData.eslesmeSayisi || 0} eşleşme kaydedildi.`, 'success');
            } else {
                const matches = await sanctionApi.getMatches({ search: searchTerm });
                resData = matches;
                if (matches && matches.length > 0) {
                    showToast(`Tarama tamamlandı! ${matches.length} potansiyel eşleşme bulundu.`, 'warning');
                } else {
                    showToast('Tarama tamamlandı. Herhangi bir yaptırım eşleşmesine rastlanmadı.', 'success');
                }
            }

            const formatted = (Array.isArray(resData) ? resData : resData?.matches || []).map((m: any) => ({
                id: m.id,
                musteriId: m.musteriId || m.musteri?.musteri_id || 'M-1029',
                adSoyad: m.musteri?.ad_soyad || m.musteriAd || 'Kayıtlı Müşteri',
                tckn: m.musteri?.tckn ? `${String(m.musteri.tckn).substring(0, 3)}*****${String(m.musteri.tckn).slice(-2)}` : '***1234',
                skor: m.skor || 90,
                eslesmeTuru: m.eslesmeTuru || 'BULANIK',
                liste: m.entity?.list?.ad || m.liste || 'MASAK / OFAC',
                durum: m.durum || 'ACIK'
            }));

            setResults(formatted);
            setHasScanned(true);
        } catch (e) {
            showToast('Canlı yaptırım taraması yürütülürken hata oluştu', 'error');
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
            <div className="card p-6 bg-white border border-gray-100 shadow-sm space-y-6 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="form-label mb-1">Müşteri Ad Soyad veya TCKN / Vergi No</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="form-input pl-10"
                                placeholder="Örn: Ahmet Yılmaz veya 10928374652"
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
                                { value: 'ANLIK', label: 'Anlık Canlı Müşteri Taraması' },
                                { value: 'PORTFOLIO', label: 'Tüm Portföyü Yeniden Tara (Cron)' },
                                { value: 'PEP', label: 'Siyasi Nüfuzlu Kişi (PEP) Kontrolü' },
                            ]}
                            value={scanType}
                            onChange={(val) => setScanType(val as string)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <Button variant="secondary" onClick={() => { setSearchTerm(''); setResults([]); setHasScanned(false); }}>Temizle</Button>
                    <Button variant="primary" isLoading={loading} leftIcon={<Search size={18} />} onClick={handleRunScan}>
                        Yaptırım Taramasını Başlat
                    </Button>
                </div>
            </div>

            {hasScanned && (
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
                            { key: 'tckn', header: 'TCKN / Kimlik', width: '130px' },
                            { key: 'liste', header: 'Hedef Yaptırım Listesi' },
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
                        searchTerm={searchTerm}
                        onClearFilters={() => setScoreFilter('ALL')}
                        rowKey="id"
                    />
                </div>
            )}
        </div>
    );
}
