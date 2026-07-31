'use client';
import FormTextarea from '@/components/ui/FormTextarea';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import PageToolbar from '@/components/ui/PageToolbar';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import LoadingState from '@/components/ui/LoadingState';
import Pagination from '@/components/ui/Pagination';
import { AlertOctagon, CheckCircle2, Clock, Plus, Eye, Sliders, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { controlApi } from '@/lib/control-api';
import { formatDate } from '@/lib/audit-utils';

export default function ControlDeficienciesSection() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deficienciesList, setDeficienciesList] = useState<any[]>([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState<any>(null);
    const [actionPlanInput, setActionPlanInput] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const loadDeficiencies = async () => {
        setLoading(true);
        try {
            const data = await controlApi.getDeficiencies({ page, pageSize });
            setDeficienciesList(data.items || (Array.isArray(data) ? data : []));
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Kontrol eksiklikleri yükleme hatası:', error);
            showToast('Kontrol eksiklikleri yüklenirken hata oluştu', 'error');
            setDeficienciesList([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeficiencies();
    }, [page, pageSize]);

    const handleUpdateStatus = async (status: string) => {
        if (!selectedDeficiency) return;
        setSubmitting(true);
        try {
            await controlApi.updateDeficiencyStatus(selectedDeficiency.id, status, actionPlanInput);
            showToast(`Kontrol eksikliği durumu (${status}) güncellendi`, 'success');
            setSelectedDeficiency(null);
            setActionPlanInput('');
            await loadDeficiencies();
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            showToast('İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDeficiencies = deficienciesList.filter((d: any) => {
        const title = d.title || d.description || '';
        const code = d.code || d.id || '';
        const unit = d.responsibleUnit || d.control?.department || '';
        const query = searchTerm.toLowerCase();

        return title.toLowerCase().includes(query) ||
            code.toLowerCase().includes(query) ||
            unit.toLowerCase().includes(query);
    });

    const activeDeficiencies = deficienciesList.filter((d: any) => d.status !== 'Kapalı');
    const closedDeficiencies = deficienciesList.filter((d: any) => d.status === 'Kapalı');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kontrol Eksikliği" value={deficienciesList.length} icon={AlertOctagon} color="red" />
                <StatCard title="Aksiyondaki Eksiklikler" value={activeDeficiencies.length} icon={Clock} color="amber" />
                <StatCard title="Kapatılan Eksiklikler" value={closedDeficiencies.length} icon={CheckCircle2} color="emerald" />
                <StatCard title="Kritik/Yüksek Eksiklikler" value={deficienciesList.filter((d: any) => d.severity === 'Yüksek' || d.severity === 'Kritik').length} icon={Sliders} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Eksiklik tanımı veya kodu ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                rightActions={
                    <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={loadDeficiencies} isLoading={loading}>
                        Yenile
                    </Button>
                }
            />

            {loading ? (
                <LoadingState message="Gerçek kontrol eksiklikleri veritabanından çekiliyor..." />
            ) : (
                <DataTable
                    columns={[
                        { key: 'code', header: 'EKSİKLİK KODU', width: '150px', render: (item: any) => <CodeBadge code={item.code || item.id} /> },
                        {
                            key: 'title', header: 'EKSİKLİK TANIMI & KONTROL', sortable: true, render: (item: any) => (
                                <div>
                                    <div className="font-bold text-slate-900">{item.title}</div>
                                    <div className="text-xs text-slate-500 font-medium">Birim: {item.responsibleUnit || item.control?.department} • Kontrol: {item.control?.code || 'N/A'}</div>
                                </div>
                            )
                        },
                        {
                            key: 'severity', header: 'ÖNEM SEVİYESİ', width: '130px', render: (item: any) => (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.severity === 'Kritik' || item.severity === 'Yüksek' ? 'bg-red-100 text-red-800' : item.severity === 'Orta' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                    {item.severity || 'Orta'}
                                </span>
                            )
                        },
                        { key: 'status', header: 'DURUM', width: '140px', render: (item: any) => <StatusBadge value={item.status} type="status" /> },
                        { key: 'dueDate', header: 'HEDEF TERMİN', width: '150px', render: (item: any) => <span className="text-xs font-mono">{formatDate(item.dueDate)}</span> },
                        {
                            key: 'actions', header: 'İNCELE', width: '100px', render: (item: any) => (
                                <Button variant="secondary" size="sm" leftIcon={<Eye size={14} />} onClick={() => { setSelectedDeficiency(item); setActionPlanInput(item.actionPlan || ''); }}>
                                    İncele
                                </Button>
                            )
                        }
                    ]}
                    data={filteredDeficiencies}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="id"
                    paginated={true}
                    itemsPerPage={20}
                />
            )}

            <Pagination
                currentPage={page}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={setPage}
            />

            {selectedDeficiency && (
                <Modal
                    isOpen={!!selectedDeficiency}
                    onClose={() => setSelectedDeficiency(null)}
                    title={`Kontrol Eksikliği Detayı — ${selectedDeficiency.code || selectedDeficiency.id}`}
                    size="lg"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" onClick={() => handleUpdateStatus('Aksiyonda')} isLoading={submitting}>
                                Aksiyona Al
                            </Button>
                            <Button variant="primary" onClick={() => handleUpdateStatus('Kapalı')} isLoading={submitting}>
                                Eksikliği Kapat
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900 text-sm">{selectedDeficiency.title}</div>
                            <div><strong>Sorumlu Birim:</strong> {selectedDeficiency.responsibleUnit || selectedDeficiency.control?.department}</div>
                            <div><strong>Önem Seviyesi:</strong> {selectedDeficiency.severity}</div>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900">Eksiklik Açıklaması:</div>
                            <p className="text-gray-700 leading-relaxed">{selectedDeficiency.description}</p>
                        </div>

                        {selectedDeficiency.rootCause && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                                <div className="font-bold text-amber-900">Kök Neden Analizi:</div>
                                <p className="text-amber-800">{selectedDeficiency.rootCause}</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="font-bold text-gray-800">Düzeltici Aksiyon Planı:</label>
                            <FormTextarea
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                rows={3}
                                placeholder="Düzeltici aksiyon planı ve çözüm adımlarını giriniz..."
                                value={actionPlanInput}
                                onChange={(e) => setActionPlanInput(e.target.value)}
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
