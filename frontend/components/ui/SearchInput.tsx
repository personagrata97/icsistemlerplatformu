import React from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import Tooltip from './Tooltip';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
    containerClassName?: string;
    onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, onClear, value, onChange, ...props }, ref) => {
        const hasValue = value !== undefined && value !== null && String(value).length > 0;

        const handleClear = () => {
            if (onClear) {
                onClear();
            } else if (onChange) {
                const event = {
                    target: { value: '' }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
            }
        };

        return (
            <div className={clsx("relative", containerClassName)}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    onChange={onChange}
                    className={clsx(
                        "pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full shadow-sm transition-all",
                        className
                    )}
                    {...props}
                />
                {hasValue && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <Tooltip content="Aramayı Temizle" position="top">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
        );
    }
);

SearchInput.displayName = 'SearchInput';
