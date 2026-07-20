import React from 'react';
import Link from 'next/link';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import OverflowTooltip from '@/components/ui/OverflowTooltip';

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
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {code ? (
                    <div className="w-[110px] shrink-0 overflow-hidden">
                        <CodeBadge code={code} className="w-full text-center truncate" />
                    </div>
                ) : icon ? (
                    <div className="w-[110px] shrink-0 flex items-center justify-center">
                        {icon}
                    </div>
                ) : null}
                <div className="flex flex-col min-w-0 flex-1 border-l border-gray-100 pl-4 py-0.5">
                    <OverflowTooltip content={title} className="text-sm text-gray-700 font-medium group-hover:text-emerald-600 transition-colors">
                        {title}
                    </OverflowTooltip>
                    {subtitle && (
                        <OverflowTooltip content={subtitle} className="text-xs text-gray-400 mt-0.5">
                            {subtitle}
                        </OverflowTooltip>
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
