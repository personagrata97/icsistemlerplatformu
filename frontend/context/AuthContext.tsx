'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { authEvents } from '@/lib/auth-events';

export interface UserPermission {
    module: string;
    action: string;
}

export interface User {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    department: string | null;
    roles: string[];
    permissions: UserPermission[];
}

interface AuthContextType {
    user: User | null;
    login: (accessToken: string, refreshToken: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasPermission: (module: string, action: string) => boolean;
    hasRole: (role: string) => boolean;
    refreshAccessToken: () => Promise<boolean>;
    setRoles?: (roles: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Token'ları localStorage'dan yükle
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('access_token');

        if (storedUser && storedAccessToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && Array.isArray(parsedUser.roles) && parsedUser.username) {
                    setUser(parsedUser);
                } else {
                    console.warn('Geçersiz kullanıcı verisi, oturum temizleniyor');
                    clearSession();
                }
            } catch (e) {
                console.warn('Kullanıcı verisi ayrıştırılamadı');
                clearSession();
            }
        } else {
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    // Idle Timeout Mekanizması (30 dakika hareketsizlik → oturum sonlandırma)
    // Son 5 dakikada uyarı gösterilir, kullanıcı onaylarsa süre sıfırlanır.
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [idleWarningVisible, setIdleWarningVisible] = useState(false);
    const [idleCountdown, setIdleCountdown] = useState(0);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const IDLE_TIMEOUT_MS = 30 * 60 * 1000;       // 30 dakika toplam
    const IDLE_WARNING_MS = 25 * 60 * 1000;        // 25. dakikada uyarı göster (5 dk kala)
    const WARNING_DURATION_SEC = 5 * 60;           // 5 dakika geri sayım

    const clearAllIdleTimers = useCallback(() => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setIdleWarningVisible(false);
        setIdleCountdown(0);
    }, []);

