'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { Search, Plus, Edit2, Trash2, Filter, Download, Mail, Phone, Shield, Users, Calendar, AlertCircle, ChevronDown, X, RefreshCw, Eye, Briefcase, TrendingUp, History, ArrowRight, FileText, ShieldCheck, Award, Bot, Clock, CheckCircle, UserCheck } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import OverflowTooltip from '@/components/ui/OverflowTooltip';
import { auditApi, AuditStaff, StaffExperience, StaffEducation, StaffTraining, StaffPromotion } from '@/lib/audit-api';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import DataTable from '@/components/ui/DataTable';
import RefreshButton from '@/components/ui/RefreshButton';
import { formatDate, formatPhone } from '@/lib/audit-utils';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingState from '@/components/ui/LoadingState';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import PageHeader from '@/components/audit/PageHeader';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Checkbox from '@/components/ui/Checkbox';
import { useAuth } from '@/context/AuthContext';
import { DateDisplay } from '@/components/ui/DateDisplay';
import { getRiskScoreColor, getRiskLevelFromScore, getAuditCycleFromScore } from '@/lib/audit-utils';
import { DEPARTMENTS, HIERARCHY } from '@/lib/organization-constants';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import EducationModal from '@/components/audit/staff/modals/EducationModal';
import ExperienceModal from '@/components/audit/staff/modals/ExperienceModal';
import TrainingModal from '@/components/audit/staff/modals/TrainingModal';
import PromotionModal from '@/components/audit/staff/modals/PromotionModal';
import BulkTrainingModal from '@/components/audit/staff/modals/BulkTrainingModal';
import FormInput from "@/components/ui/FormInput";

const TITLES = ['Müfettiş Yardımcısı', 'Yetkili Müfettiş Yardımcısı', 'Müfettiş', 'Kıdemli Müfettiş', 'Başmüfettiş', 'Teftiş Kurulu Müdürü'];
const ROLES = ['Sistem Yöneticisi', 'Teftiş Kurulu Müdürü', 'Müfettiş', 'İzleyici'];
const REASON_OPTIONS = [
    { value: 'Sehven Oluşturuldu', label: 'Sehven Oluşturuldu' },
    { value: 'Mükerrer Kayıt', label: 'Mükerrer Kayıt' },
    { value: 'Yanlış Veri Girişi', label: 'Yanlış Veri Girişi' },
    { value: 'Artık Geçerli Değil', label: 'Artık Geçerli Değil' },
    { value: 'Diğer', label: 'Diğer' }
];

