'use client';
import ActionMenu, { ActionMenuItem } from './ActionMenu';

export interface TableActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
    disabled?: boolean;
    hidden?: boolean;
}

export interface TableActionsProps {
    actions: TableActionItem[];
    buttonSize?: number;
    variant?: 'default' | 'ghost' | 'outline';
    className?: string;
}

export function TableActions({ actions, buttonSize = 20, variant = 'default', className = '' }: TableActionsProps) {
    return <ActionMenu items={actions as ActionMenuItem[]} buttonSize={buttonSize} variant={variant} className={className} />;
}

export default TableActions;
