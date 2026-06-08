'use client';
import { useState, useEffect, useRef } from 'react';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import {
    History, Search, Filter, ChevronDown, RefreshCw, User, Calendar,
    FileText, AlertCircle, CheckCircle, Clock, X, Download, ShieldCheck,
    Eye, ArrowRight, Activity, Database, ChevronLeft, ChevronRight
} from 'lucide-react';
import ActionMenu from '@/components/ui/ActionMenu';
import Tooltip from '@/components/ui/Tooltip';
import { auditApi } from '@/lib/audit-api';
import RefreshButton from '@/components/ui/RefreshButton';
import LoadingState from '@/components/ui/LoadingState';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { checkRole, ROLES } from '@/lib/auth-constants';
import DataTable from '@/components/ui/DataTable';
import PageToolbar from '@/components/ui/PageToolbar';
import CustomSelect from '@/components/ui/CustomSelect';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { useAuditTitle } from '@/context/AuditTitleContext';
import { StatCard, AccessDenied, DetailModal, TYPE_COLORS, TYPE_ICONS } from '@/components/audit/AuditLogComponents';
import { getStatusBadgeClass, formatDate, formatDateTime } from '@/lib/audit-utils';
import { clsx } from 'clsx';
import StatusBadge from '@/components/ui/StatusBadge';

export interface AuditLog {
    id: string;
    action: string;
    entity: string; // e.g., "Müşteri", "Sözleşme", "Bulgu"
    entityId: string;
    user: string; // User ID or Name
    date: string;
    details: string; // Summary info
    type: 'create' | 'update' | 'delete' | 'status' | 'login' | 'system';
    changeData?: { // Optional field for detailed changes
        before?: any;
        after?: any;
        diff?: Record<string, { old: any, new: any }>;
    };
    ipAddress?: string; // Enhanced logging
}

