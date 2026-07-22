'use client';

import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import SanctionSidebar from '@/components/sanction/SanctionSidebar';
import AuditHeader from '@/components/audit/AuditHeader';
import '@/app/audit/audit-globals.css';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';

export default function SanctionLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ToastProvider>
            <div id="app" className="app-container">
                <div className="app-body">
                    {/* Unified Sidebar Wrapper */}
                    <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-white shrink-0`}>
                        <SanctionSidebar />
                    </div>

                    {/* Unified Main Content Area */}
                    <main className="main-content">
                        <AuditHeader
                            title="Yaptırım & MASAK Yönetimi"
                            subtitle="MASAK, OFAC ve BM Yaptırım Taramaları, Karaliste ve Uyum Yönetimi"
                        />
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </div>
                <DevRoleSwitcher />
            </div>
        </ToastProvider>
    );
}
