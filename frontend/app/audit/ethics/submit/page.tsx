'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditEthicsSubmitRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/ethics');
    }, [router]);

    return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-slate-500 font-medium text-sm">
            Etik Bildirim Portalına yönlendiriliyorsunuz...
        </div>
    );
}
