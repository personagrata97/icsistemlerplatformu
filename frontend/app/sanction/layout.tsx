'use client';

import SanctionSidebar from '@/components/sanction/SanctionSidebar';
import AuditHeader from '@/components/audit/AuditHeader';

export default function SanctionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 uppercase-fonts-disabled">
            {/* Sidebar */}
            <SanctionSidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-[260px]">
                <AuditHeader
                    title="Yaptırım & MASAK Yönetimi"
                    subtitle="Yaptırım Taramaları, Karaliste ve Uyum Yönetimi"
                    hideSidebarToggle={true}
                />

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}


