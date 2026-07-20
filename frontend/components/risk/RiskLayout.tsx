'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import RiskSidebar from './RiskSidebar';
import AuditHeader from '@/components/audit/AuditHeader';
import '@/app/audit/audit-globals.css';
import DevRoleSwitcher from '../DevRoleSwitcher';
import { useRiskTitle } from '@/context/RiskTitleContext';

/**
 * RiskLayout — AuditLayout ile birebir aynı yapı.
 * Aynı CSS sınıfları, aynı header bileşeni, aynı sidebar wrapper.
 */
export default function RiskLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { hasRole } = useAuth();
    const { title, subtitle } = useRiskTitle();

    // Risk yöneticileri ve analistleri sidebar'ı görür
    const isRiskAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const isRiskStaff = isRiskAdmin || hasRole('RISK_MANAGER') || hasRole('RISK_ANALYST');
    const isExecutive = isRiskAdmin || hasRole('EXECUTIVE');

    const showSidebar = isRiskStaff || isExecutive;

    return (
        <div id="app" className="app-container">
            <div className="app-body">
                {showSidebar && (
                    <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-white shrink-0`}>
                        <RiskSidebar />
                    </div>
                )}
                <main className="main-content">
                    <AuditHeader
                        title={title}
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
                        display: 'none'
                    }}
                />
            )}

            {/* Dev Helper */}
            <DevRoleSwitcher />
        </div>
    );
}
