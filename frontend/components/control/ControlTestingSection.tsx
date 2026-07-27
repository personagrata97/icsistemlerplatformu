'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import { ShieldCheck, CheckCircle2, AlertOctagon, Sliders, RefreshCw, FileCheck, Layers } from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';

export default function ControlTestingSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const testList = [
        {
            id: 'TST-2026-089',
            kontrolKodu: 'KNT-KRE-001',
            kontrolAdi: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü',
            testTürü: 'İŞLETİM ETKİNLİĞİ',
            orneklemBüyüklügü: 50,
            basariliOrneklem: 49,
            testEden: 'Canan Öztürk (Kıdemli Kontrolör)',
            sonuc: 'ETKİN',
            testTarihi: '2026-07-15'
        },
        {
            id: 'TST-2026-090',
            kontrolKodu: 'KNT-KVKK-008',
            kontrolAdi: 'Müşteri İzin Formu Girişi ve Onay Kontrolü',
            testTürü: 'TASARIM VE İŞLETİM',
            orneklemBüyüklügü: 30,
            basariliOrneklem: 21,
            testEden: 'Zeynep Kaya (İç Kontrolör)',
            sonuc: 'GELİŞİME_AÇIK',
            testTarihi: '2026-07-10'
        },
        {
            id: 'TST-2026-091',
            kontrolKodu: 'KNT-MUH-012',
            kontrolAdi: 'Gün Sonu Genel Muhasebe Mutabakatı',
            testTürü: 'OTOMATİK KONTROL TESTİ',
            orneklemBüyüklügü: 100,
            basariliOrneklem: 98,
            testEden: 'Ahmet Yılmaz (Kıdemli Kontrolör)',
            sonuc: 'ETKİN',
            testTarihi: '2026-07-21'
        }
    ];

    const filteredTests = testList.filter(t => {
        if (searchTerm && !t.kontrolAdi.toLowerCase().includes(searchTerm.toLowerCase()) && !t.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Tamamlanan Kontrol Testi"
                    value={142}
                    icon={FileCheck}
                    color="blue"
                    infoTooltip="2026 yılında İç Kontrolörler tarafından yürütülen toplam etkinlik testi"
                />
                <StatCard
                    title="Etkin Bulunan Kontroller"
                    value="%86"
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Testler sonucunda tasarımı ve işletimi uygun bulunan kontroller"
                />
                <StatCard
                    title="Test Edilen Örneklem"
                    value="2,450 Kayıt"
                    icon={Layers}
                    color="purple"
                    infoTooltip="Kontrol testlerinde incelenen toplam işlem ve belge sayısı"
                />
                <StatCard
                    title="Devam Eden Test Çalışması"
                    value={6}
                    icon={RefreshCw}
                    color="amber"
                    infoTooltip="Saha çalışması devam eden aktif kontrol testleri"
                />
            </div>

            <PageToolbar
                searchPlaceholder="Kontrol adı veya test kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button
                        variant="primary"
                        leftIcon={<ShieldCheck size={18} />}
                        onClick={() => showToast('Yeni Kontrol Etkinlik Testi Başlatıldı', 'info')}
                    >
                        Yeni Test Çalışması Başlat
                    </Button>
                }
            />

            <DataTable
                columns={[
                    {
                        key: 'id',
                        header: 'Test Kodu',
                        width: '130px',
                        render: (item: any) => <CodeBadge code={item.id} />
                    },
                    {
                        key: 'kontrolAdi',
                        header: 'Test Edilen Kontrol',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-slate-900">{item.kontrolAdi}</div>
                                <div className="text-xs text-slate-500 font-medium">Kontrol Kodu: {item.kontrolKodu} • Tür: {item.testTürü}</div>
                            </div>
                        )
                    },
                    {
                        key: 'orneklemBüyüklügü',
                        header: 'Örneklem Başarısı',
                        width: '160px',
                        render: (item: any) => (
                            <div>
                                <div className="text-xs font-bold text-slate-900">{item.basariliOrneklem} / {item.orneklemBüyüklügü} Başarılı</div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(item.basariliOrneklem / item.orneklemBüyüklügü) * 100}%` }}></div>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'testEden',
                        header: 'Test Eden Kontrolör',
                        width: '180px',
                        render: (item: any) => (
                            <span className="text-xs font-semibold text-slate-700">{item.testEden}</span>
                        )
                    },
                    {
                        key: 'sonuc',
                        header: 'Test Sonucu',
                        width: '140px',
                        render: (item: any) => <StatusBadge value={item.sonuc} type="status" />
                    },
                    {
                        key: 'testTarihi',
                        header: 'Test Tarihi',
                        width: '130px',
                        render: (item: any) => (
                            <span className="font-mono text-xs text-slate-500">{formatDate(item.testTarihi)}</span>
                        )
                    }
                ]}
                data={filteredTests}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}
