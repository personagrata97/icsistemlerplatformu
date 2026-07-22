/**
 * Centralized Role-Based Access Control (RBAC) & Visibility Matrix
 * Emlak Katılım İç Sistemler Platformu (AMS & Risk Engine)
 */

export type UserRoleCode =
    | 'ADMIN'
    | 'SYSTEM_ADMIN'
    | 'AUDIT_ADMIN'
    | 'AUDIT_MANAGER'
    | 'INSPECTOR'
    | 'SENIOR_AUDITOR'
    | 'AUDITOR'
    | 'JUNIOR_AUDITOR'
    | 'ASSISTANT_AUDITOR'
    | 'AUDIT_EXPERT'
    | 'EXECUTIVE'
    | 'BOARD_MEMBER'
    | 'RISK_MANAGER'
    | 'RISK_ANALYST'
    | 'AUDITEE';

export interface PermissionRule {
    module: 'AUDIT' | 'RISK' | 'SETTINGS' | 'ADMIN' | 'REPORTS' | 'QUALIFICATION';
    action: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'EXPORT';
}

/**
 * Global Role Hierarchy & Capabilities Map
 */
export const ROLE_CAPABILITIES: Record<string, {
    canViewExecutiveDashboard: boolean;
    canManageUsersAndRoles: boolean;
    canManageAuditPlans: boolean;
    canApproveFindings: boolean;
    canDeleteRecords: boolean;
    canManageRiskLimits: boolean;
    canAccessAuditronAI: boolean;
}> = {
    ADMIN: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: true,
        canManageAuditPlans: true,
        canApproveFindings: true,
        canDeleteRecords: true,
        canManageRiskLimits: true,
        canAccessAuditronAI: true,
    },
    AUDIT_ADMIN: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: true,
        canManageAuditPlans: true,
        canApproveFindings: true,
        canDeleteRecords: true,
        canManageRiskLimits: true,
        canAccessAuditronAI: true,
    },
    SYSTEM_ADMIN: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: true,
        canManageAuditPlans: false,
        canApproveFindings: false,
        canDeleteRecords: true,
        canManageRiskLimits: true,
        canAccessAuditronAI: true,
    },
    AUDIT_MANAGER: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: false,
        canManageAuditPlans: true,
        canApproveFindings: true,
        canDeleteRecords: false,
        canManageRiskLimits: false,
        canAccessAuditronAI: true,
    },
    INSPECTOR: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: false,
        canManageAuditPlans: true,
        canApproveFindings: true,
        canDeleteRecords: false,
        canManageRiskLimits: false,
        canAccessAuditronAI: true,
    },
    SENIOR_AUDITOR: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: false,
        canManageAuditPlans: false,
        canApproveFindings: false,
        canDeleteRecords: false,
        canManageRiskLimits: false,
        canAccessAuditronAI: true,
    },
    AUDITOR: {
        canViewExecutiveDashboard: false,
        canManageUsersAndRoles: false,
        canManageAuditPlans: false,
        canApproveFindings: false,
        canDeleteRecords: false,
        canManageRiskLimits: false,
        canAccessAuditronAI: true,
    },
    EXECUTIVE: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: false,
        canManageAuditPlans: false,
        canApproveFindings: false,
        canDeleteRecords: false,
        canManageRiskLimits: false,
        canAccessAuditronAI: true,
    },
    RISK_MANAGER: {
        canViewExecutiveDashboard: true,
        canManageUsersAndRoles: false,
        canManageAuditPlans: false,
        canApproveFindings: false,
        canDeleteRecords: false,
        canManageRiskLimits: true,
        canAccessAuditronAI: true,
    },
};

/**
 * Check if user roles satisfy capability
 */
export function hasCapability(userRoles: string[], capability: keyof typeof ROLE_CAPABILITIES['ADMIN']): boolean {
    if (!userRoles || userRoles.length === 0) return false;

    return userRoles.some((role) => {
        const caps = ROLE_CAPABILITIES[role];
        return caps ? caps[capability] : false;
    });
}

/**
 * Centralized Role Helpers for UI Components
 */
export function isAuditManagerRole(hasRole: (role: string) => boolean): boolean {
    return hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('SYSADMIN') ||
        hasRole('AUDIT_ADMIN') || hasRole('Sistem Yöneticisi') ||
        hasRole('SISTEM_YONETICISI') || hasRole('Teftiş Kurulu Müdürü') ||
        hasRole('TEFTIS_KURULU_MUDURU') || hasRole('Admin') || hasRole('Yönetici');
}

export function isAuditInspectorRole(hasRole: (role: string) => boolean): boolean {
    return hasRole('AUDIT_INSPECTOR') || hasRole('Müfettiş') || hasRole('MUFETTIS') ||
        hasRole('Başmüfettiş') || hasRole('BASMUFETTIS') || hasRole('Kıdemli Müfettiş') ||
        hasRole('KIDEMLI_MUFETTIS') || hasRole('Müfettiş Yardımcısı') ||
        hasRole('Yetkili Müfettiş Yardımcısı');
}

export function isAuditUnitRole(hasRole: (role: string) => boolean): boolean {
    return hasRole('AUDIT_UNIT') || hasRole('AUDIT_VIEWER');
}

export function isRiskAdminRole(hasRole: (role: string) => boolean): boolean {
    return hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
}

export function isRiskStaffRole(hasRole: (role: string) => boolean): boolean {
    return isRiskAdminRole(hasRole) || hasRole('RISK_MANAGER') || hasRole('RISK_ANALYST');
}

export function isExecutiveRole(hasRole: (role: string) => boolean): boolean {
    return isRiskAdminRole(hasRole) || hasRole('EXECUTIVE');
}

export function isSanctionAdminRole(hasRole: (role: string) => boolean): boolean {
    return hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('COMPLIANCE_MANAGER');
}

export function isSanctionStaffRole(hasRole: (role: string) => boolean): boolean {
    return isSanctionAdminRole(hasRole) || hasRole('SANCTION_ANALYST') || hasRole('COMPLIANCE_OFFICER');
}

/**
 * Centralized RBAC Visibility check helper for React components
 */
export function canAccessModule(userRoles: string[], moduleName: 'AUDIT' | 'RISK' | 'SANCTION' | 'SETTINGS' | 'ADMIN'): boolean {
    if (!userRoles || userRoles.length === 0) return false;

    const isAdmin = userRoles.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_ADMIN'].includes(r));
    if (isAdmin) return true;

    switch (moduleName) {
        case 'ADMIN':
            return userRoles.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_ADMIN'].includes(r));
        case 'SETTINGS':
            return userRoles.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_ADMIN', 'AUDIT_MANAGER'].includes(r));
        case 'AUDIT':
            return true;
        case 'RISK':
            return userRoles.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'EXECUTIVE', 'BOARD_MEMBER'].includes(r));
        case 'SANCTION':
            return userRoles.some(r => ['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_ADMIN', 'COMPLIANCE_MANAGER', 'SANCTION_ANALYST', 'COMPLIANCE_OFFICER'].includes(r));
        default:
            return false;
    }
}
