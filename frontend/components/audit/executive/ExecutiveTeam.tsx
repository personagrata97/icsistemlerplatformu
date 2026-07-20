import React, { useState } from 'react';
import DashboardWidget from '@/components/ui/DashboardWidget';
import DashboardListItem from '@/components/ui/DashboardListItem';
import ActionMenu from '@/components/ui/ActionMenu';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ConfirmModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import CapacityCard from '@/components/ui/CapacityCard';
import Badge from '@/components/ui/Badge';
import CustomSelect from '@/components/ui/CustomSelect';
import StatusBadge from '@/components/ui/StatusBadge';
import Alert from '@/components/ui/Alert';
import { Calendar, CheckSquare, Clock, UserCheck, Users, XCircle, Target, Activity, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import { useToast } from '@/components/Toast';

type ExecutiveTeamProps = {
    pendingLeaves: any[];
    activeLeaves: any[];
    upcomingLeaves: any[];
    pendingDeclarations: any[];
    sortedSkills?: any[];
    weakestSkill?: any;
    strongestSkill?: any;
    minScore?: number;
    weakestSkillsList?: any[];
    staffs?: any[];
    onDataChange: () => void;
};

const ExecutiveTeam: React.FC<ExecutiveTeamProps> = ({ 
    pendingLeaves, 
    activeLeaves, 
    upcomingLeaves, 
    pendingDeclarations,
    sortedSkills = [],
    weakestSkill,
    strongestSkill,
    minScore = 0,
    weakestSkillsList = [],
    staffs = [],
    onDataChange
}) => {
    const { showToast } = useToast();
    const [approveLeaveId, setApproveLeaveId] = useState<string | null>(null);
    const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedStaffForTimeline, setSelectedStaffForTimeline] = useState<any | null>(null);

    // Reassign / Remove Modals State
    const [removeAuditData, setRemoveAuditData] = useState<{auditId: string, currentStaffId: string, auditTitle: string, role: string} | null>(null);
    const [reassignAuditData, setReassignAuditData] = useState<{auditId: string, currentStaffId: string, auditTitle: string, role: string} | null>(null);
    const [selectedNewStaffIds, setSelectedNewStaffIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Action Handlers ---
    const handleRemoveFromTeam = async () => {
        if (!removeAuditData) return;
        setIsProcessing(true);
        try {
            const audit = await auditApi.getAuditById(removeAuditData.auditId);
            let updatePayload: any = {};
            
            if (removeAuditData.role === 'Gözetmen') {
                updatePayload.supervisorId = null;
            } else {
                let teamArray = typeof audit.team === 'string' ? JSON.parse(audit.team || '[]') : (audit.team || []);
                teamArray = teamArray.filter((m: any) => {
                    const mId = typeof m === 'string' ? m : m.id;
                    return mId !== removeAuditData.currentStaffId;
                });
                updatePayload.team = teamArray;
            }

            await auditApi.updateAudit(removeAuditData.auditId, updatePayload);
            showToast('Personel başarıyla ekipten çıkarıldı.', 'success');
            setRemoveAuditData(null);
            
            // Eğer açılır takvim modalı açıksa, onu da kapat veya yenile
            setSelectedStaffForTimeline(null); 
            onDataChange();
        } catch (error) {
            console.error(error);
            showToast('İşlem sırasında bir hata oluştu.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReassignTask = async () => {
        if (!reassignAuditData || selectedNewStaffIds.length === 0) return;
        setIsProcessing(true);
        try {
            const audit = await auditApi.getAuditById(reassignAuditData.auditId);
            let updatePayload: any = {};
            
            if (reassignAuditData.role === 'Gözetmen') {
                updatePayload.supervisorId = selectedNewStaffIds[0];
            } else {
                let teamArray = typeof audit.team === 'string' ? JSON.parse(audit.team || '[]') : (audit.team || []);
                // Çıkar
                teamArray = teamArray.filter((m: any) => {
                    const mId = typeof m === 'string' ? m : m.id;
                    return mId !== reassignAuditData.currentStaffId;
                });
                // Ekle
                for (const newId of selectedNewStaffIds) {
                    if (!teamArray.includes(newId)) {
                        teamArray.push(newId);
                    }
                }
                updatePayload.team = teamArray;
            }

            await auditApi.updateAudit(reassignAuditData.auditId, updatePayload);
            showToast('Görev başarıyla devredildi.', 'success');
            setReassignAuditData(null);
            setSelectedNewStaffIds([]);
            
            setSelectedStaffForTimeline(null);
            onDataChange();
        } catch (error) {
            console.error(error);
            showToast('İşlem sırasında bir hata oluştu.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    // -----------------------

    const handleApproveLeaveSubmit = async () => {
        if (!approveLeaveId) return;
        try {
            await auditApi.updateStaffLeave(approveLeaveId, { status: 'Onaylandı' });
            showToast('İzin onaylandı', 'success');
            setApproveLeaveId(null);
            onDataChange();
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };

    const handleRejectLeaveSubmit = async () => {
        if (!rejectLeaveId) return;
        try {
            await auditApi.updateStaffLeave(rejectLeaveId, { status: 'İptal Edildi', managerNote: rejectReason });
            showToast('İzin reddedildi ve notunuz personele iletildi', 'success');
            setRejectLeaveId(null);
            setRejectReason('');
            onDataChange();
        } catch (error) {
            console.error(error);
            showToast('İşlem başarısız', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* 1. YETKİNLİK MATRİSİ (Skills) */}
            {sortedSkills.length > 0 && (
                <div className="mb-6">
                    <DashboardWidget 
                        widgetType="skills" 
                        title="Teftiş Kurulu Yetkinlik Envanteri"
                        icon={Target}
                        color="indigo"
                        infoTooltip="Tüm kadronun yetkinlik bazlı ortalama değerlendirme puanlarıdır. 4 üzerinden hesaplanır."
                        actionHref="/audit/universe"
                        actionLabel="Yetkinlik Matrisini Aç"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                            {sortedSkills.map((skill, index) => {
                                const isWeakest = skill.total === minScore;
                                const isStrongest = skill.total === strongestSkill?.total;
                                const percentage = (skill.total / 4) * 100;
                                
                                return (
                                    <StatCard
                                        key={index}
                                        title={skill.label}
                                        value={
                                            <div className="flex items-baseline gap-1">
                                                <span>{skill.total.toFixed(1)}</span>
                                                <span className="text-gray-400 font-semibold text-[13px]">/ 4.0</span>
                                            </div>
                                        }
                                        valueClassName={isWeakest ? "text-rose-600" : isStrongest ? "text-emerald-600" : "text-gray-900"}
                                        color={isWeakest ? 'rose' : isStrongest ? 'emerald' : 'indigo'}
                                        badgeText={isWeakest ? 'Gelişim Alanı' : isStrongest ? 'En Güçlü' : undefined}
                                        badgeColor={isWeakest ? 'bg-rose-100 text-rose-700' : isStrongest ? 'bg-emerald-100 text-emerald-700' : undefined}
                                        breakdowns={skill.breakdowns}
                                    >
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div 
                                                className={`h-1.5 rounded-full ${isWeakest ? 'bg-rose-500' : isStrongest ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </StatCard>
                                );
                            })}
                        </div>
                        {weakestSkill && (
                            <div className="mt-4">
                                <Alert 
                                    variant="info" 
                                    title="Öncelikli Gelişim Alanı" 
                                    description={`Ekibinizin en düşük ortalamaya sahip yetkinlik ${weakestSkillsList.length > 1 ? 'alanları' : 'alanı'} olan ${weakestSkillsList.map(s => s.label).join(', ')} (${minScore}/4.0) için gelecek yılın eğitim planlamasında (CPE) öncelik verilmesi, kurumsal risk kapasitesini artıracaktır.`} 
                                />
                            </div>
                        )}
                    </DashboardWidget>
                </div>
            )}

            {/* 2. İŞ YÜKÜ VE KAPASİTE DAĞILIMI (Workload) */}
            <div className="mb-6">
                <DashboardWidget 
                    widgetType="actions"
                    title="Personel İş Yükü ve Kapasite Dağılımı"
                    icon={Activity}
                    color="sky"
                    infoTooltip="Kadroda bulunan personelin anlık aktif görev/denetim yoğunluğunu gösterir."
                >
                    <div className="space-y-4">
                        {staffs.length === 0 ? (
                            <div className="flex items-center justify-center py-6 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState variant="minimal" icon={Users} title="Kayıt Yok" description="Kadro verisi bulunamadı." />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {staffs.map((staff: any, idx: number) => {
                                    return (
                                        <CapacityCard 
                                            key={idx}
                                            id={staff.id || idx}
                                            name={staff.displayName || staff.user?.displayName || staff.firstName || 'Personel'}
                                            title={staff.title || 'Müfettiş'}
                                            activeCount={staff.activeAssignmentsCount || 0}
                                            activeAssignments={staff.activeAssignmentsList || []}
                                            maxCapacity={4}
                                            onClick={() => setSelectedStaffForTimeline(staff)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DashboardWidget>
            </div>

            {/* 3. İDARİ VE YASAL ONAYLAR (Inbox) */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <CheckCircle className="text-primary" size={20}/>
                İdari Onaylar ve Beyanlar
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardWidget 
                    widgetType="actions"
                    title="Onay Bekleyen İzinler"
                    infoTooltip="Yöneticinin onayını bekleyen güncel personel izin talepleri."
                    icon={Clock}
                    color="amber"
                >
                    <div className="space-y-2">
                        {pendingLeaves.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center py-6 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState variant="minimal" icon={Calendar} title="Bekleyen İzin Yok" description="Tüm izin talepleri yanıtlandı." />
                            </div>
                        ) : (
                            pendingLeaves.map((l, i) => (
                                <DashboardListItem
                                    key={i}
                                    title={l.name}
                                    subtitle={l.type}
                                    status="Planlandı"
                                    rightContent={
                                        <ActionMenu 
                                            items={[
                                                { label: 'Onayla', icon: CheckSquare, onClick: () => setApproveLeaveId(l.id) },
                                                { label: 'Reddet', icon: XCircle, onClick: () => setRejectLeaveId(l.id) }
                                            ]}
                                        />
                                    }
                                />
                            ))
                        )}
                    </div>
                </DashboardWidget>

                <DashboardWidget 
                    widgetType="actions"
                    title="Bağımsızlık Beyanları"
                    infoTooltip="Denetim atamaları öncesinde personelin sisteme girdiği bağımsızlık beyanları."
                    icon={UserCheck}
                    color="purple"
                >
                    <div className="space-y-2">
                        {pendingDeclarations.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center py-6 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState variant="minimal" icon={UserCheck} title="Beyan Beklemiyor" description="Onay bekleyen bağımsızlık beyanı yok." />
                            </div>
                        ) : (
                            pendingDeclarations.map((d, i) => (
                                <DashboardListItem
                                    key={i}
                                    title={d.name}
                                    subtitle={d.audit?.title || 'Bilinmeyen Denetim'}
                                    status="Bekliyor"
                                    rightContent={
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-xs text-slate-400 font-medium">Tarih</span>
                                            <span className="text-sm font-bold text-slate-700">{new Date(d.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    }
                                />
                            ))
                        )}
                    </div>
                </DashboardWidget>
            </div>

            {/* Kadro Analizi (Takvim) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardWidget 
                    widgetType="actions"
                    title="Şu An İzinde Olanlar"
                    icon={Users}
                    color="emerald"
                    infoTooltip="Bugün itibariyle aktif olarak izinde olan personelin listesi."
                >
                    <div className="space-y-2">
                        {activeLeaves.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center py-6 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState variant="minimal" icon={Users} title="İzinde Personel Yok" description="Şu an tüm kadro aktif görevde." />
                            </div>
                        ) : activeLeaves.map((l, i) => (
                            <DashboardListItem
                                key={i}
                                title={l.name}
                                subtitle={l.type}
                                status="Kapalı"
                                rightContent={
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-sm font-bold text-slate-700">{new Date(l.eDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                }
                            />
                        ))}
                    </div>
                </DashboardWidget>

                <DashboardWidget 
                    widgetType="actions"
                    title="Yaklaşan İzinler (30 Gün)"
                    icon={Calendar}
                    color="indigo"
                    infoTooltip="Önümüzdeki 30 gün içerisinde başlayacak onaylı izin planları."
                    actionHref="/audit/staff?tab=calendar"
                    actionLabel="Tüm İzinleri Gör"
                >
                    <div className="space-y-2">
                        {upcomingLeaves.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center py-6 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                <EmptyState variant="minimal" icon={Calendar} title="Yaklaşan İzin Yok" description="Önümüzdeki 30 gün için planlı izin bulunmuyor." />
                            </div>
                        ) : upcomingLeaves.sort((a, b) => a.sDate.getTime() - b.sDate.getTime()).slice(0, 5).map((l, i) => (
                            <DashboardListItem
                                key={i}
                                title={l.name}
                                subtitle={l.type}
                                status="Planlandı"
                                rightContent={
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-xs text-slate-400 font-medium">Tarih Aralığı</span>
                                        <span className="text-sm font-bold text-slate-700">
                                            {new Date(l.sDate).toLocaleDateString('tr-TR').slice(0, 5)} - {new Date(l.eDate).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                }
                            />
                        ))}
                    </div>
                </DashboardWidget>
            </div>

            {/* İzin Onaylama Teyit Modalı */}
            <ConfirmModal
                isOpen={!!approveLeaveId}
                onClose={() => setApproveLeaveId(null)}
                onConfirm={handleApproveLeaveSubmit}
                title="İzin Talebini Onayla"
                message="Bu izin talebini onaylamak istediğinize emin misiniz? Onaylanan izinler personel kapasitesinden düşülecektir."
                type="success"
                confirmText="Onayla"
            />

            {/* İzin Reddetme ve Gerekçe Modalı */}
            <Modal
                isOpen={!!rejectLeaveId}
                onClose={() => { setRejectLeaveId(null); setRejectReason(''); }}
                title="İzin Talebini Reddet / İptal Et"
                size="md"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <Button variant="secondary" onClick={() => { setRejectLeaveId(null); setRejectReason(''); }}>İptal</Button>
                        <Button variant="danger" onClick={handleRejectLeaveSubmit} disabled={!rejectReason.trim()}>Reddet</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Bu izin talebini reddetmek üzeresiniz. Lütfen personele iletilmek üzere bir ret gerekçesi veya alternatif tarih önerisi yazın.
                    </p>
                    <div className="form-group">
                        <label className="form-label">Ret Gerekçesi / Yönetici Notu <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm min-h-[100px]"
                            placeholder="Örn: Bu tarihlerde Şube denetimindesin, 15-20 Ağustos arası takvimin boş. Bu tarihler için tekrar talep girebilirsin."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Kapasite Takvimi ve Çakışma Modalı */}
            <Modal
                isOpen={!!selectedStaffForTimeline}
                onClose={() => setSelectedStaffForTimeline(null)}
                title={selectedStaffForTimeline ? `${selectedStaffForTimeline.displayName || selectedStaffForTimeline.firstName} - Aktif Görev Takvimi` : 'Görev Takvimi'}
                size="xl"
            >
                {selectedStaffForTimeline && (
                    <div className="space-y-4">
                        {(() => {
                            // Çakışma Analizi Mantığı
                            const assignments = selectedStaffForTimeline.activeAssignmentsList || [];
                            let hasConflict = false;
                            
                            // Tarih çakışmasını kabaca kontrol edelim (Statüleri 'Devam Ediyor' saydığımız için)
                            for (let i = 0; i < assignments.length; i++) {
                                for (let j = i + 1; j < assignments.length; j++) {
                                    const a = assignments[i];
                                    const b = assignments[j];
                                    if (a.startDate && a.endDate && b.startDate && b.endDate) {
                                        const aStart = new Date(a.startDate);
                                        const aEnd = new Date(a.endDate);
                                        const bStart = new Date(b.startDate);
                                        const bEnd = new Date(b.endDate);
                                        
                                        // Overlap check
                                        if (aStart <= bEnd && aEnd >= bStart) {
                                            hasConflict = true;
                                            a.isOverlapping = true;
                                            b.isOverlapping = true;
                                        }
                                    }
                                }
                            }

                            return (
                                <>
                                    {hasConflict && (
                                        <Alert 
                                            variant="error" 
                                            title="Tarih Çakışması" 
                                            description="İlgili personelin atandığı denetimlerin bazılarında tarih çakışması bulunmaktadır."
                                            icon={<AlertTriangle size={20} />}
                                        />
                                    )}
                                    
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {assignments.length === 0 ? (
                                            <EmptyState variant="minimal" icon={Calendar} title="Aktif Görev Yok" description="Personelin devam eden bir ataması bulunmuyor." />
                                        ) : (
                                            assignments.map((assignment: any, idx: number) => {
                                                const currentAuditId = assignment.id || assignment.auditId;
                                                const hasValidDates = assignment.startDate && assignment.endDate;
                                                const sDate = hasValidDates ? new Date(assignment.startDate).toLocaleDateString('tr-TR').slice(0, 5) : null;
                                                const eDate = hasValidDates ? new Date(assignment.endDate).toLocaleDateString('tr-TR') : null;
                                                
                                                return (
                                                    <DashboardListItem
                                                        key={idx}
                                                        title={
                                                            <a href={`/audit/detail/${currentAuditId}`} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center font-semibold transition-all duration-200 text-sm text-slate-700 hover:text-primary">
                                                                <span className="border-b border-transparent group-hover:border-current transition-colors duration-200">
                                                                    {assignment.title}
                                                                </span>
                                                                <ArrowRight size={14} className="ml-1.5 shrink-0 transform transition-transform duration-200 group-hover:translate-x-1 opacity-60 group-hover:opacity-100" />
                                                            </a>
                                                        }
                                                        subtitle={assignment.role}
                                                        className={assignment.isOverlapping ? 'border-rose-200 bg-rose-50/30' : ''}
                                                        rightContent={
                                                            <div className="flex items-center gap-3">
                                                                {hasValidDates ? (
                                                                    <Badge variant={assignment.isOverlapping ? 'danger' : 'primary'} size="sm">
                                                                        <Calendar size={12} className="mr-1 inline-block"/> 
                                                                        {sDate} - {eDate}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" size="sm" className="text-slate-400">Planlanmadı</Badge>
                                                                )}
                                                                
                                                                <ActionMenu 
                                                                    items={[
                                                                        { label: 'Görevi Devret', icon: Target, onClick: () => setReassignAuditData({ auditId: currentAuditId, currentStaffId: selectedStaffForTimeline.id, auditTitle: assignment.title, role: assignment.role }) },
                                                                        { label: 'Ekipten Çıkar', icon: XCircle, variant: 'danger', onClick: () => setRemoveAuditData({ auditId: currentAuditId, currentStaffId: selectedStaffForTimeline.id, auditTitle: assignment.title, role: assignment.role }) }
                                                                    ]}
                                                                />
                                                            </div>
                                                        }
                                                    />
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </Modal>

            {/* Ekipten Çıkarma Onay Modalı */}
            <ConfirmModal
                isOpen={!!removeAuditData}
                onClose={() => setRemoveAuditData(null)}
                onConfirm={handleRemoveFromTeam}
                title="Ekipten Çıkarma İşlemi"
                message={`Bu personeli "${removeAuditData?.auditTitle}" görevinden çıkarmak istediğinize emin misiniz?`}
                type="danger"
                confirmText={isProcessing ? "İşleniyor..." : "Ekipten Çıkar"}
            />

            {/* Görev Devretme Modalı */}
            <Modal
                isOpen={!!reassignAuditData}
                onClose={() => { setReassignAuditData(null); setSelectedNewStaffIds([]); }}
                title="Görevi Devret"
                size="md"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="secondary" onClick={() => { setReassignAuditData(null); setSelectedNewStaffIds([]); }} disabled={isProcessing}>İptal</Button>
                        <Button variant="primary" onClick={handleReassignTask} disabled={selectedNewStaffIds.length === 0 || isProcessing}>
                            {isProcessing ? 'Devrediliyor...' : 'Görevi Devret'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        <strong>"{reassignAuditData?.auditTitle}"</strong> görevi için yeni bir sorumlu seçin. Sadece uygun kapasiteye sahip personel listelenmektedir.
                    </p>
                    <CustomSelect
                        label={reassignAuditData?.role === 'Gözetmen' ? "Görevi Devralacak Gözetmen" : "Görevi Devralacak Personel (1'e 1 Değişim)"}
                        value={selectedNewStaffIds[0] || ""}
                        onChange={(val) => {
                            setSelectedNewStaffIds([val as string]);
                        }}
                        isMulti={false}
                        disabled={isProcessing}
                        placeholder="Lütfen seçiniz..."
                        options={staffs
                            .filter(s => s.id !== reassignAuditData?.currentStaffId)
                            .filter(s => (s.activeAssignmentsCount || 0) < 4)
                            .sort((a, b) => (a.activeAssignmentsCount || 0) - (b.activeAssignmentsCount || 0))
                            .map(s => ({
                                value: String(s.id),
                                label: `${s.displayName || s.firstName} (${s.title || 'Müfettiş'})`,
                                subtitle: `Mevcut Yük: ${s.activeAssignmentsCount || 0} / 4`
                            }))
                        }
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ExecutiveTeam;
