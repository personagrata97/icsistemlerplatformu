import React, { useEffect, useState } from 'react';
import { MessageSquare, FileText, Target, AlertCircle, Calendar, User, Search, CheckCircle, XCircle, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { auditApi, Finding } from '@/lib/audit-api';
import LoadingState from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Button from '@/components/ui/Button';

interface ConciliationItem {
    id: string;
    findingId: string;
    findingTitle: string;
    department: string;
    manager: string;
    status: 'Bekliyor' | 'Mutabık' | 'Red' | 'Kısmen Mutabık' | 'Birim Yanıtladı' | 'Açık' | string;
    responseDate?: string;
    response?: string;
    dueDate: string;
}

interface ConciliationViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem: ConciliationItem | null;
    onOpenResponse?: () => void;
}

export default function ConciliationViewModal({ isOpen, onClose, selectedItem, onOpenResponse }: ConciliationViewModalProps) {
    const { user, hasRole } = useAuth();
    const { showToast } = useToast();
    const isAuditor = hasRole('ADMIN') || hasRole('AUDIT_ADMIN') || hasRole('AUDIT_SUPERVISOR') || hasRole('AUDIT_INSPECTOR');

    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [details, setDetails] = useState<Finding | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    // Reply State
    const [replyText, setReplyText] = useState('');
    const [replyStatus, setReplyStatus] = useState<'Açık' | 'Kapalı'>('Açık'); // Açık (Red), Kapalı (Onay)

    const formatTrDate = (dateStr?: string) => {
        if (!dateStr) return '';
        // "2026-02-20" -> "20.02.2026"
        return dateStr.replace(/^(\d{4})-(\d{2})-(\d{2})(.*)$/, '$3.$2.$1$4');
    };

    useEffect(() => {
        if (isOpen && selectedItem) {
            loadDetails();
            loadMessages();
        } else {
            setDetails(null);
            setMessages([]);
            setReplyText('');
        }
    }, [isOpen, selectedItem]);

    const loadMessages = async () => {
        if (!selectedItem) return;
        setMessagesLoading(true);
        try {
            const data = await auditApi.getConciliationMessages(selectedItem.findingId);
            setMessages(data || []);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const loadDetails = async () => {
        if (!selectedItem) return;
        setLoading(true);
        try {
            const data = await auditApi.getFinding(selectedItem.findingId);
            setDetails(data);
        } catch (error) {
            console.error('Failed to load finding details:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitReply = async (actionStatus: 'Rejected' | 'Approved') => {
        if (!selectedItem) return;
        setLoading(true);
        try {
            await auditApi.addConciliationMessage(selectedItem.findingId, {
                status: actionStatus,
                message: replyText,
                senderRole: 'Auditor'
            });

            // Update finding status and agreement flags based on the auditor's decision
            if (actionStatus === 'Approved') {
                await auditApi.updateFinding(selectedItem.findingId, { 
                    status: 'Aksiyon Bekleniyor', 
                    isAgreed: true 
                });
            } else {
                await auditApi.updateFinding(selectedItem.findingId, { 
                    status: 'Açık', 
                    isAgreed: false 
                });
            }

            showToast(`Yanıt başarıyla ${actionStatus === 'Approved' ? 'onaylandı' : 'geri gönderildi'}.`, 'success');
            setReplyText('');
            await loadMessages();
            onClose(); // Optional: close the modal, and let page reload. It's better to close.
        } catch (error) {
            console.error('Failed to submit reply:', error);
            showToast('Yanıt gönderilirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !selectedItem) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${selectedItem.findingId} - Mutabakat Detayı`}
            size="xl"
        >
            {loading ? (
                <div className="py-12">
                    <LoadingState message="Detaylar yükleniyor..." />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <StatusBadge type="status" value={selectedItem.status} />
                            <span className="text-xs text-gray-500 font-mono">{selectedItem.findingId}</span>
                        </div>

                        <h4 className="font-bold text-lg text-gray-900 leading-snug">{selectedItem.findingTitle}</h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="space-y-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Departman</span>
                                <p className="font-medium text-gray-800">{selectedItem.department}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Yönetici</span>
                                <p className="font-medium text-gray-800">{selectedItem.manager}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Aksiyon Tarihi</span>
                                <p className="font-medium text-gray-800">{formatTrDate(selectedItem.dueDate)}</p>
                            </div>
                            {selectedItem.responseDate && (
                                <div className="space-y-1">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Yanıt Tarihi</span>
                                    <p className="font-medium text-gray-800">{formatTrDate(selectedItem.responseDate)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thread Content */}
                    <div className="space-y-6 border-t border-gray-100 pt-6">

                        {/* Messages Thread */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {messagesLoading ? (
                                <LoadingState message="Mesaj geçmişi yükleniyor..." />
                            ) : messages.length > 0 ? (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${msg.senderRole === 'Auditor' ? 'bg-blue-50/50 border-blue-100 ml-8' : 'bg-gray-50 border-gray-200 mr-8'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-700">{msg.senderName} ({msg.senderRole})</span>
                                            <span className="text-[10px] text-gray-500">{new Date(msg.created_at).toLocaleString('tr-TR')}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message}</p>

                                        {/* Display specific fields for Auditee response */}
                                        {msg.actionPlan && (
                                            <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200 text-xs">
                                                <span className="font-bold text-green-700 block mb-2">Aksiyon Planı:</span>
                                                <ul className="space-y-2">
                                                    {msg.actionPlan.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => {
                                                        const match = line.match(/^- (.*?) \(Sorumlu: (.*?), Vade: (.*?)\)$/);
                                                        if (match) {
                                                            return (
                                                                <li key={i} className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col gap-1">
                                                                    <span className="font-medium text-slate-800">{match[1]}</span>
                                                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold mt-0.5">
                                                                        <span className="flex items-center gap-1"><User size={10}/> {match[2]}</span>
                                                                        <span className="flex items-center gap-1"><Calendar size={10}/> {formatTrDate(match[3])}</span>
                                                                    </div>
                                                                </li>
                                                            );
                                                        }
                                                        return <li key={i} className="text-gray-700">{line}</li>;
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                        {msg.status === 'Rejected' && (
                                            <div className="mt-3 bg-red-50 p-2 border border-red-100 rounded-lg text-xs text-red-700 flex items-center gap-1 font-medium">
                                                <XCircle size={14} /> Birim/Kurum Yanıtı Yetersiz Bulundu
                                            </div>
                                        )}
                                        {msg.evidencePath && (
                                            <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                                                <FileText size={14} /> Ekli Kanıt (Sistemde)
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-gray-500 py-4 italic">Henüz iletişim geçmişi bulunmuyor.</div>
                            )}

                            {/* Fallback to legacy view if no messages but details exist */}
                            {messages.length === 0 && (selectedItem.response || details?.actionPlan) && (
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mr-8">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-700">{selectedItem.department} (İlk Yanıt)</span>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedItem.response}</p>
                                    {details?.actionPlan && (
                                        <div className="mt-3 bg-white p-3 rounded-lg border border-gray-200 text-xs">
                                            <span className="font-bold text-green-700 block mb-2">Aksiyon Planı:</span>
                                            <ul className="space-y-2">
                                                {details.actionPlan.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => {
                                                    const match = line.match(/^- (.*?) \(Sorumlu: (.*?), Vade: (.*?)\)$/);
                                                    if (match) {
                                                        return (
                                                            <li key={i} className="bg-slate-50 border border-slate-100 p-2 rounded flex flex-col gap-1">
                                                                <span className="font-medium text-slate-800">{match[1]}</span>
                                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold mt-0.5">
                                                                    <span className="flex items-center gap-1"><User size={10}/> {match[2]}</span>
                                                                    <span className="flex items-center gap-1"><Calendar size={10}/> {formatTrDate(match[3])}</span>
                                                                </div>
                                                            </li>
                                                        );
                                                    }
                                                    return <li key={i} className="text-gray-700">{line}</li>;
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Auditor Reply Form */}
                        {isAuditor && (selectedItem.status === 'Mutabık' || selectedItem.status === 'Kısmen Mutabık' || selectedItem.status === 'Birim Yanıtladı') && (
                            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-4">
                                <h5 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                    <Send size={16} /> Birim Yanıtını Değerlendir
                                </h5>
                                <textarea
                                    className="form-input resize-none"
                                    rows={3}
                                    placeholder="Yanıtı yeterli bulmadığınız durumlar için açıklama yazarak geri gönderebilirsiniz..."
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                />
                                <div className="flex justify-end gap-3">
                                    <Button
                                        onClick={() => submitReply('Rejected')}
                                        disabled={!replyText.trim() || loading}
                                        isLoading={loading && replyStatus === 'Açık'}
                                        variant="secondary"
                                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                                    >
                                        Yanıtı Yetersiz Bul (Geri Gönder)
                                    </Button>
                                    <Button
                                        onClick={() => submitReply('Approved')}
                                        disabled={loading}
                                        isLoading={loading && replyStatus === 'Kapalı'}
                                        variant="primary"
                                        className="bg-green-500 text-white hover:bg-green-600 border border-green-600 disabled:opacity-50"
                                    >
                                        Yanıtı Kabul Et (Mutabakat Sağlandı)
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Auditee Reply Button */}
                        {!isAuditor && selectedItem.status === 'Bekliyor' && onOpenResponse && (
                            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm space-y-4 text-center">
                                <h5 className="font-bold text-lg text-amber-900">
                                    Aksiyon veya Mutabakat Yanıtı Bekleniyor
                                </h5>
                                <p className="text-sm text-amber-700">
                                    Bu bulgu size tebliğ edilmiştir. Denetim ekibine yönetici seviyesinde bir mutabakat yanıtı ve kök neden analizi sunmanız gerekmektedir.
                                </p>
                                <div className="flex justify-center pt-2">
                                    <Button
                                        onClick={onOpenResponse}
                                        variant="primary"
                                        className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg px-8 py-2"
                                    >
                                        Yanıtla / Aksiyon Planı Ekle
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}
