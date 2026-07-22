'use client';

import React, { useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import PageToolbar from '@/components/ui/PageToolbar';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { Sliders, Save, RefreshCw, ShieldCheck, Edit3, Settings } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/audit-utils';
import { TERMS } from '@/lib/terminology';

export default function SanctionSettingsPage() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParam, setSelectedParam] = useState<any>(null);
    const [newValue, setNewValue] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [parameters, setParameters] = useState([
        { kod: 'yuksekTutarEsigi', ad: 'Yüksek Tutar Fesih Eşiği', deger: '500000', birim: 'TL', varsayilan: '500000', aciklama: 'Erken fesih ve yüksek tutarlı işlemlerde uyarı tetikleme eşiği', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' },
        { kod: 'erkenFesihOrani', ad: 'Erken Fesih Süre Oranı', deger: '33', birim: 'YUZDE', varsayilan: '33', aciklama: 'Sözleşme süresinin ilk kaçlığında yapılan fesihlerin erken fesih sayılacağı', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' },
        { kod: 'hizliDevirGunSayisi', ad: 'Hızlı Devir Gün Sayısı', deger: '60', birim: 'GUN', varsayilan: '60', aciklama: 'Tesis tarihinden itibaren kaç gün içindeki devirlerin şüpheli sayılacağı', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' },
        { kod: 'bolmeAdetEsigi', ad: 'Structuring (Bölme) Adet Eşiği', deger: '3', birim: 'ADET', varsayilan: '3', aciklama: 'Eşiğin altında kalarak yapılan tekrarlı sözleşme adedi', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' },
        { kod: 'eslesmeKesinEsigi', ad: 'Kesin Eşleşme Skoru', deger: '95', birim: 'PUAN', varsayilan: '95', aciklama: 'Yaptırım listelerinde otomatik dondurma sürecini tetikleyen skor', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' },
        { kod: 'eslesmeSupheliEsigi', ad: 'Şüpheli Eşleşme Alt Eşiği', deger: '85', birim: 'PUAN', varsayilan: '85', aciklama: 'İnceleme kuyruğuna düşen minimum bulanık eşleşme skoru', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' },
        { kod: 'listeEskimeUyariGun', ad: 'Liste Güncellik Uyarı Süresi', deger: '7', birim: 'GUN', varsayilan: '7', aciklama: 'Yaptırım listesi güncellenmediğinde uyarı üretilecek maksimum gün', guncelleyen: 'Selim KAYA', tarih: '2026-07-20' }
    ]);

    const handleEditParam = (param: any) => {
        setSelectedParam(param);
        setNewValue(param.deger);
    };

    const handleSaveConfirm = async () => {
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 500));
        setParameters(prev => prev.map(p => p.kod === selectedParam.kod ? { ...p, deger: newValue, tarih: '2026-07-22' } : p));
        setSubmitting(false);
        setIsConfirmOpen(false);
        setSelectedParam(null);
        showToast('Parametre değeri güncellendi. Tüm yaptırım motoruna anında uygulandı.', 'success');
    };

    const filteredParams = parameters.filter(p =>
        p.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.kod.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{TERMS.sanctionModule} — Dinamik Eşik ve Parametre Yönetimi</h2>
                    <p className="text-slate-300 text-xs mt-1">Yaptırım taraması ve itibar riski kural motorundaki tüm eşikleri merkezi yönetin. Koda gömülü sabit değer bulunmamaktadır.</p>
                </div>
                <div className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold border border-slate-700">
                    Parametre Ayarları
                </div>
            </div>

            <PageToolbar
                searchPlaceholder="Parametre adı veya kodu ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

            <DataTable
                columns={[
                    {
                        key: 'kod',
                        header: 'Parametre Kodu',
                        width: '200px',
                        render: (item: any) => (
                            <code className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                {item.kod}
                            </code>
                        )
                    },
                    {
                        key: 'ad',
                        header: 'Parametre Tanımı & Açıklama',
                        sortable: true,
                        render: (item: any) => (
                            <div>
                                <div className="font-bold text-gray-900">{item.ad}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">{item.aciklama}</div>
                            </div>
                        )
                    },
                    {
                        key: 'deger',
                        header: 'Mevcut Değer',
                        width: '140px',
                        render: (item: any) => (
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                {item.deger} {item.birim}
                            </span>
                        )
                    },
                    {
                        key: 'tarih',
                        header: 'Son Güncelleme',
                        width: '150px',
                        render: (item: any) => (
                            <div className="text-xs text-gray-600 font-mono">
                                <div>{formatDate(item.tarih)}</div>
                                <div className="text-[10px] text-gray-400">{item.guncelleyen}</div>
                            </div>
                        )
                    },
                    {
                        key: 'actions',
                        header: 'Düzenle',
                        width: '110px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="secondary" leftIcon={<Edit3 size={14} />} onClick={() => handleEditParam(item)}>
                                Değiştir
                            </Button>
                        )
                    }
                ]}
                data={filteredParams}
                searchTerm={searchTerm}
                onClearFilters={() => setSearchTerm('')}
                rowKey="kod"
            />

            {selectedParam && (
                <Modal
                    isOpen={!!selectedParam}
                    onClose={() => setSelectedParam(null)}
                    title={`Parametre Düzenle — ${selectedParam.ad}`}
                    size="md"
                    footer={
                        <div className="flex justify-between w-full">
                            <Button variant="secondary" onClick={() => setSelectedParam(null)}>İptal</Button>
                            <Button variant="primary" leftIcon={<Save size={16} />} onClick={() => setIsConfirmOpen(true)}>
                                Güncelle & Kaydet
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4 text-xs text-gray-700">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="font-bold text-gray-900 text-sm">{selectedParam.ad}</div>
                            <div>{selectedParam.aciklama}</div>
                        </div>

                        <div>
                            <label className="form-label mb-1 block font-bold text-gray-900">Yeni Değer ({selectedParam.birim})</label>
                            <input
                                type="text"
                                className="form-input text-xs font-mono font-bold"
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleSaveConfirm}
                title="Parametre Değişikliğini Onayla"
                message="Bu parametre değişikliği tüm yaptırım ve itibar riski tarama motoruna anında uygulanacaktır. Onaylıyor musunuz?"
                confirmText="Evet, Değişikliği Uygula"
                variant="primary"
                isLoading={submitting}
            />
        </div>
    );
}
