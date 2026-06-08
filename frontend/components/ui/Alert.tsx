import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

export interface AlertProps {
    variant?: AlertVariant;
    title: string;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md';
}

const variantStyles: Record<AlertVariant, { wrapper: string, iconWrapper: string, iconColor: string, titleColor: string, descColor: string, DefaultIcon: any }> = {
    info: {
        wrapper: 'bg-blue-50 border-blue-200',
        iconWrapper: 'text-blue-600',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        descColor: 'text-blue-800',
        DefaultIcon: Info
    },
    warning: {
        wrapper: 'bg-orange-50 border-orange-200',
        iconWrapper: 'text-orange-600',
        iconColor: 'text-orange-600',
        titleColor: 'text-orange-900',
        descColor: 'text-orange-800',
        DefaultIcon: AlertTriangle
    },
    error: {
        wrapper: 'bg-red-50 border-red-200',
        iconWrapper: 'text-red-600',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        descColor: 'text-red-800',
        DefaultIcon: AlertCircle
    },
    success: {
        wrapper: 'bg-green-50 border-green-200',
        iconWrapper: 'text-green-600',
        iconColor: 'text-green-600',
        titleColor: 'text-green-900',
        descColor: 'text-green-800',
        DefaultIcon: CheckCircle
    }
};

export default function Alert({ 
    variant = 'info', 
    title, 
    description, 
    icon, 
    action, 
    className = '',
    size = 'md'
}: AlertProps) {
    const styles = variantStyles[variant];
    const isSm = size === 'sm';
    const IconComponent = icon || <styles.DefaultIcon size={isSm ? 18 : 24} className={styles.iconColor} />;

    return (
        <div className={`border flex items-center justify-between shadow-sm ${styles.wrapper} ${className} ${isSm ? 'rounded-lg p-3' : 'rounded-xl p-4'}`}>
            <div className={`flex items-center ${isSm ? 'gap-3' : 'gap-4'}`}>
                <div className={`bg-white rounded-lg shadow-sm shrink-0 ${styles.iconWrapper} ${isSm ? 'p-2' : 'p-3'}`}>
                    {IconComponent}
                </div>
                <div>
                    <h3 className={`${isSm ? 'text-sm font-semibold' : 'text-lg font-bold'} ${styles.titleColor}`}>{title}</h3>
                    {description && (
                        <div className={`${isSm ? 'text-xs mt-0.5' : 'text-sm mt-1'} ${styles.descColor}`}>
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {action && (
                <div className="shrink-0 ml-4">
                    {action}
                </div>
            )}
        </div>
    );
}
