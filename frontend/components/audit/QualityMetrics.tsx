'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle, Target, Award, Shield, ListChecks, AlertCircle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingState from '@/components/ui/LoadingState';
import ActionLink from '@/components/ui/ActionLink';
import EmptyState from '@/components/ui/EmptyState';
import DashboardWidget from '@/components/ui/DashboardWidget';
import DashboardListItem from '@/components/ui/DashboardListItem';
import Alert from '@/components/ui/Alert';
import Tooltip from '@/components/ui/Tooltip';
import { auditApi } from '@/lib/audit-api';
import { formatDate } from '@/lib/audit-utils';
import { Info } from 'lucide-react';

/** Türk standardında yüzde/birim formatlama */
const formatMetricValue = (value: number, unit: string) => {
    if (unit === '%') return `%${value}`;
    return `${value} ${unit}`;
};

const getMetricTooltip = (metricId: string, target: number, unit: string) => {
    const formattedTarget = formatMetricValue(target, unit);
    switch(metricId) {
        case 'auto-completion-rate': return `Tüm denetimlerin tamamlanma yüzdesi. Hedef: ${formattedTarget}`;
        case 'auto-finding-resolution': return `Toplam bulgular içerisinden kapatılanların yüzdesi. Hedef: ${formattedTarget}`;
        case 'auto-plan-compliance': return `Onaylanan denetim planlarının toplam plana oranı. Hedef: ${formattedTarget}`;
        case 'auto-avg-duration': return `Tamamlanan denetimlerin başlangıç ve bitiş tarihleri arasındaki ortalama süre. Hedef: Maksimum ${formattedTarget}`;
        case 'auto-ontime-rate': return `Kapatılan bulguların, hedeflenen vade tarihinden önce kapatılma yüzdesi. Hedef: ${formattedTarget}`;
        case 'auto-open-critical': return `Sistemde durumu açık olan kritik veya yüksek riskli bulgu sayısı. Hedef: ${formattedTarget}`;
        default: return `Bu metriğin hedeflenen değeri: ${formattedTarget}`;
    }
};

