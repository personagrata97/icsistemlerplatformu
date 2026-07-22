'use client';

import React, { useState } from 'react';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Calendar, FileText, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function UnitAuditsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const unitAudits = [
        {
            id: 'AUD-2026-04',
            kod: 'DEN-2026-004',
            ad: '2026 Yılı Kredi Operasyonları ve Tahsis Süreçleri Genel Denetimi',
            donem: '2026 Q2',
            baslangic: '2026-05-10',
            bitis: '2026-06-25',
            durum: 'RAPORLANDI',
            mufettis: 'Selim KAYA (Kıdemli Müfettiş)',
            bulguSayisi: 2
        },
        {
            id: 'AUD-2025-11',
            kod: 'DEN-2025-018',
            ad: '2025 Yılı Bilgi Sistemleri Uyum ve KVKK İncelemesi',
            donem: '2025 Q4',
            baslangic: '2025-11-01',
            bitis: '2025-12-15',
            durum: 'KAPANDI',
            mufettis: 'Burak KAYA (Gözetim Sorumlusu)',
            bulguSayisi: 3
        }
    ];

    const filteredAudits = unitAudits.filter(a =>
        a.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.kod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Birim Denetim Geçmişi ve Raporlar</h2>
                    <p className="text-emerald-100 text-xs mt-1">Biriminiz bünyesinde gerçekleştirilen tüm teftiş ve inceleme faaliyetleri.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-700/60 rounded-xl text-xs font-semibold border border-emerald-500/30">
                    {TERMS.birimKisa}
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Denetim adı veya kodu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    {
                        key: 'kod',
                        header: 'Denetim Kodu',
                        width: '140px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
                                {item.kod}
                            </code>
                        )
                    },
                    {
                        key: 'ad',
                        header: 'Denetim Görevi Adı',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900">{item.ad}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Sorumlu: {item.mufettis}</div>
                            </div>
                        )
                    },
                    {
                        key: 'donem',
                        header: 'Dönem / Tarih',
                        width: '180px',
                        render: (item: any) => (
                            <div className="text-xs text-gray-600 font-mono">
                                <div>{item.donem}</div>
                                <div className="text-[10px] text-gray-400">{formatDate(item.baslangic)} - {formatDate(item.bitis)}</div>
                            </div>
                        )
                    },
                    {
                        key: 'bulguSayisi',
                        header: 'Bulgu Sayısı',
                        width: '120px',
                        align: 'center',
                        render: (item: any) => (
                            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded">
                                {item.bulguSayisi} Bulgu
                            </span>
                        )
                    },
                    {
                        key: 'durum',
                        header: 'Durum',
                        width: '140px',
                        render: (item: any) => <StatusBadge value={item.durum} type="status" />
                    },
                    {
                        key: 'actions',
                        header: 'Rapor Özeti',
                        width: '130px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="secondary" leftIcon={<Download size={14} />} onClick={() => showToast(`${item.kod} Rapor Özeti indiriliyor...`, 'info')}>
                                Rapor PDF
                            </Button>
                        )
                    }
                ]}
                data={filteredAudits}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}
