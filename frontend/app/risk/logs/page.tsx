'use client';
import { useState, useEffect } from 'react';
import { RiskLogger, LogEntry } from '@/lib/risk-logger';
import { FileText, Download, Clock, User, Activity, AlertCircle, CheckCircle, Search, Filter, ChevronRight, X, Eye, RefreshCw, ArrowRight } from 'lucide-react';
import RefreshButton from '@/components/ui/RefreshButton';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';

import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/audit-utils';
import ActionMenu from '@/components/ui/ActionMenu';

export default function RiskLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = () => {
        setLoading(true);
        setLogs(RiskLogger.getLogs());
        setLoading(false);
    };

    const handleExport = () => {
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
                'Tarih': new Date(log.date).toLocaleString('tr-TR'),
                'İşlem': log.action,
                'Kullanıcı': log.user,
                'Açıklama': log.description,
                'Detaylar': log.details ? JSON.stringify(log.details) : ''
            })));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Risk Logları");
            XLSX.writeFile(workbook, `risk-loglari-${new Date().toISOString().split('T')[0]}.xlsx`);
        });
    };

    const getActionType = (action: string): "status" | "risk" => {
        if (action.includes('Hata')) return 'risk';
        return 'status';
    };

    const getActionValue = (action: string) => {
        if (action.includes('Hata')) return 'Kritik';
        if (action.includes('Başlat')) return 'Orta';
        if (action.includes('Giriş')) return 'Bilgi';
        return 'Yeni';
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto py-2 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">İşlem Geçmişi</h1>
                    <p className="text-slate-500 font-medium">Sistem üzerindeki tüm risk aktiviteleri ve denetim izleri.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Loglarda ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-sm"
                        />
                    </div>
                    
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                        leftIcon={<Download size={18} />}
                        className="!rounded-xl h-11"
                    >
                        Excel'e Aktar
                    </Button>
                    
                    <RefreshButton onClick={loadLogs} />
                </div>
            </div>

            <DataTable
                columns={[
                    {
                        key: 'date',
                        header: 'Tarih / Saat',
                        width: '200px',
                        align: 'center',
                        render: (log: any) => (
                            <div className="cell-date justify-center">
                                <Clock size={14} className="text-gray-400" />
                                {formatDate(log.date)}
                                <span className="ml-1 text-[10px] font-bold text-slate-400">
                                    {new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )
                    },
                    {
                        key: 'action',
                        header: 'İşlem Tipi',
                        width: '200px',
                        render: (log: any) => (
                            <div className="flex items-center gap-2">
                                <StatusBadge 
                                    type={getActionType(log.action)} 
                                    value={getActionValue(log.action)} 
                                />
                            </div>
                        )
                    },
                    {
                        key: 'description',
                        header: 'Açıklama',
                        render: (log: any) => (
                            <div className="line-clamp-1 text-slate-600 font-medium text-sm">
                                {log.description}
                            </div>
                        )
                    },
                    {
                        key: 'user',
                        header: 'Kullanıcı',
                        width: '180px',
                        align: 'center',
                        render: (log: any) => {
                            const userName = String(log.user || '');
                            return (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                        {userName.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">{userName}</span>
                                </div>
                            );
                        }
                    },
                    {
                        key: 'actions',
                        header: 'İşlemler',
                        width: '100px',
                        align: 'center',
                        render: (log: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <ActionMenu items={[{ label: 'Detay İncele', icon: Eye, onClick: () => setSelectedLog(log) }]} />
                            </div>
                        )
                    }
                ]}
                data={filteredLogs}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={10}
                itemUnit="log kaydı"
                emptyIcon={Activity}
                emptyTitle="Kayıt Bulunamadı"
                emptyDescription="Arama kriterlerinize uygun veya sistemde kayıtlı bir işlem hareketi bulunmuyor."
                className="shadow-sm border border-gray-100"
            />

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="İşlem Detayı"
                size="md"
                footer={
                    <div className="flex justify-end w-full">
                        <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                            Kapat
                        </Button>
                    </div>
                }
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <StatusBadge
                                type={getActionType(selectedLog.action)}
                                value={getActionValue(selectedLog.action)}
                            />
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{selectedLog.action}</h4>
                                <p className="text-gray-500 text-sm mt-1">{new Date(selectedLog.date).toLocaleString('tr-TR')}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Açıklama</h5>
                            <p className="text-gray-700 text-sm leading-relaxed">{selectedLog.description}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kullanıcı Bilgileri</h5>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                                    {selectedLog.user.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{selectedLog.user}</div>
                                    <div className="text-xs text-gray-500">Sistem Kullanıcısı</div>
                                </div>
                            </div>
                        </div>

                        {selectedLog.details && (
                            <div>
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Teknik Detaylar (JSON)</h5>
                                <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-inner">
                                    <pre className="text-xs text-green-400 font-medium whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

        </div>
    );
}

