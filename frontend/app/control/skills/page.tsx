'use client';
import RequireRole from '@/components/auth/RequireRole';


import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';
import RatingStars from '@/components/ui/RatingStars';
import CustomSelect from '@/components/ui/CustomSelect';
import Badge from '@/components/ui/Badge';
import Timeline from '@/components/ui/Timeline';
import { Award, Users, TrendingUp, Eye, Edit2, History, Star } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import UserAvatar from '@/components/ui/UserAvatar';

interface SkillRatings {
    coso_framework: number;
    risk_control: number;
    testing_methodology: number;
    data_analysis: number;
    reporting: number;
}

const DEFAULT_SKILLS: SkillRatings = {
    coso_framework: 2,
    risk_control: 2,
    testing_methodology: 2,
    data_analysis: 1,
    reporting: 2
};

const SKILL_LABELS: Record<keyof SkillRatings, { label: string; shortLabel: string; desc: string }> = {
    coso_framework: { label: 'COSO İç Kontrol Çerçevesi', shortLabel: 'COSO Çerçevesi', desc: 'COSO 2013 bileşenleri, kontrol ortamı, risk değerlendirme ve kontrol faaliyetleri yetkinliği' },
    risk_control: { label: 'Risk & Kontrol Güvence', shortLabel: 'Risk & Kontrol', desc: 'Operasyonel risk yönetimi, kontrol noktası tasarımı ve etkinlik değerlendirme' },
    testing_methodology: { label: 'Kontrol Testi Metodolojisi', shortLabel: 'Test Metodolojisi', desc: 'Tasarım ve işletim etkinliği testi, walkthrough prosedürleri, örneklem büyüklüğü belirleme' },
    data_analysis: { label: 'Veri Analitiği & Otomasyon', shortLabel: 'Veri Analitiği', desc: 'SQL, Python, Excel analitik araçları ve süreç otomasyonu yetkinliği' },
    reporting: { label: 'Raporlama & Mevzuat Uyumu', shortLabel: 'Raporlama', desc: 'BDDK raporlama gereksinimleri, dönem raporu hazırlama ve üst yönetim sunumu' }
};

const SKILL_LEVELS = [
    { value: 0, label: 'Yok / Başlangıç' },
    { value: 1, label: 'Temel Düzey' },
    { value: 2, label: 'Orta Düzey' },
    { value: 3, label: 'İleri Düzey' },
    { value: 4, label: 'Uzman Düzey' }
];

interface StaffSkill {
    id: string;
    ad: string;
    unvan: string;
    birim: string;
    skills: SkillRatings;
    ortPuan: number;
    sonGuncelleme: string;
    notes?: string;
}

