'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit2, ChevronRight, ChevronDown, Shield, AlertTriangle, Activity, RefreshCw, BookOpen, Database, Copy } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import CustomSelect from '@/components/ui/CustomSelect';
import FormInput from '@/components/ui/FormInput';
import CodeBadge from '@/components/ui/CodeBadge';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import { auditApi } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';

// Risk renkleri - Düşük=Sarı, Orta=Turuncu, Yüksek=Kırmızı, Kritik=Bordo
const getRiskColor = (level: string | undefined) => {
    if (!level) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    const l = level.toLocaleLowerCase('tr-TR');
    if (l.includes('kritik')) return { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-500' };
    if (l.includes('yüksek') || l.includes('yuksek')) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' };
    if (l.includes('orta')) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' };
    if (l.includes('düşük') || l.includes('dusuk')) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' };
    return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
};

// Süreç, Risk ve Kontrol Matrisi (RKM) Standart Şablon Kütüphanesi
const PROCESS_TEMPLATES = [
    {
        id: 'proc_bt_degisiklik',
        name: 'Bilgi Teknolojileri Değişiklik Yönetimi',
        description: 'Yazılım geliştirme, test, onay ve canlı ortamlara aktarım süreçlerindeki risklerin yönetimi.',
        owner: 'BT Operasyon Müdürü',
        risks: [
            {
                code: 'R-BT-01',
                name: 'UAT Testi Yapılmadan Canlıya Geçiş Riski',
                description: 'Kullanıcı Kabul Testi (UAT) yapılmayan kod değişikliklerinin canlı sistemlerde operasyonel kesintilere yol açma riski.',
                category: 'IT',
                level: 'Yüksek',
                controls: [
                    {
                        code: 'C-BT-01-01',
                        name: 'Zorunlu UAT Testi ve İş Birimi Onayı',
                        description: 'Canlıya geçiş öncesinde tüm kod değişikliklerinin test edilip iş birimince imzalı veya sistem üzerinden UAT onayının belgelenmesi.',
                        owner: 'BT Kalite Güvence Müdürü',
                        type: 'Önleyici',
                        frequency: 'İşlem Bazlı',
                        source: 'İç Kontrol',
                        method: 'Manuel'
                    },
                    {
                        code: 'C-BT-01-02',
                        name: 'Değişiklik Onay Komitesi (CAB) Onayı',
                        description: 'Belirli bir önem derecesinin üzerindeki tüm değişikliklerin haftalık CAB komitesinde değerlendirilip onay tutanağının oluşturulması.',
                        owner: 'Değişiklik Yönetim Komitesi',
                        type: 'Önleyici',
                        frequency: 'Haftalık',
                        source: 'İç Kontrol',
                        method: 'Manuel'
                    }
                ]
            },
            {
                code: 'R-BT-02',
                name: 'Canlı Sistemlere Yetkisiz Müdahale Riski',
                description: 'Geliştiricilerin canlı sistemlere doğrudan yetkili erişim sağlayarak veri bütünlüğünü bozma veya suistimal amaçlı yetkisiz işlem yapma riski.',
                category: 'IT',
                level: 'Kritik',
                controls: [
                    {
                        code: 'C-BT-02-01',
                        name: 'Görevler Ayrılığı (Segregation of Duties) ve Erişim Kısıtı',
                        description: 'Geliştirici (Dev) ve canlı ortam sistem yöneticisi (Ops) yetkilerinin teknik olarak tamamen ayrıştırılması, geliştiricilerin canlı ortama doğrudan müdahale yetkisinin engellenmesi.',
                        owner: 'BT Güvenlik Müdürü',
                        type: 'Önleyici',
                        frequency: 'İşlem Bazlı',
                        source: 'Yasal Düzenleme',
                        method: 'Otomatik'
                    }
                ]
            }
        ]
    },
    {
        id: 'proc_kredi_tahsis',
        name: 'Kredi Tahsis ve Limit Yönetimi Süreci',
        description: 'Bireysel ve ticari kredi başvurularının değerlendirilmesi, skorlama ve onay yetki limitleri yönetimi.',
        owner: 'Kredi Risk Müdürü',
        risks: [
            {
                code: 'R-KR-01',
                name: 'Yetersiz Mali Analiz ve Gelir Doğrulama Riski',
                description: 'Mali durum tespiti yapılmadan veya yetersiz belgelerle kredi kullandırılması sonucu tahsilat gecikmeleri ve batık kredi oranının artması riski.',
                category: 'Finansal',
                level: 'Yüksek',
                controls: [
                    {
                        code: 'C-KR-01-01',
                        name: 'Zorunlu Gelir Doğrulama ve İstihbarat Entegrasyonu',
                        description: 'Kredi tahsis sürecinde sistem tarafından merkezi skorlama modeli çıktısı, KKB raporu ve gelir belgelerinin sisteme yüklenmesinin zorunlu kılınması.',
                        owner: 'Kredi Risk Müdürü',
                        type: 'Önleyici',
                        frequency: 'İşlem Bazlı',
                        source: 'İç Kontrol',
                        method: 'Otomatik'
                    }
                ]
            },
            {
                code: 'R-KR-02',
                name: 'Kredi Onay Yetki Limitlerinin Aşılması Riski',
                description: 'Süreç sahiplerinin kendi limit yetkilerini aşarak veya usulsüz şekilde kredi limiti tanımlaması sonucu finansal kayıp yaşanması riski.',
                category: 'Suistimal',
                level: 'Kritik',
                controls: [
                    {
                        code: 'C-KR-02-01',
                        name: 'Sistem Tabanlı Yetki Kontrolü ve Blokajı',
                        description: 'Kredi limit girişlerinin sistem tarafından yetki matrisine göre otomatik doğrulanması ve yetki dışı girişlerde işlemin sistemce engellenerek üst onay mekanizmasına yönlendirilmesi.',
                        owner: 'Kredi Operasyon Müdürü',
                        type: 'Önleyici',
                        frequency: 'İşlem Bazlı',
                        source: 'Yasal Düzenleme',
                        method: 'Otomatik'
                    }
                ]
            }
        ]
    },
    {
        id: 'proc_satin_alma',
        name: 'Satın Alma ve Tedarikçi Yönetim Süreci',
        description: 'Mal ve hizmet alımlarında tedarikçi seçimi, fiyat araştırması, ihale ve sözleşme süreçlerinin yönetimi.',
        owner: 'Satın Alma Müdürü',
        risks: [
            {
                code: 'R-SA-01',
                name: 'Fahiş Fiyatlarla Satın Alma Yapılması Riski',
                description: 'Teklif toplama sürecinin şeffaf yürütülmemesi veya tedarikçi danışıklı işlemleri sonucu kurumun finansal zarara uğratılması riski.',
                category: 'Finansal',
                level: 'Yüksek',
                controls: [
                    {
                        code: 'C-SA-01-01',
                        name: 'Çoklu Teklif ve İhale Prosedürü',
                        description: 'Belirli bir parasal sınırın üzerindeki satın almalarda en az 3 farklı tedarikçiden yazılı teklif alınması ve ihale komisyonu tutanağının zorunlu kılınması.',
                        owner: 'Satın Alma Müdürü',
                        type: 'Önleyici',
                        frequency: 'İşlem Bazlı',
                        source: 'İç Kontrol',
                        method: 'Manuel'
                    }
                ]
            },
            {
                code: 'R-SA-02',
                name: 'Usulsüz ve Sahte Tedarikçi Ödemeleri Riski',
                description: 'Süreç çalışanlarının kendilerine ait veya paravan şirketleri tedarikçi olarak tanımlayıp haksız kazanç sağlaması riski.',
                category: 'Suistimal',
                level: 'Kritik',
                controls: [
                    {
                        code: 'C-SA-02-01',
                        name: 'Tedarikçi Bilgilerinin Bağımsız Doğrulanması',
                        description: 'Sistemde yeni tanımlanan tüm tedarikçilerin hesap bilgilerinin, vergi dairelerinin ve yasal sicil evraklarının satın alma birimi dışındaki bağımsız bir kontrolörce doğrulanması.',
                        owner: 'İç Kontrol ve Uyum Müdürü',
                        type: 'Önleyici',
                        frequency: 'İşlem Bazlı',
                        source: 'Yasal Düzenleme',
                        method: 'Manuel'
                    }
                ]
            }
        ]
    }
];

export default function UnitRcmPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const canManage = checkRole(hasRole, ROLES.UNIVERSE_MANAGER);
    const unitId = params.unitId as string;

    const [unit, setUnit] = useState<any>(null);
    const [processes, setProcesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
    const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

    // Modal States
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showRiskModal, setShowRiskModal] = useState(false);
    const [showControlModal, setShowControlModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Delete Confirm States
    const [deleteProcessId, setDeleteProcessId] = useState<string | null>(null);
    const [deleteRiskId, setDeleteRiskId] = useState<string | null>(null);
    const [deleteControlId, setDeleteControlId] = useState<string | null>(null);
    const [deleteRiskProcessId, setDeleteRiskProcessId] = useState<string | null>(null);
    const [deleteControlRiskId, setDeleteControlRiskId] = useState<string | null>(null);

    // Form Data
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadData();
    }, [unitId]);

    const handleImportTemplate = async (template: typeof PROCESS_TEMPLATES[0]) => {
        setImporting(true);
        try {
            // 1. Create Process
            const createdProcess = await auditApi.createProcess({
                unitId,
                name: template.name,
                owner: template.owner,
                description: template.description
            });

            // 2. Loop and Create Risks
            for (const riskTemplate of template.risks) {
                const createdRisk = await auditApi.createRisk({
                    processId: createdProcess.id,
                    code: riskTemplate.code,
                    name: riskTemplate.name,
                    description: riskTemplate.description,
                    category: riskTemplate.category,
                    level: riskTemplate.level
                });

                // 3. Loop and Create Controls
                for (const controlTemplate of riskTemplate.controls) {
                    await auditApi.createControl({
                        riskId: createdRisk.id,
                        code: controlTemplate.code,
                        name: controlTemplate.name,
                        description: controlTemplate.description,
                        owner: controlTemplate.owner,
                        type: controlTemplate.type,
                        frequency: controlTemplate.frequency,
                        source: controlTemplate.source,
                        method: controlTemplate.method
                    });
                }
            }

            showToast('Süreç şablonu, riskleri ve kontrolleriyle birlikte başarıyla yüklendi', 'success');
            setShowTemplateModal(false);
            loadData();
        } catch (e) {
            console.error(e);
            showToast('Şablon yüklenirken hata oluştu', 'error');
        } finally {
            setImporting(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const units = await auditApi.getAuditableUnits();
            const currentUnit = units.find((u: any) => u.id === unitId);
            setUnit(currentUnit);

            const procs = await auditApi.getProcesses(unitId);
            setProcesses(procs);
        } catch (error) {
            console.error(error);
            showToast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExpandProcess = async (procId: string) => {
        if (expandedProcess === procId) {
            setExpandedProcess(null);
            return;
        }
        setExpandedProcess(procId);
        try {
            const risks = await auditApi.getRisks(procId);
            setProcesses(prev => prev.map(p => p.id === procId ? { ...p, risks } : p));
        } catch (e) {
            console.error(e);
            showToast('Riskler yüklenirken hata oluştu', 'error');
        }
    };

    const handleExpandRisk = async (riskId: string) => {
        if (expandedRisk === riskId) {
            setExpandedRisk(null);
            return;
        }
        setExpandedRisk(riskId);
        try {
            const controls = await auditApi.getControls(riskId);
            setProcesses(prev => prev.map(p => ({
                ...p,
                risks: p.risks?.map((r: any) => r.id === riskId ? { ...r, controls } : r)
            })));
        } catch (e) {
            console.error(e);
            showToast('Kontroller yüklenirken hata oluştu', 'error');
        }
    };

    // --- PROCESS CRUD ---
    const handleSaveProcess = async () => {
        if (!formData.name?.trim()) {
            showToast('Süreç adı zorunludur', 'error');
            return;
        }
        setSaving(true);
        try {
            if (isEditing) {
                await auditApi.updateProcess(formData.id, formData);
                showToast('Süreç güncellendi', 'success');
            } else {
                await auditApi.createProcess({ ...formData, unitId });
                showToast('Süreç oluşturuldu', 'success');
            }
            setShowProcessModal(false);
            loadData();
        } catch (e) {
            console.error(e);
            showToast('Süreç kaydedilirken hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteProcess = async () => {
        if (!deleteProcessId) return;
        try {
            await auditApi.deleteProcess(deleteProcessId);
            showToast('Süreç silindi', 'success');
            loadData();
        } catch (e) {
            console.error(e);
            showToast('Süreç silinirken hata oluştu', 'error');
        } finally {
            setDeleteProcessId(null);
        }
    };

    // --- RISK CRUD ---
    const handleSaveRisk = async () => {
        if (!formData.name?.trim()) {
            showToast('Risk adı zorunludur', 'error');
            return;
        }
        // Kategori zorunlu - Prisma şemasında NOT NULL
        if (!formData.category?.trim()) {
            showToast('Risk kategorisi zorunludur', 'error');
            return;
        }
        setSaving(true);
        try {
            if (isEditing) {
                await auditApi.updateRisk(formData.id, formData);
                showToast('Risk güncellendi', 'success');
            } else {
                await auditApi.createRisk({ ...formData, processId: selectedProcessId });
                showToast('Risk oluşturuldu', 'success');
            }
            setShowRiskModal(false);
            if (selectedProcessId) {
                const risks = await auditApi.getRisks(selectedProcessId);
                setProcesses(prev => prev.map(p => p.id === selectedProcessId ? { ...p, risks } : p));
            }
        } catch (e) {
            console.error(e);
            showToast('Risk kaydedilirken hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteRisk = async () => {
        if (!deleteRiskId || !deleteRiskProcessId) return;
        try {
            await auditApi.deleteRisk(deleteRiskId);
            showToast('Risk silindi', 'success');
            const risks = await auditApi.getRisks(deleteRiskProcessId);
            setProcesses(prev => prev.map(p => p.id === deleteRiskProcessId ? { ...p, risks } : p));
        } catch (e) {
            console.error(e);
            showToast('Risk silinirken hata oluştu', 'error');
        } finally {
            setDeleteRiskId(null);
            setDeleteRiskProcessId(null);
        }
    };

    // --- CONTROL CRUD ---
    const handleSaveControl = async () => {
        if (!formData.name?.trim()) {
            showToast('Kontrol adı zorunludur', 'error');
            return;
        }
        setSaving(true);
        try {
            if (isEditing) {
                await auditApi.updateControl(formData.id, formData);
                showToast('Kontrol güncellendi', 'success');
            } else {
                await auditApi.createControl({ ...formData, riskId: selectedRiskId });
                showToast('Kontrol oluşturuldu', 'success');
            }
            setShowControlModal(false);
            if (selectedRiskId) {
                const controls = await auditApi.getControls(selectedRiskId);
                setProcesses(prev => prev.map(p => ({
                    ...p,
                    risks: p.risks?.map((r: any) => r.id === selectedRiskId ? { ...r, controls } : r)
                })));
            }
        } catch (e) {
            console.error(e);
            showToast('Kontrol kaydedilirken hata oluştu', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteControl = async () => {
        if (!deleteControlId || !deleteControlRiskId) return;
        try {
            await auditApi.deleteControl(deleteControlId);
            showToast('Kontrol silindi', 'success');
            const controls = await auditApi.getControls(deleteControlRiskId);
            setProcesses(prev => prev.map(p => ({
                ...p,
                risks: p.risks?.map((r: any) => r.id === deleteControlRiskId ? { ...r, controls } : r)
            })));
        } catch (e) {
            console.error(e);
            showToast('Kontrol silinirken hata oluştu', 'error');
        } finally {
            setDeleteControlId(null);
            setDeleteControlRiskId(null);
        }
    };

    // --- MODAL HELPERS ---
    const openProcessModal = (process?: any) => {
        setIsEditing(!!process);
        setFormData(process || {});
        setShowProcessModal(true);
    };

    const openRiskModal = (processId: string, risk?: any) => {
        setSelectedProcessId(processId);
        setIsEditing(!!risk);
        // Yeni risk için varsayılan değerler (category Prisma'da zorunlu)
        setFormData(risk || { category: 'Operasyonel', level: 'Orta' });
        setShowRiskModal(true);
    };

    const openControlModal = (riskId: string, control?: any) => {
        setSelectedRiskId(riskId);
        setIsEditing(!!control);
        setFormData(control || {});
        setShowControlModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingState fullscreen message="Birim detayları yükleniyor..." />
            </div>
        );
    }

    if (!unit) {
        return (
            <>
                <EmptyState
                    title="Birim Bulunamadı"
                    description="Bu birim bulunamadı veya silinmiş olabilir."
                />
                <div className="flex justify-center mt-4">
                    <BackButton href="/audit/universe" label="Denetim Evrenine Dön" />
                </div>
            </>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <BackButton href="/audit/universe" label="Denetim Evrenine Dön" />
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="text-primary" size={24} />
                        {unit.name}
                    </h1>
                    <p className="text-sm text-gray-500">Risk Kontrol Matrisi (RCM) - Süreç, Risk ve Kontrol Yönetimi</p>
                </div>
                {canManage && (
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowTemplateModal(true)}
                            leftIcon={<BookOpen size={20} />}
                        >
                            Şablondan Yükle
                        </Button>
                        <Button
                            onClick={() => openProcessModal()}
                            leftIcon={<Plus size={22} />}
                        >
                            Yeni Süreç Ekle
                        </Button>
                    </div>
                )}
            </div>

            {/* PROCESS LIST */}
            <div className="space-y-4">
                {processes.length === 0 ? (
                    <div className="card text-center py-12">
                        <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">Henüz tanımlanmış bir süreç yok.</p>
                        {canManage && (
                            <Button onClick={() => openProcessModal()} leftIcon={<Plus size={20} />}>
                                İlk Süreci Ekle
                            </Button>
                        )}
                    </div>
                ) : (
                    processes.map(proc => (
                        <div key={proc.id} className="card !p-0 overflow-hidden">
                            {/* Process Header */}
                            <div
                                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleExpandProcess(proc.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedProcess === proc.id ? (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-lg text-gray-800">{proc.name}</span>
                                    {proc.owner && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            Süreç Sahibi: {proc.owner}
                                        </span>
                                    )}
                                </div>
                                {canManage && (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openRiskModal(proc.id)}
                                            className="ml-2"
                                            leftIcon={<Plus size={16} />}
                                        >
                                            Risk Ekle
                                        </Button>
                                        <ActionMenu items={[
                                            { label: 'Düzenle', icon: Edit2, onClick: () => openProcessModal(proc) },
                                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => setDeleteProcessId(proc.id) }
                                        ]} />
                                    </div>
                                )}
                            </div>

                            {/* RISKS LIST */}
                            {expandedProcess === proc.id && (
                                <div className="p-4 border-t bg-white">
                                    {!proc.risks?.length ? (
                                        <p className="text-sm text-gray-400 italic ml-8">Tanımlı risk yok.</p>
                                    ) : (
                                        <div className="space-y-3 ml-4">
                                            {proc.risks?.map((risk: any) => {
                                                const riskColor = getRiskColor(risk.level);
                                                return (
                                                    <div key={risk.id} className={`border rounded-lg ${riskColor.border} border-l-4`}>
                                                        <div
                                                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                                            onClick={() => handleExpandRisk(risk.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {expandedRisk === risk.id ? (
                                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                                )}
                                                                <AlertTriangle className={`w-4 h-4 ${riskColor.text}`} />
                                                                <span className="font-medium text-gray-700">
                                                                    {risk.code ? `[${risk.code}] ` : ''}{risk.name}
                                                                </span>
                                                                <StatusBadge value={risk.level || 'Belirsiz'} type="risk" size="sm" />
                                                                {risk.category && (
                                                                    <CodeBadge>
                                                                        {risk.category}
                                                                    </CodeBadge>
                                                                )}
                                                            </div>
                                                            {canManage && (
                                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => openControlModal(risk.id)}
                                                                        className="ml-2 !py-1"
                                                                        leftIcon={<Plus size={16} />}
                                                                    >
                                                                        Kontrol Ekle
                                                                    </Button>
                                                                    <ActionMenu items={[
                                                                        { label: 'Düzenle', icon: Edit2, onClick: () => openRiskModal(proc.id, risk) },
                                                                        { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => {
                                                                            setDeleteRiskId(risk.id);
                                                                            setDeleteRiskProcessId(proc.id);
                                                                        } }
                                                                    ]} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* CONTROLS LIST */}
                                                        {expandedRisk === risk.id && (
                                                            <div className="p-3 border-t bg-gray-50">
                                                                {!risk.controls?.length ? (
                                                                    <p className="text-xs text-gray-400 italic ml-8">Tanımlı kontrol yok.</p>
                                                                ) : (
                                                                    <div className="grid gap-3 ml-8">
                                                                        {risk.controls?.map((control: any) => (
                                                                            <div
                                                                                key={control.id}
                                                                                className="flex items-start justify-between p-3 border rounded-lg border-l-4 border-l-green-500 bg-white hover:shadow-sm transition-shadow"
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Shield className="w-4 h-4 text-green-600" />
                                                                                        <span className="font-semibold text-gray-800 text-sm">
                                                                                            {control.code ? `[${control.code}] ` : ''}{control.name}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                                        <span><strong className="text-gray-700">Sahibi:</strong> {control.owner || '-'}</span>
                                                                                        <span><strong className="text-gray-700">Frekans:</strong> {control.frequency || '-'}</span>
                                                                                        <span><strong className="text-gray-700">Tip:</strong> {control.type || '-'}</span>
                                                                                        <span><strong className="text-gray-700">Metod:</strong> {control.method || '-'}</span>
                                                                                    </div>
                                                                                    {control.description && (
                                                                                        <p className="mt-2 text-xs text-gray-600">{control.description}</p>
                                                                                    )}
                                                                                </div>
                                                                                {canManage && (
                                                                                    <div className="flex items-center gap-1 ml-4" onClick={e => e.stopPropagation()}>
                                                                                        <ActionMenu items={[
                                                                                            { label: 'Düzenle', icon: Edit2, onClick: () => openControlModal(risk.id, control) },
                                                                                            { label: 'Sil', icon: Trash2, variant: 'danger' as const, onClick: () => {
                                                                                                setDeleteControlId(control.id);
                                                                                                setDeleteControlRiskId(risk.id);
                                                                                            } }
                                                                                        ]} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )
                }
            </div>

            {/* DELETE CONFIRM MODALS */}
            <ConfirmModal
                isOpen={!!deleteProcessId}
                onClose={() => setDeleteProcessId(null)}
                onConfirm={confirmDeleteProcess}
                title="Süreci Sil"
                message="Bu süreci silmek istediğinize emin misiniz? Bu süreçteki tüm riskler ve kontroller de silinecektir."
                confirmText="Evet, Sil"
                type="danger"
            />
            <ConfirmModal
                isOpen={!!deleteRiskId}
                onClose={() => { setDeleteRiskId(null); setDeleteRiskProcessId(null); }}
                onConfirm={confirmDeleteRisk}
                title="Riski Sil"
                message="Bu riski silmek istediğinize emin misiniz? Bu riskteki tüm kontroller de silinecektir."
                confirmText="Evet, Sil"
                type="danger"
            />
            <ConfirmModal
                isOpen={!!deleteControlId}
                onClose={() => { setDeleteControlId(null); setDeleteControlRiskId(null); }}
                onConfirm={confirmDeleteControl}
                title="Kontrolü Sil"
                message="Bu kontrolü silmek istediğinize emin misiniz?"
                confirmText="Evet, Sil"
                type="danger"
            />

            {/* PROCESS MODAL */}
            <Modal
                isOpen={showProcessModal}
                onClose={() => setShowProcessModal(false)}
                title={isEditing ? 'Süreci Düzenle' : 'Yeni Süreç'}
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button
                            type="button"
                            onClick={handleSaveProcess}
                            className="px-8 shadow-md hover:shadow-lg transition-all min-w-[120px]"
                            disabled={saving}
                        >
                            {saving ? <RefreshCw className="animate-spin mr-2" size={22} /> : null}
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <FormInput
                            label="Süreç Adı *"
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: Kredi Onay Süreci"
                        />
                    </div>
                    <div>
                        <FormInput
                            label="Süreç Sahibi"
                            type="text"
                            value={formData.owner || ''}
                            onChange={e => setFormData({ ...formData, owner: e.target.value })}
                            placeholder="Örn: Ahmet Yılmaz"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Sürecin kısa açıklaması..."
                        />
                    </div>
                </div>
            </Modal>

            {/* RISK MODAL */}
            <Modal
                isOpen={showRiskModal}
                onClose={() => setShowRiskModal(false)}
                title={isEditing ? 'Riski Düzenle' : 'Yeni Risk'}
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button
                            type="button"
                            onClick={handleSaveRisk}
                            className="px-8 shadow-md hover:shadow-lg transition-all min-w-[120px]"
                            disabled={saving}
                        >
                            {saving ? <RefreshCw className="animate-spin mr-2" size={22} /> : null}
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <FormInput
                                label="Risk No"
                                type="text"
                                value={formData.code || ''}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="R01"
                            />
                        </div>
                        <div className="col-span-2">
                            <CustomSelect
                                label="Risk Kategorisi"
                                value={formData.category || ''}
                                onChange={(val) => setFormData({ ...formData, category: val as string })}
                                options={[
                                    { value: "Operasyonel", label: "Operasyonel" },
                                    { value: "Finansal", label: "Finansal" },
                                    { value: "Uyum", label: "Uyum" },
                                    { value: "Stratejik", label: "Stratejik" },
                                    { value: "IT", label: "IT" },
                                    { value: "Suistimal", label: "Suistimal" },
                                    { value: "İtibar", label: "İtibar" }
                                ]}
                            />
                        </div>
                    </div>
                    <div>
                        <FormInput
                            label="Risk Adı *"
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: Yetkisiz işlem riski"
                        />
                    </div>
                    <div>
                        <CustomSelect
                            label="Risk Seviyesi"
                            value={formData.level || 'Orta'}
                            onChange={(val) => setFormData({ ...formData, level: val as string })}
                            options={[
                                { value: "Düşük", label: "Düşük" },
                                { value: "Orta", label: "Orta" },
                                { value: "Yüksek", label: "Yüksek" },
                                { value: "Kritik", label: "Kritik" }
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Riskin detaylı açıklaması..."
                        />
                    </div>
                </div>
            </Modal>

            {/* CONTROL MODAL */}
            <Modal
                isOpen={showControlModal}
                onClose={() => setShowControlModal(false)}
                title={isEditing ? 'Kontrol Kartını Düzenle' : 'Yeni Kontrol Kartı'}
                size="lg"
                footer={
                    <div className="flex justify-end w-full">
                        <Button
                            type="button"
                            onClick={handleSaveControl}
                            className="px-8 shadow-md hover:shadow-lg transition-all min-w-[120px]"
                            disabled={saving}
                        >
                            {saving ? <RefreshCw className="animate-spin mr-2" size={18} /> : null}
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FormInput
                                label="Kontrol No"
                                type="text"
                                value={formData.code || ''}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="C01"
                            />
                        </div>
                        <div>
                            <FormInput
                                label="Kontrol Adı *"
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Örn: Onay mekanizması"
                            />
                        </div>
                        <div>
                            <FormInput
                                label="Kontrol Sahibi (1. Hat)"
                                type="text"
                                value={formData.owner || ''}
                                onChange={e => setFormData({ ...formData, owner: e.target.value })}
                                placeholder="Örn: Operasyon Müdürü"
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Kontrol Türü"
                                value={formData.type || ''}
                                onChange={(val) => setFormData({ ...formData, type: val as string })}
                                options={[
                                    { value: "Önleyici", label: "Önleyici" },
                                    { value: "Tespit Edici", label: "Tespit Edici" },
                                    { value: "Düzenleyici", label: "Düzenleyici" }
                                ]}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Frekans"
                                value={formData.frequency || ''}
                                onChange={(val) => setFormData({ ...formData, frequency: val as string })}
                                options={[
                                    { value: "İşlem Bazlı", label: "İşlem Bazlı (Her işlemde)" },
                                    { value: "Günlük", label: "Günlük" },
                                    { value: "Haftalık", label: "Haftalık" },
                                    { value: "Aylık", label: "Aylık" },
                                    { value: "3 Aylık", label: "3 Aylık" },
                                    { value: "Yıllık", label: "Yıllık" }
                                ]}
                            />
                        </div>
                        <div>
                            <CustomSelect
                                label="Kontrol Kaynağı"
                                value={formData.source || ''}
                                onChange={(val) => setFormData({ ...formData, source: val as string })}
                                options={[
                                    { value: "İç Kontrol", label: "İç Kontrol" },
                                    { value: "Süreç Sahibi", label: "Süreç Sahibi Beyanı" },
                                    { value: "Yasal Düzenleme", label: "Yasal Düzenleme" },
                                    { value: "COSO", label: "COSO" }
                                ]}
                            />
                        </div>
                        <div className="col-span-2">
                            <CustomSelect
                                label="Uygulama Yöntemi"
                                value={formData.method || ''}
                                onChange={(val) => setFormData({ ...formData, method: val as string })}
                                options={[
                                    { value: "Manuel", label: "Manuel" },
                                    { value: "Otomatik", label: "Otomatik (Sistem)" },
                                    { value: "IT Bağımlı", label: "IT Bağımlı Manuel" }
                                ]}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kontrol Tanımı / Detayı</label>
                        <textarea
                            className="form-input"
                            rows={4}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Kontrolün nasıl işlediğini detaylıca açıklayınız..."
                        />
                    </div>
                </div>
            </Modal>

            {/* TEMPLATE SELECTION MODAL */}
            <Modal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                title="Şablondan Süreç & Risk & Kontrol Yükle"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                        <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <strong className="block text-sm font-semibold">Risk & Kontrol Matrisi Kütüphanesi</strong>
                            <p className="text-xs mt-1 text-blue-700">
                                Aşağıdaki standart şablonlardan birini seçerek bu birime ait süreç, risk ve kontrol kartlarını otomatik olarak oluşturabilirsiniz.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {PROCESS_TEMPLATES.map((tmpl) => (
                            <div
                                key={tmpl.id}
                                className="border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all bg-white relative flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                            <Activity size={18} className="text-blue-600" />
                                            {tmpl.name}
                                        </h3>
                                        <Badge variant="secondary" size="md">
                                            {tmpl.owner}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">{tmpl.description}</p>

                                    <div className="pt-2 flex items-center gap-4 text-xs">
                                        <Badge variant="danger" size="md" className="gap-1 font-medium">
                                            ⚠️ {tmpl.risks.length} Risk Tanımı
                                        </Badge>
                                        <Badge variant="success" size="md" className="gap-1 font-medium">
                                            🛡️ {tmpl.risks.reduce((acc, r) => acc + r.controls.length, 0)} Kontrol Kartı
                                        </Badge>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t flex justify-end">
                                    <Button
                                        onClick={() => handleImportTemplate(tmpl)}
                                        disabled={importing}
                                        leftIcon={importing ? <RefreshCw className="animate-spin" size={16} /> : <Copy size={16} />}
                                        size="sm"
                                        className="shadow-sm"
                                    >
                                        {importing ? 'Aktarılıyor...' : 'Süreci Birime Aktar'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
