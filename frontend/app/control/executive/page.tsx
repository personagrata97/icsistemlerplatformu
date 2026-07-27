'use client';

import React, { useState } from 'react';
import PageToolbar from '@/components/ui/PageToolbar';
import CustomSelect from '@/components/ui/CustomSelect';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import DashboardWidget from '@/components/ui/DashboardWidget';
import DashboardListItem from '@/components/ui/DashboardListItem';
import { Target, Shield, Users, BarChart3, CheckCircle2, AlertTriangle, Clock, Activity, TrendingUp, Layers, ShieldCheck, AlertOctagon, FileBarChart, Award } from 'lucide-react';
import { formatDateTime } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';

export default function ControlExecutiveDashboard() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'team'>('overview');
    const [selectedYear, setSelectedYear] = useState('Tümü');
    const [lastUpdate, setLastUpdate] = useState<string>(formatDateTime(new Date()));

    const availableYears = [
        { value: 'Tümü', label: 'Tüm Yıllar' },
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' }
    ];

    const handleRefresh = () => {
        setLastUpdate(formatDateTime(new Date()));
        showToast('Yönetici paneli verileri güncellendi', 'success');
    };

    return (
        <div className="space-y-6">
            <PageToolbar
                noSearch={true}
                onRefresh={handleRefresh}
                leftActions={
                    <div className="flex items-center gap-4">
                        <SegmentedTabs
                            tabs={[
                                { id: 'overview', label: 'Genel Bakış', icon: Target },
                                { id: 'team', label: 'Kadro & Kaynak', icon: Users },
                                { id: 'quality', label: 'Kalite Metrikleri', icon: Shield }
                            ]}
                            activeTab={activeTab}
                            onChange={(id) => setActiveTab(id as any)}
                        />
                        {lastUpdate && <p className="text-sm text-gray-500 font-medium hidden md:block border-l pl-4 border-gray-200">Son güncelleme: {lastUpdate}</p>}
                    </div>
                }
                filters={
                    <div className="w-[160px]">
                        <CustomSelect
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(val as string)}
                            options={availableYears}
                        />
                    </div>
                }
            />

            {/* ===== GENEL BAKIŞ SEKMESİ ===== */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Aktif Kontrol Noktası" value={142} icon={Layers} color="blue" />
                        <StatCard title="Tamamlanan Test" value={86} icon={ShieldCheck} color="emerald" />
                        <StatCard title="Açık Eksiklik" value={12} icon={AlertOctagon} color="rose" />
                        <StatCard title="Kontrol Etkinlik Oranı" value="%91.2" icon={TrendingUp} color="purple" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DashboardWidget title="Kontrol Etkinlik Dağılımı" icon={BarChart3}>
                            <div className="space-y-3">
                                {[
                                    { label: 'Etkin Kontroller', count: 118, total: 142, color: 'bg-emerald-500' },
                                    { label: 'Gelişime Açık', count: 16, total: 142, color: 'bg-amber-500' },
                                    { label: 'Etkisiz / Yetersiz', count: 8, total: 142, color: 'bg-rose-500' },
                                ].map((item) => (
                                    <div key={item.label} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-semibold text-slate-700">{item.label}</span>
                                            <span className="font-bold text-slate-900">{item.count} / {item.total}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardWidget>

                        <DashboardWidget title="Eksiklik Öncelik Dağılımı" icon={AlertTriangle}>
                            <div className="space-y-3">
                                {[
                                    { label: 'Kritik', count: 2, color: 'bg-rose-500', textColor: 'text-rose-700' },
                                    { label: 'Yüksek', count: 4, color: 'bg-orange-500', textColor: 'text-orange-700' },
                                    { label: 'Orta', count: 4, color: 'bg-amber-500', textColor: 'text-amber-700' },
                                    { label: 'Düşük', count: 2, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                            <span className="text-xs font-semibold text-slate-700">{item.label} Öncelik</span>
                                        </div>
                                        <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </DashboardWidget>
                    </div>

                    <DashboardWidget title="Son Kontrol Faaliyetleri" icon={Activity}>
                        <div className="space-y-2">
                            <DashboardListItem
                                title="KNT-KRE-001 — Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü"
                                subtitle="Test Sonucu: ETKİN • Test Eden: Canan Öztürk"
                                rightContent={<StatusBadge value="ETKİN" type="status" />}
                            />
                            <DashboardListItem
                                title="KÖD-2026-Q2-HR — İnsan Kaynakları Öz Değerlendirmesi"
                                subtitle="Birim: İK Müdürlüğü • BKS: Mehmet Demir"
                                rightContent={<StatusBadge value="İNCELEMEDE" type="status" />}
                            />
                            <DashboardListItem
                                title="EKS-2026-001 — Müşteri Kimlik Doğrulama Eksikliği"
                                subtitle="Termin: 2026-08-15 • Sorumlu: Operasyonlar Müdürlüğü"
                                rightContent={<StatusBadge value="AKSIYONDA" type="status" />}
                            />
                        </div>
                    </DashboardWidget>
                </div>
            )}

            {/* ===== KADRO & KAYNAK SEKMESİ ===== */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="İç Kontrolör Sayısı" value={8} icon={Users} color="blue" />
                        <StatCard title="Birim Kontrol Sorumlusu" value={24} icon={Shield} color="purple" />
                        <StatCard title="Ortalama Test/Kişi" value="10.8" icon={BarChart3} color="emerald" />
                        <StatCard title="Eğitim Tamamlama" value="%87" icon={Award} color="amber" />
                    </div>

                    <DataTable
                        columns={[
                            { key: 'ad', header: 'Kontrolör / BKS', sortable: true, render: (item: any) => (
                                <div>
                                    <div className="font-bold text-slate-900 text-xs">{item.ad}</div>
                                    <div className="text-[11px] text-slate-500">{item.unvan}</div>
                                </div>
                            ) },
                            { key: 'birim', header: 'Birim', width: '200px', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.birim}</span> },
                            { key: 'testSayisi', header: 'Test Sayısı', width: '120px', sortable: true, render: (item: any) => <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{item.testSayisi}</span> },
                            { key: 'acikEksiklik', header: 'Açık Eksiklik', width: '130px', render: (item: any) => (
                                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${item.acikEksiklik > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {item.acikEksiklik}
                                </span>
                            ) },
                            { key: 'egitimSaat', header: 'Eğitim (Saat)', width: '130px', render: (item: any) => <span className="font-mono text-xs font-bold text-slate-800 bg-blue-100 px-2 py-0.5 rounded">{item.egitimSaat}h</span> },
                            { key: 'durum', header: 'Durum', width: '120px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> }
                        ]}
                        data={[
                            { ad: 'Ahmet Yılmaz', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü', testSayisi: 14, acikEksiklik: 2, egitimSaat: 32, durum: 'AKTİF' },
                            { ad: 'Canan Öztürk', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü', testSayisi: 12, acikEksiklik: 1, egitimSaat: 28, durum: 'AKTİF' },
                            { ad: 'Zeynep Kaya', unvan: 'İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü', testSayisi: 10, acikEksiklik: 3, egitimSaat: 24, durum: 'AKTİF' },
                            { ad: 'Emre Aksoy', unvan: 'İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü', testSayisi: 8, acikEksiklik: 0, egitimSaat: 20, durum: 'AKTİF' },
                            { ad: 'Mehmet Demir', unvan: 'BKS — Tahsisat Servisi', birim: 'Tahsisat Servisi', testSayisi: 4, acikEksiklik: 1, egitimSaat: 16, durum: 'AKTİF' },
                            { ad: 'Ali Koç', unvan: 'BKS — Finans Servisi', birim: 'Finans Servisi', testSayisi: 5, acikEksiklik: 2, egitimSaat: 12, durum: 'AKTİF' },
                            { ad: 'Fatma Yıldız', unvan: 'BKS — Operasyon Servisi', birim: 'Operasyon Servisi', testSayisi: 6, acikEksiklik: 0, egitimSaat: 18, durum: 'AKTİF' },
                            { ad: 'Selin Kara', unvan: 'BKS — Satış Servisi', birim: 'Satış Servisi', testSayisi: 3, acikEksiklik: 3, egitimSaat: 8, durum: 'AKTİF' },
                        ]}
                        rowKey="ad"
                    />
                </div>
            )}

            {/* ===== KALİTE METRİKLERİ SEKMESİ ===== */}
            {activeTab === 'quality' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Genel Kontrol Etkinliği" value="%91.2" icon={TrendingUp} color="emerald" />
                        <StatCard title="Ort. Eksiklik Kapanma Süresi" value="23 Gün" icon={Clock} color="blue" />
                        <StatCard title="BKS Uyum Oranı" value="%78" icon={CheckCircle2} color="purple" />
                        <StatCard title="Test Tamamlanma Oranı" value="%86" icon={ShieldCheck} color="amber" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DashboardWidget title="Süreç Bazlı Kontrol Etkinliği" icon={BarChart3}>
                            <div className="space-y-3">
                                {[
                                    { label: 'Tahsisat Servisi', score: 95, color: 'bg-emerald-500' },
                                    { label: 'Finans Servisi', score: 88, color: 'bg-blue-500' },
                                    { label: 'Satış Servisi', score: 82, color: 'bg-amber-500' },
                                    { label: 'Operasyon Servisi', score: 92, color: 'bg-emerald-500' },
                                    { label: 'Bilgi Teknolojileri Servisi', score: 76, color: 'bg-orange-500' },
                                    { label: 'Muhasebe Servisi', score: 97, color: 'bg-emerald-500' },
                                ].map((item) => (
                                    <div key={item.label} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-semibold text-slate-700">{item.label}</span>
                                            <span className="font-bold text-slate-900">%{item.score}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.score}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardWidget>

                        <DashboardWidget title="KÖD Gönderim Uyumu (Q2 2026)" icon={FileBarChart}>
                            <DataTable
                                columns={[
                                    { key: 'birim', header: 'Birim', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.birim}</span> },
                                    { key: 'durum', header: 'KÖD Durumu', width: '140px', render: (item: any) => <StatusBadge value={item.durum} type="status" /> },
                                    { key: 'tarih', header: 'Gönderim', width: '120px', type: 'date' as any }
                                ]}
                                data={[
                                    { birim: 'Tahsisat Servisi', durum: 'TAMAMLANDI', tarih: '2026-07-05' },
                                    { birim: 'Finans Servisi', durum: 'TAMAMLANDI', tarih: '2026-07-08' },
                                    { birim: 'Operasyon Servisi', durum: 'İNCELEMEDE', tarih: '2026-07-25' },
                                    { birim: 'Bilgi Teknolojileri Servisi', durum: 'BEKLENİYOR', tarih: '' },
                                    { birim: 'Satış Servisi', durum: 'TAMAMLANDI', tarih: '2026-07-12' },
                                ]}
                                rowKey="birim"
                            />
                        </DashboardWidget>
                    </div>
                </div>
            )}
        </div>
    );
}
