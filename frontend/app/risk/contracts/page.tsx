'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Search, Filter, FileText, ChevronRight, Eye, RefreshCw, Clock, Wallet, MapPin } from 'lucide-react';
import RefreshButton from '@/components/ui/RefreshButton';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';

import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatDate } from '@/lib/audit-utils';
import ActionMenu from '@/components/ui/ActionMenu';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadContracts();
    }, [filterStatus]);

    const loadContracts = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getContracts(filterStatus || undefined);
            setContracts(data);
        } catch (error) {
            console.error('Sözleşmeler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContracts = contracts.filter(c =>
        c.musteri.ad_soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sozlesme_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto py-2 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sözleşme Analizi</h1>
                    <p className="text-slate-500 font-medium">Detaylı sözleşme portföyü ve risk incelemesi</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Sözleşme veya müşteri ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-sm"
                        />
                    </div>
                    
                    <div className="w-[180px]">
                        <CustomSelect
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val as string)}
                            variant="secondary"
                            options={[
                                { value: '', label: 'Tüm Durumlar' },
                                { value: 'AKTIF', label: 'Aktif' },
                                { value: 'TAKIPTE', label: 'Takipte' },
                                { value: 'TAMAMLANDI', label: 'Tamamlandı' },
                                { value: 'IPTAL', label: 'İptal' }
                            ]}
                        />
                    </div>

                    <RefreshButton onClick={loadContracts} />
                </div>
            </div>

            <DataTable
                columns={[
                    {
                        key: 'sozlesme_id',
                        header: 'Sözleşme No',
                        width: '120px',
                        align: 'center',
                        render: (contract: any) => (
                            <span className="cell-id font-mono">#{contract.sozlesme_id.slice(-6).toUpperCase()}</span>
                        )
                    },
                    {
                        key: 'musteri',
                        header: 'Müşteri Bilgileri',
                        render: (contract: any) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="cell-title">{contract.musteri.ad_soyad}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{contract.musteri.segment} Segmenti</div>
                            </div>
                        )
                    },
                    {
                        key: 'toplam_tutar',
                        header: 'Toplam Tutar',
                        width: '150px',
                        align: 'right',
                        render: (contract: any) => (
                            <div className="flex flex-col items-end">
                                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                                    <Wallet size={14} className="text-slate-400" />
                                    ₺{Number(contract.toplam_tutar).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tutar</div>
                            </div>
                        )
                    },
                    {
                        key: 'vade',
                        header: 'Vade',
                        width: '100px',
                        align: 'center',
                        render: (contract: any) => (
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider border border-slate-200">
                                {contract.vade} AY
                            </span>
                        )
                    },
                    {
                        key: 'bolge',
                        header: 'Bölge / Şube',
                        render: (contract: any) => (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 italic">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700 leading-none">{contract.musteri.bolge}</div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-1">{contract.musteri.sube} Şubesi</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '130px',
                        align: 'center',
                        render: (contract: any) => {
                            const val = contract.durum === 'TAKIPTE' ? 'Kritik' : 
                                       contract.durum === 'AKTIF' || contract.durum === 'TAMAMLANDI' ? 'Yeni' : 'Düşük';
                            return <StatusBadge type="status" value={val} />;
                        }
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '100px',
                        align: 'center',
                        render: (contract: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu items={[{ label: 'İncele', icon: Eye, onClick: () => {} }]} />
                            </div>
                        )
                    }
                ]}
                data={filteredContracts}
                loading={loading}
                rowKey="sozlesme_id"
                paginated={true}
                itemsPerPage={10}
                itemUnit="sözleşme"
                emptyIcon={FileText}
                emptyTitle="Sözleşme Bulunamadı"
                emptyDescription="Kriterlere uygun veya sistemde kayıtlı bir sözleşme analizi bulunmamaktadır."
                className="shadow-sm border border-gray-100"
            />
        </div>
    );
}

