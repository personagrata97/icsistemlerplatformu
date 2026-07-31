'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import { auditApi, Control } from '@/lib/audit-api';
import { Shield, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

function ControlsPageContent() {
    const [controls, setControls] = useState<Control[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getAllControls({ page, pageSize: 20 });
            const items = data?.items || (Array.isArray(data) ? data : []);
            setControls(items);
            setTotalItems(data?.total ?? items.length);
        } catch (error) {
            console.error('Kontroller yüklenirken hata oluştu:', error);
            showToast('Kontroller yüklenirken bir hata oluştu.', 'error');
            setControls([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const filteredControls = controls.filter(c => 
        (c.name?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))) ||
        (c.code?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))) ||
        (c.description?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')))
    );

    const stats = {
        total: totalItems || controls.length,
        preventive: controls.filter(c => c.type === 'Önleyici').length,
        detective: controls.filter(c => c.type === 'Tespit Edici').length,
        corrective: controls.filter(c => c.type === 'Düzeltici').length,
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Kontrol Kütüphanesi" 
                subtitle="Sistem genelindeki tüm risk kontrollerinin merkezi envanteri ve etkinlik durumları" 
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kontrol" value={stats.total} icon={<Shield size={20} />} color="blue" />
                <StatCard title="Önleyici Kontroller" value={stats.preventive} icon={<ShieldCheck size={20} />} color="emerald" />
                <StatCard title="Tespit Edici Kontroller" value={stats.detective} icon={<Target size={20} />} color="amber" />
                <StatCard title="Düzeltici Kontroller" value={stats.corrective} icon={<AlertTriangle size={20} />} color="rose" />
            </div>

            <PageToolbar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Kontrol adı, kodu veya açıklamasında ara..."
                onRefresh={loadData}
                showAddButton={false}
            />

            <DataTable
                data={filteredControls}
                loading={loading}
                rowKey="id"
                paginated={true}
                manualPagination={true}
                currentPage={page}
                totalItems={totalItems}
                onPageChange={setPage}
                itemsPerPage={20}
                columns={[
                    { key: 'code', header: 'Kontrol Kodu', render: (row: any) => <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">{row.code || '-'}</span> },
                    { key: 'name', header: 'Kontrol Adı', render: (row: any) => <span className="font-medium text-gray-800">{row.name}</span> },
                    { key: 'type', header: 'Tür', render: (row: any) => row.type || '-' },
                    { key: 'frequency', header: 'Frekans', render: (row: any) => row.frequency || '-' },
                    { key: 'description', header: 'Açıklama', render: (row: any) => <span className="text-gray-500 text-sm">{row.description || '-'}</span> }
                ]}
            />
        </div>
    );
}


export default function ControlsPage() {
    return (
        <RequireRole allowedRoles={['MUFETTIS', 'GOZETIM_SORUMLUSU', 'KURUL_BASKANI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlsPageContent />
        </RequireRole>
    );
}
