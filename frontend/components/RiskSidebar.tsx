'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PlayCircle,
    AlertTriangle,
    FileText,
    ClipboardCheck,
    ChevronDown,
    List
} from 'lucide-react';
import { clsx } from 'clsx';
// Removing useAuth as we don't need user info here anymore

export default function RiskSidebar() {
    const pathname = usePathname();
    const [scenariosOpen, setScenariosOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    // Design tokens from Audit Module (style.css)
    // --sidebar-width: 260px
    // --white: #ffffff
    // --border: #e5e7eb
    // --text-light: #6b7280
    // --primary: #009c45
    // --primary-hover: #007a36 (bg-green-50 in tailwind approx #f0fdf4) 

    return (
        <aside className="w-[260px] bg-white flex flex-col h-screen flex-shrink-0 border-r border-gray-200 transition-all duration-300">
            {/* Header / Logo Area */}
            <div className="h-[64px] flex items-center px-6 border-b border-gray-200">
                <img
                    src="/logo.png"
                    alt="Emlak Katılım"
                    className="h-[40px] w-auto object-contain mix-blend-multiply"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/150x50?text=LOGO';
                    }}
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">

                {/* Genel Bakış */}
                <Link
                    href="/risk"
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive('/risk')
                            ? "bg-green-50 text-green-700" // Active state matching Audit
                            : "text-gray-500 hover:bg-green-50 hover:text-green-700"
                    )}
                >
                    <LayoutDashboard size={20} />
                    <span>Genel Bakış</span>
                </Link>

                {/* Senaryolar (Dropdown) */}
                <div>
                    <button
                        onClick={() => setScenariosOpen(!scenariosOpen)}
                        className={clsx(
                            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            (isActive('/risk/scenarios') || scenariosOpen)
                                ? "text-gray-700 bg-gray-50"
                                : "text-gray-500 hover:bg-green-50 hover:text-green-700"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <PlayCircle size={20} />
                            <span>Senaryolar</span>
                        </div>
                        <ChevronDown
                            size={16}
                            className={clsx("transition-transform duration-200", scenariosOpen && "rotate-180")}
                        />
                    </button>

                    {scenariosOpen && (
                        <div className="pl-6 mt-1 space-y-1">
                            <Link
                                href="/risk/scenarios"
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[0.9rem] transition-colors",
                                    isActive('/risk/scenarios')
                                        ? "text-green-700 font-medium"
                                        : "text-gray-500 hover:text-green-700"
                                )}
                            >
                                <List size={16} />
                                <span>Tüm Senaryolar</span>
                            </Link>
                            <Link
                                href="/risk/scenarios/new"
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[0.9rem] transition-colors",
                                    isActive('/risk/scenarios/new')
                                        ? "text-green-700 font-medium"
                                        : "text-gray-500 hover:text-green-700"
                                )}
                            >
                                <PlayCircle size={16} />
                                <span>Yeni Senaryo</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Uyarılar */}
                <Link
                    href="/risk/alerts"
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive('/risk/alerts')
                            ? "bg-green-50 text-green-700"
                            : "text-gray-500 hover:bg-green-50 hover:text-green-700"
                    )}
                >
                    <AlertTriangle size={20} />
                    <span>Uyarılar</span>
                </Link>

                {/* Sözleşmeler */}
                <Link
                    href="/risk/contracts"
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive('/risk/contracts')
                            ? "bg-green-50 text-green-700"
                            : "text-gray-500 hover:bg-green-50 hover:text-green-700"
                    )}
                >
                    <FileText size={20} />
                    <span>Sözleşmeler</span>
                </Link>

                {/* İşlem Geçmişi */}
                <Link
                    href="/risk/logs"
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive('/risk/logs')
                            ? "bg-green-50 text-green-700"
                            : "text-gray-500 hover:bg-green-50 hover:text-green-700"
                    )}
                >
                    <ClipboardCheck size={20} />
                    <span>İşlem Geçmişi</span>
                </Link>
            </nav>
            {/* FOOTER REMOVED as per feedback */}
        </aside>
    );
}
