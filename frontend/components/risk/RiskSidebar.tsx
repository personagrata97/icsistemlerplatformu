'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, ROLES } from '@/context/AuthContext';
import { 
    LayoutDashboard, 
    ShieldAlert, 
    Activity, 
    Droplets, 
    Target, 
    Zap, 
    FileText, 
    Database,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

export default function RiskSidebar() {
    const pathname = usePathname();
    const { hasRole } = useAuth();
    
    // Risk Yönetimi için yetki kontrolleri
    const isRiskAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
    const isRiskManager = isRiskAdmin || hasRole('RISK_MANAGER'); // Varsayılan risk yetkileri
    const isExecutive = isRiskAdmin || hasRole('EXECUTIVE');
    
    // Alt menü durumları
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        'raporlama': true
    });

    const toggleMenu = (menu: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const navItems = [
        { 
            name: 'Risk Kokpiti', 
            href: '/risk/cockpit', 
            icon: LayoutDashboard,
            show: true 
        },
        { 
            name: 'Kredi Riski', 
            href: '/risk/credit', 
            icon: Activity,
            show: isRiskManager || isExecutive 
        },
        { 
            name: 'Likidite Riski', 
            href: '/risk/liquidity', 
            icon: Droplets,
            show: isRiskManager || isExecutive 
        },
        { 
            name: 'Konsantrasyon', 
            href: '/risk/concentration', 
            icon: Target,
            show: isRiskManager || isExecutive 
        },
        { 
            name: 'Stres Testleri', 
            href: '/risk/stress-testing', 
            icon: Zap,
            show: isRiskManager || isExecutive 
        },
        {
            name: 'Yasal Raporlama',
            icon: FileText,
            show: isRiskManager || isExecutive,
            children: [
                { name: 'BDDK BVTS', href: '/risk/regulatory/bddk' },
                { name: 'FKB Raporları', href: '/risk/regulatory/fkb' }
            ]
        },
        { 
            name: 'Veri Yönetimi', 
            href: '/risk/data', 
            icon: Database,
            show: isRiskManager 
        }
    ];

    return (
        <div className="h-full w-64 bg-slate-900 flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="h-16 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
                <ShieldAlert className="w-6 h-6 text-indigo-400 mr-3" />
                <span className="text-white font-bold tracking-wide">RİSK SİSTEMİ</span>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
                <nav className="space-y-1 px-3">
                    {navItems.filter(item => item.show).map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href ? pathname?.startsWith(item.href) : false;
                        const hasChildren = item.children && item.children.length > 0;
                        const isMenuOpen = openMenus[item.name];

                        if (hasChildren) {
                            return (
                                <div key={item.name} className="mb-1">
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                                            isMenuOpen ? 'bg-slate-800/50 text-white' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <Icon className={`w-5 h-5 mr-3 transition-colors ${
                                                isMenuOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'
                                            }`} />
                                            <span className="font-medium text-sm">{item.name}</span>
                                        </div>
                                        {isMenuOpen ? (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>
                                    
                                    {isMenuOpen && (
                                        <div className="mt-1 space-y-1 pl-11 pr-2">
                                            {item.children?.map(child => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                                        pathname === child.href
                                                            ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                                    }`}
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href!}
                                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group mb-1 ${
                                    isActive
                                        ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                                }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 transition-colors ${
                                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'
                                }`} />
                                <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
            
            {/* User Info / Bottom Section if needed */}
            <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                <div className="text-xs text-slate-500 text-center">
                    BDDK & TFRS 9 Uyumlu
                </div>
            </div>
        </div>
    );
}
