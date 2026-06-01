import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, FileSignature, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function FindingsTabs() {
    const pathname = usePathname();

    const { hasRole } = useAuth();
    const isAuditUnit = hasRole('AUDIT_UNIT');

    const allTabs = [
        {
            name: 'Tüm Bulgular',
            href: '/audit/findings',
            icon: List,
            activeKeywords: ['/audit/findings']
        },
        {
            name: 'Tebliğ ve Mutabakat',
            href: '/audit/conciliation',
            icon: FileSignature,
            activeKeywords: ['/audit/conciliation']
        },
        {
            name: 'Aksiyon Takip',
            href: '/audit/follow-up',
            icon: Clock,
            activeKeywords: ['/audit/follow-up']
        }
    ];

    const tabs = isAuditUnit
        ? allTabs.filter(tab => tab.href === '/audit/conciliation')
        : allTabs;

    const isActive = (tab: any) => {
        // Special case: '/audit/findings' shouldn't match '/audit/findings/new' if we had sub-urls but here paths are distinct enough
        // However, 'findings' is prefix of the others if structured differently. 
        // Current paths: /audit/findings, /audit/conciliation, /audit/follow-up. 
        // Exact match for base paths is safer.
        if (pathname === tab.href) return true;
        // Also handle potential sub-routes (e.g. details) if they stay under these parents
        return pathname.startsWith(tab.href + '/');
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 mb-6 sticky top-0 z-10 px-6 py-3">
            <div className="tabs-container mb-0">
                {tabs.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`tab-item flex items-center gap-2 ${active ? 'tab-item-active' : ''}`}
                        >
                            <Icon size={18} />
                            {tab.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
