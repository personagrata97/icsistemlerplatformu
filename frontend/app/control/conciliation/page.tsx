'use client';

import React, { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingState from '@/components/ui/LoadingState';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { controlApi } from '@/lib/control-api';
import RequireRole from '@/components/auth/RequireRole';
import { MODULE_TERMS } from '@/lib/terminology';

function ControlConciliationPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deficienciesList, setDeficienciesList] = useState<any[]>([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState<any>(null);
    const [unitResponseText, setUnitResponseText] = useState('');

    const loadDeficiencies = async () => {
        setLoading(true);
        try {
            const data = await controlApi.getDeficiencies();
            setDeficienciesList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Mutabakat verileri yükleme hatası:', error);
            showToast('Mutabakat verileri yüklenirken hata oluştu', 'error');
            setDeficienciesList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeficiencies();
    }, []);

    const handleSendToConciliation = async (id: string) => {
        setSubmitting(true);
        try {
            await controlApi.sendToConciliation(id);
            showToast('Kontrol eksikliği mutabakat için sorumlu birime gönderildi.', 'success');
            setSelectedDeficiency(null);
            await loadDeficiencies();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitResponse = async (response: 'KATILIYOR' | 'KISMEN_KATILIYOR' | 'KATILMIYOR') => {
        if (!selectedDeficiency) return;
        setSubmitting(true);
        try {
            await controlApi.submitUnitResponse(selectedDeficiency.id, response, unitResponseText);
            showToast('Birim mutabakat yanıtı başarıyla kaydedildi.', 'success');
            setSelectedDeficiency(null);
            setUnitResponseText('');
            await loadDeficiencies();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOfficiallyNotify = async (id: string) => {
        setSubmitting(true);
        try {
            await controlApi.officiallyNotify(id);
            showToast('Kontrol eksikliği resmen tebliğ edildi. Aksiyon takibi başlatıldı.', 'success');
            setSelectedDeficiency(null);
            await loadDeficiencies();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = deficienciesList.filter((d: any) => {
        const title = d.title || '';
        const code = d.code || d.id || '';
        const unit = d.responsibleUnit || d.control?.department || '';
        const q = searchTerm.toLowerCase();

        return title.toLowerCase().includes(q) || code.toLowerCase().includes(q) || unit.toLowerCase().includes(q);
    });

    const pendingConciliation = deficienciesList.filter((d: any) => d.status === 'Mutabakata Gönderildi' || d.unitResponse === 'BEKLEMEDE').length;
    const agreedCount = deficienciesList.filter((d: any) => d.conciliationStatus === 'UZLASILDI' || d.status === 'Uzlaşıldı').length;
    const disputedCount = deficienciesList.filter((d: any) => d.conciliationStatus === 'UYUSMAZLIK' || d.status === 'Uyuşmazlık').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Mutabakata Gönderilenler" value={pendingConciliation} icon={Send} color="blue" />
                <StatCard title="Uzlaşılan Eksiklikler" value={agreedCount} icon={CheckCircle2} color="emerald" />
                <StatCard title="Uyuşmazlıktaki Eksiklikler" value={disputedCount} icon={AlertTriangle} color="amber" />
                <StatCard title="Resmen Tebliğ Edilenler" value={deficienciesList.filter((d: any) => d.status === 'Tebliğ Edildi').length} icon={ShieldCheck} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Mutabakat kaydı, birim veya kod ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={loadDeficiencies} isLoading={loading}>
                        Yenile
                    </Button>
                }
            />

            {loading ? (
                <LoadingState message="Gerçek mutabakat kayıtları veritabanından çekiliyor..." />
            ) : (
                <DataTable
                    columns={[
                        { key: 'code', header: 'EKSİKLİK KODU', width: '140px', render: (item: any) => <CodeBadge code={item.code || item.id} /> },
                        {
                            key: 'title', header: 'EKSİKLİK TANIMI & SORUMLU BİRİM', sortable: true, render: (item: any) => (
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                                    <div className="text-xs text-gray-500">Sorumlu Birim: {item.responsibleUnit || item.control?.department}</div>
                                </div>
                            )
                        },
                        {
                            key: 'unitResponse', header: 'BİRİM MUTABAKAT YANITI', width: '180px', render: (item: any) => (
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded ${item.unitResponse === 'KATILIYOR' ? 'bg-emerald-100 text-emerald-800' : item.unitResponse === 'KATILMIYOR' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {item.unitResponse || 'BEKLEMEDE'}
                                </span>
                            )
                        },
                        { key: 'status', header: 'AKIS DURUMU', width: '160px', render: (item: any) => <StatusBadge value={item.status} type="status" /> },
                        {
                            key: 'actions', header: 'İŞLEM', width: '140px', render: (item: any) => (
                                <Button variant="secondary" size="sm" onClick={() => setSelectedDeficiency(item)}>
                                    Detay / Mutabakat
                                </Button>
                            )
                        }
                    ]}
                    data={filtered}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="id"
                />
            )}

            {selectedDeficiency && (
                <Modal
                    isOpen={!!selectedDeficiency}
                    onClose={() => setSelectedDeficiency(null)}
                    title={`İç Kontrol Mutabakat ve Tebliğ Detayı — ${selectedDeficiency.code || selectedDeficiency.id}`}
                    size="lg"
                >
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                            <div className="font-bold text-blue-950 text-sm">{selectedDeficiency.title}</div>
                            <div><strong>Sorumlu Birim:</strong> {selectedDeficiency.responsibleUnit || selectedDeficiency.control?.department}</div>
                            <div><strong>Mevcut Akış Durumu:</strong> {selectedDeficiency.status}</div>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900">Eksiklik Açıklaması:</div>
                            <p className="text-gray-700 leading-relaxed">{selectedDeficiency.description}</p>
                        </div>

                        {selectedDeficiency.unitResponseReason && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                                <div className="font-bold text-amber-900">Birim Açıklaması / İtiraz Gerekçesi:</div>
                                <p className="text-amber-800">{selectedDeficiency.unitResponseReason}</p>
                            </div>
                        )}

                        {/* Aksiyon Butonları (Halkalara Göre) */}
                        <div className="p-4 bg-gray-100 rounded-xl space-y-3">
                            <div className="font-bold text-gray-900 text-xs border-b pb-1">MUTABAKAT VE TEBLİĞ İŞLEMLERİ:</div>

                            {selectedDeficiency.status === 'Taslak' || !selectedDeficiency.sentToUnitAt ? (
                                <Button variant="primary" leftIcon={<Send size={14} />} onClick={() => handleSendToConciliation(selectedDeficiency.id)} isLoading={submitting}>
                                    Birime Mutabakata Gönder
                                </Button>
                            ) : null}

                            {selectedDeficiency.status === 'Mutabakata Gönderildi' || selectedDeficiency.unitResponse === 'BEKLEMEDE' ? (
                                <div className="space-y-2">
                                    <label className="font-bold text-gray-800">Birim Mutabakat Açıklaması:</label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        rows={2}
                                        placeholder="Birim olarak eksiklik tespitine ilişkin değerlendirmeniz..."
                                        value={unitResponseText}
                                        onChange={(e) => setUnitResponseText(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button variant="primary" leftIcon={<ThumbsUp size={14} />} onClick={() => handleSubmitResponse('KATILIYOR')} isLoading={submitting}>
                                            Tespite Katılıyorum
                                        </Button>
                                        <Button variant="secondary" leftIcon={<ThumbsDown size={14} />} onClick={() => handleSubmitResponse('KATILMIYOR')} isLoading={submitting}>
                                            Katılmıyorum (Uyuşmazlık)
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {selectedDeficiency.status === 'Uzlaşıldı' || selectedDeficiency.conciliationStatus === 'UZLASILDI' ? (
                                <Button variant="primary" leftIcon={<ShieldCheck size={14} />} onClick={() => handleOfficiallyNotify(selectedDeficiency.id)} isLoading={submitting}>
                                    Resmen Birime Tebliğ Et
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function ControlConciliationPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'CONTROL_ADMIN', 'CONTROL_OFFICER', 'CONTROL_MANAGER', 'SUPER_ADMIN']}>
            <ControlConciliationPageContent />
        </RequireRole>
    );
}
