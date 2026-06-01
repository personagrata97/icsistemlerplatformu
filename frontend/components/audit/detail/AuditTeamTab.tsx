'use client';

import React from 'react';
import { Users, Plus, Mail, Phone, FolderOpen, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import DataTable, { Column } from '@/components/ui/DataTable';
import UserCell from '@/components/ui/UserCell';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
}

interface AuditTeamTabProps {
    team: TeamMember[];
    onAddMember: () => void;
    onRemoveMember: (member: TeamMember) => void;
    canManageTeam?: boolean;
}

const AuditTeamTab: React.FC<AuditTeamTabProps> = ({
    team,
    onAddMember,
    onRemoveMember,
    canManageTeam = false
}) => {
    const columns: Column<TeamMember>[] = [
        {
            key: 'name',
            header: 'Personel',
            sortable: true,
            align: 'left',
            render: (member) => (
                <UserCell name={member.name} className="!w-auto" />
            )
        },
        {
            key: 'role',
            header: 'Görev',
            sortable: true,
            align: 'left',
            render: (member) => (
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                    {member.role}
                </span>
            )
        },
        {
            key: 'email',
            header: 'E-posta',
            align: 'left',
            type: 'email'
        },
        {
            key: 'phone',
            header: 'Telefon',
            align: 'left',
            type: 'phone'
        }
    ];

    if (canManageTeam) {
        columns.push({
            key: 'actions',
            header: 'İşlem',
            width: '80px',
            align: 'center' as const,
            render: (member) => (
                <ActionMenu
                    variant="ghost"
                    items={[
                        {
                            label: 'Kaldır',
                            icon: Trash2,
                            variant: 'danger',
                            onClick: () => onRemoveMember(member)
                        }
                    ]}
                />
            )
        });
    }

    return (
        <div className="card !p-0 shadow-sm border border-gray-100">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Users size={20} className="text-primary" /> Denetim Ekibi
                </h3>
                {canManageTeam && (
                    <Button size="sm" onClick={onAddMember} className="gap-2">
                        <Plus size={16} /> Ekip Üyesi Ekle
                    </Button>
                )}
            </div>
            <DataTable
                columns={columns}
                data={team}
                rowKey="id"
                emptyIcon={FolderOpen}
                emptyTitle="Kayıt Bulunamadı"
                emptyDescription="Bu denetimde görev alacak personeli buradan ekleyebilirsiniz."
                className="border-none shadow-none rounded-none"
            />
        </div>
    );
};

export default AuditTeamTab;