// Fotoğraf URL yardımcısı
const getPhotoUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${origin}${url}`;
};

export default function AuditStaffPage() {
    const router = useRouter();
    const { hasRole, user } = useAuth();
    const { showToast } = useToast();
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<AuditStaff | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [selectedStaffForResume, setSelectedStaffForResume] = useState<AuditStaff | null>(null);
    const [creationReason, setCreationReason] = useState('');
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // modalRef kaldırıldı — DOM öğesine bağlanmadığı için her tıklamada modal kapanıyordu

    // İlk veri yükleme
    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async (showOverlay = true) => {
        try {
            if (showOverlay) setLoading(true);
            const data = await auditApi.getStaff();
            setStaffList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Personel listesi yükleme hatası:', error);
            showToast('Personel listesi alınırken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filtre durumu
    const [filters, setFilters] = useState({
        title: [] as string[],
        role: [] as string[],
        status: [] as string[]
    });

    // Silme onay durumları
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deletePromotionId, setDeletePromotionId] = useState<string | null>(null);
    const [deleteExperienceId, setDeleteExperienceId] = useState<string | null>(null);
    const [deleteEducationId, setDeleteEducationId] = useState<string | null>(null);
    const [deleteTrainingId, setDeleteTrainingId] = useState<string | null>(null);

    // Modal form durumu
    const [formData, setFormData] = useState<any>({});

    // Terfi modal durumu
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [promotionForm, setPromotionForm] = useState<{ title: string; previousTitle?: string; type: string; promotionDate: string; endDate?: string; department: string; notes: string; }>({
        title: '',
        previousTitle: '',
        type: 'Terfi',
        promotionDate: new Date().toISOString().split('T')[0],
        endDate: '',
        department: '',
        notes: ''
    });

    // Alt modal durumları (Deneyim ve Eğitim)
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState<any>(null);
    const [experienceForm, setExperienceForm] = useState({
        companyName: '',
        position: '',
        department: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        careerPaths: '[]',
        description: ''
    });

    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [editingEducation, setEditingEducation] = useState<any>(null);
    const [educationForm, setEducationForm] = useState({
        schoolName: '',
        degree: '',
        faculty: '',
        department: '',
        graduationYear: ''
    });

    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [editingTraining, setEditingTraining] = useState<any>(null);
    const [trainingForm, setTrainingForm] = useState({
        name: '',
        provider: '',
        startDate: '',
        endDate: '',
        hours: '',
        description: '',
        status: 'Planlandı'
    });

    const [isBulkTrainingModalOpen, setIsBulkTrainingModalOpen] = useState(false);
    const [bulkTrainingForm, setBulkTrainingForm] = useState({
        name: '',
        provider: '',
        startDate: '',
        endDate: '',
        participantIds: [] as string[]
    });

    const [selectedParentDept, setSelectedParentDept] = useState<string>('');
    const [selectedParentExp, setSelectedParentExp] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bağımsızlık Beyanı Eyaletleri ve Fonksiyonları
    const [declarations, setDeclarations] = useState<any[]>([]);
    const [loadingDeclarations, setLoadingDeclarations] = useState(false);
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [reviewingDeclarationId, setReviewingDeclarationId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [declarationForm, setDeclarationForm] = useState({
        year: new Date().getFullYear(),
        declarationType: 'Yıllık',
        hasConflict: false,
        conflictDetails: '',
        hasFinancialLink: false,
        financialDetails: '',
        hasFamilyLink: false,
        familyDetails: '',
        hasPreviousRole: false,
        previousRoleDetails: '',
        hasOtherIssue: false,
        otherIssueDetails: '',
        agreedToTerms: false
    });

    useEffect(() => {
        if (activeTab === 'independence' && editingStaff) {
            loadDeclarations();
        }
    }, [activeTab, editingStaff?.id]);

    const loadDeclarations = async () => {
        if (!editingStaff) return;
        try {
            setLoadingDeclarations(true);
            const data = await auditApi.getIndependenceDeclarations({ userId: editingStaff.id });
            setDeclarations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Bağımsızlık beyanları yüklenirken hata:', error);
            showToast('Bağımsızlık beyanları yüklenirken hata oluştu.', 'error');
        } finally {
            setLoadingDeclarations(false);
        }
    };

    const handleCreateDeclaration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        if (!declarationForm.agreedToTerms) {
            showToast('Lütfen taahhüt beyanını onaylayın.', 'warning');
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                year: Number(declarationForm.year),
                declarationType: declarationForm.declarationType,
                hasConflict: declarationForm.hasConflict,
                conflictDetails: declarationForm.hasConflict ? declarationForm.conflictDetails : '',
                hasFinancialLink: declarationForm.hasFinancialLink,
                financialDetails: declarationForm.hasFinancialLink ? declarationForm.financialDetails : '',
                hasFamilyLink: declarationForm.hasFamilyLink,
                familyDetails: declarationForm.hasFamilyLink ? declarationForm.familyDetails : '',
                hasPreviousRole: declarationForm.hasPreviousRole,
                previousRoleDetails: declarationForm.hasPreviousRole ? declarationForm.previousRoleDetails : '',
                hasOtherIssue: declarationForm.hasOtherIssue,
                otherIssueDetails: declarationForm.hasOtherIssue ? declarationForm.otherIssueDetails : '',
            };
            
            await auditApi.createIndependenceDeclaration(submitData);
            showToast('Bağımsızlık beyanınız başarıyla gönderildi.', 'success');
            setIsDeclaring(false);
            // Reset form
            setDeclarationForm({
                year: new Date().getFullYear(),
                declarationType: 'Yıllık',
                hasConflict: false,
                conflictDetails: '',
                hasFinancialLink: false,
                financialDetails: '',
                hasFamilyLink: false,
                familyDetails: '',
                hasPreviousRole: false,
                previousRoleDetails: '',
                hasOtherIssue: false,
                otherIssueDetails: '',
                agreedToTerms: false
            });
            loadDeclarations();
        } catch (error: any) {
            console.error('Bağımsızlık beyanı gönderilirken hata:', error);
            showToast(error.message || 'Bağımsızlık beyanı gönderilirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewDeclaration = async (id: string, status: 'Onaylandı' | 'Sorun Var') => {
        try {
            setLoading(true);
            await auditApi.reviewIndependenceDeclaration(id, { status, reviewNotes });
            showToast(`Beyan başarıyla ${status === 'Onaylandı' ? 'onaylandı' : 'incelendi'}.`, 'success');
            setReviewingDeclarationId(null);
            setReviewNotes('');
            loadDeclarations();
        } catch (error: any) {
            console.error('Beyan incelenirken hata:', error);
            showToast(error.message || 'Beyan güncellenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDeclaration = async (id: string) => {
        try {
            setLoading(true);
            await auditApi.deleteIndependenceDeclaration(id);
            showToast('Beyan başarıyla silindi.', 'success');
            loadDeclarations();
        } catch (error: any) {
            console.error('Beyan silinirken hata:', error);
            showToast(error.message || 'Beyan silinirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoClick = () => {
        if (!isViewMode && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Temel doğrulama
        if (!file.type.startsWith('image/')) {
            showToast('Lütfen geçerli bir resim dosyası seçiniz.', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            showToast('Dosya boyutu 2MB\'dan küçük olmalıdır.', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await auditApi.uploadStaffPhoto(file);

            if (editingStaff) {
                // Mevcut personel düzenleniyor ise arka uçta hemen güncelle
                await auditApi.updateStaff(editingStaff.id, { ...editingStaff, photoUrl: response.url });
                setEditingStaff({ ...editingStaff, photoUrl: response.url });
            }

            setFormData({ ...formData, photoUrl: response.url });
            showToast('Fotoğraf yüklendi ve kaydedildi.', 'success');
        } catch (error: any) {
            console.error('Fotoğraf yükleme hatası:', error);
            showToast('Fotoğraf yüklenemedi: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Terfi düzenleme/silme işlemleri
    const [editingPromotion, setEditingPromotion] = useState<any>(null);





    useEffect(() => {
        if (isModalOpen) {
            setActiveTab('general'); // İlk sekmeye dön
            if (editingStaff) {
                // Sertifikaları birleştirmeden önce dizi formatına dönüştür, geçersiz değerleri filtrele
                const certs: any = editingStaff.certifications;
                let certsArray: string[] = [];
                if (Array.isArray(certs)) {
                    certsArray = certs;
                } else if (typeof certs === 'string') {
                    const trimmed = certs.trim();
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        try {
                            const parsed = JSON.parse(trimmed);
                            if (Array.isArray(parsed)) certsArray = parsed;
                        } catch (e) {
                            certsArray = [trimmed];
                        }
                    } else if (trimmed) {
                        // Virgülle ayrılmış metin veya tek değer
                        certsArray = trimmed.includes(',') ? trimmed.split(',') : [trimmed];
                    }
                }

                const formattedCerts = certsArray
                    .map((c: string) => c.trim())
                    .filter((c: string) => c && c !== '[]' && c !== '""')
                    .join(', ');

                // İsim alanı uyumsuzluğu (API 'name' veya 'displayName' dönebilir)
                const fullName = editingStaff.name || editingStaff.displayName || '';
                const firstName = editingStaff.firstName || (fullName ? fullName.split(' ')[0] : '');
                const lastName = editingStaff.lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : '');

                setFormData({
                    ...editingStaff,
                    firstName,
                    lastName,
                    certifications: formattedCerts,
                    phone: editingStaff.phone || '',
                    hireDate: editingStaff.hireDate ? (editingStaff.hireDate.includes('T') ? editingStaff.hireDate.split('T')[0] : editingStaff.hireDate) : ''
                });
            } else {
                setFormData({
                    firstName: '',
                    lastName: '',
                    employeeId: '',
                    email: '',
                    phone: '',
                    hireDate: '',
                    title: 'Müfettiş',
                    role: 'Müfettiş',
                    status: 'Aktif',
                    certifications: '',
                    summary: '',
                    skills: '',
                    photoUrl: ''
                });
            }
        }
    }, [isModalOpen, editingStaff]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Sertifika ve yetenekleri girişten formatla
            const certsRaw = formData.certifications;
            const certs = typeof certsRaw === 'string'
                ? certsRaw.split(',').map(c => c.trim()).filter(Boolean)
                : (Array.isArray(certsRaw) ? certsRaw : []);

            const payload = {
                ...formData,
                certifications: certs,
                skills: formData.skills || ''
            };

            if (editingStaff) {
                await auditApi.updateStaff(editingStaff.id, payload);
                showToast('Personel bilgileri güncellendi.', 'success');
            } else {
                await auditApi.createStaff(payload);
                showToast('Yeni personel başarıyla eklendi.', 'success');
            }

            setIsModalOpen(false);
            loadStaff();
        } catch (error: any) {
            console.error('Personel kaydetme hatası:', error);
            showToast(error.message || 'Personel kaydedilirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePromotionSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setLoading(true);
        try {
            if (editingPromotion) {
                await auditApi.updateStaffPromotion(editingPromotion.id, {
                    ...promotionForm,
                    previousTitle: promotionForm.previousTitle
                });
                showToast('Kariyer kaydı güncellendi.', 'success');
            } else {
                if (!editingStaff?.id) {
                    showToast('Personel ID bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.', 'error');
                    return;
                }
                await auditApi.addStaffPromotion(editingStaff.id, {
                    ...promotionForm,
                    previousTitle: editingStaff.title
                });
                showToast('Terfi/Atama kaydı başarıyla eklendi.', 'success');
            }
            setIsPromotionModalOpen(false);
            loadStaff();
            // Detay modalini yenile
            const updated = await auditApi.getStaffProfile(editingStaff.id);
            setEditingStaff(updated);
        } catch (error: any) {
            showToast(error.message || 'Kayıt sırasında hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };




    const handleExperienceSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setLoading(true);
        try {
            if (editingExperience) {
                await auditApi.updateStaffExperience(editingExperience.id, experienceForm);
                showToast('Deneyim kaydı güncellendi.', 'success');
            } else {
                await auditApi.addStaffExperience(editingStaff.id, experienceForm);
                showToast('Deneyim kaydı eklendi.', 'success');
            }
            setIsExperienceModalOpen(false);
            const updated = await auditApi.getStaffProfile(editingStaff.id);
            setEditingStaff(updated);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExperience = (id: string) => {
        setDeleteExperienceId(id);
    };

    const confirmDeleteExperience = async () => {
        if (!deleteExperienceId) return;
        setLoading(true);
        try {
            await auditApi.deleteStaffExperience(deleteExperienceId);
            showToast('Deneyim kaydı silindi.', 'success');
            const updated = await auditApi.getStaffProfile(editingStaff?.id || '');
            setEditingStaff(updated);
            setDeleteExperienceId(null);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openExperienceModal = (exp?: StaffExperience) => {
        if (exp) {
            setEditingExperience(exp);
            setExperienceForm({
                companyName: exp.companyName || '',
                position: exp.position || '',
                department: exp.department || '',
                startDate: exp.startDate?.split('T')[0] || '',
                endDate: exp.endDate?.split('T')[0] || '',
                isCurrent: exp.isCurrent || false,
                careerPaths: (exp.careerPaths === '[]' || !exp.careerPaths) ? '' : exp.careerPaths,
                description: exp.description || ''
            });

            // Hiyerarşik seçim için üst birimi bul (Rekkursif arama)
            if (exp.department) {
                const findParentForDept = (deptName: string): string => {
                    for (const group of HIERARCHY) {
                        for (const child of group.children) {
                            if (child.title === deptName) return ''; // Top level child has no parent select value
                            if (child.children) {
                                const checkNested = (items: any[], parentTitle: string): string | null => {
                                    for (const item of items) {
                                        if (item.title === deptName) return parentTitle;
                                        if (item.children) {
                                            const found = checkNested(item.children, parentTitle);
                                            if (found) return found;
                                        }
                                    }
                                    return null;
                                };
                                const found = checkNested(child.children, child.title);
                                if (found) return found;
                            }
                        }
                    }
                    return '';
                };
                setSelectedParentExp(findParentForDept(exp.department));
            } else {
                setSelectedParentExp('');
            }
        } else {
            setEditingExperience(null);
            setSelectedParentExp('');
            setExperienceForm({
                companyName: '',
                position: '',
                department: '',
                startDate: '',
                endDate: '',
                isCurrent: false,
                careerPaths: '',
                description: ''
            });
        }
        setIsExperienceModalOpen(true);
    };

    const handleTrainingSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setLoading(true);
        try {
            const data = {
                ...trainingForm,
                hours: trainingForm.hours ? parseInt(trainingForm.hours) : null
            };
            if (editingTraining) {
                await auditApi.updateStaffTraining(editingTraining.id, data);
                showToast('Mesleki eğitim güncellendi.', 'success');
            } else {
                await auditApi.addStaffTraining(editingStaff.id, data);
                showToast('Mesleki eğitim eklendi.', 'success');
            }
            setIsTrainingModalOpen(false);
            const updated = await auditApi.getStaffProfile(editingStaff.id);
            setEditingStaff(updated);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTraining = (id: string) => {
        setDeleteTrainingId(id);
    };

    const confirmDeleteTraining = async () => {
        if (!deleteTrainingId) return;
        setLoading(true);
        try {
            await auditApi.deleteStaffTraining(deleteTrainingId);
            showToast('Eğitim kaydı silindi.', 'success');
            if (editingStaff) {
                const updated = await auditApi.getStaffProfile(editingStaff.id);
                setEditingStaff(updated);
            }
            setDeleteTrainingId(null);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkTrainingSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (bulkTrainingForm.participantIds.length === 0) {
            showToast('En az bir personel seçmelisiniz.', 'error');
            return;
        }
        setLoading(true);
        try {
            await auditApi.createTrainingBatch(bulkTrainingForm);
            showToast('Toplu eğitim kaydı oluşturuldu.', 'success');
            setIsBulkTrainingModalOpen(false);
            loadStaff();
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openTrainingModal = (trn?: StaffTraining) => {
        if (trn) {
            setEditingTraining(trn);
            setTrainingForm({
                name: trn.name || trn.title || '',
                provider: trn.provider || '',
                startDate: trn.startDate ? trn.startDate.split('T')[0] : '',
                endDate: trn.endDate ? trn.endDate.split('T')[0] : '',
                hours: trn.hours?.toString() || '',
                description: trn.description || '',
                status: trn.status || 'Tamamlandı'
            });
        } else {
            setEditingTraining(null);
            setTrainingForm({
                name: '',
                provider: '',
                startDate: '',
                endDate: '',
                hours: '',
                description: '',
                status: 'Planlandı'
            });
        }
        setIsTrainingModalOpen(true);
    };

    const handleEducationSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setLoading(true);
        try {
            if (editingEducation) {
                await auditApi.updateStaffEducation(editingEducation.id, educationForm);
                showToast('Eğitim kaydı güncellendi.', 'success');
            } else {
                await auditApi.addStaffEducation(editingStaff.id, educationForm);
                showToast('Eğitim kaydı eklendi.', 'success');
            }
            setIsEducationModalOpen(false);
            const updated = await auditApi.getStaffProfile(editingStaff.id);
            setEditingStaff(updated);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePromotion = (id: string) => {
        setDeletePromotionId(id);
    };

    const confirmDeletePromotion = async () => {
        if (!deletePromotionId || !editingStaff) return;
        setLoading(true);
        try {
            await auditApi.deleteStaffPromotion(deletePromotionId);
            showToast('Terfi kaydı silindi.', 'success');
            const updated = await auditApi.getStaffProfile(editingStaff.id);
            setEditingStaff(updated);
            setDeletePromotionId(null);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEducation = (id: string) => {
        setDeleteEducationId(id);
    };

    const confirmDeleteEducation = async () => {
        if (!deleteEducationId || !editingStaff) return;
        setLoading(true);
        try {
            await auditApi.deleteStaffEducation(deleteEducationId);
            showToast('Eğitim kaydı silindi.', 'success');
            const updated = await auditApi.getStaffProfile(editingStaff.id);
            setEditingStaff(updated);
            setDeleteEducationId(null);
        } catch (error: any) {
            showToast(error.message || 'Hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openPromotionModal = (promo?: StaffPromotion) => {
        // Düzeltme: MouseEvent kontrolü — 'type: click' hatasını önler
        const isValidPromo = promo && typeof promo === 'object' && ('title' in promo || 'id' in promo);

        if (isValidPromo) {
            setEditingPromotion(promo);
            setPromotionForm({
                title: promo.title || '',
                previousTitle: promo.previousTitle || editingStaff?.title || '',
                type: promo.type || 'Terfi',
                promotionDate: promo.promotionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                endDate: promo.endDate?.split('T')[0] || '',
                department: promo.department || '',
                notes: promo.notes || ''
            });

            // Hiyerarşik seçim için üst birimi bul
            if (promo.department) {
                const findParentForDept = (deptName: string): string => {
                    for (const group of HIERARCHY) {
                        for (const child of group.children) {
                            if (child.title === deptName) return ''; // Top level child has no parent select value
                            if (child.children) {
                                const checkNested = (items: any[], parentTitle: string): string | null => {
                                    for (const item of items) {
                                        if (item.title === deptName) return parentTitle;
                                        if (item.children) {
                                            const found = checkNested(item.children, parentTitle);
                                            if (found) return found;
                                        }
                                    }
                                    return null;
                                };
                                const found = checkNested(child.children, child.title);
                                if (found) return found;
                            }
                        }
                    }
                    return '';
                };
                setSelectedParentDept(findParentForDept(promo.department));
            } else {
                setSelectedParentDept('');
            }
        } else {
            setEditingPromotion(null);
            setSelectedParentDept('');
            setPromotionForm({
                title: '',
                previousTitle: editingStaff?.title || '',
                type: 'Terfi',
                promotionDate: new Date().toISOString().split('T')[0],
                endDate: '',
                department: '',
                notes: ''
            });
        }
        setIsPromotionModalOpen(true);
    };

    const openEducationModal = (edu?: StaffEducation) => {
        if (edu) {
            setEditingEducation(edu);
            setEducationForm({
                schoolName: edu.schoolName || '',
                degree: edu.degree || '',
                faculty: edu.faculty || '',
                department: edu.department || '',
                graduationYear: edu.graduationYear?.toString() || ''
            });
        } else {
            setEditingEducation(null);
            setEducationForm({
                schoolName: '',
                degree: '',
                faculty: '',
                department: '',
                graduationYear: ''
            });
        }
        setIsEducationModalOpen(true);
    };

    const handleResumeClick = (staff: AuditStaff) => {
        setSelectedStaffForResume(staff);
        setCreationReason('');
        setIsReasonModalOpen(true);
    };

    const handleConfirmResume = () => {
        if (!creationReason.trim()) {
            showToast('Lütfen oluşturma nedenini belirtin', 'error');
            return;
        }
        setIsReasonModalOpen(false);
        router.push(`/audit/staff/${selectedStaffForResume?.id}/ozgecmis?reason=${encodeURIComponent(creationReason)}`);
    };
    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (deleteConfirmId) {
            setLoading(true);
            try {
                await auditApi.deleteStaff(deleteConfirmId);
                setStaffList(prev => prev.filter(s => s.id !== deleteConfirmId));
                showToast('Personel başarıyla silindi.', 'success');
                setDeleteConfirmId(null);
            } catch (error) {
                console.error('Personel silme hatası:', error);
                showToast('Personel silinirken hata oluştu.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const openModal = async (staff: AuditStaff | null = null, viewMode = false) => {
        setIsViewMode(viewMode);
        if (staff) {
            setLoading(true);
            try {
                const fullProfile = await auditApi.getStaffProfile(staff.id);
                setEditingStaff(fullProfile);
            } catch (error) {
                console.error('Personel profili yükleme hatası:', error);
                setEditingStaff(staff); // Temel veriye dön
            } finally {
                setLoading(false);
            }
        } else {
            setEditingStaff(null);
        }
        setIsModalOpen(true);
    };

    const resetFilters = () => {
        setFilters({ title: [], role: [], status: [] });
        setSearchTerm('');
    };

    // Filtreleme mantığı
    const filteredStaff = staffList.filter(staff => {
        // API 'name' dönerse ismi güvenli şekilde ayır
        const firstName = String(staff.firstName || staff.name?.split(' ')[0] || '');
        const lastName = String(staff.lastName || staff.name?.split(' ').slice(1).join(' ') || '');
        const fullName = String(staff.name || `${firstName} ${lastName}`);

        const matchesSearch =
            fullName.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (staff.title || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (staff.employeeId || staff.registerNumber || '').includes(searchTerm);

        const matchesTitle = filters.title.length === 0 || filters.title.includes(staff.title);
        const matchesRole = filters.role.length === 0 || filters.role.some(r => (staff.role || '').includes(r));
        const matchesStatus = filters.status.length === 0 || filters.status.includes(staff.status);

        return matchesSearch && matchesTitle && matchesRole && matchesStatus;
    });

    const handleExport = () => {
        auditApi.exportToExcel(filteredStaff, 'Personel_Listesi');
        showToast('Personel listesi dışa aktarıldı.', 'info');
    };

    if (loading && staffList.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingState message="Kadro bilgileri yükleniyor..." />
            </div>
        );
    }

    const pageContent = (
        <>
            <PageHeader title="Teftiş Kurulu Personeli" subtitle="Müfettiş kadrosu, yetkinlikler ve eğitim bilgileri" />

            {/* Standart Araç Çubuğu */}
            <PageToolbar
                searchPlaceholder="İsim, sicil, ünvan veya rol ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadStaff(false)}
                showExportButton={true}
                onExportClick={() => { auditApi.exportToExcel(staffList, 'Teftiş Kurulu Personeli'); }}
                showAddButton={!!(hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('Admin') || hasRole('Yönetici'))}
                onAddClick={() => {
                    setEditingStaff(null);
                    setIsModalOpen(true);
                }}
                addButtonText="Yeni Personel Ekle"
                filters={
                    <FilterDropdown
                        activeCount={filters.title.length + filters.status.length + filters.role.length}
                        onClear={() => { setFilters({ title: [], status: [], role: [] }); setSearchTerm(''); }}
                    >
                        <CustomSelect label="Ünvan" value={filters.title} onChange={(val) => setFilters({ ...filters, title: val as string[] })} isMulti options={TITLES.map(t => ({ value: t, label: t }))} />
                        <CustomSelect label="Rol" value={filters.role} onChange={(val) => setFilters({ ...filters, role: val as string[] })} isMulti options={ROLES.map(r => ({ value: r, label: r }))} />
                        <CustomSelect label="Durum" value={filters.status} onChange={(val) => setFilters({ ...filters, status: val as string[] })} isMulti options={[{ value: "Aktif", label: "Aktif" }, { value: "İzinli", label: "İzinli" }, { value: "Pasif", label: "Pasif" }]} />
                    </FilterDropdown>
                }
                rightActions={
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            leftIcon={<Award size={18} />}
                            onClick={() => router.push('/audit/staff/cpe')}
                        >
                            CPE Raporu
                        </Button>
                        <Button 
                            variant="secondary" 
                            leftIcon={<Shield size={18} />}
                            onClick={() => router.push('/audit/staff/skills')}
                        >
                            Yetkinlikler
                        </Button>
                        {(hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('Admin') || hasRole('Yönetici')) && (
                            <Button variant="secondary" onClick={() => { setBulkTrainingForm({ name: '', provider: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], participantIds: [] }); setIsBulkTrainingModalOpen(true); }} className="border-primary/20 text-primary hover:bg-primary/5" leftIcon={<ShieldCheck size={18} />}>
                                Toplu Eğitim
                            </Button>
                        )}
                    </div>
                }
            />




            {/* Personel Tablosu */}
            <DataTable
                columns={[
                    {
                        key: 'name',
                        header: 'Personel',
                        type: 'user',
                        sortable: true,
                        width: '250px'
                    },
                    {
                        key: 'title',
                        header: 'Ünvan & Sertifikalar',
                        width: '250px',
                        render: (staff: AuditStaff) => (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-primary/60" />
                                    <span className="font-medium text-gray-700">{String(staff.title || '')}</span>
                                </div>
                                {staff.certifications && staff.certifications.filter((c: string) => c && c.trim() && c.trim() !== '[]' && c.trim() !== '""').length > 0 && (
                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                        {staff.certifications.filter((c: string) => c && c.trim() && c.trim() !== '[]' && c.trim() !== '""').map((cert: string, i: number) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold uppercase tracking-tight">
                                                {cert}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'hireDate',
                        header: 'İşe Giriş',
                        width: '150px',
                        type: 'date'
                    },
                    {
                        key: 'contact',
                        header: 'İletişim',
                        width: '220px',
                        render: (staff: AuditStaff) => (
                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400 shrink-0" />
                                    <OverflowTooltip content={String(staff.email || '')} className="text-gray-600 max-w-[170px]">
                                        {String(staff.email || '')}
                                    </OverflowTooltip>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{formatPhone(String(staff.phone || ''))}</span>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        header: 'Durum',
                        width: '120px',
                        render: (item: any) => <StatusBadge type="status" value={item.status} />
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '160px',
                        align: 'center',
                        render: (staff: AuditStaff) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu items={[{ label: 'Detayı İncele', icon: Eye, onClick: () => openModal(staff, true) }]} />
                            </div>
                        )
                    }
                ]}
                data={filteredStaff}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={10}
                itemUnit="personel"
                emptyIcon={Users}
                emptyTitle="Personel Kaydı Bulunamadı"
                emptyDescription="Arama kriterlerinize uygun veya sistemde kayıtlı bir personel bulunmuyor."
                className="shadow-sm border border-gray-100"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilters({ title: [], role: [], status: [] });
                }}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={(
                    <div className="flex items-center gap-3">
                        {editingStaff && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {getPhotoUrl(editingStaff.photoUrl) ? (
                                    <img src={getPhotoUrl(editingStaff.photoUrl)!} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    String(editingStaff.firstName || '?').substring(0, 1)
                                )}
                            </div>
                        )}
                        <span>{isViewMode ? 'Personel Detayı' : (editingStaff ? 'Personel Düzenle' : 'Yeni Personel Ekle')}</span>
                    </div>
                )}
                size="xl"
                footer={isViewMode ? (
                    <div className="flex justify-between w-full">
                        <div className="flex gap-2">
                            <Button variant="danger" onClick={() => { setIsModalOpen(false); handleDeleteClick(editingStaff?.id || ''); }}>
                                Sil
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { if(editingStaff) handleResumeClick(editingStaff); }}>
                                Özgeçmiş
                            </Button>
                            <Button variant="secondary" onClick={() => { setIsViewMode(false); }}>
                                Düzenle
                            </Button>
                            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                                Kapat
                            </Button>
                        </div>
                    </div>
                ) : activeTab === 'general' && (
                    <div className="flex justify-end gap-3 w-full">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            disabled={loading}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            form="staff-form"
                            disabled={loading}
                            isLoading={loading}
                        >
                            {editingStaff ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </div>
                )}
            >
                <div className="mb-6 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent -mx-6 px-6">
                    <SegmentedTabs
                        tabs={[
                            { id: 'general', label: 'Genel Bilgiler', icon: Users },
                            ...(editingStaff ? [
                                { id: 'career', label: 'Kariyer Geçmişi', icon: TrendingUp },
                                { id: 'experience', label: 'Deneyim (Özgeçmiş)', icon: Briefcase },
                                { id: 'education', label: 'Eğitim Bilgileri', icon: Calendar },
                                { id: 'trainings', label: 'Mesleki Eğitim', icon: ShieldCheck },
                                { id: 'independence', label: 'Bağımsızlık Beyanı', icon: Shield }
                            ] : [])
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />
                </div>

                <form id="staff-form" onSubmit={handleSave} className="space-y-4">
                    {activeTab === 'general' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex flex-col md:flex-row gap-6 mb-6">
                                <div className="flex-shrink-0 flex flex-col gap-4">
                                    <div
                                        className={`w-36 h-36 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 overflow-hidden relative transition-all ${!isViewMode ? 'hover:border-primary hover:bg-primary/5 cursor-pointer group' : ''}`}
                                        onClick={handlePhotoClick}
                                        title={!isViewMode ? "Fotoğraf yüklemek için tıklayın" : ""}
                                    >
                                        {getPhotoUrl(formData.photoUrl) ? (
                                            <img
                                                src={getPhotoUrl(formData.photoUrl)!}
                                                alt="Profil"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <Users size={40} className="mb-2 text-gray-300" />
                                                <span className="text-xs font-medium text-gray-500 text-center px-2">Fotoğraf Yükle</span>
                                            </>
                                        )}
                                        {!isViewMode && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit2 size={24} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                    />

                                    <div className="w-36">
                                        <label className="form-label text-xs mb-1">Sicil No</label>
                                        <input
                                            name="employeeId"
                                            type="text"
                                            className="form-input text-sm h-9 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={formData.employeeId || ''}
                                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                            required
                                            disabled={isViewMode}
                                            placeholder="S12345"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Ad</label>
                                            <input name="firstName" type="text" className="form-input disabled:bg-gray-50 disabled:text-gray-500" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required disabled={isViewMode} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Soyad</label>
                                            <input name="lastName" type="text" className="form-input disabled:bg-gray-50 disabled:text-gray-500" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required disabled={isViewMode} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">E-posta</label>
                                        <input name="email" type="email" className="form-input disabled:bg-gray-50 disabled:text-gray-500" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required disabled={isViewMode} />
                                    </div>

                                    {/* Telefon ve İşe Giriş Tarihi */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Telefon</label>
                                            <input name="phone" type="tel" className="form-input disabled:bg-gray-50 disabled:text-gray-500" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={isViewMode} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">İşe Giriş Tarihi</label>
                                            <FormInput name="hireDate" type="date"  value={formData.hireDate || ''} onChange={e => setFormData({ ...formData, hireDate: e.target.value })} disabled={isViewMode} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Ünvan</label>
                                            <CustomSelect
                                                value={formData.title}
                                                onChange={val => setFormData({ ...formData, title: val })}
                                                options={TITLES.map(t => ({ value: t, label: t }))}
                                                disabled={isViewMode}
                                                placeholder="Seçiniz..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Rol</label>
                                            <CustomSelect
                                                value={formData.role}
                                                onChange={val => setFormData({ ...formData, role: val })}
                                                options={ROLES.map(r => ({ value: r, label: r }))}
                                                disabled={isViewMode}
                                                placeholder="Seçiniz..."
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Durum</label>
                                        <CustomSelect
                                            value={formData.status}
                                            onChange={val => setFormData({ ...formData, status: val })}
                                            options={[
                                                { value: "Aktif", label: "Aktif" },
                                                { value: "İzinli", label: "İzinli" },
                                                { value: "Pasif", label: "Pasif" }
                                            ]}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>
                            </div>


                            {formData.status === 'Pasif' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="form-group">
                                        <label className="form-label">Pasiflik Nedeni</label>
                                        <CustomSelect
                                            value={formData.passiveReason || ''}
                                            onChange={(val) => setFormData({ ...formData, passiveReason: val as string })}
                                            options={[
                                                { value: "Geçici Görevlendirme", label: "Geçici Görevlendirme" },
                                                { value: "İstifa", label: "İstifa" },
                                                { value: "Emeklilik", label: "Emeklilik" },
                                                { value: "Diğer", label: "Diğer" }
                                            ]}
                                            disabled={isViewMode}
                                        />
                                    </div>

                                    {formData.passiveReason === 'Geçici Görevlendirme' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                            <div className="form-group">
                                                <label className="form-label">Görevlendirilen Üst Birim</label>
                                                <CustomSelect
                                                    value={selectedParentDept}
                                                    onChange={(val) => {
                                                        setSelectedParentDept(val as string);
                                                        setFormData({ ...formData, temporaryDepartment: '' });
                                                    }}
                                                    options={HIERARCHY.flatMap(group =>
                                                        group.children.map(child => ({
                                                            value: child.title,
                                                            label: `${group.title} > ${child.title}`
                                                        }))
                                                    )}
                                                    placeholder="Grup seçiniz..."
                                                    disabled={isViewMode}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Görevlendirilen Alt Birim</label>
                                                <CustomSelect
                                                    value={formData.temporaryDepartment || ''}
                                                    onChange={(val) => setFormData({ ...formData, temporaryDepartment: val as string })}
                                                    options={(function () {
                                                        const flatten = (items: any[], level: number = 0): any[] => {
                                                            return items.flatMap(item => {
                                                                const current = {
                                                                    value: item.title,
                                                                    label: (level > 0 ? '→ '.repeat(level) + ' ' : '') + item.title
                                                                };
                                                                if (item.children) {
                                                                    return [current, ...flatten(item.children, level + 1)];
                                                                }
                                                                return [current];
                                                            });
                                                        };

                                                        for (const group of HIERARCHY) {
                                                            const child = group.children.find(c => c.title === selectedParentDept);
                                                            if (child && 'children' in child) {
                                                                return flatten((child as any).children);
                                                            }
                                                        }
                                                        return DEPARTMENTS.map(d => ({ value: d, label: d }));
                                                    })()}
                                                    placeholder="Alt birim seçiniz..."
                                                    disabled={isViewMode || !selectedParentDept}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}



                            <div className="form-group">
                                <label className="form-label">Özet</label>
                                <textarea
                                    className="form-input min-h-[100px]"
                                    value={formData.summary || ''}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    placeholder="Personelin uzmanlık alanları ve kısa özeti..."
                                    disabled={isViewMode}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">İş Tanımı</label>
                                <textarea
                                    className="form-input min-h-[100px]"
                                    value={formData.jobDescription || ''}
                                    onChange={e => setFormData({ ...formData, jobDescription: e.target.value })}
                                    placeholder="Müfettiş/Yönetici olarak görev ve sorumluluklarınızı detaylıca giriniz..."
                                    disabled={isViewMode}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label text-blue-700">Sertifikalar (Virgülle ayırın)</label>
                                    <input
                                        type="text"
                                        className="form-input border-blue-200 focus:border-blue-500"
                                        value={formData.certifications || ''}
                                        onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                                        placeholder="CISA, ISO 27001, CIA..."
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label text-purple-700">Yetenekler (Virgülle ayırın)</label>
                                    <input
                                        type="text"
                                        className="form-input border-purple-200 focus:border-purple-500"
                                        value={formData.skills || ''}
                                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                        placeholder="Python, SQL, Veri Analizi..."
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Kariyer Geçmişi Sekmesi */}
                    {activeTab === 'career' && editingStaff && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <History size={18} className="text-primary" />
                                        Kariyer ve Terfi Geçmişi
                                    </h3>
                                    <p className="text-xs text-gray-500">Personelin kurum içi ünvan ve görev değişimleri.</p>
                                </div>
                                {!isViewMode && (hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('Admin') || hasRole('Yönetici')) && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => openPromotionModal()}
                                    >
                                        <TrendingUp size={14} className="mr-1.5" /> Terfi Ekle
                                    </Button>
                                )}
                            </div>

                            <div className="relative pl-8 border-l-2 border-gray-100 ml-4 space-y-8">
                                {/* Mevcut Ünvan Dönemi */}
                                <div className="relative">
                                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-sm">
                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border-2 border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            {/* TrendingUp ikonu kaldırıldı — karışıklığa yol açıyordu */}
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs font-bold text-primary uppercase tracking-wider">Mevcut Ünvan</div>
                                                <div className="text-xl font-bold text-gray-900 mt-1">{editingStaff.title}</div>
                                            </div>
                                            <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-tight">
                                                Aktif
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-center gap-4 mt-3">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {editingStaff.promotions && editingStaff.promotions.length > 0
                                                    ? formatDate(editingStaff.promotions[0].promotionDate)
                                                    : formatDate(editingStaff.hireDate)} - Günümüz
                                            </span>
                                            <span className="flex items-center gap-1.5 font-medium text-primary bg-primary/5 px-2 py-0.5 rounded">
                                                <History size={14} />
                                                {(() => {
                                                    const startDateStr = editingStaff.promotions && editingStaff.promotions.length > 0
                                                        ? editingStaff.promotions[0].promotionDate
                                                        : editingStaff.hireDate;

                                                    if (!startDateStr) return '-';

                                                    const start = new Date(startDateStr);
                                                    if (isNaN(start.getTime())) return '-';

                                                    const now = new Date();
                                                    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
                                                    return months >= 12
                                                        ? `${Math.floor(months / 12)} Yıl ${months % 12 > 0 ? months % 12 + ' Ay' : ''}`
                                                        : `${months || 1} Ay`;
                                                })()}
                                            </span>
                                        </div>


                                    </div>

                                </div>

                                {/* Geçmiş Dönemler */}
                                {editingStaff.promotions?.map((promo: any, index: number) => {
                                    const prevTitle = promo.previousTitle || 'İşe Giriş Ünvanı';

                                    return (
                                        <div key={promo.id || index} className="relative">
                                            <div className="absolute -left-[38px] top-1.5 w-4 h-4 rounded-full bg-gray-200 ring-4 ring-white shadow-sm group-hover:bg-primary/40 transition-colors"></div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mb-2">
                                                    <span>{prevTitle}</span>
                                                    <ArrowRight size={12} className="text-gray-300" />
                                                    <span className="text-gray-600 font-bold">{promo.title}</span>
                                                    <span className={`ml-auto px-2 py-0.5 rounded uppercase text-[10px] border ${promo.type === 'Terfi' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        promo.type === 'Atama' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                            'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {promo.type || 'Terfi'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="text-sm text-gray-500 flex items-center gap-3">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar size={14} />
                                                            {formatDate(promo.promotionDate)}
                                                            {promo.endDate && ` - ${formatDate(promo.endDate)}`}
                                                        </span>
                                                    </div>
                                                    {!isViewMode && (
                                                        <div className="flex gap-2">
                                                            <ActionMenu items={[
                                                                { label: 'Düzenle', icon: Edit2, onClick: () => openPromotionModal(promo) },
                                                                { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => handleDeletePromotion(promo.id) }
                                                            ]} />
                                                        </div>
                                                    )}
                                                </div>
                                                {promo.notes && (
                                                    <div className="mt-3 text-sm text-gray-600 bg-white/50 p-2 rounded-lg border border-gray-100 italic">
                                                        "{promo.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Kuruma Giriş */}
                                <div className="relative">
                                    <div className="absolute -left-[38px] top-1.5 w-4 h-4 rounded-full bg-gray-100 ring-4 ring-white shadow-sm"></div>
                                    <div className="text-sm text-gray-500 py-2">
                                        <span className="font-bold text-gray-800">Kuruma Giriş</span>
                                        <span className="mx-2">•</span>
                                        <span>{formatDate(editingStaff.hireDate)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bağımsızlık ve Objektiflik Beyanı Sekmesi */}
                    {activeTab === 'independence' && editingStaff && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Başlık ve Butonlar */}
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Shield size={18} className="text-indigo-600" /> Bağımsızlık ve Objektiflik Beyanı
                                    </h3>
                                    <p className="text-xs text-gray-500">İç denetim mesleki etik ve bağımsızlık ilkelerine uyum beyanları.</p>
                                </div>
                                {!isDeclaring && user?.id === editingStaff.id && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setIsDeclaring(true)}
                                    >
                                        <Plus size={14} className="mr-1.5" /> Yeni Beyan Doldur
                                    </Button>
                                )}
                            </div>

                            {/* DOLDURMA FORMU */}
                            {isDeclaring ? (
                                <form onSubmit={handleCreateDeclaration} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center border-b pb-3">
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                            <FileText size={16} className="text-primary" /> {new Date().getFullYear()} Yılı Yıllık Bağımsızlık Beyanı
                                        </h4>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsDeclaring(false)}
                                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Beyan Yılı</label>
                                            <input 
                                                type="number" 
                                                className="form-input" 
                                                value={declarationForm.year} 
                                                disabled 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Beyan Türü</label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={declarationForm.declarationType} 
                                                disabled 
                                            />
                                        </div>
                                    </div>

                                    {/* BEYAN SORULARI */}
                                    <div className="space-y-4">
                                        {/* Soru 1 */}
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-sm text-gray-900">1. Finansal İlişki / Çıkar Çatışması</h5>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Denetlenen/denetlenecek birimlerde kendimin veya birinci derece yakınlarımın doğrudan/dolaylı finansal çıkarı, pay sahipliği veya ticari ortaklığı bulunmamaktadır.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs font-semibold text-gray-500">İstisna Var mı?</span>
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                        checked={declarationForm.hasFinancialLink}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, hasFinancialLink: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                            {declarationForm.hasFinancialLink && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="form-label text-xs font-semibold text-red-600">Lütfen İlişki ve Çıkar Detaylarını Giriniz:</label>
                                                    <textarea 
                                                        className="form-input text-sm mt-1 bg-white" 
                                                        rows={2} 
                                                        placeholder="Örn: X A.Ş.'de eşimin %5 hisse ortaklığı bulunmaktadır..."
                                                        value={declarationForm.financialDetails}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, financialDetails: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Soru 2 */}
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-sm text-gray-900">2. Aile / Yakınlık İlişkisi</h5>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Denetlenen/denetlenecek birimlerde veya bu birimlerin bağlı olduğu karar organlarında birinci veya ikinci derece akrabalarım üst düzey yönetici veya imza yetkilisi pozisyonunda çalışmamaktadır.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs font-semibold text-gray-500">İstisna Var mı?</span>
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                        checked={declarationForm.hasFamilyLink}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, hasFamilyLink: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                            {declarationForm.hasFamilyLink && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="form-label text-xs font-semibold text-red-600">Lütfen Akrabalık ve Pozisyon Detaylarını Giriniz:</label>
                                                    <textarea 
                                                        className="form-input text-sm mt-1 bg-white" 
                                                        rows={2} 
                                                        placeholder="Örn: X Daire Müdürlüğünde öz ağabeyim birim müdürü olarak görev yapmaktadır..."
                                                        value={declarationForm.familyDetails}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, familyDetails: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Soru 3 */}
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-sm text-gray-900">3. Yakın Dönem Çalışma Geçmişi</h5>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Son 1 yıl (12 ay) içerisinde denetlenen veya denetlenecek birimlerde operasyonel, idari, yönetimsel veya finansal bir görevde bulunmadım.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs font-semibold text-gray-500">İstisna Var mı?</span>
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                        checked={declarationForm.hasPreviousRole}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, hasPreviousRole: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                            {declarationForm.hasPreviousRole && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="form-label text-xs font-semibold text-red-600">Lütfen Geçmiş Görev Detaylarını Giriniz:</label>
                                                    <textarea 
                                                        className="form-input text-sm mt-1 bg-white" 
                                                        rows={2} 
                                                        placeholder="Örn: Son 6 aya kadar Kredi Tahsis Birimi'nde Kıdemli Uzman olarak görev yapmaktaydım..."
                                                        value={declarationForm.previousRoleDetails}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, previousRoleDetails: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Soru 4 */}
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-sm text-gray-900">4. Diğer Objektiflik Riskleri ve Çıkar Çatışmaları</h5>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Denetim faaliyetlerimi bağımsız ve tarafsız yürütmemi engelleyecek veya üçüncü şahıslar nezdinde bağımsızlığıma gölge düşürecek herhangi bir durum veya çıkar çatışması bulunmamaktadır.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs font-semibold text-gray-500">İstisna Var mı?</span>
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                        checked={declarationForm.hasConflict}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, hasConflict: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                            {declarationForm.hasConflict && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="form-label text-xs font-semibold text-red-600">Lütfen Çıkar Çatışması Detaylarını Giriniz:</label>
                                                    <textarea 
                                                        className="form-input text-sm mt-1 bg-white" 
                                                        rows={2} 
                                                        placeholder="Örn: Denetim kapsamındaki X tedarikçi firmasının yönetim kurulu üyesiyle doğrudan yakınlığım vardır..."
                                                        value={declarationForm.conflictDetails}
                                                        onChange={(e) => setDeclarationForm({ ...declarationForm, conflictDetails: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* TAAHHÜT METNİ VE İMZA */}
                                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-3">
                                        <div className="flex gap-3 items-start">
                                            <input 
                                                id="agreed-checkbox"
                                                type="checkbox" 
                                                className="w-4.5 h-4.5 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500 mt-1"
                                                checked={declarationForm.agreedToTerms}
                                                onChange={(e) => setDeclarationForm({ ...declarationForm, agreedToTerms: e.target.checked })}
                                            />
                                            <label htmlFor="agreed-checkbox" className="text-xs text-indigo-950 font-medium leading-relaxed cursor-pointer select-none">
                                                <strong>TAAHHÜTNAMEDİR:</strong> Yukarıda beyan ettiğim bilgilerin doğru, güncel ve eksiksiz olduğunu beyan ederim. Denetim çalışmalarımı uluslararası mesleki standartlar, genel etik kurallar ve kurumumuz politikaları doğrultusunda tarafsız, objektif ve dürüstlük ilkelerine bağlı kalarak yürüteceğimi; bağımsızlığımı tehlikeye düşürecek veya çıkar çatışması doğurabilecek herhangi bir yeni durumu derhal Teftiş Kurulu Müdürlüğü'ne yazılı olarak bildireceğimi taahhüt ederim. İşbu beyan, dijital ortamda e-imza hükmünde onaylanmıştır.
                                            </label>
                                        </div>
                                    </div>

                                    {/* FORM AKSİYONLARI */}
                                    <div className="flex gap-3 justify-end border-t pt-4">
                                        <Button variant="secondary" onClick={() => setIsDeclaring(false)} disabled={loading}>
                                            İptal
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={loading} isLoading={loading}>
                                            Beyanı Gönder ve İmzala
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    {/* ÖZET DURUM KARTLARI */}
                                    {loadingDeclarations ? (
                                        <div className="py-8 flex justify-center"><RefreshCw className="animate-spin text-primary" size={24} /></div>
                                    ) : (
                                        (() => {
                                            const currentYear = new Date().getFullYear();
                                            const currentYearDecl = declarations.find(d => d.year === currentYear);

                                            if (currentYearDecl) {
                                                const hasIssues = currentYearDecl.hasConflict || currentYearDecl.hasFinancialLink ||
                                                    currentYearDecl.hasFamilyLink || currentYearDecl.hasPreviousRole || currentYearDecl.hasOtherIssue;

                                                if (currentYearDecl.status === 'Onaylandı') {
                                                    return (
                                                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                <CheckCircle size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-emerald-900 text-base">{currentYear} Yılı Bağımsızlık Beyanı Geçerli</h4>
                                                                <p className="text-sm text-emerald-800 mt-1">
                                                                    Personelin {currentYear} yılı yıllık bağımsızlık ve objektiflik beyanı incelenmiş ve onaylanmıştır. Herhangi bir çıkar çatışması veya bağımsızlık ihlali bulunmamaktadır.
                                                                </p>
                                                                <div className="mt-3 text-xs text-emerald-600 flex items-center gap-2">
                                                                    <span>Onay Tarihi: {formatDate(currentYearDecl.reviewedAt || currentYearDecl.updated_at)}</span>
                                                                    {currentYearDecl.reviewNotes && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>Not: {currentYearDecl.reviewNotes}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (currentYearDecl.status === 'Sorun Var' || hasIssues) {
                                                    return (
                                                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                <AlertCircle size={24} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-amber-900 text-base">{currentYear} Yılı İstisna Bildirimi / Riskli Beyan</h4>
                                                                <p className="text-sm text-amber-800 mt-1">
                                                                    Bu personel için {currentYear} yılı beyanında çıkar çatışması oluşturabilecek istisna veya ilişkiler bildirilmiştir. Denetim görevlendirmelerinde bu ilişkilerin gözetilmesi gerekmektedir.
                                                                </p>
                                                                {/* İstisna Özetleri */}
                                                                <div className="mt-3 grid grid-cols-1 gap-2 bg-amber-100/50 p-3 rounded-lg border border-amber-200/50 text-xs text-amber-900">
                                                                    {currentYearDecl.hasFinancialLink && <div><strong>Finansal İlişki:</strong> {currentYearDecl.financialDetails}</div>}
                                                                    {currentYearDecl.hasFamilyLink && <div><strong>Akrabalık İlişkisi:</strong> {currentYearDecl.familyDetails}</div>}
                                                                    {currentYearDecl.hasPreviousRole && <div><strong>Yakın Dönem Çalışma:</strong> {currentYearDecl.previousRoleDetails}</div>}
                                                                    {currentYearDecl.hasConflict && <div><strong>Diğer Çıkar Çatışması:</strong> {currentYearDecl.conflictDetails}</div>}
                                                                </div>
                                                                <div className="mt-3 text-xs text-amber-700 flex items-center gap-2">
                                                                    <span>Beyan Tarihi: {formatDate(currentYearDecl.declaredAt)}</span>
                                                                    {currentYearDecl.reviewedAt && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>İncelenme: {formatDate(currentYearDecl.reviewedAt)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                <Clock size={24} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-indigo-900 text-base">{currentYear} Yılı Beyanı İnceleniyor</h4>
                                                                <p className="text-sm text-indigo-800 mt-1">
                                                                    Yıllık bağımsızlık beyanı başarıyla gönderilmiştir. Kurul Müdürü veya onaylayıcı yöneticinin incelemesi beklenmektedir.
                                                                </p>
                                                                <div className="mt-2.5 text-xs text-indigo-600">
                                                                    Beyan Tarihi: {formatDate(currentYearDecl.declaredAt)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            } else {
                                                return (
                                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-slate-400 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                                                            <Shield size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-base">{currentYear} Yılı Yıllık Beyanı Doldurulmamış</h4>
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                {user?.id === editingStaff.id 
                                                                    ? 'Bu yıla ait bağımsızlık ve objektiflik beyanınız henüz oluşturulmamıştır. Her yıl ocak ayında veya göreve başlandığında beyanın yenilenmesi gerekmektedir.'
                                                                    : 'Personel için bu yıla ait bağımsızlık ve objektiflik beyanı henüz oluşturulmamıştır. Personel tarafından beyan girişi yapılması beklenmektedir.'
                                                                }
                                                            </p>
                                                            {user?.id === editingStaff.id && (
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="mt-3"
                                                                    onClick={() => setIsDeclaring(true)}
                                                                >
                                                                    Şimdi Beyan Oluştur
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })()
                                    )}

                                    {/* YÖNETİCİ İNCELEME PANELİ (MODAL GİBİ DEĞİL, DETAYLARIN ALTINDA AÇILIR) */}
                                    {reviewingDeclarationId && (
                                        <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                <UserCheck size={16} className="text-primary" /> Bağımsızlık Beyanını Değerlendir
                                            </h4>
                                            <div className="form-group">
                                                <label className="form-label">Değerlendirme Notları / Tedbirler</label>
                                                <textarea 
                                                    className="form-input bg-white" 
                                                    rows={3} 
                                                    placeholder="Örn: Bildirilen çıkar çatışması makuldür. İlgili personel X biriminin denetiminde görevlendirilmeyecektir..."
                                                    value={reviewNotes}
                                                    onChange={(e) => setReviewNotes(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="secondary" size="sm" onClick={() => setReviewingDeclarationId(null)}>
                                                    İptal
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleReviewDeclaration(reviewingDeclarationId, 'Sorun Var')}>
                                                    Riskli/Sorunlu İşaretle
                                                </Button>
                                                <Button variant="primary" size="sm" onClick={() => handleReviewDeclaration(reviewingDeclarationId, 'Onaylandı')}>
                                                    Uyumlu Olarak Onayla
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* BEYAN GEÇMİŞİ TABLOSU */}
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                            <History size={16} className="text-slate-500" /> Beyan Geçmişi Logları
                                        </h4>
                                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-bold text-gray-600">Tür / Yıl</th>
                                                        <th className="px-4 py-3 text-left font-bold text-gray-600">Beyan Tarihi</th>
                                                        <th className="px-4 py-3 text-left font-bold text-gray-600">Durum</th>
                                                        <th className="px-4 py-3 text-left font-bold text-gray-600">Bildirilen İstisna</th>
                                                        <th className="px-4 py-3 text-left font-bold text-gray-600">Aksiyonlar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {declarations.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 font-medium">
                                                                Henüz bağımsızlık beyanı kaydı bulunmamaktadır.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        declarations.map((item) => {
                                                            const hasIssues = item.hasConflict || item.hasFinancialLink ||
                                                                item.hasFamilyLink || item.hasPreviousRole || item.hasOtherIssue;

                                                            return (
                                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                                                        {item.year ? `${item.year} - Yıllık Beyan` : item.declarationType}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-gray-500">
                                                                        {formatDate(item.declaredAt)}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                            item.status === 'Onaylandı' 
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                : item.status === 'Sorun Var'
                                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                                        }`}>
                                                                            {item.status === 'Onaylandı' ? 'Uyumlu' : item.status === 'Sorun Var' ? 'İstisna Mevcut' : 'Bekliyor'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {hasIssues ? (
                                                                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                                                                                İlişki Beyan Edilmiş
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold">
                                                                                Yok (Tam Bağımsız)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <div className="flex gap-2 justify-end">
                                                                            {/* Yönetici Onay Aksiyonu */}
                                                                            {item.status !== 'Onaylandı' && (hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('Teftiş Kurulu Müdürü') || hasRole('SYSTEM_ADMIN')) && (
                                                                                <button 
                                                                                    type="button"
                                                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                                                                    onClick={() => {
                                                                                        setReviewingDeclarationId(item.id);
                                                                                        setReviewNotes(item.reviewNotes || '');
                                                                                    }}
                                                                                >
                                                                                    Değerlendir
                                                                                </button>
                                                                            )}

                                                                            {/* Silme Aksiyonu (Onaylanmamışsa ve sahibi ise) */}
                                                                            {item.status !== 'Onaylandı' && user?.id === item.userId && (
                                                                                <button 
                                                                                    type="button"
                                                                                    className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1 rounded transition-colors"
                                                                                    onClick={() => handleDeleteDeclaration(item.id)}
                                                                                    title="Geri Çek / Sil"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Deneyim Sekmesi */}
                    {activeTab === 'experience' && editingStaff && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Briefcase size={18} className="text-primary" /> İş Deneyimleri
                                    </h3>
                                    <p className="text-xs text-gray-500">Özgeçmişte görüntülenecek iş geçmişi.</p>
                                </div>
                                {!isViewMode && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => openExperienceModal()}
                                    >
                                        <Plus size={14} className="mr-1.5" /> Deneyim Ekle
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {(editingStaff.experiences || []).length === 0 ? (
                                    <EmptyState
                                        title="Deneyim Bilgisi Yok"
                                        description="Bu personel için henüz deneyim bilgisi eklenmemiş."
                                    />
                                ) : (
                                    [...(editingStaff.experiences || [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((exp: any) => (
                                        <div key={exp.id} className="p-4 bg-white border rounded-xl hover:shadow-md transition-shadow relative">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-gray-900">{exp.position}</div>
                                                    <div className="text-primary font-medium">{exp.companyName}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                        <Calendar size={12} />
                                                        {formatDate(exp.startDate)} -
                                                        {exp.isCurrent ? 'Devam Ediyor' : formatDate(exp.endDate)}
                                                    </div>
                                                </div>
                                                {!isViewMode && (
                                                    <div className="flex gap-2">
                                                        <ActionMenu items={[
                                                            { label: 'Düzenle', icon: Edit2, onClick: () => openExperienceModal(exp) },
                                                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => handleDeleteExperience(exp.id) }
                                                        ]} />
                                                    </div>
                                                )}
                                            </div>
                                            {exp.description && <div className="mt-3 text-sm text-gray-600 border-t pt-2">{exp.description}</div>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Eğitim Sekmesi */}
                    {activeTab === 'education' && editingStaff && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Calendar size={18} className="text-primary" /> Eğitim Bilgileri
                                    </h3>
                                    <p className="text-xs text-gray-500">Üniversite ve akademik geçmiş.</p>
                                </div>
                                {!isViewMode && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<Plus size={16} />}
                                        onClick={() => openEducationModal()}
                                    >
                                        Eğitim Ekle
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {(editingStaff.education || []).length === 0 ? (
                                    <EmptyState
                                        title="Eğitim Bilgisi Yok"
                                        description="Henüz akademik eğitim bilgisi girilmemiş."
                                        icon={Calendar}
                                    />
                                ) : (
                                    [...(editingStaff.education || [])].sort((a, b) => (Number(b.graduationYear) || 0) - (Number(a.graduationYear) || 0)).map((edu: any) => (
                                        <div key={edu.id} className="p-4 bg-white border rounded-xl hover:shadow-md transition-shadow relative">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-gray-900">{String(edu.schoolName || '')}</div>
                                                    <div className="text-primary font-medium">{String(edu.department || '')} • {String(edu.degree || '')}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                        <Calendar size={12} />
                                                        Mezuniyet: {edu.graduationYear || '-'}
                                                    </div>
                                                </div>
                                                {!isViewMode && (
                                                    <div className="flex gap-2">
                                                        <ActionMenu items={[
                                                            { label: 'Düzenle', icon: Edit2, onClick: () => openEducationModal(edu) },
                                                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => handleDeleteEducation(edu.id) }
                                                        ]} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'trainings' && editingStaff && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-primary" /> Mesleki Eğitim & CPE
                                    </h3>
                                    <p className="text-xs text-gray-500">Kişisel gelişim ve teknik eğitim geçmişi.</p>
                                </div>
                                {!isViewMode && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<Plus size={16} />}
                                        onClick={() => openTrainingModal()}
                                    >
                                        Eğitim Girişi
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {(editingStaff.trainings || []).length === 0 ? (
                                    <EmptyState
                                        title="Eğitim Kaydı Yok"
                                        description="Bu personel için henüz bir mesleki eğitim girişi yapılmamış."
                                        icon={Award}
                                    />
                                ) : (
                                    [...(editingStaff.trainings || [])].sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()).map((trn: any) => (
                                        <div key={trn.id} className={`p-4 bg-white border rounded-xl hover:shadow-md transition-all relative ${trn.status === 'İptal Edildi' ? 'opacity-60 bg-gray-50' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-bold text-gray-900">{String(trn.name || '')}</div>
                                                        <StatusBadge value={trn.status} />
                                                        
                                                    </div>
                                                    <div className="text-gray-600 text-sm font-medium">{String(trn.provider || 'Kurum İçi')}</div>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <DateDisplay
                                                            date={trn.startDate}
                                                            endDate={trn.endDate !== trn.startDate ? trn.endDate : undefined}
                                                            className="text-xs text-gray-500"
                                                        />
                                                        {trn.hours && (
                                                            <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                <Award size={12} /> {trn.hours} Saat CPE
                                                            </div>
                                                        )}
                                                    </div>
                                                    {trn.batch && trn.status === 'İptal Edildi' && trn.batch.cancellationNotes && (
                                                        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-start gap-2">
                                                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                            <div><strong>İptal Gerekçesi:</strong> {trn.batch.cancellationNotes}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                {!isViewMode && (
                                                    <div className="flex gap-1">
                                                        <ActionMenu items={[
                                                            { label: 'Düzenle', icon: Edit2, onClick: () => openTrainingModal(trn) },
                                                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => handleDeleteTraining(trn.id) }
                                                        ]} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </Modal >

            <PromotionModal
                isOpen={isPromotionModalOpen}
                onClose={() => setIsPromotionModalOpen(false)}
                onSave={handlePromotionSave}
                promotionForm={promotionForm}
                setPromotionForm={setPromotionForm}
                loading={loading}
                selectedParentDept={selectedParentDept}
                setSelectedParentDept={setSelectedParentDept}
                editingStaffTitle={editingStaff?.title}
            />

            <ExperienceModal
                isOpen={isExperienceModalOpen}
                onClose={() => setIsExperienceModalOpen(false)}
                onSave={handleExperienceSave}
                experienceForm={experienceForm}
                setExperienceForm={setExperienceForm}
                isEditing={!!editingExperience}
                loading={loading}
                selectedParentExp={selectedParentExp}
                setSelectedParentExp={setSelectedParentExp}
            />

            <EducationModal
                isOpen={isEducationModalOpen}
                onClose={() => setIsEducationModalOpen(false)}
                onSave={handleEducationSave}
                educationForm={educationForm}
                setEducationForm={setEducationForm}
                isEditing={!!editingEducation}
                loading={loading}
            />

            <TrainingModal
                isOpen={isTrainingModalOpen}
                onClose={() => setIsTrainingModalOpen(false)}
                onSave={handleTrainingSave}
                trainingForm={trainingForm}
                setTrainingForm={setTrainingForm}
                isEditing={!!editingTraining}
                loading={loading}
            />

            <BulkTrainingModal
                isOpen={isBulkTrainingModalOpen}
                onClose={() => setIsBulkTrainingModalOpen(false)}
                onSave={handleBulkTrainingSave}
                bulkTrainingForm={bulkTrainingForm}
                setBulkTrainingForm={setBulkTrainingForm}
                staffList={staffList}
                loading={loading}
            />

            {/* Silme Onay Modalleri */}
            < ConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Personel Sil"
                message="Bu personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                type="danger"
            />

            <ConfirmModal
                isOpen={!!deletePromotionId}
                onClose={() => setDeletePromotionId(null)}
                onConfirm={confirmDeletePromotion}
                title="Kayıt Sil"
                message="Bu kariyer kaydını silmek istediğinize emin misiniz?"
                confirmText="Sil"
                type="danger"
            />

            <ConfirmModal
                isOpen={!!deleteExperienceId}
                onClose={() => setDeleteExperienceId(null)}
                onConfirm={confirmDeleteExperience}
                title="Deneyim Sil"
                message="Bu deneyim kaydını silmek istediğinize emin misiniz?"
                confirmText="Sil"
                type="danger"
            />

            <ConfirmModal
                isOpen={!!deleteEducationId}
                onClose={() => setDeleteEducationId(null)}
                onConfirm={confirmDeleteEducation}
                title="Eğitim Sil"
                message="Bu eğitim kaydını silmek istediğinize emin misiniz?"
                confirmText="Sil"
                type="danger"
            />

            <ConfirmModal
                isOpen={!!deleteTrainingId}
                onClose={() => setDeleteTrainingId(null)}
                onConfirm={confirmDeleteTraining}
                title="Eğitimi Sil"
                message="Bu mesleki eğitim kaydını silmek istediğinize emin misiniz?"
                confirmText="Sil"
                type="danger"
            />

            {/* Neden Modalı */}
            <Modal
                isOpen={isReasonModalOpen}
                onClose={() => setIsReasonModalOpen(false)}
                title="Özgeçmiş Oluşturma Nedeni"
                size="md"
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <Button variant="secondary" onClick={() => setIsReasonModalOpen(false)}>İptal</Button>
                        <Button onClick={handleConfirmResume}>Özgeçmişi Hazırla</Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Özgeçmiş raporu oluşturulmadan önce, kurumsal politika veya yasal mevzuat gereği talep nedenini belirtmeniz gerekmektedir.</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Talep/Oluşturma Nedeni</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: Denetim Talebi, Atama Süreci vb."
                            value={creationReason}
                            onChange={(e) => setCreationReason(e.target.value)}
                            autoFocus
                        />
                    </div>

                </div>
            </Modal>

        </>
    );
    return pageContent;
}


