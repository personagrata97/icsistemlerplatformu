'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Search, FileText, Eye, Clock, Wallet, MapPin, User, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import RefreshButton from '@/components/ui/RefreshButton';
import Button from '@/components/ui/Button';

import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/audit-utils';
import ActionMenu from '@/components/ui/ActionMenu';

import PageToolbar from '@/components/ui/PageToolbar';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContract, setSelectedContract] = useState<any | null>(null);

    useEffect(() => {
        loadContracts();
    }, [filterStatus]);

    const loadContracts = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getContracts(filterStatus || undefined);
            // Sıralamanın doğru çalışabilmesi için ilişkisel tabloları düzleştiriyoruz
            const flattened = data.map((c: any) => ({
                ...c,
                musteri_ad_soyad: c.musteri?.ad_soyad || '',
                musteri_segment: c.musteri?.segment || '',
                bolge: c.musteri?.bolge || '',
                sube: c.musteri?.sube || '',
            }));
            setContracts(flattened);
        } catch (error) {
            console.error('Sözleşmeler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContracts = contracts.filter(c =>
        (c.musteri_ad_soyad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.sozlesme_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDurumStyle = (durum: string) => {
        if (durum === 'TAKIPTE') return 'text-red-600 bg-red-50 border-red-200';
        if (durum === 'AKTIF') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (durum === 'TAMAMLANDI') return 'text-blue-600 bg-blue-50 border-blue-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getDurumLabel = (durum: string) => {
        if (durum === 'TAKIPTE') return 'Takip / NPL';
        if (durum === 'AKTIF') return 'Aktif Sözleşme';
        if (durum === 'TAMAMLANDI') return 'Tamamlandı';
        if (durum === 'IPTAL') return 'İptal Edildi';
        return durum;
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Sözleşme veya müşteri ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadContracts}
                filters={
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
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'sozlesme_id',
                        header: 'Sözleşme No',
                        width: '120px',
                        align: 'center',
                        sortable: true,
                        render: (contract: any) => (
                            <span className="cell-id font-mono">#{contract.sozlesme_id.slice(-6).toUpperCase()}</span>
                        )
                    },
                    {
                        key: 'musteri_ad_soyad',
                        header: 'Müşteri Bilgileri',
                        sortable: true,
                        render: (contract: any) => (
                            <div className="flex flex-col gap-0.5">
                                <div className="cell-title">{contract.musteri?.ad_soyad}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{contract.musteri?.segment} Segmenti</div>
                            </div>
                        )
                    },
                    {
                        key: 'toplam_tutar',
                        header: 'Toplam Tutar',
                        width: '150px',
                        align: 'right',
                        sortable: true,
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
                        sortable: true,
                        render: (contract: any) => (
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider border border-slate-200">
                                {contract.vade} AY
                            </span>
                        )
                    },
                    {
                        key: 'bolge',
                        header: 'Bölge / Şube',
                        sortable: true,
                        render: (contract: any) => (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100 italic">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700 leading-none">{contract.musteri?.bolge}</div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-1">{contract.musteri?.sube} Şubesi</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '130px',
                        align: 'center',
                        sortable: true,
                        render: (contract: any) => (
                            <StatusBadge type="status" value={getDurumLabel(contract.durum)} />
                        )
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '100px',
                        align: 'center',
                        render: (contract: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu items={[{
                                    label: 'Detay İncele',
                                    icon: Eye,
                                    onClick: () => setSelectedContract(contract)
                                }]} />
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
                onRowClick={(contract) => setSelectedContract(contract)}
            />

            {/* Sözleşme Detay Modalı */}
            <Modal
                isOpen={!!selectedContract}
                onClose={() => setSelectedContract(null)}
                title="Sözleşme Detayı"
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="secondary" onClick={() => setSelectedContract(null)}>
                            Kapat
                        </Button>
                    </div>
                }
            >
                {selectedContract && (
                    <div className="space-y-5">
                        {/* Durum Başlığı */}
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${getDurumStyle(selectedContract.durum)}`}>
                            {selectedContract.durum === 'TAKIPTE'
                                ? <AlertCircle className="w-5 h-5 shrink-0" />
                                : <CheckCircle className="w-5 h-5 shrink-0" />
                            }
                            <div>
                                <div className="text-sm font-bold">{getDurumLabel(selectedContract.durum)}</div>
                                <div className="text-xs font-medium opacity-75">
                                    No: #{selectedContract.sozlesme_id?.slice(-8).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Müşteri Bilgileri */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <User size={13} /> Müşteri Bilgileri
                            </h5>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Ad Soyad</div>
                                    <div className="font-bold text-gray-800">{selectedContract.musteri?.ad_soyad || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Segment</div>
                                    <div className="font-bold text-gray-800">{selectedContract.musteri?.segment || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Bölge</div>
                                    <div className="font-bold text-gray-800">{selectedContract.musteri?.bolge || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Şube</div>
                                    <div className="font-bold text-gray-800">{selectedContract.musteri?.sube || '—'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Finansal Bilgiler */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Wallet size={13} /> Finansal Detaylar
                            </h5>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Toplam Tutar</div>
                                    <div className="font-black text-gray-900 text-base">
                                        ₺{Number(selectedContract.toplam_tutar || 0).toLocaleString('tr-TR')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Vade</div>
                                    <div className="font-bold text-gray-800">{selectedContract.vade || '—'} Ay</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Gecikme Günü (DPD)</div>
                                    <div className={`font-bold ${(selectedContract.gecikme_gunu || 0) > 90 ? 'text-red-600' : (selectedContract.gecikme_gunu || 0) > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {selectedContract.gecikme_gunu || 0} Gün
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-xs mb-0.5">Kalan Bakiye</div>
                                    <div className="font-bold text-gray-800">
                                        ₺{Number(selectedContract.kalan_bakiye || 0).toLocaleString('tr-TR')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kayıt Tarihi */}
                        {selectedContract.created_at && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar size={13} />
                                Kayıt tarihi: {formatDate(selectedContract.created_at)}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
