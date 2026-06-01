'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Shield, Search, AlertTriangle, FileText, Settings, Clock,
    ChevronDown, ChevronRight, Users, Database, Download, Globe
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: any;
    children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
    { href: '/sanction', label: 'Genel Bakış', icon: Shield },
    { href: '/sanction/scan', label: 'Müşteri Tarama', icon: Search },
    { href: '/sanction/results', label: 'Tarama Sonuçları', icon: AlertTriangle },
    {
        href: '/sanction/lists',
        label: 'Liste Yönetimi',
        icon: Database,
        children: [
            { href: '/sanction/lists/ofac', label: 'OFAC Listesi' },
            { href: '/sanction/lists/un', label: 'BM Listesi' },
            { href: '/sanction/lists/eu', label: 'AB Listesi' },
            { href: '/sanction/lists/masak', label: 'MASAK Listesi' },
            { href: '/sanction/lists/custom', label: 'Özel Listeler' },
        ]
    },
    { href: '/sanction/reports', label: 'Raporlar', icon: FileText },
    { href: '/sanction/history', label: 'Tarama Geçmişi', icon: Clock },
    { href: '/sanction/settings', label: 'Ayarlar', icon: Settings },
];

export default function SanctionSidebar() {
    const pathname = usePathname();
    const [openDropdowns, setOpenDropdowns] = useState<string[]>(['/sanction/lists']);

    const toggleDropdown = (href: string) => {
        setOpenDropdowns(prev =>
            prev.includes(href)
                ? prev.filter(h => h !== href)
                : [...prev, href]
        );
    };

    const isActive = (href: string) => {
        if (href === '/sanction') return pathname === '/sanction';
        return pathname.startsWith(href);
    };

    return (
        <aside
            className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 w-[260px]"
        >
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <Link href="/sanction" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">Yaptırım Tarayıcı</h1>
                        <p className="text-xs text-gray-500">Sanction Scanner</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
                <ul className="space-y-1">
                    {navItems.map(item => (
                        <li key={item.href}>
                            {item.children ? (
                                <div>
                                    <button
                                        onClick={() => toggleDropdown(item.href)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${isActive(item.href)
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <item.icon size={20} />
                                            <span className="font-medium">{item.label}</span>
                                        </span>
                                        {openDropdowns.includes(item.href) ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </button>
                                    {openDropdowns.includes(item.href) && (
                                        <ul className="mt-1 ml-8 space-y-1">
                                            {item.children.map(child => (
                                                <li key={child.href}>
                                                    <Link
                                                        href={child.href}
                                                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${pathname === child.href
                                                            ? 'bg-orange-50 text-orange-600 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive(item.href)
                                        ? 'bg-orange-50 text-orange-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
