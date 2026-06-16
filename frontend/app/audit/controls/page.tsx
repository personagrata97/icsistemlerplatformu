'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/audit/PageHeader';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import { auditApi, Control } from '@/lib/audit-api';
import { Shield, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ControlsPage() {
    const [controls, setControls] = useState<Control[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getAllControls();
            setControls(data || []);
        } catch (error) {
            console.error('Kontroller yüklenirken hata oluştu:', error);
            showToast('Kontroller yüklenirken bir hata oluştu.', 'error');
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
        total: controls.length,
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
