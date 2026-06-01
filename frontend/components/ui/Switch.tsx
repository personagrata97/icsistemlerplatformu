import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    activeColor?: string;
    className?: string;
}

export default function Switch({
    checked,
    onChange,
    label,
    disabled = false,
    activeColor = 'bg-primary',
    className = ''
}: SwitchProps) {
    return (
        <label className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <div className={`relative inline-flex items-center group`}>
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />
                <div
                    className={`w-11 h-6 transition-colors duration-200 ease-in-out rounded-full shadow-inner ${checked ? activeColor : 'bg-gray-300'}`}
                >
                    <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'} group-active:scale-95`}
                    />
                </div>
            </div>
            {label && (
                <span className={`text-sm font-bold tracking-tight transition-colors ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {label}
                </span>
            )}
        </label>
    );
}
