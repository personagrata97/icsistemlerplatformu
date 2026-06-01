import { Eye, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ActionMenu, { ActionMenuItem } from '@/components/ui/ActionMenu';

interface AuditActionButtonsProps {
    viewUrl?: string;
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
    className?: string; // no longer fully determining horizontal layout but kept for compatibility
    showLabels?: boolean; // deprecated with ActionMenu, kept for prop compatibility
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

    const menuItems: ActionMenuItem[] = [];

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
            <ActionMenu items={menuItems} />
        </div>
    );
};

export default AuditActionButtons;
