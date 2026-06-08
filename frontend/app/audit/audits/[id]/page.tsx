'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import {
    ArrowLeft, Calendar, User, FileText, Plus, MoreHorizontal, Download, Filter, Search,
    Trash2, Edit2, X, CheckCircle, Clock, AlertCircle, Send, RotateCw, Mail, MessageSquare,
    Check, XCircle, RefreshCw, ClipboardCheck, Users, Eye, Upload, Phone, File as FileIcon,
    History as HistoryIcon, Award, Paperclip, Printer, PenTool, FileType, Save, ChevronDown,
    RotateCcw, ExternalLink, Activity, Shield, ChevronRight, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import WorkpaperList from '@/components/audit/WorkpaperList';
import { getStatusBadgeClass, getRiskBadgeClass, formatDate, formatDateTime, calculateDuration, calculateBusinessDays, getStatusColor } from '@/lib/audit-utils';
import { auditApi, getWorkpaperUrl, Finding, AuditStaff, Workpaper, API_BASE_URL } from '@/lib/audit-api';
import { getAvailableTransitions } from '@/lib/audit-workflow';
import StaffMultiSelect from '@/components/audit/StaffMultiSelect';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/Toast';
import FindingsTable from '@/components/audit/FindingsTable';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import CreateFindingModal from '@/components/audit/CreateFindingModal';
import CreateAuditModal from '@/components/audit/CreateAuditModal';
import DeleteRequestModal from '@/components/audit/DeleteRequestModal';
import FindingDetailModal from '@/components/modals/FindingDetailModal';
import CustomSelect from '@/components/ui/CustomSelect';
import LoadingState from '@/components/ui/LoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import TestSteps from '@/components/audit/TestSteps';
import FindingActionButtons from '@/components/audit/FindingActionButtons';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { BackButton } from '@/components/ui/BackButton';
import Tooltip from '@/components/ui/Tooltip';
import { DateDisplay } from '@/components/ui/DateDisplay';
import IndependenceQuickPanel from '@/components/audit/IndependenceQuickPanel';
import { FileUpload } from '@/components/ui/FileUpload';
import { exportAuditToPdf } from '@/lib/pdf-export';

// Modular Detail Components
import AuditDetailHeader from '@/components/audit/detail/AuditDetailHeader';
import AuditWorkflowStepper from '@/components/audit/detail/AuditWorkflowStepper';
import AuditInformationGrid from '@/components/audit/detail/AuditInformationGrid';
import AuditOpinionSection from '@/components/audit/detail/AuditOpinionSection';
import AuditReportSection from '@/components/audit/detail/AuditReportSection';
import InvestigationReportSection from '@/components/audit/detail/InvestigationReportSection';
import AuditOverviewTab from '@/components/audit/detail/AuditOverviewTab';
import AuditFindingsTab from '@/components/audit/detail/AuditFindingsTab';
import AuditAttachmentsTab from '@/components/audit/detail/AuditAttachmentsTab';
import AuditTeamTab from '@/components/audit/detail/AuditTeamTab';
import AuditHistoryTab from '@/components/audit/detail/AuditHistoryTab';
import AuditTimesheetTab from '@/components/audit/detail/AuditTimesheetTab';
import CommunicationTimeline from '@/components/audit/communication/CommunicationTimeline';
import ComposeLetterModal from '@/components/audit/communication/ComposeLetterModal';
import MeetingMinutesModal from '@/components/audit/communication/MeetingMinutesModal';
import AuditMeetingsTab from '@/components/audit/AuditMeetingsTab';
import AuditPlanningTab from '@/components/audit/detail/AuditPlanningTab';


interface TeamMember {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
}


interface Attachment {
    id: string;
    name: string;
    type: string;
    description?: string;
    uploadedBy: string;
    uploadedAt: string;
    size: string;
    _category?: string;
}

interface AuditLog {
    id: string;
    action: string;
    user: string;
    date: string;
    details: string;
    changeData?: any;
}


// Local helper removed - using central getStatusBadgeClass

const opinionOptions = [
    { value: "Olumlu - Etkin", label: "Olumlu (Etkin)", subtitle: "Kontroller etkin, riskler yeterli düzeyde yönetiliyor", className: "text-green-700 bg-green-50" },
    { value: "Olumlu - Güçlü", label: "Olumlu (Güçlü)", subtitle: "Kontroller güçlü, iyileştirme fırsatları minimal", className: "text-green-700 bg-green-50" },
    { value: "Gelişime Açık - Orta", label: "Gelişime Açık (Orta)", subtitle: "Orta düzeyde eksiklik, izleme gerekiyor", className: "text-yellow-700 bg-yellow-50" },
    { value: "Gelişime Açık - Önemli", label: "Gelişime Açık (Önemli)", subtitle: "Önemli eksiklikler, yönetim eylemi gerekli", className: "text-yellow-700 bg-yellow-50" },
    { value: "Yetersiz - Zayıf", label: "Yetersiz (Zayıf)", subtitle: "Kontroller zayıf, ciddi riskler mevcut", className: "text-red-700 bg-red-50" },
    { value: "Yetersiz - Kritik", label: "Yetersiz (Kritik)", subtitle: "Acil müdahale gerektiren kritik zayıflıklar", className: "text-red-700 bg-red-50" },
    { value: "Görüş Bildirilemedi", label: "Görüş Bildirilemedi", subtitle: "Kapsam kısıtlaması veya yetersiz kanıt", className: "text-gray-700 bg-gray-50" }
];

