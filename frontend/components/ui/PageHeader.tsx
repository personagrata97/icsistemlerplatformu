'use client';

import React, { useEffect } from 'react';
import { useAuditTitle } from '@/context/AuditTitleContext';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    breadcrumb?: BreadcrumbItem[];
    badge?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    icon,
    actions,
    breadcrumb,
    badge,
    className = ''
}: PageHeaderProps) {
    const { setTitle, setSubtitle } = useAuditTitle();

    useEffect(() => {
        setTitle(title);
        setSubtitle(subtitle);
    }, [title, subtitle, setTitle, setSubtitle]);

    const hasBreadcrumb = breadcrumb && breadcrumb.length > 0;
    const hasActions = Boolean(actions);

    if (!hasBreadcrumb && !hasActions) {
        return null;
    }

    return (
        <div className={`mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
            <div>
                {hasBreadcrumb && (
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        {breadcrumb!.map((item, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
                                {item.href ? (
                                    <Link href={item.href} className="hover:text-primary transition-colors">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="text-slate-700 font-medium">{item.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
            </div>
            {hasActions && (
                <div className="flex items-center gap-3 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
