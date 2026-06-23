'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import RiskSidebar from './RiskSidebar';
import RiskHeader from './RiskHeader';
import '@/app/audit/audit-globals.css'; // Mimarideki global CSS'i paylaşıyoruz
import DevRoleSwitcher from '../DevRoleSwitcher';
import { useRiskTitle } from '@/context/RiskTitleContext';

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
                    <div className={`sidebar-wrapper ${isSidebarOpen ? 'collapsed' : ''} h-full z-40 bg-slate-900 shrink-0`}>
                        <RiskSidebar />
                    </div>
                )}
                <main className="main-content">
                    <RiskHeader
                        title={title}
                        subtitle={subtitle}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        hideSidebarToggle={!showSidebar}
                        hideLogout={!showSidebar}
                    />
                    <div className="content-area bg-gray-50/50">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(15, 23, 42, 0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 30,
                    }}
                />
            )}

            {/* Dev Helper - Enabled for testing */}
            <DevRoleSwitcher />
        </div>
    );
}
