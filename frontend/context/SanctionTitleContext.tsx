'use client';

import React, { createContext, useContext, useState } from 'react';

interface SanctionTitleContextType {
    title: string;
    subtitle: string;
    setTitle: (title: string) => void;
    setSubtitle: (subtitle: string) => void;
}

const SanctionTitleContext = createContext<SanctionTitleContextType>({
    title: 'Yaptırım Kokpiti',
    subtitle: 'Anlık yaptırım taramaları ve MASAK uyum göstergeleri',
    setTitle: () => {},
    setSubtitle: () => {},
});

export const SanctionTitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [title, setTitle] = useState('Yaptırım Kokpiti');
    const [subtitle, setSubtitle] = useState('Anlık yaptırım taramaları ve MASAK uyum göstergeleri');

    return (
        <SanctionTitleContext.Provider value={{ title, subtitle, setTitle, setSubtitle }}>
            {children}
        </SanctionTitleContext.Provider>
    );
};

export const useSanctionTitle = () => useContext(SanctionTitleContext);
