'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    href?: string;
    onClick?: () => void;
    label?: string;
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
    href,
    onClick,
    label = 'Geri Dön',
    className = ''
}) => {
    // Dynamic label generator based on navigation target to ensure global automatic labeling
    let displayLabel = label;
    if (label === 'Geri Dön') {
        if (href === '/audit') {
            displayLabel = 'Denetimlere Geri Dön';
        } else if (href === '/audit/staff') {
            displayLabel = 'Çalışan Listesine Geri Dön';
        } else if (href === '/audit/ethics') {
            displayLabel = 'Etik İhbar Yönetimine Geri Dön';
        } else if (href === '/ethics' || onClick) {
            displayLabel = 'İhbar Hattına Geri Dön';
        }
    }

    const content = (
        <>
            <ArrowLeft
                size={18}
                className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            <span>{displayLabel}</span>
        </>
    );

    const baseClass = `
        group inline-flex items-center gap-2 
        text-sm font-bold text-gray-500 
        hover:text-primary transition-colors 
        cursor-pointer
        ${className}
    `;

    if (href) {
        return (
            <Link href={href} className={baseClass}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={baseClass}>
            {content}
        </button>
    );
};
