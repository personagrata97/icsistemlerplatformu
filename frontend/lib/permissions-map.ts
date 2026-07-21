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

    // Check if any user role possesses capability
    return userRoles.some((role) => {
        const caps = ROLE_CAPABILITIES[role];
        return caps ? caps[capability] : false;
    });
}

/**
 * Centralized RBAC Visibility check helper for React components
 */
export function canAccessModule(userRoles: string[], moduleName: 'AUDIT' | 'RISK' | 'SETTINGS' | 'ADMIN'): boolean {
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
        default:
            return false;
    }
}
