'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { useToast } from '@/components/Toast';
import { FileText, Download, Layers, Building2, ShieldAlert } from 'lucide-react';
import SegmentedTabs from '@/components/ui/SegmentedTabs';

interface PartialCopyModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId?: string;
    reportTitle?: string;
}

export default function PartialCopyModal({ isOpen, onClose, reportId = 'IS.1.2026', reportTitle = 'CRM Yetki Onayları Denetim Raporu' }: PartialCopyModalProps) {
    const { showToast } = useToast();
    const [mode, setMode] = useState<'TOPLU' | 'BOLUM' | 'BIRIM'>('BIRIM');
    const [selectedUnit, setSelectedUnit] = useState<string>('bt');
    const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
    const [loading, setLoading] = useState(false);

    const units = [
        { value: 'bt', label: 'Bilgi Teknolojileri Müdürlüğü' },
        { value: 'ik', label: 'İnsan Kaynakları Müdürlüğü' },
        { value: 'krediler', label: 'Kredi Operasyon Müdürlüğü' },
        { value: 'mevzuat', label: 'Hukuk & Uyum Müdürlüğü' },
    ];

    const handleGenerate = async () => {
        setLoading(true);
        try {
            showToast('Kısmi nüsha ve rapor kabuğu oluşturuluyor...', 'info');

            const selectedUnitObj = units.find(u => u.value === selectedUnit);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/audit/reports/partial-copy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportId,
                    mode,
                    targetUnitId: selectedUnit,
                    targetUnitName: selectedUnitObj?.label,
                }),
            });

            if (!response.ok) {
                throw new Error('Nüsha oluşturma hatası');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapor_Nusha_${mode}_${selectedUnit}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Kısmi Nüsha başarıyla oluşturuldu ve indirildi!', 'success');
            onClose();
        } catch (error) {
            console.error('Nüsha oluşturma hatası:', error);
            showToast('Nüsha üretilirken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Kısmi Nüsha ve Rapor Dağıtım Sihirbazı"
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose}>Vazgeç</Button>
                    <Button variant="primary" isLoading={loading} leftIcon={<Download size={16} />} onClick={handleGenerate}>
                        Nüsha Oluştur ve İndir
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                    <Layers className="text-primary w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Kurumsal Rapor Standardı</h4>
                        <p className="text-xs text-gray-600 mt-1">
                            Birim bazlı nüshalarda KVKK ve Görev Ayrılığı ilkesi gereği yalnızca ilgili birime özel bulgular filtrelenir.
                            Bölüm numaraları (`3.2`) ve bağlam metinleri korunur.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="form-label mb-2">Çıktı Biçimi</label>
                    <SegmentedTabs
                        tabs={[
                            { id: 'BIRIM', label: 'Birim Bazlı (Kısmi)', icon: Building2 },
                            { id: 'BOLUM', label: 'Bölüm Bazlı', icon: Layers },
                            { id: 'TOPLU', label: 'Toplu (Tam Nüsha)', icon: FileText },
                        ]}
                        activeTab={mode}
                        onChange={(id) => setMode(id as any)}
                    />
                </div>

                {mode === 'BIRIM' && (
                    <div>
                        <label className="form-label mb-1">Hedef Alıcı Birim</label>
                        <CustomSelect
                            options={units}
                            value={selectedUnit}
                            onChange={(val) => setSelectedUnit(val as string)}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            Seçilen birime türev numaralı (Örn: `İS.1.2026/BT`) kısmi nüsha basılacaktır.
                        </p>
                    </div>
                )}

                <div>
                    <label className="form-label mb-1">Dosya Biçimi</label>
                    <CustomSelect
                        options={[
                            { value: 'pdf', label: 'PDF Formatı (Kurumsal Standart / ReportShell)' },
                            { value: 'docx', label: 'Word (DOCX) Düzenlenebilir Nüsha' },
                        ]}
                        value={format}
                        onChange={(val) => setFormat(val as any)}
                    />
                </div>
            </div>
        </Modal>
    );
}
