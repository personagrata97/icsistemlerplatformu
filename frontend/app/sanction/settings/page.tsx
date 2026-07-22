'use client';

import PageHeader from '@/components/audit/PageHeader';
import Button from '@/components/ui/Button';
import { Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function SanctionSettingsPage() {
    const { showToast } = useToast();
    const [fuzzyThreshold, setFuzzyThreshold] = useState(85);
    const [autoScanNewCustomer, setAutoScanNewCustomer] = useState(true);
    const [cronSyncTime, setCronSyncTime] = useState('06:00');

    const handleSave = () => {
        showToast('Yaptırım modülü parametreleri güncellendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Yaptırım Modülü ve Eşleştirme Motoru Ayarları"
                subtitle="Levenshtein Bulanık Eşleşme Eşik Değerleri ve Otomatik Tarama Parametreleri"
            />

            <div className="card p-6 bg-white border border-gray-200 shadow-sm max-w-2xl space-y-6">
                <div>
                    <label className="form-label mb-1">Bulanık Eşleşme Eşik Değeri (Fuzzy Matching Threshold %)</label>
                    <input
                        type="number"
                        className="form-input font-mono"
                        min={50}
                        max={100}
                        value={fuzzyThreshold}
                        onChange={(e) => setFuzzyThreshold(Number(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">%85 ve üzerindeki isim benzerlikleri potansiyel uyarı oluşturur.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <div className="font-bold text-sm text-gray-900">Yeni Müşteri Anlık Tarama Tetikleyicisi</div>
                        <div className="text-xs text-gray-500">Müşteri açılışında gişe sisteminde anlık MASAK/OFAC taraması yap.</div>
                    </div>
                    <input
                        type="checkbox"
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={autoScanNewCustomer}
                        onChange={(e) => setAutoScanNewCustomer(e.target.checked)}
                    />
                </div>

                <div>
                    <label className="form-label mb-1">Günlük Otomatik Portföy Taraması Saati</label>
                    <input
                        type="time"
                        className="form-input font-mono"
                        value={cronSyncTime}
                        onChange={(e) => setCronSyncTime(e.target.value)}
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button variant="primary" leftIcon={<Save size={16} />} onClick={handleSave}>
                        Ayarları Kaydet
                    </Button>
                </div>
            </div>
        </div>
    );
}
