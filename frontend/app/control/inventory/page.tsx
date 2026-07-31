import PageHeader from '@/components/ui/PageHeader';
'use client';

import React, { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import LoadingState from '@/components/ui/LoadingState';
import Pagination from '@/components/ui/Pagination';
import { Layers, CheckCircle2, Sliders, Activity, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { controlApi } from '@/lib/control-api';
import RequireRole from '@/components/auth/RequireRole';

function ControlInventoryPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [controlsList, setControlsList] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [newControl, setNewControl] = useState({
        title: '',
        description: '',
        processName: 'Kredi Tahsis ve Operasyon',
        riskTitle: '',
        type: 'Önleyici',
        method: 'Otomatik',
        frequency: 'Sürekli',
        department: 'Kredi Operasyonları Müdürlüğü',
        status: 'Aktif'
    });

    const loadControls = async () => {
        setLoading(true);
        try {
            const res = await controlApi.getInventory({ status: statusFilter, search: searchTerm, page, pageSize });
            setControlsList(res.items || res.data || []);
            setTotal(res.total || 0);
        } catch (error) {
            console.error('Kontrol envanteri yükleme hatası:', error);
            showToast('Kontrol envanteri yüklenirken hata oluştu', 'error');
            setControlsList([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadControls();
    }, [statusFilter, page, pageSize, searchTerm]);

    const handleAddControl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newControl.title) {
            showToast('Kontrol başlığı girmek zorunludur.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await controlApi.createControlItem(newControl);
            showToast('Yeni kontrol tanımı başarıyla veritabanına eklendi.', 'success');
            setIsAddModalOpen(false);
            setNewControl({
                title: '',
                description: '',
                processName: 'Kredi Tahsis ve Operasyon',
                riskTitle: '',
                type: 'Önleyici',
                method: 'Otomatik',
                frequency: 'Sürekli',
                department: 'Kredi Operasyonları Müdürlüğü',
                status: 'Aktif'
            });
            await loadControls();
        } catch (error) {
            console.error('Kontrol ekleme hatası:', error);
            showToast('Kontrol eklenirken hata oluştu', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const statusOptions = [
        { value: 'ALL', label: 'Tüm Durumlar' },
        { value: 'Aktif', label: 'Aktif Kontroller' },
        { value: 'Pasif', label: 'Pasif Kontroller' },
    ];

    const effectiveControls = controlsList.filter(c => c.durum === 'Aktif' || c.durum === 'ETKİN').length;

    return (
        <div className="space-y-6">
            <PageHeader title="Süreç & Kontrol Envanteri" subtitle="Tüm kurumsal süreçlerin, kontrol noktalarının ve risk kütüphanesinin yönetimi" />
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Kontrol Envanteri"
                    value={controlsList.length}
                    icon={Layers}
                    color="blue"
                    infoTooltip="Sistemde kayıtlı toplam kontrol tanımı"
                />
                <StatCard
                    title="Aktif Kontroller"
                    value={effectiveControls}
                    icon={CheckCircle2}
                    color="emerald"
                    infoTooltip="Sistemde aktif olarak çalışan kontroller"
                />
                <StatCard
                    title="Gelişime Açık Kontroller"
                    value={controlsList.length - effectiveControls}
                    icon={Activity}
                    color="amber"
                    infoTooltip="Testlerde aksama tespit edilmiş kontroller"
                />
                <StatCard
                    title="Otomatik Kontrol Oranı"
                    value="%78"
                    icon={Sliders}
                    color="purple"
                    infoTooltip="Sistemsel otomatik olarak yürütülen kontrollerin oranı"
                />
            </div>

            {/* Page Toolbar */}
            <PageToolbar
                searchPlaceholder="Kontrol kodu, adı, süreç veya risk ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                leftActions={
                    <div className="w-48">
                        <CustomSelect
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(val: any) => setStatusFilter(Array.isArray(val) ? val[0] : val)}
                        />
                    </div>
                }
                rightActions={
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" leftIcon={<RefreshCw size={14} />} onClick={loadControls} isLoading={loading}>
                            Yenile
                        </Button>
                        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsAddModalOpen(true)}>
                            Yeni Kontrol Tanımla
                        </Button>
                    </div>
                }
            />

            {/* DataTable */}
            {loading ? (
                <LoadingState message="Gerçek kontrol envanteri yükleniyor..." />
            ) : (
                <DataTable
                    columns={[
                        {
                            key: 'kod',
                            header: 'KONTROL KODU',
                            width: '160px',
                            render: (item: any) => <CodeBadge code={item.kod} />
                        },
                        {
                            key: 'ad',
                            header: 'KONTROL TANIMI & SÜREÇ',
                            sortable: true,
                            render: (item: any) => (
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{item.ad}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Süreç: {item.surec} • Birim: {item.birim}</div>
                                </div>
                            )
                        },
                        {
                            key: 'tur',
                            header: 'TÜR & YÖNTEM',
                            width: '180px',
                            render: (item: any) => (
                                <div className="text-xs text-gray-700 space-y-0.5">
                                    <div className="font-semibold text-blue-900">{item.tur}</div>
                                    <div className="text-[10px] text-gray-500">{item.yontem} ({item.siklik})</div>
                                </div>
                            )
                        },
                        {
                            key: 'durum',
                            header: 'DURUM',
                            width: '140px',
                            render: (item: any) => <StatusBadge value={item.durum} type="status" />
                        }
                    ]}
                    data={controlsList}
                    searchTerm={searchTerm}
                    onClearFilters={() => setSearchTerm('')}
                    rowKey="id"
                    paginated={true}
                    itemsPerPage={20}
                />
            )}

            <div className="mt-4">
                <Pagination
                    currentPage={page}
                    totalItems={total}
                    itemsPerPage={pageSize}
                    onPageChange={setPage}
                />
            </div>

            {/* Modal: Yeni Kontrol Tanımla */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Yeni Kontrol Tanımı Ekle"
                size="lg"
            >
                <form onSubmit={handleAddControl} className="space-y-4 text-xs">
                    <FormInput
                        label="Kontrol Adı / Tanımı"
                        required
                        placeholder="Örn: Kredi Tahsis Yetki Limitlerinin Sistemsel Kısıtlanması Kontrolü"
                        value={newControl.title}
                        onChange={(e) => setNewControl({ ...newControl, title: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="İlişkili Süreç"
                            value={newControl.processName}
                            onChange={(e) => setNewControl({ ...newControl, processName: e.target.value })}
                        />
                        <FormInput
                            label="Sorumlu Birim"
                            value={newControl.department}
                            onChange={(e) => setNewControl({ ...newControl, department: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <CustomSelect
                                label="Kontrol Türü"
                                options={[
                                    { value: 'Önleyici', label: 'Önleyici' },
                                    { value: 'Tespit Edici', label: 'Tespit Edici' },
                                    { value: 'Düzeltici', label: 'Düzeltici' },
                                ]}
                                value={newControl.type}
                                onChange={(val: any) => setNewControl({ ...newControl, type: Array.isArray(val) ? val[0] : val })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Uygulama Yöntemi"
                                options={[
                                    { value: 'Otomatik', label: 'Otomatik (Sistemsel)' },
                                    { value: 'Elle', label: 'Manuel (Elle)' },
                                    { value: 'Yarı Otomatik', label: 'Yarı Otomatik' },
                                ]}
                                value={newControl.method}
                                onChange={(val: any) => setNewControl({ ...newControl, method: Array.isArray(val) ? val[0] : val })}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Kontrol Sıklığı"
                                options={[
                                    { value: 'Sürekli', label: 'Sürekli (Anlık)' },
                                    { value: 'Günlük', label: 'Günlük' },
                                    { value: 'Haftalık', label: 'Haftalık' },
                                    { value: 'Aylık', label: 'Aylık' },
                                ]}
                                value={newControl.frequency}
                                onChange={(val: any) => setNewControl({ ...newControl, frequency: Array.isArray(val) ? val[0] : val })}
                            />
                        </div>
                    </div>

                    <FormTextarea
                        label="Bağlı Risk Açıklaması"
                        rows={2}
                        placeholder="Bu kontrolün azaltmayı hedeflediği ana operasyonel/mali risk..."
                        value={newControl.riskTitle}
                        onChange={(e) => setNewControl({ ...newControl, riskTitle: e.target.value })}
                    />

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                        <Button type="submit" variant="primary" isLoading={submitting}>Veritabanına Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default function ControlInventoryPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'AUDIT_ADMIN', 'CONTROL_ADMIN', 'CONTROL_OFFICER', 'CONTROL_MANAGER', 'SUPER_ADMIN']}>
            <ControlInventoryPageContent />
        </RequireRole>
    );
}
