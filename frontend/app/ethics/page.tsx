'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ETHICS_CATEGORIES, formatDate, formatDateTime } from '@/lib/audit-utils';
import {
    Send, AlertTriangle, Shield, CheckCircle,
    Search, MessageSquare, History, Lock, UserCheck, Copy, Check, ArrowLeft, Info, X,
    ChevronDown, Paperclip
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { usePathname } from 'next/navigation';
import { BackButton } from '@/components/ui/BackButton';

import { auditApi } from '@/lib/audit-api';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import { FileUpload } from '@/components/ui/FileUpload';
import { EthicsPageHeader } from '@/components/audit/ethics/EthicsPageHeader';
import { EthicsActionCard } from '@/components/audit/ethics/EthicsActionCard';
import CustomSelect from '@/components/ui/CustomSelect';
import Tooltip from '@/components/ui/Tooltip';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { EvidenceList, decodeFilename } from '@/components/audit/ethics/EvidenceList';

type PortalMode = 'landing' | 'submit' | 'query' | 'result';

const AnonymousModal = ({ isOpen, onConfirm, onCancel }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            hideCloseButton
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                        <AlertTriangle size={20} />
                    </div>
                    <span>Anonim Bildirim</span>
                </div>
            }
            footer={
                <div className="flex items-center justify-end gap-4 w-full">
                    <Button
                        onClick={onCancel}
                        variant="secondary"
                    >
                        Vazgeç
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant="primary"
                    >
                        Onayla ve Devam Et
                    </Button>
                </div>
            }
        >
            <div className="p-2 font-poppins">
                <h4 className="text-slate-900 font-black mb-3 text-lg">Gizlilik ve İletişim Güvencesi</h4>
                <p className="text-slate-600 leading-relaxed font-medium text-sm">
                    Normal bildirimlerde kimlik bilgileriniz sadece Teftiş Kurulu'nun bu süreci yürütmekle görevlendirilmiş üye(ler)i ile paylaşılır; şirket içindeki diğer tüm birimlerin ve çalışanların bu bilgilere erişimi kesinlikle bulunmamaktadır. Anonim bildirimlerde ise kimliğinizi Teftiş Kurulu üyeleri dahil hiç kimse göremez. Size verilecek <strong className="text-slate-900 font-black">Takip Kodu</strong>, bildiriminizin durumunu takip etmenizi ve süreci inceleyen müfettişle anonim bir şekilde iletişim kurabilmenizi sağlar.
                </p>
            </div>
        </Modal>
    );
};

