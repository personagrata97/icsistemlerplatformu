import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
    id?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    disabled?: boolean;
    className?: string;
    required?: boolean;
}

export default function Checkbox({
    id,
    checked,
    onChange,
    label,
    disabled = false,
    className = '',
    required = false
}: CheckboxProps) {
    const inputId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        onChange(e.target.checked);
    };

    return (
        <div className={`flex items-center gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    id={inputId}
                    className="sr-only"
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                />
                <div
                    onClick={() => !disabled && onChange(!checked)}
                    className={`
                        w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center
                        ${checked
                            ? 'bg-primary border-primary shadow-sm shadow-primary/20'
                            : 'bg-white border-slate-300 hover:border-primary'}
                    `}
                >
                    {checked && (
                        <Check size={14} className="text-white stroke-[3px] animate-in zoom-in-50 duration-200" />
                    )}
                </div>
            </div>
            {label && (
                <label
                    htmlFor={inputId}
                    className={`text-sm leading-tight transition-colors ${checked ? 'text-slate-900 font-medium' : 'text-slate-600'} cursor-pointer`}
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
        </div>
    );
}
