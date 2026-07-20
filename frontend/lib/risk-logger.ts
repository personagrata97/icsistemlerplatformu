export interface LogEntry {
    id: number | string;
    date: string;
    action: string;
    description: string;
    module: 'Risk' | 'Audit' | 'Compliance';
    entityId?: string | number;
    user: string;
    details?: {
        before?: any;
        after?: any;
        [key: string]: any;
    };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const STORAGE_KEY = 'risk_modules_logs';

export const RiskLogger = {
    /**
     * Backend'den logları getir. Bağlantı yoksa localStorage fallback.
     */
    getLogs: async (): Promise<LogEntry[]> => {
        try {
            const res = await fetch(`${API_BASE}/audit/logs`);
            if (!res.ok) throw new Error('Backend unavailable');
            const data = await res.json();
            // Backend AuditLog formatından LogEntry formatına dönüştür
            const riskLogs = data
                .filter((log: any) => log.targetType === 'Risk')
                .map((log: any) => ({
                    id: log.id,
                    date: log.date,
                    action: log.action,
                    description: log.details || '',
                    module: 'Risk' as const,
                    user: log.user || 'Sistem',
                    details: log.changeData ? JSON.parse(log.changeData) : undefined,
                }));
            return riskLogs;
        } catch {
            // Fallback: localStorage
            return RiskLogger.getLocalLogs();
        }
    },

    /**
     * localStorage'den logları oku (senkron fallback).
     */
    getLocalLogs: (): LogEntry[] => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    /**
     * Log ekle — hem backend'e (kalıcı) hem localStorage'e (anlık) yaz.
     */
    addLog: (entry: Omit<LogEntry, 'id' | 'date'>) => {
        if (typeof window === 'undefined') return;

        const now = new Date().toISOString();
        const newLog: LogEntry = {
            ...entry,
            id: Date.now(),
            date: now,
        };

        // 1. localStorage'e anlık yaz (UI'da hemen görünsün)
        const logs = RiskLogger.getLocalLogs();
        logs.unshift(newLog);
        if (logs.length > 500) logs.length = 500;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

        // 2. Backend'e kalıcı kaydet (fire-and-forget)
        fetch(`${API_BASE}/audit/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: entry.user || 'Risk Yönetimi',
                action: entry.action,
                details: entry.description,
                targetType: 'Risk',
                targetId: entry.entityId ? String(entry.entityId) : undefined,
                changeData: entry.details ? JSON.stringify(entry.details) : undefined,
            }),
        }).catch(() => {
            // Backend erişilemezse sessizce devam et — localStorage'de zaten var
        });
    },

    clearLogs: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    },
};
