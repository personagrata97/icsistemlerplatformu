import React from 'react';
import Link from 'next/link';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';

export interface DashboardListItemProps {
    href?: string;
    code?: string;
    icon?: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    status?: string;
    rightContent?: React.ReactNode;
    className?: string;
}

export default function DashboardListItem({ 
    href, 
    code, 
    icon,
    title, 
    subtitle, 
    status,
    rightContent,
    className = ''
}: DashboardListItemProps) {
    const Content = (
        <div className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all group ${className}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {code ? (
                    <CodeBadge code={code} />
                ) : icon ? (
                    <div className="shrink-0">
                        {icon}
                    </div>
                ) : null}
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm text-gray-700 font-medium line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {title}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-gray-400 mt-0.5 truncate">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
                {rightContent}
                {status && <StatusBadge value={status} />}
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block w-full">{Content}</Link>;
    }
    
    return Content;
}
