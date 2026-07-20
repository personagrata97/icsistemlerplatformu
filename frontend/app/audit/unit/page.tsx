'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auditApi, Audit, Finding } from '@/lib/audit-api';
import PageHeader from '@/components/audit/PageHeader';
import DashboardWidget from '@/components/ui/DashboardWidget';
import DashboardListItem from '@/components/ui/DashboardListItem';
import CodeBadge from '@/components/ui/CodeBadge';
import LoadingState from '@/components/ui/LoadingState';
import StatCard from '@/components/ui/StatCard';
import { ClipboardCheck, AlertCircle, Clock, CheckCircle, FileText } from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';
import { useRouter } from 'next/navigation';

export default function UnitPortalPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [audits, setAudits] = useState<Audit[]>([]);
    const [findings, setFindings] = useState<Finding[]>([]);

    useEffect(() => {
        const loadUnitData = async () => {
            try {
                setLoading(true);
                const [auditsData, findingsData] = await Promise.all([
                    auditApi.getAudits(),
                    auditApi.getFindings()
                ]);
                
                setAudits(Array.isArray(auditsData) ? auditsData : []);
                setFindings(Array.isArray(findingsData) ? findingsData : []);
            } catch (err) {
                console.error('Birim portal verisi yükleme hatası:', err);
                setAudits([]);
                setFindings([]);
            } finally {
                setLoading(false);
            }
        };

        loadUnitData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                <LoadingState message="Birim portalı verileri yükleniyor..." className="bg-transparent" />
            </div>
        );
    }

    const requiresAction = findings.filter(f => ['Tebliğ Edildi', 'Revizyon Gerekli'].includes(f.status)).length;
    const followUp = findings.filter(f => f.status === 'Takip Ediliyor').length;
    const pendingReview = findings.filter(f => ['Birim Yanıtladı', 'Doğrulama Bekliyor'].includes(f.status)).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${user?.department || 'Birim'} Portalı`}
                subtitle="Sorumluluğunuzdaki denetim bulgularını, aksiyon planlarını ve yanıt takibini yönetin"
            />

            {/* KPI İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Yanıt Bekleyen" 
                    value={requiresAction} 
                    color="orange" 
                    icon={<AlertCircle size={20} />}
                    href="/audit/unit/findings?tab=teblig"
                    subtext="Yanıtlanması gereken tebliğler"
                />
                <StatCard 
                    title="Kanıt Bekleyen" 
                    value={followUp} 
                    color="amber" 
                    icon={<Clock size={20} />}
                    href="/audit/unit/findings?tab=aksiyon"
                    subtext="Aksiyon takibinde kanıt bekleyenler"
                />
                <StatCard 
                    title="Onayda Bekleyen" 
                    value={pendingReview} 
                    color="blue" 
                    icon={<CheckCircle size={20} />}
                    href="/audit/unit/findings?tab=teblig"
                    subtext="Müfettiş onayındaki yanıtlar"
                />
                <StatCard 
                    title="Toplam Bulgu" 
                    value={findings.length} 
                    color="emerald" 
                    icon={<FileText size={20} />}
                    href="/audit/unit/findings?tab=all"
                    subtext="Birim sorumluluğundaki tüm bulgular"
                />
            </div>

            {/* Aksiyon Bekleyen Bulgular ve Son Denetimler Widget'ları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardWidget
                    title="Aksiyon Bekleyen Bulgular"
                    subtitle="Öncelikli olarak yanıtlamanız gereken tespitler"
                    actionHref="/audit/unit/findings"
                    actionLabel="Mutabakat Ekranına Git"
                    widgetType="findings"
                >
                    {findings.filter(f => ['Tebliğ Edildi', 'Revizyon Gerekli'].includes(f.status)).length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            Aksiyon bekleyen bulgu bulunmamaktadır.
                        </div>
                    ) : (
                        findings
                            .filter(f => ['Tebliğ Edildi', 'Revizyon Gerekli'].includes(f.status))
                            .slice(0, 5)
                            .map((finding) => (
                                <DashboardListItem
                                    key={finding.id}
                                    href={`/audit/unit/findings?id=${finding.id}`}
                                    code={finding.code}
                                    title={finding.title}
                                    subtitle={`Vade: ${formatDate(finding.dueDate)} • Durum: ${finding.status}`}
                                    status={finding.riskLevel || 'Orta'}
                                />
                            ))
                    )}
                </DashboardWidget>

                <DashboardWidget
                    title="Biriminizin Son Denetimleri"
                    subtitle="Geçmiş ve devam eden denetimler"
                    actionHref="/audit/unit/audits"
                    actionLabel="Tüm Denetimlere Git"
                    widgetType="audits"
                >
                    {audits.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            Biriminizle ilişkili denetim bulunmamaktadır.
                        </div>
                    ) : (
                        audits.slice(0, 5).map((audit) => (
                            <DashboardListItem
                                key={audit.id}
                                href={`/audit/unit/audits?id=${audit.id}`}
                                icon={<ClipboardCheck size={20} className="text-primary" />}
                                title={audit.title}
                                subtitle={`Başlangıç: ${formatDate(audit.startDate)} • Bitiş: ${formatDate(audit.endDate)}`}
                                status={audit.status || 'Planlandı'}
                            />
                        ))
                    )}
                </DashboardWidget>
            </div>
        </div>
    );
}
