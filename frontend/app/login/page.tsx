'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    // Clear stale session items when arriving at login page without redirect target
    useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const redirectParam = params.get('redirect');
            if (!redirectParam || params.get('expired') === '1') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(data.message || 'Kullanıcı adı veya şifre hatalı.');
                }
                throw new Error(data.message || 'Giriş başarısız.');
            }

            showToast('Giriş Başarılı! Yönlendiriliyorsunuz...', 'success');

            setTimeout(() => {
                login(data.access_token, data.refresh_token, data.user);
            }, 1000);

        } catch (err: any) {
            let errorMessage = err.message;
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                errorMessage = 'Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin veya sistem yöneticisi ile iletişime geçin.';
            }
            showToast(errorMessage, 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">

                    <div className="text-center mb-8">
                        <div className="w-full flex justify-center mb-6">
                            <img src="/logo.png" alt="Emlak Katılım Logo" className="h-16 object-contain mix-blend-multiply" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2 font-sans">İç Sistemler Yönetim Sistemi</h1>
                        <p className="text-gray-500 font-medium">Emlak Katılım Tasarruf Finansman</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSubmit(e as any);
                                        }
                                    }}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    placeholder="Sicil Numarası veya Şirket E-Postası"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSubmit(e as any);
                                        }
                                    }}
                                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    placeholder="Bilgisayar Açılış Şifresi"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white text-base font-semibold py-4 rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Giriş Yapılıyor...</span>
                                </div>
                            ) : (
                                <>
                                    Giriş Yap <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="pt-4 border-t border-gray-100 text-center">
                            <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-1">
                                <strong>TEST ORTAMI — ORTAK ŞİFRE:</strong> <span className="text-red-500 font-bold text-xs">Test1234!</span>
                            </p>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                Müfettiş: <strong>mufettis</strong> | Gözetmen: <strong>gozetmen</strong> | Müdür: <strong>mudur</strong> | Admin: <strong>admin</strong>
                            </p>
                        </div>
                    </form>

                    {/* Public Ethics Report Portal Action Card */}
                    <div className="mt-6">
                        <div className="relative p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 group">
                            {/* Accent Line */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full opacity-50" />

                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">Etik İhbar Hattı</h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => router.push('/ethics')}
                                className="w-full py-3 bg-white border border-gray-200 rounded-xl text-primary text-xs font-black tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
                            >
                                PORTALA GİT
                                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-6 space-y-2">
                    <p className="text-gray-400 text-sm font-medium">
                        © 2026 Emlak Katılım Tasarruf Finansman AŞ
                        <br />
                        İç Sistemler Yönetim Sistemi
                    </p>
                </div>
            </div>
        </div>
    );
}
