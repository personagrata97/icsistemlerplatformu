import { Filter, ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: undefined as number | undefined, bottom: undefined as number | undefined, right: undefined as number | undefined, maxHeight: 400, isCalculated: false });

    useEffect(() => {
        if (!isOpen) {
            setPosition(prev => ({ ...prev, isCalculated: false }));
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            
            // Eğer tıklanan element portal içindeyse (örn: CustomSelect dropdown'ı), kapatma.
            if (target.closest('[data-ignore-outside-clicks="true"]')) {
                return;
            }

            if (triggerRef.current && !triggerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsOpen(false);
            }
        };

        const handleScroll = (event: Event) => {
            if (event.target !== window && event.target !== document) return;
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', () => setIsOpen(false));
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', () => setIsOpen(false));
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const updatePosition = () => {
                if (triggerRef.current) {
                    const rect = triggerRef.current.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const spaceAbove = rect.top;
                    const dropdownHeight = 450; 

                    const openUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

                    setPosition({
                        top: openUpwards ? undefined : rect.bottom + 4,
                        bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
                        right: window.innerWidth - rect.right,
                        maxHeight: openUpwards ? Math.max(spaceAbove - 20, 200) : Math.max(spaceBelow - 20, 200),
                        isCalculated: true
                    });
                }
            };

            updatePosition();
            requestAnimationFrame(updatePosition);
        }
    }, [isOpen]);

    const handleApply = () => {
        onApply?.();
        setIsOpen(false);
    };

    return (
        <div ref={triggerRef} className={`relative ${className || ''}`}>
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

            {isOpen && position.isCalculated && typeof document !== 'undefined' && createPortal(
                <div 
                    ref={dropdownRef}
                    className="fixed w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-[9000] p-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col"
                    style={{
                        ...(position.top !== undefined ? { top: position.top } : {}),
                        ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
                        ...(position.right !== undefined ? { right: position.right } : {}),
                        maxHeight: position.maxHeight
                    }}
                >
                    <div className="flex justify-between items-center mb-4 border-b pb-2 flex-shrink-0">
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

                    <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1 pl-1 -ml-1">
                        {children}
                    </div>

                    <div className="pt-3 mt-4 border-t border-gray-100 flex-shrink-0">
                        <Button
                            onClick={handleApply}
                            className="w-full shadow-lg shadow-primary/20"
                        >
                            Uygula
                        </Button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
