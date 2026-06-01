import React from 'react';

interface CodeBadgeProps {
    code: string | undefined | null;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    className?: string;
}

const CodeBadge: React.FC<CodeBadgeProps> = ({
    code,
    size = 'md',
    variant = 'primary',
    className = ''
}) => {
    if (!code) return <span className="text-gray-300 italic text-xs">-</span>;

    const baseStyles = "font-medium rounded inline-flex items-center justify-center whitespace-nowrap";

    // Size variants
    const sizeStyles = {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-1",
        lg: "text-sm px-2.5 py-1.5"
    }[size];

    // Color/Style variants
    const variantStyles = {
        primary: "text-emerald-700 bg-emerald-50 border border-emerald-100", // Updated to match user request
        secondary: "bg-gray-100 text-gray-700 border border-gray-200", // Neutral
        outline: "bg-transparent text-primary border border-primary/20",
        ghost: "bg-transparent text-gray-500 hover:text-gray-900"
    }[variant];

    return (
        <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}>
            {code}
        </span>
    );
};

export default CodeBadge;
