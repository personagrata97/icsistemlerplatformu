import React, { useState } from 'react';
import { FileText, Calendar, Layout, AlertTriangle, TrendingUp, PieChart, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { auditApi } from '@/lib/audit-api';
import CustomSelect from '@/components/ui/CustomSelect';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface ReportGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: () => void;
}

const REPORT_TYPES = [
    { value: 'Faaliyet Raporu', label: 'Yıllık Faaliyet Raporu', icon: FileText },
    { value: 'Denetim Komitesi Sunumu', label: 'Denetim Komitesi Sunumu', icon: Layout },
    { value: 'Yönetim Kurulu Raporu', label: 'Yönetim Kurulu Raporu', icon: TrendingUp },
    { value: 'Bulgu Özeti', label: 'Bulgu Özeti Raporu', icon: PieChart },
    { value: 'Bulgu Yaşlandırma', label: 'Bulgu Yaşlandırma Raporu', icon: Clock },
    { value: 'Risk Matrisi', label: 'Denetim Evreni Risk Matrisi', icon: AlertTriangle },
    { value: 'Denetim Planı İlerleme', label: 'Yıllık Plan İlerleme Raporu', icon: Calendar }
];

const generatePeriodOptions = () => {
    const currentYear = new Date().getFullYear();
    const quarters = [
        { q: 'Q1', label: 'Ocak-Mart' },
        { q: 'Q2', label: 'Nisan-Haziran' },
        { q: 'Q3', label: 'Temmuz-Eylül' },
        { q: 'Q4', label: 'Ekim-Aralık' }
    ];
    const options: { value: string; label: string }[] = [];

    // Güncel yıl + çeyrekler
    options.push({ value: String(currentYear), label: `${currentYear} Tüm Yıl` });
    quarters.forEach(q => {
        options.push({ value: `${currentYear}-${q.q}`, label: `${currentYear} ${q.q} (${q.label})` });
    });

    // Önceki 2 yıl (arşiv)
    for (let y = currentYear - 1; y >= currentYear - 2; y--) {
        options.push({ value: String(y), label: `${y} (Arşiv)` });
    }

    return options;
};

const PERIOD_OPTIONS = generatePeriodOptions();

export default function ReportGenerationModal({ isOpen, onClose, onGenerate }: ReportGenerationModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('Faaliyet Raporu');
    const [period, setPeriod] = useState(String(new Date().getFullYear()));
    const [templateId, setTemplateId] = useState<string>('');
    const [includeWatermark, setIncludeWatermark] = useState(true);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await auditApi.generateReport(type, period, templateId, includeWatermark);
            showToast('Rapor başarıyla oluşturuldu ve sıraya alındı', 'success');
            onGenerate();
            onClose();
        } catch (error) {
            console.error('Report generation failed:', error);
            showToast('Rapor oluşturulamadı', 'error');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-end w-full">
            <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                variant="primary"
                className="min-w-[120px]"
            >
                {loading ? (
                    <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Oluşturuluyor
                    </div>
                ) : (
                    'Rapor Oluştur'
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Yeni Denetim Raporu Oluştur"
            footer={footer}
            size="md"
        >
            <div className="space-y-5">
                <div>
                    <label className="form-label">
                        Rapor Türü
                    </label>
                    <CustomSelect
                        value={type}
                        onChange={(val) => setType(val as string)}
                        options={REPORT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                    />
                </div>

                <div>
                    <label className="form-label">
                        Dönem
                    </label>
                    <CustomSelect
                        value={period}
                        onChange={(val) => setPeriod(val as string)}
                        options={PERIOD_OPTIONS}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="includeWatermark" 
                        checked={includeWatermark} 
                        onChange={(e) => setIncludeWatermark(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="includeWatermark" className="text-sm font-medium text-gray-700">
                        Gizlilik Filigranı Eklensin ("HİZMETE ÖZEL")
                    </label>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                    <div className="text-blue-600 shrink-0 mt-0.5">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-blue-800">Bilgilendirme</h4>
                        <p className="text-xs text-blue-700 mt-1">
                            Rapor oluşturma işlemi arka planda gerçekleştirilecektir. Tamamlandığında bildirim alacaksınız.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
