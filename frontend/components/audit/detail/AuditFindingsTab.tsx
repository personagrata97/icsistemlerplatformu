'use client';

import React from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import FindingsTable from '@/components/audit/FindingsTable';
import SectionHeader from '@/components/ui/SectionHeader';

interface AuditFindingsTabProps {
    findings: any[];
    loading: boolean;
    canDelete: boolean;
    onAddFinding: () => void;
    onViewFinding: (finding: any) => void;
    onEditFinding: (finding: any) => void;
    onDeleteFinding: (finding: any) => void;
    onStatusUpdate: (finding: any, status: string) => void;
    onNotify: (finding: any) => void;
}

const AuditFindingsTab: React.FC<AuditFindingsTabProps> = ({
    findings,
    loading,
    canDelete,
    onAddFinding,
    onViewFinding,
    onEditFinding,
    onDeleteFinding,
    onStatusUpdate,
    onNotify
}) => {
    return (
        <div className="card !p-0 shadow-sm border border-gray-100 overflow-hidden">
            <SectionHeader 
                title="Bulgular" 
                icon={AlertCircle} 
                rightContent={
                    <Button size="sm" onClick={onAddFinding} className="gap-2">
                        <Plus size={16} /> Yeni Bulgu Ekle
                    </Button>
                }
            />
            <FindingsTable
                findings={findings}
                loading={loading}
                isUnit={false}
                isManager={canDelete}
                onView={onViewFinding}
                onEdit={onEditFinding}
                onDelete={onDeleteFinding}
                onStatusUpdate={onStatusUpdate}
                onNotify={onNotify}
            />
        </div>
    );
};

export default AuditFindingsTab;

