'use client';

import React from 'react';
import { FileText, Eye, Download, FileType, PenTool, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';

interface AuditReportSectionProps {
    status: string;
    auditData: any;
    onGeneratePDF: () => void;
    onGenerateWord: () => void;
    onShowUploadFinalModal: () => void;
}

const AuditReportSection: React.FC<AuditReportSectionProps> = ({
    status,
    auditData,
    onGeneratePDF,
    onGenerateWord,
    onShowUploadFinalModal
}) => {
    const reportableStatuses = ['Tamamlandı', 'Raporlanıyor', 'CAE Onayı Bekliyor', 'Onaylandı'];
    if (!reportableStatuses.includes(status)) return null;

    return (
        <div className="card !p-0 shadow-sm">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <FileText size={20} className="text-primary" /> Denetim Raporu
                </h3>
            </div>
            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* PDF Report */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText size={18} className="text-red-500" />
                            <span className="font-semibold text-sm text-gray-800">PDF Rapor</span>
                        </div>
                        <div className="flex gap-2">
                            <Tooltip content="Raporu önizle">
                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary hover:bg-primary/5" onClick={onGeneratePDF}>
                                    <Eye size={16} /> İncele
                                </Button>
                            </Tooltip>
                            <Tooltip content="Raporu indir">
                                <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-primary hover:bg-primary/5" onClick={onGeneratePDF}>
                                    <Download size={14} /> İndir
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Word Report */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <FileType size={18} className="text-blue-500" />
                            <span className="font-semibold text-sm text-gray-800">Word Rapor</span>
                        </div>
                        <div className="flex gap-2">
                            <Tooltip content="Word formatında rapor oluştur ve indir">
                                <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-primary hover:bg-primary/5" onClick={onGenerateWord}>
                                    <Download size={14} /> Oluştur & İndir
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Signed Report */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <PenTool size={18} className="text-gray-500" />
                            <span className="font-semibold text-sm text-gray-800">İmzalı Rapor</span>
                        </div>
                        {auditData.finalReport ? (
                            <>
                                <p className="text-xs text-gray-500 mb-2 truncate">
                                    {(() => {
                                        try {
                                            return typeof auditData.finalReport === 'string'
                                                ? JSON.parse(auditData.finalReport).fileName
                                                : auditData.finalReport.fileName;
                                        } catch (e) {
                                            return typeof auditData.finalReport === 'string' ? auditData.finalReport : 'Dosya';
                                        }
                                    })()}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="flex-1" leftIcon={<Eye size={16} />}>
                                        İncele
                                    </Button>
                                    <Button variant="secondary" size="sm" className="flex-1" leftIcon={<Download size={14} />}>
                                        İndir
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500 mb-2">Henüz yüklenmedi</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={onShowUploadFinalModal}
                                    leftIcon={<Upload size={14} />}
                                >
                                    Yükle
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditReportSection;
