'use client';

import React, { useState } from 'react';
import PortalSidebar from './PortalSidebar';
import AuditHeader from '../audit/AuditHeader';
import '@/app/audit/audit-globals.css';
import { useAuditTitle } from '@/context/AuditTitleContext';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { title, subtitle } = useAuditTitle();

    return (
        <div id="app" className="app-container">
            <div className="app-body">
                <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-white shrink-0`}>
                    <PortalSidebar />
                </div>
                <main className="main-content">
                    <AuditHeader
                        title={title || 'Birim Portalı'}
                        subtitle={subtitle}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        hideSidebarToggle={false}
                        hideLogout={false}
                    />
                    <div className="content-area">
                        {children}
                    </div>
                </main>
            </div>

            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 40,
                    }}
                />
            )}
        </div>
    );
}
