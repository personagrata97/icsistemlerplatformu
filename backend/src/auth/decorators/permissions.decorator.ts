import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionRequirement {
    module: string;
    action: string;
}

/**
 * Decorator to specify required permissions for a route
 * Usage: @RequirePermissions({ module: 'AUDIT', action: 'CREATE' })
 * Or multiple: @RequirePermissions({ module: 'AUDIT', action: 'CREATE' }, { module: 'AUDIT', action: 'EDIT' })
 */
export const RequirePermissions = (...permissions: PermissionRequirement[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
