'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    ShieldAlert, FileText, History, Settings, User, 
    LogOut, Bell, Shield, BookOpen, Key
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ORG } from '@/lib/org-config';
import NotificationDropdown from './NotificationDropdown';
import Tooltip from '@/components/ui/Tooltip';
import UserInfo from '@/components/UserInfo';

const ROLE_MAP: Record<string, string> = {
    'ADMIN': 'Sistem Yöneticisi',
    'SYSTEM_ADMIN': 'Sistem Yöneticisi',
    'AUDIT_ADMIN': 'Denetim Yöneticisi',
    'AUDIT_MANAGER': 'Müdür',
    'AUDIT_SUPERVISOR': 'Gözetim Sorumlusu',
    'AUDIT_INSPECTOR': 'Müfettiş',
    'AUDIT_UNIT': 'Denetlenen Birim',
    'AUDIT_VIEWER': 'İzleyici',
    'BOARD': 'Yönetim Kurulu'
};

export default function AppHeader() {
    const { user, hasRole, logout } = useAuth();
    const pathname = usePathname();

    const isAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const isAuditor = hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_INSPECTOR');

    return (
        <header className="app-header">
            {/* Logo ve Marka */}
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                        <Shield size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none text-white">{ORG.platformName}</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{ORG.departmentName}</p>
                    </div>
                </Link>
            </div>

            {/* Global Menü (Context Bağımsız Öğeler) */}
            <div className="flex items-center gap-8">
                <nav className="hidden md:flex items-center gap-1">
                    {/* Knowledge Base */}
                    {isAuditor && (
                        <Tooltip content="Bilgi Bankası" position="bottom">
                            <Link 
                                href="/audit/knowledge-base" 
                                className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${pathname.includes('knowledge-base') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                            >
                                <BookOpen size={18} />
                                <span className="text-sm font-medium">Mevzuat</span>
                            </Link>
                        </Tooltip>
                    )}


                </nav>

                <div className="w-px h-8 bg-gray-700 mx-2 hidden md:block"></div>

                {/* Kullanıcı ve İşlemler */}
                <div className="flex items-center gap-3">
                    <NotificationDropdown textColor="text-gray-300" badgeRingColor="ring-[#0b1120]" />
                    
                    {user && (
                        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-700">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-white leading-none">{user.displayName}</p>
                                <p className="text-xs text-gray-400 mt-1">{ROLE_MAP[user.roles[0]] || user.roles[0]?.replace('AUDIT_', '') || 'Kullanıcı'}</p>
                            </div>
                            
                            {/* Çıkış */}
                            <Tooltip content="Çıkış Yap" position="bottom">
                                <button onClick={logout} className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
