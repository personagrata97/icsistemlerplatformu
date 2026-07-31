import React from 'react';
import { FileText, FileSpreadsheet, FileIcon, X, Download } from 'lucide-react';

export interface FileChipProps {
    name: string;
    size?: number; // File size in bytes
    type?: string;
    onDownload?: () => void;
    onRemove?: () => void;
    className?: string;
}

export const FileChip: React.FC<FileChipProps> = ({ name, size, type, onDownload, onRemove, className = '' }) => {
    
    const getIcon = () => {
        const ext = name.split('.').pop()?.toLowerCase();
        if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
        if (['pdf'].includes(ext || '')) return <FileText className="w-4 h-4 text-rose-600" />;
        return <FileIcon className="w-4 h-4 text-slate-500" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition-colors group ${className}`}>
            {getIcon()}
            <div className="flex flex-col min-w-0 max-w-[200px]">
                <span className="text-sm font-medium text-slate-700 truncate" title={name}>{name}</span>
                {size !== undefined && (
                    <span className="text-[10px] text-slate-500">{formatSize(size)}</span>
                )}
            </div>
            
            {(onDownload || onRemove) && (
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-100">
                    {onDownload && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onDownload(); }} className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-50 transition-colors" title="İndir">
                            <Download size={14} />
                        </button>
                    )}
                    {onRemove && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors" title="Sil">
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileChip;
