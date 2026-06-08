// Mevcut platformdaki tüm rol zincirlerini merkezi olarak yönetmek için oluşturulmuştur.
// Risk: 0 (İş mantığını bozmamak adına mevcut kombinasyonlar tam olarak korunmuştur)

export const ROLES = {
    // Standart Kümeler
    ADMIN: ['ADMIN', 'SYSTEM_ADMIN', 'Admin', 'Yönetici'],
    UNIT: ['AUDIT_UNIT', 'AUDIT_VIEWER'],
    
    // Spesifik Modül Yetkileri (Önceki hardcode zincirlerin birebir karşılıkları)
    DASHBOARD_MANAGER: ['ADMIN', 'AUDIT_ADMIN', 'AUDIT_MANAGER'],
    UNIVERSE_MANAGER: ['ADMIN', 'AUDIT_ADMIN', 'SYSTEM_ADMIN', 'Admin', 'Yönetici'],
    BASIC_MANAGER: ['ADMIN', 'MANAGER'],
    TRASH_MANAGER: ['ADMIN', 'AUDIT_ADMIN'],
    STAFF_MANAGER: ['ADMIN', 'AUDIT_ADMIN', 'AUDIT_MANAGER', 'MANAGER', 'Teftiş Kurulu Müdürü', 'SYSTEM_ADMIN', 'Admin', 'Yönetici'],
    STAFF_STATUS_MANAGER: ['ADMIN', 'AUDIT_ADMIN', 'Teftiş Kurulu Müdürü', 'SYSTEM_ADMIN'],
    LOGS_ADMIN: ['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_MANAGER', 'AUDIT_ADMIN'],
    FINDING_SUPERVISOR: ['AUDIT_ADMIN', 'AUDIT_SUPERVISOR', 'AUDIT_MANAGER'],
    FINDING_MANAGER: ['AUDIT_MANAGER', 'ADMIN'],
    EXECUTIVE: ['ADMIN', 'SYSTEM_ADMIN', 'AUDIT_ADMIN', 'AUDIT_SUPERVISOR', 'AUDIT_MANAGER'],
    AUDIT_DELETE: ['MANAGER', 'ADMIN', 'SYSTEM_ADMIN'],
    AUDIT_SUPERVISOR: ['ADMIN', 'MANAGER', 'AUDIT_MANAGER', 'AUDIT_ADMIN', 'Teftiş Kurulu Müdürü', 'AUDIT_SUPERVISOR', 'SYSTEM_ADMIN', 'Yönetici']
};

/**
 * Kullanıcının belirtilen rol dizisinden herhangi birine sahip olup olmadığını kontrol eder.
 * @param hasRole - useAuth() içinden gelen hasRole fonksiyonu
 * @param allowedRoles - İzin verilen roller dizisi (ROLES.*)
 * @returns boolean
 */
export const checkRole = (hasRole: (role: string) => boolean, allowedRoles: string[]): boolean => {
    return allowedRoles.some(role => hasRole(role));
};
