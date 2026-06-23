'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RiskTitleContextType {
    title: string;
    setTitle: (title: string) => void;
    subtitle?: string;
    setSubtitle: (subtitle?: string) => void;
}

const RiskTitleContext = createContext<RiskTitleContextType | undefined>(undefined);

export function RiskTitleProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('Genel Bakış');
    const [subtitle, setSubtitle] = useState<string | undefined>();

    return (
        <RiskTitleContext.Provider value={{ title, setTitle, subtitle, setSubtitle }}>
            {children}
        </RiskTitleContext.Provider>
    );
}

export function useRiskTitle() {
    const context = useContext(RiskTitleContext);
    if (context === undefined) {
        throw new Error('useRiskTitle must be used within a RiskTitleProvider');
    }
    return context;
}
