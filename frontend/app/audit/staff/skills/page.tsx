'use client';

import React, { useState, useEffect } from 'react';
import { auditApi, AuditStaff } from '@/lib/audit-api';
import { Users, Shield, Cpu, BookOpen, BarChart3, Database, Globe, Star, Search, Edit2, RefreshCw, Eye } from 'lucide-react';
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
import { BackButton } from '@/components/ui/BackButton';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { useAuth } from '@/context/AuthContext';
import { ROLES, checkRole } from '@/lib/auth-constants';

const normalizeName = (name: string) => {
    return name.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, ''); // Nokta, boşluk, parantez her şeyi sil
};

// Fotoğraf URL yardımcısı
const getPhotoUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${origin}${url}`;
};

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
    // Yöneticileri belirleme (Büyük/Küçük Harf Duyarsız)
    const MANAGER_ROLES = [
        'admin', 'audit_admin', 'audit_manager', 'manager', 'cae',
        'teftiş kurulu başkanı', 'başkan', 'teftiş kurulu müdürü', 'müdür',
        'system_admin', 'yönetici'
    ];
    const userRoleStr = (user?.role || '').toLowerCase();
    const canManage = MANAGER_ROLES.includes(userRoleStr) || (hasRole ? checkRole(hasRole, ROLES.STAFF_MANAGER) : false);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
    const [selectedTitleFilter, setSelectedTitleFilter] = useState<string[]>([]);

    // Yetkinlik düzenleme modalı
    const [selectedStaff, setSelectedStaff] = useState<AuditStaff | null>(null);
    const [modalSkills, setModalSkills] = useState<SkillRatings>({ ...DEFAULT_SKILLS });

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

    const parseSkills = (skillsStr?: string): SkillRatings => {
        if (!skillsStr) return { ...DEFAULT_SKILLS };
        try {
            const parsed = JSON.parse(skillsStr);
            return {
                risk_assessment: parsed.risk_assessment ?? DEFAULT_SKILLS.risk_assessment,
                it_audit: parsed.it_audit ?? DEFAULT_SKILLS.it_audit,
                financial_audit: parsed.financial_audit ?? DEFAULT_SKILLS.financial_audit,
                data_analysis: parsed.data_analysis ?? DEFAULT_SKILLS.data_analysis,
                reporting_english: parsed.reporting_english ?? DEFAULT_SKILLS.reporting_english
            };
        } catch (e) {
            return { ...DEFAULT_SKILLS };
        }
    };

    const handleEditSkills = (staff: AuditStaff) => {
        setSelectedStaff(staff);
        setModalSkills(parseSkills(staff.skills));
    };

    const handleSaveSkills = async () => {
        if (!selectedStaff) return;
        setSaving(true);
        try {
            const updatedSkillsStr = JSON.stringify(modalSkills);
            await auditApi.updateStaff(selectedStaff.id, {
                skills: updatedSkillsStr
            });
            
            // Optimistic Update: Tablo ve istatistiklerin anında güncellenmesi için yerel state'i eziyoruz.
            // (Backend'in önbellekleme/gecikme yapma ihtimaline karşı loadData()'yı beklemeyiz)
            setStaffList(prev => prev.map(staff => 
                staff.id === selectedStaff.id ? { ...staff, skills: updatedSkillsStr } : staff
            ));

            showToast(`${selectedStaff.name} yetkinlik matrisi güncellendi.`, 'success');
            setSelectedStaff(null);
        } catch (error: any) {
            console.error('Yetkinlik güncellenemedi:', error);
            showToast(error.message || 'Güncelleme sırasında bir hata oluştu.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Filtreleme mantığı
    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = (staff.name || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
                             (staff.title || '').toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));

        if (!matchesSearch) return false;

        if (selectedTitleFilter.length > 0) {
            if (!staff.title || !selectedTitleFilter.includes(staff.title)) return false;
        }

        if (selectedSkillFilter !== 'all') {
            const skills = parseSkills(staff.skills);
            const level = skills[selectedSkillFilter as keyof SkillRatings] ?? 0;
            if (selectedLevelFilter !== 'all') {
                return level >= parseInt(selectedLevelFilter);
            }
            return true;
        }

        return true;
    }).map(staff => {
        // DataTable'ın sortable özelliğini kullanabilmesi için parse edilmiş skilleri objenin en üst seviyesine taşıyoruz
        const parsed = parseSkills(staff.skills);
        return {
            ...staff,
            risk_assessment: parsed.risk_assessment,
            it_audit: parsed.it_audit,
            financial_audit: parsed.financial_audit,
            data_analysis: parsed.data_analysis,
            reporting_english: parsed.reporting_english
        };
    });

    // İstatistik Hesaplamaları
    const getAvgSkill = (key: keyof SkillRatings): number => {
        if (filteredStaff.length === 0) return 0;
        const total = filteredStaff.reduce((sum, staff) => {
            const skills = parseSkills(staff.skills);
            return sum + (skills[key] || 0);
        }, 0);
        return total / filteredStaff.length;
    };

    const countExperts = (key: keyof SkillRatings): number => {
        return filteredStaff.filter(staff => {
            const skills = parseSkills(staff.skills);
            return skills[key] >= 3; // İleri veya Uzman Düzey
        }).length;
    };

    const renderStars = (level: number) => {
        return (
            <div className="flex gap-0.5">
                {[0, 1, 2, 3].map((idx) => (
                    <Star
                        key={idx}
                        size={13}
                        className={idx < level ? "fill-amber-400 text-amber-500" : "text-slate-200 fill-slate-100"}
                    />
                ))}
            </div>
        );
    };

    const getLevelBadgeVariant = (level: number): any => {
        switch(level) {
            case 0: return 'gray';
            case 1: return 'info';
            case 2: return 'primary';
            case 3: return 'success';
            case 4: return 'warning';
            default: return 'gray';
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Personel',
            sortable: true,
            render: (row: AuditStaff) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 font-bold tracking-tighter shadow-inner overflow-hidden">
                        {getPhotoUrl(row.photoUrl) ? (
                            <img src={getPhotoUrl(row.photoUrl)!} alt={row.name} className="w-full h-full object-cover" />
                        ) : (
                            row.name.substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{row.title}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'risk_assessment',
            header: SKILL_LABELS.risk_assessment.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => {
                const skills = parseSkills(row.skills);
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600">{SKILL_LEVELS.find(l => l.value === skills.risk_assessment)?.label.split(' ')[0]}</span>
                        {renderStars(skills.risk_assessment)}
                    </div>
                );
            }
        },
        {
            key: 'it_audit',
            header: SKILL_LABELS.it_audit.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => {
                const skills = parseSkills(row.skills);
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600">{SKILL_LEVELS.find(l => l.value === skills.it_audit)?.label.split(' ')[0]}</span>
                        {renderStars(skills.it_audit)}
                    </div>
                );
            }
        },
        {
            key: 'financial_audit',
            header: SKILL_LABELS.financial_audit.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => {
                const skills = parseSkills(row.skills);
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600">{SKILL_LEVELS.find(l => l.value === skills.financial_audit)?.label.split(' ')[0]}</span>
                        {renderStars(skills.financial_audit)}
                    </div>
                );
            }
        },
        {
            key: 'data_analysis',
            header: SKILL_LABELS.data_analysis.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => {
                const skills = parseSkills(row.skills);
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600">{SKILL_LEVELS.find(l => l.value === skills.data_analysis)?.label.split(' ')[0]}</span>
                        {renderStars(skills.data_analysis)}
                    </div>
                );
            }
        },
        {
            key: 'reporting_english',
            header: SKILL_LABELS.reporting_english.label,
            align: 'center' as const,
            sortable: true,
            render: (row: AuditStaff) => {
                const skills = parseSkills(row.skills);
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600">{SKILL_LEVELS.find(l => l.value === skills.reporting_english)?.label.split(' ')[0]}</span>
                        {renderStars(skills.reporting_english)}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: 'İşlemler',
            width: '120px',
            align: 'center' as const,
            render: (row: AuditStaff) => {
                const isIdMatch = String(row.id) === String(user?.id);
                let userName = user?.displayName || (user as any)?.name || user?.username || '';
                const rawUsername = (user?.username || '').toLowerCase();
                
                // DEVMODE HACK: Admin/CAE hesaplarını Kerem Yılmaz olarak kabul et
                if (rawUsername === 'admin' || rawUsername === 'cae' || userName.toLowerCase().includes('admin') || userName.toLowerCase().includes('cae') || userName.toLowerCase().includes('yönetici')) {
                    userName = 'Kerem Yılmaz';
                }

                const normUser = normalizeName(userName);
                const normStaff = normalizeName(row.name || '');
                const isNameMatch = Boolean(normUser && normStaff && (normUser.includes(normStaff) || normStaff.includes(normUser)));
                const isSelfRow = isIdMatch || isNameMatch;
                const canEditThisRow = canManage && !isSelfRow;
                return (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                            items={[
                                { 
                                    label: canEditThisRow ? 'Yetkinlikleri Düzenle' : 'Yetkinlikleri Görüntüle', 
                                    icon: canEditThisRow ? <Edit2 size={14} /> : <Eye size={14} />, 
                                    onClick: () => handleEditSkills(row) 
                                }
                            ]}
                        />
                    </div>
                );
            }
        }
    ];

    const isSelfStaffId = selectedStaff && user ? String(selectedStaff.id) === String(user.id) : false;
    let modalUserName = user?.displayName || (user as any)?.name || user?.username || '';
    const rawModalUsername = (user?.username || '').toLowerCase();
    
    // DEVMODE HACK: Admin/CAE hesaplarını Kerem Yılmaz olarak kabul et
    if (rawModalUsername === 'admin' || rawModalUsername === 'cae' || modalUserName.toLowerCase().includes('admin') || modalUserName.toLowerCase().includes('cae') || modalUserName.toLowerCase().includes('yönetici')) {
        modalUserName = 'Kerem Yılmaz';
    }

    const normModalUser = normalizeName(modalUserName);
    const normModalStaff = normalizeName(selectedStaff?.name || '');
    const isSelfStaffName = Boolean(selectedStaff && normModalUser && normModalStaff && (normModalUser.includes(normModalStaff) || normModalStaff.includes(normModalUser)));
    const isSelfStaff = isSelfStaffId || isSelfStaffName;
    const canEditStaff = selectedStaff ? (canManage && !isSelfStaff) : false;

    if (loading && staffList.length === 0) {
        return <div className="flex items-center justify-center h-64"><LoadingState message="Yetkinlik Matrisi yükleniyor..." /></div>;
    }

    return (
        <div className="space-y-6">
            <BackButton href="/audit/staff" label="Denetim Ekibi Listesine Dön" />
            <PageHeader title="Yetkinlik Matrisi" subtitle="Personel uzmanlık alanları ve denetim kabiliyetleri" />

            <PageToolbar
                searchPlaceholder="Personel veya ünvan ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                showExportButton={true}
                onExportClick={() => auditApi.exportToExcel(filteredStaff, 'Yetkinlik_Matrisi')}
                filters={
                        <FilterDropdown
                        activeCount={(selectedSkillFilter !== 'all' ? (selectedLevelFilter !== 'all' ? 2 : 1) : 0) + (selectedTitleFilter.length > 0 ? 1 : 0)}
                        onClear={() => {
                            setSelectedSkillFilter('all');
                            setSelectedLevelFilter('all');
                            setSelectedTitleFilter([]);
                            setSearchTerm('');
                        }}
                    >
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
                            options={[
                                { value: 'all', label: 'Tüm Yetkinlikler' },
                                ...Object.entries(SKILL_LABELS).map(([key, value]) => ({
                                    value: key,
                                    label: value.label
                                }))
                            ]}
                            value={selectedSkillFilter}
                            onChange={(val) => {
                                setSelectedSkillFilter(val as string);
                                if (val === 'all') setSelectedLevelFilter('all');
                            }}
                        />
                        {selectedSkillFilter !== 'all' && (
                            <CustomSelect
                                label="Yetkinlik Seviyesi"
                                options={[
                                    { value: 'all', label: 'Tüm Seviyeler' },
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

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard
                    title={`${SKILL_LABELS.risk_assessment.shortLabel} Ort.`}
                    value={`${getAvgSkill('risk_assessment').toFixed(1)} / 4.0`}
                    entityType="SKILL_RISK"
                    subtext={`${countExperts('risk_assessment')} İleri/Uzman Seviye Personel`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'risk_assessment' ? 'all' : 'risk_assessment')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'risk_assessment' ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />
                <StatCard
                    title={`${SKILL_LABELS.it_audit.shortLabel} Ort.`}
                    value={`${getAvgSkill('it_audit').toFixed(1)} / 4.0`}
                    entityType="SKILL_IT"
                    subtext={`${countExperts('it_audit')} İleri/Uzman Seviye Personel`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'it_audit' ? 'all' : 'it_audit')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'it_audit' ? 'ring-2 ring-cyan-500 scale-[1.02] bg-cyan-50/10' : ''}`}
                />
                <StatCard
                    title={`${SKILL_LABELS.financial_audit.shortLabel} Ort.`}
                    value={`${getAvgSkill('financial_audit').toFixed(1)} / 4.0`}
                    entityType="SKILL_FINANCE"
                    subtext={`${countExperts('financial_audit')} İleri/Uzman Seviye Personel`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'financial_audit' ? 'all' : 'financial_audit')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'financial_audit' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />
                <StatCard
                    title={`${SKILL_LABELS.data_analysis.shortLabel} Ort.`}
                    value={`${getAvgSkill('data_analysis').toFixed(1)} / 4.0`}
                    entityType="SKILL_DATA"
                    subtext={`${countExperts('data_analysis')} İleri/Uzman Seviye Personel`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'data_analysis' ? 'all' : 'data_analysis')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'data_analysis' ? 'ring-2 ring-orange-500 scale-[1.02] bg-orange-50/10' : ''}`}
                />
                <StatCard
                    title={`${SKILL_LABELS.reporting_english.shortLabel} Ort.`}
                    value={`${getAvgSkill('reporting_english').toFixed(1)} / 4.0`}
                    entityType="SKILL_REPORT"
                    subtext={`${countExperts('reporting_english')} İleri/Uzman Seviye Personel`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'reporting_english' ? 'all' : 'reporting_english')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'reporting_english' ? 'ring-2 ring-purple-500 scale-[1.02] bg-purple-50/10' : ''}`}
                />
            </div>

            {/* Veri Tablosu */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
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
                        setSelectedSkillFilter('all');
                        setSelectedLevelFilter('all');
                        setSelectedTitleFilter([]);
                    }}
                />
            </div>

            {/* Yetkinlik Düzenleme Modalı */}
            <Modal
                isOpen={!!selectedStaff}
                onClose={() => setSelectedStaff(null)}
                title={`${selectedStaff?.name || ''} - Yetkinlik ${canEditStaff ? 'Profilini Düzenle' : 'Profili'}`}
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
                                                            value={modalSkills[key].toString()}
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
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
