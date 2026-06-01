import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { User, Role, Permission } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface UserWithRoles extends User {
    roles: {
        role: Role & {
            permissions: {
                scope: string;
                permission: Permission;
            }[];
        };
    }[];
}

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async findByUsername(username: string): Promise<UserWithRoles | null> {
        return this.prisma.user.findUnique({
            where: { username },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    async findById(id: string): Promise<UserWithRoles | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    // Şifre karmaşıklık politikası doğrulaması
    validatePasswordPolicy(password: string): { valid: boolean; message: string } {
        if (password.length < 8) {
            return { valid: false, message: 'Şifre en az 8 karakter olmalıdır.' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Şifre en az 1 büyük harf içermelidir.' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Şifre en az 1 küçük harf içermelidir.' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Şifre en az 1 rakam içermelidir.' };
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { valid: false, message: 'Şifre en az 1 özel karakter içermelidir (!@#$%^&* vb.).' };
        }
        return { valid: true, message: '' };
    }

    async hashPassword(password: string): Promise<string> {
        const policy = this.validatePasswordPolicy(password);
        if (!policy.valid) {
            throw new Error(policy.message);
        }
        return bcrypt.hash(password, 10);
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    }

    async getAllUsers() {
        return this.prisma.user.findMany({
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
            orderBy: { displayName: 'asc' },
        });
    }

    async createUser(data: {
        username: string;
        password?: string;
        displayName: string;
        email?: string;
        department?: string;
        isAdUser?: boolean;
        roleIds: string[];
    }) {
        const passwordHash = data.password ? await this.hashPassword(data.password) : null;

        return this.prisma.user.create({
            data: {
                username: data.username,
                passwordHash,
                displayName: data.displayName,
                email: data.email,
                department: data.department,
                isAdUser: data.isAdUser ?? false,
                roles: {
                    create: data.roleIds.map(roleId => ({
                        roleId,
                    })),
                },
            },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }

    async getUserPermissions(userId: string): Promise<{ module: string; action: string; scope: string }[]> {
        const user = await this.findById(userId);
        if (!user) return [];

        const permissionsMap = new Map<string, string>(); // key: module:action, value: scope

        for (const userRole of user.roles) {
            for (const rolePermission of userRole.role.permissions) {
                const key = `${rolePermission.permission.module}:${rolePermission.permission.action}`;
                const currentScope = rolePermission.scope;

                // Scope hierarchy: ALL > DEPARTMENT > OWN
                // Using a simple comparison for now, or just keeping the "strongest" one
                const existingScope = permissionsMap.get(key);
                if (!existingScope || this.isScopeStronger(currentScope, existingScope)) {
                    permissionsMap.set(key, currentScope);
                }
            }
        }

        return Array.from(permissionsMap.entries()).map(([p, scope]) => {
            const [module, action] = p.split(':');
            return { module, action, scope };
        });
    }

    private isScopeStronger(newScope: string, existingScope: string): boolean {
        const priority: Record<string, number> = { 'ALL': 3, 'DEPARTMENT': 2, 'OWN': 1 };
        return (priority[newScope] || 0) > (priority[existingScope] || 0);
    }

    async hasPermission(userId: string, module: string, action: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.some(p =>
            (p.module === module || p.module === 'ALL') &&
            (p.action === action || p.action === 'ALL')
        );
    }
}
