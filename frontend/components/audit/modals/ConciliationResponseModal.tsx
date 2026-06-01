import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Calendar, User, FileText, Target, Info, Check, X, Plus, Trash2, ClipboardCheck, Paperclip } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import Switch from '@/components/ui/Switch';
import Tooltip from '@/components/ui/Tooltip';
import ActionList, { ActionItem } from '../ActionList';
import { FileUpload } from '@/components/ui/FileUpload'; // Import FileUpload component

// Simple ID generator to avoid external dependencies
const generateId = () => Math.random().toString(36).substr(2, 9);

interface ConciliationItem {
    id: string;
    findingId: string;
    findingTitle: string;
    department: string;
    manager: string;
    status: 'Bekliyor' | 'Mutabık' | 'Red' | 'Kısmen Mutabık';
    responseDate?: string;
    response?: string;
    dueDate: string;
}

interface ConciliationResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem: ConciliationItem | null;
    onSubmit: (e: React.FormEvent, data: { status: string; response: string; rootCause?: string; actionPlan?: string; actions?: ActionItem[]; isAgreed: boolean; disagreementReason?: string; evidenceFile?: File }) => Promise<void>;
}

export default function ConciliationResponseModal({ isOpen, onClose, selectedItem, onSubmit }: ConciliationResponseModalProps) {
    const [isAgreed, setIsAgreed] = useState<boolean | null>(null);
    const [disagreementReason, setDisagreementReason] = useState('');
    const [response, setResponse] = useState(''); // Management Response (if agreed)
    const [rootCause, setRootCause] = useState('');
    const [actions, setActions] = useState<ActionItem[]>([]);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen && selectedItem) {
            setIsAgreed(null);
            setDisagreementReason('');
            setResponse('');
            setRootCause('');
            setActions([]);
            setEvidenceFile(null);
        }
    }, [isOpen, selectedItem]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEvidenceFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setEvidenceFile(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let status = 'Mutabık';
        let finalResponse = response;

        if (isAgreed === false) {
            status = 'Red';
            finalResponse = disagreementReason;
        }

        // Construct stringified Action Plan for backward compatibility if needed, 
        // but we prefer sending the structured actions.
        const actionPlanString = actions.map(a => `- ${a.action} (Sorumlu: ${a.responsible}, Vade: ${a.dueDate})`).join('\n');

        onSubmit(e, {
            status,
            response: finalResponse,
            rootCause: isAgreed ? rootCause : undefined,
            actionPlan: isAgreed ? actionPlanString : undefined,
            actions: isAgreed ? actions : [],
            isAgreed: isAgreed === true,
            disagreementReason: isAgreed === false ? disagreementReason : undefined,
            evidenceFile: (isAgreed !== null && evidenceFile) ? evidenceFile : undefined
        });
    };

    if (!isOpen || !selectedItem) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Bulgu Yanıtla: ${selectedItem.findingTitle || selectedItem.findingId}`}
            size="2xl"
            footer={
                <div className="flex justify-end w-full">
                    <Button
                        type="submit"
                        form="responseForm"
                        disabled={isAgreed === null}
                        variant="primary"
                        className="shadow-lg shadow-primary/20 min-w-[140px]"
                    >
                        Yanıtı Gönder
                    </Button>
                </div>
            }
        >
            <form id="responseForm" onSubmit={handleSubmit} className="space-y-6">

                {/* Info Header */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-0.5">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 mb-1">Bulgu Detayı</h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            <span className="font-semibold">{selectedItem.findingId}</span> - {selectedItem.department} ({selectedItem.manager})
                        </p>
                    </div>
                </div>

                {/* Agreement Switch Section */}
                <div className="bg-gray-50 p-2 rounded-3xl border border-gray-200">
                    <div className="bg-white p-6 rounded-[22px] shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row items-center justify-between border-b pb-4 mb-2 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <Target size={16} className="text-primary" />
                                </div>
                                <h3 className="font-bold text-gray-700">Mutabakat Durumu</h3>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 shadow-sm transition-colors hover:border-primary/20 group cursor-pointer">
                                <div className="flex flex-col items-end mr-2" onClick={() => setIsAgreed(false)}>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isAgreed === false ? 'text-red-500' : 'text-gray-400'}`}>Mutabık Değiliz</span>
                                </div>

                                <Switch
                                    checked={isAgreed === true}
                                    onChange={(checked) => setIsAgreed(checked)}
                                    activeColor="bg-[#009c45]"
                                />

                                <div className="flex flex-col items-start ml-2" onClick={() => setIsAgreed(true)}>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isAgreed === true ? 'text-[#009c45]' : 'text-gray-400'}`}>Mutabıkız</span>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Fields based on Agreement */}

                        {/* CASE: DISAGREE */}
                        {isAgreed === false && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <label className="form-label text-red-700 font-bold flex items-center gap-2">
                                    <X size={16} /> Bulguya Katılmama Gerekçesi
                                </label>
                                <textarea
                                    className="form-input bg-red-50/20 focus:ring-red-500/10 focus:border-red-400 border-red-100"
                                    rows={4}
                                    placeholder="Neden mutabık olmadığınızı ve dayanaklarınızı detaylıca açıklayınız..."
                                    value={disagreementReason}
                                    onChange={e => setDisagreementReason(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                        )}

                        {/* CASE: AGREE */}
                        {isAgreed === true && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
                                {/* Root Cause */}
                                <div className="space-y-2">
                                    <label className="form-label flex items-center gap-2">
                                        <AlertCircle size={14} className="text-amber-500" /> Kök Neden Analizi
                                    </label>
                                    <textarea
                                        className="form-input min-h-[80px]"
                                        placeholder="Bu bulgunun temel sebebi nedir?"
                                        value={rootCause}
                                        onChange={e => setRootCause(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Management Response */}
                                <div className="space-y-2">
                                    <label className="form-label text-green-700 font-bold flex items-center gap-2">
                                        <Check size={16} /> Birim/Yönetim Yanıtı
                                    </label>
                                    <textarea
                                        className="form-input bg-green-50/20 focus:ring-green-500/10 focus:border-green-400 border-green-100"
                                        rows={3}
                                        placeholder="Genel yönetim yanıtı ve açıklamalarınız..."
                                        value={response}
                                        onChange={e => setResponse(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                {/* Dynamic Action List */}
                                <ActionList
                                    actions={actions}
                                    onChange={setActions}
                                />
                            </div>
                        )}

                        {/* Evidence Upload - Available for ALL statuses if not null */}
                        {isAgreed !== null && (
                            <div className="pt-4 border-t border-gray-100">
                                <FileUpload
                                    label="Kanıt / Destekleyici Doküman"
                                    description="Bulguya cevabınızı destekleyen dokümanları buraya yükleyebilirsiniz"
                                    onFileSelect={(files) => {
                                        if (files && files[0]) setEvidenceFile(files[0]);
                                        else setEvidenceFile(null);
                                    }}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                    maxSizeMB={20}
                                    multiple={false}
                                />
                            </div>
                        )}

                        {isAgreed === null && (
                            <div className="py-12 text-center text-gray-400 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <ClipboardCheck size={24} className="opacity-30" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em]">Lütfen Mutabakat Durumu Seçiniz</p>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
