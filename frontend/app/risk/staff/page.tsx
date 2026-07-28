'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Button from '@/components/ui/Button';
import { Users, Award, ShieldCheck, Activity } from 'lucide-react';
import RequireRole from '@/components/auth/RequireRole';

function RiskStaffPageContent() {
    const [searchTerm, setSearchTerm] = useState('');

    const staffList = [
        {
            id: 'RSK-001',
            name: 'Canan ÖZTÜRK',
            title: 'Kıdemli Risk Analisti',
            department: 'Mali ve Likidite Riski Yönetimi',
            certifications: ['FRM', 'PRM'],
            cpeHours: 35,
            status: 'Aktif'
        },
        {
            id: 'RSK-002',
            name: 'Bora YILMAZ',
            title: 'Risk Yönetimi Yöneticisi',
            department: 'Operasyonel Risk ve Piyasa Riski',
            certifications: ['CFA', 'FRM'],
            cpeHours: 48,
            status: 'Aktif'
        },
        {
            id: 'RSK-003',
            name: 'Merve AKSOY',
            title: 'Piyasa Riski Uzmanı',
            department: 'Piyasa ve Kredi Riski',
            certifications: ['FRM'],
            cpeHours: 20,
            status: 'Aktif'
        }
    ];

    const filtered = staffList.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Toplam Risk Analisti" value={staffList.length} icon={Users} color="blue" />
                <StatCard title="Sertifikalı Uzmanlar (FRM/CFA)" value={3} icon={Award} color="purple" />
                <StatCard title="Yıllık Eğitim Tamamlama" value="%92" icon={ShieldCheck} color="emerald" />
                <StatCard title="Ortalama Yıllık CPE Saat" value={34} icon={Activity} color="amber" />
            </div>

            <PageToolbar
                searchPlaceholder="Analist adı veya departman ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    { key: 'id', header: 'ANALİST KODU', width: '140px', render: (item: any) => <CodeBadge code={item.id} /> },
                    {
                        key: 'name', header: 'ANALİST ADI & UNVAN', render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.title} • {item.department}</div>
                            </div>
                        )
                    },
                    {
                        key: 'certifications', header: 'SERTİFİKALAR', render: (item: any) => (
                            <div className="flex gap-1">
                                {item.certifications.map((c: string) => (
                                    <span key={c} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">{c}</span>
                                ))}
                            </div>
                        )
                    },
                    { key: 'status', header: 'DURUM', width: '130px', render: (item: any) => <StatusBadge value={item.status} type="status" /> }
                ]}
                data={filtered}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />
        </div>
    );
}

export default function RiskStaffPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'RISK_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'SUPER_ADMIN']}>
            <RiskStaffPageContent />
        </RequireRole>
    );
}
