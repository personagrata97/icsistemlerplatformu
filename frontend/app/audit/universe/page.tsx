'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Globe, Building, Users, MapPin, Search, Plus, Filter, ChevronDown, ChevronRight, ChevronUp, Edit2, Trash2, X, RefreshCw, Download, AlertTriangle, CheckCircle, Shield, TrendingUp, Calendar, FileText, Briefcase, Scale, Activity, Upload, Table, LayoutGrid, GitBranch, Maximize } from 'lucide-react';
import { DateDisplay } from '@/components/ui/DateDisplay';
import PageHeader from '@/components/audit/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';

import { auditApi } from '@/lib/audit-api';
import Modal from '@/components/ui/Modal';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import RefreshButton from '@/components/ui/RefreshButton';
import { useToast } from '@/components/Toast';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import ConfirmModal from '@/components/ConfirmModal';
import CustomSelect from '@/components/ui/CustomSelect';
import { clsx } from 'clsx';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState, { NoResultsState, NoDataState } from '@/components/ui/EmptyState';
import CodeBadge from '@/components/ui/CodeBadge';
import RiskHeatmap from '@/components/audit/RiskHeatmap';
import RiskMatrix from '@/components/audit/RiskMatrix';
import Pagination from '@/components/ui/Pagination';
import StatCard from '@/components/ui/StatCard';
import CreateAuditModal from '@/components/audit/CreateAuditModal';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import Checkbox from '@/components/ui/Checkbox';
import { AuditStaff } from '@/lib/audit-api';
import UnitScorecardModal from '@/components/audit/UnitScorecardModal';
import { ActivitySquare } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import { getRiskScoreColor, getRiskLevelFromScore, getAuditCycleFromScore, formatDate } from '@/lib/audit-utils';
import { useAuth } from '@/context/AuthContext';
import { DEPARTMENTS, HIERARCHY } from '@/lib/organization-constants';
import FormInput from "@/components/ui/FormInput";
import { checkRole, ROLES } from '@/lib/auth-constants';

interface AuditableUnit {
    id: string;
    name: string;
    code?: string;
    type: 'Şube' | 'Birim' | 'Süreç' | 'Departman';
    parentId?: string;
    riskLevel: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';
    description?: string;
    manager?: string;
    location?: string;
    employeeCount?: number;
    transactionVolume?: 'Yüksek' | 'Orta' | 'Düşük';
    financialImpact?: 'Yüksek' | 'Orta' | 'Düşük';
    riskScore?: number;
    residualRiskScore?: number;
    auditCycle?: number;
    lastAuditDate?: string;
    nextAuditDate?: string;
    estimatedDays?: number;
    status: 'Aktif' | 'Pasif';
    notes?: string;
    // Yeni Alanlar
    strategicAlignment?: string;
    businessCriticality?: 'Yüksek' | 'Orta' | 'Düşük' | string;
    regulations?: string;
    mandatoryAudit?: boolean;
    lastAuditResult?: string;
    openFindingsCount?: number;
    inherentRisk?: 'Yüksek' | 'Orta' | 'Düşük' | string;
    controlEffectiveness?: 'Güçlü' | 'Orta' | 'Zayıf' | string;
    changeRisk?: boolean;
    requiredExpertise?: string;
    previousAuditDays?: number;
    // RCM Data
    processes?: Array<{
        id: string;
        name: string;
        risks?: Array<{
            id: string;
            name: string;
            level: string;
            controls?: Array<{
                id: string;
                name: string;
                type: string;
                effectiveness: string;
                tests?: Array<{
                    id: string;
                    testResult: string;
                    testDate: string;
                    audit: { auditCode: string; title: string };
                }>;
            }>;
        }>;
    }>;
    controls?: any[]; // Geriye uyumluluk için
    // Dinamik Risk Matrisi Alanları (Uluslararası Denetim Standartları)
    impactScore?: number;
    likelihoodScore?: number;
    riskCategory?: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';
    // M15: Bütçe ve Planlama Alanları
    annualBudget?: number;           // Yıllık denetim bütçesi (adam/gün)
    actualDaysSpent?: number;        // Gerçekleşen denetim günleri
    plannedAuditCount?: number;      // Planlanan yıllık denetim sayısı
    branchRiskParameters?: {         // Şube özel risk parametreleri
        customerComplaintRate?: number;   // Müşteri şikayet oranı
        transactionErrorRate?: number;    // İşlem hata oranı
        regulatoryFineHistory?: boolean;  // İdari para cezası geçmişi
        staffTurnoverRate?: number;       // Personel devir hızı
    };
}

type NewUnitType = Omit<AuditableUnit, 'id'>;

// Risk hesaplama - Dinamik ve Standart metodoloji
const calculateRiskScore = (unit: Partial<NewUnitType>): number => {
    // Dinamik Risk Matrisi kontrolü (Yeni Sistem)
    if (unit.impactScore && unit.likelihoodScore) {
        // impactScore (1-5) × likelihoodScore (1-5) = 1-25
        // 100 üzerinden değer elde etmek için 4 ile çarpılır.
        return Math.min(100, Math.max(0, unit.impactScore * unit.likelihoodScore * 4));
    }

    // Geleneksel hesaplama
    const impactScoreMap: Record<string, number> = { 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 };
    const controlScore: Record<string, number> = { 'Zayıf': 3, 'Orta': 2, 'Güçlü': 1 };

    const financialVal = impactScoreMap[unit.financialImpact || 'Düşük'] || 1;
    const volumeVal = impactScoreMap[unit.transactionVolume || 'Düşük'] || 1;
    const inherentVal = impactScoreMap[unit.inherentRisk || 'Düşük'] || 1;
    const controlVal = controlScore[unit.controlEffectiveness || 'Güçlü'] || 1;
    const criticalityVal = impactScoreMap[unit.businessCriticality || 'Düşük'] || 1;
    const changeVal = unit.changeRisk ? 1.2 : 1;
    const mandatoryVal = unit.mandatoryAudit ? 1.1 : 1;

    let employeeVal = 1;
    if (unit.employeeCount) {
        if (unit.employeeCount > 50) employeeVal = 3;
        else if (unit.employeeCount >= 20) employeeVal = 2;
    }

    // Maksimum skor hesabı: (3*3 + 3*2 + 3*2 + 3*2 + 3*1 + 3*1) = 33
    const baseScore = (financialVal * 3 + volumeVal * 2 + inherentVal * 2 + controlVal * 2 + criticalityVal + employeeVal) / 33 * 100;
    const adjustedScore = Math.round(baseScore * changeVal * mandatoryVal);
    return Math.min(100, Math.max(0, adjustedScore));
};

// Artık risk hesaplama — doğal risk × kontrol etkinliği indirimi
const calculateResidualRisk = (unit: Partial<AuditableUnit>): number => {
    const inherentScore = calculateRiskScore(unit);
    const controlDiscount: Record<string, number> = { 'Güçlü': 0.4, 'Orta': 0.7, 'Zayıf': 1.0 };
    let discount = controlDiscount[unit.controlEffectiveness || 'Orta'] || 0.7;

    // --- Dinamik Test Sonucu Etkisi ---
    // Eğer birim içinde 'Olumsuz' test sonucu varsa, kontrol indirimini cezalandır
    let hasNegativeTest = false;
    let totalTests = 0;
    let negativeTests = 0;

    unit.processes?.forEach(p => {
        p.risks?.forEach(r => {
            r.controls?.forEach(c => {
                const lastResult = c.tests?.[0]?.testResult;
                if (lastResult) {
                    totalTests++;
                    if (lastResult === 'Olumsuz') {
                        hasNegativeTest = true;
                        negativeTests++;
                    }
                }
            });
        });
    });

    if (hasNegativeTest) {
        // En az bir olumsuz test varsa indirim oranını kötüleştir (0.2 ceza puanı)
        discount = Math.min(1.0, discount + 0.2);
        // Eğer testlerin %50'den fazlası olumsuzsa direkt Zayıf (1.0) kabul et
        if (negativeTests / totalTests > 0.5) discount = 1.0;
    }

    return Math.min(100, Math.max(0, Math.round(inherentScore * discount)));
};





const INITIAL_UNIT: NewUnitType = {
    name: '',
    code: '',
    type: '' as any,
    riskLevel: 'Orta',
    description: '',
    manager: '',
    location: '',
    employeeCount: undefined,
    transactionVolume: 'Orta',
    financialImpact: 'Orta',
    riskScore: 50,
    auditCycle: 3,
    estimatedDays: 5,
    status: 'Aktif',
    notes: '',
    strategicAlignment: '',
    businessCriticality: 'Orta',
    regulations: '',
    mandatoryAudit: false,
    lastAuditResult: undefined,
    openFindingsCount: 0,
    inherentRisk: 'Orta',
    controlEffectiveness: 'Orta',
    changeRisk: false,
    requiredExpertise: '',
    previousAuditDays: undefined,
    impactScore: undefined,
    likelihoodScore: undefined,
    riskCategory: 'Orta'
};

