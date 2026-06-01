import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
    id: string;
    label: string;
    icon?: LucideIcon;
    disabled?: boolean;
    disabledTooltip?: string;
}

interface SegmentedTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export default function SegmentedTabs({ tabs, activeTab, onChange, className = '' }: SegmentedTabsProps) {
    return (
        <div className={`bg-slate-100 p-1.5 rounded-lg inline-flex items-center gap-1 ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && onChange(tab.id)}
                        disabled={tab.disabled}
                        title={tab.disabled ? tab.disabledTooltip : undefined}
                        className={`
                            px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2
                            ${isActive
                                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                : tab.disabled
                                    ? 'text-gray-400 opacity-60 cursor-not-allowed bg-slate-100/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-slate-200/50'
                            }
                        `}
                    >
                        {Icon && <Icon size={16} className={isActive ? 'text-primary' : (tab.disabled ? 'text-gray-400' : 'text-gray-500')} />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
