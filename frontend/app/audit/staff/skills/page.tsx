'use client';

import React, { useState, useEffect } from 'react';
import { auditApi, AuditStaff } from '@/lib/audit-api';
import { Users, Shield, Cpu, BookOpen, BarChart3, Database, Globe, Star, Search, Edit2, RefreshCw } from 'lucide-react';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import PageHeader from '@/components/audit/PageHeader';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';
import StatCard from '@/components/ui/StatCard';
import CustomSelect from '@/components/ui/CustomSelect';
import { BackButton } from '@/components/ui/BackButton';
import { FilterDropdown } from '@/components/ui/FilterDropdown';

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

const SKILL_LABELS: Record<keyof SkillRatings, { label: string; icon: any; color: string; desc: string }> = {
    risk_assessment: {
        label: 'Risk & Kontrol Güvence',
        icon: Shield,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        desc: 'İç kontrol metodolojileri, risk yönetimi ve süreç analizi yetkinliği'
    },
    it_audit: {
        label: 'BT & Siber Güvenlik',
        icon: Cpu,
        color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
        desc: 'Bilgi teknolojileri genel kontrolleri, siber güvenlik ve sistem denetimi'
    },
    financial_audit: {
        label: 'Finansal & Operasyonel',
        icon: BarChart3,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        desc: 'Finansal tablolar analizi, vergi mevzuatı ve operasyonel süreç denetimi'
    },
    data_analysis: {
        label: 'Veri Analitiği',
        icon: Database,
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        desc: 'Veri analiz metotları, raporlama ve veri madenciliği yetkinliği'
    },
    reporting_english: {
        label: 'Raporlama & Sunum',
        icon: Globe,
        color: 'text-purple-600 bg-purple-50 border-purple-100',
        desc: 'Raporlama standartları doğrultusunda rapor yazımı ve sunum teknikleri'
    }
};

const SKILL_LEVELS = [
    { value: 0, label: 'Yok / Başlangıç' },
    { value: 1, label: 'Temel Düzey' },
    { value: 2, label: 'Orta Düzey' },
    { value: 3, label: 'İleri Düzey' },
    { value: 4, label: 'Uzman Düzey' }
];