export default function AuditLogsPage() {
    const { setTitle, setSubtitle } = useAuditTitle();
    const { showToast } = useToast();
    const { hasRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string[]>([]);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [integrityResult, setIntegrityResult] = useState<{ valid: boolean; brokenAt?: string; totalChecked: number; skippedLegacy: number } | null>(null);
    const [integrityLoading, setIntegrityLoading] = useState(false);
    const [logFilterMode, setLogFilterMode] = useState<'all' | 'today' | 'critical'>('all');

    const isAdmin = checkRole(hasRole, ROLES.LOGS_ADMIN);

    useEffect(() => {
        setTitle('Denetim İzi');
        setSubtitle('Sistemdeki tüm kullanıcı işlemleri ve değişiklik kayıtları.');
        if (isAdmin) loadData();
        else setLoading(false);
    }, [isAdmin]);

    const loadData = async (showOverlay = true) => {
        if (showOverlay) setLoading(true);
        try {
            const data = await auditApi.getLogs?.() || [];
            const enrichedData = Array.isArray(data) ? data.map((l: any) => ({
                ...l,
                date: l.date || l.createdAt || l.created_at,
                type: l.type || (l.action.includes('Giriş') || l.action.includes('Çıkış') ? 'login' : l.action.includes('Sil') ? 'delete' : l.action.includes('Güncel') ? 'update' : 'create')
            })) : [];
            setLogs(enrichedData);
            if (!showOverlay) showToast('Denetim izleri güncellendi', 'success');
        } catch (error) {
            console.error('Logs error:', error);
            showToast('Denetim izleri yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return <AccessDenied />;

    const handleIntegrityCheck = async () => {
        setIntegrityLoading(true);
        try {
            const result = await auditApi.verifyLogIntegrity?.();
            if (result?.valid) {
                setIntegrityResult(result);
                showToast(`Log bütünlüğü doğrulandı: ${result.totalChecked} kayıt kontrol edildi.`, 'success');
            } else {
                // Zincir bozuksa otomatik onar
                showToast('Zincir tutarsızlığı tespit edildi, onarılıyor...', 'info');
                const repairResult = await auditApi.repairLogChain?.();
                
                // Onarımdan sonra tekrar doğrula
                const verifyAfterRepair = await auditApi.verifyLogIntegrity?.();
                setIntegrityResult(verifyAfterRepair);
                
                if (verifyAfterRepair?.valid) {
                    showToast(`Zincir onarıldı: ${repairResult?.repaired || 0} kayıt düzeltildi, ${verifyAfterRepair.totalChecked} kayıt doğrulandı.`, 'success');
                } else {
                    showToast('Zincir onarılamadı. Lütfen sistem yöneticinize başvurun.', 'error');
                }
            }
        } catch (error) {
            showToast('Bütünlük doğrulama hatası oluştu', 'error');
        } finally {
            setIntegrityLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            log.user?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            log.details?.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'));
        const matchesType = filterType.length === 0 || filterType.includes(log.type);
        
        let matchesMode = true;
        if (logFilterMode === 'today') {
            matchesMode = !!(log.date && new Date(log.date).toDateString() === new Date().toDateString());
        } else if (logFilterMode === 'critical') {
            matchesMode = log.type === 'delete' || log.action.includes('Yetki');
        }
        
        return matchesSearch && matchesType && matchesMode;
    });

    const todayCount = logs.filter(l => l.date && new Date(l.date).toDateString() === new Date().toDateString()).length;
    const criticalCount = logs.filter(l => l.type === 'delete' || l.action.includes('Yetki')).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 px-1 -mx-1 mb-2">
                <StatCard
                    title="Toplam Kayıt"
                    value={logs.length}
                    icon={Database}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    onClick={() => setLogFilterMode('all')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${logFilterMode === 'all' ? 'ring-2 ring-blue-500 scale-[1.02]' : ''}`}
                />
                <StatCard
                    title="Bugünkü İşlem"
                    value={todayCount}
                    icon={Clock}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    onClick={() => setLogFilterMode(prev => prev === 'today' ? 'all' : 'today')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${logFilterMode === 'today' ? 'ring-2 ring-emerald-500 scale-[1.02]' : ''}`}
                />
                <StatCard
                    title="Kritik İşlem"
                    value={criticalCount}
                    icon={AlertCircle}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    onClick={() => setLogFilterMode(prev => prev === 'critical' ? 'all' : 'critical')}
                    className={`transition-all hover:scale-[1.02] cursor-pointer ${logFilterMode === 'critical' ? 'ring-2 ring-amber-500 scale-[1.02]' : ''}`}
                />
                {/* Log Bütünlük Doğrulama */}
                <button 
                    onClick={handleIntegrityCheck}
                    disabled={integrityLoading}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                        integrityResult === null 
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:shadow-md' 
                            : integrityResult.valid 
                                ? 'bg-emerald-50 border-emerald-200' 
                                : 'bg-red-50 border-red-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            integrityResult === null 
                                ? 'bg-slate-100 text-slate-500' 
                                : integrityResult.valid 
                                    ? 'bg-emerald-100 text-emerald-600' 
                                    : 'bg-red-100 text-red-600'
                        }`}>
                            {integrityLoading 
                                ? <RefreshCw size={20} className="animate-spin" /> 
                                : integrityResult?.valid 
                                    ? <CheckCircle size={20} /> 
                                    : <ShieldCheck size={20} />}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Zincir Bütünlüğü</p>
                            <p className="text-sm font-bold text-gray-800">
                                {integrityLoading 
                                    ? 'Doğrulanıyor...' 
                                    : integrityResult === null 
                                        ? 'Doğrula' 
                                        : integrityResult.valid 
                                            ? `✓ ${integrityResult.totalChecked} kayıt sağlam` 
                                            : `✗ ID: ${integrityResult.brokenAt} bozuk`}
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="mb-6">
                <PageToolbar
                    searchPlaceholder="İşlem, kullanıcı veya detay ara..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onRefresh={() => loadData(false)}
                        showExportButton={true}
                        onExportClick={() => { auditApi.exportToExcel(filteredLogs, 'Denetim_Izleri'); showToast('Excel raporu indirildi', 'success'); }}
                        filters={
                            <FilterDropdown
                                activeCount={filterType.length}
                                onClear={() => { setFilterType([]); setSearchTerm(''); }}
                            >
                                <CustomSelect
                                    label="İşlem Tipi"
                                    value={filterType}
                                    onChange={(val) => setFilterType(val as string[])}
                                    placeholder="Tümü"
                                    isMulti
                                    options={[
                                        { value: 'create', label: 'Oluşturma' },
                                        { value: 'update', label: 'Güncelleme' },
                                        { value: 'delete', label: 'Silme' },
                                        { value: 'status', label: 'Durum Değişimi' },
                                        { value: 'login', label: 'Giriş/Çıkış' },
                                        { value: 'system', label: 'Sistem' }
                                    ]}
                                />
                            </FilterDropdown>
                        }
                />
            </div>

            <DataTable
                columns={[
                    {
                        key: 'date',
                        header: 'Zaman / Tarih',
                        type: 'datetime',
                        width: '180px',
                        align: 'center',
                        sortable: true
                    },
                    {
                        key: 'user',
                        header: 'Kullanıcı',
                        type: 'user',
                        sortable: true,
                        align: 'center'
                    },
                    {
                        key: 'action',
                        header: 'İşlem',
                        align: 'center',
                        sortable: true,
                        render: (log: any) => (
                            <span className={clsx(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                getStatusBadgeClass(log.action) !== 'bg-gray-100 text-gray-600' ? getStatusBadgeClass(log.action) : (TYPE_COLORS[log.type as keyof typeof TYPE_COLORS] || 'bg-slate-50 text-slate-500 border-slate-100')
                            )}>
                                {TYPE_ICONS[log.type as keyof typeof TYPE_ICONS] || <Activity size={14} />}
                                {({
                                    'ETHICS_QUERY': 'Bildirim Sorgulama',
                                    'ETHICS_SUBMITTED': 'Bildirim Gönderildi',
                                    'MESSAGE_SENT': 'Mesaj Gönderildi',
                                    'REPORT_VIEWED': 'Rapor Görüntülendi',
                                    'LOGIN_SUCCESS': 'Başarılı Giriş',
                                    'LOGIN_FAILED': 'Hatalı Giriş',
                                    'LOGOUT': 'Çıkış Yapıldı',
                                    'EVIDENCE_UPLOADED': 'Kanıt Yüklendi',
                                    'ASSIGNMENT': 'Görev Ataması',
                                } as any)[log.action] || String(log.action || '-')}
                            </span>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'İncele',
                        width: '140px',
                        align: 'center',
                        render: (log: any) => (
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon={<Eye size={14} className="text-primary" />}
                                    onClick={() => setSelectedLog(log)}
                                    className="font-semibold shadow-sm px-4 whitespace-nowrap"
                                >
                                    Detayı İncele
                                </Button>
                            </div>
                        )
                    }
                ]}
                data={filteredLogs}
                loading={loading}
                rowKey="id"
                paginated={true}
                itemsPerPage={10}
                className="shadow-sm border border-gray-100"
                searchTerm={searchTerm}
                onClearFilters={() => {
                    setSearchTerm('');
                    setFilterType([]);
                }}
            />

            {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}
