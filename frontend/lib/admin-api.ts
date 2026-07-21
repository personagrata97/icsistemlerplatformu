const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const adminApi = {
    async getRoles() {
        const res = await fetch(`${API_BASE_URL}/admin/roles`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch roles');
        return res.json();
    },

    async createRole(data: { code: string; name: string; description?: string }) {
        const res = await fetch(`${API_BASE_URL}/admin/roles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create role');
        return res.json();
    },

    updateRolePermissions: async (roleId: string, permissions: { permissionId: string; scope: string }[]) => {
        const response = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ permissions }),
        });
        if (!response.ok) throw new Error('Failed to update role permissions');
        return response.json();
    },

    async getPermissions() {
        const res = await fetch(`${API_BASE_URL}/admin/permissions`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch permissions');
        return res.json();
    },

    async getUsers() {
        const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },

    async updateUserRoles(userId: string, roleIds: string[]) {
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/roles`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ roleIds }),
        });
        if (!res.ok) throw new Error('Kullanıcı rolleri güncellenemedi');
        return res.json();
    },

    async getDeletedRoles() {
        const res = await fetch(`${API_BASE_URL}/admin/roles/deleted`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch deleted roles');
        return res.json();
    },

    async deleteRole(roleId: string, reason?: string) {
        const res = await fetch(`${API_BASE_URL}/admin/roles/${roleId}`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ reason }),
        });
        if (!res.ok) throw new Error('Rol silinemedi');
        return res.json();
    },

    async restoreRole(roleId: string) {
        const res = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/restore`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Rol geri yüklenemedi');
        return res.json();
    },

    async createAuditLog(data: { action: string; details: string; targetType?: string; targetId?: string }) {
        try {
            const res = await fetch(`${API_BASE_URL}/audit/logs`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) console.warn('Denetim izi kaydedilemedi');
        } catch (e) {
            console.warn('Denetim izi kaydı başarısız (kritik değil):', e);
        }
    }
};
