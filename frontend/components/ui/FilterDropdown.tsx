import { Filter, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import Button from './Button';

interface FilterDropdownProps {
    label?: string;
    activeCount?: number;
    onClear?: () => void;
    children: React.ReactNode;
    onApply?: () => void;
    className?: string;
}

export function FilterDropdown({
    label = 'Filtrele',
    activeCount = 0,
    onClear,
    children,
    onApply,
    className
}: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useOnClickOutside(ref, () => setIsOpen(false));

    const handleApply = () => {
        onApply?.();
        setIsOpen(false);
    };

    return (
        <div ref={ref} className={`relative ${className || ''}`}>
            <Button
                variant={activeCount > 0 ? 'primary' : 'secondary'}
                onClick={() => setIsOpen(!isOpen)}
                leftIcon={<Filter size={18} />}
                rightIcon={<ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                className=""
            >
                {label}
                {activeCount > 0 && (
                    <span className="ml-2 bg-white text-primary px-1.5 py-0.5 rounded text-xs font-bold shadow-sm border border-primary/10">
                        {activeCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-[9000] p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <span className="font-semibold text-sm text-gray-800">Detaylı Filtreler</span>
                        {onClear && (
                            <button
                                type="button"
                                onClick={() => { onClear(); }}
                                className="text-xs font-semibold text-primary hover:bg-primary/5 px-2 py-0.5 rounded transition-colors"
                            >
                                Temizle
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {children}
                    </div>

                    <div className="pt-3 mt-4 border-t border-gray-100">
                        <Button
                            onClick={handleApply}
                            className="w-full shadow-lg shadow-primary/20"
                        >
                            Uygula
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
