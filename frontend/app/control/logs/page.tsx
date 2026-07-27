'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import Checkbox from '@/components/ui/Checkbox';
import { History, Activity, Database, ShieldCheck, Eye, Download, User, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ControlLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    user: string;
    date: string;
    details: string;
    type: 'create' | 'update' | 'delete' | 'status' | 'login' | 'system';
    ipAddress?: string;
}

const TYPE_LABELS: Record<string, string> = {
    create: 'Oluşturma',
    update: 'Güncelleme',
    delete: 'Silme',
    status: 'Durum Değişikliği',
    login: 'Oturum',
    system: 'Sistem'
};

const TYPE_COLORS: Record<string, string> = {
    create: 'bg-emerald-100 text-emerald-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-rose-100 text-rose-800',
    status: 'bg-amber-100 text-amber-800',
    login: 'bg-purple-100 text-purple-800',
    system: 'bg-slate-100 text-slate-800'
};

export default function ControlLogsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [selectedLog, setSelectedLog] = useState<ControlLog | null>(null);

    const [logs] = useState<ControlLog[]>([
        {
            id: 'LOG-IK-001', action: 'Kontrol Noktası Tanımlandı', entity: 'Kontrol Envanteri', entityId: 'KNT-KRE-001',
            user: 'Ahmet Yılmaz', date: '2026-07-27T09:15:00', details: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü kontrol noktası tanımlandı',
            type: 'create', ipAddress: '10.0.1.45'
        },
        {
            id: 'LOG-IK-002', action: 'Kontrol Testi Başlatıldı', entity: 'Kontrol Testleri', entityId: 'TST-2026-089',
            user: 'Canan Öztürk', date: '2026-07-26T14:30:00', details: 'KNT-KRE-001 kontrol noktası için tasarım etkinliği testi başlatıldı',
            type: 'status', ipAddress: '10.0.1.67'
        },
        {
            id: 'LOG-IK-003', action: 'KÖD Değerlendirmesi Gönderildi', entity: 'Birim Öz Değerlendirmeleri', entityId: 'KÖD-2026-Q2-HR',
            user: 'Mehmet Demir (BKS)', date: '2026-07-25T16:45:00', details: 'İnsan Kaynakları Müdürlüğü 2026 Q2 öz değerlendirmesi onaya sunuldu',
            type: 'update', ipAddress: '10.0.2.12'
        },
        {
            id: 'LOG-IK-004', action: 'Eksiklik Kaydı Oluşturuldu', entity: 'Eksiklik Takibi', entityId: 'EKS-2026-001',
            user: 'Zeynep Kaya', date: '2026-07-24T10:20:00', details: 'Müşteri Kimlik Doğrulama Formlarında İkinci Onay Eksikliği kaydedildi. Öncelik: Yüksek',
            type: 'create', ipAddress: '10.0.1.89'
        },
        {
            id: 'LOG-IK-005', action: 'Kontrol Noktası Güncellendi', entity: 'Kontrol Envanteri', entityId: 'KNT-KVKK-008',
            user: 'Ahmet Yılmaz', date: '2026-07-23T11:00:00', details: 'Kontrol frekansı "Günlük" olarak güncellendi, kontrol sahibi değiştirildi',
            type: 'update', ipAddress: '10.0.1.45'
        },
        {
            id: 'LOG-IK-006', action: 'Eğitim Programı Tamamlandı', entity: 'Eğitim Kataloğu', entityId: 'EGT-IK-002',
            user: 'Sistem', date: '2026-07-22T17:00:00', details: 'BKS Rol ve Sorumluluklar Eğitimi 28 katılımcı ile tamamlandı. Sertifikalar oluşturuldu.',
            type: 'system', ipAddress: 'SYSTEM'
        },
        {
            id: 'LOG-IK-007', action: 'Dönem Raporu Onaylandı', entity: 'İç Kontrol Raporları', entityId: 'RPR-2026-Q2',
            user: 'Genel Müdür Yardımcısı', date: '2026-07-21T09:30:00', details: '2026 Q2 Dönemsel İç Kontrol Değerlendirme Raporu üst yönetim tarafından onaylandı',
            type: 'status', ipAddress: '10.0.0.5'
        },
        {
            id: 'LOG-IK-008', action: 'Eksiklik Aksiyonu Kapatıldı', entity: 'Eksiklik Takibi', entityId: 'EKS-2025-014',
            user: 'Ali Koç (BKS)', date: '2026-07-20T15:10:00', details: 'Finans Servisi aksiyonu tamamlandı, kanıt belgesi yüklendi ve İç Kontrol ve Uyum Müdürlüğü tarafından doğrulandı',
            type: 'status', ipAddress: '10.0.3.22'
        },
        {
            id: 'LOG-IK-009', action: 'Kullanıcı Oturum Açtı', entity: 'Sistem', entityId: 'USR-AY001',
            user: 'Ahmet Yılmaz', date: '2026-07-20T08:05:00', details: 'İç Kontrol ve Uyum Müdürlüğü modülüne başarılı giriş',
            type: 'login', ipAddress: '10.0.1.45'
        },
        {
            id: 'LOG-IK-010', action: 'Kontrol Noktası Silindi', entity: 'Kontrol Envanteri', entityId: 'KNT-TEST-999',
            user: 'Ahmet Yılmaz', date: '2026-07-19T12:00:00', details: 'Test amaçlı oluşturulan kontrol noktası silindi (sehven kayıt)',
            type: 'delete', ipAddress: '10.0.1.45'
        }
    ]);

    const typeOptions = [
        { value: 'create', label: 'Oluşturma' },
        { value: 'update', label: 'Güncelleme' },
        { value: 'delete', label: 'Silme' },
        { value: 'status', label: 'Durum Değişikliği' },
        { value: 'login', label: 'Oturum' },
        { value: 'system', label: 'Sistem' }
    ];

    const filteredLogs = logs.filter(log => {
        if (searchTerm && !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.details.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.user.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.entityId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterType.length > 0 && !filterType.includes(log.type)) return false;
        return true;
    });

    const handleIntegrityCheck = () => {
        showToast(`Log bütünlüğü doğrulandı: ${logs.length} kayıt kontrol edildi. Sonuç: TUTARLI ✓`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Log Kaydı" value={logs.length} icon={Database} color="blue" />
                <StatCard title="Bugünkü İşlemler" value={logs.filter(l => l.date.startsWith('2026-07-27')).length} icon={Activity} color="emerald" />
                <StatCard title="Durum Değişiklikleri" value={logs.filter(l => l.type === 'status').length} icon={RefreshCw} color="amber" />
                <StatCard title="Silme İşlemleri" value={logs.filter(l => l.type === 'delete').length} icon={History} color="rose" />
            </div>

            <PageToolbar
                searchPlaceholder="İşlem, kullanıcı veya varlık kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown
                        label="İşlem Türü"
                        activeCount={filterType.length}
                        onClear={() => setFilterType([])}
                    >
                        <div className="space-y-2">
                            {typeOptions.map(opt => (
                                <Checkbox
                                    key={opt.value}
                                    id={`filter-type-${opt.value}`}
                                    label={opt.label}
                                    checked={filterType.includes(opt.value)}
                                    onChange={(checked) => {
                                        setFilterType(prev => checked ? [...prev, opt.value] : prev.filter(v => v !== opt.value));
                                    }}
                                />
                            ))}
                        </div>
                    </FilterDropdown>
                }
                rightActions={
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" leftIcon={<Download size={16} />} onClick={() => showToast('Log dışa aktarımı başlatıldı (CSV)', 'success')}>
                            Dışa Aktar
                        </Button>
                        <Button variant="primary" leftIcon={<ShieldCheck size={16} />} onClick={handleIntegrityCheck}>
                            Bütünlük Kontrolü
                        </Button>
                    </div>
                }
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'Log ID', width: '130px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'type', header: 'Tür', width: '140px', render: (item: any) => (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${TYPE_COLORS[item.type] || 'bg-slate-100 text-slate-700'}`}>
                            {TYPE_LABELS[item.type] || item.type}
                        </span>
                    ) },
                    { key: 'action', header: 'İşlem & Detay', sortable: true, render: (item: any) => (
                        <div>
                            <div className="font-bold text-slate-900 text-xs">{item.action}</div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{item.details}</div>
                        </div>
                    ) },
                    { key: 'entity', header: 'Modül / Varlık', width: '180px', render: (item: any) => (
                        <div>
                            <div className="text-xs font-semibold text-slate-700">{item.entity}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.entityId}</div>
                        </div>
                    ) },
                    { key: 'user', header: 'Kullanıcı', width: '160px', render: (item: any) => (
                        <div className="flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700">{item.user}</span>
                        </div>
                    ) },
                    { key: 'date', header: 'Tarih & Saat', type: 'date' as any, width: '160px' },
                    { key: 'actions', header: 'İncele', width: '90px', render: (item: any) => (
                        <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => setSelectedLog(item)}>
                            Detay
                        </Button>
                    ) }
                ]}
                data={filteredLogs}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setFilterType([]); }}
                rowKey="id"
            />

            {/* Log Detail Modal */}
            {selectedLog && (
                <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title={`İşlem Detayı — ${selectedLog.id}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{selectedLog.action}</h4>
                                    <p className="text-slate-500 font-medium mt-0.5">{selectedLog.details}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${TYPE_COLORS[selectedLog.type]}`}>
                                    {TYPE_LABELS[selectedLog.type]}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Kullanıcı</span>
                                <span className="font-bold text-slate-900">{selectedLog.user}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">IP Adresi</span>
                                <span className="font-mono font-bold text-slate-900">{selectedLog.ipAddress || '—'}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Modül / Varlık</span>
                                <span className="font-bold text-slate-900">{selectedLog.entity}</span>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="text-slate-500 font-medium block">Varlık Kodu</span>
                                <span className="font-mono font-bold text-slate-900">{selectedLog.entityId}</span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedLog(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
