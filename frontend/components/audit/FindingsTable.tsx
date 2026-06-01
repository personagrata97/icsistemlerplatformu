import React from 'react';
import { Clock, Search, FolderOpen } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import FindingActionButtons from './FindingActionButtons';
import { getRiskBadgeClass, formatDate } from '@/lib/audit-utils';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
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
                <div className="flex flex-col items-start text-left">
                    <div className="cell-title">
                        <Tooltip content={finding.title}>
                            <span className="truncate max-w-[300px] block">
                                {finding.title}
                            </span>
                        </Tooltip>
                    </div>
                    <div className="cell-subtitle flex items-center gap-2 mt-1 justify-start">
                        <Tooltip content={finding.audit?.title || ''}>
                            <span className="truncate max-w-[200px] block">{finding.audit?.title || (finding.auditId ? `Denetim #${finding.auditId}` : '')}</span>
                        </Tooltip>
                        {finding.category && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="truncate max-w-[150px] text-gray-500">{finding.category}</span>
                            </>
                        )}
                        {finding.linkedEthicsReportId && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-blue-300"></span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tight">
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
            key: 'dueDate',
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

    return (
        <DataTable
            columns={columns}
            data={findings}
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
