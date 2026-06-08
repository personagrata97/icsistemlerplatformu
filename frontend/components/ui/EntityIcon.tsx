import React from 'react';
import { ENTITY_CONFIG, EntityType, getColorClasses } from '@/lib/entity-config';

interface EntityIconProps {
    type: EntityType;
    size?: number;
    className?: string;
    variant?: 'pill' | 'solid' | 'text-only' | 'badge';
}

export default function EntityIcon({ type, size = 20, className = '', variant = 'pill' }: EntityIconProps) {
    const config = ENTITY_CONFIG[type];
    if (!config) return null;

    const colors = getColorClasses(config.color);
    const Icon = config.icon;

    if (variant === 'pill') {
        return (
            <div className={`p-2 rounded-lg ${colors.bg} ${className}`}>
                <Icon className={colors.text} size={size} />
            </div>
        );
    }

    if (variant === 'badge') {
        return (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} border ${className}`}>
                <Icon size={size > 16 ? 14 : size} />
                <span>{config.label}</span>
            </div>
        );
    }

    if (variant === 'solid') {
        // e.g. for buttons or heavily filled avatars
        return (
            <div className={`p-2 rounded-lg bg-${config.color}-600 text-white ${className}`}>
                <Icon size={size} />
            </div>
        );
    }

    // text-only
    return <Icon className={`${colors.text} ${className}`} size={size} />;
}
