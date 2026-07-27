'use client';

import React, { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ActionMenu from '@/components/ui/ActionMenu';
import RatingStars from '@/components/ui/RatingStars';
import { Award, Users, TrendingUp, Eye, Edit2, History, Star } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ControlStaffTabs from '@/components/control/ControlStaffTabs';

interface SkillRatings {
    coso_framework: number;
    risk_control: number;
    testing_methodology: number;
    data_analysis: number;
    reporting: number;
}

const SKILL_LABELS: Record<keyof SkillRatings, { label: string; desc: string }> = {
    coso_framework: { label: 'COSO İç Kontrol Çerçevesi', desc: 'COSO 2013 bileşenleri, kontrol ortamı, risk değerlendirme ve kontrol faaliyetleri yetkinliği' },
    risk_control: { label: 'Risk & Kontrol Güvence', desc: 'Operasyonel risk yönetimi, kontrol noktası tasarımı ve etkinlik değerlendirme' },
    testing_methodology: { label: 'Kontrol Testi Metodolojisi', desc: 'Tasarım ve işletim etkinliği testi, walktrough prosedürleri, örneklem büyüklüğü belirleme' },
    data_analysis: { label: 'Veri Analitiği & Otomasyon', desc: 'SQL, Python, Excel analitik araçları ve süreç otomasyonu yetkinliği' },
    reporting: { label: 'Raporlama & Mevzuat Uyumu', desc: 'BDDK raporlama gereksinimleri, dönem raporu hazırlama ve üst yönetim sunumu' }
};

interface StaffSkill {
    id: string;
    ad: string;
    unvan: string;
    birim: string;
    skills: SkillRatings;
    ortPuan: number;
    sonGuncelleme: string;
}

export default function ControlSkillsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<StaffSkill | null>(null);
    const [editingStaff, setEditingStaff] = useState<StaffSkill | null>(null);
    const [editSkills, setEditSkills] = useState<SkillRatings | null>(null);

    const staffSkills: StaffSkill[] = [
        {
            id: 'IKM-001', ad: 'Ahmet Yılmaz', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol Merkezi',
            skills: { coso_framework: 5, risk_control: 4, testing_methodology: 5, data_analysis: 3, reporting: 4 },
            ortPuan: 4.2, sonGuncelleme: '2026-07-15'
        },
        {
            id: 'IKM-002', ad: 'Canan Öztürk', unvan: 'Kıdemli İç Kontrolör', birim: 'İç Kontrol Merkezi',
            skills: { coso_framework: 4, risk_control: 5, testing_methodology: 4, data_analysis: 3, reporting: 5 },
            ortPuan: 4.2, sonGuncelleme: '2026-07-12'
        },
        {
            id: 'IKM-003', ad: 'Zeynep Kaya', unvan: 'İç Kontrolör', birim: 'İç Kontrol Merkezi',
            skills: { coso_framework: 3, risk_control: 3, testing_methodology: 4, data_analysis: 4, reporting: 3 },
            ortPuan: 3.4, sonGuncelleme: '2026-07-10'
        },
        {
            id: 'IKM-004', ad: 'Emre Aksoy', unvan: 'İç Kontrolör', birim: 'İç Kontrol Merkezi',
            skills: { coso_framework: 3, risk_control: 4, testing_methodology: 3, data_analysis: 2, reporting: 3 },
            ortPuan: 3.0, sonGuncelleme: '2026-07-08'
        },
    ];

    const filteredStaff = staffSkills.filter(s => {
        if (searchTerm && !s.ad.toLowerCase().includes(searchTerm.toLowerCase()) && !s.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const avgTeamScore = (staffSkills.reduce((a, b) => a + b.ortPuan, 0) / staffSkills.length).toFixed(1);
    const strongestSkill = Object.entries(SKILL_LABELS).reduce((best, [key]) => {
        const avg = staffSkills.reduce((a, b) => a + b.skills[key as keyof SkillRatings], 0) / staffSkills.length;
        return avg > best.avg ? { key, avg } : best;
    }, { key: '', avg: 0 });
    const weakestSkill = Object.entries(SKILL_LABELS).reduce((worst, [key]) => {
        const avg = staffSkills.reduce((a, b) => a + b.skills[key as keyof SkillRatings], 0) / staffSkills.length;
        return avg < worst.avg ? { key, avg } : worst;
    }, { key: '', avg: 6 });

    const handleSaveSkills = () => {
        if (!editingStaff || !editSkills) return;
        setEditingStaff(null);
        setEditSkills(null);
        showToast(`${editingStaff.ad} yetkinlik değerlendirmesi güncellendi`, 'success');
    };

    return (
        <div className="space-y-6">
            <ControlStaffTabs />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Değerlendirilen Kontrolör" value={staffSkills.length} icon={Users} color="blue" />
                <StatCard title="Ekip Ortalama Puanı" value={avgTeamScore} icon={Star} color="amber" />
                <StatCard title="En Güçlü Yetkinlik" value={SKILL_LABELS[strongestSkill.key as keyof SkillRatings]?.label.split(' ').slice(0, 2).join(' ') || '—'} icon={TrendingUp} color="emerald" />
                <StatCard title="Gelişim Alanı" value={SKILL_LABELS[weakestSkill.key as keyof SkillRatings]?.label.split(' ').slice(0, 2).join(' ') || '—'} icon={Award} color="rose" />
            </div>

            <PageToolbar
                searchPlaceholder="Kontrolör adı veya sicil no ile ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    { key: 'ad', header: 'Kontrolör', sortable: true, render: (item: any) => (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {item.ad.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-xs">{item.ad}</div>
                                <div className="text-[11px] text-slate-500">{item.unvan}</div>
                            </div>
                        </div>
                    ) },
                    ...Object.entries(SKILL_LABELS).map(([key, val]) => ({
                        key,
                        header: val.label.split(' ').slice(0, 2).join(' '),
                        width: '120px',
                        render: (item: any) => <RatingStars level={item.skills[key as keyof SkillRatings]} maxLevel={5} size={14} />
                    })),
                    { key: 'ortPuan', header: 'Ortalama', width: '100px', sortable: true, render: (item: any) => (
                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${item.ortPuan >= 4 ? 'bg-emerald-100 text-emerald-800' : item.ortPuan >= 3 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                            {item.ortPuan.toFixed(1)}
                        </span>
                    ) },
                    { key: 'actions', header: 'İşlem', width: '100px', render: (item: any) => (
                        <ActionMenu items={[
                            { label: 'Detay Görüntüle', icon: <Eye size={14} />, onClick: () => setSelectedStaff(item) },
                            { label: 'Değerlendirmeyi Düzenle', icon: <Edit2 size={14} />, onClick: () => { setEditingStaff(item); setEditSkills({ ...item.skills }); } },
                        ]} />
                    ) }
                ]}
                data={filteredStaff}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="id"
            />

            {/* Skill Detail Modal */}
            {selectedStaff && (
                <Modal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} title={`Yetkinlik Profili — ${selectedStaff.ad}`} size="lg">
                    <div className="space-y-4 text-xs">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/60">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                    {selectedStaff.ad.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900">{selectedStaff.ad}</h3>
                                    <p className="text-slate-600">{selectedStaff.unvan} — {selectedStaff.birim}</p>
                                </div>
                                <div className="ml-auto text-center">
                                    <div className={`text-2xl font-bold ${selectedStaff.ortPuan >= 4 ? 'text-emerald-600' : selectedStaff.ortPuan >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>{selectedStaff.ortPuan.toFixed(1)}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Ortalama</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(SKILL_LABELS).map(([key, val]) => (
                                <div key={key} className="p-3 bg-white border border-slate-200 rounded-xl">
                                    <div className="flex justify-between items-center mb-1">
                                        <div>
                                            <span className="font-bold text-slate-900 text-xs">{val.label}</span>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{val.desc}</p>
                                        </div>
                                        <RatingStars level={selectedStaff.skills[key as keyof SkillRatings]} maxLevel={5} size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-[10px] text-slate-400 text-right">Son güncelleme: {new Date(selectedStaff.sonGuncelleme).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>

                        <div className="flex justify-end pt-3 border-t">
                            <Button variant="secondary" onClick={() => setSelectedStaff(null)}>Kapat</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Skills Modal */}
            {editingStaff && editSkills && (
                <Modal isOpen={!!editingStaff} onClose={() => { setEditingStaff(null); setEditSkills(null); }} title={`Yetkinlik Değerlendirmesi Düzenle — ${editingStaff.ad}`} size="lg">
                    <div className="space-y-4 text-xs">
                        {Object.entries(SKILL_LABELS).map(([key, val]) => (
                            <div key={key} className="p-3 bg-white border border-slate-200 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-bold text-slate-900">{val.label}</span>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{val.desc}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(score => (
                                            <button
                                                key={score}
                                                type="button"
                                                className={`w-8 h-8 rounded-lg border-2 text-xs font-bold transition-all ${editSkills[key as keyof SkillRatings] >= score ? 'bg-amber-400 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300'}`}
                                                onClick={() => setEditSkills({ ...editSkills, [key]: score })}
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button variant="secondary" onClick={() => { setEditingStaff(null); setEditSkills(null); }}>İptal</Button>
                            <Button variant="primary" onClick={handleSaveSkills}>Değerlendirmeyi Kaydet</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
