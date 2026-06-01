'use client';

import React from 'react';

interface DropdownHeaderProps {
    title: string;
    children?: React.ReactNode;
}

export default function DropdownHeader({ title, children }: DropdownHeaderProps) {
    return (
        <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center backdrop-blur-sm">
            <span className="text-sm font-bold text-gray-900 tracking-tight">{title}</span>
            {children}
        </div>
    );
}
