import React from 'react';

export interface RadioOption {
    value: string;
    label: React.ReactNode;
    description?: string;
    disabled?: boolean;
}

interface RadioGroupProps {
    name?: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    direction?: 'horizontal' | 'vertical';
    className?: string;
}

export default function RadioGroup({
    name = `radio-group-${Math.random().toString(36).substring(2, 9)}`,
    options,
    value,
    onChange,
    label,
    direction = 'vertical',
    className = ''
}: RadioGroupProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>}
            <div className={`flex ${direction === 'horizontal' ? 'flex-row gap-4' : 'flex-col gap-2'}`}>
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`flex items-start gap-3 cursor-pointer select-none ${
                            option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => !option.disabled && onChange(option.value)}
                            disabled={option.disabled}
                            className="mt-0.5 h-4 w-4 text-primary border-slate-300 focus:ring-primary"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{option.label}</span>
                            {option.description && (
                                <span className="text-xs text-slate-500">{option.description}</span>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
