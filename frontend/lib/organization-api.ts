const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const organizationApi = {
    // Get hierarchical organization tree
    getTree: async () => {
        const response = await fetch(`${BASE_URL}/organization/tree`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch organization tree');
        return response.json();
    },

    getUnits: async () => {
        try {
            const response = await fetch(`${BASE_URL}/organization/units`, {
                headers: getHeaders()
            });
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    },

    // Create a new node/unit
    createNode: async (data: { code?: string; name: string; type: string; parentId?: string; sortOrder?: number; isActive?: boolean }) => {
        const response = await fetch(`${BASE_URL}/organization`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create organization node');
        }
        return response.json();
    },

    // Update existing node
    updateNode: async (id: string, data: { code?: string; name?: string; type?: string; parentId?: string; sortOrder?: number; isActive?: boolean }) => {
        const response = await fetch(`${BASE_URL}/organization/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to update organization node');
        }
        return response.json();
    },

    // Delete a node
    deleteNode: async (id: string) => {
        const response = await fetch(`${BASE_URL}/organization/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to delete organization node');
        }
        return response.json();
    },

    // JobTitles API
    getTitles: async (module?: string) => {
        const url = module ? `${BASE_URL}/organization/titles?module=${module}` : `${BASE_URL}/organization/titles`;
        const response = await fetch(url, {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return response.json();
    },

    createTitle: async (data: { name: string; module: string; cadre: number; unitId?: string; isActive?: boolean }) => {
        const response = await fetch(`${BASE_URL}/organization/titles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create job title');
        }
        return response.json();
    },

    updateTitle: async (id: string, data: { name?: string; module?: string; cadre?: number; unitId?: string; isActive?: boolean }) => {
        const response = await fetch(`${BASE_URL}/organization/titles/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to update job title');
        }
        return response.json();
    },

    deleteTitle: async (id: string) => {
        const response = await fetch(`${BASE_URL}/organization/titles/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to delete job title');
        }
        return response.json();
    }
};