export default function PublicEthicsPortalPage() {
    const { showToast } = useToast();
    const pathname = usePathname();
    const showBackButton = pathname?.includes('/audit');

    const [mode, setMode] = useState<PortalMode>('landing');
    const [trackingResult, setTrackingResult] = useState<string | null>(null);
    const [queryCode, setQueryCode] = useState('');
    const [reportDetails, setReportDetails] = useState<any>(null);
    const [chatFile, setChatFile] = useState<FileList | null>(null);
    const [formFiles, setFormFiles] = useState<FileList | null>(null);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState('');
    const [isAnonModalOpen, setIsAnonModalOpen] = useState(false);
    const [formUploadKey, setFormUploadKey] = useState(0);
    const [chatUploadKey, setChatUploadKey] = useState(0);
    const [rightTab, setRightTab] = useState<string>('timeline');

    const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setChatFile(e.target.files);
        }
    };

    const handleRemoveChatFile = (index: number) => {
        if (!chatFile) return;
        const dt = new DataTransfer();
        for (let i = 0; i < chatFile.length; i++) {
            if (i !== index) {
                dt.items.add(chatFile[i]);
            }
        }
        setChatFile(dt.files.length > 0 ? dt.files : null);
    };

    const { register, handleSubmit, watch, control, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            type: '',
            priority: 'Orta',
            description: '',
            anonymous: false,
            name: '',
            email: '',
            phone: ''
        }
    });

    const isAnonymous = watch('anonymous');

    const toggleAnonymous = (checked: boolean) => {
        if (checked) {
            setIsAnonModalOpen(true);
        } else {
            reset({ ...watch(), anonymous: false });
        }
    };

    const confirmAnonymous = () => {
        reset({ ...watch(), anonymous: true });
        setIsAnonModalOpen(false);
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        showToast('Takip kodu kopyalandı', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                name: data.anonymous ? undefined : data.name,
                email: data.anonymous ? undefined : data.email,
                phone: data.anonymous ? undefined : data.phone,
                source: showBackButton ? 'Internal Portal' : 'Public Web'
            };

            const res = await auditApi.createEthicsReport(payload);
            const trackingCode = res?.trackingCode || 'KOD-HATA';
            setTrackingResult(trackingCode);

            // Sequentially upload selected formFiles
            if (formFiles && formFiles.length > 0) {
                showToast('Kanıt dosyaları yükleniyor...', 'info');
                for (let i = 0; i < formFiles.length; i++) {
                    try {
                        await auditApi.uploadEthicsEvidence(trackingCode, formFiles[i]);
                    } catch (err) {
                        console.error('Evidence file upload failed', err);
                        showToast(`${formFiles[i].name} yüklenemedi.`, 'warning');
                    }
                }
            }

            reset(); // Formu sıfırla
            setFormFiles(null);
            setFormUploadKey(prev => prev + 1);
        } catch (error: any) {
            showToast(`Bildirim iletilemedi: ${error.message}`, 'error');
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() && (!chatFile || chatFile.length === 0)) return;
        try {
            if (message.trim()) {
                await auditApi.addReporterMessage(reportDetails.trackingCode, message);
            }
            if (chatFile && chatFile.length > 0) {
                showToast('Ekler yükleniyor...', 'info');
                for (let i = 0; i < chatFile.length; i++) {
                    await auditApi.uploadEthicsEvidence(reportDetails.trackingCode, chatFile[i]);
                }
            }
            showToast('Mesaj ve ekler başarıyla iletildi', 'success');
            setMessage('');
            setChatFile(null);
            setChatUploadKey(prev => prev + 1);
            const updated = await auditApi.getEthicsReportByCode(reportDetails.trackingCode);
            setReportDetails(updated);
        } catch (error) {
            showToast('Mesaj gönderilemedi', 'error');
        }
    };

    const returnToLanding = () => {
        setMode('landing');
        setTrackingResult(null);
        setReportDetails(null);
        setQueryCode('');
        setChatFile(null);
        setFormFiles(null);
        setFormUploadKey(prev => prev + 1);
        setChatUploadKey(prev => prev + 1);
        reset();
    };

    const startNewReport = () => {
        setTrackingResult(null);
        setMode('submit');
        setChatFile(null);
        setFormFiles(null);
        setFormUploadKey(prev => prev + 1);
        setChatUploadKey(prev => prev + 1);
        reset();
    };

    const handleQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await auditApi.getEthicsReportByCode(queryCode);
            if (res) {
                setReportDetails(res);
                setMode('result');
            } else {
                showToast('Geçersiz takip kodu.', 'error');
            }
        } catch (error: any) {
            showToast('Sorgulama hatası.', 'error');
        }
    };

    if (mode === 'landing') {
        return (
            <div className="max-w-5xl mx-auto py-12 px-6 font-poppins relative">
                {showBackButton && (
                    <div className="absolute top-6 left-6 z-10">
                        <BackButton href="/audit/ethics" />
                    </div>
                )}
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex p-5 bg-primary/10 text-primary rounded-3xl shadow-sm mb-2 mt-4">
                        <Shield size={56} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Teftiş Kurulu Etik İhbar Hattı</h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
                        Kurumun etik değerlerine uyum sağlamak, usulsüzlükleri önlemek ve kurumsal ilkeleri korumak adına oluşturulmuş bildirim kanalıdır. Buradan bildirim yapabilir veya mevcut bildiriminizin durumunu takip edebilirsiniz.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    <EthicsActionCard
                        title="Bildirim Gönder"
                        description="Usulsüzlük, etik ihlal veya şüpheli durumları bildirin."
                        icon={Send}
                        buttonText="Bildirim Yap"
                        buttonIcon={Send}
                        onClick={() => setMode('submit')}
                        variant="green"
                    />
                    <EthicsActionCard
                        title="Bildirim Sorgula"
                        description="Daha önce yapmış olduğunuz bildirimin sürecini takip edin."
                        icon={Search}
                        buttonText="Süreci Takip Et"
                        buttonIcon={Search}
                        onClick={() => setMode('query')}
                        variant="blue"
                    />
                </div>
            </div>
        );
    }

    if (mode === 'submit') {
        if (trackingResult) {
            return (
                <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center justify-center font-poppins text-center">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-xl w-full p-12 border-t-8 border-t-primary">
                        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle size={48} /></div>
                        <h2 className="text-4xl font-black text-slate-900 mb-4">Bildiriminiz Alındı</h2>
                        <p className="text-slate-500 text-lg mb-10 font-medium font-poppins">Bildiriminiz başarıyla kaydedildi. Süreci takip etmek için aşağıdaki kodu not alınız.</p>
                        <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 mb-10 group relative">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Takip Kodunuz</p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-4xl font-mono font-black text-primary tracking-wider py-2">{trackingResult}</div>
                                <Tooltip content="Kodu Kopyala">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleCopyCode(trackingResult)}
                                        className="!p-3 border-slate-200 text-slate-400 hover:text-primary transition-all active:scale-95"
                                    >
                                        {copied ? <Check size={20} className="text-primary" /> : <Copy size={20} />}
                                    </Button>
                                </Tooltip>
                            </div>
                            <div className="mt-6 flex flex-col gap-2 text-red-500 font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-100 text-left">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} /> Lütfen bu kodu kaybetmeyeceğiniz bir yere not ediniz.
                                </div>
                                <p className="text-[11px] leading-tight text-red-600/80">
                                    Anonim bildirimlerde müfettişler ile iletişim kurabilmek ve bildiriminizi takip edebilmek için bu kod **tek anahtarınızdır**. Kodun kaybolması durumunda bildiriminize tekrar erişemezsiniz.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <Button onClick={startNewReport} className="w-full !py-4 !rounded-2xl shadow-xl text-lg active:scale-[0.98]">Yeni Bildirim Yap</Button>
                            <Button onClick={returnToLanding} variant="secondary" className="w-full !py-4 !rounded-2xl text-lg active:scale-[0.98]">Ana Ekrana Dön</Button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-50 font-poppins pb-20">
                <div className="max-w-5xl mx-auto px-6 pt-6">
                    <EthicsPageHeader
                        title="YENİ BİLDİRİM"
                        onBack={returnToLanding}
                        variant="green"
                    />
                </div>

                <div className="max-w-3xl mx-auto px-6 mt-4">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8">
                            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Etik Bildirim Formu</h2>
                            <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">Lütfen aşağıdaki alanları eksiksiz doldurunuz.</p>

                            <div className="mb-8 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Bildirim Tipi</label>
                                <SegmentedTabs
                                    tabs={[
                                        { id: 'anonim', label: 'Anonim Bildirim (Kimlik Gizli)', icon: Lock },
                                        { id: 'isimli', label: 'İsimli Bildirim', icon: UserCheck }
                                    ]}
                                    activeTab={isAnonymous ? 'anonim' : 'isimli'}
                                    onChange={(id) => toggleAnonymous(id === 'anonim')}
                                    className="w-full grid grid-cols-2 p-1.5 bg-slate-100 rounded-xl"
                                />
                            </div>

                            <AnonymousModal
                                isOpen={isAnonModalOpen}
                                onConfirm={confirmAnonymous}
                                onCancel={() => setIsAnonModalOpen(false)}
                            />

                            <div className="space-y-10">
                                <AnimatePresence>
                                    {!isAnonymous && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden border-b border-slate-100 pb-10 space-y-8"
                                        >
                                            <h4 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight text-lg underline decoration-primary decoration-4 underline-offset-8 font-poppins">İletişim Bilgileri</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-poppins">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Ad Soyad *</label>
                                                    <input {...register('name', { required: !isAnonymous })} className="form-input font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">E-posta *</label>
                                                    <input {...register('email', { required: !isAnonymous })} type="email" className="form-input font-bold" />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Telefon Numarası</label>
                                                    <input {...register('phone')} placeholder="05XX XXX XX XX" className="form-input font-bold" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3 font-poppins">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Bildirim Kategorisi *</label>
                                        <Controller
                                            name="type"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <CustomSelect
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={ETHICS_CATEGORIES}
                                                    placeholder="Seçiniz..."
                                                    error={!!errors.type}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-3 font-poppins">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Öncelik Durumu</label>
                                        <Controller
                                            name="priority"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomSelect
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={[
                                                        { value: 'Düşük', label: 'Düşük' },
                                                        { value: 'Orta', label: 'Orta' },
                                                        { value: 'Yüksek', label: 'Yüksek' },
                                                        { value: 'Kritik', label: 'Kritik' }
                                                    ]}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 font-poppins">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Detaylı Açıklama *</label>
                                    <textarea
                                        {...register('description', { required: true, minLength: 50 })}
                                        className="form-textarea min-h-[180px] font-bold !p-6 !rounded-2xl"
                                        placeholder="Lütfen olay yerini, zamanını, varsa şahitleri ve olayı detaylıca anlatınız..."
                                    />
                                    <div className="flex justify-between px-2 font-poppins text-slate-400">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">En az 50 karakter girmelisiniz</span>
                                        {errors.description && <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Gerekli karakter sayısına ulaşılmadı</span>}
                                    </div>
                                </div>

                                <div className="space-y-3 font-poppins">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Belge ve Kanıt Ekleme</label>
                                    <FileUpload
                                        key={formUploadKey}
                                        onFileSelect={setFormFiles}
                                        description="Varsa ilgili dosyaları buraya sürükleyin."
                                    />
                                </div>

                                <div className="pt-8 font-poppins">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        isLoading={isSubmitting}
                                        variant="danger"
                                        className="w-full font-bold text-sm"
                                        size="lg"
                                        rightIcon={!isSubmitting && <Send size={20} />}
                                    >
                                        {isSubmitting ? 'Gönderiliyor...' : 'Etik İhbarı Gönder'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (mode === 'query') {
        return (
            <div className="min-h-screen bg-slate-50 font-poppins pb-20 text-center relative">
                {showBackButton && (
                    <div className="absolute top-6 left-6 z-10">
                        <BackButton href="/audit/ethics" />
                    </div>
                )}
                <div className="max-w-4xl mx-auto px-6 pt-8">
                    <EthicsPageHeader
                        title="DURUM SORGULA"
                        onBack={returnToLanding}
                        variant="blue"
                    />
                </div>
                <div className="max-w-xl mx-auto px-6 mt-12">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border-0 p-12">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-sm transition-transform hover:rotate-3"><Search size={56} /></div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Bildirim Sorgula</h1>
                        <p className="text-slate-500 font-bold text-lg mb-12 opacity-80 decoration-blue-500 decoration-2 underline-offset-4 font-poppins">Takip kodunuz ile güncel durumu kontrol edin.</p>

                        <form onSubmit={handleQuery} className="space-y-10">
                            <div className="space-y-3 text-left font-poppins">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pl-4">Takip Kodunuz</label>
                                <input
                                    type="text"
                                    className="w-full h-14 text-center text-lg font-mono font-bold tracking-widest rounded-xl border-2 border-slate-200 focus:border-blue-600 outline-none uppercase text-slate-800 shadow-sm bg-slate-50 transition-all placeholder:text-slate-300"
                                    placeholder="XXXX-XXXX-XXXX"
                                    value={queryCode}
                                    onChange={(e: any) => setQueryCode(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full !bg-blue-600 hover:!bg-blue-700 shadow-blue-500/20"
                                size="lg"
                            >
                                SORGULA
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'result' && reportDetails) {
        // Robust Date Parser helper to prevent '-' formatting errors in the timeline
        const getValidDate = (dateVal: any) => {
            if (!dateVal || dateVal === 'undefined' || dateVal === 'null') return new Date();
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? new Date() : d;
        };

        const reporterDisplayName = reportDetails.anonymous 
            ? 'ANONİM' 
            : (reportDetails.name || 'BİLDİRİMCİ');

        // Construct sorted chronological process timeline dynamically
        const timelineItems = [
            { 
                id: 'start', 
                action: 'ETHICS_SUBMITTED', 
                date: getValidDate(reportDetails.createdAt || reportDetails.created_at), 
                user: reporterDisplayName, 
                details: 'Bildirim başarıyla kaydedildi.' 
            }
        ];

        if (reportDetails.messages && reportDetails.messages.length > 0) {
            reportDetails.messages.forEach((msg: any, idx: number) => {
                timelineItems.push({
                    id: `msg-${idx}`,
                    action: 'MESSAGE_SENT',
                    date: getValidDate(msg.createdAt || msg.created_at),
                    user: msg.isAdmin ? 'MÜFETTİŞ' : reporterDisplayName,
                    details: msg.content.length > 60 ? `${msg.content.substring(0, 60)}...` : msg.content
                });
            });
        }

        if (reportDetails.evidences && reportDetails.evidences.length > 0) {
            reportDetails.evidences.forEach((ev: any, idx: number) => {
                timelineItems.push({
                    id: `ev-${idx}`,
                    action: 'EVIDENCE_UPLOADED',
                    date: getValidDate(ev.createdAt || ev.created_at || reportDetails.createdAt || reportDetails.created_at),
                    user: ev.uploadedBy ? 'MÜFETTİŞ' : reporterDisplayName,
                    details: `Kanıt yüklendi: ${decodeFilename(ev.fileName)}`
                });
            });
        }

        if (reportDetails.status && reportDetails.status !== 'Yeni') {
            timelineItems.push({
                id: 'status-change',
                action: 'STATUS_CHANGE',
                date: getValidDate(reportDetails.updatedAt || reportDetails.updated_at),
                user: 'SİSTEM',
                details: `Durum güncellendi: ${reportDetails.status}`
            });
        }



        // Sort newest first (latest events at the top)
        timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Map Turkish category name
        const mappedCategory = ETHICS_CATEGORIES.find(c => c.value === reportDetails.type)?.label || reportDetails.type;

        return (
            <div className="min-h-screen max-h-screen bg-slate-50 font-poppins flex flex-col overflow-hidden pb-4">
                <div className="max-w-7xl w-full mx-auto px-6 pt-6 shrink-0">
                    <EthicsPageHeader
                        title="BİLDİRİM TAKİBİ"
                        onBack={returnToLanding}
                        variant="green"
                        rightContent={
                            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                                <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Takip No:</span>
                                    <span className="text-primary font-mono font-black text-lg">{reportDetails.trackingCode}</span>
                                </div>
                                <div className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                    {reportDetails.status || 'YENİ'}
                                </div>
                            </div>
                        }
                    />
                </div>

                <div className="max-w-7xl w-full mx-auto px-6 mt-4 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 font-poppins mb-4 overflow-hidden">
                    {/* Left Column - Secure Chat History */}
                    <div className="lg:col-span-7 h-full flex flex-col min-h-0 overflow-hidden">
                        <div className="bg-white rounded-3xl flex flex-col h-full shadow-lg border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                        <MessageSquare size={20} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-800 text-base">İletişim ve Mesaj Geçmişi</h2>
                                        <p className="text-[10px] text-slate-400 font-medium">Müfettiş ile karşılıklı soru, cevap ve bilgi paylaşımı</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 space-y-2.5 bg-slate-50/20 overflow-y-auto min-h-0 font-poppins custom-scrollbar">
                                <div className="bg-slate-100 py-3 px-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/50 max-w-[85%] font-poppins animate-in fade-in slide-in-from-top-1 duration-300">
                                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                        Bildiriminiz başarıyla alındı. Müfettişimiz konuyu incelemektedir. Bu hat üzerinden {reportDetails.anonymous ? 'anonim olarak' : 'bizimle'} iletişim kurabilir, sürece ek bilgi ve kanıt dosyaları ekleyebilirsiniz.
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">SİSTEM MESAJI</span>
                                    </div>
                                </div>

                                {reportDetails.messages?.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}>
                                        <div className={`${msg.isAdmin ? 'bg-white rounded-tl-none border-slate-200/60 text-slate-800 shadow-sm' : 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10'} py-2.5 px-3.5 rounded-2xl border max-w-[85%]`}>
                                            <p className="text-xs leading-relaxed font-semibold">{msg.content}</p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className={`h-1 w-3 ${msg.isAdmin ? 'bg-slate-400' : 'bg-white/80'} rounded-full`} />
                                                <span className={`text-[9px] font-black tracking-wider uppercase ${msg.isAdmin ? 'text-slate-400' : 'text-white/70'}`}>
                                                    {msg.isAdmin ? 'MÜFETTİŞ' : 'SİZ'} • {formatDateTime(msg.createdAt || msg.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-2">
                                {/* Compact Attachment badges list */}
                                {chatFile && chatFile.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pb-2 animate-in slide-in-from-bottom-1 duration-200 max-h-16 overflow-y-auto custom-scrollbar">
                                        {Array.from(chatFile).map((file, i) => (
                                            <div key={i} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 transition-all shadow-sm">
                                                <Paperclip size={10} className="text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <span className="text-[8px] text-slate-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveChatFile(i)}
                                                    className="text-slate-400 hover:text-red-500 rounded p-0.5 ml-1 transition-all"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 rounded-2xl p-2 transition-all shadow-inner">
                                    {/* Attachment button */}
                                    <div className="shrink-0">
                                        <input
                                            type="file"
                                            id="chat-file-input"
                                            className="hidden"
                                            multiple
                                            onChange={handleChatFileSelect}
                                        />
                                        <Tooltip content="Kanıt / Belge Ekle">
                                            <label
                                                htmlFor="chat-file-input"
                                                className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-all flex items-center justify-center shadow-sm active:scale-95"
                                            >
                                                <Paperclip size={16} />
                                            </label>
                                        </Tooltip>
                                    </div>

                                    {/* Textarea */}
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-slate-400 text-xs font-semibold text-slate-700 py-2.5 px-2 resize-none max-h-20 min-h-[40px] custom-scrollbar leading-relaxed"
                                            rows={1}
                                            placeholder="Eklemek istediğiniz bir bilgi var mı..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Send button */}
                                    <div className="shrink-0">
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={isSubmitting || (!message.trim() && (!chatFile || chatFile.length === 0))}
                                            className="!h-10 !w-10 !p-0 shadow-lg shadow-primary/10 shrink-0 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center bg-primary hover:bg-primary/95 text-white active:scale-95"
                                        >
                                            <Send size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Unified Tabs (Süreç Akışı & Bildirim Detayı) */}
                    <div className="lg:col-span-5 h-full flex flex-col min-h-0 overflow-hidden">
                        <div className="bg-white rounded-3xl flex flex-col h-full shadow-lg border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-center bg-slate-50/50 shrink-0">
                                <SegmentedTabs
                                    tabs={[
                                        { id: 'timeline', label: 'Süreç Akışı', icon: History },
                                        { id: 'details', label: 'Bildirim Detayı', icon: Info }
                                    ]}
                                    activeTab={rightTab}
                                    onChange={(id) => setRightTab(id)}
                                    className="w-full justify-center"
                                />
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto min-h-0 font-poppins custom-scrollbar bg-white">
                                {rightTab === 'timeline' ? (
                                    <div className="animate-in fade-in duration-300">
                                        <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                                            <History size={14} className="text-primary" /> Süreç Geçmişi
                                        </h3>
                                        <ProcessTimeline items={timelineItems} />
                                    </div>
                                ) : (
                                    <div className="space-y-5 font-poppins animate-in fade-in duration-300">
                                        <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
                                            <Info size={14} className="text-primary" /> Bildirim Bilgileri
                                        </h3>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Kategori</span>
                                                <span className="text-slate-800 font-bold text-sm block" title={mappedCategory}>{mappedCategory}</span>
                                            </div>
                                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Tarih / Saat</span>
                                                <span className="text-slate-800 font-bold text-xs block">{formatDateTime(reportDetails.createdAt || reportDetails.created_at)}</span>
                                            </div>
                                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Öncelik</span>
                                                <span className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                        (reportDetails.priority === 'Kritik' || reportDetails.priority === 'kritik') ? 'bg-[#7f1d1d] shadow-sm shadow-red-950/40 animate-pulse' :
                                                        (reportDetails.priority === 'Yüksek' || reportDetails.priority === 'yüksek') ? 'bg-red-600' :
                                                        (reportDetails.priority === 'Orta' || reportDetails.priority === 'orta') ? 'bg-orange-500' :
                                                        (reportDetails.priority === 'Düşük' || reportDetails.priority === 'düşük') ? 'bg-yellow-500 shadow-sm shadow-yellow-500/20' : 'bg-slate-400'
                                                    }`} />
                                                    <span>{reportDetails.priority || 'Belirsiz'}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1.5 pl-1">Bildirim Açıklaması</span>
                                            <div className="text-slate-600 leading-relaxed text-xs bg-slate-50/70 p-5 rounded-2xl border border-slate-100 font-medium min-h-[140px] max-h-72 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                                                {reportDetails.description}
                                            </div>
                                        </div>

                                        <EvidenceList evidences={reportDetails.evidences || reportDetails.files} trackingCode={reportDetails.trackingCode} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

