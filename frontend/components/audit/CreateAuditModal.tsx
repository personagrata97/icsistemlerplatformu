import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Target, Users, Sparkles } from 'lucide-react';
import { auditApi, AuditStaff } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';
import CustomSelect from '@/components/ui/CustomSelect';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import StaffSelect from '@/components/audit/StaffSelect';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { DEPARTMENTS, HIERARCHY } from '@/lib/organization-constants';
import { calculateDynamicSkills } from '@/lib/audit-utils';

interface CreateAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data?: any) => void;
    staffList: AuditStaff[];
    initialData?: any;
    isEditMode?: boolean;
}

export default function CreateAuditModal({ isOpen, onClose, onSuccess, staffList, initialData, isEditMode = false }: CreateAuditModalProps) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [selectedParentDept, setSelectedParentDept] = useState<string>('');
    const [units, setUnits] = useState<any[]>([]);
    const [processes, setProcesses] = useState<any[]>([]);
    const [loadingProcesses, setLoadingProcesses] = useState(false);
    const [hasSubUnits, setHasSubUnits] = useState(true);


    const [formData, setFormData] = useState({
        code: '',
        title: '',
        type: 'Şube Denetimi',
        status: 'Planlandı',
        period: '2026-Q1',
        // Scope & Objectives
        objective: '',
        scope: '',
        methodology: '',
        criteria: '',
        riskLevel: 'Orta',
        plannedStartDate: '',
        plannedEndDate: '',
        supervisor: '',
        auditors: [] as string[],
        department: '',
        processId: ''
    });

    // Reset or Populate form
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initialData) {
                // Determine supervisor and auditors from team array if exists
                let supervisorId = initialData.supervisor || '';
                let auditorIds = Array.isArray(initialData.auditors) ? initialData.auditors : [];

                if (initialData.team) {
                    const teamMembers = typeof initialData.team === 'string'
                        ? JSON.parse(initialData.team)
                        : initialData.team;
                    
                    if (Array.isArray(teamMembers)) {
                        const supervisor = teamMembers.find(m => m.role?.includes('Gözetmen') || m.role?.includes('Yönetici'));
                        if (supervisor) supervisorId = supervisor.id;

                        const auditors = teamMembers.filter(m => m.role?.includes('Müfettiş'));
                        if (auditors.length > 0) auditorIds = auditors.map(m => m.id);
                    }
                }

                setFormData({
                    code: initialData.code || '',
                    title: initialData.title || '',
                    type: initialData.type || 'Şube Denetimi',
                    status: initialData.status || 'Planlandı',
                    period: initialData.period || '2026-Q1',
                    objective: initialData.objective || '',
                    scope: initialData.scope || '',
                    methodology: initialData.methodology || '',
                    criteria: initialData.criteria || '',
                    riskLevel: initialData.riskLevel || 'Orta',
                    plannedStartDate: initialData.plannedStartDate ? new Date(initialData.plannedStartDate).toISOString().split('T')[0] : (initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : ''),
                    plannedEndDate: initialData.plannedEndDate ? new Date(initialData.plannedEndDate).toISOString().split('T')[0] : (initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''),
                    supervisor: supervisorId,
                    auditors: auditorIds,
                    department: initialData.department || '',
                    processId: initialData.processId || ''
                });
                // Set parent department for edit mode
                if (initialData.department) {
                    for (const group of HIERARCHY) {
                        const child = group.children.find((c: any) =>
                            c.title === initialData.department ||
                            (c.children && c.children.some((sc: any) => sc.title === initialData.department))
                        );
                        if (child) {
                            setSelectedParentDept(child.title);
                            break;
                        }
                    }
                }
            } else {
                setFormData({
                    code: '',
                    title: '',
                    type: 'Şube Denetimi',
                    status: 'Planlandı',
                    period: '2026-Q1',
                    objective: '',
                    scope: '',
                    methodology: '',
                    criteria: '',
                    riskLevel: 'Orta',
                    plannedStartDate: new Date().toISOString().split('T')[0],
                    plannedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    supervisor: '',
                    auditors: [],
                    department: '',
                    processId: ''
                });
                setSelectedParentDept('');
            }
            setActiveTab('general');
        }
    }, [isOpen, initialData, isEditMode]);

    // Fetch units to map department names to IDs
    useEffect(() => {
        if (isOpen) {
            auditApi.getAuditableUnits().then(setUnits).catch(console.error);
        }
    }, [isOpen]);

    // Check if selected parent department has sub-units
    useEffect(() => {
        if (selectedParentDept) {
            let found = false;
            for (const group of HIERARCHY) {
                const child = group.children.find(c => c.title === selectedParentDept);
                if (child && 'children' in child && (child as any).children.length > 0) {
                    found = true;
                    break;
                }
            }
            setHasSubUnits(found);

            // If it has no sub-units (like Risk Management), automatically set department to parent name
            if (!found) {
                setFormData(prev => ({ ...prev, department: selectedParentDept }));
            }
        } else {
            setHasSubUnits(true);
        }
    }, [selectedParentDept]);

    // Kaynak Planlama: İzin Kontrolü
    const leaveWarnings = React.useMemo(() => {
        if (!formData.plannedStartDate || !formData.plannedEndDate) return [];
        const warnings: { name: string; dateStr: string; type: string }[] = [];
        const selectedIds = [...formData.auditors];
        if (formData.supervisor) selectedIds.push(formData.supervisor);

        const sDate = new Date(formData.plannedStartDate);
        const eDate = new Date(formData.plannedEndDate);

        selectedIds.forEach(id => {
            const staff = staffList.find(s => s.id === id);
            if (staff && staff.leaves) {
                const overlappingLeaves = staff.leaves.filter((leave: any) => {
                    if (leave.status === 'İptal Edildi') return false;
                    const lsDate = new Date(leave.startDate);
                    const leDate = new Date(leave.endDate);
                    // Overlap logic: Start A <= End B and End A >= Start B
                    return sDate <= leDate && eDate >= lsDate;
                });
                
                overlappingLeaves.forEach((leave: any) => {
                    warnings.push({
                        name: staff.name,
                        dateStr: `${new Date(leave.startDate).toLocaleDateString('tr-TR')} - ${new Date(leave.endDate).toLocaleDateString('tr-TR')}`,
                        type: leave.type
                    });
                });
            }
        });
        return warnings;
    }, [formData.auditors, formData.supervisor, formData.plannedStartDate, formData.plannedEndDate, staffList]);

    // Fetch processes when department changes and type is 'Süreç Denetimi'
    useEffect(() => {
        const fetchProcesses = async () => {
            if (formData.type === 'Süreç Denetimi' && formData.department) {
                setLoadingProcesses(true);
                try {
                    // Find unit ID by name
                    const unit = units.find(u => u.name === formData.department);
                    // Fallback to searching in HIERARCHY if not in API units yet
                    if (unit) {
                        const data = await auditApi.getProcesses(unit.id);
                        setProcesses(data);
                    } else {
                        // Attempt to find any unit that matches the name for demo/safety
                        const anyUnit = units.find(u => u.name.includes(formData.department));
                        if (anyUnit) {
                            const data = await auditApi.getProcesses(anyUnit.id);
                            setProcesses(data);
                        } else {
                            setProcesses([]);
                        }
                    }
                } catch (error) {
                    console.error('Fetch processes error:', error);
                    setProcesses([]);
                } finally {
                    setLoadingProcesses(false);
                }
            } else {
                setProcesses([]);
            }
        };

        fetchProcesses();
    }, [formData.department, formData.type, units]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        const payload: any = { ...formData };
        
        // Transform team members into the unified 'team' field
        const teamArray: any[] = [];
        
        if (formData.supervisor) {
            const staff = staffList.find(s => s.id === formData.supervisor);
            if (staff) {
                payload.supervisorId = staff.id;
                payload.supervisor = staff.name; // Save real name to DB

                teamArray.push({
                    id: staff.id,
                    name: staff.name,
                    role: 'Gözetim Sorumlusu',
                    email: staff.email,
                    phone: staff.phone
                });
            } else {
                payload.supervisorId = formData.supervisor; // Fallback
            }
        }

        formData.auditors.forEach(id => {
            const staff = staffList.find(s => s.id === id);
            if (staff) {
                teamArray.push({
                    id: staff.id,
                    name: staff.name,
                    role: 'Müfettiş',
                    email: staff.email,
                    phone: staff.phone
                });
            }
        });
        payload.team = teamArray;

        // Backend expects startDate (required)
        payload.startDate = formData.plannedStartDate || new Date().toISOString();
        payload.endDate = formData.plannedEndDate || payload.startDate;

        // Ensure planned dates are valid strings, or delete them
        if (!payload.plannedStartDate || payload.plannedStartDate === 'null' || payload.plannedStartDate === '') {
            delete payload.plannedStartDate;
        }
        if (!payload.plannedEndDate || payload.plannedEndDate === 'null' || payload.plannedEndDate === '') {
            delete payload.plannedEndDate;
        }

        try {
            if (isEditMode && initialData?.id) {
                await auditApi.updateAudit(initialData.id, payload);
                showToast('Denetim başarıyla güncellendi', 'success');
            } else {
                await auditApi.createAudit(payload);
                showToast('Denetim başarıyla oluşturuldu', 'success');
            }

            onSuccess(payload);
            onClose();
        } catch (error) {
            console.error('Save audit error:', error);
            showToast('İşlem başarısız oldu', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Denetimi Düzenle' : 'Yeni Denetim Planla'}
            size="xl"
            footer={
                <div className="flex justify-between w-full items-center">
                    <div></div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            form="createAuditForm"
                            isLoading={loading}
                            disabled={loading}
                            className="min-w-[150px]"
                        >
                            {isEditMode ? 'Değişiklikleri Kaydet' : 'Denetimi Oluştur'}
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Tabs */}
            <div className="mb-6">
                <SegmentedTabs
                    tabs={[
                        { id: 'general', label: 'Genel Bilgiler', icon: FileText },
                        { id: 'scope', label: 'Amaç & Kapsam', icon: Target },
                        { id: 'schedule', label: 'Takvim & Ekip', icon: Calendar }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            <form id="createAuditForm" onSubmit={handleSubmit} className="space-y-6">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Denetim No"
                                required
                                inputClassName="font-medium font-mono uppercase"
                                placeholder="Örn: 2025-SUBE-01"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                            <CustomSelect
                                label="Denetim Türü"
                                value={formData.type}
                                onChange={(val) => setFormData({ ...formData, type: val as string })}
                                options={[
                                    { value: 'Süreç Denetimi', label: 'Süreç Denetimi' },
                                    { value: 'Şube Denetimi', label: 'Şube Denetimi' },
                                    { value: 'Birim Denetimi', label: 'Birim Denetimi' },
                                    { value: 'Danışmanlık Denetimi', label: 'Danışmanlık Denetimi' },
                                    { value: 'Takip Denetimi', label: 'Takip Denetimi' },
                                    { value: 'Soruşturma', label: 'Soruşturma' },
                                    { value: 'İnceleme', label: 'İnceleme' }
                                ]}
                            />
                            <CustomSelect
                                label="Genel Müdür Yardımcılığı / Grup"
                                value={selectedParentDept}
                                onChange={(val) => {
                                    setSelectedParentDept(val as string);
                                    setFormData({ ...formData, department: '' });
                                }}
                                options={HIERARCHY.flatMap(group =>
                                    group.children
                                        .filter(child => child.title !== 'Teftiş Kurulu Müdürlüğü')
                                        .filter(child => {
                                            if (formData.type === 'Şube Denetimi') return child.title.includes('Satış') || child.title.includes('Şube');
                                            if (formData.type === 'Bilgi Teknolojileri Denetimi') return child.title.includes('Bilgi Teknolojileri');
                                            return true;
                                        })
                                        .map(child => ({
                                            value: child.title,
                                            label: `${group.title} > ${child.title}`
                                        }))
                                )}
                                placeholder="Grup seçiniz..."
                            />
                            {selectedParentDept && hasSubUnits && (
                                <CustomSelect
                                    label="Alt Birim / Servis"
                                    value={formData.department}
                                    onChange={(val) => setFormData({ ...formData, department: val as string })}
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
                                            if (child) {
                                                if ('children' in child && (child as any).children.length > 0) {
                                                    return flatten((child as any).children);
                                                } else {
                                                    return [];
                                                }
                                            }
                                        }
                                        return [];
                                    })()}
                                    placeholder="Birim seçiniz..."
                                />
                            )}

                            {selectedParentDept && !hasSubUnits && (
                                <div className="form-group flex items-end pb-1 text-sm text-gray-500 italic">
                                    * Seçilen birimin alt birimi bulunmamaktadır.
                                </div>
                            )}

                            {formData.type === 'Süreç Denetimi' && formData.department && (
                                <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2">
                                    <CustomSelect
                                        label="Denetlenecek Süreç"
                                        value={formData.processId}
                                        onChange={(val) => {
                                            const selectedProcess = processes.find(p => p.id === val);
                                            setFormData({
                                                ...formData,
                                                processId: val as string,
                                                title: formData.title === '' || processes.some(p => formData.title.includes(p.name))
                                                    ? `${formData.department} - ${selectedProcess?.name || 'Genel'} Denetimi`
                                                    : formData.title
                                            });
                                        }}
                                        options={processes.map(p => ({ value: p.id, label: p.name }))}
                                        placeholder={loadingProcesses ? "Süreçler yükleniyor..." : (processes.length > 0 ? "Süreç seçiniz..." : "Seçili birim için süreç bulunamadı")}
                                        disabled={loadingProcesses}
                                    />
                                </div>
                            )}
                        </div>

                        <FormInput
                            label="Denetim Başlığı"
                            required
                            className="text-lg font-medium"
                            placeholder="Örn: Kadıköy Şubesi 2025 Yılı Olağan Denetimi"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CustomSelect
                                label="Dönem"
                                value={formData.period}
                                onChange={(val) => setFormData({ ...formData, period: val as string })}
                                options={[
                                    '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4',
                                    '2027-Q1', '2027-Q2', '2027-Q3', '2027-Q4'
                                ].map(p => ({ value: p, label: p }))}
                            />
                            <CustomSelect
                                label="Durum"
                                value={formData.status}
                                onChange={(val) => setFormData({ ...formData, status: val as string })}
                                options={[
                                    { value: 'Taslak', label: 'Taslak' },
                                    { value: 'Planlandı', label: 'Planlandı' },
                                    { value: 'Devam Ediyor', label: 'Devam Ediyor' }
                                ]}
                            />
                            <CustomSelect
                                label="Risk Seviyesi"
                                value={formData.riskLevel}
                                onChange={(val) => setFormData({ ...formData, riskLevel: val as string })}
                                options={[
                                    { value: 'Düşük', label: 'Düşük Risk' },
                                    { value: 'Orta', label: 'Orta Risk' },
                                    { value: 'Yüksek', label: 'Yüksek Risk' },
                                    { value: 'Kritik', label: 'Kritik Risk' }
                                ]}
                            />
                        </div>
                    </div>
                )}

                {/* SCOPE TAB */}
                {activeTab === 'scope' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">


                        <FormTextarea
                            label="Denetim Amacı"
                            rows={3}
                            placeholder="Denetimin temel amacı nedir? (Örn: İç kontrol sisteminin etkinliğinin değerlendirilmesi...)"
                            value={formData.objective}
                            onChange={e => setFormData({ ...formData, objective: e.target.value })}
                        />
                        <FormTextarea
                            label="Denetim Kapsamı"
                            rows={3}
                            placeholder="Hangi süreçler, birimler veya dönemler kapsama dahildir? (Örn: Kredi tahsis süreci, 2024 yılı işlemleri...)"
                            value={formData.scope}
                            onChange={e => setFormData({ ...formData, scope: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormTextarea
                                label="Yöntem"
                                rows={2}
                                placeholder="Örnekleme yöntemi, mülakatlar, veri analizi..."
                                value={formData.methodology}
                                onChange={e => setFormData({ ...formData, methodology: e.target.value })}
                            />
                            <FormTextarea
                                label="Kriterler"
                                rows={2}
                                placeholder="İlgili mevzuat, kurum politikaları, ISO standartları..."
                                value={formData.criteria}
                                onChange={e => setFormData({ ...formData, criteria: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Planlanan Başlangıç"
                                type="date"
                                required
                                value={formData.plannedStartDate}
                                onChange={e => setFormData({ ...formData, plannedStartDate: e.target.value })}
                            />
                            <FormInput
                                label="Planlanan Bitiş"
                                type="date"
                                required
                                value={formData.plannedEndDate}
                                onChange={e => setFormData({ ...formData, plannedEndDate: e.target.value })}
                            />
                        </div>

                        {leaveWarnings.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                                    <Target size={16} /> Kapasite / İzin Uyarısı
                                </h4>
                                <ul className="space-y-1.5">
                                    {leaveWarnings.map((warn, idx) => (
                                        <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                            <span className="mt-1">•</span>
                                            <span>
                                                <strong>{warn.name}</strong>, planlanan tarihler arasında ({warn.dateStr}) <strong>{warn.type}</strong> iznindedir. Lütfen planlamayı gözden geçirin.
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                                <Users size={16} /> Denetim Ekibi
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <StaffSelect
                                        label="Gözetim Sorumlusu / Yöneticisi"
                                        value={formData.supervisor}
                                        onChange={(val) => setFormData({ ...formData, supervisor: val as string })}
                                        placeholder="Gözetim sorumlusu seçiniz..."
                                        excludeIds={formData.auditors}
                                    />
                                </div>
                                <div>
                                    <StaffSelect
                                        label="Müfettişler"
                                        value={formData.auditors}
                                        onChange={(val) => setFormData({ ...formData, auditors: val as string[] })}
                                        placeholder="Müfettiş seçiniz..."
                                        isMulti
                                        excludeIds={formData.supervisor ? [formData.supervisor] : []}
                                    />
                                    
                                    {/* Smart Resource Allocation (Akıllı Kaynak Atama) */}
                                    {(() => {
                                        if (!staffList || staffList.length === 0) return null;
                                        
                                        let targetSkill: 'risk_assessment' | 'it_audit' | 'financial_audit' | 'data_analysis' | 'reporting_english' = 'risk_assessment';
                                        
                                        if (formData.type === 'Bilgi Teknolojileri Denetimi' || formData.department.includes('Bilgi Teknolojileri') || formData.department.includes('Sistem') || formData.department.includes('Yazılım')) {
                                            targetSkill = 'it_audit';
                                        } else if (formData.type === 'Soruşturma' || formData.title.toLowerCase().includes('veri')) {
                                            targetSkill = 'data_analysis';
                                        } else if (formData.type === 'Birim Denetimi' && (formData.department.includes('Finans') || formData.department.includes('Muhasebe'))) {
                                            targetSkill = 'financial_audit';
                                        } else if (formData.title.toLowerCase().includes('rapor')) {
                                            targetSkill = 'reporting_english';
                                        }

                                        const skillNames = {
                                            risk_assessment: 'Risk Yönetimi',
                                            it_audit: 'BT ve Siber Güvenlik',
                                            financial_audit: 'Finansal & Uyum',
                                            data_analysis: 'Veri Analitiği',
                                            reporting_english: 'Raporlama'
                                        };

                                        const ranked = staffList
                                            .filter(s => {
                                                const roleStr = Array.isArray(s.role) ? s.role.join(' ') : (s.role || '');
                                                const combined = `${s.title || ''} ${roleStr}`.toLowerCase();
                                                return combined.includes('müfettiş') || combined.includes('uzman');
                                            })
                                            .filter(s => !formData.auditors.includes(s.id) && formData.supervisor !== s.id)
                                            .map(s => ({
                                                id: s.id,
                                                name: s.name,
                                                score: calculateDynamicSkills(s as any)[targetSkill].total
                                            }))
                                            .sort((a, b) => b.score - a.score)
                                            .slice(0, 3);

                                        if (ranked.length === 0) return null;

                                        return (
                                            <div className="mt-3 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="text-[11px] font-bold text-indigo-800 flex items-center gap-1.5 mb-2.5">
                                                    <Sparkles size={13} className="text-indigo-500" />
                                                    Akıllı Önerme (En Yüksek {skillNames[targetSkill]} Puanı)
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {ranked.map(rec => (
                                                        <button
                                                            key={rec.id}
                                                            type="button"
                                                            onClick={() => setFormData({...formData, auditors: [...formData.auditors, rec.id]})}
                                                            className="group flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 pl-2.5 pr-1 py-1 rounded-full hover:bg-indigo-500 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                                        >
                                                            <span className="text-[11px] font-medium">{rec.name}</span>
                                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">{rec.score}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}
