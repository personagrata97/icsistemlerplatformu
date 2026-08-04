'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Calendar, Clock, AlertCircle, CheckCircle, ShieldCheck, Save, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import PersonCell from '@/components/ui/PersonCell';
import FormInput from '@/components/ui/FormInput';
import CustomSelect from '@/components/ui/CustomSelect';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';

interface AuditTeamTabProps {
    auditId: string;
    teamMembers: any[];
    allStaff: any[];
    onRefresh: () => void;
    canManageTeam?: boolean;
}

const AuditTeamTab: React.FC<AuditTeamTabProps> = ({
    auditId,
    teamMembers = [],
    allStaff = [],
    onRefresh,
    canManageTeam = true
}) => {
    const { showToast } = useToast();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('EKIP_UYESI');
    const [plannedDays, setPlannedDays] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Edit Member State
    const [editingMember, setEditingMember] = useState<any | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editPlannedDays, setEditPlannedDays] = useState(0);
    const [editActualDays, setEditActualDays] = useState(0);

    const activeMembers = teamMembers.filter((m: any) => m.aktif !== false);
    const totalPlanned = activeMembers.reduce((acc: number, m: any) => acc + (m.planlananGun || 0), 0);
    const totalActual = activeMembers.reduce((acc: number, m: any) => acc + (m.gerceklesenGun || 0), 0);

    const handleAddMember = async () => {
        if (!selectedUserId) {
            showToast('Lütfen bir personel seçiniz', 'warning');
            return;
        }
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await auditApi.assignTeamMember(auditId, {
                userId: selectedUserId,
                rol: selectedRole,
                planlananGun: Number(plannedDays) || 0
            });
            showToast('Ekip üyesi başarıyla atandı', 'success');
            setShowAddModal(false);
            setSelectedUserId('');
            onRefresh();
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Ekip üyesi eklenirken hata oluştu.';
            setErrorMsg(msg);
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateMember = async () => {
        if (!editingMember) return;
        setIsSubmitting(true);
        try {
            await auditApi.updateTeamMemberRole(auditId, editingMember.id, {
                rol: editRole,
                planlananGun: Number(editPlannedDays),
                gerceklesenGun: Number(editActualDays)
            });
            showToast('Ekip üyesi güncellendi', 'success');
            setEditingMember(null);
            onRefresh();
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'Güncelleme yapılamadı', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (memberId: string, name: string) => {
        if (!confirm(`${name} isimli personeli denetim ekibinden çıkarmak istediğinize emin misiniz?`)) return;
        try {
            await auditApi.removeTeamMember(auditId, memberId);
            showToast('Ekip üyesi ekipten çıkarıldı', 'info');
            onRefresh();
        } catch (err: any) {
            showToast(err.message || 'Ekip üyesi çıkarılamadı', 'error');
        }
    };

    const getRoleBadge = (rol: string) => {
        switch (rol) {
            case 'EKIP_BASKANI':
                return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-bold">Ekip Başkanı</span>;
            case 'GOZETIM':
                return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Gözetim Sorumlusu</span>;
            default:
                return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-medium">Ekip Üyesi</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Workload Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ekip Büyüklüğü</div>
                        <div className="text-2xl font-bold text-slate-800">{activeMembers.length} Personel</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planlanan Toplam Gün</div>
                        <div className="text-2xl font-bold text-slate-800">{totalPlanned} Adam/Gün</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gerçekleşen Gün</div>
                        <div className="text-2xl font-bold text-slate-800">{totalActual} Adam/Gün</div>
                    </div>
                </div>
            </div>

            {/* Team Table Header */}
            <div className="card !p-0 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-slate-50/70">
                    <h3 className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <Users size={18} className="text-primary" /> Atanmış Denetim Ekibi Üyeleri
                    </h3>
                    {canManageTeam && (
                        <Button size="sm" onClick={() => { setErrorMsg(null); setShowAddModal(true); }} leftIcon={<Plus size={16} />}>
                            Ekip Üyesi Atayınız
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase font-semibold border-b">
                            <tr>
                                <th className="px-4 py-3">Personel</th>
                                <th className="px-4 py-3">Ekip Rolü</th>
                                <th className="px-4 py-3">Planlanan (Gün)</th>
                                <th className="px-4 py-3">Gerçekleşen (Gün)</th>
                                <th className="px-4 py-3">Atanma Tarihi</th>
                                {canManageTeam && <th className="px-4 py-3 text-right">İşlemler</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeMembers.length > 0 ? (
                                activeMembers.map((member: any) => (
                                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <PersonCell
                                                name={member.user?.displayName || member.name || 'Personel'}
                                                className="!w-auto"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {getRoleBadge(member.rol)}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-700">
                                            {member.planlananGun || 0} Gün
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-700">
                                            {member.gerceklesenGun || 0} Gün
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {member.atanmaTarihi ? new Date(member.atanmaTarihi).toLocaleDateString('tr-TR') : '-'}
                                        </td>
                                        {canManageTeam && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingMember(member);
                                                            setEditRole(member.rol);
                                                            setEditPlannedDays(member.planlananGun || 0);
                                                            setEditActualDays(member.gerceklesenGun || 0);
                                                        }}
                                                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id, member.user?.displayName || member.name)}
                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Ekipten Çıkar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-400">
                                        <Users size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm italic">Henüz bu denetime ekip üyesi atanmamıştır.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="modal-overlay open" onClick={() => setShowAddModal(false)}>
                    <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Users size={18} className="text-primary" /> Denetime Ekip Üyesi Ekle
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Personel Seçiniz *
                                </label>
                                <CustomSelect
                                    value={selectedUserId}
                                    onChange={setSelectedUserId}
                                    options={allStaff.map(s => ({
                                        value: s.id,
                                        label: `${s.name || s.displayName} (${s.role || s.title || 'Müfettiş'})`
                                    }))}
                                    placeholder="Personel ara / seç..."
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Ekip Rolü *
                                </label>
                                <CustomSelect
                                    value={selectedRole}
                                    onChange={setSelectedRole}
                                    options={[
                                        { value: 'EKIP_BASKANI', label: 'Ekip Başkanı (Tek kişi olabilir)' },
                                        { value: 'EKIP_UYESI', label: 'Ekip Üyesi' },
                                        { value: 'GOZETIM', label: 'Gözetim Sorumlusu' }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Planlanan İş Günü
                                </label>
                                <FormInput
                                    type="number"
                                    min={0}
                                    value={plannedDays}
                                    onChange={e => setPlannedDays(Number(e.target.value))}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleAddMember} disabled={isSubmitting}>
                                    {isSubmitting ? 'Atanıyor...' : 'Ekibe Atayınız'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {editingMember && (
                <div className="modal-overlay open" onClick={() => setEditingMember(null)}>
                    <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-base font-bold text-slate-800">
                                Ekip Üyesi Düzenle: {editingMember.user?.displayName || editingMember.name}
                            </h3>
                            <button onClick={() => setEditingMember(null)} className="p-1.5 hover:bg-slate-200 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Ekip Rolü
                                </label>
                                <CustomSelect
                                    value={editRole}
                                    onChange={setEditRole}
                                    options={[
                                        { value: 'EKIP_BASKANI', label: 'Ekip Başkanı' },
                                        { value: 'EKIP_UYESI', label: 'Ekip Üyesi' },
                                        { value: 'GOZETIM', label: 'Gözetim Sorumlusu' }
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Planlanan Adam/Gün
                                </label>
                                <FormInput
                                    type="number"
                                    min={0}
                                    value={editPlannedDays}
                                    onChange={e => setEditPlannedDays(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="form-label font-medium text-xs text-slate-700 block mb-1">
                                    Gerçekleşen Adam/Gün
                                </label>
                                <FormInput
                                    type="number"
                                    min={0}
                                    value={editActualDays}
                                    onChange={e => setEditActualDays(Number(e.target.value))}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="secondary" onClick={() => setEditingMember(null)}>
                                    İptal
                                </Button>
                                <Button variant="primary" onClick={handleUpdateMember} disabled={isSubmitting}>
                                    Kaydet
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTeamTab;
