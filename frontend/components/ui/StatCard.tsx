import React from 'react';
import Link from 'next/link';

interface StatCardProps {
    title: string;
    value: React.ReactNode;
    icon?: any;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange' | 'gray' | 'rose' | 'amber' | 'emerald' | 'primary' | 'indigo';
    href?: string;
    subtext?: string;
    badgeText?: string;
    badgeColor?: string; // Optional custom badge color class
    onClick?: () => void;
    children?: React.ReactNode;
    valueClassName?: string;
    className?: string;
}

const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconText: 'text-blue-600', badgeBg: 'bg-blue-50', badgeText: 'text-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconText: 'text-green-600', badgeBg: 'bg-green-50', badgeText: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600', badgeBg: 'bg-yellow-50', badgeText: 'text-yellow-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconText: 'text-purple-600', badgeBg: 'bg-purple-50', badgeText: 'text-purple-600' },
    red: { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-100', iconText: 'text-red-600', badgeBg: 'bg-red-50', badgeText: 'text-red-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-100', iconText: 'text-orange-600', badgeBg: 'bg-orange-50', badgeText: 'text-orange-600' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', iconBg: 'bg-gray-100', iconText: 'text-gray-600', badgeBg: 'bg-gray-100', badgeText: 'text-gray-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-100', iconText: 'text-rose-900', badgeBg: 'bg-rose-50', badgeText: 'text-rose-900' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconText: 'text-amber-600', badgeBg: 'bg-amber-50', badgeText: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600' },
    primary: { bg: 'bg-primary/5', border: 'border-primary/20', iconBg: 'bg-primary/10', iconText: 'text-primary', badgeBg: 'bg-primary/10', badgeText: 'text-primary' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600' },
};

export default function StatCard({
    title,
    value,
    icon,
    color = 'blue',
    href,
    subtext,
    badgeText,
    badgeColor,
    className = '',
    onClick,
    children,
    valueClassName = 'text-2xl font-bold text-gray-800 tracking-tight'
}: StatCardProps) {
    const theme = colorMap[color] || colorMap.blue;

    const Content = () => (
        <div className={`bg-white p-4 rounded-xl border ${theme.border} shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 h-full ${className} ${onClick ? 'cursor-pointer' : ''}`}>
            {/* Decorative Corner */}
            <div className={`absolute right-0 top-0 w-24 h-24 ${theme.bg} rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110`}></div>

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[72px]">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        {(() => {
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
                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">{String(title || '')}</span>
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

    if (href) {
        return (
            <Link href={href} className="block h-full no-underline outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 rounded-xl">
                <Content />
            </Link>
        );
    }

    if (onClick) {
        return (
            <div onClick={onClick} role="button" tabIndex={0} className="outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 rounded-xl h-full">
                <Content />
            </div>
        );
    }

    return <Content />;
}
