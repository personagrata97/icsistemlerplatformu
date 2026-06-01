'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auditApi } from '@/lib/audit-api';
import {
    Mail,
    Phone,
    Calendar,
    TrendingUp,
    Shield,
    Printer,
    Users,
    Award,
    AlertCircle,
    BookOpen
} from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import { BackButton } from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';

export default function StaffProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlReason = searchParams.get('reason');
    const { user } = useAuth();
    const { showToast } = useToast();
    const [staff, setStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creationReason] = useState<string>(urlReason || '');
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        if (id) {
            loadStaffProfile();
        }
    }, [id]);

    const loadStaffProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await auditApi.getStaffProfile(id as string);
            setStaff(data);
        } catch (error: any) {
            console.error('Personel profili yükleme hatası:', error);
            const errorMessage = error.message === 'Failed to fetch'
                ? 'Sunucuya erişilemiyor. Lütfen internet bağlantınızı kontrol ediniz.'
                : 'Personel profili yüklenirken bir hata oluştu.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 300);
    };

    if (loading) return <LoadingState message="Özgeçmiş Hazırlanıyor..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <Button onClick={() => router.back()} variant="secondary">
                    Geri Dön
                </Button>
            </div>
        );
    }

    if (!staff) return <div className="p-10 text-center text-gray-500">Personel bulunamadı.</div>;

    const experiences = [...(staff.experiences || [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const education = [...(staff.education || [])].sort((a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0));
    const promotions = [...(staff.promotions || [])].sort((a, b) => new Date(b.promotionDate).getTime() - new Date(a.promotionDate).getTime());

    return (
        <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0 print:min-h-0 overflow-x-hidden">
            {/* Üst Eylem Çubuğu - Yazdırmada Gizli */}
            <div className="bg-white border-b sticky top-0 z-30 print:hidden shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
                    <BackButton href="/audit/staff" label="Personel Listesine Dön" />
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full mr-2">
                            <AlertCircle size={14} />
                            <span>Bilgileri düzenlemek için Personel Listesi üzerinden "Düzenle" butonunu kullanınız.</span>
                        </div>
                        <Button
                            onClick={handlePrint}
                            variant="primary"
                            leftIcon={<Printer size={18} />}
                        >
                            Yazdır / PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Özgeçmiş İçeriği */}
            <div className="max-w-4xl mx-auto mt-2 bg-white shadow-sm border border-gray-200 rounded-lg min-h-[900px] overflow-hidden print-layout-enforcer">

                {/* Yazdırma Üst Boşluk */}
                <div className="print:h-[2mm] hidden print:block"></div>

                {/* Başlık Bölümü */}
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-5 items-center w-full force-print-row">
                    <div className="shrink-0 relative">
                        {staff.photoUrl ? (
                            <img
                                src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${staff.photoUrl}`}
                                alt={staff.firstName}
                                className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-md"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-gray-200 text-slate-400">
                                <Users size={56} />
                            </div>
                        )}
                        {/* Rozet kaldırıldı */}
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-2 pt-0.5">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
                                {String(staff.firstName || '')} <span className="text-gray-900">{/* Soyisim rengi düzeltildi */}{String(staff.lastName || '')}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2 py-0.5 bg-primary text-white text-[11px] font-bold rounded-md uppercase tracking-wider">
                                    {String(staff.title || '')}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-gray-600 font-medium print:mt-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-gray-50 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <Mail size={11} />
                                </div>
                                <span>{String(staff.email || '')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-gray-50 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <Phone size={11} />
                                </div>
                                <span>{String(staff.phone || '-')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Özet Bölümü */}
                {staff.summary && (
                    <div className="px-5 py-4 bg-slate-50/30">
                        <section>
                            <h2 className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5 mb-1.5 uppercase tracking-[0.2em]">
                                <span className="w-6 h-[2px] bg-primary"></span>
                                ÖZET
                            </h2>
                            <p className="text-[13px] text-gray-600 leading-relaxed font-medium text-justify">
                                {String(staff.summary || '')}
                            </p>
                        </section>
                    </div>
                )}

                {/* Ana İçerik: İki Sütun */}
                <div className="flex flex-col lg:flex-row print:flex-row print:flex-nowrap min-h-[500px] print-row">

                    {/* Sol Sütun (Deneyimler) */}
                    <div className="flex-1 p-5 space-y-4 border-r border-gray-100 print-left-col">

                        {/* Deneyim Bölümü */}
                        <section className="space-y-5">
                            <h2 className="text-[13px] font-black text-gray-900 flex items-center gap-1.5 mb-2.5 uppercase tracking-[0.2em]">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                İŞ DENEYİMİ
                            </h2>

                            <div className="space-y-6 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-gray-100"></div>

                                {/* Kurum İçi Pozisyon */}
                                <div className="relative pl-7 group">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-blue-50 z-10"></div>
                                    <div className="mb-1.5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-[14px]">Emlak Katılım Tasarruf Finansman AŞ</h3>
                                                <div className="text-[13px] font-bold text-gray-600 mt-0.5">
                                                    <span className="text-primary">{String(staff.title || '')}</span>
                                                    <span className="text-gray-400 font-normal mx-1.5">•</span>
                                                    <span className="text-gray-500 font-medium italic">Teftiş Kurulu</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[12px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md block">
                                                    {formatDate(staff.hireDate)} - Günümüz
                                                </span>
                                                {(() => {
                                                    const start = new Date(staff.hireDate);
                                                    const end = new Date();
                                                    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                                    if (months < 0) months = 0;
                                                    const years = Math.floor(months / 12);
                                                    const remainingMonths = months % 12;
                                                    const durationStr = `${years > 0 ? `${years} Yıl ` : ''}${remainingMonths} Ay`;
                                                    return (
                                                        <span className="text-[11px] text-gray-400 font-medium block mt-0.5 pr-1">
                                                            ({durationStr})
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {staff.jobDescription && (
                                        <p className="text-[12px] text-gray-500 leading-relaxed mt-1.5 font-medium">
                                            {staff.jobDescription}
                                        </p>
                                    )}
                                </div>

                                {experiences.map((exp: any, index: number) => (
                                    <div key={exp.id || index} className="relative pl-7 print-avoid-break">
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-gray-200 z-10"></div>
                                        <div className="mb-5 last:mb-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-[14px]">{String(exp.companyName || '')}</h3>
                                                    <div className="text-[13px] font-bold text-gray-600 mt-0.5">
                                                        <span className="text-primary">{String(exp.position || '')}</span>
                                                        {exp.department && <span className="text-gray-400 font-normal mx-1.5">•</span>}
                                                        {/* Birim italic */}
                                                        <span className="text-gray-500 font-medium italic">{String(exp.department || '')}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[12px] font-bold text-gray-400 whitespace-nowrap block">
                                                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Günümüz' : formatDate(exp.endDate)}
                                                    </span>
                                                    {(() => {
                                                        const start = new Date(exp.startDate);
                                                        const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
                                                        let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                                        if (months < 0) months = 0;
                                                        const years = Math.floor(months / 12);
                                                        const remainingMonths = months % 12;
                                                        const durationStr = `${years > 0 ? `${years} Yıl ` : ''}${remainingMonths} Ay`;
                                                        return (
                                                            <span className="text-[11px] text-gray-300 font-medium block mt-0.5">
                                                                ({durationStr})
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Kariyer Yolu */}
                                            {exp.careerPaths && exp.careerPaths.trim().length > 0 && exp.careerPaths !== '[]' && (
                                                <div className="mt-2 mb-1.5 ml-1 border-l-2 border-dashed border-gray-100 pl-2.5 space-y-1">
                                                    {exp.careerPaths.split('\n').filter((l: string) => l.trim() && l.trim() !== '[]').map((line: string, idx: number) => {
                                                        const trimmed = line.trim();
                                                        const dateMatch = trimmed.match(/^(\d{2}\.\d{2}\.\d{4}[-–]\d{2}\.\d{2}\.\d{4})\s+(.+)$/);
                                                        if (dateMatch) {
                                                            return (
                                                                <div key={idx} className="flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                                                                    <div>
                                                                        <div className="text-[9px] text-gray-400 font-medium leading-tight">{dateMatch[1]}</div>
                                                                        <div className="font-bold text-gray-700 text-[11px] leading-tight">{dateMatch[2]}</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div key={idx} className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></div>
                                                                <div className="font-bold text-gray-700 text-[11px]">
                                                                    {trimmed}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {exp.description && (
                                                <p className="text-[12px] text-gray-500 leading-relaxed mt-1.5 font-medium">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sağ Sütun (Kenar Çubuğu) */}
                    <div className="w-full lg:w-1/3 bg-slate-50/40 p-5 space-y-5 shrink-0 print-right-col">

                        {/* Eğitim Bölümü */}
                        <section className="print-avoid-break education-section" id="education-section">
                            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <BookOpen size={12} className="text-primary" />
                                EĞİTİM BİLGİLERİ
                            </h2>
                            <div className="space-y-2">
                                {education.length > 0 ? education.map((edu: any, index: number) => (
                                    <div key={edu.id || index} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-gray-100">
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 text-primary font-extrabold text-[11px]">
                                            {edu.graduationYear}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 text-[11px] leading-tight">{String(edu.schoolName || '')}</h3>
                                            <div className="text-[9px] text-gray-400 font-medium mt-0.5 italic">
                                                {String(edu.faculty || '')}
                                            </div>
                                            <div className="text-primary font-bold text-[10px]">
                                                {String(edu.department || '')}
                                            </div>
                                            <p className="text-[9px] text-gray-500 mt-0.5 font-semibold">{String(edu.degree || '')}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-[12px] text-gray-400 italic">Eğitim bilgisi bulunamadı.</p>
                                )}
                            </div>
                        </section>

                        {/* Yetenekler Bölümü */}
                        {staff.skills && staff.skills.trim() && (
                            <section className="print-avoid-break">
                                <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-primary" />
                                    YETENEKLER
                                </h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.skills.split(',').map((skill: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-white text-gray-700 text-[11px] font-bold rounded-md border border-gray-200 shadow-sm">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Mesleki Eğitimler */}
                        <section className="print-avoid-break mt-3">
                            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <BookOpen size={12} className="text-primary" />
                                MESLEKİ EĞİTİMLER
                            </h2>
                            <ul className="space-y-1.5">
                                {/* 1. Sistemden Gelen Eğitimler (AuditEducation) */}
                                {staff.trainings && Array.isArray(staff.trainings) && staff.trainings.map((t: any, i: number) => (
                                    <li key={`auto-${i}`} className="flex flex-col gap-0.5 text-[13px]">
                                        <div className="font-bold text-gray-900">{String(t.title || '')}</div>
                                        <div className="flex items-center gap-1.5 text-gray-600 text-[12px]">
                                            <span>{String(t.provider || '')}</span>
                                            {(() => {
                                                try {
                                                    if (!t.date) return null;
                                                    let dateStr = t.date;
                                                    // YYYY-MM-DD formatını kontrol et
                                                    if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.date)) {
                                                        const [y, m, d] = t.date.split('T')[0].split('-');
                                                        dateStr = `${d.trim()}.${m.trim()}.${y.trim()}`;
                                                    } else {
                                                        // Date nesnesiyle geri dönüş
                                                        const d = new Date(t.date);
                                                        if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('tr-TR');
                                                    }

                                                    return (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                            <span>{dateStr}</span>
                                                        </>
                                                    );
                                                } catch (e) {
                                                    return null;
                                                }
                                            })()}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Sertifikalar Bölümü */}
                        {
                            (() => {
                                let certs: string[] = [];
                                try {
                                    if (Array.isArray(staff.certifications)) {
                                        certs = staff.certifications;
                                    } else if (typeof staff.certifications === 'string' && staff.certifications.trim()) {
                                        const trimmed = staff.certifications.trim();
                                        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                            try {
                                                const parsed = JSON.parse(trimmed);
                                                certs = Array.isArray(parsed) ? parsed : [trimmed];
                                            } catch (e) { certs = [trimmed]; }
                                        } else {
                                            certs = trimmed.split(',').map((c: string) => c.trim());
                                        }
                                    }
                                } catch (e) { certs = []; }
                                certs = certs.filter(c => c && c.trim() && c.trim() !== '[]' && c.trim() !== '""');

                                if (certs.length === 0) return null;

                                return (
                                    <section className="print-avoid-break">
                                        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <Award size={12} className="text-primary" />
                                            SERTİFİKALAR
                                        </h2>
                                        <ul className="space-y-2">
                                            {certs.map((cert, i) => (
                                                <li key={i} className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                                        <Award size={10} />
                                                    </div>
                                                    <span className="text-[13px] font-bold text-gray-700 leading-snug">{String(cert || '').replace(/[\[\]"]/g, '').trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                );
                            })()
                        }

                        {/* Terfi Bölümü */}
                        {
                            promotions.length > 0 && (
                                <section className="print-avoid-break">
                                    <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Shield size={12} className="text-primary" />
                                        TERFİ VE KARİYER
                                    </h2>
                                    <div className="space-y-4 relative ml-1">
                                        <div className="absolute left-[5px] top-2 bottom-2 w-[1px] bg-gray-200"></div>
                                        {promotions.map((promo: any, index: number) => (
                                            <div key={promo.id || index} className="relative pl-4">
                                                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white z-10"></div>
                                                <div className="text-[11px] font-black text-primary mb-0.5">{formatDate(promo.promotionDate)}</div>
                                                <div className="font-bold text-gray-800 text-[13px] leading-tight">
                                                    {promo.title}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">{promo.type || 'ATAMA'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        }
                    </div>
                </div>

                {/* Alt Bilgi - Yazdırma İçin Optimize */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center print-footer print:bg-white print:fixed print:bottom-0 print:left-0 print:right-0 print:z-[1000] print:py-3">
                    <div className="flex flex-col gap-1 px-5">
                        <p className="text-[11px] text-gray-500 italic leading-relaxed font-medium print:text-black">
                            Bu belge, İç Sistemler Platformu - Teftiş Kurulu Modülü üzerinden, {creationReason ? `"${String(creationReason)}"` : 'Yasal Mevzuat ve Kurumsal Denetim hazırlığı'} nedeniyle {String(user?.displayName || user?.username || 'Sistem Yönetici')} tarafından {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} tarihinde oluşturulmuştur.
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-2 border-t border-gray-100 pt-1.5 print:border-gray-200">
                            <span className="hidden print:block">{currentUrl}</span>
                            <span className="hidden print:block font-bold">Resmi Evrak - Gizli</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    /* Sayfa Ayarı */
                    @page {
                        margin-top: 0mm;
                        margin-bottom: 20mm;
                        margin-left: 10mm;
                        margin-right: 10mm;
                        size: A4;
                    }

                    /* Kaydırma Çubuğu Gizle */
                    ::-webkit-scrollbar {
                        display: none;
                    }

                    /* Genel Yazdırma Stilleri */
                    html, body {
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: 'Inter', sans-serif !important;
                    }

                    * {
                        box-sizing: border-box !important;
                    }

                    /* Yüksek Kalite Kapsayıcı */
                    .print-layout-enforcer {
                        padding: 10mm !important; /* Güvenli boşluk */
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        position: relative !important;
                        left: 0 !important;
                        top: 0 !important;
                        border: none !important; 
                        box-shadow: none !important;
                        background: white !important;
                        display: block !important;
                        min-height: 100% !important; /* Tam sayfa yüksekliği */
                        height: auto !important;
                        transform: none !important;
                    }

                    /* Düzen Sütunları - Boyut Zorla */
                    .print-left-col {
                        width: 65% !important;
                        flex: none !important;
                        padding-right: 2rem !important; /* Ayırmayı sağla */
                        border-right: 1px solid #f3f4f6 !important;
                    }
                    .print-right-col {
                        width: 35% !important;
                        flex: none !important;
                        padding-left: 2rem !important;
                        background-color: #f8fafc !important; /* bg-slate-50/40 karşılığı */
                    }
                    
                    /* İç öğeler için kenar/dolgu sıfırlama */
                    .print-row {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        margin: 0 !important;
                    }

                    /* Sütun ve Düzen Koruma */
                    .print\:hidden, .sticky, button, header, nav {
                        display: none !important;
                    }

                    /* Arka Plan Rengi Koruma */
                    .bg-slate-50\/40, .bg-gray-50\/50, .bg-slate-50\/30 {
                        background-color: #f8fafc !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Kart Stil Koruma */
                    .rounded-xl, .rounded-2xl {
                        border: 1px solid #f1f5f9 !important;
                        border-radius: 0.75rem !important;
                    }

                    /* Sayfa Sonu Yönetimi */
                    .print-avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    section {
                        margin-bottom: 6mm !important;
                    }

                    /* Yazdırma Alt Bilgisi */
                    .print-footer {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        background: white !important;
                        border-top: 0.5pt solid #eee !important;
                        text-align: center !important;
                        padding: 4mm !important;
                    }
                    
                    /* Başlık Satırını Zorla */
                    .force-print-row {
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: flex-start !important;
                        gap: 2rem !important;
                    }
                    
                    /* Metin Görünürlüğünü Zorla */
                    #education-section, .education-section {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                }
            `}</style>
        </div>
    );
}
