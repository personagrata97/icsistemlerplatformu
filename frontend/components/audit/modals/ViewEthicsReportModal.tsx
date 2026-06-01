import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import CustomSelect from '@/components/ui/CustomSelect';
import Tooltip from '@/components/ui/Tooltip';
import OverflowTooltip from '@/components/ui/OverflowTooltip';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { Edit2, CheckCircle, MessageSquare, AlertTriangle, FileText, Link2, UserPlus, ShieldCheck, X, Paperclip, ExternalLink, Download, Send, History, Briefcase, ChevronDown, ChevronUp, Save, User, Clock, Copy } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import { formatDate, formatDateTime } from '@/lib/audit-utils';
import StaffMultiSelect from '@/components/audit/StaffMultiSelect';
import EvidenceList from '@/components/audit/ethics/EvidenceList';

interface EthicsReport {
    id: string;
    type: string;
    source: string;
    date: string;
    status: 'Yeni' | 'İnceleniyor' | 'Kapatıldı';
    priority: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';
    description?: string;
    reporter?: string;
    trackingCode?: string;
    slaDeadline?: string;
    investigationOutcome?: string;
    closingSummary?: string;
    disciplinaryAction?: boolean;
    disciplinaryActionDetails?: string;
    linkedFindingId?: string;
    linkedAuditId?: string;
    linkedAudits?: { id: string; code?: string; title: string; }[];
    assigneeId?: string;
    assignee?: { displayName: string; title?: string };
    assigneeConflictDeclared?: boolean;
    created_at?: string;
    internalNotes?: string;
    evidences?: any[];
    messages?: any[];
}

interface ViewEthicsReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: EthicsReport | null;
    onStatusChange: (item: EthicsReport, status: string) => void;
    onRefresh?: () => void;
}

const OUTCOME_OPTIONS = [
    // Rapor Gerektiren Sonuçlar
    { value: 'Soruşturma Raporu Yazıldı', label: 'Soruşturma Raporu Yazıldı', requiresAudit: true },
    { value: 'İnceleme Raporu Yazıldı', label: 'İnceleme Raporu Yazıldı', requiresAudit: true },
    { value: 'Disiplin İşlemi Uygulandı', label: 'Disiplin İşlemi Uygulandı', requiresAudit: true },
    // Devir Sonuçları
    { value: 'İK\'ya Devredildi', label: 'İK\'ya Devredildi', requiresAudit: false },
    { value: 'İlgili Birime Aktarıldı', label: 'İlgili Birime Aktarıldı', requiresAudit: false },
    // Kapatma Sonuçları
    { value: 'Asılsız Bulundu', label: 'Asılsız Bulundu', requiresAudit: false },
    { value: 'Kanıt Yetersiz', label: 'Kanıt Yetersiz', requiresAudit: false },
    { value: 'Takipsiz Bırakıldı', label: 'Takipsiz Bırakıldı (Kişi Ayrıldı vb.)', requiresAudit: false },
];

// Helper to fix filename encoding issues (Latin1 to UTF8)
const fixFileName = (name: string) => {
    try {
        if (!name) return '';
        // Common Turkish character repairs
        return name
            .replace(/Ã¼/g, 'ü').replace(/Ã§/g, 'ç').replace(/Ã¶/g, 'ö').replace(/Ä±/g, 'ı').replace(/ÄŸ/g, 'ğ').replace(/ÅŸ/g, 'ş').replace(/Ã‡/g, 'Ç').replace(/Ã–/g, 'Ö').replace(/Ä°/g, 'İ').replace(/Ä/g, 'Ğ').replace(/Å/g, 'Ş').replace(/Ãœ/g, 'Ü') // UTF-8 misinterpretation
            .replace(/ÅŸ/g, 'ş')
            .replace(/Ã…Å¸/g, 'ş')
            .replace(/PaydaÅŸ/g, 'Paydaş')
            .replace(/Payda\?/g, 'Paydaş')
            .replace(/PaydaÅ\?/g, 'Paydaş')
            .replace(/Payda\?\?/g, 'Paydaş')
            // Clean up potentially corrupted suffixes or double chars if they exist in source
            .replace(/Paydaşş/g, 'Paydaş')
            .replace(/\uFFFD/g, '') // Remove Replacement Character
            .replace(/☒/g, '') // Remove box symbol if literal
            .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, '') // Remove non-printable / weird controls, keeping extended latin
            ;
    } catch (e) { return name; }
};

