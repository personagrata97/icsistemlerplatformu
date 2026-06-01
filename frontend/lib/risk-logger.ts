export interface LogEntry {
    id: number;
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

const STORAGE_KEY = 'risk_modules_logs';

export const RiskLogger = {
    getLogs: (): LogEntry[] => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    addLog: (entry: Omit<LogEntry, 'id' | 'date'>) => {
        if (typeof window === 'undefined') return;

        const logs = RiskLogger.getLogs();
        const newLog: LogEntry = {
            ...entry,
            id: Date.now(),
            date: new Date().toISOString()
        };

        logs.unshift(newLog);

        // Limit to 500
        if (logs.length > 500) {
            logs.length = 500;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        console.log('📝 Risk Log Added:', newLog);
    },

    clearLogs: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    }
};
