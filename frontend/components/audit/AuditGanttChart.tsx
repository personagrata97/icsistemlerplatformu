'use client';

import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/audit-utils';

interface AuditGanttChartProps {
    auditData: any;
}

const AuditGanttChart: React.FC<AuditGanttChartProps> = ({ auditData }) => {
    if (!auditData) return null;

    const plannedStart = auditData.plannedStartDate ? new Date(auditData.plannedStartDate) : new Date(auditData.startDate);
    const plannedEnd = auditData.plannedEndDate ? new Date(auditData.plannedEndDate) : new Date(auditData.endDate);
    
    // Fallbacks if not set
    if (!plannedStart || isNaN(plannedStart.getTime()) || !plannedEnd || isNaN(plannedEnd.getTime())) {
        return null; // Yeterli tarih verisi yok
    }

    const actualStart = auditData.actualStartDate ? new Date(auditData.actualStartDate) : null;
    const actualEnd = auditData.actualEndDate ? new Date(auditData.actualEndDate) : null;

    // Timeline Boundaries
    const minDate = Math.min(plannedStart.getTime(), actualStart ? actualStart.getTime() : plannedStart.getTime());
    const maxDate = Math.max(plannedEnd.getTime(), actualEnd ? actualEnd.getTime() : plannedEnd.getTime());
    
    const range = maxDate - minDate;
    // Add 10% padding to edges for better visual
    const paddedMin = minDate - (range * 0.1);
    const paddedMax = maxDate + (range * 0.1);
    const totalRange = paddedMax - paddedMin || 1; // avoid div by 0

    const getPosition = (date: Date) => {
        return ((date.getTime() - paddedMin) / totalRange) * 100;
    };

    const getWidth = (start: Date, end: Date) => {
        return ((end.getTime() - start.getTime()) / totalRange) * 100;
    };

    const isDelayed = actualEnd && actualEnd > plannedEnd;

    return (
        <div className="card shadow-sm mt-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
                <Calendar size={20} className="text-primary" /> Denetim Takvimi (Planlanan vs Gerçekleşen)
            </h3>
            
            <div className="relative pt-6 pb-12 px-4 border rounded-xl bg-slate-50 shadow-inner">
                {/* Timeline Axis Line */}
                <div className="absolute top-0 bottom-0 left-4 right-4 flex flex-col justify-end pb-8">
                    <div className="w-full h-px bg-slate-200"></div>
                </div>

                {/* Planned Bar */}
                <div className="relative h-10 mb-6 group cursor-default">
                    <div className="absolute left-0 w-32 text-sm font-semibold text-slate-500 py-2">Planlanan</div>
                    <div className="absolute h-full left-32 right-0 ml-4">
                        <div 
                            className="absolute h-full bg-slate-300 rounded-lg shadow-sm flex items-center px-4 transition-all hover:bg-slate-400"
                            style={{ 
                                left: `${getPosition(plannedStart)}%`, 
                                width: `${Math.max(2, getWidth(plannedStart, plannedEnd))}%` 
                            }}
                        >
                            <span className="text-xs font-semibold text-white truncate w-full flex justify-between">
                                <span>{formatDate(plannedStart.toISOString())}</span>
                                <span>{formatDate(plannedEnd.toISOString())}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actual Bar */}
                <div className="relative h-10 group cursor-default">
                    <div className="absolute left-0 w-32 text-sm font-semibold text-primary py-2">Gerçekleşen</div>
                    <div className="absolute h-full left-32 right-0 ml-4">
                        {actualStart ? (
                            <div 
                                className={`absolute h-full rounded-lg shadow-md flex items-center px-4 transition-all border-b-4 ${isDelayed ? 'bg-orange-500 border-orange-700 hover:bg-orange-600' : 'bg-primary border-primary-dark hover:bg-primary/90'}`}
                                style={{ 
                                    left: `${getPosition(actualStart)}%`, 
                                    width: `${Math.max(2, getWidth(actualStart, actualEnd || new Date()))}%` 
                                }}
                            >
                                <span className="text-xs font-bold text-white truncate w-full flex justify-between items-center z-10">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(actualStart.toISOString())}</span>
                                    {actualEnd ? (
                                        <span className="flex items-center gap-1"><CheckCircle size={12}/> {formatDate(actualEnd.toISOString())}</span>
                                    ) : (
                                        <span className="flex items-center gap-1 opacity-80 italic animate-pulse">Devam Ediyor...</span>
                                    )}
                                </span>
                            </div>
                        ) : (
                            <div className="absolute h-full left-0 right-0 flex items-center px-4 text-xs text-slate-400 italic">
                                Henüz başlamadı
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Delay Warning */}
                {isDelayed && (
                    <div className="absolute bottom-2 left-32 right-4 text-center mt-4">
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                            ⚠️ Planlanan bitiş tarihi aşıldı
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditGanttChart;
