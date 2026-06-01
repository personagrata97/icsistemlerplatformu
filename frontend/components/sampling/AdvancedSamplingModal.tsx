import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/ui/CustomSelect';
import { FileUpload } from '@/components/ui/FileUpload';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/Toast';
import {
    UploadCloud, Plus, Trash2, Filter,
    ArrowDownAZ, Target, FileSpreadsheet,
    Settings, Play, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Rule {
    id: string;
    type: 'filter' | 'sort';
    column: string;
    operator?: string;
    value?: string | string[];
    direction?: 'asc' | 'desc';
}

interface AdvancedSamplingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: any, file: File | null) => void;
    audits: any[];
}

export default function AdvancedSamplingModal({ isOpen, onClose, onGenerate, audits }: AdvancedSamplingModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
    const [mockColumns, setMockColumns] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState<number>(0);
    const [columnTypes, setColumnTypes] = useState<Record<string, 'numeric' | 'string'>>({});
    const [columnValues, setColumnValues] = useState<Record<string, string[]>>({});
    const [populationFile, setPopulationFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);

    // Config State
    const [populationName, setPopulationName] = useState('');
    const [rules, setRules] = useState<Rule[]>([]);
    const [samplingMethod, setSamplingMethod] = useState('Yargısal');
    const [sampleSize, setSampleSize] = useState(50);
    const [stratifiedColumn, setStratifiedColumn] = useState(''); // Tabakalı gruplama kolonu
    const [confidenceLevel, setConfidenceLevel] = useState(95);
    const [errorRate, setErrorRate] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false); // Buton Loading State
    const [auditId, setAuditId] = useState('');


    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setUploadStatus('idle');
            setMockColumns([]);
            setColumnValues({});
            setRowCount(0);
            setPopulationFile(null);
            setParsedData([]);
            setPopulationName('');
            setRules([]);
            setSamplingMethod('Yargısal');
            setSampleSize(50);
            setStratifiedColumn('');
            setConfidenceLevel(95);
            setErrorRate(5);
            setIsGenerating(false);
            setAuditId('');
        }
    }, [isOpen]);

    const validateFinalStep = () => {
        if (!auditId) {
            showToast('Lütfen bir denetim seçiniz.', 'error');
            return false;
        }
        if ((samplingMethod === 'Tabakalı' || samplingMethod === 'Küme') && !stratifiedColumn) {
            showToast(samplingMethod === 'Küme'
                ? 'Lütfen kümeleme yapılacak kolonu seçiniz.'
                : 'Lütfen tabakalı seçim için gruplama yapılacak kolonu seçiniz.', 'error');
            return false;
        }
        if (sampleSize <= 0) {
            showToast('Lütfen geçerli bir örneklem sayısı giriniz.', 'error');
            return false;
        }
        return true;
    };

    const handleFileUpload = async (file: File) => {
        setUploadStatus('uploading');
        setPopulationFile(file);

        // React'in UI'ı ('uploading' durumu) render etmesine izin vermek için küçük bir gecikme ekliyoruz (Unblocking Native Thread)
        setTimeout(async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);

                // Supress annoying generic SheetJS Zip parsing errors. The library usually recovers fine.
                const originalConsoleError = console.error;
                console.error = (...args) => {
                    if (args[0] && typeof args[0] === 'string' && args[0].includes('Bad uncompressed size')) return;
                    originalConsoleError(...args);
                };
                const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });
                console.error = originalConsoleError; // Restore immediately

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // İlk n satırı okuyarak filtre dropdown'ları için dinamik seçenek çıkarmak
                // raw: false ve dateNF vererek tarihlerin iğrenç GMT stringleri yerine net 'dd.mm.yyyy' basılmasını sağlarız.
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false, dateNF: 'dd.mm.yyyy' });

                if (jsonData.length > 0) {
                    const validHeaders = Object.keys(jsonData[0] as object).filter(h => h);
                    setMockColumns(validHeaders); // Skip empty columns

                    // Kolonlardaki benzersiz değerleri toplama (Filtre Dropdown Modülü İçin)
                    const uniqueValues: Record<string, Set<string>> = {};
                    validHeaders.forEach(h => uniqueValues[h] = new Set());

                    const parseLimit = Math.min(jsonData.length, 5000); // Performans için ilk 5000 satır
                    for (let i = 0; i < parseLimit; i++) {
                        const row: any = jsonData[i];
                        if (row) {
                            validHeaders.forEach((h) => {
                                if (row[h] !== undefined && row[h] !== null && row[h] !== '') {
                                    let val = row[h].toString();

                                    // Fallback: Check if it's a long JS Date string with GMT (e.g., "Wed Sep 24 2025 23:59:00 GMT+0300") OR a Date object mapped to string
                                    if (val.includes('GMT') && val.match(/[a-zA-Z]{3} [a-zA-Z]{3} \d{2} \d{4}/)) {
                                        const parsedDate = new Date(val);
                                        if (!isNaN(parsedDate.getTime())) {
                                            const d = parsedDate.getDate().toString().padStart(2, '0');
                                            const m = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
                                            const y = parsedDate.getFullYear();
                                            val = `${d}.${m}.${y}`;
                                        }
                                    }

                                    uniqueValues[h].add(val);
                                }
                            });
                        }
                    }

                    const extractedValues: Record<string, string[]> = {};
                    const detectedTypes: Record<string, 'numeric' | 'string'> = {};

                    Object.keys(uniqueValues).forEach(h => {
                        const values = Array.from(uniqueValues[h]);
                        extractedValues[h] = values.sort();

                        // Type detection: If most non-empty values are numeric AND NOT dates, mark as numeric
                        const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
                        const isNumericItem = (v: string) => {
                            if (dateRegex.test(v)) return false; // It's a date
                            const n = v.replace(/\./g, '').replace(',', '.');
                            return !isNaN(Number(n)) && n !== '';
                        };

                        const numericCount = values.filter(v => isNumericItem(v)).length;
                        detectedTypes[h] = (numericCount > values.length * 0.8) ? 'numeric' : 'string';
                    });

                    setColumnTypes(detectedTypes);
                    setColumnValues(extractedValues);
                    setParsedData(jsonData);
                    setRowCount(jsonData.length);
                    setUploadStatus('success');
                } else {
                    setUploadStatus('idle');
                }
            } catch (err) {
                console.error("Dosya okuma hatası (XLSX Parse):", err);
                setUploadStatus('idle');
            }
        }, 50); // 50ms render zamanı
    };

    const addRule = (type: 'filter' | 'sort') => {
        setRules([...rules, {
            id: Math.random().toString(36).substr(2, 9),
            type,
            column: mockColumns[0] || '',
            operator: type === 'filter' ? '>' : undefined,
            direction: type === 'sort' ? 'desc' : undefined,
            value: ''
        }]);
    };

    const updateRule = (id: string, updates: Partial<Rule>) => {
        setRules(rules.map(r => {
            if (r.id === id) {
                const newRule = { ...r, ...updates };

                // Auto-fix operator if column type changes to string
                if (updates.column) {
                    const type = columnTypes[updates.column];
                    if (type === 'string' && (newRule.operator === '>' || newRule.operator === '<' || newRule.operator === 'between')) {
                        newRule.operator = '=';
                    }
                }
                return newRule;
            }
            return r;
        }));
    };

    const removeRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const handleGenerate = async () => {
        if (!validateFinalStep()) return;
        setIsGenerating(true);
        try {
            await onGenerate({
                populationName,
                rules,
                samplingMethod,
                sampleSize,
                confidenceLevel,
                errorRate,
                stratifiedColumn,
                populationData: parsedData, // En önemli kısım: Array veriyi salt yolluyoruz
                auditId: auditId
            }, populationFile);
        } finally {
            setIsGenerating(false);
            // On generate success, clear state to avoid pollution on next open
            setStep(1);
            setUploadStatus('idle');
            setMockColumns([]);
            setColumnValues({});
            setRowCount(0);
            setPopulationFile(null);
            setParsedData([]);
            setPopulationName('');
            setRules([]);
            setSamplingMethod('Yargısal');
            setSampleSize(50);
            setStratifiedColumn('');
            setConfidenceLevel(95);
            setErrorRate(5);
            setAuditId('');
        }
    };

    const formatNumber = (val: number | string) => {
        if (!val && val !== 0) return '';
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (val: string) => {
        return val.replace(/\./g, '');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gelişmiş Örneklem Oluşturma"
            size="2xl"
            footer={
                <div className="flex justify-between w-full">
                    <div className="flex gap-2">
                        {step > 1 ? (
                            <Button variant="secondary" onClick={() => setStep(step - 1 as any)}>
                                Geri
                            </Button>
                        ) : null}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>İptal</Button>
                        {step < 3 && uploadStatus === 'success' && (
                            <Button variant="primary" onClick={() => {
                                if (step === 1) {
                                    if (!auditId) {
                                        showToast("Lütfen önce bir denetim (İlişkili Denetim) seçin.", 'error');
                                        return;
                                    }
                                    if (!populationName) {
                                        showToast("Lütfen popülasyon adını girin.", 'error');
                                        return;
                                    }
                                    if (parsedData.length === 0) {
                                        showToast("Lütfen önce bir veri seti (Excel/CSV) yükleyin.", 'error');
                                        return;
                                    }
                                }
                                setStep(step + 1 as any);
                            }}>
                                İleri
                            </Button>
                        )}
                        {step === 3 && (
                            <Button
                                variant="primary"
                                className="gap-2"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>İşleniyor...</span>
                                    </>
                                ) : (
                                    <>
                                        Örneklemi Oluştur
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {/* Adım Göstergesi */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-[20px] left-[15%] right-[15%] h-0.5 bg-gray-200 z-0">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                    />
                </div>

                {[
                    { num: 1, label: 'Veri Kaynağı', icon: FileSpreadsheet },
                    { num: 2, label: 'Kural Motoru', icon: Filter },
                    { num: 3, label: 'Örneklem Çıktısı', icon: Target }
                ].map((s) => (
                    <div key={s.num} className="flex flex-col items-center relative z-10 w-1/3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.num
                            ? 'bg-primary border-primary text-white shadow-md'
                            : 'bg-white border-gray-300 text-gray-400'
                            }`}>
                            <s.icon size={18} />
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-gray-800' : 'text-gray-500'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ADIM 1: VERİ YÜKLEME */}
            {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <CustomSelect
                                label="İlişkili Denetim *"
                                value={auditId}
                                onChange={(val) => setAuditId(val as string)}
                                options={audits.map(a => ({ value: a.id, label: a.title }))}
                                placeholder="Bir denetim seçin..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Popülasyon Adı (Hedef Kitle) *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Örn: 2026 1. Çeyrek Cayma Kayıtları vb."
                                value={populationName}
                                onChange={(e) => setPopulationName(e.target.value)}
                            />
                        </div>
                    </div>

                    {uploadStatus === 'idle' ? (
                        <FileUpload
                            maxSizeMB={100}
                            onFileSelect={(files) => {
                                if (files && files.length > 0) {
                                    handleFileUpload(files[0]);
                                }
                            }}
                            label="Popülasyon Verisini Yükle"
                            description="Excel (.xlsx) veya CSV formatında ham veriyi sürükleyin veya seçin. (Maksimum 100MB)"
                            accept=".xlsx,.csv"
                            hideList={true}
                        />
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 transition-colors">
                            {uploadStatus === 'uploading' && (
                                <div className="flex flex-col items-center py-6">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                    <p className="text-gray-600 font-medium">Veri analiz ediliyor ve kolonlar eşleştiriliyor...</p>
                                </div>
                            )}
                            {uploadStatus === 'success' && (
                                <div className="flex flex-col items-center py-6 animate-fadeIn">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Veri Başarıyla İşlendi</h3>
                                    <p className="text-sm text-gray-500 mb-4">{formatNumber(rowCount)} satır ve {mockColumns.length} veri alanı kolonu tespit edildi.</p>
                                    <p className="text-sm text-green-600 font-medium">Devam etmek için aşağıdaki "İleri" butonunu kullanabilirsiniz.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ADIM 2: KURAL MOTORU */}
            {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                        <Settings className="text-blue-600 flex-shrink-0" size={20} />
                        <div>
                            <strong>Nasıl Kural Eklerim?</strong> Buradan riskli sözleşmeleri yakalamak için kriterler belirleyebilirsiniz. Örneğin: <br />
                            <span className="opacity-80">1) <i>Sözleşme Durumu = Cayma ve Organizasyon Ücreti İadesi = 0</i> diyerek iadelerde yaşanan ihlalleri bulabilir,</span><br />
                            <span className="opacity-80">2) <i>Tahsisat Gecikmesi &gt; 0</i> diyerek müşteriye ödeme yapmakta gecikilen işlemleri süzebilirsiniz.</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-bold text-gray-800">Aktif Filtre ve Sıralama Kuralları</h3>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => addRule('filter')}>
                                    Filtre Ekle
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => addRule('sort')}>
                                    Sıralama Ekle
                                </Button>
                            </div>
                        </div>

                        {rules.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                <p className="text-gray-500 text-sm">Henüz kural eklenmedi. Tüm popülasyon üzerinden resmi kurum ilkelerine uygun rastgele/sistematik seçim yapılacaktır.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rules.map((rule, idx) => (
                                    <div key={rule.id} className="flex gap-3 items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                        <div className="w-8 flex justify-center">
                                            {rule.type === 'filter' ? <Filter size={18} className="text-orange-500" /> : <ArrowDownAZ size={18} className="text-purple-500" />}
                                        </div>

                                        <div className="w-1/3">
                                            <CustomSelect
                                                value={rule.column}
                                                onChange={(val) => updateRule(rule.id, { column: val as string })}
                                                options={mockColumns.map(c => ({ value: c, label: c }))}
                                                placeholder="Kolon Seç"
                                                isSearchable={true}
                                            />
                                        </div>

                                        {rule.type === 'filter' ? (
                                            <>
                                                <div className="w-1/4">
                                                    <CustomSelect
                                                        value={rule.operator || '='}
                                                        onChange={(val) => updateRule(rule.id, { operator: val as string })}
                                                        options={[
                                                            ...(columnTypes[rule.column] === 'numeric' ? [
                                                                { value: '>', label: 'Büyüktür (>)' },
                                                                { value: '<', label: 'Küçüktür (<)' },
                                                                { value: 'between', label: 'Arasında' }
                                                            ] : []),
                                                            { value: '=', label: 'Eşittir (=)' },
                                                            { value: 'contains', label: 'İçerir' }
                                                        ]}
                                                        isSearchable={true}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    {rule.operator === 'between' ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                className="form-input text-sm w-1/2"
                                                                placeholder="Min..."
                                                                value={rule.value ? (rule.value as string).split('-')[0]?.trim() || '' : ''}
                                                                onChange={(e) => {
                                                                    const isNumeric = columnTypes[rule.column] === 'numeric';
                                                                    const currentVal = rule.value as string || '-';
                                                                    const parts = currentVal.split('-');
                                                                    const min = isNumeric ? parseNumber(e.target.value) : e.target.value;
                                                                    const max = parts[1] || '';
                                                                    updateRule(rule.id, { value: `${min}-${max}` });
                                                                }}
                                                                onBlur={() => {
                                                                    const isNumeric = columnTypes[rule.column] === 'numeric';
                                                                    const currentVal = rule.value as string || '-';
                                                                    const parts = currentVal.split('-');
                                                                    const min = isNumeric ? formatNumber(parts[0] || '') : (parts[0] || '');
                                                                    const max = parts[1] || '';
                                                                    updateRule(rule.id, { value: `${min}-${max}` });
                                                                }}
                                                            />
                                                            <span className="text-gray-400">-</span>
                                                            <input
                                                                type="text"
                                                                className="form-input text-sm w-1/2"
                                                                placeholder="Max..."
                                                                value={rule.value ? (rule.value as string).split('-')[1]?.trim() || '' : ''}
                                                                onChange={(e) => {
                                                                    const isNumeric = columnTypes[rule.column] === 'numeric';
                                                                    const currentVal = rule.value as string || '-';
                                                                    const parts = currentVal.split('-');
                                                                    const min = parts[0] || '';
                                                                    const max = isNumeric ? parseNumber(e.target.value) : e.target.value;
                                                                    updateRule(rule.id, { value: `${min}-${max}` });
                                                                }}
                                                                onBlur={() => {
                                                                    const isNumeric = columnTypes[rule.column] === 'numeric';
                                                                    const currentVal = rule.value as string || '-';
                                                                    const parts = currentVal.split('-');
                                                                    const min = parts[0] || '';
                                                                    const max = isNumeric ? formatNumber(parts[1] || '') : (parts[1] || '');
                                                                    updateRule(rule.id, { value: `${min}-${max}` });
                                                                }}
                                                            />
                                                        </div>
                                                    ) : columnValues[rule.column] && columnValues[rule.column].length > 0 && columnValues[rule.column].length <= 100 ? (
                                                        <CustomSelect
                                                            isMulti={true}
                                                            placeholder="Çoklu Değer Seçiniz..."
                                                            value={rule.value || []}
                                                            onChange={(val) => updateRule(rule.id, { value: val })}
                                                            options={columnValues[rule.column].map(val => ({ value: val, label: val }))}
                                                            isSearchable={true}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="form-input text-sm w-full"
                                                            placeholder="Değer..."
                                                            value={(columnTypes[rule.column] === 'numeric' && (rule.operator === '>' || rule.operator === '<')) ? formatNumber(rule.value as string) : rule.value}
                                                            onChange={(e) => {
                                                                const isNumeric = columnTypes[rule.column] === 'numeric';
                                                                const val = (isNumeric && (rule.operator === '>' || rule.operator === '<')) ? parseNumber(e.target.value) : e.target.value;
                                                                updateRule(rule.id, { value: val });
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1 text-sm text-gray-500 italic pl-2">alanına göre</div>
                                                <div className="w-1/3">
                                                    <CustomSelect
                                                        value={rule.direction || 'desc'}
                                                        onChange={(val) => updateRule(rule.id, { direction: val as any })}
                                                        options={[
                                                            { value: 'desc', label: 'Büyükten Küçüğe (Azalan)' },
                                                            { value: 'asc', label: 'Küçükten Büyüğe (Artan)' }
                                                        ]}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <Tooltip content="Kuralı Sil">
                                            <button
                                                onClick={() => removeRule(rule.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Example Use Cases Hints */}
                        {rules.length === 0 && (
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="border border-gray-200 p-4 rounded-xl bg-white text-sm cursor-pointer hover:border-primary hover:shadow-sm transition-all shadow-sm" onClick={() => {
                                    setRules([
                                        { id: '1', type: 'filter', column: 'Tahsisat Gecikmesi (Gün)', operator: '>', value: '0' },
                                        { id: '2', type: 'sort', column: 'Tasarruf Fonu (TL)', direction: 'desc' },
                                    ]);
                                }}>
                                    <strong className="flex items-center gap-2 text-gray-800 mb-2">
                                        <AlertCircle size={16} className="text-orange-500" />
                                        Tahsisat Gecikmesi Şablonu (Likidite)
                                    </strong>
                                    <p className="text-gray-500 text-xs">Tahsisat (Teslimat) gecikmesi &gt; 0 gün olan kayıtları filtrele ve içerideki fon tutarına göre en büşükten küçüğe sırala.</p>
                                </div>
                                <div className="border border-gray-200 p-4 rounded-xl bg-white text-sm cursor-pointer hover:border-primary hover:shadow-sm transition-all shadow-sm" onClick={() => {
                                    setRules([
                                        { id: '1', type: 'filter', column: 'Durum', operator: '=', value: 'Cayma' },
                                        { id: '2', type: 'filter', column: 'Organizasyon Ücreti İadesi', operator: '=', value: '0' }
                                    ]);
                                }}>
                                    <strong className="flex items-center gap-2 text-gray-800 mb-2">
                                        <Target size={16} className="text-purple-500" />
                                        Cayma / Fesih İade Şablonu
                                    </strong>
                                    <p className="text-gray-500 text-xs">Müşteri 14 gün içinde ayrılırsa (Cayma) organizasyon ücreti iade edilmelidir. Ancak 14 günü geçerse (Fesih) iade edilmez. Yanlış iadeleri yakalayabilirsiniz.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADIM 3: ÖRNEKLEM ÇIKTISI */}
            {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-800 border-b pb-2">Örneklem Çıktı Parametreleri</h3>
                            <div className="form-group">
                                <CustomSelect
                                    label="Seçim Metodolojisi"
                                    value={samplingMethod}
                                    onChange={(v) => {
                                        setSamplingMethod(v as string);
                                        if (v !== 'Tabakalı') setStratifiedColumn('');
                                    }}
                                    options={[
                                        { value: 'Yargısal', label: 'Yargısal Seçim (Top-N / Kritik Risk)' },
                                        { value: 'Rastgele', label: 'Basit Rastgele (Tüm havuzdan şans usulü)' },
                                        { value: 'Sistematik', label: 'Sistematik Aralık (N atlayarak periyodik)' },
                                        { value: 'Tabakalı', label: 'Tabakalı (Gruplandırılmış / Eşit Dağılım)' },
                                        { value: 'Küme', label: 'Blok/Küme (Kümeleri seç / tüm kayıtları al)' },
                                        { value: 'MUS', label: 'Parasal Birim Örneklemesi (MUS)' }
                                    ]}
                                />

                                <div className="mt-3 bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded text-xs text-indigo-800 space-y-2">
                                    <p><strong>Neyi Seçmeliyim?</strong></p>
                                    {samplingMethod === 'Yargısal' && <p>Denetçi inisiyatifiyle filtreleri uyuyan <u>en riskli kayıtlar</u> (Orn: En yüksek bakiye veya gecikme) doğrudan seçilir.</p>}
                                    {samplingMethod === 'Rastgele' && <p>Filtreden geçen tüm kayıtlar torbaya atılır ve bilgisayar tarafından <u>tamamen tesadüfî</u> bir seçim yapılır.</p>}
                                    {samplingMethod === 'Sistematik' && <p>Kayıtlar sıraya dizilir. Örneğin 100 kişi havuzda var ve 10 kişi seçeceksiniz; her 10. kaydı (10., 20., 30.) <u>periyodik sıçramayla</u> seçer.</p>}
                                    {samplingMethod === 'Tabakalı' && <p>Popülasyonu belirli bir özelliğe göre böler (Örn: Şube). İstenilen örneklemi (Örn: 50 kişi) <u>kendi içinde adil dağıtarak</u> tesadüfi çeker.</p>}
                                    {samplingMethod === 'Küme' && <p>Popülasyonu doğal kümelere böler (şube, bölge, dönem). Rastgele kümeler seçilir ve seçilen kümelerin <u>tüm kayıtları</u> örnekleme dahil edilir.</p>}
                                    {samplingMethod === 'MUS' && <p>Kaydın <u>parasal büyüklüğüne</u> göre seçim şansının arttığı, yüksek bakiyeli işlemleri yakalamaya odaklı istatistiksel metot.</p>}
                                </div>
                            </div>

                            {(samplingMethod === 'Tabakalı' || samplingMethod === 'Küme') && (
                                <div className="form-group border-l-4 border-blue-400 pl-4 py-1 animate-fadeIn">
                                    <label className="form-label text-blue-800 font-semibold mb-2">
                                        {samplingMethod === 'Küme' ? 'Hangi Kolona Göre Kümelenecek? *' : 'Hangi Kolona Göre Gruplanacak (Tabaka)? *'}
                                    </label>
                                    <CustomSelect
                                        value={stratifiedColumn}
                                        onChange={(v) => setStratifiedColumn(v as string)}
                                        options={mockColumns.map(c => ({ value: c, label: c }))}
                                        placeholder={samplingMethod === 'Küme' ? 'Örn: Şube, Bölge, Dönem...' : 'Örn: Bölge, Şube, Çalışan...'}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {samplingMethod === 'Küme'
                                            ? `Rastgele kümeler seçilecek ve her kümenin tüm kayıtları örnekleme dahil edilecektir.`
                                            : `Toplam ${formatNumber(sampleSize)} adet örneklem, bu kolondaki gruplara eşit olarak bölüştürülecektir.`
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <CustomSelect
                                        label="Güven Düzeyi %"
                                        value={String(confidenceLevel)}
                                        onChange={(v) => setConfidenceLevel(parseInt(v as string))}
                                        options={[
                                            { value: '90', label: '%90' },
                                            { value: '95', label: '%95' },
                                            { value: '99', label: '%99' }
                                        ]}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hata Payı %</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        className="form-input"
                                        value={errorRate}
                                        onChange={(e) => setErrorRate(parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Alınacak Örneklem Sayısı (n)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="5"
                                        max="1000"
                                        step="5"
                                        className="flex-1 accent-primary"
                                        value={sampleSize}
                                        onChange={(e) => setSampleSize(parseInt(e.target.value))}
                                    />
                                    <div className="w-20 bg-blue-50 border border-blue-200 rounded text-center py-2 font-bold text-blue-700 text-lg">
                                        {formatNumber(sampleSize)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-6 text-lg">
                                <AlertCircle size={20} className="text-primary" /> Seçim Senaryosu Özeti
                            </h4>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li className="flex gap-3 items-start justify-between">
                                    <span className="font-medium text-gray-500">Hedef Popülasyon:</span>
                                    <span className="text-gray-900 font-medium text-right">{populationName || 'Belirtilmedi'}<br /><span className="text-xs text-gray-500 font-normal">({formatNumber(rowCount)} Toplam Kayıt)</span></span>
                                </li>
                                <li className="flex gap-3 items-center justify-between">
                                    <span className="font-medium text-gray-500">Güven / Hata:</span>
                                    <span className="text-gray-900 font-medium">%{confidenceLevel} / %{errorRate}</span>
                                </li>
                                <li className="flex gap-3 items-center justify-between">
                                    <span className="font-medium text-gray-500">Uygulanan Filtreler:</span>
                                    <span className="text-gray-900 font-medium">{rules.length} Adet Kural</span>
                                </li>
                                <li className="flex gap-3 items-center justify-between">
                                    <span className="font-medium text-gray-500">Seçim Yaklaşımı:</span>
                                    <span className="text-gray-900 font-medium">{samplingMethod}</span>
                                </li>
                                <li className="flex gap-3 items-center justify-between pt-4 border-t border-gray-300 mt-4">
                                    <span className="font-bold text-gray-800">Nihai Örneklem Çıktısı:</span>
                                    <span className="text-primary font-black text-2xl">{formatNumber(sampleSize)} Adet</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

const formatNumber = (val: number | string) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (val: string) => {
    return val.replace(/\./g, '');
};
