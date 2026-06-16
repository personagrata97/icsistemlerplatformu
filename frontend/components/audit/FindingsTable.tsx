import React from 'react';
import { Clock, Search, FolderOpen, Calendar } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import OverflowTooltip from '@/components/ui/OverflowTooltip';
import FindingActionButtons from './FindingActionButtons';
import { getRiskBadgeClass, formatDate } from '@/lib/audit-utils';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import UserCell from '@/components/ui/UserCell';
import DataTable, { Column } from '@/components/ui/DataTable';
import { Finding } from '@/lib/audit-api';

interface FindingsTableProps {
    findings: Finding[];
    loading: boolean;
    isUnit?: boolean;
    isManager?: boolean;
    onView: (finding: Finding) => void;
    onEdit: (finding: Finding) => void;
    onDelete?: (finding: Finding) => void;
    onStatusUpdate: (finding: Finding, status: string) => void;
    onNotify?: (finding: Finding) => void;
    onReviewRequest?: (finding: Finding) => void;
    onClearFilters?: () => void;
    searchTerm?: string;
}

const FindingsTable: React.FC<FindingsTableProps> = ({
    findings,
    loading,
    isUnit = false,
    isManager = false,
    onView,
    onEdit,
    onDelete,
    onStatusUpdate,
    onNotify,
    onReviewRequest,
    onClearFilters,
    searchTerm
}) => {
    // Column definitions for DataTable
    const columns: Column<Finding>[] = [
        {
            key: 'code',
            header: 'Bulgu No',
            sortable: true,
            width: '120px',
            align: 'center',
            type: 'code'
        },
        {
            key: 'title',
            header: 'Bulgu Başlığı',
            sortable: true,
            align: 'left',
            render: (finding: Finding) => (
                <div className="flex flex-col items-start text-left w-full min-w-0">
                    <div className="cell-title w-full min-w-0">
                        <OverflowTooltip content={finding.title} className="max-w-full min-w-0">
                            {finding.title}
                        </OverflowTooltip>
                    </div>
                    <div className="cell-subtitle flex items-center gap-2 mt-1 justify-start w-full min-w-0">
                        <OverflowTooltip content={finding.audit?.title || ''} className="max-w-full flex-1 min-w-0">
                            {finding.audit?.title || (finding.auditId ? `Denetim #${finding.auditId}` : '')}
                        </OverflowTooltip>
                        {finding.category && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                                <span className="truncate max-w-[150px] text-gray-500 shrink-0">{finding.category}</span>
                            </>
                        )}
                        {finding.linkedEthicsReportId && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-blue-300 shrink-0"></span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tight shrink-0">
                                    <Search size={10} /> Etik Bağlantılı
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )
        },
        ...(!isUnit ? [{
            key: 'riskLevel',
            header: 'Risk',
            sortable: true,
            width: '120px',
            align: 'center',
            type: 'risk'
        } as Column<Finding>] : []),
        {
            key: 'status',
            header: 'Durum',
            sortable: true,
            width: '150px',
            align: 'center',
            type: 'status'
        },
        {
            key: 'computedDueDate',
            header: 'Aksiyon Tarihi',
            sortable: true,
            width: '150px',
            align: 'center',
            type: 'date'
        },
        ...(!isUnit ? [{
            key: 'assignedUser',
            header: 'Müfettiş',
            sortable: true,
            width: '180px',
            align: 'center',
            type: 'user'
        } as Column<Finding>] : []),
        {
            key: 'actions',
            header: 'İşlemler',
            width: '180px',
            align: 'center',
            render: (finding: Finding) => (
                <div className="flex justify-center gap-2">
                    <FindingActionButtons
                        finding={finding}
                        isManager={isManager}
                        showLabels={false}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusUpdate={onStatusUpdate}
                        onNotify={onNotify}
                        onReviewRequest={onReviewRequest}
                    />
                </div>
            )
        }
    ];

    const enhancedFindings = findings.map(item => {
        const date = item.dueDate || (item.followUps && item.followUps.length > 0 ? item.followUps[0].deadline : null);
        
        let userStr = '';
        const team = item.audit?.team;
        if (typeof team === 'string') {
            try {
                const parsed = JSON.parse(team);
                userStr = parsed[0]?.name || '';
            } catch { }
        } else if (Array.isArray(team) && team.length > 0) {
            userStr = team[0].name;
        }

        return {
            ...item,
            computedDueDate: date,
            assignedUser: userStr || undefined
        };
    });

    return (
        <DataTable
            columns={columns}
            data={enhancedFindings}
            loading={loading}
            rowKey="id"
            paginated={false}
            emptyIcon={FolderOpen}
            emptyTitle="Kayıt Bulunamadı"
            emptyDescription="Kriterlere uygun herhangi bir denetim bulgusu kaydı mevcut değil."
            className="border-none shadow-none rounded-none"
            onClearFilters={onClearFilters}
            searchTerm={searchTerm}
        />
    );
};

export default FindingsTable;
