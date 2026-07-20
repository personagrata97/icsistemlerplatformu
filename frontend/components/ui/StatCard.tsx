import React from 'react';
import Link from 'next/link';
import EntityIcon from '@/components/ui/EntityIcon';
import { EntityType, ENTITY_CONFIG, getColorClasses } from '@/lib/entity-config';

import Tooltip from '@/components/ui/Tooltip';
import { Info } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: React.ReactNode;
    icon?: any;
    entityType?: EntityType;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange' | 'gray' | 'rose' | 'amber' | 'emerald' | 'primary' | 'indigo';
    href?: string;
    subtext?: string;
    badgeText?: string;
    badgeColor?: string;
    infoTooltip?: string;
    breakdowns?: { label: string; value: number }[];
    onClick?: () => void;
    children?: React.ReactNode;
    valueClassName?: string;
    className?: string;
}

const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconText: 'text-blue-600', badgeBg: 'bg-blue-50', badgeText: 'text-blue-600', ring: 'hover:ring-2 hover:ring-blue-500' },
    green: { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconText: 'text-green-600', badgeBg: 'bg-green-50', badgeText: 'text-green-600', ring: 'hover:ring-2 hover:ring-green-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600', badgeBg: 'bg-yellow-50', badgeText: 'text-yellow-600', ring: 'hover:ring-2 hover:ring-yellow-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconText: 'text-purple-600', badgeBg: 'bg-purple-50', badgeText: 'text-purple-600', ring: 'hover:ring-2 hover:ring-purple-500' },
    red: { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-100', iconText: 'text-red-600', badgeBg: 'bg-red-50', badgeText: 'text-red-600', ring: 'hover:ring-2 hover:ring-red-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-100', iconText: 'text-orange-600', badgeBg: 'bg-orange-50', badgeText: 'text-orange-600', ring: 'hover:ring-2 hover:ring-orange-500' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', iconBg: 'bg-gray-100', iconText: 'text-gray-600', badgeBg: 'bg-gray-100', badgeText: 'text-gray-600', ring: 'hover:ring-2 hover:ring-gray-500' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-100', iconText: 'text-rose-900', badgeBg: 'bg-rose-50', badgeText: 'text-rose-900', ring: 'hover:ring-2 hover:ring-rose-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconText: 'text-amber-600', badgeBg: 'bg-amber-50', badgeText: 'text-amber-600', ring: 'hover:ring-2 hover:ring-amber-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', ring: 'hover:ring-2 hover:ring-emerald-500' },
    primary: { bg: 'bg-primary/5', border: 'border-primary/20', iconBg: 'bg-primary/10', iconText: 'text-primary', badgeBg: 'bg-primary/10', badgeText: 'text-primary', ring: 'hover:ring-2 hover:ring-primary/50' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600', ring: 'hover:ring-2 hover:ring-indigo-500' },
};

export default function StatCard({
    title,
    value,
    icon,
    entityType,
    color = 'blue',
    href,
    subtext,
    badgeText,
    badgeColor,
    infoTooltip,
    breakdowns,
    className = '',
    onClick,
    children,
    valueClassName = 'text-2xl font-bold text-gray-800 tracking-tight'
}: StatCardProps) {
    const config = entityType ? ENTITY_CONFIG[entityType] : null;
    const themeColor = config ? config.color : color;
    const theme = colorMap[themeColor as keyof typeof colorMap] || colorMap.blue;

    const processBreakdowns = () => {
        if (!breakdowns || breakdowns.length === 0) return null;

        // Backend genellikle sıralı gönderir ama biz yine de garantileyelim
        const sorted = [...breakdowns].sort((a, b) => b.value - a.value);

        if (sorted.length <= 6) return sorted;

        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5);
        const othersSum = others.reduce((acc, curr) => acc + curr.value, 0);

        return [
            ...top5,
            { label: `Diğer (+${others.length})`, value: othersSum, isOther: true }
        ];
    };

    const processedBreakdowns = processBreakdowns();

    const breakdownContent = processedBreakdowns ? (
        <div className="flex flex-col gap-1.5 min-w-[160px] p-1">
            <div className="text-[11px] uppercase font-extrabold tracking-widest text-slate-600 mb-1.5 border-b border-slate-200/80 pb-1.5">DAĞILIM ÖZETİ</div>
            {processedBreakdowns.map((b: any, i) => (
                <div key={i} className={`flex items-center justify-between gap-6 ${b.isOther ? 'mt-1 pt-1.5 border-t border-gray-100/60' : ''}`}>
                    <span className={`${b.isOther ? 'text-gray-400 italic' : 'text-gray-500'} font-medium text-[13px] line-clamp-1`}>{b.label}</span>
                    <span className="font-bold text-gray-800 text-[13px] tabular-nums">{b.value}</span>
                </div>
            ))}
        </div>
    ) : null;

    const isInteractive = !!(onClick || href);

    const CardContent = (
        <div className={`bg-white p-4 rounded-xl border ${theme.border} shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 h-full ${className} ${isInteractive ? `cursor-pointer hover:scale-[1.02] ${theme.ring}` : ''}`} onClick={onClick}>
            {/* Decorative Corner */}
            <div className={`absolute right-0 top-0 w-24 h-24 ${theme.bg} rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110`}></div>

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[72px]">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        {(() => {
                            if (entityType) {
                                return (
                                    <div className={`p-2 rounded-lg ${theme.iconBg} transition-transform group-hover:scale-105 duration-300`}>
                                        <EntityIcon type={entityType} size={20} variant="text-only" />
                                    </div>
                                );
                            }
                            if (!icon) return null;
                            return (
                                <div className={`p-2 rounded-lg ${theme.iconBg} ${theme.iconText} transition-transform group-hover:scale-105 duration-300`}>
                                    {React.isValidElement(icon) ? icon : (() => {
                                        const Icon: any = icon;
                                        return <Icon size={20} />;
                                    })()}
                                </div>
                            );
                        })()}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors truncate">{String(title || '')}</span>
                            {infoTooltip && (
                                <Tooltip content={infoTooltip} position="top">
                                    <Info size={14} className="text-gray-400 hover:text-primary cursor-help shrink-0 outline-none" />
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className={valueClassName}>{value !== undefined && value !== null ? value : ''}</span>
                        {badgeText && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor || `${theme.badgeBg} ${theme.badgeText}`}`}>
                                {badgeText}
                            </span>
                        )}
                    </div>
                </div>

                {subtext && (
                    <p className="text-xs text-gray-400 mt-2 font-medium group-hover:text-gray-500 transition-colors">{String(subtext || '')}</p>
                )}

                {children && <div className="mt-3">{children}</div>}
            </div>
        </div>
    );

    let element = CardContent;

    if (breakdownContent) {
        element = (
            <Tooltip content={breakdownContent} position="top" delay={200}>
                {element}
            </Tooltip>
        );
    }

    if (href) {
        element = (
            <Link href={href} className="block h-full no-underline outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 rounded-xl">
                {element}
            </Link>
        );
    }

    return element;
}
