'use client';

import { useAuth } from '@/context/AuthContext';
import { Shield, ChevronDown, UserCog } from 'lucide-react';
import { useState } from 'react';

export default function DevRoleSwitcher() {
    const { user, setRoles } = useAuth();
    // const router = useRouter(); // Navigasyon yerine hard reload kullanacağız
    const [isOpen, setIsOpen] = useState(false);

    if (process.env.NODE_ENV === 'production' || !user || !setRoles) return null;

    const currentRole = user.roles.includes('SYSTEM_ADMIN') ? 'Sistem Yöneticisi'
        : user.roles.includes('AUDIT_ADMIN') ? 'Teftiş K. Başkanı (CAE)'
            : user.roles.includes('AUDIT_SUPERVISOR') ? 'Gözetim Sorumlusu'
                : user.roles.includes('AUDIT_INSPECTOR') ? 'Müfettiş'
                    : user.roles.includes('AUDIT_VIEWER') ? 'Birim'
                        : 'Çalışan';

    const handleSwitchRole = (roleType: string) => {
        let newRoles: string[] = [];
        if (roleType === 'SYS_ADMIN') newRoles = ['ADMIN', 'SYSTEM_ADMIN'];
        if (roleType === 'CAE') newRoles = ['AUDIT_ADMIN']; // Only Audit Admin, NOT System Admin
        if (roleType === 'SUPERVISOR') newRoles = ['AUDIT_SUPERVISOR'];
        if (roleType === 'INSPECTOR') newRoles = ['AUDIT_INSPECTOR'];
        if (roleType === 'UNIT') newRoles = ['AUDIT_VIEWER', 'AUDIT_UNIT'];
        if (roleType === 'EMPLOYEE') newRoles = ['STANDARD_EMPLOYEE'];

        setRoles(newRoles);
        setIsOpen(false);

        // HARD RELOAD: Force browser to reload the app from the root audit path
        // This guarantees all states are reset and new permissions are applied from scratch
        window.location.href = '/audit';
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="btn bg-slate-800 text-white hover:bg-slate-700 border-slate-600 shadow-lg gap-2"
                >
                    <UserCog size={18} className="text-yellow-400" />
                    <div className="text-left text-xs bg-transparent">
                        <div className="font-bold text-yellow-400">DEV MODE</div>
                        <div className="text-gray-300">Rol: {currentRole}</div>
                    </div>
                    <ChevronDown size={16} />
                </button>

                {isOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                        <div className="p-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
                            Rol Değiştir (Test)
                        </div>
                        <div className="p-1">
                            <button
                                onClick={() => handleSwitchRole('SYS_ADMIN')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-black"></span>
                                <div className="flex flex-col">
                                    <span className="font-medium">Sistem Yöneticisi</span>
                                    <span className="text-[10px] text-gray-400">Tam Teknik Yetki + Çöp Kutusu</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleSwitchRole('CAE')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                <div className="flex flex-col">
                                    <span className="font-medium">Teftiş Kurulu Başkanı (CAE)</span>
                                    <span className="text-[10px] text-gray-400">Tüm Denetim + Raporlar (Silme Yok)</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleSwitchRole('SUPERVISOR')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <div className="flex flex-col">
                                    <span className="font-medium">Gözetim Sorumlusu</span>
                                    <span className="text-[10px] text-gray-400">Denetim Yönetimi (Log Yok)</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleSwitchRole('INSPECTOR')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Müfettiş
                            </button>
                            <button
                                onClick={() => handleSwitchRole('UNIT')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Bulguya Tabii Birim
                            </button>
                            <button
                                onClick={() => handleSwitchRole('EMPLOYEE')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-700 rounded flex items-center gap-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                Şirket Çalışanı (Etik Bildirim)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
