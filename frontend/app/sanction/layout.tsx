'use client';

import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import { SanctionTitleProvider, useSanctionTitle } from '@/context/SanctionTitleContext';
import SanctionSidebar from '@/components/sanction/SanctionSidebar';
import AuditHeader from '@/components/audit/AuditHeader';
import '@/app/audit/audit-globals.css';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';

function DynamicSanctionHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const { title, subtitle } = useSanctionTitle();
    return (
        <AuditHeader
            title={title}
            subtitle={subtitle}
            onToggleSidebar={onToggleSidebar}
            hideSidebarToggle={false}
        />
    );
}

function SanctionLayoutContent({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div id="app" className="app-container">
            <div className="app-body">
                {/* Unified Sidebar Wrapper with Collapsible state */}
                <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-white shrink-0`}>
                    <SanctionSidebar />
                </div>

                {/* Unified Main Content Area */}
                <main className="main-content">
                    <DynamicSanctionHeader onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
            <DevRoleSwitcher />
        </div>
    );
}

export default function SanctionLayout({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <SanctionTitleProvider>
                <SanctionLayoutContent>
                    {children}
                </SanctionLayoutContent>
            </SanctionTitleProvider>
        </ToastProvider>
    );
}
