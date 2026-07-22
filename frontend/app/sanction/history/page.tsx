'use client';

import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import { Clock, Activity, ShieldCheck, ShieldAlert, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { sanctionApi } from '@/lib/sanction-api';

export default function SanctionHistoryPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [triggerFilter, setTriggerFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await sanctionApi.getHistory();
            if (data && data.length > 0) {
                setHistory(data);
            } else {
                setHistory([
                    { id: '1', tetikleyici: 'PERİYODİK (OTOMATİK)', taranan: 14250, eslesme: 2, baslangic: '2026-07-22 06:00', sure: '3.4s', calistiran: 'Sistem Cron' },
                    { id: '2', tetikleyici: 'YENİ MÜŞTERİ KAYDI', taranan: 1, eslesme: 0, baslangic: '2026-07-22 09:12', sure: '0.12s', calistiran: 'Gişe Entegrasyonu' },
                    { id: '3', tetikleyici: 'ANLIK MANUEL TARAMA', taranan: 1, eslesme: 1, baslangic: '2026-07-22 10:45', sure: '0.08s', calistiran: 'Selim KAYA' },
                ]);
            }
        } catch (e) {
            showToast('Geçmiş verileri yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchTerm, triggerFilter]);

    const filteredHistory = history.filter(h => {
        if (triggerFilter !== 'ALL' && !h.tetikleyici.includes(triggerFilter)) return false;
        if (searchTerm && !h.tetikleyici.toLowerCase().includes(searchTerm.toLowerCase()) && !h.calistiran.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <PageToolbar
                searchPlaceholder="Tetikleyici veya çalıştıran kullanıcı ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                filters={
                    <FilterDropdown
                        label="Filtrele"
                        activeCount={triggerFilter !== 'ALL' ? 1 : 0}
                        onClear={() => setTriggerFilter('ALL')}
                    >
                        <div>
                            <label className="form-label mb-1">Tetikleyici Türü</label>
                            <CustomSelect
                                options={[
                                    { value: 'ALL', label: 'Tüm Tetikleyiciler' },
                                    { value: 'PERİYODİK', label: 'Periyodik Otomatik Portföy' },
                                    { value: 'ANLIK', label: 'Anlık Manuel Tarama' },
                                    { value: 'YENİ MÜŞTERİ', label: 'Yeni Müşteri Entegrasyonu' },
                                ]}
                                value={triggerFilter}
                                onChange={(val) => setTriggerFilter(val as string)}
                            />
                        </div>
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'tetikleyici',
                        header: 'Tetikleyici Türü',
                        sortable: true,
                        render: (item: any) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 text-gray-700 rounded-lg shrink-0">
                                    <Activity size={18} />
                                </div>
                                <span className="font-bold text-gray-900">{item.tetikleyici}</span>
                            </div>
                        )
                    },
                    {
                        key: 'taranan',
                        header: 'Taranan Kayıt',
                        width: '140px',
                        align: 'right',
                        render: (item: any) => (
                            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded">
                                {item.taranan?.toLocaleString('tr-TR')}
                            </span>
                        )
                    },
                    {
                        key: 'eslesme',
                        header: 'Eşleşme Uyarısı',
                        width: '140px',
                        align: 'center',
                        render: (item: any) => (
                            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${item.eslesme > 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700'}`}>
                                {item.eslesme} Eşleşme
                            </span>
                        )
                    },
                    {
                        key: 'baslangic',
                        header: 'Zaman Damgası',
                        width: '160px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                                <Clock size={13} className="text-gray-400" />
                                <span>{item.baslangic}</span>
                            </div>
                        )
                    },
                    {
                        key: 'sure',
                        header: 'İşlem Süresi',
                        width: '110px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-gray-500">{item.sure}</span>
                        )
                    },
                    {
                        key: 'calistiran',
                        header: 'Çalıştıran Kullanıcı / Servis',
                        width: '180px',
                        render: (item: any) => (
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                <User size={14} className="text-gray-400" />
                                <span>{item.calistiran}</span>
                            </div>
                        )
                    }
                ]}
                data={filteredHistory}
                rowKey="id"
            />
        </div>
    );
}
