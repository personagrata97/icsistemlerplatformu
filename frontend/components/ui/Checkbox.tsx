import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
    id: string;
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
    return (
        <div className={`flex items-center gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    id={id}
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
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
                    htmlFor={id}
                    className={`text-sm leading-tight transition-colors ${checked ? 'text-slate-900 font-medium' : 'text-slate-600'} cursor-pointer`}
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
        </div>
    );
}
