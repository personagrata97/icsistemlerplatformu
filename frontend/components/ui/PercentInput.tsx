import React, { forwardRef } from 'react';
import FormInput, { FormInputProps } from './FormInput';

export interface PercentInputProps extends Omit<FormInputProps, 'leftIcon' | 'type'> {}

export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
    (props, ref) => {
        return (
            <FormInput
                ref={ref}
                type="number"
                step="0.1"
                leftIcon={<span className="font-bold text-slate-400">%</span>}
                inputClassName="font-mono"
                {...props}
            />
        );
    }
);

PercentInput.displayName = 'PercentInput';
export default PercentInput;
