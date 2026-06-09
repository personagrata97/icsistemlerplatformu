'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuditSidebar from './AuditSidebar';
import AuditHeader from './AuditHeader';
import '@/app/audit/audit-globals.css';
import DevRoleSwitcher from '../DevRoleSwitcher';

import { useAuditTitle } from '@/context/AuditTitleContext';
import { usePathname } from 'next/navigation';

export default function AuditLayout(props: { children: React.ReactNode, title?: string, hideSidebar?: boolean }) {
    return (
        <AuditLayoutContent {...props} />
    );
}

function AuditLayoutContent({ children, title: initialTitle = "Genel Bakış", hideSidebar: forceHideSidebar = false }: { children: React.ReactNode, title?: string, hideSidebar?: boolean }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { hasRole } = useAuth();
    const { title, subtitle } = useAuditTitle();
    // Add path check
    const pathname = usePathname();
    const isPublicEthics = pathname?.startsWith('/audit/ethics/submit');
    const isCVPage = pathname?.endsWith('/ozgecmis');

    // If it's a public ethic submission or a professional CV page, render cleanly without the audit shell
    // IMPORTANT: Do NOT use main-content/content-area classes here - they add flex/overflow/padding that breaks centering
    if (isPublicEthics || isCVPage) {
        return (
            <div style={{ width: '100%', minHeight: '100vh' }}>
                {children}
            </div>
        );
    }

    const isAuditor = hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_INSPECTOR');
    const isSystemAdmin = hasRole('SYSTEM_ADMIN');
    const isUnit = hasRole('AUDIT_UNIT') || hasRole('AUDIT_VIEWER');
    
    // Hide sidebar for Standard Employees OR if explicitly hidden via props
    // Auditors, System Admins, and Units ALWAYS see the sidebar
    const showSidebar = !forceHideSidebar && (isAuditor || isSystemAdmin || isUnit);

    // Override title for portal users if it's the default "Genel Bakış"
    // This provides a more specific portal name for limited users
    const displayTitle = !showSidebar && title === "Genel Bakış" ? "Teftiş Kurulu Portalı" : title;

    return (
        <div id="app" className="app-container">
            <div className="app-body">
                {showSidebar && (
                    <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-white shrink-0`}>
                        <AuditSidebar />
                    </div>
                )}
                <main className="main-content">
                    <AuditHeader
                        title={displayTitle}
                        subtitle={subtitle}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        hideSidebarToggle={!showSidebar}
                        hideLogout={!showSidebar}
                    />
                    <div className="content-area">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
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
                        display: 'none' // Hidden by default, CSS media query should handle this for mobile
                    }}
                />
            )}

            {/* Dev Helper - Enabled for testing */}
            <DevRoleSwitcher />
        </div>
    );
}