function ControlSkillsPageContent() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [titleFilter, setTitleFilter] = useState<string[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<StaffSkill | null>(null);
    const [modalSkills, setModalSkills] = useState<SkillRatings>({ ...DEFAULT_SKILLS });
    const [originalSkills, setOriginalSkills] = useState<SkillRatings>({ ...DEFAULT_SKILLS });
    const [justifications, setJustifications] = useState<Record<string, string>>({});
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyStaff, setHistoryStaff] = useState<StaffSkill | null>(null);

    const [staffList, setStaffList] = useState<StaffSkill[]>([
        {
            id: 'IKM-001', ad: 'Ahmet Yılmaz', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            skills: { coso_framework: 4, risk_control: 4, testing_methodology: 4, data_analysis: 3, reporting: 4 },
            ortPuan: 3.8, sonGuncelleme: '2026-07-15'
        },
        {
            id: 'IKM-002', ad: 'Canan Öztürk', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            skills: { coso_framework: 4, risk_control: 4, testing_methodology: 4, data_analysis: 3, reporting: 4 },
            ortPuan: 3.8, sonGuncelleme: '2026-07-12'
        },
        {
            id: 'IKM-003', ad: 'Zeynep Kaya', unvan: 'İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            skills: { coso_framework: 3, risk_control: 3, testing_methodology: 4, data_analysis: 3, reporting: 3 },
            ortPuan: 3.2, sonGuncelleme: '2026-07-10'
        },
        {
            id: 'IKM-004', ad: 'Emre Aksoy', unvan: 'İç Kontrolör', birim: 'İç Kontrol ve Uyum Müdürlüğü',
            skills: { coso_framework: 3, risk_control: 4, testing_methodology: 3, data_analysis: 2, reporting: 3 },
            ortPuan: 3.0, sonGuncelleme: '2026-07-08'
        },
    ]);

    const filteredStaff = staffList.filter(s => {
        if (searchTerm && !s.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !s.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (titleFilter.length > 0 && !titleFilter.includes(s.unvan)) return false;
        return true;
    });

    const avgTeamScore = (staffList.reduce((a, b) => a + b.ortPuan, 0) / staffList.length).toFixed(1);
    const strongestSkill = Object.entries(SKILL_LABELS).reduce((best, [key]) => {
        const avg = staffList.reduce((a, b) => a + b.skills[key as keyof SkillRatings], 0) / staffList.length;
        return avg > best.avg ? { key, avg } : best;
    }, { key: '', avg: 0 });

    const handleEditSkills = (staff: StaffSkill) => {
        setSelectedStaff(staff);
        setModalSkills({ ...staff.skills });
        setOriginalSkills({ ...staff.skills });
        setJustifications({});
    };

    const handleSaveSkills = () => {
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

        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR');
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const logEntries = changedKeys.map(key => {
            const skillName = SKILL_LABELS[key as keyof typeof SKILL_LABELS].label;
            const oldVal = SKILL_LEVELS.find(l => l.value === originalSkills[key as keyof SkillRatings])?.label || '0';
            const newVal = SKILL_LEVELS.find(l => l.value === modalSkills[key as keyof SkillRatings])?.label || '0';
            return `[${dateStr} ${timeStr}] [${skillName}] [${oldVal} -> ${newVal}] Gerekçe: ${justifications[key]}`;
        }).join('\n');

        const newNotes = selectedStaff.notes ? `${selectedStaff.notes}\n\n${logEntries}` : logEntries;
        const newOrt = (Object.values(modalSkills).reduce((a, b) => a + b, 0) / 5).toFixed(1);

        setStaffList(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, skills: modalSkills, ortPuan: Number(newOrt), notes: newNotes, sonGuncelleme: dateStr } : s));

        showToast(`${selectedStaff.ad} yetkinlik değerlendirmesi güncellendi`, 'success');
        setSelectedStaff(null);
    };

    return (
        <div className="space-y-6">
            <ControlStaffTabs />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Değerlendirilen Kontrolör" value={staffList.length} icon={Users} color="blue" />
                <StatCard title="Ekip Ortalama Puanı" value={avgTeamScore} icon={Star} color="amber" />
                <StatCard title="En Güçlü Yetkinlik" value={SKILL_LABELS[strongestSkill.key as keyof SkillRatings]?.shortLabel || '—'} icon={TrendingUp} color="emerald" />
                <StatCard title="Aktif Değerlendirme" value={staffList.length} icon={Award} color="purple" />
            </div>

            <PageToolbar
                searchPlaceholder="Kontrolör adı veya sicil no ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={
                    <FilterDropdown activeCount={titleFilter.length} onClear={() => setTitleFilter([])}>
                        <CustomSelect
                            label="Ünvan"
                            value={titleFilter}
                            onChange={(val) => setTitleFilter(val as string[])}
                            isMulti
                            options={[
                                { value: 'Kıdemli İç Kontrolör', label: 'Kıdemli İç Kontrolör' },
                                { value: 'İç Kontrolör', label: 'İç Kontrolör' }
                            ]}
                        />
                    </FilterDropdown>
                }
            />

            <DataTable
                columns={[
                    { key: 'ad', header: 'Kontrolör', sortable: true, render: (item: any) => (
                        <div className="flex items-center gap-3">
                            <UserAvatar name={item.ad} size="md" />
                            <div>
                                <div className="font-bold text-slate-900 text-xs">{item.ad}</div>
                                <div className="text-[11px] text-slate-500">{item.unvan}</div>
                            </div>
                        </div>
                    ) },
                    { key: 'birim', header: 'Görevli Birim', render: (item: any) => <span className="text-xs font-semibold text-slate-700">{item.birim}</span> },
                    { key: 'ortPuan', header: 'Ortalama Seviye', width: '150px', sortable: true, render: (item: any) => (
                        <div className="flex items-center gap-2">
                            <RatingStars level={Math.round(item.ortPuan)} size={14} />
                            <span className="text-xs font-bold text-slate-700">({item.ortPuan})</span>
                        </div>
                    ) },
                    { key: 'sonGuncelleme', header: 'Son Güncelleme', type: 'date', width: '130px' },
                    { key: 'actions', header: 'İşlemler', width: '120px', render: (item: any) => (
                        <ActionMenu items={[
                            { label: 'Yetkinlik Değerlendir', icon: Edit2, onClick: () => handleEditSkills(item) },
                            { label: 'Güncelleme Tarihçesi', icon: History, onClick: () => { setHistoryStaff(item); setHistoryModalOpen(true); } }
                        ]} />
                    ) }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => { setSearchTerm(''); setTitleFilter([]); }}
                rowKey="id"
            />

            {/* Edit Skills Modal matching Audit 1:1 */}
            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Yetkinlik Değerlendirmesi Düzenle — ${selectedStaff.ad}`} size="lg">
                    <div className="space-y-6 text-xs p-1">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="font-bold text-slate-900">{selectedStaff.ad} — {selectedStaff.unvan}</div>
                            <div className="text-slate-500 font-medium">{selectedStaff.birim}</div>
                        </div>

                        <div className="space-y-5">
                            {(Object.keys(SKILL_LABELS) as Array<keyof SkillRatings>).map((key) => {
                                const skill = SKILL_LABELS[key];
                                const hasChanged = (modalSkills[key] || 0) !== (originalSkills[key] || 0);

                                return (
                                    <div key={key} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900">{skill.label}</div>
                                                <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{skill.desc}</div>
                                            </div>
                                            <div className="shrink-0 w-44">
                                                <CustomSelect
                                                    value={(modalSkills[key] || 0).toString()}
                                                    onChange={(val) => setModalSkills({ ...modalSkills, [key]: parseInt(val as string) })}
                                                    options={SKILL_LEVELS.map(l => ({ value: l.value.toString(), label: l.label }))}
                                                />
                                            </div>
                                        </div>

                                        {hasChanged && (
                                            <div className="mt-3 bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl animate-in fade-in duration-200">
                                                <label className="block text-xs font-bold text-indigo-900 mb-1">
                                                    Puan Değişikliği Gerekçesi <span className="text-rose-500">*</span>
                                                </label>
                                                <textarea
                                                    className="w-full text-xs border border-indigo-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                                    rows={2}
                                                    placeholder={`${skill.shortLabel} yetkinlik seviyesi değişikliği nedenini kısaca açıklayınız...`}
                                                    value={justifications[key] || ''}
                                                    onChange={(e) => setJustifications({ ...justifications, [key]: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>İptal</Button>
                            <Button variant="primary" onClick={handleSaveSkills}>Değerlendirmeyi Kaydet</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* History Modal */}
            {historyModalOpen && historyStaff && (
                <Modal isOpen={historyModalOpen} onClose={() => { setHistoryModalOpen(false); setHistoryStaff(null); }} title={`Yetkinlik Güncelleme Tarihçesi — ${historyStaff.ad}`} size="lg">
                    <div className="p-4 space-y-3 text-xs min-h-[250px]">
                        {historyStaff.notes ? (
                            <Timeline events={historyStaff.notes.split('\n').filter(Boolean).map((line, idx) => ({
                                id: `evt-${idx}`,
                                timestamp: line.split(']')[0]?.replace('[', '') || '—',
                                user: 'Sistem Yöneticisi',
                                title: 'Yetkinlik Değişimi',
                                description: line
                            }))} />
                        ) : (
                            <div className="p-8 text-center text-slate-400 italic">Henüz geçmiş yetkinlik güncelleme kaydı bulunmuyor.</div>
                        )}
                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => { setHistoryModalOpen(false); setHistoryStaff(null); }}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}


export default function ControlSkillsPage() {
    return (
        <RequireRole allowedRoles={['KONTROL_YONETICISI', 'ADMIN', 'SUPER_ADMIN']}>
            <ControlSkillsPageContent />
        </RequireRole>
    );
}