export default function SkillsMatrixPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [staffList, setStaffList] = useState<AuditStaff[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

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
            showToast(`${selectedStaff.name} yetkinlik matrisi güncellendi.`, 'success');
            setSelectedStaff(null);
            loadData();
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

        if (selectedSkillFilter !== 'all') {
            const skills = parseSkills(staff.skills);
            const level = skills[selectedSkillFilter as keyof SkillRatings] ?? 0;
            if (selectedLevelFilter !== 'all') {
                return level === parseInt(selectedLevelFilter);
            }
            return level >= 2; // Default show intermediate and above
        }

        return true;
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
            header: 'Risk & Kontrol',
            align: 'center' as const,
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
            header: 'BT Denetimi',
            align: 'center' as const,
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
            header: 'Finansal Den.',
            align: 'center' as const,
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
            header: 'Veri Analitiği',
            align: 'center' as const,
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
            header: 'Raporlama & Sunum',
            align: 'center' as const,
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
            header: '',
            width: '80px',
            align: 'center' as const,
            render: (row: AuditStaff) => (
                <ActionMenu
                    items={[
                        { label: 'Yetkinlikleri Düzenle', icon: <Edit2 size={14} />, onClick: () => handleEditSkills(row) }
                    ]}
                />
            )
        }
    ];

    if (loading && staffList.length === 0) {
        return <div className="flex items-center justify-center h-64"><LoadingState message="Yetkinlik Matrisi yükleniyor..." /></div>;
    }

    return (
        <div className="space-y-6">
            <BackButton href="/audit/staff" label="Denetim Ekibi Listesine Dön" />
            <PageHeader
                title="Yetkinlik Matrisi"
                subtitle="Denetim ekibinin uzmanlık alanları, teknik yetkinlikleri ve kaynak planlama matrisi"
            />

            <PageToolbar
                searchPlaceholder="Personel veya unvan ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadData}
                filters={
                    <FilterDropdown
                        activeCount={selectedSkillFilter !== 'all' ? (selectedLevelFilter !== 'all' ? 2 : 1) : 0}
                        onClear={() => {
                            setSelectedSkillFilter('all');
                            setSelectedLevelFilter('all');
                            setSearchTerm('');
                        }}
                    >
                        <CustomSelect
                            label="Yetkinlik Alanı"
                            options={[
                                { value: 'all', label: 'Tüm Yetkinlikler' },
                                { value: 'risk_assessment', label: 'Risk & Kontrol' },
                                { value: 'it_audit', label: 'BT Denetimi' },
                                { value: 'financial_audit', label: 'Finansal Denetim' },
                                { value: 'data_analysis', label: 'Veri Analitiği' },
                                { value: 'reporting_english', label: 'Raporlama & Sunum' }
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
                    title="Risk & Kontrol Ortalama"
                    value={`${getAvgSkill('risk_assessment').toFixed(1)} / 4.0`}
                    icon={Shield}
                    color="indigo"
                    subtext={`${countExperts('risk_assessment')} İleri/Uzman Müfettiş`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'risk_assessment' ? 'all' : 'risk_assessment')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'risk_assessment' ? 'ring-2 ring-indigo-500 scale-[1.02] bg-indigo-50/10' : ''}`}
                />
                <StatCard
                    title="BT Denetimi Ortalama"
                    value={`${getAvgSkill('it_audit').toFixed(1)} / 4.0`}
                    icon={Cpu}
                    color="blue"
                    subtext={`${countExperts('it_audit')} İleri/Uzman Müfettiş`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'it_audit' ? 'all' : 'it_audit')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'it_audit' ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-50/10' : ''}`}
                />
                <StatCard
                    title="Finansal Den. Ortalama"
                    value={`${getAvgSkill('financial_audit').toFixed(1)} / 4.0`}
                    icon={BarChart3}
                    color="emerald"
                    subtext={`${countExperts('financial_audit')} İleri/Uzman Müfettiş`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'financial_audit' ? 'all' : 'financial_audit')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'financial_audit' ? 'ring-2 ring-emerald-500 scale-[1.02] bg-emerald-50/10' : ''}`}
                />
                <StatCard
                    title="Veri Analitiği Ortalama"
                    value={`${getAvgSkill('data_analysis').toFixed(1)} / 4.0`}
                    icon={Database}
                    color="amber"
                    subtext={`${countExperts('data_analysis')} İleri/Uzman Müfettiş`}
                    onClick={() => setSelectedSkillFilter(prev => prev === 'data_analysis' ? 'all' : 'data_analysis')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${selectedSkillFilter === 'data_analysis' ? 'ring-2 ring-amber-500 scale-[1.02] bg-amber-50/10' : ''}`}
                />
                <StatCard
                    title="Raporlama & Sunum Ortalama"
                    value={`${getAvgSkill('reporting_english').toFixed(1)} / 4.0`}
                    icon={Globe}
                    color="purple"
                    subtext={`${countExperts('reporting_english')} İleri/Uzman Müfettiş`}
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
                    }}
                />
            </div>

            {/* Yetkinlik Düzenleme Modalı */}
            <Modal
                isOpen={!!selectedStaff}
                onClose={() => setSelectedStaff(null)}
                title={`${selectedStaff?.name} - Yetkinlik Profilini Düzenle`}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="secondary" onClick={() => setSelectedStaff(null)} disabled={saving}>İptal</Button>
                        <Button onClick={handleSaveSkills} isLoading={saving}>Değişiklikleri Kaydet</Button>
                    </div>
                }
            >
                {selectedStaff && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shadow-sm overflow-hidden">
                                {selectedStaff.photoUrl ? (
                                    <img src={selectedStaff.photoUrl.startsWith('http') ? selectedStaff.photoUrl : `http://localhost:3001${selectedStaff.photoUrl}`} alt={selectedStaff.name} className="w-full h-full object-cover" />
                                ) : (
                                    selectedStaff.name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{selectedStaff.name}</div>
                                <div className="text-xs text-gray-500">{selectedStaff.title}</div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {(Object.keys(SKILL_LABELS) as Array<keyof SkillRatings>).map((key) => {
                                const skill = SKILL_LABELS[key];
                                const Icon = skill.icon;
                                return (
                                    <div key={key} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg border ${skill.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800">{skill.label}</div>
                                                    <div className="text-[11px] text-gray-500 font-medium leading-relaxed">{skill.desc}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {SKILL_LEVELS.find(l => l.value === modalSkills[key])?.label}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max="4"
                                                step="1"
                                                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                                                value={modalSkills[key]}
                                                onChange={(e) => setModalSkills({ ...modalSkills, [key]: parseInt(e.target.value) })}
                                            />
                                            <div className="flex justify-between w-full text-[10px] text-gray-400 font-medium px-1">
                                                <span>Başlangıç</span>
                                                <span>Temel</span>
                                                <span>Orta</span>
                                                <span>İleri</span>
                                                <span>Uzman</span>
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
