'use client';

import React, { useState, useEffect } from 'react';
import {
    Briefcase, CheckCircle, PieChart, RefreshCw, AlertCircle, Calendar,
    AlertTriangle, FileText
} from 'lucide-react';
import ExecutiveActionCards from '@/components/audit/ExecutiveActionCards';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Link from 'next/link';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import RefreshButton from '@/components/ui/RefreshButton';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import QualityMetrics from '@/components/audit/QualityMetrics';
import CodeBadge from '@/components/ui/CodeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

import PageHeader from '@/components/audit/PageHeader';
import PendingDeletionsModal from '@/components/audit/PendingDeletionsModal';
import EmptyState from '@/components/ui/EmptyState';

export default function ExecutiveDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const [loading, setLoading] = useState(true);

    // Erişim Kontrolü: Sadece denetim ekibi erişebilir
    const isAuditor = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_INSPECTOR');

    // Yetkisiz kullanıcıları yönlendir
    if (!isAuditor) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] w-full">
                <LoadingState message="Yönlendiriliyorsunuz..." className="bg-transparent" />
            </div>
        );
    }
    const [activeTab, setActiveTab] = useState<'overview' | 'quality'>('overview');
    const [audits, setAudits] = useState<any[]>([]);
    const [findings, setFindings] = useState<any[]>([]);
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [showPendingModal, setShowPendingModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading && !isAuditor) {
            router.push('/audit');
        }
    }, [loading, isAuditor, router]);

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        try {
            const [auditsData, findingsData] = await Promise.all([
                auditApi.getAudits(),
                auditApi.getFindings()
            ]);
            setAudits(Array.isArray(auditsData) ? auditsData : []);
            setFindings(Array.isArray(findingsData) ? findingsData : []);

            // Silinme onayı bekleyen kayıtları filtrele
            const pAudits = (Array.isArray(auditsData) ? auditsData : []).filter((a: any) => a.status === 'Silinme Onayı Bekliyor').map((a: any) => ({
                id: a.id,
                code: a.auditCode || a.code, // farklı alan adları
                title: a.title,
                deletionReason: a.deletionReason,
                deletionComment: a.deletionComment,
                type: 'Audit'
            }));

            const pFindings = (Array.isArray(findingsData) ? findingsData : []).filter((f: any) => f.status === 'Silinme Onayı Bekliyor').map((f: any) => ({
                id: f.id,
                code: f.code,
                title: f.headline || f.title, // farklı alan adları
                deletionReason: f.deletionReason,
                deletionComment: f.deletionComment,
                type: 'Finding'
            }));

            setPendingItems([...pAudits, ...pFindings]);

        } catch (error) {
            console.error('Yönetici paneli veri yükleme hatası:', error);
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            if (showOverlay) setLoading(false);
        }
    };

    const handleApproveDelete = async (id: string, type: 'Audit' | 'Finding') => {
        try {
            if (type === 'Audit') {
                await auditApi.approveDeleteAudit(id);
            } else {
                await auditApi.approveDeleteFinding(id);
            }
            showToast('Silme işlemi onaylandı', 'success');
            loadData(); // Listeyi yenile
            if (pendingItems.length <= 1) setShowPendingModal(false);
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };

    const handleRejectDelete = async (id: string, type: 'Audit' | 'Finding') => {
        try {
            if (type === 'Audit') {
                await auditApi.rejectDeleteAudit(id);
            } else {
                await auditApi.rejectDeleteFinding(id);
            }
            showToast('Silme talebi reddedildi', 'success');
            loadData();
            if (pendingItems.length <= 1) setShowPendingModal(false);
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };


    // İstatistik hesaplama
    const pendingApprovals = findings.filter(f => f.status === 'Onay Bekliyor').length;
    const activeAudits = audits.filter(a => a.status === 'Devam Ediyor').length;
    const pendingNotifications = findings.filter(f => f.status === 'Tebliğ Edildi' || f.status === 'Birim Yanıtladı').length;
    const pendingVerification = findings.filter(f => f.status === 'Doğrulama Bekliyor').length;
    const criticalFindings = findings.filter(f => f.riskLevel === 'Kritik' || f.riskLevel === 'Yüksek').length;
    const completedAudits = audits.filter(a => a.status === 'Tamamlandı').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[600px]">
                <LoadingState message="Yönetici özeti oluşturuluyor..." />
            </div>
        );
    }

    return (
        <>
            <PageHeader title="Yönetici Paneli" subtitle="Yönetim özeti ve performans göstergeleri" />

            {pendingItems.length > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm text-orange-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Silinme Onayı Bekleyen {pendingItems.length} Kayıt Var</h3>
                            <p className="text-orange-800 text-sm">Denetçi veya uzmanlar tarafından silinmek istenen kayıtlar onayınızı bekliyor.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowPendingModal(true)}
                        className="bg-orange-600 text-white hover:bg-orange-700 border-none shadow-orange-200"
                    >
                        İncele ve Yönet
                    </Button>
                </div>
            )}

            {/* Tab Navigation ve Yenile Butonu */}
            <div className="flex justify-between items-end mb-6">
                <SegmentedTabs
                    tabs={[
                        { id: 'overview', label: 'Genel Bakış', icon: Briefcase },
                        { id: 'quality', label: 'Kalite Metrikleri', icon: CheckCircle }
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                />

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={() => loadData(false)} />
                </div>
            </div>

            {activeTab === 'quality' ? (
                <QualityMetrics />
            ) : (
                <>
                    {/* İş Akışı Özeti - Gözetim Sorumlusu */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Calendar className="text-blue-500" size={20} />
                            Bekleyen İşlemler
                        </h2>
                        <ExecutiveActionCards
                            pendingApprovals={pendingApprovals}
                            ongoingAudits={activeAudits}
                            pendingNotifications={pendingNotifications}
                            pendingVerification={pendingVerification}
                        />
                    </div>

                    {/* Genel İstatistikler */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Denetim Durumu */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                <PieChart size={20} className="text-primary" />
                                Denetim Durumu
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-xl">
                                    <div className="text-3xl font-bold text-blue-600">{audits.length}</div>
                                    <div className="text-sm text-gray-600 mt-1">Toplam</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                                    <div className="text-3xl font-bold text-yellow-600">{activeAudits}</div>
                                    <div className="text-sm text-gray-600 mt-1">Devam Eden</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-xl">
                                    <div className="text-3xl font-bold text-green-600">{completedAudits}</div>
                                    <div className="text-sm text-gray-600 mt-1">Tamamlanan</div>
                                </div>
                            </div>
                        </div>

                        {/* Bulgu Risk Dağılımı */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                <AlertCircle size={20} className="text-primary" />
                                Bulgu Risk Dağılımı
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-3 bg-rose-50 rounded-xl border border-rose-100">
                                    <div className="text-2xl font-bold text-rose-700">
                                        {findings.filter(f => f.riskLevel === 'Kritik').length}
                                    </div>
                                    <div className="text-xs text-rose-600 mt-1">Kritik</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="text-2xl font-bold text-red-600">
                                        {findings.filter(f => f.riskLevel === 'Yüksek').length}
                                    </div>
                                    <div className="text-xs text-red-600 mt-1">Yüksek</div>
                                </div>
                                <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {findings.filter(f => f.riskLevel === 'Orta').length}
                                    </div>
                                    <div className="text-xs text-orange-600 mt-1">Orta</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {findings.filter(f => f.riskLevel === 'Düşük').length}
                                    </div>
                                    <div className="text-xs text-yellow-600 mt-1">Düşük</div>
                                </div>
                            </div>
                            {criticalFindings > 0 && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" size={18} />
                                    <span className="text-sm text-red-700 font-medium">
                                        {criticalFindings} adet yüksek öncelikli bulgu mevcut
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Son Aktiviteler & Yaklaşan Tarihler */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Son Bulgular */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                <FileText size={20} className="text-primary" />
                                Son Eklenen Bulgular
                            </h3>
                            {findings.length === 0 ? (
                                <EmptyState title="Henüz bulgu yok" description="Bu dönemde oluşturulmuş bulgu bulunmuyor." />
                            ) : (
                                <div className="space-y-3">
                                    {findings.slice(0, 5).map((finding: any) => (
                                        <Link key={finding.id}
                                            href={`/audit/findings?id=${finding.id}`}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3">
                                                <CodeBadge code={finding.code || (typeof finding.id === 'string' ? `#${finding.id.substring(0, 7)}` : `#${finding.id}`)} />
                                                <span className="text-sm text-gray-700 font-medium line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                                    {finding.title}
                                                </span>
                                            </div>
                                            <StatusBadge value={finding.status} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <Link href="/audit/findings" className="btn btn-secondary w-full mt-4">
                                Tüm Bulguları Gör
                            </Link>
                        </div>

                        {/* Denetim Takvimi */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                <Calendar size={20} className="text-primary" />
                                Aktif Denetimler
                            </h3>
                            {audits.length === 0 ? (
                                <EmptyState title="Henüz denetim yok" description="Bu dönemde planlanan denetim bulunmuyor." />
                            ) : (
                                <div className="space-y-3">
                                    {audits.filter(a => a.status !== 'Tamamlandı').slice(0, 5).map((audit: any) => (
                                        <Link key={audit.id}
                                            href={`/audit/audits/${audit.id}`}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all group">
                                            <div>
                                                <div className="text-sm font-medium text-gray-800 group-hover:text-emerald-600 transition-colors">{audit.title}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {audit.auditableUnit?.name || audit.scope || '-'}
                                                </div>
                                            </div>
                                            <StatusBadge value={audit.status} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <Link href="/audit/audits" className="btn btn-secondary w-full mt-4">
                                Tüm Denetimleri Gör
                            </Link>
                        </div>
                    </div>
                </>
            )}

            <PendingDeletionsModal
                isOpen={showPendingModal}
                onClose={() => setShowPendingModal(false)}
                items={pendingItems}
                onApprove={handleApproveDelete}
                onReject={handleRejectDelete}
            />
        </>
    );
}
