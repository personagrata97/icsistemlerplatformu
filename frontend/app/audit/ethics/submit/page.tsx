import PageHeader from '@/components/ui/PageHeader';
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
            <PageHeader title="Etik İhbar Bildirim Formu" subtitle="Yeni etik ihlal veya mevzuata aykırılık bildirimi oluşturma" />
            Etik Bildirim Portalına yönlendiriliyorsunuz...
        </div>
    );
}
