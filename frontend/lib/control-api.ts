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

    getInventory: async (filters?: { page?: number; pageSize?: number; limit?: number; search?: string; status?: string; department?: string }) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.pageSize || filters?.limit) params.append('pageSize', String(filters?.pageSize || filters?.limit));
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

    getTests: async (controlId?: string, filters?: { page?: number; pageSize?: number }) => {
        const params = new URLSearchParams();
        if (controlId) params.append('controlId', controlId);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

        const res = await fetch(`${API_BASE_URL}/control/tests?${params.toString()}`, { headers: getHeaders() });
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

    getDeficiencies: async (filters?: { status?: string; severity?: string; department?: string; page?: number; pageSize?: number }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.severity) params.append('severity', filters.severity);
        if (filters?.department) params.append('department', filters.department);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

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

    sendToConciliation: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/control/deficiencies/${id}/send-to-conciliation`, {
            method: 'POST',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    submitUnitResponse: async (id: string, response: 'KATILIYOR' | 'KISMEN_KATILIYOR' | 'KATILMIYOR', reason: string) => {
        const res = await fetch(`${API_BASE_URL}/control/deficiencies/${id}/unit-response`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ response, reason }),
        });
        return handleResponse(res);
    },

    decideConciliation: async (id: string, decision: 'UZLASILDI' | 'UST_YONETIM', reason: string) => {
        const res = await fetch(`${API_BASE_URL}/control/deficiencies/${id}/decide-conciliation`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ decision, reason }),
        });
        return handleResponse(res);
    },

    officiallyNotify: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/control/deficiencies/${id}/notify`, {
            method: 'POST',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    uploadEvidence: async (id: string, fileName: string, description: string, filePath?: string) => {
        const res = await fetch(`${API_BASE_URL}/control/deficiencies/${id}/evidences`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ fileName, description, filePath }),
        });
        return handleResponse(res);
    },

    approveEvidence: async (id: string, approvalStatus: 'ONAYLANDI' | 'REDDEDILDI', rejectionReason?: string) => {
        const res = await fetch(`${API_BASE_URL}/control/evidences/${id}/approval`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ approvalStatus, rejectionReason }),
        });
        return handleResponse(res);
    },

    getSelfAssessments: async (department?: string, filters?: { page?: number; pageSize?: number }) => {
        const params = new URLSearchParams();
        if (department) params.append('department', department);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

        const res = await fetch(`${API_BASE_URL}/control/self-assessment?${params.toString()}`, { headers: getHeaders() });
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
