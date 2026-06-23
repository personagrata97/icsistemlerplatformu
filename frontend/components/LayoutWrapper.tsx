'use client';

import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const isEthicsSubmitPage = pathname?.startsWith('/audit/ethics/submit') || pathname?.startsWith('/ethics');
    const isResumePage = pathname?.includes('/ozgecmis');

    return (
        <main className="min-h-screen w-full">
            {children}
        </main>
    );
}
