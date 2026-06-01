'use client';

import React from 'react';
import { Paperclip, ChevronDown, FileText, Eye, Download } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import ActionMenu from '@/components/ui/ActionMenu';

interface EvidenceFile {
    fileName?: string;
    name?: string;
    fileSize?: number;
    size?: string;
    fileUrl?: string;
    url?: string;
}

interface EvidenceListProps {
    evidences: EvidenceFile[];
    trackingCode?: string;
}

// Highly reliable decoder for Turkish/UTF-8 character encoding issues
export const decodeFilename = (str: string): string => {
    if (!str) return '';
    
    // First, let's try a direct UTF-8 byte conversion which handles almost all double-encoded cases
    try {
        const bytes = new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
        const decoded = new TextDecoder('utf-8').decode(bytes);
        // If it successfully decodes and contains Turkish characters, return it
        if (/[çÇğĞıİöÖşŞüÜ]/.test(decoded)) {
            return decoded;
        }
    } catch (e) {}

    // Fallback 1: Standard decodeURIComponent(escape(str))
    try {
        const decoded = decodeURIComponent(escape(str));
        if (/[çÇğĞıİöÖşŞüÜ]/.test(decoded)) {
            return decoded;
        }
    } catch (e) {}

    // Fallback 2: Manual character map for common broken UTF-8/Latin1 representations
    let temp = str;
    const replacements: Record<string, string> = {
        'Ã¼': 'ü', 'Ãœ': 'Ü',
        'Ä±': 'ı', 'Ä°': 'İ',
        'Ã¶': 'ö', 'Ã–': 'Ö',
        'Ã§': 'ç', 'Ã‡': 'Ç',
        'ÄŸ': 'ğ', 'Äž': 'Ğ',
        'ÅŸ': 'ş', 'Åž': 'Ş',
        'Å_': 'ş', 'Åz': 'Ş',
        'Ã': 'ı',
    };
    
    Object.entries(replacements).forEach(([bad, good]) => {
        temp = temp.replace(new RegExp(bad, 'g'), good);
    });
    
    return temp;
};

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidences, trackingCode }) => {
    if (!evidences || evidences.length === 0) return null;

    return (
        <div className="pt-2">
            <details className="group bg-slate-50/50 rounded-2xl border border-slate-100 open:bg-white text-xs overflow-hidden transition-all duration-300">
                <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none font-bold text-slate-700 hover:bg-slate-100/50">
                    <div className="flex items-center gap-2">
                        <Paperclip size={14} className="text-slate-400 font-bold shrink-0" />
                        <span>Kanıt Belgeleri ({evidences.length})</span>
                    </div>
                    <div className="transition-transform group-open:rotate-180 text-slate-400">
                        <ChevronDown size={14} />
                    </div>
                </summary>
                <div className="p-4 pt-4 border-t border-slate-100">
                    <ul className="space-y-3 pb-2">
                        {evidences.map((file, i) => {
                            const rawName = file.fileName || file.name || 'Bilinmeyen Dosya';
                            const name = decodeFilename(rawName);
                            const size = file.fileSize 
                                ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` 
                                : (file.size || '-');
                            
                            const filename = file.fileUrl ? file.fileUrl.replace(/\\/g, '/').split('/').pop() : '';
                            
                            // Build secure URL
                            let url = '#';
                            if (filename) {
                                url = `/api/v1/secure-files/ethics/${filename}`;
                                const queryParams: string[] = [];
                                
                                if (trackingCode) {
                                    queryParams.push(`trackingCode=${trackingCode}`);
                                }
                                
                                if (typeof window !== 'undefined') {
                                    const token = localStorage.getItem('token');
                                    if (token) {
                                        queryParams.push(`token=${token}`);
                                    }
                                }
                                
                                if (queryParams.length > 0) {
                                    url += `?${queryParams.join('&')}`;
                                }
                            }
 
                            const extension = (name.split('.').pop() || '').toLowerCase();
                            
                            // Select modern badge styling based on file extension
                            const getBadgeStyle = (ext: string) => {
                                switch (ext) {
                                    case 'pdf':
                                        return 'bg-red-50 text-red-600 border-red-100';
                                    case 'docx':
                                    case 'doc':
                                        return 'bg-blue-50 text-blue-600 border-blue-100';
                                    case 'xlsx':
                                    case 'xls':
                                        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                    case 'png':
                                    case 'jpg':
                                    case 'jpeg':
                                        return 'bg-purple-50 text-purple-600 border-purple-100';
                                    default:
                                        return 'bg-slate-50 text-slate-500 border-slate-100';
                                }
                            };
 
                            return (
                                <li key={i} className="flex items-center gap-2 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all hover:shadow-md">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase shrink-0 border ${getBadgeStyle(extension)}`}>
                                        {extension || 'FILE'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-xs text-slate-700 break-words">{name}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">{size}</p>
                                    </div>
                                    <div className="flex items-center pl-2 shrink-0">
                                        <ActionMenu
                                            variant="ghost"
                                            items={[
                                                {
                                                    label: 'Görüntüle',
                                                    icon: <Eye size={14} />,
                                                    onClick: () => window.open(url, '_blank')
                                                },
                                                {
                                                    label: 'İndir',
                                                    icon: <Download size={14} />,
                                                    onClick: () => {
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.download = name;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }
                                                }
                                            ]}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </details>
        </div>
    );
};

export default EvidenceList;
