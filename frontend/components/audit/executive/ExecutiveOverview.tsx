import React from 'react';
import { Target } from 'lucide-react';
import DashboardWidget from '@/components/ui/DashboardWidget';
import DashboardListItem from '@/components/ui/DashboardListItem';
import StatCard from '@/components/ui/StatCard';
import Alert from '@/components/ui/Alert';
import ExecutiveActionCards from '@/components/audit/ExecutiveActionCards';
import EmptyState from '@/components/ui/EmptyState';

type ExecutiveOverviewProps = {
    stats: any;
};

const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
    stats
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* İş Akışı Özeti */}
            <DashboardWidget 
                widgetType="actions" 
                variant="transparent"
                infoTooltip="Sistemde onay bekleyen raporlar, gecikmiş bulgu aksiyonları ve süresi dolan denetim görevlerinin özet listesidir."
            >
                <ExecutiveActionCards
                    variant="dashboard"
                    pendingApprovals={stats?.pendingApprovals || 0}
                    ongoingAudits={stats?.activeAudits || 0}
                    pendingNotifications={stats?.pendingNotifications || 0}
                    pendingVerification={stats?.pendingVerification || 0}
                    pendingRevisions={stats?.pendingRevisions || 0}
                    overdueActionsCount={stats?.overdueActionsCount || 0}
                    dueSoonActionsCount={stats?.dueSoonActionsCount || 0}
                />
            </DashboardWidget>


            {/* Son Aktiviteler & Yaklaşan Tarihler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Son Bulgular */}
                <DashboardWidget 
                    widgetType="findings"
                    infoTooltip="Sisteme yakın zamanda işlenmiş olan güncel bulguları içerir."
                    actionHref="/audit/findings" 
                    actionLabel="Tüm Bulguları Görüntüle"
                >
                    {!stats?.recentFindings || stats.recentFindings.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                            <EmptyState variant="minimal" entityType="FINDING" title="Kayıt Bulunamadı" description="Görüntülenecek bulgu kaydı bulunmuyor." />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentFindings.map((finding: any) => {
                                return (
                                    <DashboardListItem 
                                        key={finding.id}
                                        href={`/audit/findings?id=${finding.id}`}
                                        code={finding.code || (typeof finding.id === 'string' ? `#${finding.id.substring(0, 7)}` : `#${finding.id}`)}
                                        title={finding.headline || finding.title || 'İsimsiz Bulgu'}
                                        subtitle={[finding.audit?.type, finding.department || finding.businessUnit].filter(Boolean).join(' • ') || 'Birim Yok'}
                                        status={finding.status}
                                    />
                                );
                            })}
                        </div>
                    )}
                </DashboardWidget>

                {/* Denetim Takvimi */}
                <DashboardWidget 
                    widgetType="audits"
                    infoTooltip="Durumu 'Devam Ediyor' olan denetimlerin anlık özet listesidir."
                    actionHref="/audit/audits?status=Devam%20Ediyor" 
                    actionLabel="Tüm Denetimleri Görüntüle"
                >
                    {!stats?.recentAudits || stats.recentAudits.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                            <EmptyState variant="minimal" entityType="AUDIT" title="Kayıt Bulunamadı" description="Görüntülenecek denetim kaydı bulunmuyor." />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentAudits.map((audit: any) => (
                                <DashboardListItem 
                                    key={audit.id}
                                    href={`/audit/audits/${audit.id}`}
                                    code={audit.code || audit.auditCode || (typeof audit.id === 'string' ? `#${audit.id.substring(0, 7)}` : `#${audit.id}`)}
                                    title={audit.title || 'İsimsiz Denetim'}
                                    subtitle={[audit.type, audit.department || audit.AuditableUnit?.name || audit.auditableUnit?.name].filter(Boolean).join(' • ') || '-'}
                                    status={audit.status}
                                />
                            ))}
                        </div>
                    )}
                </DashboardWidget>
            </div>
        </div>
    );
};

export default ExecutiveOverview;
