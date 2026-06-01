'use client';

import React from 'react';
import { LucideIcon, Search, FolderOpen, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    variant?: 'default' | 'search' | 'error' | 'minimal';
    className?: string;
}

export default function EmptyState({
    icon: Icon = Search,
    title = "Kayıt Bulunamadı",
    description = "Görüntülenecek veri bulunamadı veya arama kriterlerinize uygun sonuç yok.",
    action,
    variant = 'default',
    className = ''
}: EmptyStateProps) {
    const variantStyles = {
        default: {
            container: 'py-12',
            icon: 'text-gray-300',
            title: 'text-gray-700',
            description: 'text-gray-500'
        },
        search: {
            container: 'py-8',
            icon: 'text-blue-200',
            title: 'text-gray-600',
            description: 'text-gray-400'
        },
        error: {
            container: 'py-12',
            icon: 'text-red-200',
            title: 'text-red-700',
            description: 'text-red-500'
        },
        minimal: {
            container: 'py-6',
            icon: 'text-gray-200',
            title: 'text-gray-500 text-sm',
            description: 'text-gray-400 text-xs'
        }
    }[variant];

    const iconSize = variant === 'minimal' ? 32 : 56;

    return (
        <div className={`flex flex-col items-center justify-center text-center ${variantStyles.container} ${className}`}>
            <div className={`mb-4 ${variantStyles.icon}`}>
                <Icon size={iconSize} strokeWidth={1.5} />
            </div>
            <h3 className={`font-semibold mb-1 ${variantStyles.title}`}>
                {title}
            </h3>
            {description && (
                <p className={`max-w-sm ${variantStyles.description}`}>
                    {description}
                </p>
            )}
            {action && (
                <Button
                    variant={variant === 'search' ? 'ghost' : 'primary'}
                    size={variant === 'search' ? 'sm' : 'md'}
                    onClick={action.onClick}
                    leftIcon={action.icon ? <action.icon size={16} /> : undefined}
                    className={variant === 'search' ? "mt-2 text-primary hover:bg-primary/5 font-bold" : "mt-4 shadow-sm"}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// Pre-configured variants for common use cases
export function NoResultsState({
    searchTerm,
    onClear
}: {
    searchTerm?: string;
    onClear?: () => void;
}) {
    return (
        <EmptyState
            icon={Search}
            title="Sonuç bulunamadı"
            description={searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Arama kriterlerinize uygun kayıt bulunamadı.'}
            variant="search"
            action={onClear ? { label: 'Filtreleri Temizle', onClick: onClear } : undefined}
            className="py-12"
        />
    );
}

export function NoDataState({
    entityName = 'kayıt',
    onAdd
}: {
    entityName?: string;
    onAdd?: () => void;
}) {
    return (
        <EmptyState
            icon={FolderOpen}
            title={`Henüz ${entityName} yok`}
            description={`İlk ${entityName}ınızı ekleyerek başlayın.`}
            action={onAdd ? { label: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Ekle`, onClick: onAdd } : undefined}
        />
    );
}

export function ErrorState({
    message = 'Bir hata oluştu',
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon={AlertCircle}
            title="Hata"
            description={message}
            variant="error"
            action={onRetry ? { label: 'Tekrar Dene', onClick: onRetry } : undefined}
        />
    );
}