export default function QualityMetrics() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [actions, setActions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [metricsData, assessmentsData, autoMetricsData, actionsData, statsData] = await Promise.all([
                auditApi.getQualityMetrics().catch(() => []),
                auditApi.getQualityAssessments().catch(() => []),
                auditApi.getAutoMetrics().catch(() => []),
                auditApi.getQualityActions().catch(() => []),
                auditApi.getQualityStats().catch(() => null)
            ]);
            setMetrics([...(autoMetricsData || []), ...(metricsData || [])]);
            setAssessments(assessmentsData || []);
            setActions(actionsData || []);
            setStats(statsData);
        } catch (error) {
            // Hata durumunda boş state — mock veriye geçilmez
        } finally {
            setLoading(false);
        }
    };

    // Türetilmiş veriler
    const goodMetrics = metrics.filter(m => m.status === 'İyi').length;
    const warningMetrics = metrics.filter(m => m.status === 'Uyarı').length;
    const criticalMetrics = metrics.filter(m => m.status === 'Kritik').length;
    const openActions = actions.filter(a => a.status === 'Açık' || a.status === 'Devam Ediyor').length;
    const overdueActions = actions.filter(a => a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date()).length;

    // Dış Değerlendirme (EQA) hesaplaması
    const eqaInfo = useMemo(() => {
        const externalAssessments = assessments
            .filter(a => a.type === 'Dış')
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (externalAssessments.length === 0) return { status: 'NOT_FOUND', daysLeft: 0, lastDate: null, nextDate: null };

        const lastDate = new Date(externalAssessments[0].date);
        const nextDate = new Date(lastDate);
        nextDate.setFullYear(nextDate.getFullYear() + 5);
        const diffDays = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'OVERDUE', daysLeft: Math.abs(diffDays), lastDate, nextDate };
        if (diffDays <= 180) return { status: 'APPROACHING', daysLeft: diffDays, lastDate, nextDate };
        return { status: 'GOOD', daysLeft: diffDays, lastDate, nextDate };
    }, [assessments]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingState message="Kalite güvence verileri yükleniyor..." className="bg-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Özet İstatistik Kartları */}
            <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-4 pb-2 overflow-x-auto snap-x hide-scrollbar">
                <StatCard
                    title="İyi Performans"
                    value={goodMetrics}
                    color="green"
                    icon={<CheckCircle size={20} />}
                    subtext={`${metrics.length} metrik izleniyor`}
                    infoTooltip="Hedefine ulaşan veya hedefini aşan metriklerin sayısıdır."
                />
                <StatCard
                    title="Uyarı"
                    value={warningMetrics}
                    color="yellow"
                    icon={<AlertTriangle size={20} />}
                    infoTooltip="Hedefin altında kalan ancak henüz kritik seviyeye ulaşmamış olan metriklerin sayısıdır."
                />
                <StatCard
                    title="Kritik"
                    value={criticalMetrics}
                    color="red"
                    icon={<AlertCircle size={20} />}
                    infoTooltip="Hedefin çok uzağında kalarak acil aksiyon gerektiren metriklerin sayısıdır."
                />
                <StatCard
                    title="Açık Aksiyon"
                    value={openActions}
                    color="orange"
                    icon={<ListChecks size={20} />}
                    subtext={overdueActions > 0 ? `${overdueActions} gecikmiş` : undefined}
                    infoTooltip="Henüz tamamlanmamış ve süreci devam eden kalite iyileştirme planlarının sayısı."
                />
                <StatCard
                    title="Değerlendirme"
                    value={assessments.length}
                    color="purple"
                    icon={<Shield size={20} />}
                    subtext={`${assessments.filter(a => a.type === 'İç').length} iç, ${assessments.filter(a => a.type === 'Dış').length} dış`}
                    infoTooltip="Kurum içindeki kalite güvence ekibi veya bağımsız dış denetçiler tarafından yapılan değerlendirmelerin toplam sayısı."
                />
            </div>

            {/* Dış Değerlendirme (EQA) Uyarısı */}
            {eqaInfo.status === 'OVERDUE' && (
                <Alert
                    variant="error"
                    title="Dış Değerlendirme Süresi Doldu!"
                    description={`Zorunlu 5 yıllık dış değerlendirme süresi ${eqaInfo.daysLeft} gün önce dolmuştur.`}
                />
            )}
            {eqaInfo.status === 'APPROACHING' && (
                <Alert
                    variant="warning"
                    title="Dış Değerlendirme Yaklaşıyor"
                    description={`Bir sonraki zorunlu dış değerlendirmeye ${eqaInfo.daysLeft} gün kaldı.`}
                    icon={<Clock size={24} className="text-orange-600" />}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performans Metrikleri Özeti */}
                <DashboardWidget 
                    widgetType="metrics"
                    title="Performans Metrikleri"
                    actionHref="/audit/quality"
                    actionLabel="Tüm Metrikleri Görüntüle"
                >

                    {metrics.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                            <EmptyState
                                variant="minimal"
                                entityType="METRIC"
                                title="Kayıt Bulunamadı"
                                description="Görüntülenecek performans metriği bulunmuyor."
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {metrics.slice(0, 6).map((metric: any) => (
                                <div key={metric.id} className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between text-sm mb-1 items-center">
                                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                                <span className="text-gray-700 font-medium truncate">{metric.name}</span>
                                                <Tooltip content={getMetricTooltip(metric.id, metric.target, metric.unit)} position="top">
                                                    <Info size={14} className="text-gray-400 hover:text-primary cursor-help shrink-0 outline-none" />
                                                </Tooltip>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="font-bold text-gray-900">{formatMetricValue(metric.actual, metric.unit)}</span>
                                                {metric.trend === 'up' && <TrendingUp size={14} className="text-green-500" />}
                                                {metric.trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                                    metric.actual >= metric.target ? 'bg-green-500' :
                                                    metric.actual >= metric.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(metric.target > 0 ? (metric.actual / metric.target) * 100 : 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                                        metric.status === 'İyi' ? 'bg-green-100 text-green-700 border-green-200' :
                                        metric.status === 'Uyarı' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        metric.status === 'Kritik' ? 'bg-red-100 text-red-700 border-red-200' :
                                        'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}>
                                        {metric.status}
                                    </span>
                                </div>
                            ))}
                            {metrics.length > 6 && (
                                <p className="text-xs text-gray-400 text-center pt-2">ve {metrics.length - 6} metrik daha...</p>
                            )}
                        </div>
                    )}
                </DashboardWidget>

                {/* Değerlendirme ve Aksiyon Özeti */}
                <div className="space-y-6">
                    {/* Son Değerlendirmeler */}
                    <DashboardWidget 
                        widgetType="activities"
                        title="Son Değerlendirmeler"
                    >

                        {assessments.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState
                                    variant="minimal"
                                    entityType="ACTIVITY"
                                    title="Kayıt Bulunamadı"
                                    description="Görüntülenecek değerlendirme kaydı bulunmuyor."
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {assessments.slice(0, 4).map((assessment: any) => (
                                    <DashboardListItem
                                        key={assessment.id}
                                        icon={
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                assessment.type === 'İç' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                                            }`}>
                                                {assessment.type}
                                            </span>
                                        }
                                        title={assessment.assessor}
                                        rightContent={
                                            <span className="text-xs text-gray-500 font-medium">{formatDate(assessment.date)}</span>
                                        }
                                        status={assessment.result}
                                        className="bg-gray-50/50"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Dış Değerlendirme Durumu */}
                        {eqaInfo.lastDate && (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Dış Değerlendirme Durumu (Her 5 Yılda Bir)</h4>
                                <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                                    <span className="flex items-center gap-2">
                                        <Clock size={16} />
                                        Son: <strong>{formatDate(eqaInfo.lastDate.toISOString())}</strong>
                                    </span>
                                    <span>Sonraki: <strong>{eqaInfo.nextDate ? formatDate(eqaInfo.nextDate.toISOString()) : '-'}</strong></span>
                                </div>
                            </div>
                        )}
                    </DashboardWidget>

                    {/* Gecikmiş Aksiyonlar */}
                    {overdueActions > 0 && (
                        <DashboardWidget 
                            widgetType="actions"
                            title={`Gecikmiş Aksiyonlar (${overdueActions})`}
                            color="red"
                            icon={Clock}
                            className="border-l-4 border-l-red-500"
                        >
                            <div className="space-y-2">
                                {actions
                                    .filter(a => a.status !== 'Tamamlandı' && new Date(a.dueDate) < new Date())
                                    .slice(0, 3)
                                    .map((action: any) => (
                                        <DashboardListItem
                                            key={action.id}
                                            icon={<div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><Clock size={16} /></div>}
                                            title={<span className="text-red-800">{action.title}</span>}
                                            subtitle={
                                                <span className="text-red-600">
                                                    Sorumlu: {action.responsible || '-'} <span className="mx-1">•</span> Son Tarih: {formatDate(action.dueDate)}
                                                </span>
                                            }
                                            className="bg-red-50/50 border-red-100"
                                        />
                                    ))}
                            </div>
                            <div className="mt-3">
                                <ActionLink href="/audit/quality" variant="primary">Tüm Aksiyonları Görüntüle</ActionLink>
                            </div>
                        </DashboardWidget>
                    )}
                </div>
            </div>
        </div>
    );
}
