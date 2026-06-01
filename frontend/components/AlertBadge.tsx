import { clsx } from 'clsx';

interface AlertBadgeProps {
    level: 'GREEN' | 'YELLOW' | 'RED';
    size?: 'sm' | 'md';
}

export default function AlertBadge({ level, size = 'md' }: AlertBadgeProps) {
    const colors = {
        GREEN: 'badge-green',
        YELLOW: 'badge-yellow',
        RED: 'badge-red',
    };

    const labels = {
        GREEN: 'Normal',
        YELLOW: 'Uyarı',
        RED: 'Kritik',
    };

    return (
        <span className={clsx('badge', colors[level], size === 'sm' && 'text-xs px-2 py-0.5')}>
            {labels[level]}
        </span>
    );
}
