'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import LoadingState from './LoadingState';
import EmptyState, { NoResultsState } from './EmptyState';
import Pagination, { usePagination } from './Pagination';
import { LucideIcon, Calendar, Clock, User as UserIcon, Mail, Phone, Info } from 'lucide-react';
import { formatDate, formatDateTime, getPhotoUrl } from '@/lib/audit-utils';
import CodeBadge from './CodeBadge';
import StatusBadge from './StatusBadge';
import UserCell from './UserCell';
import OverflowTooltip from './OverflowTooltip';
import Tooltip from './Tooltip';

export interface Column<T> {
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    type?: 'text' | 'date' | 'datetime' | 'currency' | 'status' | 'risk' | 'code' | 'user' | 'number' | 'percentage' | 'email' | 'phone' | 'filesize' | (string & {});
    render?: (item: T, index: number) => React.ReactNode;
    sortable?: boolean;
    infoTooltip?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyIcon?: LucideIcon;
    emptyTitle?: string;
    emptyDescription?: string;
    onRowClick?: (item: T) => void;
    rowKey: keyof T | ((item: T) => string);
    className?: string;
    stickyHeader?: boolean;
    striped?: boolean;
    hoverable?: boolean;
    // Pagination
    paginated?: boolean;
    itemsPerPage?: number;
    itemUnit?: string;
    // Manual/Server-side Pagination
    manualPagination?: boolean;
    totalItems?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    // Selection
    selectable?: boolean;
    selectedKeys?: Set<string>;
    onSelectionChange?: (keys: Set<string>) => void;
    // Styling
    rowClassName?: (item: T) => string;
    // Sorting
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (columnKey: string) => void;
    // Header
    title?: string;
    description?: string;
    rightElement?: React.ReactNode;
    onClearFilters?: () => void;
    searchTerm?: string;
}

