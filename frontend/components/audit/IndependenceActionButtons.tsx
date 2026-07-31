import React from 'react';
import { Eye, FileCheck, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import TableActions, { TableActionsItem } from '@/components/ui/TableActions';
import Tooltip from '@/components/ui/Tooltip';

interface IndependenceActionButtonsProps {
    declaration: any;
    onView: (declaration: any) => void;
    onReview?: (declaration: any) => void;
    onEdit?: (declaration: any) => void;
    onDelete?: (declaration: any) => void;
    showLabels?: boolean; // deprecated with TableActions
}

export default function IndependenceActionButtons({
    declaration,
    onView,
    onReview,
    onEdit,
    onDelete,
}: IndependenceActionButtonsProps) {
    const menuItems: TableActionsItem[] = [];

    menuItems.push({
        label: "İncele",
        icon: Eye,
        onClick: () => onView(declaration)
    });

    if (declaration.status === 'Bekliyor' && onReview) {
        menuItems.push({
            label: "İncele & Onayla",
            icon: FileCheck,
            variant: "success",
            onClick: () => onReview(declaration)
        });
    }

    if (onEdit) {
        menuItems.push({
            label: "Düzenle",
            icon: Edit2,
            onClick: () => onEdit(declaration)
        });
    }

    if (onDelete) {
        menuItems.push({
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: () => onDelete(declaration)
        });
    }

    const hasRisk = declaration.hasConflict || declaration.hasFinancialLink || declaration.hasFamilyLink;

    return (
        <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
            {hasRisk && (
                <Tooltip content="Bağımsızlık İhlali veya Risk">
                    <div className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] uppercase font-bold flex items-center gap-1.5 cursor-help">
                        <AlertTriangle size={12} />
                        Risk
                    </div>
                </Tooltip>
            )}
            <TableActions items={menuItems} />
        </div>
    );
}
