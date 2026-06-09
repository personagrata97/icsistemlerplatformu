'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auditApi } from '@/lib/audit-api';
import {
    Mail,
    Phone,
    Calendar,
    MapPin,
    Briefcase,
    TrendingUp,
    Shield,
    Download,
    Printer,
    ChevronLeft,
    Users,
    History,
    CheckCircle2,
    Award
} from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import Button from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';

// Fotoğraf URL yardımcısı
const getPhotoUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${origin}${url}`;
};

export default function StaffOzgecmisLegacyPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [staff, setStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadStaffProfile();
        }
    }, [id]);

    const loadStaffProfile = async () => {
        try {
            setLoading(true);
            const data = await auditApi.getStaffProfile(id as string);
            setStaff(data);
        } catch (error) {
            console.error('Personel profili yükleme hatası:', error);
            showToast('Personel profili yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <LoadingState message="Özgeçmiş Hazırlanıyor..." />;
    if (!staff) return <div className="p-10 text-center text-gray-500">Personel bulunamadı.</div>;

    const experiences = [...(staff.experiences || [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const education = [...(staff.education || [])].sort((a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0));
    const promotions = [...(staff.promotions || [])].sort((a, b) => new Date(b.promotionDate).getTime() - new Date(a.promotionDate).getTime());

    return (
        <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
            {/* Üst Eylem Çubuğu - Yazdırmada Gizli */}
            <div className="bg-white border-b sticky top-0 z-10 print:hidden">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <BackButton href="/audit/staff" label="Geri Dön" />
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handlePrint}
                            variant="primary"
                            leftIcon={<Printer size={18} />}
                        >
                            Yazdır / PDF Kaydet
                        </Button>
                    </div>
                </div>
            </div>

            {/* Özgeçmiş İçeriği */}
            <div className="max-w-5xl mx-auto mt-8 bg-white shadow-xl min-h-[1122px] overflow-hidden print:mt-0 print:shadow-none print:w-full">

                {/* Başlık / Kişisel Bilgi */}
                <div className="bg-slate-900 text-white p-12 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="relative z-10">
                        {staff.photoUrl ? (
                            <img
                                src={getPhotoUrl(staff.photoUrl)!}
                                alt={staff.firstName}
                                className="w-40 h-40 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                            />
                        ) : (
                            <div className="w-40 h-40 rounded-2xl bg-slate-800 border-4 border-white/20 flex items-center justify-center shadow-2xl">
                                <Users size={64} className="text-slate-600" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left relative z-10">
                        <h1 className="text-4xl font-black tracking-tight">{staff.firstName} {staff.lastName}</h1>
                        <p className="text-xl text-primary font-bold mt-2 uppercase tracking-widest">{staff.title}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Mail size={16} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium">{staff.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Phone size={16} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium">{staff.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Calendar size={16} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium">Sicil No: {staff.employeeId}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Shield size={16} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium">İşe Giriş: {formatDate(staff.hireDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Sol Sütun - Ana Detaylar */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Özet */}
                        {staff.summary && (
                            <section>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-wider border-b-2 border-slate-100 pb-2">
                                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                                    Profesyonel Özet
                                </h2>
                                <p className="text-slate-600 leading-relaxed text-lg italic">
                                    "{staff.summary}"
                                </p>
                            </section>
                        )}

                        {/* İş Deneyimi */}
                        <section>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8 uppercase tracking-wider border-b-2 border-slate-100 pb-2">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                İş Deneyimi
                            </h2>
                            <div className="space-y-10 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                                {experiences.map((exp: any, index: number) => (
                                    <div key={exp.id || index} className="relative pl-12">
                                        <div className="absolute left-1.5 top-1.5 w-5 h-5 rounded-full bg-primary border-4 border-white shadow-sm z-10"></div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-xl font-bold text-slate-900 leading-none">{exp.position}</h3>
                                            <span className="text-sm font-bold text-primary bg-primary/5 px-3 py-1 rounded-full whitespace-nowrap">
                                                {formatDate(exp.startDate)} - {exp.isCurrent ? 'Günümüz' : formatDate(exp.endDate)}
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-500 mb-3">{exp.companyName}</div>
                                        {exp.description && (
                                            <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                ))}

                                {experiences.length === 0 && (
                                    <div className="pl-12 text-slate-400 italic">Kayıtlı dış deneyim bulunmamaktadır.</div>
                                )}
                            </div>
                        </section>

                        {/* Kurum İçi Kariyer Geçmişi */}
                        <section>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8 uppercase tracking-wider border-b-2 border-slate-100 pb-2">
                                <div className="w-2 h-8 bg-primary rounded-full"></div>
                                Kurum İçi Kariyer Geçmişi
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                {promotions.length > 0 ? (
                                    promotions.map((promo: any, index: number) => (
                                        <div key={promo.id || index} className="p-6 rounded-2xl border-2 border-slate-50 relative overflow-hidden group hover:border-primary/20 transition-all">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <History size={48} />
                                            </div>
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="text-sm font-black text-primary uppercase tracking-widest">{promo.type || 'TERFİ'}</div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                <div className="text-sm font-bold text-slate-400">{formatDate(promo.promotionDate)}</div>
                                            </div>
                                            <div className="text-xl font-black text-slate-800">{promo.title}</div>
                                            {promo.notes && (
                                                <div className="mt-3 text-sm text-slate-500 italic bg-slate-50 p-3 rounded-xl">
                                                    "{promo.notes}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 rounded-2xl bg-slate-50 text-slate-500 italic">
                                        Kurum içi terfi kaydı bulunmamaktadır.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sağ Sütun - Kenar Çubuğu */}
                    <div className="space-y-12">

                        {/* Yetenekler */}
                        <section>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-wider border-b-2 border-slate-100 pb-2 font-mono">
                                01. YETENEKLER
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    if (!staff.skills) return <span className="text-slate-400 italic">Belirtilmedi</span>;
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

                                    if (skillsArr.length === 0) return <span className="text-slate-400 italic">Belirtilmedi</span>;

                                    return skillsArr.map((skill, i) => (
                                        <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg border border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all cursor-default">
                                            {String(skill || '').replace(/[\[\]"]/g, '').trim()}
                                        </span>
                                    ));
                                })()}
                            </div>
                        </section>

                        {/* Sertifikalar */}
                        <section>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-wider border-b-2 border-slate-100 pb-2 font-mono">
                                02. SERTİFİKALAR
                            </h2>
                            <div className="space-y-3">
                                {(() => {
                                    if (!staff.certifications) return <span className="text-slate-400 italic">Belirtilmedi</span>;
                                    let certsArr: string[] = [];
                                    try {
                                        if (Array.isArray(staff.certifications)) {
                                            certsArr = staff.certifications;
                                        } else if (typeof staff.certifications === 'string' && staff.certifications.trim()) {
                                            const trimmed = staff.certifications.trim();
                                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                try {
                                                    const parsed = JSON.parse(trimmed);
                                                    certsArr = Array.isArray(parsed) ? parsed.map((s: any) => s.value || s.label || s) : [trimmed];
                                                } catch (e) { certsArr = [trimmed]; }
                                            } else {
                                                certsArr = trimmed.split(',').map((s: string) => s.trim());
                                            }
                                        }
                                    } catch (e) { certsArr = []; }
                                    certsArr = certsArr.filter(c => c && c.trim() && c.trim() !== '[]' && c.trim() !== '""');

                                    if (certsArr.length === 0) return <span className="text-slate-400 italic">Belirtilmedi</span>;

                                    return certsArr.map((cert, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 group">
                                            <Award size={18} className="text-primary mt-0.5" />
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{String(cert || '').replace(/[\[\]"]/g, '').trim()}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </section>

                        {/* Eğitim */}
                        <section>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-wider border-b-2 border-slate-100 pb-2 font-mono">
                                03. EĞİTİM
                            </h2>
                            <div className="space-y-8 relative">
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                                {education.map((edu: any, index: number) => (
                                    <div key={edu.id || index} className="relative pl-10">
                                        <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-white border-2 border-primary flex items-center justify-center z-10">
                                            <Shield size={12} className="text-primary" />
                                        </div>
                                        <div className="text-sm font-black text-primary mb-1 uppercase tracking-tighter">{edu.graduationYear}</div>
                                        <h3 className="font-black text-slate-800 leading-tight">{edu.schoolName}</h3>
                                        <p className="text-sm text-slate-500 font-bold mt-1">{edu.degree} - {edu.department}</p>
                                    </div>
                                ))}
                                {education.length === 0 && <span className="pl-10 text-slate-400 italic">Belirtilmedi</span>}
                            </div>
                        </section>

                        {/* Alt Bilgi */}
                        <section className="pt-20 print:pt-10">
                            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 text-center">
                                <div className="flex justify-center mb-4 opacity-20">
                                    <CheckCircle2 size={48} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold leading-tight uppercase tracking-widest leading-loose">
                                    BU BELGE SİSTEM ÜZERİNDEN OTOMATİK OLARAK OLUŞTURULMUŞTUR.<br />
                                    DOĞRULUK TEYİDİ İÇİN İÇ SİSTEMLER PLATFORMUNA BAŞVURUNUZ.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Yazdırma Stili */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
