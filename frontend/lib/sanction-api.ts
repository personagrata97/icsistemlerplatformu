import { API_BASE_URL } from './audit-api';

export const sanctionApi = {
    async getDashboardStats() {
        const res = await fetch(`${API_BASE_URL}/sanction/dashboard`, { headers: getHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async getMatches(params?: { search?: string; status?: string; list?: string; page?: number; pageSize?: number }) {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.status) query.append('status', params.status);
        if (params?.list) query.append('list', params.list);
        if (params?.page) query.append('page', String(params.page));
        if (params?.pageSize) query.append('pageSize', String(params.pageSize));

        const res = await fetch(`${API_BASE_URL}/sanction/matches?${query.toString()}`, { headers: getHeaders() });
        if (!res.ok) return null;
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

    async screenPortfolio() {
        const res = await fetch(`${API_BASE_URL}/sanction/screening/portfolio`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Portföy taraması başarısız');
        return res.json();
    },

    async syncList(kod: string) {
        const res = await fetch(`${API_BASE_URL}/sanction/sync/${kod}`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Liste senkronizasyonu başarısız');
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

    async getListEntities(kod: string, search?: string, params?: { page?: number; pageSize?: number }) {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (params?.page) query.append('page', String(params.page));
        if (params?.pageSize) query.append('pageSize', String(params.pageSize));

        const res = await fetch(`${API_BASE_URL}/sanction/lists/${kod}/entities?${query.toString()}`, { headers: getHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async createCustomEntity(data: { adSoyad: string; tckn?: string; gerekce?: string }) {
        const res = await fetch(`${API_BASE_URL}/sanction/lists/custom/entities`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Kayıt eklenemedi');
        return res.json();
    },

    async getHistory(params?: { page?: number; pageSize?: number }) {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', String(params.page));
        if (params?.pageSize) query.append('pageSize', String(params.pageSize));
        const res = await fetch(`${API_BASE_URL}/sanction/history?${query.toString()}`, { headers: getHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async getReports() {
        const res = await fetch(`${API_BASE_URL}/sanction/reports`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },

    async getParameters() {
        const res = await fetch(`${API_BASE_URL}/sanction/parameters`, { headers: getHeaders() });
        if (!res.ok) return [];
        return res.json();
    },

    async updateParameter(id: string, deger: string) {
        const res = await fetch(`${API_BASE_URL}/sanction/parameters/${id}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ deger }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Parametre güncellenemedi');
        }
        return res.json();
    },

    async getEDDRecords(params?: { page?: number; pageSize?: number }) {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', String(params.page));
        if (params?.pageSize) query.append('pageSize', String(params.pageSize));
        const res = await fetch(`${API_BASE_URL}/sanction/edd?${query.toString()}`, { headers: getHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async createEDDRecord(data: any) {
        const res = await fetch(`${API_BASE_URL}/sanction/edd`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('EDD kaydı oluşturulamadı');
        return res.json();
    },

    async getSignals(musteriId?: string, params?: { page?: number; pageSize?: number }) {
        const query = new URLSearchParams();
        if (musteriId) query.append('musteriId', musteriId);
        if (params?.page) query.append('page', String(params.page));
        if (params?.pageSize) query.append('pageSize', String(params.pageSize));
        const res = await fetch(`${API_BASE_URL}/sanction/reputation/signals?${query.toString()}`, { headers: getHeaders() });
        if (!res.ok) return null;
        return res.json();
    },

    async createFindingFromMatch(matchId: string) {
        const res = await fetch(`${API_BASE_URL}/sanction/matches/${matchId}/finding`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to create finding from match');
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
