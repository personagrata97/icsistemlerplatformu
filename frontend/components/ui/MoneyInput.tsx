import React, { forwardRef } from 'react';
import FormInput, { FormInputProps } from './FormInput';

export interface MoneyInputProps extends Omit<FormInputProps, 'leftIcon' | 'type'> {
    currency?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
    ({ currency = '₺', ...props }, ref) => {
        return (
            <FormInput
                ref={ref}
                type="number"
                step="0.01"
                leftIcon={<span className="font-bold text-slate-400">{currency}</span>}
                inputClassName="font-mono"
                {...props}
            />
        );
    }
);

MoneyInput.displayName = 'MoneyInput';
export default MoneyInput;
