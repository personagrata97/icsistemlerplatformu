import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;
    let reflector: Reflector;
    let auditLogService: any;

    beforeEach(() => {
        reflector = new Reflector();
        auditLogService = {
            createLog: jest.fn().mockResolvedValue(true),
        };
        guard = new PermissionsGuard(reflector, auditLogService);
    });

    const createMockContext = (user: any): ExecutionContext => {
        return {
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    url: '/api/v1/protected-resource',
                    method: 'GET',
                    ip: '127.0.0.1',
                    headers: { 'user-agent': 'Jest-Test-Agent' },
                }),
            }),
        } as any;
    };

    it('should allow access if @Public() metadata is present', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
        const context = createMockContext(null);

        const canActivate = await guard.canActivate(context);
        expect(canActivate).toBe(true);
    });

    it('should allow GOD MODE and log AUDIT_LOG when ADMIN bypasses permission check', async () => {
        jest.spyOn(reflector, 'getAllAndOverride')
            .mockReturnValueOnce(false) // isPublic
            .mockReturnValueOnce([{ module: 'AUDIT', action: 'DELETE' }]); // requiredPermissions

        const adminUser = {
            id: 'admin-123',
            username: 'selim_admin',
            roles: ['ADMIN'],
            permissions: [],
        };
        const context = createMockContext(adminUser);

        const canActivate = await guard.canActivate(context);

        expect(canActivate).toBe(true);
        expect(auditLogService.createLog).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'AYRICALIKLI_ERISIM_BYPASS',
            })
        );
    });

    it('should throw ForbiddenException if user lacks required permissions', async () => {
        jest.spyOn(reflector, 'getAllAndOverride')
            .mockReturnValueOnce(false) // isPublic
            .mockReturnValueOnce([{ module: 'SETTINGS', action: 'DELETE' }]); // requiredPermissions

        const standardUser = {
            id: 'user-456',
            username: 'stan_user',
            roles: ['AUDITOR'],
            permissions: [{ module: 'AUDIT', action: 'READ' }],
        };
        const context = createMockContext(standardUser);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
});
