'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';
import { ShieldAlert, Send, Lock, UserCheck, AlertTriangle, FileText, Upload } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { TERMS } from '@/lib/terminology';

export default function EthicsSubmitPage() {
    const { showToast } = useToast();
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('SUISTIMAL');
    const [subject, setSubject] = useState('');
    const [details, setDetails] = useState('');
    const [attachment, setAttachment] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!subject.trim() || !details.trim()) {
            showToast('Konu ve ihbar detay alanı zorunludur.', 'warning');
            return;
        }
        setIsConfirmOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 600));
        setSubmitting(false);
        setIsConfirmOpen(false);
        setSubject('');
        setDetails('');
        showToast('Etik ihbarınız gizlilik ilkesi çerçevesinde Etik Kuruluna başarıyla iletilmiştir.', 'success');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-red-950 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Etik İhbar ve Bildirim Portalı</h2>
                    <p className="text-slate-300 text-xs mt-1">Kurum içi etik ihlalleri, suistimal ve mevzuat dışı uygulamaları güvenle bildirin.</p>
                </div>
                <div className="px-4 py-2 bg-red-900/60 rounded-xl text-xs font-semibold border border-red-700/50 flex items-center gap-2">
                    <Lock size={14} /> Güvenli & Şifreli
                </div>
            </div>

            <div className="card p-6 bg-white border border-gray-200 shadow-sm rounded-2xl space-y-6">
                <div>
                    <label className="form-label mb-2 block font-bold text-gray-900">1. Bildirim Tipi</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsAnonymous(true)}
                            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${isAnonymous ? 'bg-red-900 text-white border-red-900 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Lock size={16} /> Anonim Bildirim (Kimlik Gizli)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAnonymous(false)}
                            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${!isAnonymous ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <UserCheck size={16} /> İsimli Bildirim
                        </button>
                    </div>
                </div>

                {!isAnonymous && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <label className="form-label mb-1">Ad Soyad</label>
                            <input type="text" className="form-input text-xs" placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label mb-1">E-posta</label>
                            <input type="email" className="form-input text-xs" placeholder="eposta@emlakkatilim.com.tr" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label mb-1">Telefon</label>
                            <input type="text" className="form-input text-xs" placeholder="05xx xxx xx xx" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label mb-1">Kategori</label>
                        <CustomSelect
                            options={[
                                { value: 'SUISTIMAL', label: 'Suistimal / Zimmet / Usulsüzlük' },
                                { value: 'RUKVKK', label: 'KVKK / Veri Sızıntısı' },
                                { value: 'RIVET', label: 'Rüşvet / Hediye Politikası İhlali' },
                                { value: 'MOBBING', label: 'Psikolojik Taciz / Mobbing' },
                                { value: 'DIGER', label: 'Diğer Etik İhlal' }
                            ]}
                            value={category}
                            onChange={val => setCategory(val as string)}
                        />
                    </div>
                    <div>
                        <label className="form-label mb-1">İhbar Konusu</label>
                        <input type="text" className="form-input text-xs" placeholder="Kısaca ihbar konusunu belirtiniz" value={subject} onChange={e => setSubject(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className="form-label mb-1">İhbar ve Olay Detayı (Zorunlu)</label>
                    <textarea
                        className="form-input text-xs w-full"
                        rows={5}
                        placeholder="Olayın ne zaman, nerede ve kimler arasında gerçekleştiğini somut verilerle açıklayınız..."
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                    />
                </div>

                <div>
                    <label className="form-label mb-1">Ek Dosya / Kanıt (İsteğe Bağlı)</label>
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="secondary" leftIcon={<Upload size={14} />} onClick={() => setAttachment('ekran_goruntusu_belge.pdf')}>
                            Dosya Ekle
                        </Button>
                        {attachment && <span className="text-xs text-emerald-700 font-medium">✓ {attachment} eklendi</span>}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button variant="danger" leftIcon={<Send size={16} />} onClick={handleSubmit}>
                        Etik İhbarı Gönder
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmSubmit}
                title="Etik İhbarı Göndermeyi Onayla"
                message="Bildiriminiz şifreli olarak doğrudan Etik Kurulu Kurul Başkanına iletilecektir. Gönderimi onaylıyor musunuz?"
                confirmText="Evet, İhbarı Gönder"
                variant="danger"
                isLoading={submitting}
            />
        </div>
    );
}
