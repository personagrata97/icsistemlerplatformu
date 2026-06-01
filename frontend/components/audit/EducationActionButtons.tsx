import React from 'react';
import { Eye, Edit2, Trash2, AlertCircle } from 'lucide-react';
import ActionMenu, { ActionMenuItem } from '@/components/ui/ActionMenu';

interface EducationActionButtonsProps {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onResolve?: () => void;
    isOverdue?: boolean;
    showLabels?: boolean; // Deprecated with ActionMenu
}

const EducationActionButtons: React.FC<EducationActionButtonsProps> = ({
    onView,
    onEdit,
    onDelete,
    onResolve,
    isOverdue = false,
}) => {
    const menuItems: ActionMenuItem[] = [];

    if (isOverdue && onResolve) {
        menuItems.push({
            label: "Aksiyon (Gecikmiş)",
            icon: AlertCircle,
            variant: "danger",
            onClick: onResolve
        });
    }

    if (onView) {
        menuItems.push({
            label: "İncele",
            icon: Eye,
            onClick: onView
        });
    }

    if (onEdit) {
        menuItems.push({
            label: "Düzenle",
            icon: Edit2,
            onClick: onEdit
        });
    }

    if (onDelete) {
        menuItems.push({
            label: "Sil",
            icon: Trash2,
            variant: "danger",
            onClick: onDelete
        });
    }

    return (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
            <ActionMenu items={menuItems} />
        </div>
    );
};

export default EducationActionButtons;