export default function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyIcon,
    emptyTitle = 'Kayıt bulunamadı',
    emptyDescription = 'Arama kriterlerinizi değiştirin veya yeni kayıt ekleyin.',
    onRowClick,
    rowKey,
    className = '',
    stickyHeader = false,
    striped = false,
    hoverable = true,
    paginated = false,
    itemsPerPage = 10,
    itemUnit = 'kayıt',
    manualPagination = false,
    totalItems: externalTotalItems,
    currentPage: externalCurrentPage,
    onPageChange,
    selectable = false,
    selectedKeys = new Set(),
    onSelectionChange,
    rowClassName,
    sortColumn,
    sortDirection,
    onSort,
    title,
    description,
    rightElement,
    onClearFilters,
    searchTerm
}: DataTableProps<T>) {
    // Internal sorting state for autonomous mode
    const [internalSortCol, setInternalSortCol] = React.useState<string | undefined>(sortColumn);
    const [internalSortDir, setInternalSortDir] = React.useState<'asc' | 'desc' | undefined>(sortDirection);

    // Sync internal state with props if provided
    React.useEffect(() => {
        if (sortColumn !== undefined) setInternalSortCol(sortColumn);
        if (sortDirection !== undefined) setInternalSortDir(sortDirection);
    }, [sortColumn, sortDirection]);

    const handleSort = (columnKey: string) => {
        if (onSort) {
            onSort(columnKey);
            return;
        }

        // Autonomous sorting logic
        if (internalSortCol === columnKey) {
            setInternalSortDir(internalSortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setInternalSortCol(columnKey);
            setInternalSortDir('asc');
        }
    };

    // Derived sorted data
    const sortedData = React.useMemo(() => {
        if (onSort || !internalSortCol || !internalSortDir) return data;

        return [...data].sort((a, b) => {
            const aVal = (a as any)[internalSortCol];
            const bVal = (b as any)[internalSortCol];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            // Use localeCompare for strings (Turkish support)
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const comparison = aVal.localeCompare(bVal, 'tr');
                return internalSortDir === 'asc' ? comparison : -comparison;
            }

            // Default comparison for other types
            const comparison = aVal > bVal ? 1 : -1;
            return internalSortDir === 'asc' ? comparison : -comparison;
        });
    }, [data, internalSortCol, internalSortDir, onSort]);

    // Client-side pagination hook using potentially sorted data
    const clientPagination = usePagination(sortedData.length, itemsPerPage);

    // Choose between client-side and manual/server-side pagination logic
    const activeSortCol = onSort ? sortColumn : internalSortCol;
    const activeSortDir = onSort ? sortDirection : internalSortDir;

    const currentPage = manualPagination ? (externalCurrentPage ?? 1) : clientPagination.currentPage;
    const totalItems = manualPagination ? (externalTotalItems ?? sortedData.length) : sortedData.length;
    const startIndex = manualPagination ? 0 : clientPagination.startIndex;
    const endIndex = manualPagination ? sortedData.length : clientPagination.endIndex;

    const paginationProps = manualPagination ? {
        currentPage,
        totalItems,
        itemsPerPage,
        itemUnit,
        onPageChange: onPageChange ?? (() => { })
    } : { ...clientPagination.paginationProps, itemUnit };

    const displayData = (paginated && !manualPagination) ? sortedData.slice(startIndex, endIndex) : sortedData;

    const getRowKey = (item: T): string => {
        if (typeof rowKey === 'function') {
            return rowKey(item);
        }
        return String(item[rowKey]);
    };

    // --- Search term highlighting utility ---
    const highlightText = (text: string): React.ReactNode => {
        if (!searchTerm || !text) return text;
        const query = searchTerm.toLocaleLowerCase('tr-TR');
        const lowerText = text.toLocaleLowerCase('tr-TR');
        const idx = lowerText.indexOf(query);
        if (idx === -1) return text;

        const before = text.slice(0, idx);
        const match = text.slice(idx, idx + query.length);
        const after = text.slice(idx + query.length);
        return (
            <>
                {before}
                <mark className="bg-yellow-200 text-inherit rounded-sm px-0.5">{match}</mark>
                {typeof after === 'string' && after.length > 0 ? highlightText(after) : null}
            </>
        );
    };

    const renderCellContent = (item: T, col: Column<T>) => {
        const val = (item as any)[col.key];

        if (col.type === 'code') {
            const alignClass = col.align === 'left' ? 'mr-auto' : col.align === 'right' ? 'ml-auto' : 'mx-auto';
            return <CodeBadge code={String(val ?? '-')} className={alignClass} />;
        }

        if (val === null || val === undefined || val === '') return <span className="text-gray-300">-</span>;

        const alignClass = col.align === 'left' ? '!justify-start' : col.align === 'right' ? '!justify-end' : '!justify-center';

        switch (col.type) {
            case 'date':
                return (
                    <div className={`cell-date ${alignClass}`}>
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(val)}
                    </div>
                );
            case 'datetime':
                return (
                    <div className={`cell-date ${alignClass}`}>
                        <Calendar size={14} className="text-gray-400" />
                        {formatDateTime(val)}
                    </div>
                );
            case 'currency':
                return <span className="font-mono font-medium">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(val))}</span>;
            case 'number':
                return <span className="font-mono">{Number(val).toLocaleString('tr-TR')}</span>;
            case 'percentage':
                return <span className="font-mono">%{Number(val).toLocaleString('tr-TR')}</span>;
            case 'status':
                return <StatusBadge type="status" value={String(val)} />;
            case 'risk':
                return <StatusBadge type="risk" value={String(val)} />;
            case 'email':
                return (
                    <div className={`flex items-center gap-1.5 text-gray-500 ${alignClass}`}>
                        <Mail size={14} className="shrink-0 text-gray-400" />
                        <span className="text-sm">{String(val)}</span>
                    </div>
                );
            case 'phone':
                return (
                    <div className={`flex items-center gap-1.5 text-gray-500 ${alignClass}`}>
                        <Phone size={14} className="shrink-0 text-gray-400" />
                        <span className="text-sm">{String(val)}</span>
                    </div>
                );
            case 'filesize':
                const formatSize = (v: any) => {
                    if (v === null || v === undefined || v === '') return '-';
                    const bytes = Number(v);
                    if (isNaN(bytes)) return String(v);
                    if (bytes === 0) return '0 KB';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
                return (
                    <span className="font-mono text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 border border-slate-200/60 rounded inline-block">
                        {formatSize(val)}
                    </span>
                );
            case 'user':
                const userObj = val && typeof val === 'object' ? val : item as any;
                const nameStr = typeof val === 'object' ? (val.displayName || val.name || `${val.firstName || ''} ${val.lastName || ''}`.trim() || 'İsimsiz') : String(val);
                const titleStr = typeof val === 'object' ? val.title : (item as any).title;
                const photoUrlStr = typeof val === 'object' ? val.photoUrl : (item as any).photoUrl;
                const userAlignClass = col.align === 'left' ? 'justify-start' : col.align === 'right' ? 'justify-end' : 'justify-center';
                return (
                    <div className="w-full">
                        <UserCell name={nameStr} title={titleStr} avatarUrl={photoUrlStr ? getPhotoUrl(photoUrlStr) || undefined : undefined} className={userAlignClass} />
                    </div>
                );
            default:
                const textVal = String(val);
                return (
                    <OverflowTooltip content={textVal} className="cell-title max-w-[200px] text-left hover:text-primary transition-colors inline-block">
                        {highlightText(textVal)}
                    </OverflowTooltip>
                );
        }
    };

    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const allKeys = data.map(item => getRowKey(item));
        const allSelected = allKeys.every(key => selectedKeys.has(key));

        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(allKeys));
        }
    };

    const handleSelectRow = (key: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedKeys);
        if (newSelection.has(key)) {
            newSelection.delete(key);
        } else {
            newSelection.add(key);
        }
        onSelectionChange(newSelection);
    };

    const allSelected = data.length > 0 && data.every(item => selectedKeys.has(getRowKey(item)));
    const someSelected = data.some(item => selectedKeys.has(getRowKey(item))) && !allSelected;

    if (loading) {
        return (
            <LoadingState 
                message={title ? `${title} yükleniyor...` : "Veriler yükleniyor..."} 
                className="bg-white/50 rounded-xl"
            />
        );
    }

    if (data.length === 0) {
        if (onClearFilters) {
            return (
                <div className={`card !p-0 overflow-hidden ${className}`}>
                    {(title || rightElement) && (
                        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                            <div className="flex items-center gap-2">
                                {title && <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>}
                                {description && <p className="text-xs text-slate-500 font-medium mt-1">{description}</p>}
                            </div>
                            {rightElement && (
                                <div className="flex items-center gap-2">
                                    {rightElement}
                                </div>
                            )}
                        </div>
                    )}
                    <NoResultsState 
                        searchTerm={searchTerm} 
                        onClear={onClearFilters} 
                    />
                </div>
            );
        }
        return (
            <div className={`card !p-0 overflow-hidden ${className}`}>
                {(title || rightElement) && (
                    <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-2">
                            {title && <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>}
                            {description && <p className="text-xs text-slate-500 font-medium mt-1">{description}</p>}
                        </div>
                        {rightElement && (
                            <div className="flex items-center gap-2">
                                {rightElement}
                            </div>
                        )}
                    </div>
                )}
                <div className="p-8">
                    <EmptyState
                        icon={emptyIcon}
                        title={emptyTitle}
                        description={emptyDescription}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`card !p-0 overflow-hidden ${className}`}>
            {(title || rightElement) && (
                <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                    <div>
                        {title && <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>}
                        {description && <p className="text-xs text-slate-500 font-medium mt-1">{description}</p>}
                    </div>
                    {rightElement && (
                        <div className="flex items-center gap-2">
                            {rightElement}
                        </div>
                    )}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        <tr>
                            {selectable && (
                                <th className="tbl-header w-12 !p-0">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width }}
                                    className={`tbl-header ${col.align === 'right' ? '!text-right' : col.align === 'left' ? '!text-left' : '!text-center'} ${col.sortable ? 'cursor-pointer select-none hover:brightness-95 transition-all' : ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                                        {col.header}
                                        {col.infoTooltip && (
                                            <Tooltip content={col.infoTooltip}>
                                                <Info size={14} className="text-gray-400 cursor-help" />
                                            </Tooltip>
                                        )}
                                        {col.sortable && (
                                            <span className={`text-[10px] ${activeSortCol === col.key ? 'text-primary opacity-100 font-bold' : 'text-gray-400 opacity-40'}`}>
                                                {activeSortCol === col.key ? (activeSortDir === 'asc' ? '▲' : '▼') : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={striped ? 'divide-y divide-gray-100' : ''}>
                        {displayData.map((item, index) => {
                            const key = getRowKey(item);
                            const isSelected = selectedKeys.has(key);

                            return (
                                <tr
                                    key={key}
                                    onClick={() => onRowClick?.(item)}
                                    className={`
                                        tbl-row
                                        ${striped && index % 2 === 1 ? 'bg-gray-50/30' : ''}
                                        ${onRowClick ? 'cursor-pointer' : ''}
                                        ${isSelected ? 'bg-primary/5' : ''}
                                        ${rowClassName ? rowClassName(item) : ''}
                                        group
                                    `}
                                >
                                    {selectable && (
                                        <td className="!py-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(key)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => {
                                        const rendered = col.render
                                            ? col.render(item, startIndex + index)
                                            : renderCellContent(item, col);
                                        const isActionCol = col.key === 'actions' || col.key === 'action';
                                        return (
                                            <td
                                                key={col.key}
                                                className={`${col.align === 'right' ? '!text-right' : col.align === 'left' ? '!text-left' : '!text-center'}`}
                                            >
                                                {isActionCol ? (
                                                    <div className={`w-full flex items-center ${col.align === 'right' ? 'justify-end' : col.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                                                        {rendered}
                                                    </div>
                                                ) : rendered}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {paginated && (
                <Pagination {...paginationProps} />
            )}
        </div>
    );
}

// Re-export for convenience
export { usePagination };
