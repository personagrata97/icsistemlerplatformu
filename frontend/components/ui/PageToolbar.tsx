'use client';

import React from 'react';
import { SearchInput } from './SearchInput';
import RefreshButton from './RefreshButton';
import { Filter, Download, Plus } from 'lucide-react';
import Button from './Button';
import Tooltip from './Tooltip';

interface PageToolbarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (val: string) => void;
    onRefresh?: () => Promise<void> | void;
    leftActions?: React.ReactNode;
    rightActions?: React.ReactNode;
    showAddButton?: boolean;
    onAddClick?: () => void;
    addButtonText?: string;
    showExportButton?: boolean;
    onExportClick?: () => void;
    filters?: React.ReactNode;
    noSearch?: boolean;
}

const PageToolbar: React.FC<PageToolbarProps> = ({
    searchPlaceholder = 'Ara...',
    searchValue,
    onSearchChange,
    onRefresh,
    leftActions,
    rightActions,
    showAddButton = false,
    onAddClick,
    addButtonText = 'Yeni Ekle',
    showExportButton = false,
    onExportClick,
    filters,
    noSearch = false
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 relative z-20">
            {/* Left Side: Search & Primary Filters */}
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
                {!noSearch && (
                    <div className="w-full md:w-[300px]">
                        <SearchInput
                            placeholder={searchPlaceholder}
                            value={searchValue || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange?.(e.target.value)}
                        />
                    </div>
                )}
                {leftActions}
            </div>

            {/* Right Side: Actions & Global Tools */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {filters}

                {showExportButton && (
                    <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={onExportClick}
                        leftIcon={<Download size={18} />}
                    >
                        Dışa Aktar
                    </Button>
                )}

                {rightActions}

                {showAddButton && (
                    <Button
                        onClick={onAddClick}
                        className="gap-2 shadow-sm whitespace-nowrap"
                        leftIcon={<Plus size={18} />}
                    >
                        {addButtonText}
                    </Button>
                )}

                {onRefresh && <RefreshButton onClick={onRefresh} />}
            </div>
        </div>
    );
};

export default PageToolbar;
