'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertCircle, Eye, History as HistoryIcon, Trash2, Send, Save, ArrowLeft, Loader2, Wand2,
    ChevronDown, RefreshCw, Download, List, FileSignature, Clock, MoreVertical, X, AlertTriangle, CheckCircle, Plus, Search, Filter
} from 'lucide-react';

import useOnClickOutside from '@/hooks/useOnClickOutside';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { auditApi, Audit, CreateFindingDto, User, Finding as ApiFinding } from '@/lib/audit-api';
import PageHeader from '@/components/audit/PageHeader';
import { useAuditTitle } from '@/context/AuditTitleContext';

// Yerel tip takma adı
type Finding = ApiFinding;
import { getStatusBadgeClass, getRiskBadgeClass, calculateBusinessDays, formatDate, formatDateTime } from '@/lib/audit-utils';

import FindingsTable from '@/components/audit/FindingsTable';
import CreateFindingModal from '@/components/audit/CreateFindingModal';
import RiskAcceptanceModal from '@/components/RiskAcceptanceModal';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FindingDetailModal from '@/components/modals/FindingDetailModal';
import CustomSelect from '@/components/ui/CustomSelect';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import FindingActionButtons from '@/components/audit/FindingActionButtons';
import RefreshButton from '@/components/ui/RefreshButton';
import CodeBadge from '@/components/ui/CodeBadge';
import ConfirmModal from '@/components/ConfirmModal';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import ReviewModal from '@/components/audit/modals/ReviewModal';
import ExtensionModal from '@/components/audit/modals/ExtensionModal';
import DataTable, { Column } from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

// --- Sub-Components ---
// (Modals have been moved to separate files)

