import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ActionLinkProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary';
}

export default function ActionLink({
    href,
    onClick,
    children,
    className = '',
    variant = 'primary'
}: ActionLinkProps) {
    const baseClasses = "group inline-flex items-center font-semibold transition-all duration-200 text-sm";
    const variantClasses = {
        primary: "text-primary hover:text-primary-hover",
        secondary: "text-gray-600 hover:text-gray-900"
    };

    const content = (
        <>
            <span className="border-b border-transparent group-hover:border-current transition-colors duration-200">
                {children}
            </span>
            <ArrowRight
                size={14}
                className="ml-1 transform transition-transform duration-200 group-hover:translate-x-1"
            />
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {content}
        </button>
    );
}
