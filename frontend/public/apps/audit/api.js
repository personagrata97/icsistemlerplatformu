// API URL - Backend yoksa localStorage kullanılacak
const API_URL = 'http://localhost:5500';

const AuditAPI = {
    async getAudits() {
        // LocalStorage kullan - backend şimdilik denetim CRUD desteklemiyor
        return [];
    },

    async createAudit(audit) {
        // LocalStorage kullan
        return audit;
    },

    async updateAudit(id, data) {
        return data;
    },

    async deleteAudit(id) {
        return true;
    },

    async getFindings() {
        return [];
    },

    async createFinding(finding) {
        return finding;
    },

    async getLogs() {
        return [];
    },

    async createLog(log) {
        return true;
    }
};
