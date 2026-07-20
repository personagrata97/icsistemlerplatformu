'use client';

import React, { useState, useEffect } from 'react';
import { auditApi, AuditStaff } from '@/lib/audit-api';
import { Edit2, Eye, Lock, TrendingUp, History } from 'lucide-react';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';
import StatCard from '@/components/ui/StatCard';
import CustomSelect from '@/components/ui/CustomSelect';
import Badge from '@/components/ui/Badge';
import EntityIcon from '@/components/ui/EntityIcon';
import { EntityType } from '@/lib/entity-config';
import PageHeader from '@/components/audit/PageHeader';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import Tooltip from '@/components/ui/Tooltip';
import EmptyState from '@/components/ui/EmptyState';
import Timeline, { TimelineEvent, TimelineActionType } from '@/components/ui/Timeline';
import { useAuth } from '@/context/AuthContext';
import { ROLES, checkRole } from '@/lib/auth-constants';
import StaffTabs from '@/components/audit/staff/StaffTabs';

const normalizeName = (name: string) => {
    return name.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, ''); // Nokta, boşluk, parantez her şeyi sil
};

import { getPhotoUrl, calculateDynamicSkills } from '@/lib/audit-utils';
import RatingStars from '@/components/ui/RatingStars';

interface SkillRatings {
    risk_assessment: number; // Risk ve Kontrol Güvence (COSO/COBIT)
    it_audit: number;        // BT ve Siber Güvenlik Denetimi
    financial_audit: number; // Finansal ve Operasyonel Denetim
    data_analysis: number;   // Veri Analitiği (SQL/Python)
    reporting_english: number; // Raporlama ve Yabancı Dil
}

const DEFAULT_SKILLS: SkillRatings = {
    risk_assessment: 2,
    it_audit: 1,
    financial_audit: 2,
    data_analysis: 1,
    reporting_english: 2
};

const SKILL_LABELS: Record<keyof SkillRatings, { label: string; shortLabel: string; entityType: EntityType; desc: string }> = {
    risk_assessment: {
        label: 'Risk Yönetimi ve İç Kontrol',
        shortLabel: 'Risk ve İç Kontrol',
        entityType: 'SKILL_RISK',
        desc: 'İç kontrol çerçeveleri (COSO), risk değerlendirme, süreç analizi ve suistimal (fraud) riskleri yetkinliği'
    },
    it_audit: {
        label: 'Bilgi Sistemleri ve Siber Güvenlik',
        shortLabel: 'BT ve Siber Güvenlik',
        entityType: 'SKILL_IT',
        desc: 'BT genel kontrolleri (COBIT), bilgi güvenliği standartları (ISO 27001) ve uygulama kontrolleri (ITAC)'
    },
    financial_audit: {
        label: 'Finansal, Operasyonel ve Uyum Denetimi',
        shortLabel: 'Finansal ve Uyum',
        entityType: 'SKILL_FINANCE',
        desc: 'Finansal tablo analizi, operasyonel süreç denetimleri ve yasal mevzuata uyum'
    },
    data_analysis: {
        label: 'Veri Analitiği ve CAATs',
        shortLabel: 'Veri Analitiği',
        entityType: 'SKILL_DATA',
        desc: 'Bilgisayar Destekli Denetim Teknikleri (CAATs), SQL/Python ile veri madenciliği ve sonuç görselleştirme'
    },
    reporting_english: {
        label: 'Raporlama ve İletişim',
        shortLabel: 'Raporlama ve İletişim',
        entityType: 'SKILL_REPORT',
        desc: 'IIA standartlarına uygun denetim bulgusu/raporu yazımı ve üst yönetim iletişim becerileri'
    }
};

const TITLES = [
    'Müfettiş Yardımcısı', 
    'Yetkili Müfettiş Yardımcısı', 
    'Müfettiş', 
    'Kıdemli Müfettiş', 
    'Başmüfettiş', 
    'Teftiş Kurulu Müdürü'
];

