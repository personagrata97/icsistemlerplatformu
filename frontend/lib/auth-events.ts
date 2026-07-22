// ============================================
// MERKEZİ AUTH EVENT SİSTEMİ
// ============================================
// Tüm API istemcileri 401 aldığında bu sistemi kullanır.
// AuthContext bu sistemi dinler ve token yenileme / logout yönetir.
// ============================================

type AuthEventHandler = () => Promise<boolean>;

let unauthorizedHandler: AuthEventHandler = async () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return false;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export const authEvents = {
    setUnauthorizedHandler(handler: AuthEventHandler) {
        unauthorizedHandler = handler;
    },

    async emitUnauthorized(): Promise<boolean> {
        if (isRefreshing && refreshPromise) {
            return refreshPromise;
        }

        isRefreshing = true;
        refreshPromise = unauthorizedHandler().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });

        return refreshPromise;
    }
};
