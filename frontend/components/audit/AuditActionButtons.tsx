import { Eye, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TableActions, { TableActionsItem } from '@/components/ui/TableActions';

interface AuditActionButtonsProps {
    viewUrl?: string;
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
    className?: string; // no longer fully determining horizontal layout but kept for compatibility
    showLabels?: boolean; // deprecated with TableActions, kept for prop compatibility
    viewTooltip?: string;
    editTooltip?: string;
    deleteTooltip?: string;
}

const AuditActionButtons: React.FC<AuditActionButtonsProps> = ({
    viewUrl,
    onView,
    onEdit,
    onDelete,
    canDelete = false,
    viewTooltip = "İncele",
    editTooltip = "Düzenle",
    deleteTooltip = "Sil"
}) => {
    const router = useRouter();

    const menuItems: TableActionsItem[] = [];

    if (viewUrl || onView) {
        menuItems.push({
            label: viewTooltip,
            icon: Eye,
            onClick: () => {
                if (onView) onView();
                else if (viewUrl) router.push(viewUrl);
            }
        });
    }

    if (onEdit) {
        menuItems.push({
            label: editTooltip,
            icon: Edit2,
            onClick: onEdit
        });
    }

    if (onDelete && canDelete) {
        menuItems.push({
            label: deleteTooltip,
            icon: Trash2,
            variant: 'danger',
            onClick: onDelete
        });
    }

    return (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
            <TableActions items={menuItems} />
        </div>
    );
};

export default AuditActionButtons;
