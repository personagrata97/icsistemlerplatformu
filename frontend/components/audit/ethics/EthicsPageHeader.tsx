import React from 'react';
import { BackButton } from '@/components/ui/BackButton';

interface EthicsPageHeaderProps {
    title: string;
    backUrl?: string;
    onBack?: () => void;
    rightContent?: React.ReactNode;
    variant?: 'blue' | 'green';
}

export const EthicsPageHeader: React.FC<EthicsPageHeaderProps> = ({
    title,
    backUrl,
    onBack,
    rightContent,
    variant = 'blue'
}) => {
    return (
        <div className="mb-8 flex items-center justify-between">
            <BackButton
                href={backUrl}
                onClick={onBack}
            />

            <div className="text-right flex flex-col items-end">
                {/* <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span> */}
                <div className={`h-1.5 w-12 rounded-full mt-1 ${variant === 'green' ? 'bg-primary' : 'bg-blue-500'}`} />
                {rightContent && <div className="mt-2">{rightContent}</div>}
            </div>
        </div>
    );
};
