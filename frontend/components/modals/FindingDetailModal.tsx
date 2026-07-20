import React, { useState } from 'react';
import { AlertTriangle, Clock, AlertCircle, CheckCircle, User, Tag, FileText, Check, Shield, Activity, Calendar, History, Search, Send, PlayCircle, XCircle, FileSearch, Edit2, Trash2, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { Finding, auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import StatusBadge from '@/components/ui/StatusBadge';
import CodeBadge from '@/components/ui/CodeBadge';
import Modal from '@/components/ui/Modal';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Timeline from '@/components/ui/Timeline';
import { formatDate, renderSmartText, formatLogDetails } from '@/lib/audit-utils';
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
    onRefresh?: () => void;
}

export default function FindingDetailModal({ 
    isOpen, onClose, finding,
    onStatusUpdate, onNotify, onAcceptRisk, onExtensionRequest, onReviewRequest, onEdit, onDelete, isManager, user, onRefresh
}: FindingDetailModalProps) {
    const [activeTab, setActiveTab] = useState('details');
    
    // Unit Response Form States
    const [actionPlan, setActionPlan] = useState('');
    const [actionOwner, setActionOwner] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { showToast } = useToast();



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
    
    const isUnitRole = user?.roles?.some((r:string) => ['MUDUR', 'BIRIM', 'UNIT', 'AUDIT_UNIT'].includes(r.toUpperCase())) || false;
    const canRespond = (finding.status === 'Tebliğ Edildi' || finding.status === 'Revizyon Gerekli') && isUnitRole;
    const canUploadEvidence = finding.status === 'Takip Ediliyor' && isUnitRole;

    const handleSubmitResponse = async () => {
        if (!actionPlan.trim()) {
            showToast('Lütfen aksiyon planını giriniz.', 'warning');
            return;
        }
        try {
            setIsSubmitting(true);
            const payload = {
                status: 'Birim Yanıtladı',
                actionPlan: actionPlan,
                departmentResponse: actionPlan,
                actionOwner: actionOwner,
                dueDate: targetDate || finding.dueDate
            };
            await auditApi.updateFinding(String(finding.id), payload);
            await auditApi.createLog({
                action: 'Birim Yanıtı',
                user: user?.displayName || 'Kullanıcı',
                details: `${finding.code} bulgusuna aksiyon planı girildi.`,
                targetType: 'Finding',
                targetId: finding.id
            });
            showToast('Yanıtınız başarıyla iletildi.', 'success');
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            showToast('Yanıt gönderilirken hata oluştu.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitEvidence = async () => {
        try {
            setIsSubmitting(true);
            const payload = { status: 'Doğrulama Bekliyor' };
            await auditApi.updateFinding(String(finding.id), payload);
            await auditApi.createLog({
                action: 'Kanıt Yüklendi',
                user: user?.displayName || 'Kullanıcı',
                details: `${finding.code} bulgusu için kanıtlar yüklenip doğrulamaya gönderildi.`,
                targetType: 'Finding',
                targetId: finding.id
            });
            showToast('Kanıtlar başarıyla iletildi.', 'success');
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            showToast('İşlem başarısız.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canEditOrDelete = !isUnitRole && (isManager || isCreator || isAssignedUser);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bulgu Detayı"
            size="2xl"
            footer={
                <div className="flex justify-between w-full">
                    <div className="flex gap-2">
                        {canEditOrDelete && onEdit && <Button variant="secondary" onClick={() => onEdit(finding)}>Düzenle</Button>}
                        {!isUnitRole && canAcceptRisk && <Button variant="danger" onClick={() => onAcceptRisk(finding)}>Risk Kabulü</Button>}
                        {canRequestExtension && <Button variant="secondary" onClick={() => onExtensionRequest(finding)}>Süre Uzat</Button>}
                        {canEditOrDelete && onDelete && <Button variant="danger" onClick={() => onDelete(finding)}>Sil</Button>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={onClose}>Kapat</Button>
                        
                        {/* Auditor Workflow Buttons */}
                        {!isUnitRole && onStatusUpdate && (finding.status === 'Taslak' || finding.status === 'Revizyon Gerekli') && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Gözetim Bekliyor')}>Gözetime Gönder</Button>
                        )}

                        {!isUnitRole && onStatusUpdate && finding.status === 'Gözetim Bekliyor' && isManager && !isConflict && (
                            <>
                                {onReviewRequest && <Button variant="danger" onClick={() => onReviewRequest(finding)}>Revize Et</Button>}
                                <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Onaylandı')}>Gözetimi Tamamla</Button>
                            </>
                        )}

                        {!isUnitRole && onNotify && finding.status === 'Onaylandı' && (
                            <Button variant="primary" onClick={() => onNotify(finding)}>Tebliğ Et</Button>
                        )}

                        {!isUnitRole && onStatusUpdate && finding.status === 'Birim Yanıtladı' && finding.isAgreed === true && hasActiveFollowUps() && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Takip Ediliyor')}>Takibe Al</Button>
                        )}

                        {!isUnitRole && onStatusUpdate && finding.status === 'Birim Yanıtladı' && finding.isAgreed === true && !hasActiveFollowUps() && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Tamamlandı')}>Doğrula ve Kapat</Button>
                        )}

                        {!isUnitRole && onStatusUpdate && finding.status === 'Birim Yanıtladı' && finding.isAgreed === false && (
                            <>
                                <Button variant="secondary" onClick={() => onStatusUpdate(finding, 'Takip Ediliyor')}>Israr Et (Takibe Al)</Button>
                                <Button variant="secondary" onClick={() => onStatusUpdate(finding, 'Tamamlandı')}>İptal/Kapat</Button>
                            </>
                        )}

                        {!isUnitRole && onStatusUpdate && finding.status === 'Takip Ediliyor' && (
                            <Button variant="primary" onClick={() => onStatusUpdate(finding, 'Doğrulama Bekliyor')}>Kanıt Geldi (Doğrulamaya Al)</Button>
                        )}

                        {!isUnitRole && onStatusUpdate && finding.status === 'Doğrulama Bekliyor' && (
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
                        {(finding.actionPlan || finding.inspectorEvidence?.length || finding.unitEvidence?.length || canRespond || canUploadEvidence) && (
                            <div className="space-y-4 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800">Yanıt ve Aksiyonlar</h3>

                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    {canRespond ? (
                                        <div className="space-y-4 mb-6 bg-emerald-50/30 p-5 rounded-xl border border-emerald-100">
                                            <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                                <Edit2 size={16} /> Aksiyon Planı ve Yanıt Girişi
                                            </h4>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Aksiyon Planınız <span className="text-red-500">*</span></label>
                                                <textarea
                                                    className="w-full form-input rounded-lg border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm"
                                                    rows={4}
                                                    placeholder="Bulguya istinaden alınacak aksiyonları ve kök neden analizini detaylıca açıklayınız..."
                                                    value={actionPlan}
                                                    onChange={e => setActionPlan(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Aksiyon Sorumlusu</label>
                                                    <input
                                                        type="text"
                                                        className="w-full form-input rounded-lg border-emerald-200 focus:border-emerald-500 text-sm"
                                                        placeholder="Örn: Ahmet Yılmaz (Kredi Tahsis)"
                                                        value={actionOwner}
                                                        onChange={e => setActionOwner(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hedeflenen Termin (Vade)</label>
                                                    <input
                                                        type="date"
                                                        className="w-full form-input rounded-lg border-emerald-200 focus:border-emerald-500 text-sm"
                                                        value={targetDate}
                                                        onChange={e => setTargetDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <Button variant="primary" onClick={handleSubmitResponse} disabled={isSubmitting}>
                                                    {isSubmitting ? 'Kaydediliyor...' : 'Yanıtı Gönder ve Onaya Sun'}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : finding.actionPlan ? (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-emerald-700 mb-2">Birim Aksiyon Planı</h4>
                                            <p className="text-sm text-gray-700 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">{finding.actionPlan}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded border border-dashed text-sm mb-6">
                                            Henüz aksiyon planı girilmemiş.
                                        </div>
                                    )}

                                    {canUploadEvidence && (
                                        <div className="mb-6 bg-blue-50/30 p-5 rounded-xl border border-blue-100">
                                            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                                                <FileSearch size={16} /> Kanıt Yükleme ve Doğrulama Talebi
                                            </h4>
                                            <p className="text-xs text-blue-600 mb-4">Bu bulgu için aksiyonlarınız tamamlandıysa, lütfen kanıt dosyalarınızı ekleyip müfettişin doğrulamasına sunun.</p>
                                            
                                            <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-white mb-4">
                                                <input type="file" multiple className="hidden" id="evidence-upload" />
                                                <label htmlFor="evidence-upload" className="cursor-pointer flex flex-col items-center">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                                        <Plus size={20} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-blue-700">Dosya Seçin veya Sürükleyin</span>
                                                    <span className="text-xs text-gray-400 mt-1">PDF, Excel, Word, JPEG (Maks 10MB)</span>
                                                </label>
                                            </div>
                                            
                                            <div className="flex justify-end">
                                                <Button variant="primary" onClick={handleSubmitEvidence} disabled={isSubmitting}>
                                                    {isSubmitting ? 'Gönderiliyor...' : 'Kanıtları Gönder ve Doğrulama İste'}
                                                </Button>
                                            </div>
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
                        <Timeline
                            events={finding.history?.map((record: any, index: number) => ({
                                id: index.toString(),
                                timestamp: record.date ? new Date(record.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                                user: record.user || 'Sistem',
                                title: record.action || 'İşlem',
                                actionType: record.action?.toLowerCase().includes('güncelle') ? 'update' : 'default',
                                description: (
                                    <div className="leading-relaxed">
                                        {renderSmartText(formatLogDetails(record.details || record.description || ''))}
                                    </div>
                                )
                            })) || []}
                            emptyStateMessage="İşlem geçmişi bulunmuyor"
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
}

// Add these to types/audit.ts if not present, but for now assuming they are on Finding type or we can extend locally if needed.
// However, previous code showed them on finding object.
