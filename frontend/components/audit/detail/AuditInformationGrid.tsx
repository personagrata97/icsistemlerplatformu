'use client';

import React from 'react';
import { formatDate } from '@/lib/audit-utils';
import TruncatedText from '@/components/ui/TruncatedText';

interface AuditInformationGridProps {
    auditData: any;
    duration: number;
    actualDuration?: number;
    team: any[];
    progress: number;
    allStaff?: any[];
}

const AuditInformationGrid: React.FC<AuditInformationGridProps> = ({
    auditData,
    duration,
    actualDuration,
    team,
    progress,
    allStaff = []
}) => {
    if (!auditData) return null;

    const supervisorMember = team.find(m => m.role && (m.role.toLowerCase().includes('gözetim') || m.role.toLowerCase().includes('müdür') || m.role.toLowerCase().includes('yönetici')));
    
    const getSupervisorWithRole = () => {
        if (supervisorMember) {
            const staff = allStaff.find(s => s.id === supervisorMember.id || s.name === supervisorMember.name || s.displayName === supervisorMember.name);
            const corporateTitle = staff?.title || supervisorMember.role;
            return `${supervisorMember.name} (${corporateTitle})`;
        }
        
        const supervisorName = auditData.supervisorUser 
            ? (auditData.supervisorUser.displayName || `${auditData.supervisorUser.firstName} ${auditData.supervisorUser.lastName}`.trim())
            : (auditData.supervisor && auditData.supervisor.length < 24 ? auditData.supervisor : null);
            
        if (supervisorName) {
            const staff = allStaff.find(s => 
                s.name?.toLowerCase() === supervisorName.toLowerCase() || 
                s.displayName?.toLowerCase() === supervisorName.toLowerCase() ||
                `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === supervisorName.toLowerCase()
            );
            if (staff && staff.title) {
                return `${supervisorName} (${staff.title})`;
            }
        }

        if (auditData.supervisorUser) {
            const name = auditData.supervisorUser.displayName || `${auditData.supervisorUser.firstName} ${auditData.supervisorUser.lastName}`.trim();
            const role = auditData.supervisorUser.title || auditData.supervisorUser.role || 'Gözetim Sorumlusu';
            return `${name} (${role})`;
        }
        if (auditData.supervisor && auditData.supervisor.length < 24) {
            return `${auditData.supervisor} (Gözetim Sorumlusu)`;
        }
        return 'Atanmamış';
    };

    const auditors = team.filter(m => !m.role || (!m.role.toLowerCase().includes('gözetim') && !m.role.toLowerCase().includes('müdür') && !m.role.toLowerCase().includes('yönetici')));

    const getAuditorsWithRoles = () => {
        if (auditors.length === 0) return 'Atanmamış';
        return auditors.map(t => {
            const staff = allStaff.find(s => s.id === t.id || s.name === t.name || s.displayName === t.name);
            const title = staff?.title || t.role || 'Müfettiş';
            return `${t.name} (${title})`;
        }).join(', ');
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs text-gray-500 mb-1">Planlanan Başlangıç</h4>
                <p className="font-medium text-sm">{formatDate(auditData.startDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs text-gray-500 mb-1">Planlanan Bitiş</h4>
                <p className="font-medium text-sm">{formatDate(auditData.endDate)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-xs text-blue-600 mb-1">Gerçekleşen Başlangıç</h4>
                <p className="font-medium text-sm text-blue-800">{auditData.actualStartDate ? formatDate(auditData.actualStartDate) : '-'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-xs text-blue-600 mb-1">Gerçekleşen Bitiş</h4>
                <p className="font-medium text-sm text-blue-800">{auditData.actualEndDate ? formatDate(auditData.actualEndDate) : '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs text-gray-500 mb-1">Süre (İş Günü)</h4>
                <p className="font-medium text-sm">
                    {duration} gün Plan.
                    {auditData.actualStartDate && (
                        <span className="text-blue-600 block sm:inline sm:ml-2 mt-1 sm:mt-0">
                            / {actualDuration} gün Gerç.
                        </span>
                    )}
                </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 overflow-hidden">
                <h4 className="text-xs text-gray-500 mb-1">Denetim Ekibi</h4>
                <TruncatedText text={getAuditorsWithRoles()} className="font-medium text-sm text-gray-800" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 overflow-hidden">
                <h4 className="text-xs text-gray-500 mb-1">Gözetim Sorumlusu</h4>
                <TruncatedText text={getSupervisorWithRole()} className="font-medium text-sm text-gray-800" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs text-gray-500 mb-1">İlerleme</h4>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="font-medium text-sm">%{progress}</span>
                </div>
            </div>
        </div>
    );
};

export default AuditInformationGrid;