// Ağaç Düğümü Bileşeni (Rekürsif)
const TreeNode = ({ node, units, level, onEdit, onDelete, onViewRCM, onAdd, onViewScorecard }: { node: any, units: AuditableUnit[], level: number, onEdit: (unit: AuditableUnit) => void, onDelete: (unitId: string) => void, onViewRCM: (unitId: string) => void, onAdd: () => void, onViewScorecard: (unitName: string) => void }) => {
    const [isOpen, setIsOpen] = useState(level < 1);
    const matchingUnits = units.filter(u =>
        u.name === node.title ||
        (u.parentId === node.title) ||
        (u.type === "Birim" && (u.description || '').includes(node.title)) ||
        (u.type === "Süreç" && (u.description || '').includes(node.title))
    );
    const hasChildren = node.children && node.children.length > 0;
    const hasUnits = matchingUnits.length > 0;

    return (
        <div className="w-full">
            <div
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-2 ${level === 0 ? 'border-primary bg-blue-50/40 mt-2 mb-1' : 'border-transparent'}`}
                style={{ paddingLeft: `${Math.max(8, (level) * 24)}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-5 flex justify-center">
                    {(hasChildren || hasUnits) ? (
                        <button
                            title={isOpen ? "Daralt" : "Genişlet"}
                            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                            className="p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors"
                        >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    )}
                </div>

                {level === 0 ? <Building size={16} className="text-primary flex-shrink-0" /> : <Briefcase size={14} className="text-gray-500 flex-shrink-0" />}

                <span className={`font-medium text-sm flex-1 ${level === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {node.title}
                </span>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        title="Birim Ekle"
                        onClick={onAdd}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="mt-1 mb-2">
                    {hasUnits && (
                        <div className="space-y-1 mb-2 mt-1" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
                            {matchingUnits.map(unit => (
                                <div key={unit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white border border-gray-100 rounded-md shadow-sm hover:border-primary/40 transition-colors group">
                                    <div className="flex items-start sm:items-center gap-3 mb-2 sm:mb-0">
                                        <div className={`p-1.5 rounded-md ${unit.riskScore && unit.riskScore >= 85 ? 'bg-rose-100 text-rose-600' : unit.riskScore && unit.riskScore >= 65 ? 'bg-red-100 text-red-600' : unit.riskScore && unit.riskScore >= 40 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <Activity size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">{unit.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{unit.type}</span>
                                                {unit.code && <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{unit.code}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pl-9 sm:pl-0">
                                        <div className="flex flex-col items-end">
                                            <StatusBadge value={`${unit.riskScore || 0}`} type="risk" size="sm" />
                                            {unit.auditCycle && <span className="text-[10px] text-gray-500 mt-1">Döngü: {unit.auditCycle} Yıl</span>}
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <ActionMenu
                                                variant="ghost"
                                                items={[
                                                    { label: 'RCM Görüntüle', icon: Shield, onClick: () => onViewRCM(unit.id) },
                                                    { label: 'Karne', icon: ActivitySquare, onClick: () => onViewScorecard(unit.name) },
                                                    { label: 'Düzenle', icon: Edit2, onClick: () => onEdit(unit) },
                                                    { type: 'divider' as const },
                                                    { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => onDelete(unit.id) }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasChildren && (
                        <div className="flex flex-col gap-0.5 ml-2 mt-1">
                            {node.children.map((child: any) => (
                                <TreeNode key={child.id} node={child} units={units} level={level + 1} onEdit={onEdit} onDelete={onDelete} onViewRCM={onViewRCM} onAdd={onAdd} onViewScorecard={onViewScorecard} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Organizasyon Ağacı Kapsayıcısı
const OrganizationTree = ({ hierarchy, units, onEdit, onDelete, onViewRCM, onAdd, onViewScorecard }: { hierarchy: any[], units: AuditableUnit[], onEdit: (unit: AuditableUnit) => void, onDelete: (unitId: string) => void, onViewRCM: (unitId: string) => void, onAdd: () => void, onViewScorecard: (unitName: string) => void }) => {
    return (
        <div className="p-2">
            {hierarchy.map((node) => (
                <TreeNode key={node.id} node={node} units={units} level={0} onEdit={onEdit} onDelete={onDelete} onViewRCM={onViewRCM} onAdd={onAdd} onViewScorecard={onViewScorecard} />
            ))}
        </div>
    );
};

export default function AuditUniversePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const canManage = checkRole(hasRole, ROLES.UNIVERSE_MANAGER);

    const [loading, setLoading] = useState(true);
    const [units, setUnits] = useState<AuditableUnit[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterRisk, setFilterRisk] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterMandatory, setFilterMandatory] = useState<string>('');
    const [filterOpenFindings, setFilterOpenFindings] = useState(false);
    const [filterPendingAudits, setFilterPendingAudits] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const filterRef = useRef(null);
    useOnClickOutside(filterRef, () => setShowFilterDropdown(false));
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Şube', 'Birim', 'Süreç', 'Departman']);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isCreateAuditModalOpen, setIsCreateAuditModalOpen] = useState(false);
    const [selectedUnitForAudit, setSelectedUnitForAudit] = useState<AuditableUnit | null>(null);
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [editingUnit, setEditingUnit] = useState<AuditableUnit | null>(null);
    const [newUnit, setNewUnit] = useState<NewUnitType>(INITIAL_UNIT);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [scorecardModal, setScorecardModal] = useState<{isOpen: boolean, unitName: string}>({isOpen: false, unitName: ''});
    const [viewMode, setViewMode] = useState<'grouped' | 'table' | 'heatmap' | 'coverage' | 'tree' | 'matrix'>('table');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedParent, setSelectedParent] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>('riskScore');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const itemsPerPage = 10;

    // Real-world dynamic states for Document Upload and process matrix
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([
        { id: '1', name: 'Birim_Organizasyon_Semasi_2026.pdf', size: '1.2 MB', uploadedBy: 'Sistem Yöneticisi', uploadedAt: '12.01.2026' },
        { id: '2', name: 'Is_Akis_Surec_Tanımları.docx', size: '2.4 MB', uploadedBy: 'Sistem Yöneticisi', uploadedAt: '15.02.2026' }
    ]);
    const [customRcmRows, setCustomRcmRows] = useState<any[]>([]);

    const handleFileUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files).map((file, idx) => ({
            id: Math.random().toString(),
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadedBy: 'Sistem Yöneticisi',
            uploadedAt: new Date().toLocaleDateString('tr-TR')
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
        showToast('Doküman(lar) başarıyla yüklendi', 'success');
    };

    const handleDeleteFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
        showToast('Doküman silindi', 'info');
    };

    const handleAddNewControl = () => {
        if (!editingUnit) return;
        const newControl = {
            id: Math.random().toString(),
            unitId: editingUnit.id,
            processName: 'Müşteri İlişkileri Yönetimi',
            riskName: 'Hatalı veri girişi ve işlem aksamaları',
            inherentRisk: 'Yüksek',
            controlName: 'Günlük mutabakat ve işlem onay kontrolleri',
            controlType: 'Manuel',
            effectiveness: 'Güçlü',
            testResult: 'Olumlu',
            testAuditCode: 'DEN-2026-004',
            testDate: '2026-04-10',
            residualRisk: 'Düşük'
        };
        setCustomRcmRows(prev => [...prev, newControl]);
        showToast('Yeni denetim kontrolü matrise başarıyla eklendi', 'success');
    };

    const handleExportRCM = () => {
        if (rcmData.length === 0) {
            showToast('Dışa aktarılacak veri bulunamadı', 'warning');
            return;
        }
        const headers = ['Surec / Alt Surec', 'Risk Tanimi', 'Dogal Risk', 'Kontrol Tanimi', 'Kontrol Turu', 'Kontrol Etkinligi', 'Son Test Sonucu', 'Denetim Referansi', 'Artik Risk'];
        const rows = rcmData.map(row => [
            row.processName || '-',
            row.riskName || '-',
            row.inherentRisk || '-',
            row.controlName || '-',
            row.controlType || '-',
            row.effectiveness || '-',
            row.testResult || '-',
            row.testAuditCode || '-',
            row.residualRisk || (row.effectiveness === 'Güçlü' ? 'Düşük' : 'Orta')
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers.join(';'), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${editingUnit?.name || 'Birim'}_Risk_Kontrol_Matrisi.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Risk Kontrol Matrisi başarıyla dışa aktarıldı', 'success');
    };

    const handleSort = (col: string) => {
        if (sortColumn === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
        else { setSortColumn(col); setSortDir('desc'); }
    };

    const handleOpenCreateAuditModal = (unit: AuditableUnit) => {
        setSelectedUnitForAudit(unit);
        setIsCreateAuditModalOpen(true);
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const score = calculateRiskScore(newUnit);
        setNewUnit(prev => ({
            ...prev,
            riskScore: score,
            riskLevel: getRiskLevelFromScore(score),
            auditCycle: getAuditCycleFromScore(score)
        }));
    }, [newUnit.financialImpact, newUnit.transactionVolume, newUnit.employeeCount,
    newUnit.inherentRisk, newUnit.controlEffectiveness, newUnit.businessCriticality,
    newUnit.changeRisk, newUnit.mandatoryAudit, newUnit.impactScore, newUnit.likelihoodScore]);

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        try {
            const [data, staffData] = await Promise.all([
                auditApi.getAuditableUnits(),
                auditApi.getStaff()
            ]);
            setUnits(Array.isArray(data) ? data : []);
            setStaffList(Array.isArray(staffData) ? staffData : []);
        } catch (error) {
            console.error('Birim listesi yükleme hatası:', error);
            setUnits([]);
            showToast('Denetim evreni yüklenirken hata oluştu', 'error');
        } finally {
            if (showOverlay) setLoading(false);
        }
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };



    const filteredUnits = useMemo(() => {
        const list = units.filter(u => {
            const q = searchTerm.toLocaleLowerCase('tr-TR');
            const matchesSearch = u.name.toLocaleLowerCase('tr-TR').includes(q) ||
                (u.code && u.code.toLocaleLowerCase('tr-TR').includes(q)) ||
                (u.manager && u.manager.toLocaleLowerCase('tr-TR').includes(q));
            const matchesType = filterType.length === 0 || filterType.includes(u.type);
            const matchesRisk = filterRisk.length === 0 || filterRisk.includes(u.riskLevel);
            const matchesStatus = !filterStatus || (u.status || 'Aktif') === filterStatus;
            const matchesMandatory = !filterMandatory || (filterMandatory === 'Evet' ? u.mandatoryAudit : !u.mandatoryAudit);
            const matchesOpenFindings = !filterOpenFindings || (u.openFindingsCount || 0) > 0;
            const matchesPendingAudits = !filterPendingAudits || (!!u.nextAuditDate && new Date(u.nextAuditDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
            return matchesSearch && matchesType && matchesRisk && matchesStatus && matchesMandatory && matchesOpenFindings && matchesPendingAudits;
        });
        // Sıralama
        list.sort((a: any, b: any) => {
            let va = a[sortColumn], vb = b[sortColumn];
            if (va == null) va = '';
            if (vb == null) vb = '';
            if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
            return sortDir === 'asc' ? String(va).localeCompare(String(vb), 'tr') : String(vb).localeCompare(String(va), 'tr');
        });
        return list;
    }, [units, searchTerm, filterType, filterRisk, filterStatus, filterMandatory, filterOpenFindings, filterPendingAudits, sortColumn, sortDir]);

    // Filtre değiştiğinde sayfalamayı sıfırla
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterRisk, filterStatus, filterMandatory, filterOpenFindings, filterPendingAudits]);

    const displayedUnits = filteredUnits.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const groupedUnits = useMemo(() => {
        return ['Şube', 'Birim', 'Süreç', 'Departman'].reduce((acc, type) => {
            acc[type] = filteredUnits.filter(u => u.type === type);
            return acc;
        }, {} as Record<string, AuditableUnit[]>);
    }, [filteredUnits]);

    const stats = useMemo(() => ({
        total: units.length,
        kritik: units.filter(u => u.riskLevel === 'Kritik').length,
        yuksek: units.filter(u => u.riskLevel === 'Yüksek').length,
        orta: units.filter(u => u.riskLevel === 'Orta').length,
        dusuk: units.filter(u => u.riskLevel === 'Düşük').length,
        avgScore: units.length ? Math.round(units.reduce((sum, u) => sum + (u.riskScore || 0), 0) / units.length) : 0,
        openFindings: units.reduce((sum, u) => sum + (u.openFindingsCount || 0), 0),
        pendingAudits: units.filter(u => u.nextAuditDate && new Date(u.nextAuditDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).length,
        mandatoryCount: units.filter(u => u.mandatoryAudit).length
    }), [units]);

    // RCM Verisi (Modal Sekme 5) — Hook ihlalini önlemek için render dışına taşındı
    const rcmData = useMemo(() => {
        if (!editingUnit) return [];
        const flattened: any[] = [];
        if (editingUnit.processes) {
            editingUnit.processes.forEach(p => {
                p.risks?.forEach(r => {
                    r.controls?.forEach(c => {
                        const lastTest = c.tests?.[0];
                        flattened.push({
                            id: c.id,
                            processName: p.name,
                            riskName: r.name,
                            inherentRisk: r.level,
                            controlName: c.name,
                            controlType: c.type,
                            effectiveness: c.effectiveness,
                            testResult: lastTest?.testResult,
                            testAuditCode: lastTest?.audit?.auditCode,
                            testDate: lastTest?.testDate
                        });
                    });
                });
            });
        }
        // Append dynamically added custom RCM rows
        const customRows = customRcmRows.filter(row => row.unitId === editingUnit.id);
        return [...flattened, ...customRows];
    }, [editingUnit, customRcmRows]);



    const handleOpenAddModal = () => {
        setEditingUnit(null);
        setNewUnit(INITIAL_UNIT);
        setActiveTab(0);
        setShowAddModal(true);
    };

    const handleOpenEditModal = (unit: AuditableUnit, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingUnit(unit);
        setNewUnit({
            name: unit.name,
            code: unit.code || '',
            type: unit.type,
            riskLevel: unit.riskLevel,
            description: unit.description || '',
            manager: unit.manager || '',
            location: unit.location || '',
            employeeCount: unit.employeeCount,
            transactionVolume: unit.transactionVolume || 'Orta',
            financialImpact: unit.financialImpact || 'Orta',
            riskScore: unit.riskScore,
            auditCycle: unit.auditCycle,
            estimatedDays: unit.estimatedDays,
            status: unit.status || 'Aktif',
            notes: unit.notes || '',
            strategicAlignment: unit.strategicAlignment || '',
            businessCriticality: unit.businessCriticality || 'Orta',
            regulations: unit.regulations || '',
            mandatoryAudit: unit.mandatoryAudit || false,
            lastAuditResult: unit.lastAuditResult,
            openFindingsCount: unit.openFindingsCount || 0,
            inherentRisk: unit.inherentRisk || 'Orta',
            controlEffectiveness: unit.controlEffectiveness || 'Orta',
            changeRisk: unit.changeRisk || false,
            requiredExpertise: unit.requiredExpertise || '',
            previousAuditDays: unit.previousAuditDays,
            lastAuditDate: unit.lastAuditDate,
            nextAuditDate: unit.nextAuditDate,
            impactScore: unit.impactScore,
            likelihoodScore: unit.likelihoodScore,
            riskCategory: unit.riskCategory
        });
        setActiveTab(0);
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingUnit(null);
        setNewUnit(INITIAL_UNIT);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnit.name.trim()) {
            showToast('Birim adı zorunludur', 'error');
            return;
        }

        setSaving(true);
        try {
            const unitData = {
                ...newUnit,
                employeeCount: newUnit.employeeCount ? Number(newUnit.employeeCount) : null,
                estimatedDays: newUnit.estimatedDays ? Number(newUnit.estimatedDays) : null,
                auditCycle: newUnit.auditCycle ? Number(newUnit.auditCycle) : null,
                riskScore: newUnit.riskScore ? Number(newUnit.riskScore) : null,
                openFindingsCount: newUnit.openFindingsCount ? Number(newUnit.openFindingsCount) : 0,
                previousAuditDays: newUnit.previousAuditDays ? Number(newUnit.previousAuditDays) : null,
                impactScore: newUnit.impactScore ? Number(newUnit.impactScore) : null,
                likelihoodScore: newUnit.likelihoodScore ? Number(newUnit.likelihoodScore) : null
            };

            if (editingUnit) {
                const updated = await auditApi.updateUnit(editingUnit.id, unitData);
                setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));
                showToast('Birim güncellendi', 'success');
            } else {
                const addedUnit = await auditApi.createUnit(unitData);
                setUnits(prev => [...prev, addedUnit]);
                showToast('Birim başarıyla eklendi', 'success');
            }
            handleCloseModal();
        } catch (error) {
            console.error('Birim kaydetme hatası:', error);
            showToast('Birim kaydedilirken hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (deleteConfirmId) {
            try {
                await auditApi.deleteUnit(deleteConfirmId);
                setUnits(prev => prev.filter(u => u.id !== deleteConfirmId));
                showToast('Birim silindi', 'success');
            } catch (error) {
                console.error('Birim silme hatası:', error);
                showToast('Birim silinirken hata oluştu', 'error');
            } finally {
                setDeleteConfirmId(null);
            }
        }
    };

    const handleExport = () => {
        auditApi.exportToExcel(filteredUnits, 'Denetim_Evreni');
        showToast('Denetim evreni dışa aktarıldı', 'info');
    };

    const statsTotal = useMemo(() => {
        return units.filter(u => {
            const q = searchTerm.toLocaleLowerCase('tr-TR');
            const matchesSearch = u.name.toLocaleLowerCase('tr-TR').includes(q) ||
                (u.code && u.code.toLocaleLowerCase('tr-TR').includes(q)) ||
                (u.manager && u.manager.toLocaleLowerCase('tr-TR').includes(q));
            const matchesType = filterType.length === 0 || filterType.includes(u.type);
            const matchesStatus = !filterStatus || (u.status || 'Aktif') === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [units, searchTerm, filterType, filterStatus]);

    const statsCounts = useMemo(() => ({
        total: statsTotal.length,
        kritik: statsTotal.filter(u => u.riskLevel === 'Kritik').length,
        yuksek: statsTotal.filter(u => u.riskLevel === 'Yüksek').length,
        orta: statsTotal.filter(u => u.riskLevel === 'Orta').length,
        dusuk: statsTotal.filter(u => u.riskLevel === 'Düşük').length,
        openFindings: statsTotal.reduce((sum, u) => sum + (u.openFindingsCount || 0), 0),
        pendingAudits: statsTotal.filter(u => u.nextAuditDate && new Date(u.nextAuditDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).length,
        mandatoryCount: statsTotal.filter(u => u.mandatoryAudit).length
    }), [statsTotal]);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <LoadingState message="Denetim evreni yükleniyor..." />
            </div>
        );
    }

    const modalTabs = [
        { name: 'Temel Bilgiler', icon: Building },
        { name: 'Risk Değerlendirmesi', icon: AlertTriangle },
        { name: 'Mevzuat & Strateji', icon: Scale },
        { name: 'Denetim Geçmişi', icon: Calendar },
        { name: 'Doküman & Notlar', icon: FileText },
        { name: 'Kontrol Matrisi', icon: Shield }
    ];

    const toggleRiskFilter = (risk: string) => {
        if (filterRisk.includes(risk)) {
            setFilterRisk(filterRisk.filter(r => r !== risk));
        } else {
            setFilterRisk([risk]);
        }
    };

    const toggleMandatoryFilter = () => {
        setFilterMandatory(prev => prev === 'Evet' ? '' : 'Evet');
    };

    return (
        <div className="space-y-6">
            {/* Sayfa Başlığı */}
            <PageHeader
                title="Denetim Evreni"
                subtitle="Denetlenebilir birimler, süreçler ve risk envanteri"
            />

            {/* Görünüm Modu Seçimi */}
            <div className="flex justify-start mb-6 -mt-2">
                <SegmentedTabs
                    activeTab={viewMode}
                    onChange={(id) => setViewMode(id as any)}
                    tabs={[
                        { id: 'table', label: 'Tablo', icon: Table },
                        { id: 'heatmap', label: 'Isı Haritası', icon: Activity },
                        { id: 'grouped', label: 'Kartlar', icon: LayoutGrid },
                        { id: 'tree', label: 'Ağaç Modu', icon: GitBranch },
                        { id: 'matrix', label: 'Risk Matrisi', icon: Maximize },
                    ]}
                />
            </div>

            {/* Toplam Gösterge Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Birim"
                    value={statsCounts.total}
                    color="blue"
                    icon={<Building size={20} />}
                    subtext="Toplam Envanter"
                    infoTooltip="Denetim evrenindeki (denetlenebilir süreç, şube veya departman) toplam kayıt sayısıdır."
                    onClick={() => { setFilterRisk([]); setFilterMandatory(''); setFilterOpenFindings(false); setFilterPendingAudits(false); }}
                    className={`transition-all hover:scale-[1.02] ${filterRisk.length === 0 && !filterMandatory && !filterOpenFindings && !filterPendingAudits ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />
                <StatCard
                    title="Kritik Risk"
                    value={statsCounts.kritik}
                    color="rose"
                    icon={<AlertTriangle size={20} />}
                    subtext={statsCounts.total > 0 ? `Evren Payı: %${Math.round((statsCounts.kritik / statsCounts.total) * 100)}` : "Evren Payı: %0"}
                    infoTooltip="Yıllık risk değerlendirmesinde 'Kritik' derecesi almış ve öncelikli denetlenmesi gereken birimlerdir."
                    onClick={() => toggleRiskFilter('Kritik')}
                    className={`transition-all hover:scale-[1.02] ${filterRisk.includes('Kritik') ? 'ring-2 ring-rose-500 scale-[1.02] bg-rose-50/10' : ''}`}
                />
                <StatCard
                    title="Yüksek Risk"
                    value={statsCounts.yuksek}
                    color="red"
                    icon={<AlertTriangle size={20} />}
                    subtext={statsCounts.total > 0 ? `Evren Payı: %${Math.round((statsCounts.yuksek / statsCounts.total) * 100)}` : "Evren Payı: %0"}
                    infoTooltip="Risk değerlendirmesinde 'Yüksek' seviyede çıkan denetlenebilir birimlerdir."
                    onClick={() => toggleRiskFilter('Yüksek')}
                    className={`transition-all hover:scale-[1.02] ${filterRisk.includes('Yüksek') ? 'ring-2 ring-red-500 scale-[1.02] bg-red-50/10' : ''}`}
                />
                <StatCard
                    title="Orta Risk"
                    value={statsCounts.orta}
                    color="orange"
                    icon={<AlertTriangle size={20} />}
                    subtext={statsCounts.total > 0 ? `Evren Payı: %${Math.round((statsCounts.orta / statsCounts.total) * 100)}` : "Evren Payı: %0"}
                    infoTooltip="Kabul edilebilir ancak izlenmesi gereken risk seviyesine (Orta) sahip birimlerdir."
                    onClick={() => toggleRiskFilter('Orta')}
                    className={`transition-all hover:scale-[1.02] ${filterRisk.includes('Orta') ? 'ring-2 ring-orange-500 scale-[1.02] bg-orange-50/10' : ''}`}
                />
                <StatCard
                    title="Düşük Risk"
                    value={statsCounts.dusuk}
                    color="yellow"
                    icon={<CheckCircle size={20} />}
                    subtext={statsCounts.total > 0 ? `Evren Payı: %${Math.round((statsCounts.dusuk / statsCounts.total) * 100)}` : "Evren Payı: %0"}
                    infoTooltip="Risk iştahı çerçevesinde düşük seviyede risk barındıran süreç ve birimlerin sayısı."
                    onClick={() => toggleRiskFilter('Düşük')}
                    className={`transition-all hover:scale-[1.02] ${filterRisk.includes('Düşük') ? 'ring-2 ring-yellow-500 scale-[1.02] bg-yellow-50/10' : ''}`}
                />
                <StatCard
                    title="Açık Bulgu"
                    value={statsCounts.openFindings}
                    color="purple"
                    icon={<FileText size={20} />}
                    subtext="Çözüm Bekleyen"
                    infoTooltip="Geçmiş denetimlerinden kaynaklı, halen giderilmemiş açık bulgusu bulunan birimlerin sayısıdır."
                    onClick={() => setFilterOpenFindings(prev => !prev)}
                    className={`transition-all hover:scale-[1.02] ${filterOpenFindings ? 'ring-2 ring-purple-500 scale-[1.02] bg-purple-50/10' : ''}`}
                />
                <StatCard
                    title="Yaklaşan Denetim"
                    value={statsCounts.pendingAudits}
                    color="amber"
                    icon={<Calendar size={20} />}
                    subtext="90 Gün İçinde"
                    infoTooltip="Denetim periyoduna veya takvime göre önümüzdeki 90 gün içerisinde denetlenmesi planlanan birimler."
                    onClick={() => setFilterPendingAudits(prev => !prev)}
                    className={`transition-all hover:scale-[1.02] ${filterPendingAudits ? 'ring-2 ring-amber-500 scale-[1.02] bg-amber-50/10' : ''}`}
                />
                <StatCard
                    title="Zorunlu Denetim"
                    value={statsCounts.mandatoryCount}
                    color="indigo"
                    icon={<Shield size={20} />}
                    subtext="Yasal Zorunluluk"
                    infoTooltip="BDDK, SPK vb. resmi otoriteler tarafından belirli periyotlarla zorunlu olarak denetlenmesi gereken birim/süreçlerin sayısıdır."
                    onClick={toggleMandatoryFilter}
                    className={`transition-all hover:scale-[1.02] ${filterMandatory === 'Evet' ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />
            </div>

            {/* Standart Araç Çubuğu */}
            <PageToolbar
                searchPlaceholder="Birim, kod veya sorumlu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadData(false)}
                showExportButton={true}
                onExportClick={handleExport}
                showAddButton={canManage}
                onAddClick={handleOpenAddModal}
                addButtonText="Yeni Birim Ekle"
                rightActions={
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/audit/controls')}
                        leftIcon={<Scale size={18} />}
                    >
                        Kontrol Listesi
                    </Button>
                }
                filters={
                    <FilterDropdown
                        activeCount={filterType.length + filterRisk.length + (filterStatus ? 1 : 0) + (filterMandatory ? 1 : 0) + (filterOpenFindings ? 1 : 0) + (filterPendingAudits ? 1 : 0)}
                        onClear={() => { setFilterType([]); setFilterRisk([]); setFilterStatus(''); setFilterMandatory(''); setFilterOpenFindings(false); setFilterPendingAudits(false); }}
                    >
                        <CustomSelect
                            label="Birim Türü"
                            value={filterType}
                            onChange={(val) => setFilterType(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={[
                                { value: "Şube", label: "Şube" },
                                { value: "Birim", label: "Birim" },
                                { value: "Süreç", label: "Süreç" },
                                { value: "Departman", label: "Departman" }
                            ]}
                        />
                        <CustomSelect
                            label="Risk Seviyesi"
                            value={filterRisk}
                            onChange={(val) => setFilterRisk(val as string[])}
                            placeholder="Tümü"
                            isMulti
                            options={[
                                { value: "Kritik", label: "Kritik" },
                                { value: "Yüksek", label: "Yüksek" },
                                { value: "Orta", label: "Orta" },
                                { value: "Düşük", label: "Düşük" }
                            ]}
                        />
                        <CustomSelect
                            label="Durum"
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val as string)}
                            placeholder="Tümü"
                            options={[
                                { value: "", label: "Tümü" },
                                { value: "Aktif", label: "Aktif" },
                                { value: "Pasif", label: "Pasif" }
                            ]}
                        />
                        <CustomSelect
                            label="Zorunlu Denetim"
                            value={filterMandatory}
                            onChange={(val) => setFilterMandatory(val as string)}
                            placeholder="Tümü"
                            options={[
                                { value: "", label: "Tümü" },
                                { value: "Evet", label: "Evet" },
                                { value: "Hayır", label: "Hayır" }
                            ]}
                        />
                    </FilterDropdown>
                }
            />

            {/* Sonuç Görüntüleme */}
            {units.length === 0 ? (
                <NoDataState
                    entityName="birim"
                    onAdd={handleOpenAddModal}
                />
            ) : filteredUnits.length === 0 ? (
                <NoResultsState
                    searchTerm={searchTerm}
                    onClear={() => {
                        setSearchTerm('');
                        setFilterType([]);
                        setFilterRisk([]);
                        setFilterStatus('');
                        setFilterMandatory('');
                        setFilterOpenFindings(false);
                        setFilterPendingAudits(false);
                    }}
                />
            ) : viewMode === 'matrix' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[700px]">
                    <RiskMatrix
                        items={filteredUnits.map(u => ({
                            id: u.id,
                            name: u.name,
                            riskLevel: u.riskLevel,
                            category: u.riskCategory || 'Operasyonel',
                            openFindings: u.openFindingsCount || 0
                        }))}
                        onItemClick={(item) => {
                            const originalUnit = units.find(u => u.id === item.id);
                            if (originalUnit) {
                                handleOpenEditModal(originalUnit, { stopPropagation: () => { } } as any);
                            }
                        }}
                    />
                </div>
            ) : viewMode === 'heatmap' ? (
                <RiskHeatmap units={filteredUnits} />
            ) : viewMode === 'table' ? (
                /* Tablo Görünümü */
                <DataTable
                    columns={[
                        {
                            key: 'code',
                            header: 'Birim No',
                            type: 'code',
                            sortable: true,
                            width: '100px'
                        },
                        {
                            key: 'name',
                            header: 'Birim Adı',
                            sortable: true,
                            render: (unit: AuditableUnit) => (
                                <div className="flex flex-col items-center">
                                    <div className="cell-title">{unit.name}</div>
                                    {unit.mandatoryAudit && (
                                        <span className="text-[10px] text-purple-600 flex items-center justify-center gap-1 mt-0.5 font-bold uppercase">
                                            <Shield size={10} /> Zorunlu
                                        </span>
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'type',
                            header: 'Tür',
                            sortable: true,
                            width: '100px'
                        },
                        {
                            key: 'riskLevel',
                            header: 'Risk',
                            type: 'risk',
                            sortable: true,
                            width: '120px',
                            align: 'center'
                        },
                        {
                            key: 'riskScore',
                            header: 'Skor',
                            sortable: true,
                            width: '100px',
                            align: 'center',
                            render: (unit: AuditableUnit) => (
                                <div className="flex flex-col items-center gap-0.5 justify-center">
                                    <StatusBadge value={unit.riskLevel} type="risk" size="sm" />
                                    {unit.residualRiskScore !== undefined && (
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getRiskScoreColor(unit.residualRiskScore || 0)} opacity-70`}>
                                            Artık: {unit.residualRiskScore}
                                        </span>
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'controlEffectiveness',
                            header: 'Kontrol',
                            sortable: true,
                            width: '120px',
                            align: 'center',
                            render: (unit: AuditableUnit) => (
                                <StatusBadge value={unit.controlEffectiveness} type="control" />
                            )
                        },
                        {
                            key: 'lastAuditDate',
                            header: 'Son Denetim',
                            sortable: true,
                            width: '150px',
                            align: 'center',
                            render: (unit: AuditableUnit) => (
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <div className="cell-date">
                                        <Calendar size={14} className="text-gray-400" />
                                        {formatDate(unit.lastAuditDate)}
                                    </div>
                                    {unit.lastAuditResult && (
                                        <StatusBadge type="result" value={unit.lastAuditResult} size="sm" />
                                    )}
                                </div>
                            )
                        },
                        {
                            key: 'openFindingsCount',
                            header: 'Açık Bulgu',
                            sortable: true,
                            width: '100px',
                            render: (unit: AuditableUnit) => (
                                (unit.openFindingsCount || 0) > 0 ? (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                                        {unit.openFindingsCount}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )
                            )
                        },
                        {
                            key: 'auditCycle',
                            header: 'Döngü',
                            sortable: true,
                            width: '100px',
                            render: (unit: AuditableUnit) => (
                                <span className="font-medium">{unit.auditCycle ? `${unit.auditCycle} Yıl` : '-'}</span>
                            )
                        },
                        {
                            key: 'actions',
                            header: 'İşlemler',
                            width: '100px',
                            render: (unit: AuditableUnit) => (
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                    <ActionMenu
                                        variant="ghost"
                                        items={[
                                            { label: 'RCM', icon: Shield, onClick: () => router.push(`/audit/universe/${unit.id}`) },
                                             { label: 'Karne', icon: ActivitySquare, onClick: () => setScorecardModal({ isOpen: true, unitName: unit.name }) },
                                            { label: 'Planla', icon: Calendar, onClick: () => handleOpenCreateAuditModal(unit) },

                                            { label: 'Düzenle', icon: Edit2, onClick: () => handleOpenEditModal(unit, { stopPropagation: () => {} } as any) },
                                            { label: 'Sil', icon: Trash2, variant: 'danger', onClick: () => handleDeleteClick(unit.id, { stopPropagation: () => {} } as any) }
                                        ]}
                                    />
                                </div>
                            )
                        }
                    ]}
                    data={filteredUnits}
                    loading={loading}
                    rowKey="id"
                    paginated={true}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    sortColumn={sortColumn}
                    sortDirection={sortDir}
                    onSort={handleSort}
                    className="shadow-sm border border-gray-100"
                />
            ) : viewMode === 'coverage' ? (
                /* Kapsam Analizi Görünümü */
                <div className="space-y-4">
                    {(() => {
                        const now = new Date();
                        const audited = filteredUnits.filter(u => u.lastAuditDate).length;
                        const overdue = filteredUnits.filter(u => {
                            if (!u.nextAuditDate) return !u.lastAuditDate;
                            return new Date(u.nextAuditDate) < now;
                        }).length;
                        const coveragePercent = filteredUnits.length > 0 ? Math.round((audited / filteredUnits.length) * 100) : 0;
                        return (
                            <div className="card">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-800">Denetim Kapsama Özeti</h3>
                                    <span className="text-2xl font-bold text-primary">%{coveragePercent}</span>
                                </div>
                                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${coveragePercent}%` }} />
                                </div>
                                <div className="flex gap-6 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Denetlenen: <strong>{audited}</strong></span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Gecikmiş/Hiç: <strong>{overdue}</strong></span>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Toplam: <strong>{filteredUnits.length}</strong></span>
                                </div>
                            </div>
                        );
                    })()}
                    <DataTable
                        columns={[
                            {
                                key: 'name',
                                header: 'Birim',
                                sortable: true,
                                render: (unit: AuditableUnit) => (
                                    <div className="flex flex-col">
                                        <div className="font-medium text-gray-900">{unit.name}</div>
                                        <div className="text-xs text-gray-500">{unit.type}{unit.code ? ` • ${unit.code}` : ''}</div>
                                    </div>
                                )
                            },
                            {
                                key: 'riskLevel',
                                header: 'Risk',
                                type: 'risk',
                                sortable: true,
                                width: '120px'
                            },
                            {
                                key: 'lastAuditDate',
                                header: 'Son Denetim',
                                type: 'date',
                                sortable: true,
                                width: '150px'
                            },
                            {
                                key: 'nextAuditDate',
                                header: 'Sonraki Denetim',
                                type: 'date',
                                sortable: true,
                                width: '150px'
                            },
                            {
                                key: 'auditCycle',
                                header: 'Döngü',
                                sortable: true,
                                width: '100px',
                                render: (unit: AuditableUnit) => (
                                    <span className="text-sm font-medium text-gray-700">{unit.auditCycle ? `${unit.auditCycle} Yıl` : '—'}</span>
                                )
                            },
                            {
                                key: 'status',
                                header: 'Durum',
                                width: '150px',
                                render: (unit: AuditableUnit) => {
                                    const now2 = new Date();
                                    const hasAudited = !!unit.lastAuditDate;
                                    const isOver = !hasAudited || (unit.nextAuditDate ? new Date(unit.nextAuditDate) < now2 : false);
                                    const isDueSoon = !isOver && unit.nextAuditDate && (() => {
                                        const diff = (new Date(unit.nextAuditDate!).getTime() - now2.getTime()) / (86400000);
                                        return diff <= 90;
                                    })();
                                    let stColor = 'bg-emerald-100 text-emerald-800';
                                    let stText = 'Güncel';
                                    if (!hasAudited) { stColor = 'bg-red-100 text-red-800'; stText = 'Hiç Denetlenmedi'; }
                                    else if (isOver) { stColor = 'bg-red-100 text-red-800'; stText = 'Gecikmiş'; }
                                    else if (isDueSoon) { stColor = 'bg-amber-100 text-amber-800'; stText = 'Yaklaşıyor'; }
                                    return (
                                        <div className="flex justify-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${stColor}`}>{stText}</span>
                                        </div>
                                    );
                                    }
                                },
                                {
                                    key: 'actions',
                                    header: 'İşlemler',
                                    width: '180px',
                                    render: (unit: AuditableUnit) => {
                                        const { user } = useAuth();
                                        const canManage = checkRole(hasRole, ROLES.BASIC_MANAGER);
                                        
                                        const items = [
                                            { label: 'RCM', icon: Shield, onClick: () => router.push(`/audit/universe/${unit.id}`) }
                                        ];

                                        if (canManage) {
                                            items.push({ label: 'Düzenle', icon: Edit2, onClick: () => handleOpenEditModal(unit, { stopPropagation: () => {} } as any) });
                                            items.push({ label: 'Sil', icon: Trash2, variant: 'danger', onClick: () => handleDeleteClick(unit.id, { stopPropagation: () => {} } as any) } as any);
                                        }

                                        return (
                                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                                <ActionMenu variant="ghost" items={items} />
                                            </div>
                                        );
                                    }
                                }
                            ]}
                        data={useMemo(() => {
                            return [...filteredUnits].sort((a, b) => {
                                const now2 = new Date();
                                const aOver = !a.lastAuditDate || (a.nextAuditDate ? new Date(a.nextAuditDate) < now2 : true);
                                const bOver = !b.lastAuditDate || (b.nextAuditDate ? new Date(b.nextAuditDate) < now2 : true);
                                if (aOver !== bOver) return aOver ? -1 : 1;
                                return (b.riskScore || 0) - (a.riskScore || 0);
                            });
                        }, [filteredUnits])}
                        loading={loading}
                        rowKey="id"
                        className="shadow-sm border border-gray-100"
                    />
                </div>
            ) : viewMode === 'tree' ? (
                /* Tree View - Organizasyon Ağacı */
                <div className="space-y-4">
                    <div className="card bg-white border border-gray-100 shadow-sm p-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <Building className="text-primary" size={20} /> Organizasyon Ağacı & Risk Haritası
                        </h3>
                        <div className="overflow-x-auto pb-4 custom-scrollbar max-h-[700px]">
                            <OrganizationTree
                                hierarchy={HIERARCHY}
                                units={filteredUnits}
                                onEdit={(unit) => handleOpenEditModal(unit, { stopPropagation: () => {} } as any)}
                                onDelete={(unitId) => handleDeleteClick(unitId, { stopPropagation: () => {} } as any)}
                                onViewRCM={(unitId) => router.push(`/audit/universe/${unitId}`)}
                                onAdd={handleOpenAddModal}
                                onViewScorecard={(unitName) => setScorecardModal({ isOpen: true, unitName })}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* Kart Görünümü */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {displayedUnits.map(item => (
                            <div key={item.id} className="card !p-0 overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Kart Başlığı — Risk Rengi */}
                                <div className={`p-4 border-b-4 ${
                                    item.riskLevel === 'Kritik' ? 'border-[#7f1d1d] bg-rose-50' :
                                    item.riskLevel === 'Yüksek' ? 'border-[#dc2626] bg-red-50' :
                                    item.riskLevel === 'Orta' ? 'border-[#f97316] bg-orange-50' :
                                    'border-[#facc15] bg-yellow-50'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                                                {item.mandatoryAudit && (
                                                    <Shield size={14} className="text-purple-600 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                {item.code && <span className="text-xs text-gray-500">{item.code}</span>}
                                                <span className="text-xs bg-white/80 px-1.5 py-0.5 rounded text-gray-600">{item.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge value={item.riskLevel} type="risk" size="sm" />
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRiskScoreColor(item.riskScore || 0)}`}>
                                                Skor: {item.riskScore || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Kart İçeriği */}
                                <div className="p-4 space-y-3">
                                    {/* Hızlı Göstergeler */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-gray-50 rounded p-2 flex flex-col items-center justify-center">
                                            <StatusBadge type="control" value={item.controlEffectiveness} size="sm" />
                                            <div className="text-xs text-gray-500">Kontrol</div>
                                        </div>
                                        <div className="bg-gray-50 rounded p-2">
                                            <div className="text-sm font-bold text-gray-700">{item.auditCycle || '-'} Yıl</div>
                                            <div className="text-xs text-gray-500">Döngü</div>
                                        </div>
                                        <div className="bg-gray-50 rounded p-2">
                                            <div className={`text-sm font-bold ${(item.openFindingsCount || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                {item.openFindingsCount || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">Açık Bulgu</div>
                                        </div>
                                    </div>

                                    {/* Son Denetim Bilgisi */}
                                    <div className="flex items-center justify-between text-sm border-t pt-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <DateDisplay
                                                date={item.lastAuditDate}
                                                showIcon
                                                format={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
                                            />
                                            {!item.lastAuditDate && <span className="text-gray-400 text-sm">Henüz denetlenmedi</span>}
                                        </div>
                                        {item.lastAuditResult && <StatusBadge value={item.lastAuditResult} type="result" />}
                                    </div>

                                    {/* Lokasyon ve Sorumlu */}
                                    {(item.location || item.manager) && (
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-3">
                                            {item.location && (
                                                <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
                                            )}
                                            {item.manager && (
                                                <span className="flex items-center gap-1"><Users size={12} />{item.manager}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Mevzuat */}
                                    {item.regulations && (
                                        <div className="flex flex-wrap gap-1 text-xs">
                                            {item.regulations.split(',').map((reg, i) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{reg.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Kart Alt Bilgi */}
                                <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Activity size={12} />
                                        {item.estimatedDays ? `${item.estimatedDays} gün` : '-'}
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <ActionMenu
                                            variant="ghost"
                                            items={[
                                                { label: 'RCM Görüntüle', icon: Shield, onClick: () => router.push(`/audit/universe/${item.id}`) },
                                                { label: 'Karne', icon: ActivitySquare, onClick: () => setScorecardModal({ isOpen: true, unitName: item.name }) },
                                                { label: 'Düzenle', icon: Edit2, onClick: () => handleOpenEditModal(item, { stopPropagation: () => {} } as any) },
                                                { label: 'Sil', icon: Trash2, variant: 'danger', onClick: () => handleDeleteClick(item.id, { stopPropagation: () => {} } as any) }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredUnits.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Silme Onay Modalı */}
            <ConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Birimi Sil"
                message="Bu birimi silmek istediğinize emin misiniz?"
                confirmText="Evet, Sil"

                type="danger"
            />

            {/* Ekleme/Düzenleme Modalı */}
            <Modal
                isOpen={showAddModal}
                onClose={handleCloseModal}
                title={editingUnit ? 'Birimi Düzenle' : 'Yeni Birim Ekle'}
                size="2xl"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
                            İptal
                        </Button>
                        <Button type="submit" form="unit-form" disabled={saving} isLoading={saving} className="px-8 shadow-md hover:shadow-lg transition-all min-w-[140px]">
                            {editingUnit ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </div>
                }
            >
                {/* Sekmeler */}
                <div className="py-3 border-b bg-white overflow-x-auto custom-scrollbar -mx-6 -mt-6 px-6 mb-4 flex justify-center">
                    <SegmentedTabs
                        tabs={modalTabs.map((t, idx) => ({ id: idx.toString(), label: t.name, icon: t.icon }))}
                        activeTab={activeTab.toString()}
                        onChange={(id) => setActiveTab(parseInt(id))}
                    />
                </div>

                <form id="unit-form" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                                {/* Tab 0: Temel Bilgiler */}
                                {activeTab === 0 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Birim Adı *</label>
                                                {(!newUnit.type || newUnit.type === 'Departman' || newUnit.type === 'Birim' || newUnit.type === 'Süreç') ? (
                                                    <div className="space-y-3">
                                                        <CustomSelect
                                                            value={selectedParent}
                                                            onChange={(val) => {
                                                                setSelectedParent(val as string);
                                                                setNewUnit({ ...newUnit, name: '' }); // Üst birim değiştiğinde ismi sıfırla
                                                            }}
                                                            options={HIERARCHY.flatMap(group =>
                                                                group.children
                                                                    .filter(child => child.title !== 'Teftiş Kurulu Müdürlüğü')
                                                                    .map(child => ({
                                                                        value: child.title,
                                                                        label: `${group.title} > ${child.title}`
                                                                    }))
                                                            )}
                                                            placeholder="Üst Birim / Grup Seçiniz..."
                                                        />
                                                        {selectedParent && (
                                                            <CustomSelect
                                                                value={newUnit.name}
                                                                onChange={(val) => setNewUnit({ ...newUnit, name: val as string })}
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
                                                                        const child = group.children.find(c => c.title === selectedParent);
                                                                        if (child && 'children' in child) {
                                                                            return flatten((child as any).children);
                                                                        }
                                                                    }
                                                                    return DEPARTMENTS.filter(d => d !== 'Teftiş Kurulu Müdürlüğü').map(d => ({ value: d, label: d }));
                                                                })()}
                                                                placeholder="Alt Birim / Servis Seçiniz..."
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input type="text" className="form-input" required value={newUnit.name} onChange={e => setNewUnit({ ...newUnit, name: e.target.value })} placeholder="Örn: İstanbul Şubesi" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Birim No</label>
                                                <input type="text" className="form-input" value={newUnit.code || ''} onChange={e => setNewUnit({ ...newUnit, code: e.target.value })} placeholder="Örn: IST-001" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Sorumlu</label>
                                                <input type="text" className="form-input" value={newUnit.manager || ''} onChange={e => setNewUnit({ ...newUnit, manager: e.target.value })} placeholder="Örn: Ahmet Yılmaz" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
                                                <input type="text" className="form-input" value={newUnit.location || ''} onChange={e => setNewUnit({ ...newUnit, location: e.target.value })} placeholder="Örn: İstanbul" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Personel Sayısı</label>
                                                <input type="number" min="0" className="form-input" value={newUnit.employeeCount || ''} onChange={e => setNewUnit({ ...newUnit, employeeCount: parseInt(e.target.value) || undefined })} placeholder="Örn: 25" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Denetim Süresi (Gün)</label>
                                                <input type="number" min="1" className="form-input" value={newUnit.estimatedDays || ''} onChange={e => setNewUnit({ ...newUnit, estimatedDays: parseInt(e.target.value) || undefined })} placeholder="Örn: 5" />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Durum"
                                                    value={newUnit.status || 'Aktif'}
                                                    onChange={(val) => setNewUnit({ ...newUnit, status: val as any })}
                                                    options={[
                                                        { value: "Aktif", label: "Aktif" },
                                                        { value: "Pasif", label: "Pasif" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Tür *"
                                                    value={newUnit.type}
                                                    onChange={(val) => setNewUnit({ ...newUnit, type: val as any })}
                                                    options={[
                                                        { value: "Süreç", label: "Süreç" },
                                                        { value: "Şube", label: "Şube" },
                                                        { value: "Birim", label: "Birim" },
                                                        { value: "Departman", label: "Departman" }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                            <textarea className="form-input" rows={2} value={newUnit.description || ''} onChange={e => setNewUnit({ ...newUnit, description: e.target.value })} placeholder="Birim hakkında kısa açıklama..." />
                                        </div>
                                    </div>
                                )}

                                {/* Tab 1: Risk Değerlendirmesi */}
                                {activeTab === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <CustomSelect
                                                    label="Dinamik Etki (Impact) Skoru - 1 ile 5 Arası"
                                                    value={newUnit.impactScore?.toString() || ''}
                                                    onChange={(val) => setNewUnit({ ...newUnit, impactScore: Number(val) })}
                                                    options={[
                                                        { value: "1", label: "1 - Çok Düşük" },
                                                        { value: "2", label: "2 - Düşük" },
                                                        { value: "3", label: "3 - Orta" },
                                                        { value: "4", label: "4 - Yüksek" },
                                                        { value: "5", label: "5 - Çok Yüksek" }
                                                    ]}
                                                    placeholder="Etki Skoru Seçin"
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Dinamik Olasılık (Likelihood) Skoru - 1 ile 5 Arası"
                                                    value={newUnit.likelihoodScore?.toString() || ''}
                                                    onChange={(val) => setNewUnit({ ...newUnit, likelihoodScore: Number(val) })}
                                                    options={[
                                                        { value: "1", label: "1 - Çok Düşük" },
                                                        { value: "2", label: "2 - Düşük" },
                                                        { value: "3", label: "3 - Orta" },
                                                        { value: "4", label: "4 - Yüksek" },
                                                        { value: "5", label: "5 - Çok Yüksek" }
                                                    ]}
                                                    placeholder="Olasılık Skoru Seçin"
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Doğal Risk (Inherent)"
                                                    value={newUnit.inherentRisk || 'Orta'}
                                                    onChange={(val) => setNewUnit({ ...newUnit, inherentRisk: val as any })}
                                                    options={[
                                                        { value: "Yüksek", label: "Yüksek" },
                                                        { value: "Orta", label: "Orta" },
                                                        { value: "Düşük", label: "Düşük" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Kontrol Etkinliği"
                                                    value={newUnit.controlEffectiveness || 'Orta'}
                                                    onChange={(val) => setNewUnit({ ...newUnit, controlEffectiveness: val as any })}
                                                    options={[
                                                        { value: "Güçlü", label: "Güçlü" },
                                                        { value: "Orta", label: "Orta" },
                                                        { value: "Zayıf", label: "Zayıf" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Finansal Etki"
                                                    value={newUnit.financialImpact || 'Orta'}
                                                    onChange={(val) => setNewUnit({ ...newUnit, financialImpact: val as any })}
                                                    options={[
                                                        { value: "Yüksek", label: "Yüksek" },
                                                        { value: "Orta", label: "Orta" },
                                                        { value: "Düşük", label: "Düşük" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="İşlem Hacmi"
                                                    value={newUnit.transactionVolume || 'Orta'}
                                                    onChange={(val) => setNewUnit({ ...newUnit, transactionVolume: val as any })}
                                                    options={[
                                                        { value: "Yüksek", label: "Yüksek" },
                                                        { value: "Orta", label: "Orta" },
                                                        { value: "Düşük", label: "Düşük" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="İş Kritikliği"
                                                    value={newUnit.businessCriticality || 'Orta'}
                                                    onChange={(val) => setNewUnit({ ...newUnit, businessCriticality: val as any })}
                                                    options={[
                                                        { value: "Yüksek", label: "Yüksek" },
                                                        { value: "Orta", label: "Orta" },
                                                        { value: "Düşük", label: "Düşük" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Risk Seviyesi"
                                                    value={newUnit.riskLevel}
                                                    onChange={(val) => setNewUnit({ ...newUnit, riskLevel: val as any })}
                                                    options={[
                                                        { value: "Kritik", label: "Kritik" },
                                                        { value: "Yüksek", label: "Yüksek" },
                                                        { value: "Orta", label: "Orta" },
                                                        { value: "Düşük", label: "Düşük" }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="changeRisk"
                                                checked={newUnit.changeRisk || false}
                                                onChange={checked => setNewUnit({ ...newUnit, changeRisk: checked })}
                                                label="Son dönemde önemli değişiklik yaşandı"
                                            />
                                        </div>
                                        {/* Risk Score Display — Doğal ve Artık */}
                                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                            {/* Doğal (Inherent) Risk */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">Doğal Risk Skoru</span>
                                                    <span className={`text-lg font-bold ${(newUnit.riskScore || 0) >= 85 ? 'text-rose-900' :
                                                        (newUnit.riskScore || 0) >= 65 ? 'text-red-500' :
                                                            (newUnit.riskScore || 0) >= 40 ? 'text-orange-500' : 'text-yellow-600'
                                                        }`}>{newUnit.riskScore || 0}/100</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-300 ${(newUnit.riskScore || 0) >= 85 ? 'bg-rose-900' :
                                                        (newUnit.riskScore || 0) >= 65 ? 'bg-red-500' :
                                                            (newUnit.riskScore || 0) >= 40 ? 'bg-orange-500' : 'bg-yellow-400'
                                                        }`} style={{ width: `${newUnit.riskScore || 0}%` }} />
                                                </div>
                                            </div>
                                            {/* Artık (Residual) Risk */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">Artık Risk Skoru</span>
                                                    {(() => {
                                                        const residual = calculateResidualRisk(newUnit);
                                                        return (
                                                            <span className={`text-lg font-bold ${residual >= 85 ? 'text-rose-900' :
                                                                residual >= 65 ? 'text-red-500' :
                                                                    residual >= 40 ? 'text-orange-500' : 'text-emerald-600'
                                                                }`}>{residual}/100</span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    {(() => {
                                                        const residual = calculateResidualRisk(newUnit);
                                                        return (
                                                            <div className={`h-full transition-all duration-300 ${residual >= 85 ? 'bg-rose-900' :
                                                                residual >= 65 ? 'bg-red-500' :
                                                                    residual >= 40 ? 'bg-orange-500' : 'bg-emerald-400'
                                                                }`} style={{ width: `${residual}%` }} />
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                                                <span>Önerilen denetim döngüsü: <strong>{newUnit.auditCycle || 3} yıl</strong></span>
                                                <span>Risk: <strong>{newUnit.riskLevel}</strong></span>
                                            </div>
                                        </div>

                                        {/* Tarihsel Risk Skoru Takibi */}
                                        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm mt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                                <TrendingUp size={16} className="text-primary" /> Tarihsel Risk Skoru Takibi
                                            </h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { year: '2024', score: Math.max(10, Math.min(100, Math.round((newUnit.riskScore || 50) - 12))), color: 'bg-emerald-500' },
                                                    { year: '2025', score: Math.max(10, Math.min(100, Math.round((newUnit.riskScore || 50) - 6))), color: 'bg-amber-500' },
                                                    { year: '2026 (Güncel)', score: Math.max(10, Math.min(100, Math.round(newUnit.riskScore || 50))), color: 'bg-primary' }
                                                ].map((trend, idx) => (
                                                    <div key={idx} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 flex flex-col items-center">
                                                        <span className="text-xs text-gray-500 font-bold">{trend.year}</span>
                                                        <div className="w-full bg-gray-200 h-2 rounded-full my-2 overflow-hidden">
                                                            <div className={`h-full ${trend.color}`} style={{ width: `${trend.score}%` }} />
                                                        </div>
                                                        <span className="text-sm font-black text-gray-700">{trend.score}/100</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {/* Tab 2: Mevzuat & Strateji */}
                                {activeTab === 2 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tabi Olduğu Mevzuatlar</label>
                                            <input type="text" className="form-input" value={newUnit.regulations || ''} onChange={e => setNewUnit({ ...newUnit, regulations: e.target.value })} placeholder="Örn: Yasal Mevzuat, SPK, KVKK (virgülle ayırın)" />
                                            <p className="text-xs text-gray-500 mt-1">Birden fazla mevzuatı virgülle ayırarak yazın</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="mandatoryAudit"
                                                checked={newUnit.mandatoryAudit || false}
                                                onChange={checked => setNewUnit({ ...newUnit, mandatoryAudit: checked })}
                                                label="Zorunlu denetim gereksinimi var"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stratejik Hedef Bağlantısı</label>
                                            <input type="text" className="form-input" value={newUnit.strategicAlignment || ''} onChange={e => setNewUnit({ ...newUnit, strategicAlignment: e.target.value })} placeholder="Örn: Müşteri memnuniyetini artırma" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Gerekli Uzmanlık Alanları</label>
                                            <input type="text" className="form-input" value={newUnit.requiredExpertise || ''} onChange={e => setNewUnit({ ...newUnit, requiredExpertise: e.target.value })} placeholder="Örn: IT, Finans, Hukuk (virgülle ayırın)" />
                                        </div>
                                    </div>
                                )}

                                {/* Tab 3: Denetim Geçmişi */}
                                {activeTab === 3 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Son Denetim Tarihi</label>
                                                <FormInput type="date"  value={newUnit.lastAuditDate || ''} onChange={e => setNewUnit({ ...newUnit, lastAuditDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <CustomSelect
                                                    label="Son Denetim Sonucu"
                                                    value={newUnit.lastAuditResult || ''}
                                                    onChange={(val) => setNewUnit({ ...newUnit, lastAuditResult: val as any || undefined })}
                                                    options={[
                                                        { value: "Olumlu", label: "Olumlu" },
                                                        { value: "Koşullu", label: "Koşullu" },
                                                        { value: "Olumsuz", label: "Olumsuz" }
                                                    ]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Planlanan Denetim</label>
                                                <FormInput type="date"  value={newUnit.nextAuditDate || ''} onChange={e => setNewUnit({ ...newUnit, nextAuditDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Açık Bulgu Sayısı</label>
                                                <input type="number" min="0" className="form-input" value={newUnit.openFindingsCount || 0} onChange={e => setNewUnit({ ...newUnit, openFindingsCount: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Önceki Denetim Süresi (Adam/Gün)</label>
                                                <input type="number" min="0" className="form-input" value={newUnit.previousAuditDays || ''} onChange={e => setNewUnit({ ...newUnit, previousAuditDays: parseInt(e.target.value) || undefined })} placeholder="Örn: 15" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Denetim Döngüsü (Yıl)</label>
                                                <input type="number" min="1" max="10" className="form-input" value={newUnit.auditCycle || ''} onChange={e => setNewUnit({ ...newUnit, auditCycle: parseInt(e.target.value) || undefined })} placeholder="Otomatik hesaplanır" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 4: Doküman & Notlar */}
                                {activeTab === 4 && (
                                    <div className="space-y-6">
                                        {/* Detaylı Notlar Alanı */}
                                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <FileText size={18} />
                                                </div>
                                                <h4 className="font-semibold text-gray-800">Çalışma Notları</h4>
                                            </div>
                                            <div className="pl-10">
                                                <textarea
                                                    className="form-input !min-h-[100px] border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
                                                    rows={4}
                                                    value={newUnit.notes || ''}
                                                    onChange={e => setNewUnit({ ...newUnit, notes: e.target.value })}
                                                    placeholder="Birim hakkındaki özel gözlemleriniz, denetim stratejisi önerileri veya genel notları buraya girebilirsiniz..."
                                                />
                                                <p className="text-xs text-gray-500 mt-2">Bu notlar denetim planlaması aşamasında denetçilere referans olarak sunulur.</p>
                                            </div>
                                        </div>

                                        {/* Ek Dokümanlar ve Dosya Yönetimi */}
                                        <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4">
                                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Upload size={16} className="text-primary" /> Ek Dokümanlar ve Referans Dosyalar
                                            </h4>
                                            <FileUpload
                                                onFileSelect={handleFileUpload}
                                                description="Birimle ilgili organizasyon şeması, süreç haritaları veya diğer destekleyici evrakları buraya sürükleyin."
                                            />
                                            {uploadedFiles.length > 0 && (
                                                <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 border-b border-gray-100 grid grid-cols-12 gap-2">
                                                        <span className="col-span-6">Dosya Adı</span>
                                                        <span className="col-span-2">Boyut</span>
                                                        <span className="col-span-3">Yükleyen</span>
                                                        <span className="col-span-1 text-center">İşlem</span>
                                                    </div>
                                                    <div className="divide-y divide-gray-50">
                                                        {uploadedFiles.map((file) => (
                                                            <div key={file.id} className="px-3 py-2.5 text-xs text-gray-600 grid grid-cols-12 gap-2 items-center hover:bg-gray-50/50">
                                                                <span className="col-span-6 font-medium truncate flex items-center gap-2">
                                                                    <FileText size={14} className="text-slate-400" />
                                                                    {file.name}
                                                                </span>
                                                                <span className="col-span-2 text-gray-400">{file.size}</span>
                                                                <span className="col-span-3 text-gray-400">{file.uploadedBy} ({file.uploadedAt})</span>
                                                                <div className="col-span-1 flex justify-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteFile(file.id)}
                                                                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tab 5: Kontrol Matrisi (RCM) */}
                                {activeTab === 5 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <Shield size={18} className="text-primary" />
                                                Süreç, Risk & Kontrol Matrisi (RCM)
                                            </h4>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleExportRCM}
                                                    leftIcon={<Download size={14} />}
                                                >
                                                    Dışa Aktar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleAddNewControl}
                                                    leftIcon={<Plus size={14} />}
                                                >
                                                    Kontrol Ekle
                                                </Button>
                                            </div>
                                        </div>

                                        {/* IIA Std 2120: RCM Bilgi Kartı */}
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                            <Shield size={16} className="text-blue-600 mt-0.5 shrink-0" />
                                            <div className="text-xs text-blue-800">
                                                <strong>Risk Kontrol Matrisi (RCM)</strong> — IIA Std 2120 uyarınca, her denetlenebilir birim için süreç-risk-kontrol ilişkisini yapılandırılmış biçimde gösterir.
                                                Bu matris, kontrol etkinliğinin değerlendirilmesi ve denetim kapsamının belirlenmesi için temel referanstır.
                                            </div>
                                        </div>

                                        <DataTable
                                            columns={[
                                                {
                                                    key: 'process',
                                                    header: 'Süreç / Alt Süreç',
                                                    render: (row: any) => row.processName || row.process || '-'
                                                },
                                                {
                                                    key: 'risk',
                                                    header: 'Risk Tanımı',
                                                    render: (row: any) => (
                                                        <Tooltip content={row.riskName || row.risk || '-'}>
                                                            <div className="flex items-center gap-1.5 max-w-[200px]">
                                                                <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                                                                <span className="truncate">{row.riskName || row.risk || '-'}</span>
                                                            </div>
                                                        </Tooltip>
                                                    )
                                                },
                                                {
                                                    key: 'inherentRisk',
                                                    header: 'Doğal Risk',
                                                    align: 'center',
                                                    render: (row: any) => (
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold",
                                                            row.inherentRisk === 'Kritik' ? 'bg-rose-100 text-rose-700' :
                                                                row.inherentRisk === 'Yüksek' ? 'bg-red-100 text-red-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                        )}>
                                                            {row.inherentRisk || row.level || '-'}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    key: 'control',
                                                    header: 'Kontrol Tanımı',
                                                    sortable: true,
                                                    render: (row: any) => (
                                                        <Tooltip content={row.controlName || row.name || '-'}>
                                                            <div className="flex items-center gap-1.5 max-w-[250px]">
                                                                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                                                                <span className="truncate">{row.controlName || row.name || '-'}</span>
                                                            </div>
                                                        </Tooltip>
                                                    )
                                                },
                                                {
                                                    key: 'type',
                                                    header: 'Kontrol Türü',
                                                    sortable: true,
                                                    render: (row: any) => <span className="text-gray-600 text-xs">{row.controlType || row.type || '-'}</span>
                                                },
                                                {
                                                    key: 'effectiveness',
                                                    header: 'Kontrol Etkinliği',
                                                    align: 'center',
                                                    sortable: true,
                                                    render: (row: any) => (
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold",
                                                            row.effectiveness === 'Güçlü' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        )}>
                                                            {row.effectiveness || '-'}
                                                        </span>
                                                    )
                                                },
                                                {
                                                    key: 'testResult',
                                                    header: 'Son Test Sonucu',
                                                    align: 'center',
                                                    render: (row: any) => (
                                                        row.testResult ? (
                                                            <span className={clsx(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold",
                                                                row.testResult === 'Olumlu' ? 'bg-emerald-100 text-emerald-700' :
                                                                    row.testResult === 'Koşullu' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-red-100 text-red-700'
                                                            )}>
                                                                {row.testResult}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-[10px] italic">Test Edilmedi</span>
                                                        )
                                                    )
                                                },
                                                {
                                                    key: 'testAuditCode',
                                                    header: 'Denetim Referansı',
                                                    render: (row: any) => (
                                                        row.testAuditCode ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-medium text-primary">{row.testAuditCode}</span>
                                                                <span className="text-[9px] text-gray-500">{formatDate(row.testDate)}</span>
                                                            </div>
                                                        ) : '-'
                                                    )
                                                },
                                                {
                                                    key: 'residualRisk',
                                                    header: 'Artık Risk',
                                                    align: 'center',
                                                    sortable: true,
                                                    render: (row: any) => (
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold",
                                                            row.residualRisk === 'Düşük' ? 'bg-green-100 text-green-700' :
                                                                'bg-orange-100 text-orange-700'
                                                        )}>
                                                            {row.residualRisk || '-'}
                                                        </span>
                                                    )
                                                }
                                            ]}
                                            data={rcmData}
                                            rowKey={(row: any) => row.id || `${row.processName}-${row.riskName}-${row.controlName}`}
                                            emptyIcon={Shield}
                                            emptyTitle="Henüz kontrol tanımlanmamış"
                                            emptyDescription="Bu birim için üst panelden yeni kontrol ekleyebilirsiniz."
                                            className="border border-gray-200 rounded-lg shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </form>
            </Modal>

            {/* Denetim Oluşturma Modalı */}
            {isCreateAuditModalOpen && (
                <CreateAuditModal
                    isOpen={isCreateAuditModalOpen}
                    onClose={() => setIsCreateAuditModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateAuditModalOpen(false);
                        loadData();
                        showToast('Denetim başarıyla planlandı', 'success');
                    }}
                    staffList={staffList}
                    initialData={{
                        // Birim ismini initialData'ya veriyoruz - CreateAuditModal bunu departman seçimi olarak dolduracak
                        department: selectedUnitForAudit?.name || ''
                    }}
                />
            )}

            {/* Birim Karne Modalı */}
            {scorecardModal.isOpen && (
                <UnitScorecardModal
                    isOpen={scorecardModal.isOpen}
                    onClose={() => setScorecardModal({ isOpen: false, unitName: '' })}
                    unitName={scorecardModal.unitName}
                />
            )}
        </div>
    );
}
