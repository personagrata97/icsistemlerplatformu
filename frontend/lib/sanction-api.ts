import { API_BASE_URL } from './audit-api';

export const sanctionApi = {
    async getDashboardStats() {
        const res = await fetch(`${API_BASE_URL}/sanction/dashboard`, { headers: getHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async getMatches(params?: { search?: string; status?: string; list?: string }) {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.status) query.append('status', params.status);
        if (params?.list) query.append('list', params.list);

        const res = await fetch(`${API_BASE_URL}/sanction/matches?${query.toString()}`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },

    async runScan(data: { query?: string; mode?: string }) {
        const res = await fetch(`${API_BASE_URL}/sanction/scan`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Tarama başarısız');
        return res.json();
    },

    async decideMatch(id: string, decision: 'YANLIS_ESLESME' | 'DOGRULANDI', reason?: string) {
        const res = await fetch(`${API_BASE_URL}/sanction/matches/${id}/decide`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ decision, reason }),
        });
        if (!res.ok) throw new Error('Karar kaydedilemedi');
        return res.json();
    },

    async getLists() {
        const res = await fetch(`${API_BASE_URL}/sanction/lists`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },

    async getListEntities(kod: string, search?: string) {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await fetch(`${API_BASE_URL}/sanction/lists/${kod}/entities${query}`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },

    async getHistory() {
        const res = await fetch(`${API_BASE_URL}/sanction/history`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    }
};

function getHeaders() {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
