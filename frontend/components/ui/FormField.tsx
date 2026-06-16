import React from 'react';

type FormFieldProps = {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
    className?: string;
};

const FormField: React.FC<FormFieldProps> = ({ label, required, children, error, className = '' }) => {
    return (
        <div className={`form-group flex flex-col ${className}`}>
            <label className="form-label text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};

export default FormField;