export default function ViewEthicsReportModal({
    isOpen,
    onClose,
    report,
    onStatusChange,
    onRefresh
}: ViewEthicsReportModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [fullReport, setFullReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form states
    const [outcome, setOutcome] = useState('');
    const [closingSummary, setClosingSummary] = useState('');
    const [disciplinaryAction, setDisciplinaryAction] = useState(false);
    const [disciplinaryActionDetails, setDisciplinaryActionDetails] = useState('');
    // linkedFindingId and linkedAuditIds defined below
    const [findings, setFindings] = useState<any[]>([]);
    const [audits, setAudits] = useState<any[]>([]);

    // Assignment states
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [conflictDeclared, setConflictDeclared] = useState(false);
    const [linkedAuditIds, setLinkedAuditIds] = useState<string[]>([]);
    const [linkedFindingId, setLinkedFindingId] = useState('');
    const [auditSearch, setAuditSearch] = useState('');
    const [staff, setStaff] = useState<any[]>([]);

    // Communication states
    const [message, setMessage] = useState('');

    const isCurrentUserAssignee = fullReport?.assigneeId === user?.id;
    const isConflictDeclared = fullReport?.assigneeConflictDeclared;
    const isConflictRequiredAndNotDeclared = isCurrentUserAssignee && !isConflictDeclared;

    useEffect(() => {
        if (isOpen && report?.id) {
            loadFullData();
            loadFindings();
            loadAudits();
            loadStaff();

            // Initialize linked audits
            const initialLinkedIds: string[] = [];
            if (report.linkedAuditId) initialLinkedIds.push(report.linkedAuditId);
            if (report.linkedAudits && report.linkedAudits.length > 0) {
                report.linkedAudits.forEach(a => {
                    if (!initialLinkedIds.includes(a.id)) initialLinkedIds.push(a.id);
                });
            }
            setLinkedAuditIds(initialLinkedIds);

            // Initialize outcome defaults if needed
            setOutcome(report.investigationOutcome || '');
            setClosingSummary(report.closingSummary || '');
        } else {
            setFullReport(null);
            setActiveTab('details');
            resetForms();
        }
    }, [isOpen, report]);

    const resetForms = () => {
        setOutcome('');
        setClosingSummary('');
        setDisciplinaryAction(false);
        setDisciplinaryActionDetails('');
        setLinkedFindingId('');
        setLinkedAuditIds([]);
        setSelectedAssigneeIds([]);
        setConflictDeclared(false);
        setMessage('');
    };

    const loadFullData = async () => {
        try {
            setLoading(true);
            const data = await auditApi.getReportWithHistory(report!.id);
            setFullReport(data);
            if (data.assigneeId) setSelectedAssigneeIds([data.assigneeId]);
        } catch (error) {
            console.error('Failed to load report history', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFindings = async () => {
        try {
            const data = await auditApi.getFindings();
            setFindings(data.filter((f: any) => f.status === 'Açık'));
        } catch (error) {
            console.error('Failed to load findings', error);
        }
    };

    const loadAudits = async () => {
        try {
            const data = await auditApi.getAudits();
            // Filter to investigation/review type audits
            setAudits(data.filter((a: any) => ['Soruşturma', 'İnceleme', 'Süreç Denetimi', 'Şube Denetimi'].includes(a.type)));
        } catch (error) {
            console.error('Failed to load audits', error);
        }
    };

    const loadStaff = async () => {
        try {
            const data = await auditApi.getStaff();
            setStaff(data);
        } catch (error) {
            console.error('Failed to load staff', error);
        }
    };

    const handleDeclareConflict = async () => {
        try {
            setProcessing(true);
            await auditApi.declareEthicsConflict(report!.id);
            showToast('Çıkar çatışması bulunmadığı beyan edilmiştir. İnceleme başlatıldı.', 'success');
            loadFullData();
            onRefresh?.();
        } catch (error) {
            console.error('Beyan hatası', error);
            showToast(error instanceof Error ? error.message : 'Beyan kaydedilirken hata oluştu.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleAssign = async () => {
        if (selectedAssigneeIds.length === 0) return;

        try {
            setProcessing(true);
            // Yöneticinin yaptığı atama esnasında artık çıkar çatışması beyan şartı aranmıyor, atanan kişi kendisi onaylayacak.
            await auditApi.assignEthicsReport(report!.id, selectedAssigneeIds[0], false);
            showToast(`${selectedAssigneeIds.length} müfettiş atandı`, 'success');
            onRefresh?.();
            onClose();
        } catch (error) {
            console.error('Failed to assign report', error);
            showToast(error instanceof Error ? error.message : 'Atama yapılırken hata oluştu.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = async () => {
        if (!outcome) {
            showToast('Lütfen inceleme sonucunu seçiniz.', 'warning');
            return;
        }
        if (!closingSummary.trim()) {
            showToast('Lütfen kapanış özetini giriniz.', 'warning');
            return;
        }

        // Check if outcome requires an audit/report link
        const selectedOutcome = OUTCOME_OPTIONS.find(o => o.value === outcome);
        if (selectedOutcome?.requiresAudit && linkedAuditIds.length === 0) {
            showToast('Bu sonuç için ilişkili bir denetim/rapor seçmeniz gerekmektedir.', 'warning');
            return;
        }

        try {
            setProcessing(true);
            // Prepare data - ensure arrays are sent correctly
            const closePayload = {
                investigationOutcome: outcome,
                closingSummary,
                disciplinaryAction,
                disciplinaryActionDetails: disciplinaryAction ? disciplinaryActionDetails : undefined,
                linkedFindingId: linkedFindingId || undefined,
                linkedAuditIds: linkedAuditIds.length > 0 ? linkedAuditIds : undefined
            };

            await auditApi.closeEthicsReport(report!.id, closePayload);
            showToast('Bildirim başarıyla kapatıldı', 'success');
            onRefresh?.();
            onClose();
        } catch (error) {
            console.error('Failed to close report', error);
            showToast(error instanceof Error ? error.message : 'Bildirim kapatılırken hata oluştu.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        try {
            setProcessing(true);
            await auditApi.addEthicsMessage(report!.id, message);
            setMessage('');
            loadFullData();
            showToast('Mesaj iletildi', 'success');
        } catch (error) {
            console.error('Failed to send message', error);
            showToast(error instanceof Error ? error.message : 'Mesaj gönderilirken hata oluştu.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Source translation map
    const sourceMap: Record<string, string> = {
        'Public Web': 'Açık Web',
        'Internal Portal': 'İç Portal',
        'E-posta': 'E-posta',
        'Yüz Yüze': 'Yüz Yüze',
        'Web Form': 'Web Formu',
        'Manuel Giriş': 'Manuel Giriş',
    };

    if (!isOpen || !report) return null;

    // Calculate SLA status
    const getSlaStatus = () => {
        if (!report.slaDeadline || report.status === 'Kapatıldı') return null;
        const deadline = new Date(report.slaDeadline);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: `${Math.abs(diffDays)} Gün Gecikti`, color: 'text-red-600 bg-red-50' };
        if (diffDays <= 3) return { text: `${diffDays} Gün Kaldı`, color: 'text-amber-600 bg-amber-50' };
        return { text: `${diffDays} Gün Kaldı`, color: 'text-green-600 bg-green-50' };
    };

    const slaStatus = getSlaStatus();
    const r = (fullReport || report) as any;
 
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl shadow-sm">
                            <MessageSquare size={20} />
                        </div>
                        <span className="text-xl font-bold text-gray-800">
                            {{
                                'Cikar': 'Çıkar Çatışması',
                                'Soruşturma': 'Soruşturma',
                                'Inceleme': 'İnceleme',
                                'Diger': 'Diğer'
                            }[report.type] || report.type}
                        </span>
                    </div>
                    {report.trackingCode && (
                        <span className="text-xs text-gray-400 font-mono pl-11">Takip Kodu: {report.trackingCode}</span>
                    )}
                </div>
            }
            size="xl"
            footer={
                activeTab === 'close' ? (
                    <div className="flex justify-end gap-3 w-full">
                        <Button onClick={onClose} variant="secondary">İptal</Button>
                        <Button
                            onClick={handleClose}
                            disabled={processing || !outcome || !closingSummary.trim()}
                            variant="primary"
                            className="px-6 hover:bg-green-700 bg-green-600 border-none shadow-green-900/10"
                            isLoading={processing}
                        >
                            Bildirimi Kapat
                        </Button>
                    </div>
                ) : activeTab === 'assignment' ? (
                    <div className="flex justify-end gap-3 w-full">
                        <Button onClick={() => setActiveTab('details')} variant="secondary">İptal</Button>
                        <Button
                            onClick={handleAssign}
                            disabled={processing || selectedAssigneeIds.length === 0}
                            className="px-6 bg-green-600 hover:bg-green-700 border-none text-white shadow-green-900/10"
                            isLoading={processing}
                        >
                            Atamayı Tamamla
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-end gap-3 w-full">
                        {/* Manager Reassign Button */}
                        {(report.status === 'Yeni' || report.status === 'İnceleniyor') && (
                            <Button
                                onClick={() => setActiveTab('assignment')}
                                variant="primary"
                                className="bg-green-600 hover:bg-green-700 border-none text-white gap-2 px-4 shadow-sm"
                            >
                                {report.status === 'Yeni' ? 'Müfettiş Ata' : 'Görevi Devret'}
                            </Button>
                        )}
                        {report.status === 'Yeni' && (
                            <Button
                                onClick={() => {
                                    onStatusChange(report, 'İnceleniyor');
                                    onClose();
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm border-none"
                            >
                                İncelemeye Al
                            </Button>
                        )}
                        {report.status === 'İnceleniyor' && (
                            <Button
                                onClick={() => setActiveTab('close')}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 shadow-sm"
                            >
                                Bildirimi Kapat
                            </Button>
                        )}
                    </div>
                )
            }
        >
            <div className="space-y-6">
                {/* Tabs - Using SegmentedTabs for consistency */}
                <SegmentedTabs
                    tabs={[
                        { id: 'details', label: 'Detaylar', icon: FileText },
                        { id: 'history', label: 'Süreç Geçmişi', icon: History },
                        { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
                        ...((report.status === 'Yeni' || report.status === 'İnceleniyor') ? [{ id: 'assignment', label: 'Atama', icon: UserPlus }] : []),
                        ...(report.status !== 'Yeni' || fullReport?.investigationNotes?.length > 0 ? [{ id: 'investigation', label: 'İnceleme Notları', icon: Briefcase }] : []),
                        ...(report.status === 'İnceleniyor' ? [{ id: 'close', label: 'Kapatma', icon: CheckCircle }] : [])
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                {/* Linked Finding Badge */}
                {report.linkedFindingId && (
                    <div className="flex justify-end -mt-2">
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1 animate-pulse">
                            <Link2 size={12} /> Bulgusu Mevcut
                        </div>
                    </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <>
                        {isConflictRequiredAndNotDeclared && (
                            <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-4 duration-500 shadow-md">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-red-600 rounded-2xl shrink-0 shadow-lg shadow-red-200 flex items-center justify-center text-white">
                                        <AlertTriangle size={24} className="animate-bounce" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-extrabold text-red-900 text-base mb-1.5 flex items-center gap-2">
                                            İnceleme Sorumlusu Çıkar Çatışması Beyanı
                                        </h4>
                                        <p className="text-sm text-red-800/80 mb-4 font-semibold leading-relaxed">
                                            Sayın Müfettiş, bu etik bildiriminde inceleme sorumlusu olarak görevlendirildiniz. İnceleme detaylarına tam erişim sağlamak ve süreci başlatmak için herhangi bir çıkar çatışmanız olmadığını beyan etmeniz gerekmektedir.
                                        </p>
                                        <Button
                                            onClick={handleDeclareConflict}
                                            isLoading={processing}
                                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-md shadow-red-600/10 flex items-center gap-2"
                                        >
                                            <ShieldCheck size={16} />
                                            Çıkar Çatışması Bulunmadığını Beyan Et ve Başla
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                            <StatusBadge type="risk" value={r.priority === 'Düşük' ? 'Düşük' : r.priority} />
                            <StatusBadge type="status" value={r.status} />
                            {slaStatus && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${slaStatus.color}`}>
                                    {slaStatus.text}
                                </span>
                            )}
                        </div>
                        {/* Compact Header Grid */}
                        {/* Compact Header Grid - Row 1 */}
                        <div className="grid grid-cols-12 gap-3 mb-3">
                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 col-span-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Şikayet Konusu</span>
                                <span className="font-bold text-slate-800 text-sm block truncate" title={r.type}>
                                    {r.type || 'Belirtilmemiş'}
                                </span>
                            </div>
                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 col-span-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Kaynak</span>
                                <span className="font-bold text-gray-700 text-sm">{sourceMap[r.source] || r.source}</span>
                            </div>
                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 col-span-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tarih</span>
                                <span className="font-bold text-gray-700 text-sm flex flex-col">
                                    <span>{formatDate(r.created_at || r.date)}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {r.created_at ? formatDateTime(r.created_at).split(' - ')[1] : ''}
                                    </span>
                                </span>
                            </div>
                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 col-span-4 flex flex-col justify-between overflow-hidden">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bildiren</span>
                                    <span className="font-bold text-gray-700 text-sm block">
                                        {r.anonymous ? 'Anonim' : (r.name || r.reporterName || r.reporter?.displayName || 'Belirtilmemiş')}
                                    </span>
                                </div>
                                {!r.anonymous && (r.email || r.phone) && (
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-200/50 text-[10px] text-gray-500 font-medium space-y-1 animate-in fade-in duration-300">
                                        {r.email && (
                                            <OverflowTooltip content={`E-posta: ${r.email}`}>
                                                <span
                                                    onClick={(e) => {
                                                        const el = e.currentTarget;
                                                        const range = document.createRange();
                                                        range.selectNodeContents(el);
                                                        const sel = window.getSelection();
                                                        sel?.removeAllRanges();
                                                        sel?.addRange(range);
                                                    }}
                                                    className="block break-all font-semibold text-gray-600 cursor-pointer select-all hover:text-primary transition-colors leading-normal"
                                                >
                                                    E-posta: {r.email}
                                                </span>
                                            </OverflowTooltip>
                                        )}
                                        {r.phone && (
                                            <OverflowTooltip content={`Tel: ${r.phone}`}>
                                                <span
                                                    onClick={(e) => {
                                                        const el = e.currentTarget;
                                                        const range = document.createRange();
                                                        range.selectNodeContents(el);
                                                        const sel = window.getSelection();
                                                        sel?.removeAllRanges();
                                                        sel?.addRange(range);
                                                    }}
                                                    className="block break-all font-semibold text-gray-600 cursor-pointer select-all hover:text-primary transition-colors leading-normal"
                                                >
                                                    Tel: {r.phone}
                                                </span>
                                            </OverflowTooltip>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
 
                        {/* Compact Header Grid - Row 2 (Full Width) */}
                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 mb-6 w-full">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">İnceleme Sorumlusu</span>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <span className="font-bold text-primary text-sm block">
                                        {r.assignee?.displayName || 'Atanmadı'}
                                    </span>
                                    {r.assignee?.title && (
                                        <span className="text-[10px] text-gray-500 block font-medium">
                                            {r.assignee.title}
                                        </span>
                                    )}
                                </div>
                                {report.assigneeConflictDeclared && (
                                    <span className="text-[9px] text-green-600 font-bold flex items-center gap-1 leading-tight bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                        <ShieldCheck size={12} className="shrink-0" />
                                        <span>Çıkar çatışması bulunmadığı beyan edilmiştir</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {report.investigationOutcome && (
                            <div className="mb-6 border border-orange-100 bg-orange-50/30 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">İnceleme Sonucu</span>
                                    <span className="font-black text-orange-700 text-lg">{report.investigationOutcome}</span>
                                </div>
                                {report.disciplinaryAction && (
                                    <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold uppercase border border-red-200 shadow-sm">
                                        Disiplin İşlemi Uygulandı
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Linked Audits Display (Many-to-Many) */}
                        {((report.linkedAudits && report.linkedAudits.length > 0) || report.linkedAuditId) && (
                            <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-md">İLGİLİ DENETİMLER / RAPORLAR</span>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* Handle Array of Audits */}
                                    {report.linkedAudits && report.linkedAudits.length > 0 ? (
                                        report.linkedAudits.map(audit => (
                                            <div
                                                key={audit.id}
                                                onClick={() => router.push(`/audit/audits/${audit.id}`)}
                                                className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <Briefcase size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">BAĞLI DENETİM</span>
                                                        <span className="font-bold text-gray-900 text-sm">
                                                            {audit.code || 'Kod Yok'} - {audit.title || 'Başlık Yok'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500 font-medium text-xs bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                                    Git <ExternalLink size={12} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        /* Fallback for Legacy Single Audit ID */
                                        report.linkedAuditId && (
                                            <div
                                                onClick={() => router.push(`/audit/audits/${report.linkedAuditId}`)}
                                                className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <Briefcase size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">BAĞLI DENETİM (ESKİ)</span>
                                                        <span className="font-bold text-gray-900 text-sm">
                                                            {audits.find(a => a.id === report.linkedAuditId)?.title || 'Denetim Detayı'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500 font-medium text-xs bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                                    Git <ExternalLink size={12} />
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md">BİLDİRİM DETAYI</span>
                                <div className="h-px bg-gray-100 flex-1"></div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-700 leading-relaxed shadow-sm min-h-[200px] text-base whitespace-pre-wrap">
                                {report.description || 'Açıklama girilmemiş.'}
                            </div>
                        </div>

                        {/* Linked Finding Display */}
                        {report.linkedFindingId && (
                            <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-md">İLGİLİ DENETİM BULGUSU</span>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                <div
                                    onClick={() => router.push(`/audit/findings?id=${report.linkedFindingId}`)}
                                    className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">BAĞLI BULGU</span>
                                            <span className="font-bold text-gray-900 text-sm">Bulgu ID: {report.linkedFindingId}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 font-medium text-xs bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                                        Bulguya Git <ExternalLink size={12} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Disciplinary Details Display (If closed) */}
                        {report.status === 'Kapatıldı' && report.disciplinaryAction && (
                            <div className="mb-6 p-4 rounded-2xl border border-red-100 bg-red-50/20">
                                <div className="flex items-center gap-2 mb-2 text-red-700">
                                    <ShieldCheck size={18} />
                                    <span className="text-sm font-bold uppercase tracking-tight">Disiplin İşlemi Detayı</span>
                                </div>
                                <div className="text-sm text-gray-700 italic border-l-2 border-red-200 pl-4 py-1">
                                    {report.disciplinaryActionDetails || 'Açıklama girilmemiş.'}
                                </div>
                            </div>
                        )}

                        {/* Evidences Section - Collapsible */}
                        {(fullReport?.evidences?.length > 0) && (
                            <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
                                <EvidenceList 
                                    evidences={fullReport.evidences} 
                                    trackingCode={report?.trackingCode} 
                                />
                            </div>
                        )}
                    </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-8 py-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <div className="h-8 w-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-sm font-medium">Süreç geçmişi yükleniyor...</p>
                            </div>
                        ) : (
                            <div className="relative pl-0">
                                <ProcessTimeline items={fullReport?.logs || []} />
                            </div>
                        )}
                    </div>
                )}
                {/* Messages Tab */}
                {/* Messages Tab */}
                {/* Messages Tab */}
                {activeTab === 'messages' && (
                    isConflictRequiredAndNotDeclared ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 shadow-sm border border-red-100 animate-bounce">
                                <AlertTriangle size={28} />
                            </div>
                            <h4 className="text-base font-extrabold text-gray-800 mb-2">🔒 Erişim Kısıtlandı</h4>
                            <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
                                Bu bildirimle ilgili mesajlaşma paneline erişebilmek için öncelikle <b>Detaylar</b> sekmesinden çıkar çatışması bulunmadığını beyan etmeniz gerekmektedir.
                            </p>
                            <Button
                                onClick={() => setActiveTab('details')}
                                variant="secondary"
                                className="text-xs font-bold uppercase tracking-wider px-4 border-gray-300 hover:bg-gray-100"
                            >
                                Beyan Sayfasına Git
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-[350px]">
                            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 mb-3 custom-scrollbar">
                                {fullReport?.messages?.length > 0 ? (
                                    fullReport.messages.map((msg: any) => (
                                        <div key={msg.id} className={`flex flex-col ${msg.isFromReporter ? 'items-start' : 'items-end'}`}>
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${msg.isFromReporter ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100' : 'bg-primary text-white rounded-tr-none'}`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-widest opacity-70 ${msg.isFromReporter ? 'text-primary' : 'text-white'}`}>
                                                    {msg.isFromReporter ? 'Bildirim Sahibi' : (msg.sender?.displayName || 'Teftiş Kurulu')} • {formatDateTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 italic opacity-60">
                                        <MessageSquare size={32} className="mb-2" />
                                        <span className="text-sm">Henüz mesaj bulunmamaktadır.</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 items-center bg-white p-1">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (message.trim() && !processing) {
                                                handleSendMessage();
                                            }
                                        }
                                    }}
                                    className="form-input flex-1 h-[46px] min-h-[46px] max-h-[100px] resize-none rounded-xl text-sm py-3 border-gray-200 focus:border-primary focus:ring-primary/20"
                                    placeholder="Mesajınızı yazınız..."
                                />
                                <Tooltip content="Gönder">
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={processing || !message.trim()}
                                        className="h-[46px] w-[50px] p-0 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 hover:scale-105 active:scale-95 transition-all"
                                        isLoading={processing}
                                    >
                                        <Send size={20} />
                                    </Button>
                                </Tooltip>
                            </div>
                        </div>
                    )
                )}

                {/* Assignment Tab */}
                {activeTab === 'assignment' && (
                    <div className="space-y-5 min-h-[380px]">
                        <div className="bg-green-50 p-3 rounded-lg flex items-center gap-3 text-green-800 text-xs border border-green-100">
                            <UserPlus size={16} className="shrink-0 text-green-600" />
                            <p>Bildirimi inceleyecek müfettiş(ler)i seçerek atamayı tamamlayabilirsiniz.</p>
                        </div>

                        {/* Staff Multi Selection */}
                        <StaffMultiSelect
                            staffList={staff as any}
                            selectedIds={selectedAssigneeIds}
                            onChange={setSelectedAssigneeIds}
                            label="İnceleme Müfettişleri"
                            placeholder="Müfettiş seçin..."
                        />
                    </div>
                )}
                {activeTab === 'investigation' && (
                    isConflictRequiredAndNotDeclared ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 shadow-sm border border-red-100 animate-bounce">
                                <AlertTriangle size={28} />
                            </div>
                            <h4 className="text-base font-extrabold text-gray-800 mb-2">🔒 Erişim Kısıtlandı</h4>
                            <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
                                Bu bildirimle ilgili inceleme notlarına erişebilmek için öncelikle <b>Detaylar</b> sekmesinden çıkar çatışması bulunmadığını beyan etmeniz gerekmektedir.
                            </p>
                            <Button
                                onClick={() => setActiveTab('details')}
                                variant="secondary"
                                className="text-xs font-bold uppercase tracking-wider px-4 border-gray-300 hover:bg-gray-100"
                            >
                                Beyan Sayfasına Git
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-[380px]">
                            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 text-blue-800 text-xs border border-blue-100 mb-3">
                                <Briefcase size={16} className="shrink-0 text-blue-600" />
                                <p>Teftiş Kurulu'nun görebileceği <span className="font-bold">dahili notlar</span> alanıdır (Bildirim sahibi göremez).</p>
                            </div>

                            {/* Notes History */}
                            <div className="flex-1 overflow-y-auto space-y-3 mb-3 custom-scrollbar">
                                {fullReport?.investigationNotes && fullReport.investigationNotes.length > 0 ? (
                                    fullReport.investigationNotes.map((note: any, idx: number) => (
                                        <div key={note.id || idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User size={14} className="text-blue-600" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {note.author?.displayName || note.authorName || 'Teftiş Kurulu'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Clock size={10} />
                                                    <span>{formatDateTime(note.createdAt || note.created_at)}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                        </div>
                                    ))
                                ) : fullReport?.internalNotes ? (
                                    /* Legacy single note display */
                                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User size={14} className="text-blue-600" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">Teftiş Kurulu</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fullReport.internalNotes}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                        <Briefcase size={32} className="mb-2 opacity-40" />
                                        <span className="text-xs">Henüz inceleme notu bulunmamaktadır.</span>
                                    </div>
                                )}
                            </div>

                            {/* Add New Note - Same style as Messages */}
                            <div className="flex gap-2 items-center">
                                <textarea
                                    id="investigation-notes"
                                    className="form-input flex-1 h-12 min-h-[48px] resize-none rounded-lg text-sm py-3"
                                    placeholder="Yeni not ekleyiniz..."
                                />
                                <Button
                                    onClick={async () => {
                                        const val = (document.getElementById('investigation-notes') as HTMLTextAreaElement).value;
                                        if (!val.trim()) return;
                                        try {
                                            setProcessing(true);
                                            await auditApi.updateEthicsReportNotes(report.id, val);
                                            (document.getElementById('investigation-notes') as HTMLTextAreaElement).value = '';
                                            showToast('İnceleme notu eklendi', 'success');
                                            loadFullData();
                                        } catch (err) {
                                            console.error(err);
                                            showToast('Not eklenemedi', 'error');
                                        } finally {
                                            setProcessing(false);
                                        }
                                    }}
                                    isLoading={processing}
                                    className="h-12 px-4 rounded-lg flex items-center gap-2 shadow-sm font-extrabold text-[10px] uppercase tracking-wider shrink-0"
                                >
                                    Not Ekle
                                </Button>
                            </div>
                        </div>
                    )
                )}

                {/* Close Tab */}
                {activeTab === 'close' && (
                    isConflictRequiredAndNotDeclared ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4 shadow-sm border border-red-100 animate-bounce">
                                <AlertTriangle size={28} />
                            </div>
                            <h4 className="text-base font-extrabold text-gray-800 mb-2">🔒 Erişim Kısıtlandı</h4>
                            <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
                                Bu bildirimle ilgili kapatma paneline erişebilmek için öncelikle <b>Detaylar</b> sekmesinden çıkar çatışması bulunmadığını beyan etmeniz gerekmektedir.
                            </p>
                            <Button
                                onClick={() => setActiveTab('details')}
                                variant="secondary"
                                className="text-xs font-bold uppercase tracking-wider px-4 border-gray-300 hover:bg-gray-100"
                            >
                                Beyan Sayfasına Git
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3 text-amber-700 text-sm">
                                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                                <p>Bu işlem bildirimi kapatacaktır. Lütfen inceleme sonucunu ve kapanış özetini dikkatlice giriniz.</p>
                            </div>

                            <div className="space-y-4">
                                <CustomSelect
                                    label="İnceleme Sonucu *"
                                    value={outcome}
                                    onChange={(v) => setOutcome(v as string)}
                                    options={OUTCOME_OPTIONS}
                                    placeholder="Sonuç seçiniz..."
                                />

                                {/* Denetim/Rapor Seçici - Zorunluluk outcome'a göre değişir */}
                                <CustomSelect
                                    label={`İlişkili Denetimler/Raporlar ${OUTCOME_OPTIONS.find(o => o.value === outcome)?.requiresAudit ? '*' : '(Opsiyonel)'}`}
                                    value={linkedAuditIds}
                                    onChange={(v) => setLinkedAuditIds(v as string[])}
                                    options={audits.map(a => ({
                                        value: a.id,
                                        label: `${a.code || 'Kod Yok'} - ${a.title || 'Başlık Yok'}`,
                                        subtitle: `${a.type || 'Tür Yok'} | ${a.status || 'Durum Yok'}`
                                    }))}
                                    placeholder="Bir veya birden fazla denetim seçiniz..."
                                    showSearch
                                    isMulti={true}
                                />
                                {OUTCOME_OPTIONS.find(o => o.value === outcome)?.requiresAudit && linkedAuditIds.length === 0 && (
                                    <p className="text-xs text-amber-600 -mt-2 flex items-center gap-1">
                                        <AlertTriangle size={12} /> Bu sonuç için en az bir denetim/rapor bağlantısı zorunludur
                                    </p>
                                )}

                                <CustomSelect
                                    label="İlişkili Denetim Bulgusu (Opsiyonel)"
                                    value={linkedFindingId}
                                    onChange={(v) => setLinkedFindingId(v as string)}
                                    options={findings.map(f => ({
                                        value: f.id,
                                        label: `${f.code} - ${f.headline}`,
                                        subtitle: f.auditableUnit?.name
                                    }))}
                                    placeholder="Bir bulgu ile ilişkilendir..."
                                    showSearch
                                />

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Kapanış Özeti *</label>
                                    <textarea
                                        value={closingSummary}
                                        onChange={(e) => setClosingSummary(e.target.value)}
                                        className="form-input w-full h-24 resize-none text-sm"
                                        placeholder="İnceleme bulgularını ve sonucu özetleyiniz..."
                                    />
                                </div>

                                <div className={`p-4 rounded-xl border transition-all ${disciplinaryAction ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                                    <Switch
                                        checked={disciplinaryAction}
                                        onChange={setDisciplinaryAction}
                                        label="Disiplin İşlemi Uygulandı"
                                        activeColor="bg-red-500"
                                    />

                                    {disciplinaryAction && (
                                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <CustomSelect
                                                    label="Disiplin Türü *"
                                                    value={disciplinaryActionDetails.split('|')[0] || ''}
                                                    onChange={(v) => {
                                                        const parts = disciplinaryActionDetails.split('|');
                                                        parts[0] = v as string;
                                                        setDisciplinaryActionDetails(parts.join('|'));
                                                    }}
                                                    options={[
                                                        { value: 'İhtar', label: 'İhtar' },
                                                        { value: 'Kınama', label: 'Kınama' },
                                                        { value: 'Ücret Kesintisi', label: 'Ücret Kesintisi' },
                                                        { value: 'Görevden Uzaklaştırma', label: 'Görevden Uzaklaştırma' },
                                                        { value: 'İşten Çıkarma', label: 'İşten Çıkarma' },
                                                        { value: 'Diğer', label: 'Diğer' }
                                                    ]}
                                                    placeholder="Seçiniz..."
                                                />
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Karar No / Referans</label>
                                                    <input
                                                        type="text"
                                                        value={disciplinaryActionDetails.split('|')[1] || ''}
                                                        onChange={(e) => {
                                                            const parts = disciplinaryActionDetails.split('|');
                                                            parts[1] = e.target.value;
                                                            setDisciplinaryActionDetails(parts.join('|'));
                                                        }}
                                                        className="form-input w-full text-sm"
                                                        placeholder="örn: DK-2026-0042"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Açıklama</label>
                                                <textarea
                                                    value={disciplinaryActionDetails.split('|')[2] || ''}
                                                    onChange={(e) => {
                                                        const parts = disciplinaryActionDetails.split('|');
                                                        parts[2] = e.target.value;
                                                        setDisciplinaryActionDetails(parts.join('|'));
                                                    }}
                                                    className="form-input w-full h-20 text-sm resize-none"
                                                    placeholder="Disiplin işlemi hakkında detay..."
                                                />
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                                                <FileText size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-blue-700 font-medium">Disiplin tutanağı nereye yüklenir?</p>
                                                    <p className="text-[11px] text-blue-600 mt-0.5">
                                                        Disiplin tutanağı ve karar belgeleri, ilişkili denetim/inceleme raporunun ekler bölümüne yüklenmelidir.
                                                        {linkedAuditIds.length > 0 && <span className="font-semibold"> → Seçili raporlara ekleyebilirsiniz.</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}

            </div>
        </Modal >
    );
}
