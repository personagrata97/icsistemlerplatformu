'use client';
import SanctionSidebar from '@/components/sanction/SanctionSidebar';
import UserInfo from '@/components/UserInfo';
import Link from 'next/link';
import { Home, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SanctionLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();

    return (
        <div className="flex min-h-screen bg-gray-50 uppercase-fonts-disabled">
            {/* Sidebar */}
            <SanctionSidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-[260px]">
                <header
                    className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 flex items-center justify-between h-16"
                >
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors"
                        >
                            <Home size={18} />
                            <span className="text-sm font-medium">Ana Sayfa</span>
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors"
                        >
                            <Settings size={18} />
                            <span className="text-sm font-medium">Ayarlar</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <UserInfo />
                        <button
                            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
                            onClick={() => logout()}
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Çıkış</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}