    const resetIdleTimeout = useCallback(() => {
        clearAllIdleTimers();

        if (user) {
            // 25. dakikada uyarı modalı göster
            warningTimeoutRef.current = setTimeout(() => {
                setIdleWarningVisible(true);
                setIdleCountdown(WARNING_DURATION_SEC);

                // Geri sayım başlat
                countdownIntervalRef.current = setInterval(() => {
                    setIdleCountdown(prev => {
                        if (prev <= 1) {
                            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }, IDLE_WARNING_MS);

            // 30. dakikada oturumu sonlandır
            idleTimeoutRef.current = setTimeout(() => {
                clearAllIdleTimers();
                logout();
            }, IDLE_TIMEOUT_MS);
        }
    }, [user, clearAllIdleTimers]);

    // Kullanıcı uyarıyı görüp "Devam Et" derse süre sıfırlanır
    const handleIdleWarningDismiss = useCallback(() => {
        clearAllIdleTimers();
        resetIdleTimeout();
    }, [clearAllIdleTimers, resetIdleTimeout]);

    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            // Uyarı modalı açıkken mouse hareketi süreyi sıfırlamasın — 
            // kullanıcı bilinçli olarak "Devam Et" demeli
            if (!idleWarningVisible) {
                resetIdleTimeout();
            }
        };

        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Zamanlayıcıyı başlat
        resetIdleTimeout();

        return () => {
            clearAllIdleTimers();
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [user, resetIdleTimeout, clearAllIdleTimers, idleWarningVisible]);

    // Authenticated değilse login'e yönlendir
    useEffect(() => {
        // WHITELISTED PUBLIC ROUTES (No Login Required)
        const publicRoutes = ['/login', '/audit/ethics/submit', '/ethics'];
        const isPublic = publicRoutes.some(path => pathname?.startsWith(path));

        // Bekleme esnasında (isLoading=true) veya kullanıcı yüklendiğinde yönlendirme yapılmaz.
        // Yalnızca yükleme bittiğinde, kullanıcı yoksa ve public rota değilse yönlendir.
        if (!isLoading && user === null && !isPublic) {
            router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
        }
    }, [user, isLoading, pathname, router]);

    const clearSession = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (typeof document !== 'undefined') {
            document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
        }
    };

    const login = (accessToken: string, refreshToken: string, userData: User) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        if (typeof document !== 'undefined') {
            document.cookie = `access_token=${accessToken}; path=/; max-age=900; samesite=lax`;
        }
        setUser(userData);

        // Read redirect parameter from URL if present
        let targetPath = '/';
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const redirectParam = params.get('redirect');
            if (redirectParam && redirectParam.startsWith('/')) {
                targetPath = redirectParam;
            }
        }
        router.push(targetPath);
    };

    const logout = useCallback(async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (accessToken) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearSession();
            setUser(null);
            router.push('/login');
        }
    }, [router]);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                clearSession();
                setUser(null);
                return false;
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (typeof document !== 'undefined') {
                document.cookie = `access_token=${data.access_token}; path=/; max-age=900; samesite=lax`;
            }
            setUser(data.user);
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            clearSession();
            setUser(null);
            return false;
        }
    }, []);

    // ============================================
    // Merkezi Auth Event Entegrasyonu
    // ============================================
    // API istemcileri (audit-api, api-client, admin-api) 401 aldığında
    // authEvents.emitUnauthorized() çağırır. Bu handler önce token
    // yenilemeyi dener, başarısız olursa logout yapar.
    useEffect(() => {
        authEvents.setUnauthorizedHandler(async (): Promise<boolean> => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                clearSession();
                setUser(null);
                router.push('/login');
                return false;
            }

            const success = await refreshAccessToken();
            if (!success) {
                clearSession();
                setUser(null);
                router.push('/login');
                return false;
            }
            return true;
        });
    }, [refreshAccessToken, router]);

    // Yetki kontrol fonksiyonları
    const hasPermission = useCallback((module: string, action: string): boolean => {
        if (!user) return false;

        // GOD MODE: Admins bypass permission checks
        const normalizedRoles = (user.roles || []).map(r => r.toUpperCase());
        if (normalizedRoles.includes('ADMIN') || normalizedRoles.includes('SYSTEM_ADMIN')) {
            return true;
        }

        if (!user.permissions) return false;

        return user.permissions.some(p =>
            (p.module === module || p.module === 'ALL') &&
            (p.action === action || p.action === 'ALL')
        );
    }, [user]);

    const hasRole = useCallback((role: string): boolean => {
        if (!user || !user.roles) return false;
        
        const normalizedRoles = user.roles.map(r => r.toUpperCase());
        
        // GOD MODE: Admins have all roles
        if (normalizedRoles.includes('ADMIN') || normalizedRoles.includes('SYSTEM_ADMIN')) {
            return true;
        }

        const targetRole = role.toUpperCase();
        
        // DevMode Role Mapping
        if (normalizedRoles.includes('GOZETMEN') || normalizedRoles.includes('GÖZETMEN')) {
            normalizedRoles.push('AUDIT_SUPERVISOR');
        }
        if (normalizedRoles.includes('MUDUR') || normalizedRoles.includes('MÜDÜR')) {
            normalizedRoles.push('AUDIT_MANAGER', 'MANAGER');
        }
        if (normalizedRoles.includes('MUFETTIS') || normalizedRoles.includes('MÜFETTİŞ')) {
            normalizedRoles.push('AUDITOR');
        }
        if (normalizedRoles.includes('ADMIN') || normalizedRoles.includes('SYSTEM_ADMIN') || normalizedRoles.includes('AUDIT_ADMIN')) {
            if (!normalizedRoles.includes('ADMIN')) normalizedRoles.push('ADMIN');
            if (!normalizedRoles.includes('SYSTEM_ADMIN')) normalizedRoles.push('SYSTEM_ADMIN');
            if (!normalizedRoles.includes('AUDIT_ADMIN')) normalizedRoles.push('AUDIT_ADMIN');
        }
        if (normalizedRoles.includes('CAE')) {
            normalizedRoles.push('MANAGER', 'AUDIT_MANAGER', 'ADMIN');
        }

        return normalizedRoles.includes(targetRole);
    }, [user]);

    const setRoles = (newRoles: string[]) => {
        if (!user) return;
        const updatedUser = { ...user, roles: newRoles };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            isLoading,
            hasPermission,
            hasRole,
            refreshAccessToken,
            setRoles
        }}>
            {children}

            {/* Oturum Zaman Aşımı Uyarı Modalı — Merkezi Tasarım Dili */}
            {idleWarningVisible && (
                <ConfirmModal
                    isOpen={idleWarningVisible}
                    onClose={() => { clearAllIdleTimers(); logout(); }}
                    onConfirm={handleIdleWarningDismiss}
                    title="Oturum Zaman Aşımı Uyarısı"
                    message="Uzun süredir işlem yapılmadı. Oturumunuz otomatik olarak sonlandırılacaktır."
                    confirmText="Oturumu Devam Ettir"
                    cancelText="Çıkış Yap"
                    type="warning"
                >
                    <div className={`text-4xl font-extrabold my-4 font-mono tracking-widest bg-gray-50 p-4 rounded-xl border border-gray-100 ${
                        idleCountdown <= 60 ? 'text-red-500 animate-pulse' : 'text-amber-500'
                    }`}>
                        {formatCountdown(idleCountdown)}
                    </div>
                </ConfirmModal>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// API çağrıları için yardımcı hook
export function useAuthenticatedFetch() {
    const { refreshAccessToken, logout } = useAuth();

    const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        let accessToken = localStorage.getItem('access_token');

        const makeRequest = async (token: string | null) => {
            const headers = {
                ...options.headers,
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            };

            return fetch(url, { ...options, headers });
        };

        let response = await makeRequest(accessToken);

        // 401 ise token'ı yenilemeyi dene
        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                accessToken = localStorage.getItem('access_token');
                response = await makeRequest(accessToken);
            } else {
                logout();
            }
        }

        return response;
    }, [refreshAccessToken, logout]);

    return authFetch;
}
