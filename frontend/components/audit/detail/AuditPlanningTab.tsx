import React from 'react';
import { Target, Activity, ShieldAlert, Crosshair, Map, List } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';

interface AuditPlanningTabProps {
    auditData: any;
}

export default function AuditPlanningTab({ auditData }: AuditPlanningTabProps) {
    if (!auditData) return null;

    return (
        <div className="flex flex-col gap-6 p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Risk Seviyesi" 
                    value={<StatusBadge value={auditData.riskLevel || 'Belirtilmemiş'} type="risk" size="md" className="mt-1" />} 
                    icon={Activity} 
                    color="orange" 
                />
                <StatCard 
                    title="İlgili Birim / Departman" 
                    value={auditData.department || auditData.AuditableUnit?.name || 'Birim Seçilmedi'} 
                    icon={Map} 
                    color="indigo"
                    valueClassName="text-lg font-bold text-gray-800 tracking-tight line-clamp-1"
                />
                <StatCard 
                    title="Denetim Türü" 
                    value={<StatusBadge value={auditData.type || 'Süreç Denetimi'} type="plan-type" size="md" className="mt-1" />} 
                    icon={Target} 
                    color="blue" 
                />
            </div>

            <div className="card !p-0 border border-gray-100 shadow-sm">
                <div className="p-4 border-b bg-gray-50/50 rounded-t-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <Target size={20} className="text-primary" /> Denetim Hedefleri
                    </h3>
                </div>
                <div className="p-6">
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                        {auditData.objective || <span className="text-gray-400 italic">Lütfen denetim amaç ve hedeflerini belirtiniz.</span>}
                    </div>
                </div>
            </div>

            <div className="card !p-0 border border-gray-100 shadow-sm">
                <div className="p-4 border-b bg-gray-50/50 rounded-t-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                        <List size={20} className="text-primary" /> Denetim Kapsamı
                    </h3>
                </div>
                <div className="p-6">
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                        {auditData.scope || <span className="text-gray-400 italic">Denetim kapsamını ve sınırlarını tanımlayınız.</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card !p-0 border border-gray-100 shadow-sm">
                    <div className="p-4 border-b bg-gray-50/50 rounded-t-lg">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <Activity size={20} className="text-primary" /> Metodoloji
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                            {auditData.methodology || <span className="text-gray-400 italic">Denetim yöntemini belirtiniz (risk bazlı, süreç bazlı vb.)</span>}
                        </div>
                    </div>
                </div>
                <div className="card !p-0 border border-gray-100 shadow-sm">
                    <div className="p-4 border-b bg-gray-50/50 rounded-t-lg">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <ShieldAlert size={20} className="text-primary" /> Denetim Kriterleri
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                            {auditData.criteria || <span className="text-gray-400 italic">Referans aldığınız mevzuat ve standartları belirtiniz</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
