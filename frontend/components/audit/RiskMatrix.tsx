'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface RiskItem {
    id: string;
    name: string;
    riskLevel: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';
    category: string;
    openFindings: number;
}

interface RiskMatrixProps {
    items: RiskItem[];
    onItemClick?: (item: RiskItem) => void;
}

const CATEGORIES = ['Operasyonel', 'BT / Siber Güvenlik', 'Kredi / Finansal', 'Uyum / Mevzuat', 'Stratejik / İtibar'];
const LEVELS = ['Kritik', 'Yüksek', 'Orta', 'Düşük'];

const LEVEL_COLORS: Record<string, string> = {
    'Kritik': 'bg-[#7f1d1d] shadow-red-200',
    'Yüksek': 'bg-[#dc2626] shadow-orange-200',
    'Orta': 'bg-[#f97316] shadow-yellow-200',
    'Düşük': 'bg-[#facc15] shadow-emerald-200',
};

const LEVEL_TEXT_COLORS: Record<string, string> = {
    'Kritik': 'text-[#7f1d1d]',
    'Yüksek': 'text-[#dc2626]',
    'Orta': 'text-[#f97316]',
    'Düşük': 'text-[#854d0e]',
};

const LEVEL_BG_LIGHT: Record<string, string> = {
    'Kritik': 'bg-red-50',
    'Yüksek': 'bg-orange-50',
    'Orta': 'bg-yellow-50',
    'Düşük': 'bg-[#facc15]/10',
};

export default function RiskMatrix({ items, onItemClick }: RiskMatrixProps) {
    const matrixData = useMemo(() => {
        const data: Record<string, Record<string, RiskItem[]>> = {};

        LEVELS.forEach(level => {
            data[level] = {};
            CATEGORIES.forEach(cat => {
                data[level][cat] = items.filter(item => item.riskLevel === level && item.category === cat);
            });
        });

        return data;
    }, [items]);

    return (
        <div className="w-full h-full flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="text-primary w-6 h-6" />
                        Kurumsal Risk Isı Haritası (Heat Matrix)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Birimlerin risk seviyesi ve kategori bazlı dağılımı.</p>
                </div>
                <div className="flex gap-4">
                    {LEVELS.map(level => (
                        <div key={level} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full ${LEVEL_COLORS[level]}`}></div>
                            <span className="text-xs font-semibold text-gray-600">{level}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[600px] overflow-auto border border-gray-100 rounded-2xl bg-white/50 backdrop-blur-md p-1">
                <table className="w-full h-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-24 p-4 border-b border-r border-gray-200 bg-gray-50/50"></th>
                            {CATEGORIES.map(cat => (
                                <th key={cat} className="p-4 border-b border-gray-100 bg-gray-50/30 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">
                                    {cat}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {LEVELS.map(level => (
                            <tr key={level}>
                                <td className="p-4 border-r border-gray-100 bg-gray-50/30 text-xs font-bold text-gray-700 text-center">
                                    <div className={`px-2 py-1 rounded-md ${LEVEL_BG_LIGHT[level]} ${LEVEL_TEXT_COLORS[level]} border border-${level === 'Kritik' ? 'red' : level === 'Yüksek' ? 'orange' : level === 'Orta' ? 'yellow' : 'emerald'}-200`}>
                                        {level}
                                    </div>
                                </td>
                                {CATEGORIES.map(cat => {
                                    const cellItems = matrixData[level][cat];
                                    const count = cellItems.length;

                                    return (
                                        <td key={cat} className="p-2 border border-gray-100 relative group min-w-[140px] transition-colors hover:bg-white/80">
                                            <div className="flex flex-wrap gap-2 justify-center content-start h-full p-2">
                                                {count > 0 ? (
                                                    cellItems.map(item => (
                                                        <motion.button
                                                            key={item.id}
                                                            whileHover={{ scale: 1.05, y: -2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => onItemClick?.(item)}
                                                            className={`
                                                                relative px-3 py-1.5 rounded-lg text-[11px] font-bold 
                                                                shadow-sm border border-white/40
                                                                ${LEVEL_COLORS[level]} text-white
                                                                flex items-center gap-1.5 transition-all
                                                            `}
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                                                            {item.name}
                                                            {item.openFindings > 0 && (
                                                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-gray-900 border border-gray-100 flex items-center justify-center text-[9px] shadow-sm">
                                                                    {item.openFindings}
                                                                </span>
                                                            )}
                                                        </motion.button>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity absolute inset-0 text-gray-400">
                                                        <CheckCircle2 size={24} />
                                                        <span className="text-[10px] mt-1 font-bold">TEMİZ</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Info size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Risk Matrisi Hakkında</h4>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Yukarıdaki matris, kurumun anlık risk fotoğrafını gösterir. Canlı veriyle senkronize çalışır ve risk ağırlıkları otomatik olarak hesaplanır.
                    </p>
                </div>
            </div>
        </div>
    );
}
