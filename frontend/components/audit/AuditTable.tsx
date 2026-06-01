import React from 'react';
import { Loader2, FileText, Search, Calendar } from 'lucide-react';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { formatDate } from '@/lib/audit-utils';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import AuditActionButtons from './AuditActionButtons';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import DataTable, { Column } from '@/components/ui/DataTable';

export interface AuditTableItem {
    id: string;
    code?: string;
    title: string;
    type: string;
    status: string;
    dates?: string; // Formatted date range string e.g. "01.01.2024 - 31.01.2024"
    startDate?: string;
    endDate?: string;
    auditors?: string | string[]; // Can be JSON string or array
    supervisor?: string;
    createdAt?: string;
    // For Audit Plans
    planType?: string;
    approvalDate?: string;
    approvedBy?: string;
    documentUrl?: string;
    description?: string;
    linkedEthicsReportId?: string;
}

interface AuditTableProps {
    data: AuditTableItem[];
    loading: boolean;
    onView?: (item: AuditTableItem) => void;
    onEdit?: (item: AuditTableItem) => void;
    onDelete?: (id: string) => void;
    canDelete?: boolean;
    viewUrlPrefix?: string; // If provided, clicking view goes to `${viewUrlPrefix}/${id}`
    isPlanTable?: boolean; // Changes some columns for Audit Plan view
}

const AuditTable: React.FC<AuditTableProps> = ({
    data,
    loading,
    onView,
    onEdit,
    onDelete,
    canDelete = false,
    viewUrlPrefix,
    isPlanTable = false
}) => {
    // Column definitions for DataTable
    const columns: Column<AuditTableItem>[] = [
        ...(!isPlanTable ? [{
            key: 'code',
            header: 'Denetim No',
            sortable: true,
            width: '120px',
            align: 'center',
            render: (item: AuditTableItem) => <CodeBadge code={item.code} className="block w-fit mx-auto" />
        } as Column<AuditTableItem>] : []),
        {
            key: 'title',
            header: isPlanTable ? 'Plan Adı' : 'Denetim Adı',
            sortable: true,
            align: 'left',
            render: (item: AuditTableItem) => (
                <div className="flex flex-col items-start pr-4">
                    <div className="cell-title font-medium text-gray-900 flex items-center gap-2">
                        <Tooltip content={item.title}>
                            <span className="truncate max-w-[400px]">
                                {item.title}
                            </span>
                        </Tooltip>
                        {item.linkedEthicsReportId && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tight">
                                <Search size={10} /> Etik Bağlantılı
                            </span>
                        )}
                    </div>
                    {isPlanTable && item.description && (
                        <div className="cell-subtitle mt-0.5 line-clamp-1 text-xs text-gray-500">{item.description}</div>
                    )}
                </div>
            )
        },
        {
            key: 'type',
            header: 'Tür',
            sortable: true,
            width: '150px',
            align: 'center',
            render: (item: AuditTableItem) => (
                <div className="flex justify-center">
                    {isPlanTable ? (
                        <StatusBadge type="plan-type" value={item.planType || item.type} />
                    ) : (
                        <span className="text-sm text-gray-600 font-medium">{item.type}</span>
                    )}
                </div>
            )
        },
        {
            key: 'startDate',
            header: 'Tarih Aralığı',
            sortable: true,
            width: '180px',
            align: 'center',
            render: (item: AuditTableItem) => (
                <div className="flex justify-center">
                    <DateDisplay
                        date={isPlanTable ? item.createdAt : item.startDate || item.dates}
                        endDate={isPlanTable ? undefined : item.endDate}
                        showIcon
                        className="justify-center"
                    />
                </div>
            )
        },
        {
            key: 'status',
            header: 'Durum',
            sortable: true,
            width: '150px',
            align: 'center',
            render: (item: AuditTableItem) => (
                <div className="flex justify-center">
                    <StatusBadge value={item.status} />
                </div>
            )
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '180px',
            align: 'center',
            render: (item: AuditTableItem) => (
                <div className="flex items-center justify-center gap-2">
                    <AuditActionButtons
                        viewUrl={viewUrlPrefix ? `${viewUrlPrefix}/${item.id}` : undefined}
                        onView={onView ? () => onView(item) : undefined}
                        onEdit={onEdit ? () => onEdit(item) : undefined}
                        onDelete={onDelete ? () => onDelete(item.id) : undefined}
                        canDelete={canDelete}
                        viewTooltip={isPlanTable ? "Plan detaylarını incele" : "Denetim detaylarını incele"}
                        editTooltip={isPlanTable ? "Planı düzenle" : "Denetimi düzenle"}
                        deleteTooltip={isPlanTable ? "Planı sil" : "Denetimi sil"}
                    />
                </div>
            )
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            loading={loading}
            rowKey="id"
            paginated={false}
            emptyTitle={isPlanTable ? "Plan Bulunamadı" : "Denetim Bulunamadı"}
            emptyDescription="Kriterlere uygun herhangi bir kayıt mevcut değil."
            className="shadow-sm border border-gray-100"
        />
    );
};

export default AuditTable;
