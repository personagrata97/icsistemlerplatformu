'use client';

import RiskSidebar from '@/components/RiskSidebar'
import Link from 'next/link'
import { Settings, LogOut, Home } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import UserInfo from '@/components/UserInfo'
import Tooltip from '@/components/ui/Tooltip'

export default function RiskLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { logout } = useAuth();

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <RiskSidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header matches Audit: White bg, bottom border, height 64px, padding 0 2rem */}
                <header className="h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
                    <h1 className="text-[1.25rem] font-semibold text-gray-900">Risk Yönetimi</h1>

                    <div className="flex items-center gap-6">
                        {/* User Info Section: Simple text like Audit */}
                        <div className="text-right hidden md:block text-sm">
                            <UserInfo />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {/* Home Button */}
                            <Tooltip content="Ana Ekrana Dön">
                                <Link
                                    href="/"
                                    className="p-2 text-gray-500 hover:text-primary transition-colors"
                                >
                                    <Home size={18} />
                                </Link>
                            </Tooltip>
                            {/* Settings Button: icon only, gray, hover primary */}
                            <Tooltip content="Ayarlar">
                                <Link
                                    href="/settings"
                                    className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                                >
                                    <Settings size={18} />
                                </Link>
                            </Tooltip>
                            {/* Logout Button: icon only */}
                            <Tooltip content="Çıkış Yap">
                                <button
                                    onClick={() => logout()}
                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <LogOut size={18} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

