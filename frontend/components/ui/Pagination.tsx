import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
    itemUnit?: string;
}

// Custom hook for pagination logic
export function usePagination(totalItems: number, itemsPerPage: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // Reset to page 1 if totalItems changes and current page would be invalid
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalItems, totalPages, currentPage]);

    const paginationProps: PaginationProps = {
        currentPage,
        totalItems,
        itemsPerPage,
        onPageChange: setCurrentPage
    };

    return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        setCurrentPage,
        paginationProps
    };
}

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = '',
    itemUnit = 'kayıt'
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems === 0) return null;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    return (
        <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 ${className}`}>
            <div className="text-sm text-gray-500">
                Toplam <span className="font-medium">{totalItems}</span> {itemUnit} içinden <span className="font-medium">{indexOfFirstItem + 1}</span> - <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> arası gösteriliyor
            </div>
            {totalItems > itemsPerPage && (
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (totalPages > 7 && (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1)) {
                            if (Math.abs(currentPage - page) === 2) return <span key={page} className="px-1 py-1 text-gray-400">...</span>;
                            return null;
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                    ? 'bg-primary text-white border border-primary'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
