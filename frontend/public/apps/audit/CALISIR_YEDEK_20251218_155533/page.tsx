'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function AuditPage() {
    const searchParams = useSearchParams();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Get 'view' param or default to 'dashboard'
    const view = searchParams.get('view') || 'dashboard';

    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            // Post message to iframe
            iframeRef.current.contentWindow.postMessage({
                type: 'NAVIGATE',
                page: view
            }, '*');
        }
    }, [view]);

    return (
        <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
            <iframe
                ref={iframeRef}
                src="/apps/audit/index_fixed.html"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Denetim Yönetim Sistemi"
                onLoad={() => {
                    // Send initial navigation when loaded
                    if (iframeRef.current && iframeRef.current.contentWindow) {
                        iframeRef.current.contentWindow.postMessage({
                            type: 'NAVIGATE',
                            page: view
                        }, '*');
                    }
                }}
            />
        </div>
    );
}