export default function AuditDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { user } = useAuth();
    const id = params.id as string;

    // Determine back URL
    const backUrl = searchParams.get('from') || '/audit/audits';

    const [duration, setDuration] = useState(0);
    const [actualDuration, setActualDuration] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Independence States
    const [myDeclaration, setMyDeclaration] = useState<any>(null);
    const [isCheckingDeclaration, setIsCheckingDeclaration] = useState(true);

    // Modal States
    const [showFindingModal, setShowFindingModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [commonRole, setCommonRole] = useState('Müfettiş');
    const [showViewFindingModal, setShowViewFindingModal] = useState(false);
    const [selectedFinding, setSelectedFinding] = useState<any>(null);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [showReportAttachmentModal, setShowReportAttachmentModal] = useState(false);
    const [showUploadFinalModal, setShowUploadFinalModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [attSortCol, setAttSortCol] = useState('');
    const [attSortDir, setAttSortDir] = useState<'asc' | 'desc'>('desc');

    // Unified Confirmation State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'DELETE_AUDIT' | 'DELETE_FINDING' | 'DELETE_WORKPAPER' | 'DELETE_ATTACHMENT' | 'COMPLETE_AUDIT' | 'REMOVE_TEAM_MEMBER' | null;
        data: any;
        title: string;
        message: string;
    }>({ isOpen: false, type: null, data: null, title: '', message: '' });

    // Data States - FROM API
    const [auditData, setAuditData] = useState<any>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [reportAttachments, setReportAttachments] = useState<Attachment[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    // Communication & Meetings State
    const [communications, setCommunications] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [editingCommunication, setEditingCommunication] = useState<any>(null);
    const [editingMeeting, setEditingMeeting] = useState<any>(null);

    // New State for Staff Selection
    const [allStaff, setAllStaff] = useState<AuditStaff[]>([]);

    // Opinion & Report States
    const [selectedOpinion, setSelectedOpinion] = useState('');
    const [finalReportFile, setFinalReportFile] = useState<File | null>(null);
    const [newAttachment, setNewAttachment] = useState({ name: '', description: '', file: null as File | null });
    const [newReportAttachment, setNewReportAttachment] = useState({ name: '', description: '', file: null as File | null, category: 'Açılış Tutanağı' });

    // Workflow Steps
    const workflowSteps = ['Taslak', 'Planlandı', 'Devam Ediyor', 'Gözden Geçirme', 'Tamamlandı'];
    const RISK_CATEGORIES = ['Operasyonel', 'Finansal', 'Uyum', 'BT', 'İnsan Kaynakları', 'İtibar', 'Diğer'];

    // Form States
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    const [newMember, setNewMember] = useState({ name: '', role: 'Müfettiş', email: '', phone: '' });

    // Fieldwork / RCM States
    const [allUnits, setAllUnits] = useState<any[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');

    // Delete Request State
    const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
    const [showEditAuditModal, setShowEditAuditModal] = useState(false);
    const [deleteTargetType, setDeleteTargetType] = useState<'AUDIT' | 'FINDING'>('AUDIT');
    const [deleteTargetItem, setDeleteTargetItem] = useState<any>(null);
    const [isAssignedToAudit, setIsAssignedToAudit] = useState<boolean>(false);
    const { hasRole } = useAuth();
    const canDelete = checkRole(hasRole, ROLES.AUDIT_DELETE);



    // Load data from API
    useEffect(() => {
        const handleOpenFindingModal = (e: any) => {
            if (e.detail?.auditId === id) {
                setSelectedFinding(null);
                setShowFindingModal(true);
                setActiveTab('findings'); // Bulgu sekmesine geçir
            }
        };
        window.addEventListener('openFindingModalFromInvestigation', handleOpenFindingModal);

        loadData();
        if (id && user?.id) {
            checkIndependence();
        }

        return () => {
            window.removeEventListener('openFindingModalFromInvestigation', handleOpenFindingModal);
        };
    }, [id, user?.id]);

    const checkIndependence = async () => {
        if (!id || !user?.id) return;
        setIsCheckingDeclaration(true);
        try {
            const decls = await auditApi.getIndependenceDeclarations({ auditId: id, userId: user?.id });
            if (decls && decls.length > 0) {
                setMyDeclaration(decls[0]);
            } else {
                setMyDeclaration(null);
            }
        } catch (error) {
            console.error('Error checking independence:', error);
        } finally {
            setIsCheckingDeclaration(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch audit by ID
            const audit = await auditApi.getAuditById(id);

            // Get Staff List for Team Selection
            try {
                const staffList = await auditApi.getStaff();
                setAllStaff(Array.isArray(staffList) ? staffList : []);
            } catch (e) { console.error('Staff fetch error', e); }

            if (audit) {
                setAuditData({
                    ...audit,
                    code: audit.auditCode || `D-${audit.id}`,
                    dates: `${formatDate(audit.startDate)} - ${formatDate(audit.endDate)}`,
                    progress: audit.progress || 0,
                });

                // Calculate business days
                calculateBusinessDays(audit.startDate, audit.endDate).then(d => setDuration(d));
                if (audit.actualStartDate) {
                    const end = audit.actualEndDate || new Date().toISOString();
                    calculateBusinessDays(audit.actualStartDate, end).then(d => setActualDuration(d));
                }

                // Parse team, workpapers, and attachments from JSON strings in DB
                // Parse team with safety check
                try {
                    setTeam(audit.team ? (typeof audit.team === 'string' ? JSON.parse(audit.team) : audit.team) : []);
                } catch (e) {
                    console.warn('Failed to parse team, using raw string as name', audit.team);
                    // Fallback for legacy data where team might be just a name string
                    if (typeof audit.team === 'string') {
                        setTeam([{ id: 'legacy', name: audit.team, role: 'Müfettiş', email: '', phone: '' }]);
                    } else {
                        setTeam([]);
                    }
                }

                // Parse others similarly
                try {
                    const wpFiles = await auditApi.getWorkpapers(id);
                    const wpArray = Array.isArray(wpFiles) ? wpFiles : [];
                    setWorkpapers(wpArray);
                    
                    const REPORT_CATEGORIES = ['Rapor Eki', 'Açılış Tutanağı', 'Kapanış Tutanağı', 'Bulgu Kanıtı', 'Nihai Rapor'];
                    const mapWp = (w: any) => ({
                        id: w.id,
                        name: w.title || w.filename || 'İsimsiz Dosya',
                        type: w.fileType || 'Dosya',
                        description: w.category || '',
                        uploadedBy: w.preparer?.displayName || w.preparer?.username || 'Sistem',
                        uploadedAt: (() => {
                            const dateStr = w.preparedAt || w.created_at || w.createdAt || w.updated_at || w.updatedAt;
                            if (!dateStr) return '-';
                            try {
                                const parts = String(dateStr).split('T')[0].split('-');
                                if (parts.length === 3) {
                                    return `${parts[2]}.${parts[1]}.${parts[0]}`;
                                }
                                return String(dateStr).split('T')[0];
                            } catch (e) {
                                return '-';
                            }
                        })(),
                        size: (() => {
                            const bytes = Number(w.size);
                            if (isNaN(bytes) || bytes <= 0) return 'Bilinmiyor';
                            if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                            return `${(bytes / 1024).toFixed(1)} KB`;
                        })(),
                        url: w.url || '',
                        _category: w.category || ''
                    });
                    const allMapped = wpArray.map(mapWp);
                    setAttachments(allMapped.filter(a => !REPORT_CATEGORIES.includes(a._category)));
                    setReportAttachments(allMapped.filter(a => REPORT_CATEGORIES.includes(a._category)));
                } catch (e) {
                    console.error('Workpaper parse error:', e);
                    setWorkpapers([]);
                    setAttachments([]);
                }

                // Set opinion
                setSelectedOpinion(audit.opinion || '');

                // Set findings
                setFindings(audit.findings || []);

                // Fetch communications and meetings
                try {
                    const comms = await auditApi.getAuditCommunications(id);
                    setCommunications(Array.isArray(comms) ? comms : []);
                    const mtgs = await auditApi.getAuditMeetings(id);
                    setMeetings(Array.isArray(mtgs) ? mtgs : []);
                } catch (e) {
                    console.error('Failed to load communications/meetings:', e);
                }
            }

            // Fetch logs for this audit from specific history endpoint to include findings, workpapers, etc.
            const historyLogs = await auditApi.getAuditHistory(id as string);
            setAuditLogs(Array.isArray(historyLogs) ? historyLogs : []);

        } catch (error) {
            console.error('Load error:', error);
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkIndependenceStatus = async (audit: any) => {
        if (!audit || !user?.id) return;
        const isTeamMember = 
            audit.ownerId === user.id || 
            audit.supervisorId === user.id ||
            (typeof audit.team === 'string' && audit.team.includes(user.id));

        setIsAssignedToAudit(!!isTeamMember);
    };


    // Add audit log entry
    const addLog = async (action: string, details: string) => {
        try {
            const newLog = await auditApi.createLog({
                action,
                user: user?.displayName || user?.username || 'Bilinmeyen Kullanıcı',
                details,
                targetType: 'Audit',
                targetId: id
            });
            setAuditLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error('Log error:', error);
        }
    };

    // Role check removed from here, unified at top


    // HANDLERS
    const handleDeleteAudit = async () => {
        setDeleteTargetType('AUDIT');
        setDeleteTargetItem(auditData);
        setShowDeleteRequestModal(true);
    };

    const confirmDeleteAudit = async () => {
        try {
            await auditApi.deleteAudit(id);
            showToast('Denetim başarıyla silindi', 'success');
            router.push('/audit/audits');
        } catch (error) {
            console.error(error);
            showToast('Denetim silinirken hata oluştu', 'error');
        }
    };

    const handleExport = () => {
        if (!auditData) return;
        exportAuditToPdf(auditData, findings);
        showToast('Rapor oluşturuldu', 'success');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && auditData) {
            try {
                showToast(`${file.name} yükleniyor...`, 'info');

                await auditApi.uploadWorkpaper(id, file, 'Genel');
                loadData();

                addLog('Dosya Yüklendi', `${file.name} yüklendi.`);
                showToast(`${file.name} başarıyla yüklendi`, 'success');
            } catch (error) {
                console.error(error);
                showToast('Dosya yüklenirken hata oluştu', 'error');
            }
        }
    };

    const handleDownloadWorkpaper = async (wp: any) => {
        try {
            showToast('Dosya indiriliyor...', 'info');
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/audit/workpapers/${wp.id}/download`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) throw new Error('Dosya indirilemedi');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = wp.filename || wp.title || 'indirilen_dosya';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Dosya başarıyla indirildi', 'success');
        } catch (e) {
            console.error('Download error:', e);
            showToast('Dosya indirme başarısız', 'error');
        }
    };

    const handleDeleteWorkpaper = (wp: Workpaper) => {
        setConfirmation({
            isOpen: true,
            type: 'DELETE_WORKPAPER',
            data: wp,
            title: 'Çalışma Kağıdı Sil',
            message: 'Bu çalışma kağıdını silmek istediğinize emin misiniz?'
        });
    };

    const confirmDeleteWorkpaper = async (wp: Workpaper) => {
        try {
            await auditApi.deleteWorkpaper(wp.id);
            addLog('Dosya Silindi', `${wp.title || wp.filename || 'Dosya'} silindi.`);
            showToast(`${wp.title || wp.filename || 'Dosya'} silindi`, 'success');
            loadData();
        } catch (error) {
            showToast('Dosya silinirken hata oluştu', 'error');
        }
    };

    const handleEditFinding = (finding: any) => {
        setSelectedFinding(finding);
        setShowFindingModal(true);
    };

    const handleDeleteFinding = (finding: Finding) => {
        setDeleteTargetType('FINDING');
        setDeleteTargetItem(finding);
        setShowDeleteRequestModal(true);
    };

    const confirmDeleteFinding = async (finding: Finding) => {
        try {
            await auditApi.deleteFinding(String(finding.id));
            setFindings(prev => prev.filter(f => f.id !== finding.id));
            addLog('Bulgu Silindi', `${finding.id} numaralı bulgu silindi.`);
            showToast('Bulgu başarıyla silindi', 'success');
        } catch (error) {
            showToast('Bulgu silinirken hata oluştu', 'error');
        }
    };

    // Denetim Görüşü Kaydet
    const handleNotifyClick = async (finding: Finding) => {
        try {
            await auditApi.updateFindingStatus(String(finding.id), 'Tebliğ Edildi');
            setAuditData((prev: any) => ({
                ...prev,
                findings: prev.findings?.map((f: Finding) => f.id === finding.id ? { ...f, status: 'Tebliğ Edildi' } : f)
            }));
            showToast('Bulgu ilgili birime tebliğ edildi.', 'success');
        } catch (error) {
            console.error('Failed to notify:', error);
            showToast('Tebliğ işlemi başarısız oldu.', 'error');
        }
    };

    const handleDeleteMeeting = async (meeting: any) => {
        if (!confirm('Bu toplantıyı silmek istediğinize emin misiniz?')) return;
        try {
            await auditApi.deleteAuditMeeting(id, meeting.id);
            setMeetings(prev => prev.filter(m => m.id !== meeting.id));
            showToast('Toplantı kaydı silindi.', 'success');
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            showToast('Toplantı silinirken bir hata oluştu.', 'error');
        }
    };

    const handleSaveOpinion = async () => {
        if (!selectedOpinion) {
            showToast('Lütfen bir görüş türü seçiniz', 'warning');
            return;
        }
        try {
            await auditApi.updateAudit(id, { opinion: selectedOpinion });
            setAuditData((prev: any) => ({ ...prev, opinion: selectedOpinion }));
            addLog('Görüş Kaydedildi', `Denetim görüşü "${selectedOpinion}" olarak belirlendi.`);
            showToast('Denetim görüşü başarıyla kaydedildi', 'success');
        } catch (error) {
            console.error('Opinion save error:', error);
            showToast('Görüş kaydedilirken hata oluştu', 'error');
        }
    };

    const handleUpdateStatus = async (finding: Finding, newStatus: string) => {
        try {
            // Optimistic update
            const updatedFinding = { ...finding, status: newStatus };

            // API Call
            await auditApi.updateFinding(String(finding.id), { status: newStatus });

            // State Update
            setFindings(prev => prev.map(f => f.id === finding.id ? updatedFinding : f));

            addLog('Bulgu Durum Güncellemesi', `${finding.code} kodlu bulgunun durumu ${newStatus} olarak güncellendi.`);
            showToast(`Durum güncellendi: ${newStatus}`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Durum güncellenirken hata oluştu', 'error');
            // Revert optimistic update if needed (omitted for brevity but recommended)
        }
    };

    const handleAddTeamMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedStaffIds.length === 0) {
                showToast('Lütfen en az bir personel seçiniz', 'warning');
                return;
            }

            const newMembers: TeamMember[] = [];
            for (const staffId of selectedStaffIds) {
                // Check if already in team
                if (team.some(m => m.id === staffId)) continue;

                const staff = allStaff.find(s => s.id === staffId);
                if (staff) {
                    newMembers.push({
                        id: staff.id, // Use staff ID as member ID for consistency
                        name: staff.name,
                        role: commonRole,
                        email: staff.email,
                        phone: staff.phone
                    });
                }
            }

            if (newMembers.length === 0) {
                showToast('Seçilen personel zaten ekipte mevcut', 'warning');
                return;
            }

            const updatedTeam = [...team, ...newMembers];

            await auditApi.updateAudit(id, {
                team: JSON.stringify(updatedTeam)
            });

            setTeam(updatedTeam);
            loadData(); // Optional, but good for sync
            setShowTeamModal(false);
            setSelectedStaffIds([]);
            setCommonRole('Müfettiş');
            showToast(`${newMembers.length} ekip üyesi başarıyla eklendi`, 'success');

            // Log activity
            newMembers.forEach(m => {
                addLog('Ekip Üyesi Eklendi', `${m.name} (${m.role}) ekibe eklendi.`);
            });

        } catch (error) {
            console.error('Failed to add team members:', error);
            showToast('Ekip üyeleri eklenirken hata oluştu', 'error');
        }
    };

    const handleRemoveMember = (member: TeamMember) => {
        setConfirmation({
            isOpen: true,
            type: 'REMOVE_TEAM_MEMBER',
            data: member,
            title: 'Ekip Üyesini Kaldır',
            message: `${member.name} isimli personeli denetim ekibinden kaldırmak istediğinize emin misiniz?`
        });
    };

    const confirmRemoveMember = async (member: TeamMember) => {
        try {
            const updatedTeam = team.filter(m => m.id !== member.id);
            await auditApi.updateAudit(id, {
                team: JSON.stringify(updatedTeam)
            });

            setTeam(updatedTeam);
            addLog('Ekip Üyesi Çıkarıldı', `${member.name} ekipten çıkarıldı.`);
            showToast(`${member.name} ekipten çıkarıldı`, 'info');
        } catch (error) {
            showToast('Üye çıkarılırken hata oluştu', 'error');
        }
    };

    const handleViewFinding = async (finding: Finding) => {
        try {
            const fullFinding = await auditApi.getFinding(String(finding.id));
            setSelectedFinding(fullFinding || finding);
        } catch (e) {
            setSelectedFinding(finding);
        } finally {
            setShowViewFindingModal(true);
        }
    };

    const handleCompleteAudit = async () => {
        try {
            await auditApi.updateAudit(id, { status: 'Tamamlandı', endDate: new Date().toISOString().split('T')[0] });
            setAuditData((prev: any) => prev ? { ...prev, status: 'Tamamlandı' } : null);
            addLog('Denetim Tamamlandı', 'Denetim denetim işlemleri ve raporlama süreci tamamlandı.');
            setShowCompleteConfirm(false);
            showToast('Denetim başarıyla tamamlandı', 'success');
        } catch (error) {
            showToast('Denetim tamamlanırken hata oluştu', 'error');
        }
    };

    // Status Workflow Handler
    const handleStatusUpdate = async (newStatus: string) => {
        if (!auditData) return;

        // Mesleki etik ve bağımsızlık beyanı gateway kontrolü
        // Denetim "Devam Ediyor"ya geçişte ekip üyelerinin bağımsızlık beyanı zorunludur
        if (newStatus === 'Devam Ediyor' && isAssignedToAudit && !myDeclaration) {
            showToast(
                'Denetimi başlatmadan önce bağımsızlık beyanınızı tamamlamanız gerekmektedir.',
                'warning'
            );
            return;
        }

        try {
            const updatePayload: any = { status: newStatus };
            const now = new Date();

            // Automatic Progress and Date Logic
            if (newStatus === 'Taslak') {
                updatePayload.progress = 0;
            } else if (newStatus === 'Planlandı') {
                updatePayload.progress = 25;
            } else if (newStatus === 'Devam Ediyor') {
                updatePayload.progress = 50;
                // Only set actualStartDate if not already set (or overwrite if desired)
                if (!auditData.actualStartDate) {
                    updatePayload.actualStartDate = now.toISOString();
                }
            } else if (newStatus === 'Gözden Geçirme') {
                updatePayload.progress = 75;
            } else if (newStatus === 'Tamamlandı') {
                updatePayload.progress = 100;
                updatePayload.actualEndDate = now.toISOString();
                // Ensure start date is set if missed
                if (!auditData.actualStartDate) {
                    updatePayload.actualStartDate = auditData.plannedStartDate || now.toISOString();
                }
            }

            await auditApi.updateAudit(id, updatePayload);
            const oldStatus = auditData.status;

            setAuditData((prev: any) => prev ? {
                ...prev,
                ...updatePayload,
                status: newStatus
            } : null);

            addLog('Denetim Durumu Güncellendi', `Durum ${oldStatus} -> ${newStatus} olarak güncellendi. İlerleme: %${updatePayload.progress || 0}`);
            showToast(`Denetim durumu "${newStatus}" olarak güncellendi`, 'success');
        } catch (error) {
            showToast('Durum güncellenirken hata oluştu', 'error');
        }
    };

    // Upload Final Report
    const handleUploadFinalReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auditData || !finalReportFile) return;

        try {
            const formData = new FormData();
            formData.append('file', finalReportFile);
            formData.append('type', 'final_report');

            await auditApi.uploadWorkpaper(id, finalReportFile);

            const finalReport = {
                fileName: finalReportFile.name,
                uploadedAt: new Date().toISOString(),
                path: `/uploads/audits/${id}/${finalReportFile.name}`
            };

            await auditApi.updateAudit(id, { finalReport: JSON.stringify(finalReport) });

            addLog('İmzalı Rapor Yüklendi', `İmzalı rapor yüklendi: ${finalReportFile.name}`);
            showToast('İmzalı rapor başarıyla yüklendi', 'success');
            setShowUploadFinalModal(false);
            setFinalReportFile(null);
            loadData();
        } catch (error) {
            showToast('Rapor yüklenirken hata oluştu', 'error');
        }
    };

    // Add Attachment
    const handleAddAttachment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auditData || !newAttachment.file) return;

        try {
            const category = newAttachment.description ? `Ek: ${newAttachment.description}` : 'Genel';
            await auditApi.uploadWorkpaper(id, newAttachment.file, category);

            addLog('Çalışma Kâğıdı Yüklendi', `${newAttachment.file.name} dosyası eklendi.`);
            showToast('Çalışma kâğıdı yüklendi', 'success');
            setShowAttachmentModal(false);
            setNewAttachment({ name: '', description: '', file: null });
            loadData();
        } catch (error) {
            showToast('Dosya yüklenirken hata oluştu', 'error');
        }
    };

    // Add Report Attachment
    const handleAddReportAttachment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auditData || !newReportAttachment.file) return;

        try {
            await auditApi.uploadWorkpaper(id, newReportAttachment.file, newReportAttachment.category);

            addLog('Rapor Eki Yüklendi', `${newReportAttachment.file.name} dosyası rapor eki olarak eklendi.`);
            showToast('Rapor eki yüklendi', 'success');
            setShowReportAttachmentModal(false);
            setNewReportAttachment({ name: '', description: '', file: null, category: 'Açılış Tutanağı' });
            loadData();
        } catch (error) {
            showToast('Rapor eki yüklenirken hata oluştu', 'error');
        }
    };

    // Delete Attachment
    const handleDeleteAttachment = (att: Attachment) => {
        setConfirmation({
            isOpen: true,
            type: 'DELETE_ATTACHMENT',
            data: att,
            title: 'Çalışma Kâğıdını Sil',
            message: 'Bu çalışma kâğıdını silmek istediğinize emin misiniz?'
        });
    };

    const confirmDeleteAttachment = async (att: Attachment) => {
        try {
            await auditApi.deleteWorkpaper(att.id);
            addLog('Çalışma Kâğıdı Silindi', `${att.name} dosyası silindi.`);
            showToast(`${att.name} silindi`, 'success');
            loadData(); // Gerçek veriyi veritabanından yenile
        } catch (error) {
            showToast('Ek silinirken hata oluştu', 'error');
        }
    };

    // Generate PDF Report
    const handleGeneratePDF = async () => {
        if (!auditData) return;
        try {
            exportAuditToPdf(auditData, findings);
            showToast('PDF rapor oluşturuldu', 'success');
        } catch (error) {
            showToast('PDF oluşturulurken hata oluştu', 'error');
        }
    };

    // Word Raporu Oluştur (Kurumsal Şablon)
    const handleGenerateWord = async () => {
        if (!auditData) return;
        try {
            showToast('Word raporu oluşturuluyor...', 'info');
            const response = await auditApi.generateWordReport(id);
            if (response && response.id) {
                const blob = await auditApi.downloadReport(response.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = response.filePath || `Rapor_${auditData.code}.docx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
            showToast('Word (.docx) rapor indirildi. Ayrıca Raporlar geçmişinde de bulabilirsiniz.', 'success');
        } catch (error) {
            console.error('Word report error:', error);
            showToast('Word raporu oluşturulurken hata oluştu', 'error');
        }
    };

    // Get workflow action buttons based on current status
    const getWorkflowActions = () => {
        if (!auditData) return null;

        switch (auditData.status) {
            case 'Taslak':
                return (
                    <Button onClick={() => handleStatusUpdate('Planlandı')}>
                        <Calendar size={18} /> Planlamaya Al
                    </Button>
                );
            case 'Planlandı':
                return (
                    <Button onClick={() => handleStatusUpdate('Devam Ediyor')}>
                        <CheckCircle size={18} /> Denetimi Başlat
                    </Button>
                );
            case 'Devam Ediyor':
                return (
                    <Button onClick={() => handleStatusUpdate('Gözden Geçirme')}>
                        <Send size={18} /> Gözden Geçirmeye Gönder
                    </Button>
                );
            case 'Gözden Geçirme':
                return (
                    <div className="flex gap-2">
                        <Button variant="danger" onClick={() => handleStatusUpdate('Devam Ediyor')}>
                            <RotateCcw size={18} />
                        </Button>
                        <Button onClick={() => handleStatusUpdate('Tamamlandı')}>
                            <Check size={18} /> Onayla ve Tamamla
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    // Finding Status Update (Separate handler to avoid conflict)
    const handleFindingStatusUpdate = async (finding: Finding, newStatus: string) => {
        try {
            await auditApi.updateFindingStatus(String(finding.id), newStatus);
            setAuditData((prev: any) => {
                if (!prev) return null;
                return {
                    ...prev,
                    findings: prev.findings?.map((f: Finding) => f.id === finding.id ? { ...f, status: newStatus } : f)
                };
            });
            showToast(`Bulgu durumu güncellendi: ${newStatus}`, 'success');
        } catch (error) {
            console.error('Finding status update failed:', error);
            showToast('Bulgu durumu güncellenemedi', 'error');
        }
    };

    // Unified Confirm Handler
    const handleConfirmAction = async () => {
        const { type, data } = confirmation;
        if (!type) return;

        // Execute action based on type
        switch (type) {
            case 'DELETE_AUDIT': await confirmDeleteAudit(); break;
            case 'DELETE_FINDING': await confirmDeleteFinding(data); break;
            case 'DELETE_WORKPAPER': await confirmDeleteWorkpaper(data); break;
            case 'DELETE_ATTACHMENT': await confirmDeleteAttachment(data); break;
            case 'REMOVE_TEAM_MEMBER': await confirmRemoveMember(data); break;
        }

        // Reset state
        // Reset state
        setConfirmation({ isOpen: false, type: null, data: null, title: '', message: '' });
    };

    const handleDeleteRequestConfirm = async (reason: string, comment: string) => {
        try {
            if (deleteTargetType === 'AUDIT') {
                const res = await auditApi.deleteAudit(id, reason, comment);
                showToast(res.message || 'İşlem başarılı', 'success');

                // If the response indicates success but it wasn't a direct delete, just refresh status
                if (res.message?.includes('Onay') || res.message?.includes('onay')) {
                    loadData(); // Refresh to see new status
                } else if (canDelete) {
                    // Manager deleted it directly
                    router.push('/audit/audits');
                }
            } else {
                // Finding
                const res = await auditApi.deleteFinding(String(deleteTargetItem.id), reason, comment);
                showToast(res.message || 'İşlem başarılı', 'success');

                // If it's a request, update the status in local state instead of removing
                if (res.message?.includes('Onay') || res.message?.includes('onay')) {
                    setFindings(prev => prev.map(f =>
                        f.id === deleteTargetItem.id
                            ? { ...f, status: 'Silinme Onayı Bekliyor' }
                            : f
                    ));
                    // Also refresh all audit data to be sure
                    loadData();
                } else {
                    // Actual deletion (Admin case)
                    setFindings(prev => prev.filter(f => f.id !== deleteTargetItem.id));
                }
            }
        } catch (error) {
            console.error('Delete request failed:', error);
            showToast('İşlem başarısız oldu', 'error');
        } finally {
            setShowDeleteRequestModal(false);
        }
    };

    const handleRestoreAudit = async () => {
        try {
            await auditApi.restoreAudit(id);
            showToast('Denetim başarıyla geri yüklendi', 'success');
            loadData();
        } catch (error) {
            showToast('Geri yükleme başarısız oldu', 'error');
        }
    };

    const handleCreateCommunication = async (data: any) => {
        try {
            if (editingCommunication) {
                await auditApi.updateAuditCommunication(id as string, editingCommunication.id, data);
                addLog('İletişim Güncellendi', 'Bir iletişim kaydı güncellendi.');
                showToast('İletişim başarıyla güncellendi', 'success');
            } else {
                await auditApi.createAuditCommunication(id as string, data);
                addLog('İletişim Kaydı', 'Yeni bir iletişim kaydı oluşturuldu.');
                showToast('İletişim başarıyla oluşturuldu', 'success');
            }
            const comms = await auditApi.getAuditCommunications(id as string);
            setCommunications(Array.isArray(comms) ? comms : []);
            setShowComposeModal(false);
            setEditingCommunication(null);
        } catch (error: any) {
            console.error('Failed to create/update communication:', error);
            showToast(error.message || 'İletişim oluşturulurken hata oluştu', 'error');
        }
    };

    const handleDeleteCommunication = async (comm: any) => {
        if (!confirm('Bu iletişim kaydını(taslak) silmek istediğinize emin misiniz?')) return;
        try {
            await auditApi.deleteAuditCommunication(id as string, comm.id);
            addLog('İletişim Silindi', 'Bir taslak iletişim başarıyla silindi.');
            showToast('İletişim başarıyla silindi', 'success');
            const comms = await auditApi.getAuditCommunications(id as string);
            setCommunications(Array.isArray(comms) ? comms : []);
        } catch (error) {
            showToast('İletişim silinirken hata oluştu', 'error');
        }
    };

    const handleCreateMeeting = async (data: any) => {
        try {
            await auditApi.createAuditMeeting(id, data);
            addLog('Toplantı Kaydı', 'Yeni bir toplantı kaydı oluşturuldu.');
            showToast('Toplantı tutanağı başarıyla oluşturuldu', 'success');
            const mtgs = await auditApi.getAuditMeetings(id);
            setMeetings(Array.isArray(mtgs) ? mtgs : []);
            setShowMeetingModal(false);
        } catch (error: any) {
            console.error('Failed to create meeting:', error);
            showToast(error.message || 'Toplantı oluşturulurken hata oluştu', 'error');
        }
    };


    if (loading) return <LoadingState />;
    if (!auditData) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
            <AlertCircle size={48} className="mb-4 text-slate-300" />
            <p className="text-lg">Denetim bulunamadı veya yetkiniz yok.</p>
            <BackButton href="/audit/audits" label="Denetimler Listesine Dön" className="mt-4" />
        </div>
    );

    // Filter audits that are "Deleted" status - show a banner
    const isDeleted = auditData.status === 'Silindi' || auditData.status === 'Silinme Onayı Bekliyor';

    // Role, Confidentiality & Independence Logic (IIA 1100 & Audit Confidentiality)
    const isSupervisor = checkRole(hasRole, ROLES.AUDIT_SUPERVISOR);
    const isTeamMember = isSupervisor || team.some((t: any) => t.id === user?.id || t.userId === user?.id || t.name === user?.displayName);
    const hasIndependence = !!myDeclaration;

    // Is the user restricted from viewing sensitive tabs?
    const restrictConfidentiality = !isTeamMember;
    const restrictIndependence = !hasIndependence && isTeamMember && !isSupervisor; // Only active team members must declare independence to perform fieldwork

    const isSensitiveTabBlocked = restrictConfidentiality || restrictIndependence;
    const blockedReason = restrictConfidentiality 
        ? "Denetim Ekibinde Değilsiniz (Gizlilik)" 
        : "Bağımsızlık Beyanı İmzalanmadı";

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <AuditDetailHeader
                auditData={auditData}
                backUrl={backUrl}
                isDeleted={isDeleted}
                canDelete={canDelete}
                onEdit={() => setShowEditAuditModal(true)}
                onExport={handleExport}
                onDelete={handleDeleteAudit}
                onRestore={handleRestoreAudit}
            />

            {/* Workflow Stepper */}
            {!isDeleted && (
                <AuditWorkflowStepper
                    currentStatus={auditData.status}
                    workflowSteps={workflowSteps}
                />
            )}

            {/* Information Grid */}
            <AuditInformationGrid 
                auditData={auditData} 
                duration={duration} 
                actualDuration={actualDuration}
                team={team}
                progress={auditData.progress || 0}
                allStaff={allStaff}
            />

            {/* Main Tabs Segmented UI */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                    <SegmentedTabs
                        tabs={[
                            { id: 'overview', label: 'Genel Bakış', icon: Activity },
                            { id: 'team_timesheet', label: 'Denetim Ekibi ve Efor', icon: Users },
                            { id: 'planning', label: 'Planlama ve Kapsam', icon: ClipboardCheck, disabled: isSensitiveTabBlocked, disabledTooltip: blockedReason },
                            { id: 'field_work', label: 'Saha Çalışması', icon: PenTool, disabled: isSensitiveTabBlocked, disabledTooltip: blockedReason },
                            { id: 'attachments', label: 'Çalışma Kâğıtları', icon: Paperclip, disabled: isSensitiveTabBlocked, disabledTooltip: blockedReason },
                            { id: 'report_attachments', label: 'Rapor Ekleri', icon: FileText, disabled: isSensitiveTabBlocked, disabledTooltip: blockedReason },
                            { id: 'findings', label: 'Bulgu ve Aksiyonlar', icon: AlertCircle, disabled: isSensitiveTabBlocked, disabledTooltip: blockedReason },
                            { id: 'communications', label: 'İletişim ve Toplantılar', icon: MessageSquare },
                            { id: 'report', label: 'Sonuç & Rapor', icon: FileText, disabled: restrictConfidentiality, disabledTooltip: "Denetim Ekibinde Değilsiniz" },
                            { id: 'history', label: 'Süreç Geçmişi', icon: HistoryIcon, disabled: restrictConfidentiality, disabledTooltip: "Denetim Ekibinde Değilsiniz" },
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Side: Summary & Scope */}
                            <div className="lg:col-span-8 flex flex-col gap-8">
                                <AuditOverviewTab 
                                    auditData={auditData} 
                                    findings={findings}
                                    progress={auditData.progress || 0}
                                />
                            </div>

                            {/* Right Side: Independence & Quick Stats */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <IndependenceQuickPanel
                                    auditId={id}
                                    userId={user?.id || ''}
                                    onDeclared={() => {
                                        checkIndependence();
                                        loadData();
                                    }}
                                    isDeclared={!!myDeclaration}
                                />

                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Activity size={18} className="text-blue-600" />
                                        Denetim Özeti
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Planlanan Süre</span>
                                            <span className="font-medium">{duration} İş Günü</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Kritik Bulgular</span>
                                            <span className="font-medium text-red-600">
                                                {findings.filter(f => f.riskLevel === 'Kritik' || f.riskLevel === 'Yüksek').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Tamamlanan Aksiyonlar</span>
                                            <span className="font-medium text-green-600">
                                                {findings.filter(f => ['Kapalı', 'Kapalı (Mutabık Değil)', 'Tamamlandı', 'Risk Kabul Edildi'].includes(f.status)).length} / {findings.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'findings' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AuditFindingsTab
                            findings={findings}
                            loading={loading}
                            canDelete={canDelete}
                            onAddFinding={() => { setSelectedFinding(null); setShowFindingModal(true); }}
                            onEditFinding={handleEditFinding}
                            onViewFinding={handleViewFinding}
                            onDeleteFinding={handleDeleteFinding}
                            onStatusUpdate={handleFindingStatusUpdate}
                            onNotify={handleNotifyClick}
                        />
                        </div>
                    )}

                    {activeTab === 'field_work' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TestSteps
                                auditId={id as string}
                                unitId={auditData.unitId || auditData.auditableUnitId || ''}
                                onProgressUpdate={async () => {
                                    // Saha çalışması ilerlemesini gerçek test verisiyle güncelle
                                    try {
                                        const tests = await auditApi.getAuditTests(id);
                                        if (tests && tests.length > 0) {
                                            const completed = tests.filter((t: any) => t.status === 'Tamamlandı').length;
                                            const progressPercent = Math.round((completed / tests.length) * 50) + 25; // 25-75 arası (Planlandı sonrası)
                                            const clampedProgress = Math.min(progressPercent, 75); // Gözden Geçirme'den önce max 75
                                            if (auditData.status === 'Devam Ediyor' && clampedProgress !== auditData.progress) {
                                                await auditApi.updateAudit(id, { progress: clampedProgress });
                                                setAuditData((prev: any) => prev ? { ...prev, progress: clampedProgress } : prev);
                                            }
                                        }
                                    } catch (e) { console.error('Progress update error:', e); }
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'attachments' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AuditAttachmentsTab
                            attachments={attachments}
                            onAddAttachment={() => setShowAttachmentModal(true)}
                            onDeleteAttachment={handleDeleteAttachment}
                            onDownloadAttachment={handleDownloadWorkpaper}
                        />
                        </div>
                    )}

                    {activeTab === 'report_attachments' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AuditAttachmentsTab
                                attachments={reportAttachments}
                                onAddAttachment={() => setShowReportAttachmentModal(true)}
                                onDeleteAttachment={handleDeleteAttachment}
                                onDownloadAttachment={handleDownloadWorkpaper}
                                title="Rapor Ekleri"
                                isReportTab={true}
                                emptyTitle="Rapor Eki Bulunamadı"
                                emptyDescription="Açılış/Kapanış tutanakları, bulgu kanıtları ve nihai rapor belgelerini buradan yönetebilirsiniz."
                            />
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {auditData.type === 'Soruşturma' || auditData.type === 'İnceleme' ? (
                                 <InvestigationReportSection
                                     status={auditData.status}
                                     auditId={id}
                                     auditData={auditData}
                                     allStaff={allStaff}
                                 />
                             ) : auditData.status === 'Gözden Geçirme' || auditData.status === 'Tamamlandı' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <AuditOpinionSection
                                            selectedOpinion={selectedOpinion}
                                            opinionOptions={opinionOptions}
                                            setSelectedOpinion={setSelectedOpinion}
                                            onSaveOpinion={handleSaveOpinion}
                                            currentSavedOpinion={auditData.opinion || ''}
                                        />

                                        <AuditReportSection
                                            status={auditData.status}
                                            auditData={auditData}
                                            onGeneratePDF={handleGeneratePDF}
                                            onGenerateWord={handleGenerateWord}
                                            onShowUploadFinalModal={() => setShowUploadFinalModal(true)}
                                        />
                                    </div>
                                ) : (
                                    <div className="max-w-lg mx-auto bg-gray-50 border border-gray-200 border-dashed rounded-lg p-10 flex flex-col items-center text-center gap-3">
                                        <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100 mb-1">
                                            <Shield size={28} className="text-gray-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold text-gray-800">Sonuç ve Raporlama Bekleniyor</h3>
                                            <p className="text-gray-500 text-xs max-w-md">
                                                Denetim görüşü ve resmi rapor üretme özellikleri, denetim <span className="font-medium text-gray-700">"Gözden Geçirme"</span> aşamasına geçtiğinde aktif hale gelecektir.
                                            </p>
                                        </div>
                                        <div className="mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded border border-gray-200">
                                            BEKLEMEDE
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    {activeTab === 'planning' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AuditPlanningTab auditData={auditData} />
                        </div>
                    )}

                    {activeTab === 'team_timesheet' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AuditTeamTab
                                team={team}
                                onAddMember={() => setShowTeamModal(true)}
                                onRemoveMember={handleRemoveMember}
                                canManageTeam={isSupervisor}
                            />
                            <div className="border-t border-slate-200 mt-2 pt-6">
                                <AuditTimesheetTab auditId={id as string} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'communications' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CommunicationTimeline 
                                communications={communications} 
                                meetings={meetings} 
                                onNewCommunication={() => { setEditingCommunication(null); setShowComposeModal(true); }}
                                onNewMeeting={() => { setEditingMeeting(null); setShowMeetingModal(true); }}
                                onEditCommunication={(comm) => { setEditingCommunication(comm); setShowComposeModal(true); }}
                                onDeleteCommunication={handleDeleteCommunication}
                                onEditMeeting={(meeting) => { setEditingMeeting(meeting); setShowMeetingModal(true); }}
                                onDeleteMeeting={handleDeleteMeeting}
                            />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <AuditHistoryTab auditLogs={auditLogs} />
                    )}
                </div>
            </div>


            {/* MODALS */}

            {/* Finding Modal */}
            {showFindingModal && (
                <CreateFindingModal
                    isOpen={showFindingModal}
                    onClose={() => setShowFindingModal(false)}
                    onSuccess={(newFinding) => {
                        if (selectedFinding) {
                            setFindings(prev => prev.map(f => f.id === newFinding.id ? newFinding : f));
                            addLog('Bulgu Güncellendi', `${newFinding.code} kodlu bulgu bilgileri güncellendi.`);
                        } else {
                            setFindings(prev => [newFinding, ...prev]);
                            addLog('Bulgu Eklendi', `${newFinding.code} kodlu yeni bir bulgu kaydı oluşturuldu.`);
                        }
                        setShowFindingModal(false);
                        setSelectedFinding(null);
                    }}
                    preSelectedAuditId={id}
                    initialFinding={selectedFinding}
                />
            )}

            {/* View Finding Modal */}
            {showViewFindingModal && selectedFinding && (
                <FindingDetailModal
                    isOpen={showViewFindingModal}
                    onClose={() => setShowViewFindingModal(false)}
                    finding={selectedFinding}
                />
            )}

            {/* Team Management Modal */}
            <Modal
                isOpen={showTeamModal}
                onClose={() => setShowTeamModal(false)}
                title="Ekip Üyesi Ekle"
                size="lg"
                footer={
                    <div className="w-full flex justify-end gap-3">
                        <Button variant="secondary" className="min-w-[120px]" onClick={() => setShowTeamModal(false)}>İptal</Button>
                        <Button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleAddTeamMember(new Event('submit') as any);
                            }} 
                            variant="primary" 
                            className="min-w-[160px] shadow-lg shadow-primary/20"
                            disabled={selectedStaffIds.length === 0}
                        >
                            Ekibe Ekle ({selectedStaffIds.length})
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Personel Seç</label>
                        <StaffMultiSelect
                            staffList={allStaff}
                            selectedIds={selectedStaffIds}
                            onChange={setSelectedStaffIds}
                            placeholder="Personel ara ve seç..."
                        />
                        <p className="text-xs text-gray-500 italic">Birden fazla personel seçerek toplu ekleme yapabilirsiniz.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Denetim Rolü</label>
                        <div className="flex flex-wrap gap-2">
                            {['Müdür', 'Başmüfettiş', 'Kıdemli Müfettiş', 'Müfettiş', 'Yetkili Müfettiş Yardımcısı', 'Müfettiş Yardımcısı'].map(role => (
                                <Button
                                    key={role}
                                    type="button"
                                    variant={commonRole === role ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setCommonRole(role)}
                                >
                                    {role}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Standard Confirmation Modal */}
            {confirmation.isOpen && (
                <ConfirmModal
                    isOpen={confirmation.isOpen}
                    title={confirmation.title}
                    message={confirmation.message}
                    onConfirm={handleConfirmAction}
                    onClose={() => setConfirmation({ isOpen: false, type: null, data: null, title: '', message: '' })}
                    confirmText={confirmation.type?.startsWith('DELETE_') ? 'Sil' : confirmation.type === 'REMOVE_TEAM_MEMBER' ? 'Kaldır' : 'Devam Et'}
                    type={confirmation.type?.startsWith('DELETE_') || confirmation.type === 'REMOVE_TEAM_MEMBER' ? 'danger' : 'info'}
                />
            )}

            {/* Attachment Modal */}
            <Modal
                isOpen={showAttachmentModal}
                onClose={() => setShowAttachmentModal(false)}
                title="Yeni Ek Ekle"
                size="md"
                footer={
                    <div className="w-full flex justify-end gap-3">
                        <Button variant="secondary" className="min-w-[120px]" onClick={() => setShowAttachmentModal(false)}>İptal</Button>
                        <Button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleAddAttachment(new Event('submit') as any);
                            }} 
                            variant="primary" 
                            className="min-w-[160px] shadow-lg shadow-primary/20"
                            disabled={!newAttachment.file}
                        >
                            Dosyayı Yükle
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="form-label">Dosya Adı / Başlık</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: Açılış Tutanağı"
                            value={newAttachment.name}
                            onChange={e => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="form-label">Açıklama</label>
                        <textarea
                            className="form-input resize-none"
                            rows={3}
                            placeholder="Dosya içeriği hakkında kısa bilgi..."
                            value={newAttachment.description}
                            onChange={e => setNewAttachment(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="form-label">Dosya Seçimi</label>
                        <FileUpload 
                            multiple={false}
                            onFileSelect={(files) => setNewAttachment(prev => ({ ...prev, file: files?.[0] || null }))}
                            description="Dosyayı buraya sürükleyin"
                        />
                    </div>
                </div>
            </Modal>

            {/* Report Attachment Upload Modal */}
            <Modal
                isOpen={showReportAttachmentModal}
                onClose={() => setShowReportAttachmentModal(false)}
                title="Yeni Rapor Eki Ekle"
                size="md"
                footer={
                    <div className="w-full flex justify-end gap-3">
                        <Button variant="secondary" className="min-w-[120px]" onClick={() => setShowReportAttachmentModal(false)}>İptal</Button>
                        <Button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleAddReportAttachment(new Event('submit') as any);
                            }} 
                            variant="primary" 
                            className="min-w-[160px] shadow-lg shadow-primary/20"
                            disabled={!newReportAttachment.file}
                        >
                            Rapor Ekini Yükle
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="form-label">Ek Kategorisi *</label>
                        <CustomSelect
                            value={newReportAttachment.category}
                            onChange={(val) => setNewReportAttachment(prev => ({ ...prev, category: val as string }))}
                            options={[
                                { value: 'Açılış Tutanağı', label: 'Açılış Tutanağı' },
                                { value: 'Kapanış Tutanağı', label: 'Kapanış Tutanağı' },
                                { value: 'Bulgu Kanıtı', label: 'Bulgu Kanıtı' },
                                { value: 'Nihai Rapor', label: 'Nihai Rapor' },
                                { value: 'Rapor Eki', label: 'Diğer Rapor Eki' },
                            ]}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="form-label">Açıklama</label>
                        <textarea
                            className="form-input resize-none"
                            rows={2}
                            placeholder="Ek hakkında kısa bilgi (opsiyonel)..."
                            value={newReportAttachment.description}
                            onChange={e => setNewReportAttachment(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="form-label">Dosya Seçimi</label>
                        <FileUpload 
                            multiple={false}
                            onFileSelect={(files) => setNewReportAttachment(prev => ({ ...prev, file: files?.[0] || null }))}
                            description="Rapor ekini buraya sürükleyin"
                        />
                    </div>
                </div>
            </Modal>

            {/* Upload Signed Final Report Modal */}
            <Modal
                isOpen={showUploadFinalModal}
                onClose={() => setShowUploadFinalModal(false)}
                title="İmzalı Rapor Yükle"
                size="md"
                footer={
                    <div className="w-full flex justify-end gap-3">
                        <Button variant="secondary" className="min-w-[120px]" onClick={() => setShowUploadFinalModal(false)}>İptal</Button>
                        <Button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleUploadFinalReport(new Event('submit') as any);
                            }} 
                            variant="primary" 
                            className="min-w-[160px] shadow-lg shadow-primary/20"
                            disabled={!finalReportFile}
                        >
                            Raporu Onayla ve Yükle
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 shadow-inner">
                        <Upload size={36} />
                    </div>
                    <div className="w-full">
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Islak imzalı veya e-imzalı nihai denetim raporunu sisteme yükleyiniz. 
                            Bu dosya <span className="font-bold text-slate-900">"Nihai Rapor"</span> olarak işaretlenecektir.
                        </p>
                        <FileUpload 
                            multiple={false}
                            accept=".pdf"
                            onFileSelect={(files) => setFinalReportFile(files?.[0] || null)}
                            description="İmzalı PDF raporunu buraya bırakın"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Request Modal */}
            {showDeleteRequestModal && (
                <DeleteRequestModal
                    isOpen={showDeleteRequestModal}
                    onClose={() => setShowDeleteRequestModal(false)}
                    onConfirm={handleDeleteRequestConfirm}
                    title={deleteTargetType === 'AUDIT' ? "Denetim Silme Talebi" : "Bulgu Silme Talebi"}
                    description={`${deleteTargetType === 'AUDIT' ? auditData.title : (deleteTargetItem?.code || 'Bulgu')} öğesini silmek istediğinize emin misiniz? Bu işlem için yönetici onayı gerekecektir.`}
                />
            )}

            {/* Edit Audit Modal */}
            {showEditAuditModal && (
                <CreateAuditModal
                    isOpen={showEditAuditModal}
                    onClose={() => setShowEditAuditModal(false)}
                    initialData={auditData}
                    isEditMode={true}
                    staffList={allStaff}
                    onSuccess={() => {
                        setShowEditAuditModal(false);
                        loadData();
                    }}
                />
            )}

            {/* Communication Modals */}
            {showComposeModal && (
                <ComposeLetterModal
                    isOpen={showComposeModal}
                    onClose={() => { setShowComposeModal(false); setEditingCommunication(null); }}
                    onSubmit={handleCreateCommunication}
                    auditDetails={auditData}
                    initialData={editingCommunication}
                />
            )}
            
            {showMeetingModal && (
                <MeetingMinutesModal
                    isOpen={showMeetingModal}
                    onClose={() => setShowMeetingModal(false)}
                    auditDetails={auditData}
                    onSubmit={handleCreateMeeting}
                />
            )}
        </div>
    );
}
