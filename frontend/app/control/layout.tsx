'use client';

import React, { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import ControlSidebar from '@/components/control/ControlSidebar';
import AuditHeader from '@/components/audit/AuditHeader';
import '@/app/audit/audit-globals.css';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';
import { AuditTitleProvider, useAuditTitle } from '@/context/AuditTitleContext';

export default function ControlLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ToastProvider>
            <AuditTitleProvider>
                <ControlLayoutContent>
                    {children}
                </ControlLayoutContent>
            </AuditTitleProvider>
        </ToastProvider>
    );
}

function ControlLayoutContent({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { title, subtitle } = useAuditTitle();

    return (
        <div id="app" className="app-container">
            <div className="app-body">
                <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-white shrink-0`}>
                    <ControlSidebar />
                </div>
                <main className="main-content">
                    <AuditHeader
                        title={title || "İç Kontrol Merkezi"}
                        subtitle={subtitle || "İç Kontrol Merkezi — Süreç İçi Kontrol ve Risk İzleme Platformu"}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                    <div className="content-area">
                        {children}
                    </div>
                </main>
            </div>
            <DevRoleSwitcher />
        </div>
    );
}
