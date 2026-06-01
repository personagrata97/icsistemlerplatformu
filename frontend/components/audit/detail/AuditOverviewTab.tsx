'use client';

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Clock, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auditApi } from '@/lib/audit-api';
import Button from '@/components/ui/Button';
import ActionLink from '@/components/ui/ActionLink';
import AuditGanttChart from '../AuditGanttChart';

interface AuditOverviewTabProps {
    auditData: any;
    findings: any[];
    progress: number;
}

const AuditOverviewTab: React.FC<AuditOverviewTabProps> = ({
    auditData,
    findings,
    progress
}) => {
    const router = useRouter();
    // Timesheet Özeti
    const [timesheetSummary, setTimesheetSummary] = useState<any>(null);

    useEffect(() => {
        if (auditData?.id) {
            auditApi.getAuditTimesheetSummary(auditData.id)
                .then(data => setTimesheetSummary(data))
                .catch(() => setTimesheetSummary(null));
        }
    }, [auditData?.id]);

    return (
        <div className="space-y-6">
            {/* Denetim Görev Detayları */}
            <div className="card !p-0 shadow-sm">
                <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <FileText size={20} className="text-primary" /> Denetim Detayları
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Denetim Amacı</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                            {auditData.objective || <span className="text-gray-400 italic">Lütfen denetim amaç ve hedeflerini belirtiniz.</span>}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Denetim Kapsamı</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                            {auditData.scope || <span className="text-gray-400 italic">Denetim kapsamını ve sınırlarını tanımlayınız.</span>}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Yöntem</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                            {auditData.methodology || <span className="text-gray-400 italic">Denetim yöntemini belirtiniz (risk bazlı, süreç bazlı vb.)</span>}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Kriterler</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                            {auditData.criteria || <span className="text-gray-400 italic">Referans aldığınız mevzuat ve standartları belirtiniz</span>}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Dağılımı */}
                <div className="card !p-0 shadow-sm">
                    <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <AlertCircle size={20} className="text-primary" /> Risk Dağılımı
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-rose-700">{findings.filter(f => f.riskLevel === 'Kritik').length}</div>
                                <div className="text-xs text-rose-600">Kritik</div>
                            </div>
                            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-red-600">{findings.filter(f => f.riskLevel === 'Yüksek').length}</div>
                                <div className="text-xs text-red-600">Yüksek</div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-orange-600">{findings.filter(f => f.riskLevel === 'Orta').length}</div>
                                <div className="text-xs text-orange-600">Orta</div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-yellow-600">{findings.filter(f => f.riskLevel === 'Düşük').length}</div>
                                <div className="text-xs text-yellow-600">Düşük</div>
                            </div>
                        </div>
                        {findings.filter(f => f.riskLevel === 'Kritik' || f.riskLevel === 'Yüksek').length > 0 && (
                            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
                                <strong>{findings.filter(f => f.riskLevel === 'Kritik' || f.riskLevel === 'Yüksek').length}</strong> adet yüksek öncelikli bulgu yönetim dikkatine sunulmalıdır.
                            </div>
                        )}
                    </div>
                </div>

                {/* Bulgu Durumları */}
                <div className="card !p-0 shadow-sm">
                    <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <FileText size={20} className="text-primary" /> Bulgu Durumları
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg text-center border">
                                <div className="text-2xl font-bold text-gray-800">{findings.length}</div>
                                <div className="text-xs text-gray-500">Toplam</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                                <div className="text-2xl font-bold text-blue-600">{findings.filter(f => f.status === 'Onay Bekliyor').length}</div>
                                <div className="text-xs text-blue-600">Onay Bekliyor</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                                <div className="text-2xl font-bold text-green-600">{findings.filter(f => f.status === 'Tamamlandı').length}</div>
                                <div className="text-xs text-green-600">Tamamlandı</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">İlerleme</span>
                                <span className="text-sm font-semibold text-primary">%{progress}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zaman Bütçesi / Efor Özeti */}
            {timesheetSummary && timesheetSummary.totalHours > 0 && (
                <div className="card shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <Clock size={20} className="text-primary" /> Efor Takibi (Timesheet)
                        </h3>
                        <ActionLink
                            onClick={() => router.push('/audit/staff')}
                            variant="primary"
                        >
                            Timesheet Modülüne Git
                        </ActionLink>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-primary">{timesheetSummary.totalHours}</div>
                            <div className="text-xs text-gray-500">Toplam Saat</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-700">{timesheetSummary.entryCount}</div>
                            <div className="text-xs text-gray-500">Kayıt Sayısı</div>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-indigo-600">{timesheetSummary.byPerson?.length || 0}</div>
                            <div className="text-xs text-gray-500">Kişi</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-emerald-600">{timesheetSummary.byActivity?.length || 0}</div>
                            <div className="text-xs text-gray-500">Aktivite Türü</div>
                        </div>
                    </div>

                    {/* Kişi Bazlı Dağılım */}
                    {timesheetSummary.byPerson?.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                                <Users size={14} /> Kişi Bazlı Dağılım
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {timesheetSummary.byPerson.map((p: any, idx: number) => (
                                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-primary font-bold">{p.hours}s</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Kalite Güvence ve İyileştirme Programı */}
            <div className="card shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border-indigo-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-indigo-900">Kalite Güvence Değerlendirmesi</h3>
                            <p className="text-xs text-indigo-600/80">Bu denetim görevinin kalite metrikleri durumu</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                            {auditData.qualityScore ? `%${auditData.qualityScore}` : 'Değerlendirilmedi'}
                        </span>
                        <ActionLink 
                            onClick={() => router.push(`/audit/quality?auditId=${auditData.id}`)}
                            variant="primary"
                        >
                            Değerlendirmeye Git
                        </ActionLink>
                    </div>
                </div>
            </div>

            {/* Gantt Chart (Takvim) */}
            <AuditGanttChart auditData={auditData} />
        </div>
    );
};

export default AuditOverviewTab;