function FindingsPageContent() {
    const { user, hasPermission, hasRole } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const { setTitle, setSubtitle, refreshTrashCount } = useAuditTitle();
    const [findings, setFindings] = useState<Finding[]>([]);
    const [audits, setAudits] = useState<Audit[]>([]);
    const [auditTeam, setAuditTeam] = useState<{ id: string, name: string, role: string }[]>([]);
    const [staffList, setStaffList] = useState<{ id: string, name: string, title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtreler
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterAudit, setFilterAudit] = useState<string[]>([]);
    const [filterInspector, setFilterInspector] = useState<string[]>([]);
    const [filterYear, setFilterYear] = useState<string[]>([]);

    // Modal durumları
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

    // Gözden geçirme iş akışı durumları
    const [reviewNotes, setReviewNotes] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [actionFinding, setActionFinding] = useState<Finding | null>(null);

    // Evrensel Bulgu Durumları
    const [showRiskAcceptanceModal, setShowRiskAcceptanceModal] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);

    // İş akışı onay durumu
    const [workflowConfirm, setWorkflowConfirm] = useState<{ isOpen: boolean, finding: Finding | null, newStatus: string, notes?: string }>({ isOpen: false, finding: null, newStatus: '', notes: '' });

    // Sayfalama durumu
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    useEffect(() => {
        loadData();
    }, []);

    // URL parametrelerini doğrudan bağlantı için işle
    const searchParams = useSearchParams();
    const linkedId = searchParams.get('id');
    const linkedStatus = searchParams.get('status');

    useEffect(() => {
        if (linkedStatus) {
            setFilterStatus(linkedStatus.split(','));
        }
    }, [linkedStatus]);

    useEffect(() => {
        if (linkedId && findings.length > 0) {
            // Hem ID hem de Kod ile kontrol et
            const linkedFinding = findings.find(f =>
                String(f.id) === linkedId ||
                f.code === linkedId
            );

            if (linkedFinding) {
                setSelectedFinding(linkedFinding);
                setIsDetailModalOpen(true);
            }
        }
    }, [linkedId, findings]);

    // Örneklemeden gelen yeni bulgu yönlendirmesini sessionStorage üzerinden işle
    useEffect(() => {
        try {
            const samplingDataStr = sessionStorage.getItem('newFindingFromSampling');
            if (samplingDataStr && audits.length > 0) {
                const data = JSON.parse(samplingDataStr);
                
                // Oluşturma modalını aç ve ön doldur
                setSelectedFinding({
                    auditId: data.auditId || '',
                    title: `Örneklem Hatası: ${data.title}`,
                    description: `Sistem üzerinden yapılan örnekleme sonucunda tespit edilen hatalar (${data.deviations} sapma). \nLütfen detayları ve kanıtları ekleyiniz.`,
                    riskLevel: 'Orta',
                    id: undefined // Yeni bulgu olarak işlenecek
                } as any);
                setIsCreateModalOpen(true);
                
                // Sayfa yenilenirken tekrar açılmaması için session'dan temizle
                sessionStorage.removeItem('newFindingFromSampling');
            }
        } catch(e) {
            console.error("Session storage read error:", e);
        }
    }, [audits]);

    const loadData = async (showOverlay = true) => {
        try {
            if (showOverlay) setLoading(true);
            const [findingsData, auditsData, staffData] = await Promise.all([
                auditApi.getFindings(),
                auditApi.getAudits(),
                auditApi.getStaff()
            ]);
            
            const mappedFindings = findingsData.map((f: any) => ({
                ...f,
                riskLevel: f.riskLevel || f.risk,
                assignedUser: f.assignedUser || (f.assignedUserId ? staffData.find((s:any) => String(s.id) === String(f.assignedUserId)) : null),
                audit: f.audit || (f.auditId ? auditsData.find((a:any) => String(a.id) === String(f.auditId)) : null)
            }));

            setFindings(mappedFindings);
            setAudits(auditsData);
            setStaffList(staffData);
        } catch (err: any) {
            console.error('Veri yükleme hatası:', err);
            setError('Veriler yüklenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
        } finally {
            if (showOverlay) setLoading(false);
        }
    };


    const handleView = async (finding: Finding) => {
        try {
            setLoading(true);
            const fullFinding = await auditApi.getFinding(String(finding.id));
            setSelectedFinding(fullFinding || finding);
        } catch (e) {
            setSelectedFinding(finding);
        } finally {
            setLoading(false);
            setIsDetailModalOpen(true);
        }
    };

    const handleViewHistory = (finding: Finding) => {
        setSelectedFinding(finding);
        setIsHistoryModalOpen(true);
    };

    const handleDeleteClick = (finding: Finding) => {
        setDeleteConfirm({ isOpen: true, id: finding.id.toString() });
    };

    const handleEditFinding = (finding: Finding) => {
        setSelectedFinding(finding);
        setIsCreateModalOpen(true);
    };



    // ... inside component ...

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            const response = await auditApi.deleteFinding(String(deleteConfirm.id));
            if (response.success) {
                showToast(response.message || 'İşlem başarıyla tamamlandı.', 'success');
                // Yeni durumu yansıtmak için verileri yenile
                await loadData();
                refreshTrashCount();
            } else {
                showToast(response.message || 'İşlem başarısız.', 'error');
            }
        } catch (err) {
            showToast('İşlem başarısız.', 'error');
        } finally {
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    // ...

    const handleStatusUpdate = (finding: Finding, newStatus: string, notes?: string) => {
        setWorkflowConfirm({ isOpen: true, finding, newStatus, notes });
    };

    const handleConfirmStatusUpdate = async () => {
        const { finding, newStatus, notes } = workflowConfirm;
        if (!finding) return;

        try {
            const payload: any = { status: newStatus };
            if (notes) payload.reviewNotes = notes;

            await auditApi.updateFinding(String(finding.id), payload);
            await auditApi.createLog({
                action: 'Durum Güncellemesi',
                user: user?.displayName || 'Kullanıcı',
                details: `${finding.code} durumu ${newStatus} olarak güncellendi. ${notes ? 'Not: ' + notes : ''}`,
                targetType: 'Finding',
                targetId: finding.id
            });
            showToast('İşlem başarıyla tamamlandı.', 'success');
            loadData();
            if (isDetailModalOpen) setIsDetailModalOpen(false);
            setShowReviewModal(false);
            setReviewNotes('');
        } catch (err) {
            showToast('İşlem başarısız.', 'error');
        } finally {
            setWorkflowConfirm({ isOpen: false, finding: null, newStatus: '', notes: '' });
        }
    };

    const handleAcceptRiskClick = (finding: Finding) => {
        setSelectedFinding(finding);
        setShowRiskAcceptanceModal(true);
    };

    const handleAcceptRiskConfirm = async (justification: string, file: File | null) => {
        if (!selectedFinding) return;

        try {
            await auditApi.acceptRisk(selectedFinding.id, justification, file);
            showToast('Risk kabulü başarıyla işlendi ve bulgu kapatıldı.', 'success');
            setShowRiskAcceptanceModal(false);
            loadData();
        } catch (error) {
            console.error(error);
            showToast('Risk kabulü işlemi başarısız oldu.', 'error');
        }
    };

    const handleExtensionClick = (finding: Finding) => {
        setActionFinding(finding);
        setShowExtensionModal(true);
    };

    const handleExtensionConfirm = async (data: { requestedDeadline: string; reason: string }) => {
        if (!actionFinding) return;
        try {
            await auditApi.createExtensionRequest({
                findingId: actionFinding.id,
                currentDeadline: actionFinding.dueDate,
                requestedDeadline: data.requestedDeadline,
                reason: data.reason
            });
            showToast('Süre uzatım talebi başarıyla iletildi.', 'success');
            setShowExtensionModal(false);
            loadData();
        } catch (err) {
            showToast('Talep iletilemedi.', 'error');
        }
    };

    const handleNotifyClick = (finding: Finding) => {
        setSelectedFinding(finding);
        setShowNotifyModal(true);
    };

    const handleSendNotification = async (e?: React.FormEvent) => {
        if (!selectedFinding) return;
        if (e) e.preventDefault();
        try {
            await auditApi.notifyFinding(selectedFinding.id.toString(), notifyEmail);
            // Log backend tarafından yönetiliyor veya burada eklenmeli
            await auditApi.createLog({
                action: 'Tebliğ Edildi',
                user: user?.displayName || 'Kullanıcı',
                details: `${selectedFinding.code} kodlu bulgu ${notifyEmail} adresine tebliğ edildi.`,
                targetType: 'Finding',
                targetId: selectedFinding.id
            });
            showToast(`${notifyEmail} adresine tebliğ bildirimi gönderildi.`, 'success');
            setShowNotifyModal(false);
            setNotifyEmail('');
            loadData();
        } catch (err) {
            showToast('Bildirim gönderilemedi.', 'error');
        }
    };



    // Filtreleme mantığı
    const isUnit = hasRole('AUDIT_UNIT') || hasRole('AUDIT_VIEWER');

    const filteredFindings = findings.filter(f => {
        const matchesTerm = (f.title?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (f.code?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesRisk = filterRisk.length === 0 || filterRisk.includes(f.riskLevel);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(f.status);
        const matchesAudit = filterAudit.length === 0 || filterAudit.includes(String(f.auditId));
        const matchesInspector = filterInspector.length === 0 || filterInspector.includes(f.assignedUserId || '');
        const year = f.dueDate ? new Date(f.dueDate).getFullYear().toString() : '2025';
        const matchesYear = filterYear.length === 0 || filterYear.includes(year);

        // Birim doğrulaması: Yalnızca birimin sürecine (Tebliğ ve Mutabakat) ait ve birimlerine ait bulguları göster
        const relevantToUnit = isUnit ? (() => {
            // 1. Status Check
            const allowedStatuses = ['Tebliğ Edildi', 'Birim Yanıtladı', 'Takip Ediliyor', 'Doğrulama Bekliyor', 'Revizyon Gerekli', 'Tamamlandı'];
            if (!allowedStatuses.includes(f.status)) return false;

            // 2. Department Check
            if (!user?.department) return false; // Birim kullanıcılarının bulguları görmesi için departmanı olmalı

            // Birim adını çözümle (bulgu.audit eksik olabilir, denetimler listesinden yedek arama yap)
            let unitName = f.audit?.unit?.name;
            if (!unitName && audits.length > 0) {
                const relatedAudit = audits.find(a => a.id === f.auditId || String(a.id) === String(f.auditId));
                unitName = relatedAudit?.unit?.name;
            }

            if (!unitName) return false;

            return unitName.toLocaleLowerCase('tr-TR').trim() === user.department.toLocaleLowerCase('tr-TR').trim();
        })() : true;

        // Sekme (Tab) Tabanlı Veri Filtreleme
        const relevantToTab = (() => {
            // Sadece birim kullanıcısı değilse veya birim kullanıcısı iken mutabakat sekmesindeyse
            if (pathname === '/audit/conciliation') {
                return ['Tebliğ Edildi', 'Birim Yanıtladı', 'Cevaplandı', 'Risk Kabul Edildi', 'Mutabık Değil'].includes(f.status);
            }
            if (pathname === '/audit/follow-up') {
                return ['Takip Ediliyor', 'Doğrulama Bekliyor', 'Revizyon Gerekli', 'Tamamlandı', 'Kapalı', 'Kapalı (Mutabık Değil)'].includes(f.status);
            }
            return true; // '/audit/findings' için hepsini göster
        })();

        return matchesTerm && matchesRisk && matchesStatus && matchesAudit && matchesInspector && matchesYear && relevantToUnit && relevantToTab;
    });

    // Filtre değiştiğinde sayfayı sıfırla
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRisk, filterStatus, filterAudit, filterInspector, filterYear]);

    // Sayfalanmış bulgular
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedFindings = filteredFindings.slice(indexOfFirstItem, indexOfLastItem);

    const canCreate = hasPermission('AUDIT', 'CREATE');
    const canDelete = hasPermission('AUDIT', 'DELETE');

    const renderStats = () => {
        if (isUnit) return null;

        // Mutabakat Sekmesi Dashboardu
        if (pathname === '/audit/conciliation') {
            const baseFindings = findings.filter(f => {
                const matchesTerm = (f.title?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
                    (f.code?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'));
                const matchesAudit = filterAudit.length === 0 || filterAudit.includes(String(f.auditId));
                const matchesInspector = filterInspector.length === 0 || filterInspector.includes(f.assignedUserId || '');
                const year = f.dueDate ? new Date(f.dueDate).getFullYear().toString() : '2025';
                const matchesYear = filterYear.length === 0 || filterYear.includes(year);
                return matchesTerm && matchesAudit && matchesInspector && matchesYear && ['Tebliğ Edildi', 'Birim Yanıtladı', 'Cevaplandı', 'Risk Kabul Edildi', 'Mutabık Değil'].includes(f.status);
            });

            const toggleStatusFilter = (status: string) => {
                if (filterStatus.includes(status)) {
                    setFilterStatus(filterStatus.filter(s => s !== status));
                } else {
                    setFilterStatus([...filterStatus, status]);
                }
            };

            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <StatCard
                        title="Mutabakat Toplamı"
                        value={baseFindings.length}
                        color="blue"
                        onClick={() => setFilterStatus([])}
                        className={filterStatus.length === 0 ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Tebliğ Edildi"
                        value={baseFindings.filter(f => f.status === 'Tebliğ Edildi').length}
                        color="amber"
                        onClick={() => toggleStatusFilter('Tebliğ Edildi')}
                        className={filterStatus.includes('Tebliğ Edildi') ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Birim Yanıtladı"
                        value={baseFindings.filter(f => f.status === 'Birim Yanıtladı').length}
                        color="blue"
                        onClick={() => toggleStatusFilter('Birim Yanıtladı')}
                        className={filterStatus.includes('Birim Yanıtladı') ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Cevaplandı"
                        value={baseFindings.filter(f => f.status === 'Cevaplandı').length}
                        color="indigo"
                        onClick={() => toggleStatusFilter('Cevaplandı')}
                        className={filterStatus.includes('Cevaplandı') ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Risk Kabul"
                        value={baseFindings.filter(f => f.status === 'Risk Kabul Edildi').length}
                        color="emerald"
                        onClick={() => toggleStatusFilter('Risk Kabul Edildi')}
                        className={filterStatus.includes('Risk Kabul Edildi') ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Mutabık Değil"
                        value={baseFindings.filter(f => f.status === 'Mutabık Değil').length}
                        color="rose"
                        onClick={() => toggleStatusFilter('Mutabık Değil')}
                        className={filterStatus.includes('Mutabık Değil') ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                </div>
            );
        }

        // Aksiyon Takip Sekmesi Dashboardu
        if (pathname === '/audit/follow-up') {
            const baseFindings = findings.filter(f => {
                const matchesTerm = (f.title?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
                    (f.code?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'));
                const matchesAudit = filterAudit.length === 0 || filterAudit.includes(String(f.auditId));
                const matchesInspector = filterInspector.length === 0 || filterInspector.includes(f.assignedUserId || '');
                const year = f.dueDate ? new Date(f.dueDate).getFullYear().toString() : '2025';
                const matchesYear = filterYear.length === 0 || filterYear.includes(year);
                return matchesTerm && matchesAudit && matchesInspector && matchesYear && ['Takip Ediliyor', 'Doğrulama Bekliyor', 'Revizyon Gerekli', 'Tamamlandı', 'Kapalı', 'Kapalı (Mutabık Değil)'].includes(f.status);
            });

            const toggleStatusFilter = (status: string) => {
                if (filterStatus.includes(status)) {
                    setFilterStatus(filterStatus.filter(s => s !== status));
                } else {
                    setFilterStatus([...filterStatus, status]);
                }
            };

            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <StatCard
                        title="Takip Toplamı"
                        value={baseFindings.length}
                        color="blue"
                        onClick={() => setFilterStatus([])}
                        className={filterStatus.length === 0 ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Takip Ediliyor"
                        value={baseFindings.filter(f => f.status === 'Takip Ediliyor').length}
                        color="orange"
                        onClick={() => toggleStatusFilter('Takip Ediliyor')}
                        className={filterStatus.includes('Takip Ediliyor') ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Doğrulama Bekliyor"
                        value={baseFindings.filter(f => f.status === 'Doğrulama Bekliyor').length}
                        color="amber"
                        onClick={() => toggleStatusFilter('Doğrulama Bekliyor')}
                        className={filterStatus.includes('Doğrulama Bekliyor') ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Revizyon Gerekli"
                        value={baseFindings.filter(f => f.status === 'Revizyon Gerekli').length}
                        color="rose"
                        onClick={() => toggleStatusFilter('Revizyon Gerekli')}
                        className={filterStatus.includes('Revizyon Gerekli') ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Tamamlandı"
                        value={baseFindings.filter(f => f.status === 'Tamamlandı').length}
                        color="green"
                        onClick={() => toggleStatusFilter('Tamamlandı')}
                        className={filterStatus.includes('Tamamlandı') ? 'ring-2 ring-green-500 border-green-500 bg-green-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                    <StatCard
                        title="Kapalı"
                        value={baseFindings.filter(f => f.status === 'Kapalı' || f.status === 'Kapalı (Mutabık Değil)').length}
                        color="emerald"
                        onClick={() => {
                            if (filterStatus.includes('Kapalı')) {
                                setFilterStatus(filterStatus.filter(s => s !== 'Kapalı' && s !== 'Kapalı (Mutabık Değil)'));
                            } else {
                                setFilterStatus([...filterStatus, 'Kapalı', 'Kapalı (Mutabık Değil)']);
                            }
                        }}
                        className={filterStatus.includes('Kapalı') ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                    />
                </div>
            );
        }

        // Tüm Bulgular Dashboardu (Varsayılan)
        const baseFindings = findings.filter(f => {
            const matchesTerm = (f.title?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
                (f.code?.toLocaleLowerCase('tr-TR') || '').includes(searchTerm.toLocaleLowerCase('tr-TR'));
            const matchesAudit = filterAudit.length === 0 || filterAudit.includes(String(f.auditId));
            const matchesInspector = filterInspector.length === 0 || filterInspector.includes(f.assignedUserId || '');
            const year = f.dueDate ? new Date(f.dueDate).getFullYear().toString() : '2025';
            const matchesYear = filterYear.length === 0 || filterYear.includes(year);
            return matchesTerm && matchesAudit && matchesInspector && matchesYear;
        });

        const toggleRiskFilter = (risk: string) => {
            if (filterRisk.includes(risk)) {
                setFilterRisk(filterRisk.filter(r => r !== risk));
            } else {
                setFilterRisk([...filterRisk, risk]);
            }
        };

        const toggleStatusFilter = (status: string) => {
            if (filterStatus.includes(status)) {
                setFilterStatus(filterStatus.filter(s => s !== status));
            } else {
                setFilterStatus([...filterStatus, status]);
            }
        };

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
                <StatCard
                    title="Toplam"
                    value={baseFindings.length}
                    color="blue"
                    onClick={() => { setFilterRisk([]); setFilterStatus([]); }}
                    className={filterRisk.length === 0 && filterStatus.length === 0 ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Kritik"
                    value={baseFindings.filter(f => f.riskLevel === 'Kritik').length}
                    color="rose"
                    onClick={() => toggleRiskFilter('Kritik')}
                    className={filterRisk.includes('Kritik') ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Yüksek"
                    value={baseFindings.filter(f => f.riskLevel === 'Yüksek').length}
                    color="red"
                    onClick={() => toggleRiskFilter('Yüksek')}
                    className={filterRisk.includes('Yüksek') ? 'ring-2 ring-red-500 border-red-500 bg-red-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Orta"
                    value={baseFindings.filter(f => f.riskLevel === 'Orta').length}
                    color="orange"
                    onClick={() => toggleRiskFilter('Orta')}
                    className={filterRisk.includes('Orta') ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Taslak"
                    value={baseFindings.filter(f => f.status === 'Taslak').length}
                    color="gray"
                    onClick={() => toggleStatusFilter('Taslak')}
                    className={filterStatus.includes('Taslak') ? 'ring-2 ring-gray-500 border-gray-500 bg-gray-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Onay Bekliyor"
                    value={baseFindings.filter(f => f.status === 'Onay Bekliyor').length}
                    color="amber"
                    onClick={() => toggleStatusFilter('Onay Bekliyor')}
                    className={filterStatus.includes('Onay Bekliyor') ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Takip Ediliyor"
                    value={baseFindings.filter(f => f.status === 'Takip Ediliyor' || f.status === 'Doğrulama Bekliyor').length}
                    color="blue"
                    onClick={() => {
                        if (filterStatus.includes('Takip Ediliyor')) {
                            setFilterStatus(filterStatus.filter(s => s !== 'Takip Ediliyor' && s !== 'Doğrulama Bekliyor'));
                        } else {
                            setFilterStatus([...filterStatus, 'Takip Ediliyor', 'Doğrulama Bekliyor']);
                        }
                    }}
                    className={filterStatus.includes('Takip Ediliyor') ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
                <StatCard
                    title="Tamamlandı"
                    value={baseFindings.filter(f => f.status === 'Tamamlandı').length}
                    color="emerald"
                    onClick={() => toggleStatusFilter('Tamamlandı')}
                    className={filterStatus.includes('Tamamlandı') ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30 scale-[1.02] transition-all' : 'hover:scale-[1.02] transition-all'}
                />
            </div>
        );
    };

    const getStatusOptions = () => {
        if (pathname === '/audit/conciliation') {
            return [
                { value: "Tebliğ Edildi", label: "Tebliğ Edildi" },
                { value: "Birim Yanıtladı", label: "Birim Yanıtladı" },
                { value: "Cevaplandı", label: "Cevaplandı" },
                { value: "Risk Kabul Edildi", label: "Risk Kabul Edildi" },
                { value: "Mutabık Değil", label: "Mutabık Değil" }
            ];
        }
        if (pathname === '/audit/follow-up') {
            return [
                { value: "Takip Ediliyor", label: "Takip Ediliyor" },
                { value: "Doğrulama Bekliyor", label: "Doğrulama Bekliyor" },
                { value: "Revizyon Gerekli", label: "Revizyon Gerekli" },
                { value: "Tamamlandı", label: "Tamamlandı" },
                { value: "Kapalı", label: "Kapalı" },
                { value: "Kapalı (Mutabık Değil)", label: "Kapalı (Mutabık Değil)" }
            ];
        }
        return [
            { value: "Taslak", label: "Taslak" },
            { value: "Onay Bekliyor", label: "Onay Bekliyor" },
            { value: "Onaylandı", label: "Onaylandı" },
            { value: "Tebliğ Edildi", label: "Tebliğ Edildi" },
            { value: "Birim Yanıtladı", label: "Birim Yanıtladı" },
            { value: "Takip Ediliyor", label: "Takip Ediliyor" },
            { value: "Doğrulama Bekliyor", label: "Doğrulama Bekliyor" },
            { value: "Revizyon Gerekli", label: "Revizyon Gerekli" },
            { value: "Tamamlandı", label: "Tamamlandı" },
            { value: "Kapalı", label: "Kapalı" }
        ];
    };

    if (!user) return null;

    return (
        <>
            <div className="mb-8">
                <PageToolbar
                    noSearch={true}
                    leftActions={
                        <SegmentedTabs
                            tabs={[
                                { id: '/audit/findings', label: 'Tüm Bulgular', icon: List },
                                { id: '/audit/conciliation', label: 'Tebliğ ve Mutabakat', icon: FileSignature },
                                { id: '/audit/follow-up', label: 'Aksiyon Takip', icon: Clock }
                            ].filter(tab => {
                                if (hasRole('AUDIT_UNIT')) {
                                    return tab.id === '/audit/conciliation';
                                }
                                return true;
                            })}
                            activeTab={pathname}
                            onChange={(id) => router.push(id)}
                        />
                    }
                />
            </div>
            {/* Page Header */}
            <PageHeader 
                title={pathname === '/audit/conciliation' ? 'Tebliğ ve Mutabakat' : pathname === '/audit/follow-up' ? 'Aksiyon Takip' : 'Bulgular & Aksiyonlar'} 
                subtitle={
                    pathname === '/audit/conciliation' ? 'Tebliğ edilen bulguların birimlerle mutabakat süreçleri ve yanıtların değerlendirilmesi' : 
                    pathname === '/audit/follow-up' ? 'Mutabık kalınan bulguların aksiyon planları ve kanıt yükleme süreçlerinin takibi' : 
                    'Tespitlerden mutabakat ve aksiyon takibine kadar tüm bulgu süreçlerinin yönetimi'
                } 
            />

            {/* Stats Dashboard */}
            {renderStats()}

            {/* Standardized Toolbar */}
            <PageToolbar
                searchPlaceholder="Bulgu başlığı, kodu veya açıklamasında ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadData(false)}
                showAddButton={canCreate && !isUnit && pathname === '/audit/findings'}
                onAddClick={() => {
                    setSelectedFinding(null);
                    setIsCreateModalOpen(true);
                }}
                addButtonText="Yeni Bulgu"
                showExportButton={true}
                onExportClick={() => { auditApi.exportToExcel(findings.map(f => ({ Kod: f.code, Başlık: f.title, Risk: f.riskLevel, Durum: f.status })), 'Bulgular'); }}
                filters={
                    <FilterDropdown
                        activeCount={filterAudit.length + filterRisk.length + filterStatus.length + filterInspector.length + filterYear.length}
                        onClear={() => {
                            setSearchTerm('');
                            setFilterRisk([]);
                            setFilterStatus([]);
                            setFilterAudit([]);
                            setFilterInspector([]);
                            setFilterYear([]);
                        }}
                    >
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            <div>
                                <CustomSelect
                                    label="Denetim"
                                    value={filterAudit}
                                    onChange={(val) => setFilterAudit(val as string[])}
                                    placeholder="Tümü"
                                    showSearch
                                    isMulti
                                    options={audits.map(a => ({ value: String(a.id), label: `${a.code} - ${a.title.substring(0, 20)}...` }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {/* HIDE RISK FILTER FOR UNITS if they shouldn't see risk */}
                                {!isUnit && (
                                    <div>
                                        <CustomSelect
                                            label="Risk Seviyesi"
                                            value={filterRisk}
                                            onChange={(val) => setFilterRisk(val as string[])}
                                            placeholder="Tümü"
                                            isMulti
                                            options={[
                                                { value: "Kritik", label: "Kritik", className: "bg-rose-100 text-rose-900 border-rose-200" },
                                                { value: "Yüksek", label: "Yüksek", className: "bg-red-50 text-red-700 border-red-200" },
                                                { value: "Orta", label: "Orta", className: "bg-orange-50 text-orange-700 border-orange-200" },
                                                { value: "Düşük", label: "Düşük", className: "bg-yellow-50 text-yellow-700 border-yellow-200" }
                                            ]}
                                        />
                                    </div>
                                )}
                                <div>
                                    <CustomSelect
                                        label="Durum"
                                        value={filterStatus}
                                        onChange={(val) => setFilterStatus(val as string[])}
                                        placeholder="Tümü"
                                        isMulti
                                        options={getStatusOptions()}
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterDropdown>
                }
            />

            <FindingsTable
                findings={paginatedFindings}
                loading={loading}
                isUnit={isUnit}
                isManager={hasRole('AUDIT_MANAGER') || hasRole('ADMIN')}
                onView={handleView}
                onEdit={handleEditFinding}
                onDelete={handleDeleteClick}
                onStatusUpdate={handleStatusUpdate}
                onNotify={handleNotifyClick}
                onReviewRequest={(finding) => { setActionFinding(finding); setShowReviewModal(true); }}
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilterRisk([]);
                    setFilterStatus([]);
                    setFilterAudit([]);
                    setFilterInspector([]);
                    setFilterYear([]);
                }}
            />

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalItems={filteredFindings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />

            {/* CREATE FINDING MODAL COMPONENT */}
            <CreateFindingModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedFinding(null);
                }}
                onSuccess={loadData}
                editFindingId={selectedFinding?.id}
                initialFinding={selectedFinding}
            />
            {/* DETAIL MODAL - Comprehensive Finding View */}
            <FindingDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                finding={selectedFinding}
                onStatusUpdate={handleStatusUpdate}
                onNotify={handleNotifyClick}
                onAcceptRisk={handleAcceptRiskClick}
                onExtensionRequest={handleExtensionClick}
                onReviewRequest={(finding) => { setActionFinding(finding); setShowReviewModal(true); }}
                onEdit={handleEditFinding}
                onDelete={handleDeleteClick}
                isManager={hasRole('AUDIT_MANAGER') || hasRole('ADMIN')}
                user={user}
            />
            {/* HISTORY MODAL */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={`İşlem Geçmişi - ${selectedFinding?.code}`}
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button onClick={() => setIsHistoryModalOpen(false)} className="px-8 shadow-md font-bold">Kapat</Button>
                    </div>
                }
            >
                <div className="max-h-[60vh] overflow-y-auto px-1">
                    {selectedFinding?.history && selectedFinding.history.length > 0 ? (
                        <ul className="relative border-l border-gray-200 ml-3 space-y-6 pb-2">
                            {selectedFinding.history.map((record: any, index: number) => (
                                <li key={index} className="mb-8 ml-6">
                                    <span className="absolute flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full -left-3 ring-8 ring-white">
                                        <Plus size={14} className="text-primary" />
                                    </span>
                                    <h3 className="flex items-center mb-1 text-base font-semibold text-gray-900">
                                        {record.action || 'İşlem'}
                                    </h3>
                                    <time className="block mb-1 text-sm font-normal leading-none text-gray-400">
                                        {record.date ? formatDateTime(record.date) : '-'}
                                    </time>
                                    <p className="text-sm font-normal text-gray-600">
                                        {record.user ? `${record.user} tarafından ` : ''}
                                        {record.description || 'İşlem detayları mevcut değil.'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <HistoryIcon size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>Henüz işlem geçmişi bulunmamaktadır.</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* NOTIFY MODAL */}
            <Modal
                isOpen={showNotifyModal}
                onClose={() => setShowNotifyModal(false)}
                title="Bulgu Tebliğ Et"
                size="md"
                footer={
                    <div className="flex justify-end w-full gap-3">
                        <Button variant="secondary" onClick={() => setShowNotifyModal(false)} className="px-6">İptal</Button>
                        <Button type="button" onClick={() => handleSendNotification()} className="px-8 shadow-md font-bold">Tebliğ Et</Button>
                    </div>
                }
            >
                {selectedFinding && (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <p className="font-bold text-primary">{selectedFinding.code} - {selectedFinding.title}</p>
                            <p className="text-sm text-gray-600 mt-1">Bu bulgu ilgili birime tebliğ edilecek ve mutabakat süreci başlayacaktır.</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label text-gray-700 font-semibold mb-2 block">Tebliğ Edilecek E-posta / Birim</label>
                            <input
                                type="email"
                                required
                                className="form-input focus:ring-primary/20 focus:border-primary w-full"
                                value={notifyEmail}
                                onChange={e => setNotifyEmail(e.target.value)}
                                placeholder="ornek@kurum.com.tr"
                            />
                        </div>
                    </div>
                )}
            </Modal>
            {/* CONFIRM DELETE MODAL */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Bulgu Sil"
                message="Bu bulguyu silmek istediğinize emin misiniz?"
                confirmText="Evet, Sil"
                type="danger"
            />

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onConfirm={(notes) => actionFinding && handleStatusUpdate(actionFinding, 'Revizyon Gerekli', notes)}
                finding={actionFinding}
                initialNotes={reviewNotes}
            />

            {/* RISK ACCEPTANCE MODAL */}
            {
                selectedFinding && (
                    <RiskAcceptanceModal
                        isOpen={showRiskAcceptanceModal}
                        onClose={() => setShowRiskAcceptanceModal(false)}
                        onConfirm={handleAcceptRiskConfirm}
                        findingTitle={`${selectedFinding.code} - ${selectedFinding.title}`}
                    />
                )
            }

            <ExtensionModal
                isOpen={showExtensionModal}
                onClose={() => setShowExtensionModal(false)}
                onConfirm={handleExtensionConfirm}
                finding={actionFinding}
            />

            {/* Workflow Confirmation Modal */}
            <ConfirmModal
                isOpen={workflowConfirm.isOpen}
                onClose={() => setWorkflowConfirm({ ...workflowConfirm, isOpen: false })}
                onConfirm={handleConfirmStatusUpdate}
                title={
                    workflowConfirm.newStatus === 'Doğrulama Bekliyor' ? 'Kanıt Doğrulama Süreci' :
                        workflowConfirm.newStatus === 'Tamamlandı' && workflowConfirm.finding?.status === 'Doğrulama Bekliyor' ? 'Bulgu Doğrulama ve Kapatma' :
                            'İşlemi Onayla'
                }
                message={(() => {
                    const f = workflowConfirm.finding as any;
                    if (!f) return '';

                    // Kanıt Geldi (Doğrulamaya Al) - Takip Ediliyor → Doğrulama Bekliyor
                    if (workflowConfirm.newStatus === 'Doğrulama Bekliyor') {
                        const followUps = (f as any).followUps || [];
                        const openActions = followUps.filter((fu: any) => fu.status === 'Açık');
                        return `${f.code} bulgusu için doğrulama sürecini başlatmak üzeresiniz.\n\n` +
                            `Toplam aksiyon: ${followUps.length} | Açık: ${openActions.length}\n` +
                            `${f.departmentResponse ? 'Birim yanıtı mevcut.' : 'Birim yanıtı henüz alınmamış.'}\n\n` +
                            `Doğrulama sürecinde yüklenen kanıtları ve aksiyon ilerlemesini detay sayfasından inceleyebilirsiniz.`;
                    }

                    // Onayla ve Kapat - Doğrulama Bekliyor → Tamamlandı
                    if (workflowConfirm.newStatus === 'Tamamlandı' && f.status === 'Doğrulama Bekliyor') {
                        const followUps = (f as any).followUps || [];
                        return `${f.code} bulgusu için tüm aksiyonların tamamlandığını doğrulayarak kapatmak üzeresiniz.\n\n` +
                            `Aksiyon sayısı: ${followUps.length}\n` +
                            `${f.departmentResponse ? 'Birim yanıtı: ' + (f.departmentResponse.length > 80 ? f.departmentResponse.substring(0, 80) + '...' : f.departmentResponse) : ''}\n\n` +
                            `Kapatma işlemi geri alınamaz. Lütfen kanıtları detay sayfasından incelediğinizden emin olun.`;
                    }

                    if (workflowConfirm.notes) return 'Bu bulguyu revizyon için iade etmek istediğinize emin misiniz?';
                    return `Bulgu durumunu "${workflowConfirm.newStatus}" olarak değiştirmek istediğinize emin misiniz?`;
                })()}
                type={
                    workflowConfirm.newStatus === 'Tamamlandı' ? 'warning' :
                        workflowConfirm.notes ? 'warning' : 'info'
                }
                confirmText={
                    workflowConfirm.newStatus === 'Doğrulama Bekliyor' ? 'Evet, Doğrulamaya Al' :
                        workflowConfirm.newStatus === 'Tamamlandı' && workflowConfirm.finding?.status === 'Doğrulama Bekliyor' ? 'Doğruladım, Kapat' :
                            'Evet, Onayla'
                }
                cancelText="İptal"
            />
        </>
    );
}


export default function FindingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Yükleniyor...</div>}>
      <FindingsPageContent />
    </Suspense>
  );
}
