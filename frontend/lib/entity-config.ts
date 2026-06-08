import { 
    Briefcase, FolderOpen, CheckCircle, AlertTriangle, 
    FileText, Activity, Users, LayoutDashboard,
    Calendar, PieChart, TrendingUp, Clock, BarChart3
} from 'lucide-react';

export type EntityType = 
    | 'AUDIT' 
    | 'FINDING' 
    | 'ACTION' 
    | 'RISK' 
    | 'HEATMAP'
    | 'TREND'
    | 'WORKPAPER' 
    | 'REPORT' 
    | 'ACTIVITY' 
    | 'DASHBOARD'
    | 'USER'
    | 'METRIC';

export type EntityColor = 'primary' | 'emerald' | 'indigo' | 'orange' | 'purple' | 'blue' | 'red' | 'slate' | 'cyan';

export interface EntityConfig {
    icon: any;
    color: EntityColor;
    label: string;
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
    AUDIT: { icon: Briefcase, color: 'emerald', label: 'Denetim' },
    FINDING: { icon: FolderOpen, color: 'indigo', label: 'Bulgu' },
    ACTION: { icon: Clock, color: 'blue', label: 'Aksiyon' },
    RISK: { icon: AlertTriangle, color: 'red', label: 'Risk Derecesi' },
    HEATMAP: { icon: Activity, color: 'orange', label: 'Risk Haritası' },
    TREND: { icon: TrendingUp, color: 'cyan', label: 'Trend Analizi' },
    WORKPAPER: { icon: FileText, color: 'slate', label: 'Çalışma Kağıdı' },
    REPORT: { icon: PieChart, color: 'purple', label: 'Rapor' },
    ACTIVITY: { icon: Activity, color: 'slate', label: 'Aktivite' },
    DASHBOARD: { icon: LayoutDashboard, color: 'primary', label: 'Panel' },
    USER: { icon: Users, color: 'cyan', label: 'Kullanıcı' },
    METRIC: { icon: BarChart3, color: 'primary', label: 'Metrik' }
};

export const getColorClasses = (color: EntityColor) => {
    const map: Record<EntityColor, { bg: string, text: string, border: string }> = {
        primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
        slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' }
    };
    return map[color];
};
