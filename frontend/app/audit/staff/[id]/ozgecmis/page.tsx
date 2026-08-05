'use client';
import PageHeader from '@/components/ui/PageHeader';
import RequireRole from '@/components/auth/RequireRole';


import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auditApi } from '@/lib/audit-api';
import {
    Phone, Mail, Award, Calendar, Shield, Briefcase, GraduationCap, ArrowLeft, Printer, FileText, Globe, MapPin, User, ChevronRight, TrendingUp,
    Users,
    AlertCircle,
    BookOpen
} from 'lucide-react';
import DateDisplay from '@/components/ui/DateDisplay';
import { formatDate } from '@/lib/audit-utils';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import { BackButton } from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';

// Foto¦şraf URL yard¦-mc¦-s¦-
const getPhotoUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${origin}${url}`;
};

function StaffProfilePageContent() {
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
            console.error('Personel profili y+-kleme hatas¦-:', error);
            const errorMessage = error.message === 'Failed to fetch'
                ? 'Sunucuya eri+şilemiyor. L+-tfen internet ba¦şlant¦-n¦-z¦- kontrol ediniz.'
                : 'Personel profili y+-klenirken bir hata olu+ştu.';
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

    if (loading) return <LoadingState message="+ûzge+ğmi+ş Haz¦-rlan¦-yor..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <PageHeader title="M+-fetti+ş +ûzge+ğmi+şi" subtitle="M+-fetti+ş mesleki deneyim ve e¦şitim ayr¦-nt¦-lar¦-" />
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata Olu+ştu</h3>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <Button onClick={() => router.back()} variant="secondary">
                    Geri D+Ân
                </Button>
            </div>
        );
    }

    if (!staff) return <div className="p-10 text-center text-gray-500">Personel bulunamad¦-.</div>;

    const experiences = [...(staff.experiences || [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const education = [...(staff.education || [])].sort((a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0));
    const promotions = [...(staff.promotions || [])].sort((a, b) => new Date(b.promotionDate).getTime() - new Date(a.promotionDate).getTime());

    return (
        <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0 print:min-h-0 overflow-x-hidden">
            {/* +£st Eylem +çubu¦şu - Yazd¦-rmada Gizli */}
            <div className="bg-white border-b sticky top-0 z-30 print:hidden shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
                    <BackButton href="/audit/staff" label="Personel Listesine D+Ân" />
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full mr-2">
                            <AlertCircle size={14} />
                            <span>Bilgileri d+-zenlemek i+ğin Personel Listesi +-zerinden "D+-zenle" butonunu kullan¦-n¦-z.</span>
                        </div>
                        <Button
                            onClick={handlePrint}
                            variant="primary"
                            leftIcon={<Printer size={18} />}
                        >
                            Yazd¦-r / PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* +ûzge+ğmi+ş ¦-+ğeri¦şi */}
            <div className="max-w-4xl mx-auto mt-2 bg-white shadow-sm border border-gray-200 rounded-lg min-h-[900px] overflow-hidden print-layout-enforcer">

                {/* Yazd¦-rma +£st Bo+şluk */}
                <div className="print:h-[2mm] hidden print:block"></div>

                {/* Ba+şl¦-k B+Âl+-m+- */}
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-5 items-center w-full force-print-row">
                    <div className="shrink-0 relative">
                        {staff.photoUrl ? (
                            <img
                                src={getPhotoUrl(staff.photoUrl)!}
                                alt={staff.firstName}
                                className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-md"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-gray-200 text-slate-400">
                                <Users size={56} />
                            </div>
                        )}
                        {/* Rozet kald¦-r¦-ld¦- */}
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-2 pt-0.5">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
                                {String(staff.firstName || '')} <span className="text-gray-900">{/* Soyisim rengi d+-zeltildi */}{String(staff.lastName || '')}</span>
                            </h2>
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

                {/* +ûzet B+Âl+-m+- */}
                {staff.summary && (
                    <div className="px-5 py-4 bg-slate-50/30">
                        <section>
                            <h2 className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5 mb-1.5 uppercase tracking-[0.2em]">
                                <span className="w-6 h-[2px] bg-primary"></span>
                                +ûZET
                            </h2>
                            <p className="text-[13px] text-gray-600 leading-relaxed font-medium text-justify">
                                {String(staff.summary || '')}
                            </p>
                        </section>
                    </div>
                )}

                {/* Ana ¦-+ğerik: ¦-ki S+-tun */}
                <div className="flex flex-col lg:flex-row print:flex-row print:flex-nowrap min-h-[500px] print-row">

                    {/* Sol S+-tun (Deneyimler) */}
                    <div className="flex-1 p-5 space-y-4 border-r border-gray-100 print-left-col">

                        {/* Deneyim B+Âl+-m+- */}
                        <section className="space-y-5">
                            <h2 className="text-[13px] font-black text-gray-900 flex items-center gap-1.5 mb-2.5 uppercase tracking-[0.2em]">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                ¦-+Ş DENEY¦-M¦-
                            </h2>

                            <div className="space-y-6 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-gray-100"></div>

                                {/* Kurum ¦-+ği Pozisyon */}
                                <div className="relative pl-7 group">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-blue-50 z-10"></div>
                                    <div className="mb-1.5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-[14px]">Emlak Kat¦-l¦-m Tasarruf Finansman A+Ş</h3>
                                                <div className="text-[13px] font-bold text-gray-600 mt-0.5">
                                                    <span className="text-primary">{String(staff.title || '')}</span>
                                                    <span className="text-gray-400 font-normal mx-1.5">ÔÇó</span>
                                                    <span className="text-gray-500 font-medium italic">Tefti+ş Kurulu</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[12px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md block">
                                                    {formatDate(staff.hireDate)} - G+-n+-m+-z
                                                </span>
                                                {(() => {
                                                    const start = new Date(staff.hireDate);
                                                    const end = new Date();
                                                    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                                    if (months < 0) months = 0;
                                                    const years = Math.floor(months / 12);
                                                    const remainingMonths = months % 12;
                                                    const durationStr = `${years > 0 ? `${years} Y¦-l ` : ''}${remainingMonths} Ay`;
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
                                                        {exp.department && <span className="text-gray-400 font-normal mx-1.5">ÔÇó</span>}
                                                        {/* Birim italic */}
                                                        <span className="text-gray-500 font-medium italic">{String(exp.department || '')}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[12px] font-bold text-gray-400 whitespace-nowrap block">
                                                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'G+-n+-m+-z' : formatDate(exp.endDate)}
                                                    </span>
                                                    {(() => {
                                                        const start = new Date(exp.startDate);
                                                        const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
                                                        let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                                        if (months < 0) months = 0;
                                                        const years = Math.floor(months / 12);
                                                        const remainingMonths = months % 12;
                                                        const durationStr = `${years > 0 ? `${years} Y¦-l ` : ''}${remainingMonths} Ay`;
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
                                                        const dateMatch = trimmed.match(/^(\d{2}\.\d{2}\.\d{4}[-ÔÇô]\d{2}\.\d{2}\.\d{4})\s+(.+)$/);
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

                    {/* Sa¦ş S+-tun (Kenar +çubu¦şu) */}
                    <div className="w-full lg:w-1/3 bg-slate-50/40 p-5 space-y-5 shrink-0 print-right-col">

                        {/* E¦şitim B+Âl+-m+- */}
                        <section className="print-avoid-break education-section" id="education-section">
                            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <BookOpen size={12} className="text-primary" />
                                E¦Ş¦-T¦-M B¦-LG¦-LER¦-
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
                                    <p className="text-[12px] text-gray-400 italic">E¦şitim bilgisi bulunamad¦-.</p>
                                )}
                            </div>
                        </section>

                        {/* Yetenekler B+Âl+-m+- */}
                        {staff.skills && staff.skills.trim() && (
                            <section className="print-avoid-break">
                                <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-primary" />
                                    YETENEKLER
                                </h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                        let skillsArr: string[] = [];
                                        try {
                                            if (Array.isArray(staff.skills)) {
                                                skillsArr = staff.skills;
                                            } else if (typeof staff.skills === 'string' && staff.skills.trim()) {
                                                const trimmed = staff.skills.trim();
                                                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                    try {
                                                        const parsed = JSON.parse(trimmed);
                                                        skillsArr = Array.isArray(parsed) ? parsed.map((s: any) => s.value || s.label || s) : [trimmed];
                                                    } catch (e) { skillsArr = [trimmed]; }
                                                } else {
                                                    skillsArr = trimmed.split(',').map((s: string) => s.trim());
                                                }
                                            }
                                        } catch (e) { skillsArr = []; }
                                        skillsArr = skillsArr.filter(s => s && s.trim() && s.trim() !== '[]' && s.trim() !== '""');

                                        return skillsArr.map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white text-gray-700 text-[11px] font-bold rounded-md border border-gray-200 shadow-sm">
                                                {String(skill || '').replace(/[\[\]"]/g, '').trim()}
                                            </span>
                                        ));
                                    })()}
                                </div>
                            </section>
                        )}

                        {/* Mesleki E¦şitimler */}
                        <section className="print-avoid-break mt-3">
                            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <BookOpen size={12} className="text-primary" />
                                MESLEK¦- E¦Ş¦-T¦-MLER
                            </h2>
                            <ul className="space-y-1.5">
                                {/* 1. Sistemden Gelen E¦şitimler (AuditEducation) */}
                                {staff.trainings && Array.isArray(staff.trainings) && staff.trainings.map((t: any, i: number) => (
                                    <li key={`auto-${i}`} className="flex flex-col gap-0.5 text-[13px]">
                                        <div className="font-bold text-gray-900">{String(t.title || '')}</div>
                                        <div className="flex items-center gap-1.5 text-gray-600 text-[12px]">
                                            <span>{String(t.provider || '')}</span>
                                            {(() => {
                                                try {
                                                    if (!t.date) return null;
                                                    let dateStr = t.date;
                                                    // YYYY-MM-DD format¦-n¦- kontrol et
                                                    if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.date)) {
                                                        const [y, m, d] = t.date.split('T')[0].split('-');
                                                        dateStr = `${d.trim()}.${m.trim()}.${y.trim()}`;
                                                    } else {
                                                        // Date nesnesiyle geri d+Ân+-+ş
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

                        {/* Sertifikalar B+Âl+-m+- */}
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
                                            SERT¦-F¦-KALAR
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

                        {/* Terfi B+Âl+-m+- */}
                        {
                            promotions.length > 0 && (
                                <section className="print-avoid-break">
                                    <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Shield size={12} className="text-primary" />
                                        TERF¦- VE KAR¦-YER
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

                {/* Alt Bilgi - Yazd¦-rma ¦-+ğin Optimize */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center print-footer print:bg-white print:fixed print:bottom-0 print:left-0 print:right-0 print:z-[1000] print:py-3">
                    <div className="flex flex-col gap-1 px-5">
                        <p className="text-[11px] text-gray-500 italic leading-relaxed font-medium print:text-black flex items-center justify-center gap-1 flex-wrap">
                            <span>Bu belge, ¦-+ğ Sistemler Platformu - Tefti+ş Kurulu Mod+-l+- +-zerinden, {creationReason ? `"${String(creationReason)}"` : 'Yasal Mevzuat ve Kurumsal Denetim haz¦-rl¦-¦ş¦-'} nedeniyle {String(user?.displayName || user?.username || 'Sistem Y+Ânetici')} taraf¦-ndan</span>
                            <DateDisplay value={new Date()} format="datetime" className="italic font-bold" />
                            <span>tarihinde olu+şturulmu+ştur.</span>
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
                    /* Sayfa Ayar¦- */
                    @page {
                        margin-top: 0mm;
                        margin-bottom: 20mm;
                        margin-left: 10mm;
                        margin-right: 10mm;
                        size: A4;
                    }

                    /* Kayd¦-rma +çubu¦şu Gizle */
                    ::-webkit-scrollbar {
                        display: none;
                    }

                    /* Genel Yazd¦-rma Stilleri */
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

                    /* Y+-ksek Kalite Kapsay¦-c¦- */
                    .print-layout-enforcer {
                        padding: 10mm !important; /* G+-venli bo+şluk */
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
                        min-height: 100% !important; /* Tam sayfa y+-ksekli¦şi */
                        height: auto !important;
                        transform: none !important;
                    }

                    /* D+-zen S+-tunlar¦- - Boyut Zorla */
                    .print-left-col {
                        width: 65% !important;
                        flex: none !important;
                        padding-right: 2rem !important; /* Ay¦-rmay¦- sa¦şla */
                        border-right: 1px solid #f3f4f6 !important;
                    }
                    .print-right-col {
                        width: 35% !important;
                        flex: none !important;
                        padding-left: 2rem !important;
                        background-color: #f8fafc !important; /* bg-slate-50/40 kar+ş¦-l¦-¦ş¦- */
                    }
                    
                    /* ¦-+ğ +Â¦şeler i+ğin kenar/dolgu s¦-f¦-rlama */
                    .print-row {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        margin: 0 !important;
                    }

                    /* S+-tun ve D+-zen Koruma */
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

                    /* Sayfa Sonu Y+Ânetimi */
                    .print-avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    section {
                        margin-bottom: 6mm !important;
                    }

                    /* Yazd¦-rma Alt Bilgisi */
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
                    
                    /* Ba+şl¦-k Sat¦-r¦-n¦- Zorla */
                    .force-print-row {
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: flex-start !important;
                        gap: 2rem !important;
                    }
                    
                    /* Metin G+Âr+-n+-rl+-¦ş+-n+- Zorla */
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


export default function StaffProfilePage() {
    return (
        <RequireRole allowedRoles={['GOZETIM_SORUMLUSU', 'KURUL_BASKANI', 'ADMIN', 'SUPER_ADMIN']}>
            <StaffProfilePageContent />
        </RequireRole>
    );
}
