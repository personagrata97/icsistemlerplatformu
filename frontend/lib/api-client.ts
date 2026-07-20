const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getHeaders = (customHeaders: HeadersInit = {}): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...customHeaders,
    };
};

export const apiClient = {
    async getRiskSummary(scenarioCode: string = 'BAZ') {
        const res = await fetch(`${API_BASE_URL}/risk/summary?senaryo=${scenarioCode}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch risk summary');
        return res.json();
    },

    async runAllScenarios() {
        const res = await fetch(`${API_BASE_URL}/scenario-engine/run`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error('Failed to run scenarios');
        return res.json();
    },

    async runRiskLogs() {
        const res = await fetch(`${API_BASE_URL}/risk/logs`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch risk logs');
        return res.json();
    },

    async getAlerts(filters?: { durum?: string; risk_seviyesi?: string }) {
        const params = new URLSearchParams();
        if (filters?.durum) params.append('durum', filters.durum);
        if (filters?.risk_seviyesi) params.append('risk_seviyesi', filters.risk_seviyesi);

        const res = await fetch(`${API_BASE_URL}/alerts?${params.toString()}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
    },

    async closeAlert(alertId: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/close`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to close alert');
        return res.json();
    },

    async getKpiProjections(kpiCode: string) {
        const res = await fetch(`${API_BASE_URL}/projections/kpi?kod=${kpiCode}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch projections');
        return res.json();
    },

    async getContracts(durum?: string) {
        const params = durum ? `?durum=${durum}` : '';
        const res = await fetch(`${API_BASE_URL}/contracts${params}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch contracts');
        return res.json();
    },

    async getNplContracts() {
        const res = await fetch(`${API_BASE_URL}/contracts/npl`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch NPL contracts');
        return res.json();
    },

    async getLiquidityStress() {
        const res = await fetch(`${API_BASE_URL}/risk/liquidity-stress`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch liquidity stress data');
        return res.json();
    },

    async getSanctionLogs() {
        const res = await fetch(`${API_BASE_URL}/sanction/logs`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch sanction logs');
        return res.json();
    },

    async createSanctionLog(data: any) {
        const res = await fetch(`${API_BASE_URL}/sanction/logs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create sanction log');
        return res.json();
    },

    async getLimits() {
        const res = await fetch(`${API_BASE_URL}/risk/limits`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch risk limits');
        return res.json();
    },

    async updateLimit(id: string, esikDeger: number) {
        const res = await fetch(`${API_BASE_URL}/risk/limits`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ id, esik_deger: esikDeger }),
        });
        if (!res.ok) throw new Error('Failed to update risk limit');
        return res.json();
    }
};


