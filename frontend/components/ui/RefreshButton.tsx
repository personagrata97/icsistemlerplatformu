import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Tooltip from './Tooltip';


interface RefreshButtonProps {
    onClick: () => Promise<void> | void;
    className?: string;
    title?: string;
    loading?: boolean;
}

export default function RefreshButton({ onClick, className = '', title = 'Yenile', loading = false }: RefreshButtonProps) {
    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = loading || localLoading;

    const handleClick = async () => {
        if (isLoading) return;
        setLocalLoading(true);
        try {
            await onClick();
        } finally {
            setTimeout(() => {
                setLocalLoading(false);
            }, 500);
        }
    };

    return (
        <Tooltip content={title}>
            <button
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed !shadow-sm bg-white hover:bg-gray-50 border border-gray-200 ${className}`}
            >
                <RefreshCw
                    size={18}
                    className={`${isLoading ? 'animate-spin' : ''}`}
                />
            </button>
        </Tooltip>
    );
}
