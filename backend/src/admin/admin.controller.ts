import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('roles')
    @RequirePermissions({ module: 'ADMIN', action: 'VIEW' })
    getRoles() {
        return this.adminService.getAllRoles();
    }

    @Post('roles')
    @RequirePermissions({ module: 'ADMIN', action: 'EDIT' })
    createRole(
        @Body() data: { code: string; name: string; description?: string },
        @Request() req: any
    ) {
        return this.adminService.createRole(data, req.user);
    }

    @Patch('roles/:id/permissions')
    @RequirePermissions({ module: 'ADMIN', action: 'EDIT' })
    updateRolePermissions(
        @Param('id') id: string,
        @Body() body: { permissions: { permissionId: string; scope: string }[] },
        @Request() req: any
    ) {
        return this.adminService.updateRolePermissions(id, body.permissions, req.user);
    }

    @Get('permissions')
    @RequirePermissions({ module: 'ADMIN', action: 'VIEW' })
    getPermissions() {
        return this.adminService.getAllPermissions();
    }

    @Get('users')
    @RequirePermissions({ module: 'ADMIN', action: 'VIEW' })
    getUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/:id/roles')
    @RequirePermissions({ module: 'ADMIN', action: 'EDIT' })
    updateUserRoles(
        @Param('id') id: string,
        @Body() body: { roleIds: string[] },
        @Request() req: any
    ) {
        return this.adminService.updateUserRoles(id, body.roleIds, req.user);
    }
}
