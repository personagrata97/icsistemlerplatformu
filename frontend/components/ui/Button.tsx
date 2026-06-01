import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}, ref) => {
    // Referans tasarıma (Yeni Denetim butonu) uygun base class'lar
    // rounded-2xl -> rounded-lg
    // font-black -> font-semibold
    // uppercase -> kaldırıldı (daha modern görünüm)
    const baseClasses = "inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none rounded-lg";

    const variants = {
        // btn-primary ile birebir eşleşme
        primary: "bg-[#009c45] hover:bg-[#007a36] text-white shadow-md hover:shadow-lg hover:shadow-green-900/20",

        // Diğer varyantlar da uyumlu hale getirildi ama şu an odak primary
        secondary: "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-red-900/20",
        ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-none",
        outline: "bg-transparent border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-none"
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-4 text-sm gap-2',
        lg: 'h-10 px-6 text-base gap-2.5',
    };

    return (
        <button
            ref={ref}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
