import React from 'react';
import StatCard from '@/components/ui/StatCard';

interface KpiCardProps {
    title: string;
    value: number;
    unit: string;
    riskLevel: 'GREEN' | 'YELLOW' | 'RED';
    change?: number;
    icon?: React.ReactNode;
}

export default function KpiCard({ title, value, unit, riskLevel, change, icon }: KpiCardProps) {
    const riskColorMap: Record<string, "green" | "yellow" | "red"> = {
        GREEN: 'green',
        YELLOW: 'yellow',
        RED: 'red',
    };

    const formatValue = () => {
        if (unit === 'YUZDE' || unit === 'ORAN') {
            return `%${(value * 100).toFixed(2)}`;
        }
        return value.toFixed(2);
    };

    const getChangeText = () => {
        if (change === undefined) return undefined;
        const arrow = change >= 0 ? '↑' : '↓';
        return `${arrow} ${Math.abs(change).toFixed(2)}% değişim`;
    };

    const getBadge = () => {
        if (riskLevel === 'GREEN') return 'Normal';
        if (riskLevel === 'YELLOW') return 'Uyarı';
        if (riskLevel === 'RED') return 'Kritik';
        return undefined;
    };

    return (
        <StatCard
            title={title}
            value={formatValue()}
            icon={icon}
            color={riskColorMap[riskLevel] || 'gray'}
            subtext={getChangeText()}
            badgeText={getBadge()}
        // Badge rengi otomatik olarak color prop'undan (red/green/yellow) gelecek
        />
    );
}
