import { useMemo } from 'react';
import { calculateDynamicSkills } from '@/lib/audit-utils';

export function useExecutiveCalculations(stats: any) {
    return useMemo(() => {
        // 1. Teftiş Kurulu Yetkinlik Analizi (Skill Gap) Hesaplaması
        const skillAverages: Record<string, any> = {
            risk_assessment: { label: 'Risk Yönetimi', total: 0, scores: [] },
            it_audit: { label: 'BT ve Siber', total: 0, scores: [] },
            financial_audit: { label: 'Finansal & Uyum', total: 0, scores: [] },
            data_analysis: { label: 'Veri Analitiği', total: 0, scores: [] },
            reporting_english: { label: 'Raporlama', total: 0, scores: [] }
        };

        if (stats?.staffs && stats.staffs.length > 0) {
            stats.staffs.forEach((staff: any) => {
                const dynamic = calculateDynamicSkills(staff);
                const name = staff.displayName || staff.user?.displayName || staff.firstName || 'Personel';
                
                skillAverages.risk_assessment.total += dynamic.risk_assessment.total;
                skillAverages.risk_assessment.scores.push({ name, val: dynamic.risk_assessment.total });
                
                skillAverages.it_audit.total += dynamic.it_audit.total;
                skillAverages.it_audit.scores.push({ name, val: dynamic.it_audit.total });
                
                skillAverages.financial_audit.total += dynamic.financial_audit.total;
                skillAverages.financial_audit.scores.push({ name, val: dynamic.financial_audit.total });
                
                skillAverages.data_analysis.total += dynamic.data_analysis.total;
                skillAverages.data_analysis.scores.push({ name, val: dynamic.data_analysis.total });
                
                skillAverages.reporting_english.total += dynamic.reporting_english.total;
                skillAverages.reporting_english.scores.push({ name, val: dynamic.reporting_english.total });
            });
            
            Object.keys(skillAverages).forEach(k => {
                const sk = skillAverages[k];
                sk.total = Number((sk.total / stats.staffs.length).toFixed(1));
                sk.breakdowns = sk.scores
                    .sort((a: any, b: any) => b.val - a.val)
                    .slice(0, 3)
                    .map((s: any) => ({ label: s.name, value: Number(s.val.toFixed(1)) }));
            });
        }

        const sortedSkills = Object.values(skillAverages).sort((a, b) => a.total - b.total);
        const weakestSkill = stats?.staffs?.length > 0 ? sortedSkills[0] : null;
        const strongestSkill = stats?.staffs?.length > 0 ? sortedSkills[sortedSkills.length - 1] : null;
        const minScore = weakestSkill ? weakestSkill.total : 0;
        const weakestSkillsList = sortedSkills.filter(s => s.total === minScore);

        // 2. Kadro & Kapasite ve İzin Hesaplamaları
        const pendingLeaves: any[] = [];
        const activeLeaves: any[] = [];
        const upcomingLeaves: any[] = [];
        const pendingDeclarations: any[] = [];
        const now = new Date();
        
        if (stats?.staffs) {
            stats.staffs.forEach((staff: any) => {
                const name = staff.displayName || staff.user?.displayName || staff.firstName || 'Personel';
                if (staff.leaves) {
                    staff.leaves.forEach((leave: any) => {
                        if (leave.status === 'İptal Edildi') return;
                        const sDate = new Date(leave.startDate);
                        const eDate = new Date(leave.endDate);
                        if (leave.status === 'Planlandı') pendingLeaves.push({ ...leave, name, staffId: staff.id });
                        if (now >= sDate && now <= eDate) activeLeaves.push({ name, type: leave.type, eDate, status: leave.status });
                        else if (sDate > now && (sDate.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000) upcomingLeaves.push({ name, type: leave.type, sDate, eDate, status: leave.status });
                    });
                }
                if (staff.declarations) {
                    staff.declarations.forEach((decl: any) => {
                        if (decl.status === 'Bekliyor') pendingDeclarations.push({ ...decl, name, staffId: staff.id });
                    });
                }
            });
        }

        return {
            skillAverages,
            weakestSkill,
            strongestSkill,
            weakestSkillsList,
            pendingLeaves,
            activeLeaves,
            upcomingLeaves,
            pendingDeclarations
        };
    }, [stats]);
}
