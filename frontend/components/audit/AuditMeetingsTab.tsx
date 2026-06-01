'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, MapPin, FileText, ChevronDown, Trash2 } from 'lucide-react';
import { auditApi } from '@/lib/audit-api';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import PageToolbar from '@/components/ui/PageToolbar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import ActionMenu from '@/components/ui/ActionMenu';
import { Edit2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function AuditMeetingsTab({ auditId }: { auditId: string }) {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [form, setForm] = useState({
        type: 'OPENING',
        title: '',
        meetingDate: '',
        location: '',
        agenda: '',
        minutes: '',
        attendees: '',
        status: 'Planlandı'
    });

    const loadMeetings = async () => {
        setLoading(true);
        try {
            const res = await auditApi.getAuditMeetings(auditId);
            setMeetings(res || []);
        } catch (e) {
            console.error('Toplantılar yüklenemedi', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMeetings();
    }, [auditId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMeeting) {
                await auditApi.updateAuditMeeting(auditId, editingMeeting.id, form);
            } else {
                await auditApi.createAuditMeeting(auditId, form);
            }
            setIsModalOpen(false);
            loadMeetings();
        } catch (e) {
            console.error('Kaydetme hatası', e);
        }
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            try {
                await auditApi.deleteAuditMeeting(auditId, deleteConfirm);
                loadMeetings();
            } catch (e) {
                console.error('Silme hatası', e);
            } finally {
                setDeleteConfirm(null);
            }
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm(id);
    };

    const openEdit = (meeting: any) => {
        setEditingMeeting(meeting);
        setForm({
            type: meeting.type || 'OPENING',
            title: meeting.title || '',
            meetingDate: meeting.meetingDate ? meeting.meetingDate.split('T')[0] : '',
            location: meeting.location || '',
            agenda: meeting.agenda || '',
            minutes: meeting.minutes || '',
            attendees: meeting.attendees || '',
            status: meeting.status || 'Planlandı'
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingMeeting(null);
        setForm({
            type: 'OPENING',
            title: '',
            meetingDate: '',
            location: '',
            agenda: '',
            minutes: '',
            attendees: '',
            status: 'Planlandı'
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            key: 'type', header: 'Tür', sortable: true, render: (row: any) => {
                const val = row.type;
                const map: any = { 'OPENING': 'Açılış', 'CLOSING': 'Kapanış', 'INTERIM': 'Ara Toplantı' };
                return <span className="font-semibold text-gray-700">{map[val] || val}</span>;
            }
        },
        { key: 'title', header: 'Başlık', sortable: true },
        { key: 'meetingDate', header: 'Tarih', sortable: true },
        { key: 'location', header: 'Lokasyon / Link', sortable: true },
        { key: 'status', header: 'Durum', sortable: true, render: (row: any) => <StatusBadge value={row.status} /> },
        {
            key: 'actions', header: 'İşlemler', width: '80px',
            render: (_: any, row: any) => (
                <ActionMenu
                    items={[
                        { label: 'Düzenle', icon: Edit2, onClick: () => openEdit(row) },
                        { label: 'Sil', icon: Trash2, onClick: () => handleDelete(row.id), variant: 'danger' }
                    ]}
                />
            )
        }
    ];

    return (
        <div className="card !p-0 shadow-sm">
            <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3 bg-gray-50/50 rounded-t-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Users size={20} className="text-primary" /> Toplantılar
                </h3>
                <Button size="sm" onClick={openCreate} className="gap-2">
                    <Plus size={16} /> Yeni Toplantı
                </Button>
            </div>
            
            <div className="bg-white rounded-b-lg overflow-hidden">
                <DataTable
                    columns={columns}
                    data={meetings}
                    loading={loading}
                    rowKey="id"
                    className="border-none shadow-none rounded-none"
                    hoverable={true}
                    striped={true}
                />
            </div>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Toplantıyı Sil"
                message="Bu toplantıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="İptal"
                type="danger"
            />


            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMeeting ? "Toplantıyı Düzenle" : "Yeni Toplantı Planla"}
                size="md"
            >
                <form onSubmit={handleSave} className="space-y-6 flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Toplantı Türü <span className="text-red-500">*</span></label>
                            <CustomSelect
                                options={[
                                    { value: 'OPENING', label: 'Açılış Toplantısı' },
                                    { value: 'INTERIM', label: 'Ara Toplantı' },
                                    { value: 'CLOSING', label: 'Kapanış Toplantısı' }
                                ]}
                                value={form.type}
                                onChange={(val) => setForm({ ...form, type: val as string })}
                                placeholder="Tür Seçin"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Durum</label>
                            <CustomSelect
                                options={[
                                    { value: 'Planlandı', label: 'Planlandı' },
                                    { value: 'Gerçekleşti', label: 'Gerçekleşti' },
                                    { value: 'İptal Edildi', label: 'İptal Edildi' }
                                ]}
                                value={form.status}
                                onChange={(val) => setForm({ ...form, status: val as string })}
                                placeholder="Durum"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Başlık <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:border-primary focus:ring-1 focus:ring-primary"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Zaruri Katılımlı Açılış Toplantısı vb."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Tarih</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={16} /></span>
                                <input
                                    type="date"
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 pl-9 focus:border-primary focus:ring-1 focus:ring-primary"
                                    value={form.meetingDate}
                                    onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1">Lokasyon / Link</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={16} /></span>
                                <input
                                    type="text"
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 pl-9 focus:border-primary focus:ring-1 focus:ring-primary"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    placeholder="Teams Linki / Kat X"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Katılımcılar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400"><Users size={16} /></span>
                            <textarea
                                rows={2}
                                className="w-full text-sm border border-gray-300 rounded-lg p-2 pl-9 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                                value={form.attendees}
                                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                                placeholder="Örn: Ali Yılmaz, Ayşe Kaya"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Gündem / Notlar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400"><FileText size={16} /></span>
                            <textarea
                                rows={3}
                                className="w-full text-sm border border-gray-300 rounded-lg p-2 pl-9 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                                value={form.agenda}
                                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                                placeholder="Gündem maddeleri ve toplantı notları..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button type="submit" variant="primary">Kaydet</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
