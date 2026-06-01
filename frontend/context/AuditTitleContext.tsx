'use client';

import React, { createContext, useContext, useState } from 'react';

interface AuditTitleContextType {
    title: string;
    setTitle: (title: string) => void;
    subtitle?: string;
    setSubtitle: (subtitle: string | undefined) => void;
    trashCount: number;
    refreshTrashCount: () => Promise<void>;
}

const AuditTitleContext = createContext<AuditTitleContextType | undefined>(undefined);

export function AuditTitleProvider({ children }: { children: React.ReactNode }) {
    const [title, setTitle] = useState('Genel Bakış');
    const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
    const [trashCount, setTrashCount] = useState(0);

    const refreshTrashCount = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) return; // Skip API call if no token exists

        try {
            // Dynamically import to avoid circular deps if any, though likely fine here
            const { auditApi } = await import('@/lib/audit-api');
            const [audits, findings] = await Promise.all([
                auditApi.getDeletedAudits().catch(() => []),
                auditApi.getDeletedFindings().catch(() => [])
            ]);

            // Filter logic to match TrashPage's default view
            // We only count items that would be visible in the default Trash view
            // This ensures "Soldaki" (Page Title) and "Sağdaki" (Header Badge) match.
            const validAudits = Array.isArray(audits) ? audits : [];
            const validFindings = Array.isArray(findings) ? findings : [];

            setTrashCount(validAudits.length + validFindings.length);
        } catch (error) {
            console.error('Failed to refresh trash count:', error);
        }
    };

    // Initial load
    React.useEffect(() => {
        refreshTrashCount();
    }, []);

    return (
        <AuditTitleContext.Provider value={{ title, setTitle, subtitle, setSubtitle, trashCount, refreshTrashCount }}>
            {children}
        </AuditTitleContext.Provider>
    );
}

export function useAuditTitle() {
    const context = useContext(AuditTitleContext);
    if (context === undefined) {
        throw new Error('useAuditTitle must be used within an AuditTitleProvider');
    }
    return context;
}
