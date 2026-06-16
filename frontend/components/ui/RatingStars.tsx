import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
    level: number;
    maxLevel?: number;
    size?: number;
    className?: string;
    onRate?: (level: number) => void;
    readOnly?: boolean;
}

export default function RatingStars({
    level,
    maxLevel = 4,
    size = 14,
    className = '',
    onRate,
    readOnly = true
}: RatingStarsProps) {
    const stars = [];
    for (let i = 0; i < maxLevel; i++) {
        const isFilled = i < level;
        stars.push(
            <div
                key={i}
                onClick={() => !readOnly && onRate && onRate(i + 1)}
                className={`${!readOnly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            >
                <Star
                    size={size}
                    className={`${isFilled ? "fill-amber-400 text-amber-500" : "text-slate-200 fill-slate-100"} transition-colors`}
                />
            </div>
        );
    }

    return (
        <div className={`flex gap-0.5 items-center ${className}`}>
            {stars}
        </div>
    );
}
