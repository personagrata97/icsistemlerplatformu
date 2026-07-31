import PageHeader from '@/components/ui/PageHeader';
'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import CodeBadge from '@/components/ui/CodeBadge';
import { BookOpen, FileText, Scale, ShieldAlert } from 'lucide-react';
import RequireRole from '@/components/auth/RequireRole';

function RiskKnowledgeBasePageContent() {
    const [searchTerm, setSearchTerm] = useState('');

    const docs = [
        { id: 'MEV-2026-01', title: 'BDDK Bankaların Likidite Karşılama Oranı Yönetmeliği', category: 'BDDK Mevzuatı', year: 2026 },
        { id: 'MEV-2026-04', title: 'Basel III Sermaye Yeterliliği ve Kaldıraç Standartları Rehberi', category: 'Uluslararası Standart', year: 2026 },
        { id: 'YNT-2026-10', title: 'Piyasa Riski RWA ve Riske Maruz Değer (VaR) Hesaplama Yöntemi', category: 'İç Yöntem Dokümanı', year: 2026 },
        { id: 'YNT-2026-12', title: 'Stres Testleri ve Senaryo Analizi Uygulama Esasları', category: 'İç Yöntem Dokümanı', year: 2026 },
    ];

    const filtered = docs.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Risk Kütüphanesi & Metodoloji" subtitle="Risk yönetimi metodoloji dokümanları, risk katalogları ve yasal kılavuzlar" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Kayıtlı Mevzuat Metinleri" value={14} icon={Scale} color="blue" />
                <StatCard title="Risk Hesaplama Yöntemleri" value={8} icon={FileText} color="purple" />
                <StatCard title="BDDK Düzenlemeleri" value={6} icon={BookOpen} color="emerald" />
                <StatCard title="Limit Rehberleri" value={5} icon={ShieldAlert} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Doküman veya mevzuat başlığı ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'DOKÜMAN KODU', width: '150px', render: (item: any) => <CodeBadge code={item.id} /> },
                    { key: 'title', header: 'DOKÜMAN BAŞLIĞI', render: (item: any) => <span className="font-bold text-gray-900">{item.title}</span> },
                    { key: 'category', header: 'KATEGORİ', width: '180px' },
                    { key: 'year', header: 'YIL', width: '100px' }
                ]}
                data={filtered}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}

export default function RiskKnowledgeBasePage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'RISK_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'SUPER_ADMIN']}>
            <RiskKnowledgeBasePageContent />
        </RequireRole>
    );
}
