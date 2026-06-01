import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    helperText?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    (
        {
            className,
            label,
            error,
            fullWidth = true,
            helperText,
            id,
            required,
            rows = 3,
            ...props
        },
        ref
    ) => {
        const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

        return (
            <div className={clsx('flex flex-col gap-1.5 w-full', fullWidth ? 'w-full' : '', className)}>
                {label && (
                    <label
                        htmlFor={textareaId}
                        className={clsx(
                            'text-sm font-semibold',
                            error ? 'text-rose-600' : 'text-slate-700'
                        )}
                    >
                        {label}
                        {required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative w-full">
                    <textarea
                        id={textareaId}
                        ref={ref}
                        rows={rows}
                        required={required}
                        className={clsx(
                            'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 resize-y',
                            'placeholder:text-slate-400',
                            error
                                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-200 text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500'
                        )}
                        {...props}
                    />
                    
                    {error && (
                        <div className="absolute right-3 top-3 flex items-start justify-center pointer-events-none text-rose-500">
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

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
