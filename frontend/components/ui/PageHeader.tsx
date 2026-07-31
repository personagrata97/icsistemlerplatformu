'use client';

import { useEffect } from 'react';
import { useAuditTitle } from '@/context/AuditTitleContext';

export default function PageHeader({ title, subtitle }: { title: string, subtitle?: string }) {
    const { setTitle, setSubtitle } = useAuditTitle();

    useEffect(() => {
        setTitle(title);
        setSubtitle(subtitle);
        // Reset title or handle unmount if necessary, but typically next page overwrites it.
    }, [title, subtitle, setTitle, setSubtitle]);

    return null;
}
