import React from 'react';

type InfoItemProps = {
    label: string;
    value: React.ReactNode;
    className?: string;
};

const InfoItem: React.FC<InfoItemProps> = ({ label, value, className = '' }) => {
    return (
        <div className={`flex flex-col ${className}`}>
            <span className="text-xs text-slate-500 font-medium mb-1">{label}</span>
            <span className="text-sm text-slate-800 font-semibold">{value || '-'}</span>
        </div>
    );
};

export default InfoItem;
