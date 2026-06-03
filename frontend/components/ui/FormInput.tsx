import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';
import DatePicker from './DatePicker';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    helperText?: string;
    inputClassName?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    (
        {
            className,
            label,
            error,
            leftIcon,
            rightIcon,
            fullWidth = true,
            helperText,
            inputClassName,
            id,
            required,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

        return (
            <div className={clsx('flex flex-col gap-1.5 w-full', fullWidth ? 'w-full' : '', className)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className={clsx(
                            'text-sm font-semibold',
                            error ? 'text-rose-600' : 'text-slate-700'
                        )}
                    >
                        {label}
                        {required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                )}

                        {leftIcon && (
                            <div className="absolute left-3 flex items-center justify-center pointer-events-none text-slate-400">
                                {leftIcon}
                            </div>
                        )}
                        
                        <input
                            id={inputId}
                            ref={ref}
                            required={required}
                            className={clsx(
                                'flex-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200',
                                'placeholder:text-slate-400',
                                leftIcon && 'pl-9',
                                rightIcon && 'pr-9',
                                inputClassName,
                                error
                                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                    : 'border-slate-200 text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500',
                            )}
                            {...props}
                        />

                        {rightIcon && (
                            <div className="absolute right-3 flex items-center justify-center text-slate-400">
                                {rightIcon}
                            </div>
                        )}
                        
                        {error && !rightIcon && (
                            <div className="absolute right-3 flex items-center justify-center pointer-events-none text-rose-500">
                                <AlertCircle size={16} />
                            </div>
                        )}
                    </div>

                {(error || helperText) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {error ? (
                            <span className="text-xs font-medium text-rose-500">{error}</span>
                        ) : (
                            <span className="text-xs text-slate-500">{helperText}</span>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

export default FormInput;
