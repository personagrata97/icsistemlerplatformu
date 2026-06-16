import React from 'react';
import ActionLink from '@/components/ui/ActionLink';
import EntityIcon from '@/components/ui/EntityIcon';
import { EntityType, ENTITY_CONFIG } from '@/lib/entity-config';
import Tooltip from '@/components/ui/Tooltip';
import { Info } from 'lucide-react';

// Widget türleri Entity türleriyle örtüşüyor, ancak dashboarda özel isimlendirmeler için bir mapper:
export type WidgetType = 'audits' | 'findings' | 'status' | 'risk' | 'actions' | 'activities' | 'metrics' | 'heatmap' | 'trend' | 'reports' | 'skills';

export interface DashboardWidgetProps {
    widgetType?: WidgetType;
    
    // Overrides
    title?: string;
    subtitle?: string;
    icon?: React.ElementType; // Sadece zorunlu override için
    color?: string; // Sadece zorunlu override için
    variant?: 'card' | 'transparent';
    infoTooltip?: string;
    
    actionHref?: string;
    actionLabel?: string;
    children: React.ReactNode;
    className?: string;
}

const widgetTypeToEntityMap: Record<WidgetType, EntityType> = {
    audits: 'AUDIT',
    findings: 'FINDING',
    status: 'REPORT', // Denetim Durumu -> PieChart (Report)
    risk: 'RISK',
    actions: 'ACTION',
    activities: 'ACTIVITY',
    metrics: 'METRIC',
    heatmap: 'HEATMAP',
    trend: 'TREND',
    reports: 'REPORT',
    skills: 'USER'
};

const widgetTypeTitles: Record<WidgetType, string> = {
    audits: 'Devam Eden Denetimler',
    findings: 'Son Bulgular',
    status: 'Denetim Durumu',
    risk: 'Bulgu Risk Dağılımı',
    actions: 'Bekleyen Aksiyonlar',
    activities: 'Son Denetim İzleri',
    metrics: 'Kalite Metrikleri',
    heatmap: 'Risk Isı Haritası',
    trend: 'Trend Analizi',
    reports: 'Raporlar',
    skills: 'Yetkinlik Matrisi'
};

const COLOR_MAP: Record<string, { bg: string, text: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' }
};

export default function DashboardWidget({
    widgetType,
    title,
    subtitle,
    icon: CustomIcon,
    color: customColor,
    variant = 'card',
    infoTooltip,
    actionHref,
    actionLabel,
    children,
    className = ''
}: DashboardWidgetProps) {
    const entityType = widgetType ? widgetTypeToEntityMap[widgetType] : 'DASHBOARD';
    const displayTitle = title || (widgetType ? widgetTypeTitles[widgetType] : 'Widget');
    
    const containerClass = variant === 'card' ? `card h-full flex flex-col ${className}` : `mb-8 ${className}`;

    return (
        <div className={containerClass}>
            <div className={`flex justify-between items-start shrink-0 mb-${subtitle ? '6' : '4'}`}>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {CustomIcon ? (
                            <div className={`p-2 rounded-lg ${customColor && COLOR_MAP[customColor] ? COLOR_MAP[customColor].bg : 'bg-primary/10'}`}>
                                <CustomIcon className={`${customColor && COLOR_MAP[customColor] ? COLOR_MAP[customColor].text : 'text-primary'}`} size={20} />
                            </div>
                        ) : (
                            <EntityIcon type={entityType} size={20} variant="pill" />
                        )}
                        <span className="truncate">{displayTitle}</span>
                        {infoTooltip && (
                            <Tooltip content={infoTooltip} position="top">
                                <Info size={16} className="text-gray-400 hover:text-primary cursor-help shrink-0 outline-none" />
                            </Tooltip>
                        )}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-gray-400 mt-1 font-medium">{subtitle}</p>
                    )}
                </div>
                {actionHref && actionLabel && (
                    <ActionLink href={actionHref} variant="primary">{actionLabel}</ActionLink>
                )}
            </div>
            <div className={variant === 'card' ? "flex-1 flex flex-col" : ""}>
                {children}
            </div>
        </div>
    );
}
