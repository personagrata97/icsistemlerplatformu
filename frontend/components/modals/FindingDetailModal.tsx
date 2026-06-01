
import React, { useState } from 'react';
import { AlertTriangle, Clock, AlertCircle, CheckCircle, User, Tag, FileText, Check, Shield, Activity, Calendar, History, Search, Send, PlayCircle, XCircle, FileSearch, Edit2, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { Finding } from '@/lib/audit-api';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Modal from '@/components/ui/Modal';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import { formatDate } from '@/lib/audit-utils';
import Button from '@/components/ui/Button';

interface FindingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    finding: Finding | null;
    onStatusUpdate?: (finding: Finding, newStatus: string) => void;
    onNotify?: (finding: Finding) => void;
    onAcceptRisk?: (finding: Finding) => void;
    onExtensionRequest?: (finding: Finding) => void;
    onReviewRequest?: (finding: Finding) => void;
    onEdit?: (finding: Finding) => void;
    onDelete?: (finding: Finding) => void;
    isManager?: boolean;
    user?: any;
}

export default function FindingDetailModal({ 
    isOpen, onClose, finding,
    onStatusUpdate, onNotify, onAcceptRisk, onExtensionRequest, onReviewRequest, onEdit, onDelete, isManager, user
}: FindingDetailModalProps) {
    const [activeTab, setActiveTab] = useState('details');



    if (!isOpen || !finding) return null;

    // Yardımcı fonskiyonlar
    const hasActiveFollowUps = () => {
        if ((finding as any).followUps && Array.isArray((finding as any).followUps)) {
            return (finding as any).followUps.some((fu: any) => fu.status !== 'Tamamlandı' && fu.status !== 'Kapalı');
        }
        return finding.dueDate ? new Date(finding.dueDate) > new Date() : false;
    };

    const isAssignedUser = user?.id && finding.assignedUserId && user.id === finding.assignedUserId;
    const isCreator = (finding as any).createdById && user?.id === (finding as any).createdById;
    const isConflict = isAssignedUser || (isCreator && !isManager);

    const canAcceptRisk = isManager && onAcceptRisk && finding.status !== 'Taslak' && finding.status !== 'Tamamlandı' && finding.status !== 'Risk Kabul Edildi';
    const canRequestExtension = onExtensionRequest && (finding.status === 'Tebliğ Edildi' || finding.status === 'Birim Yanıtladı' || finding.status === 'Takip Ediliyor') && finding.dueDate;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bulgu Detayı"
            size="2xl"
            footer={
                <div className="flex justify-between w-full">
                    <div className="flex gap-2">
                        {onEdit && <Button variant="secondary" onClick={() => onEdit(finding)}>Düzenle</Button>}
                        {canAcceptRisk && <Button variant="danger" onClick={() => onAcceptRisk(finding)}>Risk Kabulü</Button>}
                        {canRequestExtension && <Button variant="secondary" onClick={() => onExtensionRequest(finding)}>Süre Uzat</Button>}
                        {onDelete && <Button variant="danger" onClick={() => onDelete(finding)}>Sil</Button>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={onClose}>Kapat</Button>
                        
                        {/* Workflow Buttons */}
                        {onStatusUpdate && (finding.status === 'Taslak' || finding.status === 'Revizyon Gerekli') && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Gözetim Bekliyor')}>Gözetime Gönder</Button>
                        )}

                        {onStatusUpdate && finding.status === 'Gözetim Bekliyor' && isManager && !isConflict && (
                            <>
                                {onReviewRequest && <Button variant="danger" onClick={() => onReviewRequest(finding)}>Revize Et</Button>}
                                <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Onaylandı')}>Gözetimi Tamamla</Button>
                            </>
                        )}

                        {onNotify && finding.status === 'Onaylandı' && (
                            <Button variant="primary" onClick={() => onNotify(finding)}>Tebliğ Et</Button>
                        )}

                        {onStatusUpdate && finding.status === 'Birim Yanıtladı' && finding.isAgreed === true && hasActiveFollowUps() && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Takip Ediliyor')}>Takibe Al</Button>
                        )}

                        {onStatusUpdate && finding.status === 'Birim Yanıtladı' && finding.isAgreed === true && !hasActiveFollowUps() && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Tamamlandı')}>Doğrula ve Kapat</Button>
                        )}

                        {onStatusUpdate && finding.status === 'Birim Yanıtladı' && finding.isAgreed === false && (
                            <>
                                <Button variant="secondary" onClick={() => onStatusUpdate(finding, 'Takip Ediliyor')}>Israr Et (Takibe Al)</Button>
                                <Button variant="secondary" onClick={() => onStatusUpdate(finding, 'Tamamlandı')}>İptal/Kapat</Button>
                            </>
                        )}

                        {onStatusUpdate && finding.status === 'Takip Ediliyor' && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Doğrulama Bekliyor')}>Kanıt Geldi (Doğrulamaya Al)</Button>
                        )}

                        {onStatusUpdate && finding.status === 'Doğrulama Bekliyor' && (
                            <>
                                <Button variant="danger" onClick={() => onStatusUpdate(finding, 'Takip Ediliyor')}>Reddet</Button>
                                <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Tamamlandı')}>Onayla ve Kapat</Button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            {/* Rich Header Content */}
            <div className="flex items-start gap-4 mb-6">
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 shrink-0">
                    <FileText className="text-primary" size={28} />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <CodeBadge code={finding.code} />
                        {finding.linkedEthicsReportId && (
                            <Link
                                href={`/audit/ethics?id=${finding.linkedEthicsReportId}`}
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors uppercase tracking-tight"
                            >
                                <Search size={12} /> Etik Raporu Bağlantılı
                            </Link>
                        )}
                        <StatusBadge value={finding.status} size="sm" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                        {finding.title}
                    </h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <SegmentedTabs
                    tabs={[
                        { id: 'details', label: 'Bulgu Detayları', icon: FileText },
                        { id: 'history', label: 'Süreç Geçmişi', icon: History }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {/* Content */}
            <div className="custom-scrollbar">
                {activeTab === 'details' ? (
                    <div className="space-y-6">

                        {/* Summary Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 w-full">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase mb-1">Denetim</label>
                                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                        <Shield size={14} className="text-gray-400" />
                                        {(finding.audit as any)?.title || finding.audit?.title || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase mb-1">Müfettiş</label>
                                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                        <User size={14} className="text-gray-400" />
                                        {finding.assignedUser 
                                            ? ((finding.assignedUser as any).displayName || (finding.assignedUser as any).name || `${finding.assignedUser.firstName || ''} ${finding.assignedUser.lastName || ''}`.trim() || 'Atanmamış') 
                                            : ((finding as any).inspector || 'Atanmamış')}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase mb-1">Aksiyon Tarihi</label>
                                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        {formatDate(finding.dueDate)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase mb-1">Kategori</label>
                                    <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                        <Tag size={14} className="text-gray-400" />
                                        {Array.isArray(finding.category) ? finding.category.join(', ') : finding.category || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="pl-6 border-l border-gray-100 hidden md:block text-center min-w-[120px]">
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Risk Seviyesi</label>
                                <StatusBadge type="risk" value={finding.riskLevel} className="px-4 py-1.5 text-sm w-full" />
                            </div>
                        </div>

                        {/* Tags & Other Info */}
                        {(finding.tags?.length || (finding as any).otherDescription) && (
                            <div className="flex flex-wrap gap-2">
                                {finding.tags?.map((tag: string, i: number) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                        #{tag}
                                    </span>
                                ))}
                                {(finding as any).otherDescription && (
                                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100 flex items-center gap-1">
                                        <AlertCircle size={12} /> Diğer: {(finding as any).otherDescription}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Main Grid Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Description & Root Cause */}
                            <div className="space-y-6">
                                {/* Criteria */}
                                {finding.criteria && (
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-5 shadow-sm">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
                                            <Activity size={16} className="text-primary" /> Denetim Kriteri
                                        </h4>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{finding.criteria}</p>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-5 shadow-sm">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
                                        <AlertCircle size={16} className="text-slate-500" /> Bulgu Detayı / Mevcut Durum
                                    </h4>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{finding.description}</p>
                                </div>

                                {/* Root Cause */}
                                {finding.rootCause && (
                                    <div className="bg-amber-50/45 rounded-xl border border-amber-200/60 p-5 shadow-sm">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                                            <AlertTriangle size={16} className="text-amber-600" /> Kök Neden
                                        </h4>
                                        <p className="text-sm text-amber-800/95 leading-relaxed whitespace-pre-wrap">{finding.rootCause}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Effect & Recommendation */}
                            <div className="space-y-6">
                                {/* Effect */}
                                {finding.effect && (
                                    <div className="bg-rose-50/45 rounded-xl border border-rose-200/60 p-5 shadow-sm">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-900 mb-3">
                                            <AlertTriangle size={16} className="text-rose-600" /> Etki / Risk
                                        </h4>
                                        <p className="text-sm text-rose-800/95 leading-relaxed whitespace-pre-wrap">{finding.effect}</p>
                                    </div>
                                )}

                                {/* Recommendation */}
                                {finding.recommendation && (
                                    <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 shadow-sm">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-primary mb-3">
                                            <CheckCircle size={16} /> Müfettiş Önerisi
                                        </h4>
                                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap italic">{finding.recommendation}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Sections: Action Plan & Evidence */}
                        {(finding.actionPlan || finding.inspectorEvidence?.length || finding.unitEvidence?.length) && (
                            <div className="space-y-4 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800">Yanıt ve Aksiyonlar</h3>

                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    {finding.actionPlan ? (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-emerald-700 mb-2">Birim Aksiyon Planı</h4>
                                            <p className="text-sm text-gray-700 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">{finding.actionPlan}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded border border-dashed text-sm mb-6">
                                            Henüz aksiyon planı girilmemiş.
                                        </div>
                                    )}

                                    {/* Evidence Files */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(finding.inspectorEvidence && finding.inspectorEvidence.length > 0) && (
                                            <div>
                                                <h5 className="text-xs font-bold uppercase text-gray-500 mb-3">Müfettiş Kanıtları</h5>
                                                <div className="space-y-2">
                                                    {finding.inspectorEvidence.map((ev: string, i: number) => (
                                                        <a key={i} href={ev} target="_blank" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group">
                                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-200 shadow-sm text-gray-400 group-hover:text-primary">
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-700">Kanıt Dosyası {i + 1}</div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(finding.unitEvidence && finding.unitEvidence.length > 0) && (
                                            <div>
                                                <h5 className="text-xs font-bold uppercase text-gray-500 mb-3">Birim Kanıtları</h5>
                                                <div className="space-y-2">
                                                    {finding.unitEvidence.map((ev: string, i: number) => (
                                                        <a key={i} href={ev} target="_blank" className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all group">
                                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-emerald-200 shadow-sm text-emerald-500">
                                                                <Check size={16} />
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-800">Kanıt Dosyası {i + 1}</div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    /* History Tab */
                    <div className="max-w-3xl mx-auto py-4">
                        <ProcessTimeline
                            items={finding.history?.map((record: any, index: number) => ({
                                id: index.toString(),
                                action: record.action || 'İşlem',
                                date: record.date,
                                user: record.user,
                                details: record.details || record.description
                            })) || []}
                            emptyMessage="İşlem geçmişi bulunmuyor"
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
}

// Add these to types/audit.ts if not present, but for now assuming they are on Finding type or we can extend locally if needed.
// However, previous code showed them on finding object.
