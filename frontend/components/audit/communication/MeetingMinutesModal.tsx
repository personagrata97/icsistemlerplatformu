'use client';

import React, { useState } from 'react';
import { Users, Presentation, Clock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { useToast } from '@/components/Toast';

interface MeetingMinutesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    auditDetails: any;
    initialData?: any;
}

export default function MeetingMinutesModal({ isOpen, onClose, onSubmit, auditDetails, initialData }: MeetingMinutesModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: initialData?.type || 'OPENING',
        title: initialData?.title || 'Açılış Toplantısı',
        meetingDate: initialData?.meetingDate ? new Date(initialData.meetingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        location: initialData?.location || '',
        attendees: initialData?.attendees || '',
        agenda: initialData?.agenda || '',
        minutes: initialData?.minutes || '',
        status: initialData?.status || 'Gerçekleşti'
    });

    React.useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                type: initialData.type || 'OPENING',
                title: initialData.title || 'Açılış Toplantısı',
                meetingDate: initialData.meetingDate ? new Date(initialData.meetingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                location: initialData.location || '',
                attendees: initialData.attendees || '',
                agenda: initialData.agenda || '',
                minutes: initialData.minutes || '',
                status: initialData.status || 'Gerçekleşti'
            });
        } else if (isOpen) {
            setFormData({
                type: 'OPENING',
                title: 'Açılış Toplantısı',
                meetingDate: new Date().toISOString().split('T')[0],
                location: '',
                attendees: '',
                agenda: '',
                minutes: '',
                status: 'Gerçekleşti'
            });
        }
    }, [isOpen, initialData]);

    const handleTypeChange = (type: string) => {
        let title = 'Ara Toplantı';
        if (type === 'OPENING') title = 'Açılış Toplantısı';
        if (type === 'CLOSING') title = 'Kapanış Toplantısı';
        setFormData({ ...formData, type, title });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.type === 'OPENING' && auditDetails?.status === 'Devam Ediyor') {
            const meetingTime = new Date(formData.meetingDate).getTime();
            if (meetingTime > Date.now() + 3600000) { // 1 hour buffer
                showToast('Saha çalışmasına ("Devam Ediyor") geçilmiş bir denetimde, ileri tarihli bir Açılış Toplantısı planlanamaz. Lütfen geçmiş veya bugünkü bir tarih giriniz.', 'error');
                return;
            }
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Saha Görevi Toplantısı / Tutanak"
            size="lg"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} isLoading={loading}>
                        Kaydet
                    </Button>
                </div>
            }
        >
            <form id="meetingMinutesForm" onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <CustomSelect
                            label="Toplantı Aşaması"
                            value={formData.type}
                            onChange={(val) => handleTypeChange(val as string)}
                            options={[
                                { value: 'OPENING', label: 'Açılış Toplantısı (Ön Görüşme)' },
                                { value: 'INTERIM', label: 'Denetim Sırası / Süreç Toplantısı' },
                                { value: 'CLOSING', label: 'Kapanış Toplantısı (Bulgu Mutabakatı)' }
                            ]}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tarih</label>
                        <input
                            type="datetime-local"
                            required
                            className="form-input"
                            value={formData.meetingDate}
                            onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label flex gap-2 items-center"><Users size={16} /> Katılımcılar (Özet)</label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder="Alp Yılmaz (Müfettiş), Kerem (Birim Müdürü)..."
                            value={formData.attendees}
                            onChange={e => setFormData({ ...formData, attendees: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label flex gap-2 items-center"><Clock size={16} /> Konum / Platform</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Genel Müdürlük Toplantı Salonu / Teams"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Toplantı Gündemi</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: Bulgularda tespit edilen istisnai durumların yönetime sorulması..."
                        value={formData.agenda}
                        onChange={e => setFormData({ ...formData, agenda: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label font-semibold">Toplantı Tutanakları / Alınan Kararlar</label>
                    <textarea
                        required
                        className="form-textarea min-h-[150px] font-sans text-sm leading-relaxed"
                        placeholder="Yönetim tespit edilen bulguları kabul etmiştir. Gecikme faizi hesaplamalarındaki sistemsel hatalar düzeltilecektir..."
                        value={formData.minutes}
                        onChange={e => setFormData({ ...formData, minutes: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <CustomSelect
                        label="Kayıt Durumu"
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val as string })}
                        options={[
                            { value: 'Planlandı', label: 'Planlandı (İleri Tarihli)' },
                            { value: 'Gerçekleşti', label: 'Gerçekleşti (Tutanak Kaydedildi)' }
                        ]}
                    />
                </div>

            </form>
        </Modal>
    );
}
