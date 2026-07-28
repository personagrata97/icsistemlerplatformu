const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

async function handleResponse(res: Response) {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'İstek başarısız oldu' }));
        throw new Error(error.message || 'API Hatası');
    }
    return res.json();
}

export const controlApi = {
    getStats: async () => {
        const res = await fetch(`${API_BASE_URL}/control/stats`, { headers: getHeaders() });
        return handleResponse(res);
    },

    getInventory: async (filters?: { page?: number; limit?: number; search?: string; status?: string; department?: string }) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.limit) params.append('limit', String(filters.limit));
        if (filters?.search) params.append('search', filters.search);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.department) params.append('department', filters.department);

        const res = await fetch(`${API_BASE_URL}/control/inventory?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    createControlItem: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/control/inventory`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    getTests: async (controlId?: string) => {
        const url = controlId ? `${API_BASE_URL}/control/tests?controlId=${controlId}` : `${API_BASE_URL}/control/tests`;
        const res = await fetch(url, { headers: getHeaders() });
        return handleResponse(res);
    },

    createTest: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/control/tests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    getDeficiencies: async (filters?: { status?: string; severity?: string; department?: string }) => {
        const params = new URLSearchParams(filters as any);
        const res = await fetch(`${API_BASE_URL}/control/deficiencies?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    updateDeficiencyStatus: async (id: string, status: string, actionPlan?: string) => {
        const res = await fetch(`${API_BASE_URL}/control/deficiencies/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status, actionPlan }),
        });
        return handleResponse(res);
    },

    getSelfAssessments: async (department?: string) => {
        const url = department ? `${API_BASE_URL}/control/self-assessment?department=${department}` : `${API_BASE_URL}/control/self-assessment`;
        const res = await fetch(url, { headers: getHeaders() });
        return handleResponse(res);
    },

    createSelfAssessment: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/control/self-assessment`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    verifySelfAssessment: async (id: string, result: 'Onaylandı' | 'Revize İste' | 'Reddedildi') => {
        const res = await fetch(`${API_BASE_URL}/control/self-assessment/${id}/verify`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ result }),
        });
        return handleResponse(res);
    },
};
