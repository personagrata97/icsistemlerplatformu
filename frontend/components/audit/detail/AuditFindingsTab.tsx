'use client';

import React from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import FindingsTable from '@/components/audit/FindingsTable';

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
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <AlertCircle size={20} className="text-primary" /> Bulgular
                </h3>
                <Button size="sm" onClick={onAddFinding} className="gap-2">
                    <Plus size={16} /> Yeni Bulgu Ekle
                </Button>
            </div>
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

