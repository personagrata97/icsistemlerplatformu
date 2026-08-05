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
    ({ className, containerClassName, onClear, value, onChange, placeholder = 'Ara...', ...props }, ref) => {
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
            <div className={clsx("relative flex items-center w-full", containerClassName)}>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={clsx(
                        "w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-sm outline-none transition-all duration-200",
                        "placeholder:text-slate-400 text-slate-900",
                        "focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300",
                        className
                    )}
                    {...props}
                />
                {hasValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center z-10"
                        title="Aramayı Temizle"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        );
    }
);

SearchInput.displayName = 'SearchInput';
