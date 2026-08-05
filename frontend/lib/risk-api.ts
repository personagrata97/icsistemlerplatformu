const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

export const riskApi = {
    async getAlerts(filters?: { durum?: string; risk_seviyesi?: string; birimId?: string; page?: number; pageSize?: number }) {
        const params = new URLSearchParams();
        if (filters?.durum) params.append('durum', filters.durum);
        if (filters?.risk_seviyesi) params.append('risk_seviyesi', filters.risk_seviyesi);
        if (filters?.birimId) params.append('birimId', filters.birimId);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

        const res = await fetch(`${API_BASE_URL}/alerts?${params.toString()}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Alerts verisi alınamadı.');
        return res.json();
    },

    async getKpis() {
        const res = await fetch(`${API_BASE_URL}/risk/summary`, {
            headers: getHeaders()
        });
        if (!res.ok) return [];
        return res.json();
    },

    async getNotifications() {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
            headers: getHeaders()
        });
        if (!res.ok) return [];
        return res.json();
    },

    async assignAlert(alertId: string, birimId: string, atananId?: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ birimId, atananId })
        });
        if (!res.ok) throw new Error('Uyarı ataması yapılamadı.');
        return res.json();
    },

    async submitUnitResponse(alertId: string, birimYaniti: string, yanitGerekcesi?: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/unit-response`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ birimYaniti, yanitGerekcesi })
        });
        if (!res.ok) throw new Error('Birim yanıtı kaydedilemedi.');
        return res.json();
    },

    async createAction(alertId: string, aksiyonTanimi: string, sorumluId?: string, sorumluBirimId?: string, terminTarihi?: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/actions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ aksiyonTanimi, sorumluId, sorumluBirimId, terminTarihi })
        });
        if (!res.ok) throw new Error('Aksiyon oluşturulamadı.');
        return res.json();
    },

    async getActions(filters?: { alertId?: string; durum?: string; sorumluBirimId?: string; page?: number; pageSize?: number }) {
        const params = new URLSearchParams();
        if (filters?.alertId) params.append('alertId', filters.alertId);
        if (filters?.durum) params.append('durum', filters.durum);
        if (filters?.sorumluBirimId) params.append('sorumluBirimId', filters.sorumluBirimId);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

        const res = await fetch(`${API_BASE_URL}/alerts/actions?${params.toString()}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Aksiyonlar alınamadı.');
        return res.json();
    },

    async updateActionStatus(actionId: string, durum: string, tamamlanmaTarihi?: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/actions/${actionId}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ durum, tamamlanmaTarihi })
        });
        if (!res.ok) throw new Error('Aksiyon durumu güncellenemedi.');
        return res.json();
    },

    async uploadActionEvidence(actionId: string, dosyaId: string, aciklama: string, filePath?: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/actions/${actionId}/evidence`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ dosyaId, aciklama, filePath })
        });
        if (!res.ok) throw new Error('Kanıt yüklenemedi.');
        return res.json();
    },

    async approveActionEvidence(evidenceId: string, onayDurumu: 'ONAYLANDI' | 'REDDEDILDI', rejectionReason?: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/evidences/${evidenceId}/approval`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ onayDurumu, rejectionReason })
        });
        if (!res.ok) throw new Error('Kanıt kararı verilemedi.');
        return res.json();
    },

    async closeAlertWithEvidence(alertId: string, kapanisGerekcesi: string) {
        const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/close-with-evidence`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ kapanisGerekcesi })
        });
        if (!res.ok) throw new Error('Uyarı kapatılamadı.');
        return res.json();
    }
};
