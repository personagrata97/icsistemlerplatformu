import React from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';

export interface CapacityCardProps {
    id: string | number;
    name: string;
    title?: string;
    activeCount: number;
    activeAssignments?: { title: string; role: string; startDate?: string; endDate?: string }[];
    maxCapacity?: number;
    href?: string;
    onClick?: () => void;
}

export default function CapacityCard({
    id,
    name,
    title = 'Personel',
    activeCount = 0,
    activeAssignments = [],
    maxCapacity = 4,
    href,
    onClick
}: CapacityCardProps) {
    // Dynamic Calculations
    const capacityPercentage = Math.min((activeCount / maxCapacity) * 100, 100);
    
    // Status Logic
    const isOverloaded = activeCount >= maxCapacity;
    const isIdle = activeCount === 0;
    const isPartial = !isIdle && !isOverloaded;

    // Badge styling based on state
    let badgeText = 'Uygun';
    let badgeStyle = 'bg-emerald-100 text-emerald-700';
    let barStyle = 'bg-emerald-500';

    if (isOverloaded) {
        badgeText = 'Kritik Yük';
        badgeStyle = 'bg-rose-100 text-rose-700';
        barStyle = 'bg-rose-500';
    } else if (isPartial) {
        badgeText = 'Görevde';
        badgeStyle = 'bg-sky-100 text-sky-700';
        barStyle = 'bg-sky-500';
    }

    const initials = name.substring(0, 2).toUpperCase();

    const tooltipContent = activeAssignments.length > 0 ? (
        <div className="space-y-1">
            <div className="font-bold border-b border-white/20 pb-1 mb-1">{name} - Aktif Görevler</div>
            <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {activeAssignments.map((al, i) => (
                    <div key={i} className="flex flex-col mb-1.5 last:mb-0">
                        <span className="truncate max-w-[200px]" title={al.title}>{al.title}</span>
                        <span className="text-[10px] text-emerald-300">{al.role}</span>
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <span>Aktif Görev Bulunmuyor</span>
    );

    const CardContent = (
        <div 
            onClick={onClick}
            className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all group h-full ${onClick || href ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                        {initials}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-sky-600 transition-colors">{name}</h4>
                        <span className="text-[11px] text-gray-500">{title}</span>
                    </div>
                </div>
                <span className={`${badgeStyle} text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors`}>
                    {badgeText}
                </span>
            </div>
            <div>
                <div className="flex justify-between text-xs mb-1.5">
                    <Tooltip content={tooltipContent} position="top">
                        <span className="text-gray-500 font-medium cursor-help border-b border-dashed border-gray-300 hover:text-sky-600 transition-colors">
                            Aktif Görev: {activeCount}
                        </span>
                    </Tooltip>
                    <span className="text-gray-700 font-bold">%{capacityPercentage}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-700 ease-out ${barStyle}`}
                        style={{ width: `${capacityPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block h-full outline-none focus:ring-2 focus:ring-sky-500 rounded-xl">
                {CardContent}
            </Link>
        );
    }

    return CardContent;
}