const SKILL_LEVELS = [
    { value: 0, label: 'Yok / Başlangıç' },
    { value: 1, label: 'Temel Düzey' },
    { value: 2, label: 'Orta Düzey' },
    { value: 3, label: 'İleri Düzey' },
    { value: 4, label: 'Uzman Düzey' }
];

export default function SkillsMatrixPage() {
    const { user, hasRole } = useAuth();
    const canManage = hasRole ? checkRole(hasRole, ROLES.STAFF_MANAGER) : false;
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTitleFilter, setSelectedTitleFilter] = useState<string[]>([]);
    const [selectedStaffFilter, setSelectedStaffFilter] = useState<string[]>([]);
    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('');
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('');

    // Yetkinlik düzenleme modalı
    const [selectedStaff, setSelectedStaff] = useState<AuditStaff | null>(null);
    const [modalSkills, setModalSkills] = useState<SkillRatings>({ ...DEFAULT_SKILLS });
    const [originalSkills, setOriginalSkills] = useState<SkillRatings>({ ...DEFAULT_SKILLS });
    const [justifications, setJustifications] = useState<Record<string, string>>({});
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyStaff, setHistoryStaff] = useState<AuditStaff | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await auditApi.getStaff();
            setStaffList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Personel yetkinlik verisi yüklenemedi:', error);
            showToast('Personel listesi yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSkills = (staff: AuditStaff) => {
        setSelectedStaff(staff);
        setJustifications({});
        try {
            const parsed = JSON.parse(staff.skills || '{}');
            setModalSkills(parsed);
            setOriginalSkills(parsed);
        } catch (e) {
            setModalSkills({ ...DEFAULT_SKILLS });
            setOriginalSkills({ ...DEFAULT_SKILLS });
        }
    };

    const handleSaveSkills = async () => {
        if (!selectedStaff) return;

        const changedKeys = Object.keys(SKILL_LABELS).filter(key => 
            (modalSkills[key as keyof SkillRatings] || 0) !== (originalSkills[key as keyof SkillRatings] || 0)
        );

        const missingJustification = changedKeys.find(key => !(justifications[key] || '').trim());

        if (missingJustification) {
            const skillName = SKILL_LABELS[missingJustification as keyof typeof SKILL_LABELS].label;
            showToast(`${skillName} puanını değiştirdiğiniz için gerekçe girmelisiniz.`, 'warning');
            return;
        }

        setSaving(true);
        try {
            const updatedSkillsStr = JSON.stringify(modalSkills);
            
            // Log oluşturma (Audit Trail)
            let newNotes = selectedStaff.notes || '';
            if (changedKeys.length > 0) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('tr-TR');
                const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const userName = user?.displayName || (user as any)?.name || user?.username || 'Sistem Yöneticisi';
                
                const logEntries = changedKeys.map(key => {
                    const skillName = SKILL_LABELS[key as keyof typeof SKILL_LABELS].label;
                    const oldVal = originalSkills[key as keyof SkillRatings] || 0;
                    const newVal = modalSkills[key as keyof SkillRatings] || 0;
                    // Format: [DD.MM.YYYY HH:MM] [USER] [SKILL] [OLD->NEW] JUSTIFICATION
                    return `[${dateStr} ${timeStr}] [${userName}] [${skillName}] [${oldVal} -> ${newVal}] ${justifications[key]}`;
                }).join('\n');
                newNotes = newNotes ? `${newNotes}\n\n${logEntries}` : logEntries;
            }

            await auditApi.updateStaff(selectedStaff.id, {
                skills: updatedSkillsStr,
                notes: newNotes
            });
            
            setStaffList(prev => prev.map(staff => 
                staff.id === selectedStaff.id ? { ...staff, skills: updatedSkillsStr, notes: newNotes } : staff
            ));

            showToast(`${selectedStaff.name} yetkinlik matrisi güncellendi.`, 'success');
            setSelectedStaff(null);
            setJustifications({});
        } catch (error: any) {
            console.error('Yetkinlik güncellenemedi:', error);
            showToast(error.message || 'Güncelleme sırasında bir hata oluştu.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = (staff.name || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
                             (staff.title || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));

        if (!matchesSearch) return false;

        if (selectedTitleFilter.length > 0) {
            if (!staff.title || !selectedTitleFilter.includes(staff.title)) return false;
        }

        if (selectedStaffFilter.length > 0 && !selectedStaffFilter.includes(staff.id)) return false;

        if (selectedSkillFilter) {
            const dynamic = calculateDynamicSkills(staff);
            const level = dynamic[selectedSkillFilter]?.total ?? 0;
            if (selectedLevelFilter) {
                return level >= parseInt(selectedLevelFilter);
            }
            return true;
        }

        return true;
    });

    const getAvgSkill = (key: string): number => {
        if (filteredStaff.length === 0) return 0;
        const total = filteredStaff.reduce((sum, staff) => {
            const dynamic = calculateDynamicSkills(staff);
            return sum + (dynamic[key]?.total || 0);
        }, 0);
        return total / filteredStaff.length;
    };

    const countExperts = (key: string): number => {
        return filteredStaff.filter(staff => {
            const dynamic = calculateDynamicSkills(staff);
            return (dynamic[key]?.total || 0) >= 3; // İleri veya Uzman Düzey
        }).length;
    };

    const getLevelBadgeVariant = (level: number): any => {
        if (level >= 4) return 'warning';
        if (level >= 3) return 'success';
        if (level >= 2) return 'primary';
        if (level >= 1) return 'info';
        return 'gray';
    };

    const checkIsSelf = (row: AuditStaff) => {
        const isIdMatch = String(row.id) === String(user?.id);
        const userName = user?.displayName || (user as any)?.name || user?.username || '';
        const normUser = normalizeName(userName);
        const normStaff = normalizeName(row.name || '');
        return isIdMatch || Boolean(normUser && normStaff && (normUser.includes(normStaff) || normStaff.includes(normUser)));
    };

    const renderSkillCell = (row: AuditStaff, skillKey: keyof ReturnType<typeof calculateDynamicSkills>) => {
        if (!canManage && !checkIsSelf(row)) return <div className="text-slate-300 flex justify-center py-2"><Lock size={16} /></div>;
        
        const dynamic = calculateDynamicSkills(row);
        const skill = dynamic[skillKey];
        const label = SKILL_LEVELS.find(l => l.value === Math.floor(skill.total))?.label.split(' ')[0] || 'Temel';
        
        const tooltipContent = (
            <div className="min-w-[260px] whitespace-nowrap text-[12px] p-1.5 pr-2">
                <div className="font-bold text-indigo-700 mb-2 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <TrendingUp size={13}/> Dinamik Hesaplama
                </div>
                <div className="flex justify-between py-1 gap-6">
                    <span className="text-slate-500 font-medium">Yönetici Puanı:</span> 
                    <span className="font-bold text-slate-700">{skill.base.toFixed(1)}</span>
                </div>
                <div className="mt-1 space-y-1">
                    {skill.reasons.map((r, i) => {
                        const isZero = r.includes('(+0.0)');
                        const parts = r.split(' (+');
                        const rName = parts[0];
                        const rVal = parts.length > 1 ? `+${parts[1].replace(')', '')}` : '';
                        
                        return (
                            <div key={i} className={`flex items-start justify-between gap-4 font-medium whitespace-nowrap ${isZero ? 'text-slate-400' : 'text-emerald-600'}`}>
                                <div className="flex gap-1.5 items-center">
                                    <span className="shrink-0 font-bold">{isZero ? '-' : '+'}</span> 
                                    <span>{rName}</span>
                                </div>
                                <span className="font-bold">{rVal}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="font-bold mt-2 pt-2 border-t border-slate-200 flex justify-between gap-6 text-indigo-900">
                    <span>Toplam (Max 4.0):</span> 
                    <span>{skill.total.toFixed(1)}</span>
                </div>
            </div>
        );

        return (
            <div className="flex justify-center">
                <Tooltip content={tooltipContent} position="top">
                    <div className="flex flex-col items-center gap-1.5 cursor-help w-full px-2">
                        <Badge variant={getLevelBadgeVariant(skill.total)} size="sm" className={skill.bonus > 0 ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200" : ""}>
                            {label} {skill.bonus > 0 && <span className="ml-1 text-[10px] text-indigo-600 font-bold">+{skill.bonus}</span>}
                        </Badge>
                        <RatingStars level={skill.total} />
                    </div>
                </Tooltip>
            </div>
        );
    };
    const columns = [
        {
            key: 'name',
            header: 'Personel',
            type: 'user',
            sortable: true,
            align: 'left' as const
        },
        {
            key: 'risk_assessment',
            header: SKILL_LABELS.risk_assessment.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => renderSkillCell(row, 'risk_assessment')
        },
        {
            key: 'it_audit',
            header: SKILL_LABELS.it_audit.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => renderSkillCell(row, 'it_audit')
        },
        {
            key: 'financial_audit',
            header: SKILL_LABELS.financial_audit.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => renderSkillCell(row, 'financial_audit')
        },
        {
            key: 'data_analysis',
            header: SKILL_LABELS.data_analysis.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => renderSkillCell(row, 'data_analysis')
        },
        {
            key: 'reporting_english',
            header: SKILL_LABELS.reporting_english.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => renderSkillCell(row, 'reporting_english')
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '120px',
            align: 'center' as const,
            render: (row: AuditStaff) => {
                const isSelfRow = checkIsSelf(row);
                const canEditThisRow = canManage || isSelfRow;
                if (!canManage && !isSelfRow) return null;

                return (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                            items={[
                                { 
                                    label: canEditThisRow ? 'Yetkinlikleri Düzenle' : 'Yetkinlikleri Görüntüle', 
                                    icon: canEditThisRow ? <Edit2 size={14} /> : <Eye size={14} />, 
                                    onClick: () => handleEditSkills(row) 
                                },
                                { 
                                    label: 'Yetkinlik Geçmişi', 
                                    icon: <History size={14} />, 
                                    onClick: () => { setHistoryStaff(row); setHistoryModalOpen(true); } 
                                }
                            ]}
                        />
                    </div>
                );
            }
        }
    ];

    const canEditStaff = selectedStaff ? (canManage) : false;

    if (loading && staffList.length === 0) {
        return <div className="flex items-center justify-center h-64"><LoadingState message="Yetkinlik Matrisi yükleniyor..." /></div>;
    }

    return (
        <div className="space-y-6">
            <StaffTabs />
            <PageHeader title="Yetkinlik Matrisi" subtitle="Personel uzmanlık alanları ve denetim kabiliyetleri" />


            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(SKILL_LABELS).map(([key, config]) => (
                    <StatCard
                        key={key}
                        title={`${config.shortLabel} Ort.`}
                        value={`${getAvgSkill(key).toFixed(1)} / 4.0`}
                        entityType={config.entityType}
                        subtext={`${countExperts(key)} İleri/Uzman Seviye Personel`}
                        onClick={() => setSelectedSkillFilter(prev => prev === key ? '' : key)}
                        className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === key ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                    />
                ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-4 mb-2 shadow-sm">
                <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shrink-0 mt-0.5 shadow-inner">
                    <TrendingUp size={24} />
                </div>
                <div className="w-full">
                    <h4 className="font-bold text-indigo-900 text-sm mb-1">
                        Dinamik Yetkinlik Değerlendirmesi
                    </h4>
                    <p className="text-sm text-indigo-800/80 leading-relaxed max-w-none">
                        Personelin yetkinlik seviyeleri; yöneticiler tarafından atanan temel değerlendirme puanlarına ek olarak, tamamlanan <strong>Mesleki Eğitimler (CPE)</strong> ve <strong>Kıdem/Ünvan</strong> durumu dikkate alınarak sistem tarafından otomatik olarak güncellenmektedir. Hesaplama detaylarını görmek için tablodaki seviye etiketlerinin üzerine gelebilirsiniz.
                    </p>
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Personel veya ünvan ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(filteredStaff, 'Yetkinlik_Matrisi')}
                filters={
                    <FilterDropdown
                        activeCount={(selectedSkillFilter ? (selectedLevelFilter ? 2 : 1) : 0) + (selectedTitleFilter.length > 0 ? 1 : 0) + (selectedStaffFilter.length > 0 ? 1 : 0)}
                        onClear={() => {
                            setSelectedSkillFilter('');
                            setSelectedLevelFilter('');
                            setSelectedTitleFilter([]);
                            setSelectedStaffFilter([]);
                            setSearchTerm('');
                        }}
                    >
                        <CustomSelect
                            label="Personel Filtresi"
                            options={staffList.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedStaffFilter}
                            onChange={(val) => setSelectedStaffFilter(val as string[])}
                            isMulti
                            showSearch
                            placeholder="Personel seçiniz..."
                        />
                        <CustomSelect
                            label="Ünvan"
                            options={TITLES.map(t => ({ value: t, label: t }))}
                            value={selectedTitleFilter}
                            onChange={(val) => setSelectedTitleFilter(val as string[])}
                            isMulti
                            placeholder="Ünvan seçiniz..."
                        />
                        <CustomSelect
                            label="Yetkinlik Alanı"
                            placeholder="Tüm Yetkinlikler"
                            options={[
                                ...Object.entries(SKILL_LABELS).map(([key, value]) => ({
                                    value: key,
                                    label: value.label
                                }))
                            ]}
                            value={selectedSkillFilter}
                            onChange={(val) => {
                                setSelectedSkillFilter(val as string);
                                if (!val) setSelectedLevelFilter('');
                            }}
                        />
                        {selectedSkillFilter && (
                            <CustomSelect
                                label="Yetkinlik Seviyesi"
                                placeholder="Tüm Seviyeler"
                                options={[
                                    { value: '1', label: 'Temel ve Üzeri' },
                                    { value: '2', label: 'Orta ve Üzeri' },
                                    { value: '3', label: 'İleri ve Üzeri' },
                                    { value: '4', label: 'Uzman' }
                                ]}
                                value={selectedLevelFilter}
                                onChange={(val) => setSelectedLevelFilter(val as string)}
                            />
                        )}
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={columns}
                data={filteredStaff}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={15}
                itemUnit="personel"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setSelectedSkillFilter('');
                    setSelectedLevelFilter('');
                    setSelectedTitleFilter([]);
                    setSelectedStaffFilter([]);
                }}
                className="mt-4 shadow-sm border border-gray-100"
            />

            {/* Yetkinlik Düzenleme Modalı */}
            <Modal
                isOpen={!!selectedStaff}
                onClose={() => setSelectedStaff(null)}
                title={
                    <div className="flex items-center gap-2">
                        <Edit2 className="text-indigo-500" size={22} />
                        <span>{selectedStaff?.name || ''} - Yetkinlik {canEditStaff ? 'Profilini Düzenle' : 'Profili'}</span>
                    </div>
                }
                size="lg"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="secondary" onClick={() => setSelectedStaff(null)} disabled={saving}>{canEditStaff ? 'İptal' : 'Kapat'}</Button>
                        {canEditStaff && (
                            <Button onClick={handleSaveSkills} isLoading={saving}>Değişiklikleri Kaydet</Button>
                        )}
                    </div>
                }
            >
                {selectedStaff && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-sm overflow-hidden shrink-0">
                                {getPhotoUrl(selectedStaff.photoUrl) ? (
                                    <img src={getPhotoUrl(selectedStaff.photoUrl)!} alt={selectedStaff.name} className="w-full h-full object-cover" />
                                ) : (
                                    selectedStaff.name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-lg">{selectedStaff.name}</div>
                                <div className="text-sm text-gray-500">{selectedStaff.title}</div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {(Object.keys(SKILL_LABELS) as Array<keyof SkillRatings>).map((key) => {
                                const skill = SKILL_LABELS[key];
                                return (
                                    <div key={key} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <EntityIcon type={skill.entityType} variant="pill" size={16} />
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-bold text-gray-800">{skill.label}</div>
                                                    <div className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">{skill.desc}</div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 w-44 flex justify-end">
                                                {canEditStaff ? (
                                                    <div className="w-full">
                                                        <CustomSelect
                                                            value={(modalSkills[key] || 0).toString()}
                                                            onChange={(val) => setModalSkills({ ...modalSkills, [key]: parseInt(val as string) })}
                                                            options={SKILL_LEVELS.map(l => ({ value: l.value.toString(), label: l.label }))}
                                                        />
                                                    </div>
                                                ) : (
                                                    <Badge variant={getLevelBadgeVariant(modalSkills[key])} size="md">
                                                        {SKILL_LEVELS.find(l => l.value === modalSkills[key])?.label}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {canEditStaff && (modalSkills[key] || 0) !== (originalSkills[key] || 0) && (
                                            <div className="mt-4 pl-12 pr-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg relative">
                                                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-indigo-50/50 border-t border-l border-indigo-100 transform rotate-45"></div>
                                                    <label className="block text-xs font-bold text-indigo-800 mb-1.5">
                                                        Puan Değişikliği Gerekçesi <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        className="w-full text-[13px] border border-indigo-200 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none shadow-sm"
                                                        rows={2}
                                                        placeholder={`${skill.shortLabel} yetkinliğini güncellediniz. Nedenini kısaca belirtiniz.`}
                                                        value={justifications[key] || ''}
                                                        onChange={(e) => setJustifications({...justifications, [key]: e.target.value})}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={historyModalOpen}
                onClose={() => { setHistoryModalOpen(false); setHistoryStaff(null); }}
                title={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                            <History size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">Yetkinlik Güncelleme Tarihçesi</div>
                            <div className="text-sm font-medium text-gray-500 mt-0.5">{historyStaff?.name}</div>
                        </div>
                    </div>
                }
                size="lg"
            >
                <div className="bg-slate-50/50 border rounded-xl overflow-hidden p-6 max-h-[60vh] overflow-y-auto min-h-[300px]">
                    <Timeline events={
                        historyStaff?.notes ? historyStaff.notes.split('\n\n').reverse().flatMap((logGroup, index) => {
                            if (!logGroup.trim()) return [];
                            return logGroup.split('\n').filter(line => line.trim()).map((line, i) => {
                                let datetime = '';
                                let userName = 'Sistem Yöneticisi';
                                let skill = '';
                                let change = '';
                                let reason = line;

                                const matchNew = line.match(/^\[(.*?)\] \[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)$/);
                                if (matchNew) {
                                    datetime = matchNew[1];
                                    userName = matchNew[2];
                                    skill = matchNew[3];
                                    change = matchNew[4];
                                    reason = matchNew[5];
                                } else {
                                    const matchOld = line.match(/^\[(.*?)\] Yetkinlik Güncellemesi - (.*?) \((.*?)\): (.*)$/);
                                    if (matchOld) {
                                        datetime = matchOld[1];
                                        skill = matchOld[2];
                                        change = matchOld[3];
                                        reason = matchOld[4];
                                    }
                                }

                                if (!datetime) {
                                    return {
                                        id: `${index}-${i}`,
                                        timestamp: '',
                                        user: 'Sistem',
                                        title: 'Sistem Notu',
                                        actionType: 'comment' as TimelineActionType,
                                        description: line
                                    };
                                }

                                const [oldVal, newVal] = change.split('->').map(v => v.trim());

                                return {
                                    id: `${index}-${i}`,
                                    timestamp: datetime,
                                    user: userName,
                                    title: skill,
                                    actionType: 'update' as TimelineActionType,
                                    details: {
                                        oldValue: oldVal,
                                        newValue: newVal,
                                        label: 'Puan Değişimi'
                                    },
                                    description: reason
                                };
                            });
                        }).filter(e => e.timestamp) : []
                    } emptyStateMessage="Bu personel için henüz kaydedilmiş bir yetkinlik değişikliği geçmiş kaydı bulunmamaktadır." />
                </div>
            </Modal>
        </div>
    );
}
