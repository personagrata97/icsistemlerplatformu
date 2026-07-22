'use client';

import Button from '@/components/ui/Button';
import { Save, ShieldCheck, Sliders, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function SanctionSettingsPage() {
    const { showToast } = useToast();
    const [fuzzyThreshold, setFuzzyThreshold] = useState(85);
    const [autoScanNewCustomer, setAutoScanNewCustomer] = useState(true);
    const [cronSyncTime, setCronSyncTime] = useState('06:00');

    const handleSave = () => {
        showToast('Yaptırım ve MASAK tarama parametreleri güncellendi.', 'success');
    };

    return (
        <div className="space-y-6">
            <div className="card p-6 bg-white border border-gray-100 shadow-sm max-w-2xl space-y-6 rounded-2xl">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                        <Sliders size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Eşleştirme Motoru ve Uyum Parametreleri</h3>
                        <p className="text-xs text-gray-500">MASAK 5549/6415/7262 ve Levenshtein Algoritması Ayarları</p>
                    </div>
                </div>

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
                    <p className="text-xs text-gray-500 mt-1">%85 ve üzerindeki isim benzerlikleri otomatik olarak potansiyel uyarı oluşturur.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <div className="font-bold text-sm text-gray-900">Yeni Müşteri Anlık Tarama Tetikleyicisi</div>
                        <div className="text-xs text-gray-500">Müşteri açılışında gişe sisteminde anlık MASAK/OFAC taraması yap.</div>
                    </div>
                    <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-600 cursor-pointer"
                        checked={autoScanNewCustomer}
                        onChange={(e) => setAutoScanNewCustomer(e.target.checked)}
                    />
                </div>

                <div>
                    <label className="form-label mb-1">Günlük Otomatik Portföy Taraması Saati (Cron Time)</label>
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
