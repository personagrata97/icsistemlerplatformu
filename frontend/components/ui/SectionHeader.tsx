import React from 'react';
import { LucideIcon } from 'lucide-react';

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    rightContent?: React.ReactNode;
    className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon: Icon, rightContent, className = '' }) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 ${className}`}>
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Icon className="text-indigo-600" size={18} />
                    </div>
                )}
                <div>
                    <h3 className="font-bold text-gray-800 leading-tight flex items-center gap-2">
                        {title}
                    </h3>
                    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {rightContent && (
                <div className="flex items-center gap-2">
                    {rightContent}
                </div>
            )}
        </div>
    );
};

export default SectionHeader;
