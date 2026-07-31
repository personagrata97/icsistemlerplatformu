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

    return (
        <div className={`mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
            <div className="space-y-1">
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        {breadcrumb.map((item, idx) => (
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
                <div className="flex items-center gap-2.5">
                    {icon && <div className="text-primary shrink-0">{icon}</div>}
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {title}
                        {badge && <span className="inline-flex items-center">{badge}</span>}
                    </h1>
                </div>
                {subtitle && (
                    <p className="text-sm text-slate-500 font-normal leading-relaxed">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
