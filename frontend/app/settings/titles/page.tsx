'use client';
import RequireRole from '@/components/auth/RequireRole';
import PageHeader from '@/components/ui/PageHeader';
import { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2, Shield, ArrowUp, ArrowDown, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import FormInput from '@/components/ui/FormInput';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import { organizationApi } from '@/lib/organization-api';

interface JobTitleItem {
    id: string;
    name: string;
    module: string;
    cadre: number;
    unitId?: string;
    isActive: boolean;
    unit?: { id: string; name: string };
}

const MODULE_OPTIONS = [
    { value: 'audit', label: 'Teftiş Kurulu (Audit)' },
    { value: 'control', label: 'İç Kontrol (Control)' },
    { value: 'risk', label: 'Risk Yönetimi (Risk)' },
    { value: 'sanction', label: 'Yaptırım & Uyum (Sanction)' },
    { value: 'genel', label: 'Genel Kurumsal Kadrolar' }
];

function JobTitlesPageContent() {
    const { showToast } = useToast();
    const [titles, setTitles] = useState<JobTitleItem[]>([]);
    const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        module: 'audit',
        cadre: '1',
        unitId: '',
        isActive: true
    });

    useEffect(() => {
        loadData();
    }, [selectedModule]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [titlesData, unitsData] = await Promise.all([
                organizationApi.getTitles(selectedModule === 'all' ? undefined : selectedModule),
                organizationApi.getUnits()
            ]);
            setTitles(titlesData || []);
            setUnits(unitsData || []);
        } catch (error) {
            showToast('Kadro ve unvan verileri yüklenemedi.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setEditingId(null);
        const currentTitles = selectedModule === 'all' ? titles : titles.filter(t => t.module === selectedModule);
        const nextCadre = currentTitles.length + 1;
        setFormData({
            name: '',
            module: selectedModule === 'all' ? 'audit' : selectedModule,
            cadre: String(nextCadre),
            unitId: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (title: JobTitleItem) => {
        setModalMode('edit');
        setEditingId(title.id);
        setFormData({
            name: title.name,
            module: title.module,
            cadre: String(title.cadre),
            unitId: title.unitId || '',
            isActive: title.isActive
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('Unvan adı boş bırakılamaz.', 'error');
            return;
        }

        try {
            const payload = {
                name: formData.name.trim(),
                module: formData.module,
                cadre: parseInt(formData.cadre) || 1,
                unitId: formData.unitId || undefined,
                isActive: formData.isActive
            };

            if (modalMode === 'create') {
                await organizationApi.createTitle(payload);
                showToast('Yeni unvan kadrosu oluşturuldu.', 'success');
            } else if (editingId) {
                await organizationApi.updateTitle(editingId, payload);
                showToast('Unvan kadrosu güncellendi.', 'success');
            }

            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            showToast(error.message || 'İşlem başarısız.', 'error');
        }
    };

    const handleToggleActive = async (title: JobTitleItem) => {
        try {
            await organizationApi.updateTitle(title.id, { isActive: !title.isActive });
            showToast(`Unvan durumu ${!title.isActive ? 'Aktif' : 'Pasif'} yapıldı.`, 'info');
            loadData();
        } catch {
            showToast('Durum güncellenemedi.', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await organizationApi.deleteTitle(deleteConfirm);
            showToast('Unvan pasifleştirildi/silindi.', 'success');
            loadData();
        } catch {
            showToast('İşlem başarısız.', 'error');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const filteredTitles = selectedModule === 'all'
        ? titles
        : titles.filter(t => t.module === selectedModule);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
            <PageHeader
                title="Kadro ve Unvan Yönetimi"
                subtitle="Modül bazlı kurumsal kademe listesi, unvan hiyerarşisi ve birim eşleştirmeleri"
            />

            {/* Action Bar & Module Filter */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setSelectedModule('all')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${selectedModule === 'all'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Tüm Modüller
                    </button>
                    {MODULE_OPTIONS.map(mod => (
                        <button
                            key={mod.value}
                            onClick={() => setSelectedModule(mod.value)}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${selectedModule === mod.value
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {mod.label}
                        </button>
                    ))}
                </div>

                <Button onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
                    Yeni Unvan / Kadro Ekle
                </Button>
            </div>

            {/* Content Table */}
            {isLoading ? (
                <LoadingState message="Kadro verileri yükleniyor..." />
            ) : filteredTitles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">Tanımlı Unvan Bulunamadı</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Bu filtreye uygun aktif veya pasif bir kadro unvanı bulunmamaktadır.</p>
                    <Button onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>Unvan Ekle</Button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Kademe</th>
                                <th className="px-6 py-4">Unvan Adı</th>
                                <th className="px-6 py-4">Modül</th>
                                <th className="px-6 py-4">İlgili Birim</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTitles.map((title) => {
                                const modObj = MODULE_OPTIONS.find(m => m.value === title.module);
                                return (
                                    <tr key={title.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                                            Seviye #{title.cadre}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {title.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700">
                                                {modObj ? modObj.label : title.module}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {title.unit?.name || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(title)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${title.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
                                            >
                                                {title.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {title.isActive ? 'Aktif Kadro' : 'Pasif Kadro'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(title)}
                                                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(title.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Pasifleştir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Add / Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'create' ? 'Yeni Kadro Unvanı Ekle' : 'Kadro Unvanı Düzenle'}
            >
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    <FormInput
                        label="Unvan Adı *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Örn: Kıdemli Başmüfettiş"
                        required
                    />

                    <CustomSelect
                        label="Modül *"
                        value={formData.module}
                        onChange={(val) => setFormData({ ...formData, module: val as string })}
                        options={MODULE_OPTIONS}
                    />

                    <FormInput
                        label="Kademe Sıra Numarası *"
                        type="number"
                        min="1"
                        value={formData.cadre}
                        onChange={(e) => setFormData({ ...formData, cadre: e.target.value })}
                        placeholder="Örn: 1 (En alt kıdem) - 5 (Yönetici kademesi)"
                    />

                    <CustomSelect
                        label="Bağlı Olduğu Resmî Birim (Opsiyonel)"
                        value={formData.unitId}
                        onChange={(val) => setFormData({ ...formData, unitId: val as string })}
                        options={[
                            { value: '', label: 'Genel / Tüm Birimler' },
                            ...units.map(u => ({ value: u.id, label: u.name }))
                        ]}
                    />

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                            Kadro Aktif Kullanımda
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button type="submit">Kaydet</Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Modal */}
            {deleteConfirm && (
                <ConfirmModal
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={confirmDelete}
                    title="Unvanı Pasifleştir"
                    message="Bu kadro unvanı pasif konuma getirilecek. Devam etmek istiyor musunuz?"
                />
            )}
        </div>
    );
}

export default function JobTitlesPage() {
    return (
        <RequireRole allowedRoles={['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN']}>
            <JobTitlesPageContent />
        </RequireRole>
    );
}
