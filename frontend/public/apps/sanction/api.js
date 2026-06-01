const API_URL = '/api/sanction';

const SanctionAPI = {
    async getLogs() {
        try {
            const res = await fetch(`${API_URL}/logs`);
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    async createLog(log) {
        try {
            await fetch(`${API_URL}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            });
        } catch (e) {
            console.error("Log sending failed", e);
        }
    }
};
