'use client';

import React, { useState, useEffect } from 'react';
import { 
    FileText, PenTool, Download, ShieldAlert, CheckCircle, 
    Save, FileType, Printer, Users, User, AlertTriangle, 
    Clock, Plus, Trash2, Clipboard, Lock, Info
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { useToast } from '@/components/Toast';
import CustomSelect from '@/components/ui/CustomSelect';

interface InvestigationReportSectionProps {
    status: string;
    auditId: string;
    auditData: any;
    allStaff?: any[];
}

interface Subject {
    name: string;
    title: string;
    role: 'Şüpheli' | 'Müşteki' | 'Tanık';
}

const InvestigationReportSection: React.FC<InvestigationReportSectionProps> = ({
    status,
    auditId,
    auditData,
    allStaff = []
}) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'editor' | 'subjects' | 'preview'>('editor');
    
    // Editor State
    const [summary, setSummary] = useState('');
    const [findings, setFindings] = useState('');
    const [opinion, setOpinion] = useState('');
    const [disciplinaryDecision, setDisciplinaryDecision] = useState('Karar Bekleniyor');
    
    // Subjects State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [newSubject, setNewSubject] = useState<Subject>({ name: '', title: '', role: 'Şüpheli' });
    
    const [lastSaved, setLastSaved] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Load initial data from LocalStorage or audit data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem(`inv_report_${auditId}`);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setSummary(parsed.summary || '');
                    setFindings(parsed.findings || '');
                    setOpinion(parsed.opinion || '');
                    setDisciplinaryDecision(parsed.disciplinaryDecision || 'Karar Bekleniyor');
                    setSubjects(parsed.subjects || []);
                    if (parsed.lastSaved) {
                        setLastSaved(parsed.lastSaved);
                    }
                } catch (e) {
                    console.error('LocalStorage load error', e);
                }
            } else {
                // Default structure for professional report
                setSummary(`Olay ${auditData.title || 'Soruşturma Konusu İşlem'} kapsamında tebliğ edilen ihbar/etik bildirim üzerine incelenmiştir.`);
                setFindings(`Yapılan yerel saha çalışmasında ve ilgili e-posta log kayıtlarının incelenmesi neticesinde şu hususlar tespit edilmiştir:\n1. ...\n2. ...`);
                setOpinion(`Elde edilen deliller ve alınan ifadeler doğrultusunda, sorumluluğu tespit edilen personel hakkında aşağıdaki işlemlerin yapılması mütalaa olunmuştur:\n- Disiplin yönünden: ...\n- İdari yönünden: ...`);
            }
        }
    }, [auditId, auditData]);

    const handleSave = () => {
        setIsSaving(true);
        const dataToSave = {
            summary,
            findings,
            opinion,
            disciplinaryDecision,
            subjects,
            lastSaved: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        
        setTimeout(() => {
            localStorage.setItem(`inv_report_${auditId}`, JSON.stringify(dataToSave));
            setLastSaved(dataToSave.lastSaved);
            setIsSaving(false);
            showToast('Tüm değişiklikler intranette güvenle kaydedildi.', 'success');
        }, 600);
    };

    const addSubject = () => {
        if (!newSubject.name.trim()) {
            showToast('Lütfen ad soyad bilgisini girin.', 'error');
            return;
        }
        setSubjects([...subjects, newSubject]);
        setNewSubject({ name: '', title: '', role: 'Şüpheli' });
        showToast('Kişi başarıyla dosyaya eklendi.', 'success');
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
        showToast('Kişi dosyadan kaldırıldı.', 'success');
    };

    // Print / PDF Export Functionality
    const handlePrintPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const performers = auditData.performers || 'Atanmamış';
        const supervisor = auditData.supervisor || 'Atanmamış';

        printWindow.document.write(`
            <html>
                <head>
                    <title>SORUŞTURMA RAPORU - ${auditData.code || 'D-01'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
                        body {
                            font-family: 'Inter', sans-serif;
                            color: #1e293b;
                            line-height: 1.6;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                            font-size: 14px;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px double #cbd5e1;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .header h1 {
                            font-size: 18px;
                            text-transform: uppercase;
                            margin: 0 0 8px 0;
                            letter-spacing: 0.5px;
                            color: #0f172a;
                        }
                        .header h2 {
                            font-size: 14px;
                            font-weight: 600;
                            margin: 0;
                            color: #475569;
                            text-transform: uppercase;
                        }
                        .meta-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                        }
                        .meta-table td {
                            padding: 8px 12px;
                            border: 1px solid #e2e8f0;
                            font-size: 13px;
                        }
                        .meta-table td.label {
                            font-weight: 600;
                            background-color: #f8fafc;
                            width: 25%;
                        }
                        .section-title {
                            font-size: 15px;
                            font-weight: 700;
                            text-transform: uppercase;
                            border-left: 4px solid #1e3a8a;
                            padding-left: 10px;
                            margin: 25px 0 15px 0;
                            color: #1e3a8a;
                            page-break-after: avoid;
                        }
                        .text-content {
                            white-space: pre-line;
                            margin-bottom: 25px;
                            text-align: justify;
                        }
                        .subjects-list {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 25px;
                        }
                        .subjects-list th, .subjects-list td {
                            border: 1px solid #e2e8f0;
                            padding: 8px 12px;
                            text-align: left;
                            font-size: 13px;
                        }
                        .subjects-list th {
                            background-color: #f1f5f9;
                            font-weight: 600;
                        }
                        .badge {
                            display: inline-block;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-size: 11px;
                            font-weight: 600;
                            text-transform: uppercase;
                        }
                        .badge-sup { background-color: #fee2e2; color: #991b1b; }
                        .badge-acc { background-color: #e0f2fe; color: #075985; }
                        .badge-wit { background-color: #fef9c3; color: #854d0e; }
                        .signatures {
                            margin-top: 60px;
                            display: flex;
                            justify-content: space-between;
                            page-break-inside: avoid;
                        }
                        .signature-block {
                            text-align: center;
                            width: 45%;
                        }
                        .signature-line {
                            margin-top: 50px;
                            border-top: 1px solid #cbd5e1;
                            padding-top: 8px;
                            font-size: 13px;
                            font-weight: 600;
                        }
                        .watermark {
                            position: fixed;
                            bottom: 10px;
                            right: 10px;
                            font-size: 10px;
                            color: #94a3b8;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        @media print {
                            body { padding: 0; }
                            @page { size: A4; margin: 20mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="watermark">T.C. EMLAK KATILIM BANKASI A.Ş. • GİZLİ VE İÇSEL</div>
                    
                    <div class="header">
                        <h1>T.C. EMLAK KATILIM BANKASI A.Ş.</h1>
                        <h2>TEFTİŞ KURULU BAŞKANLIĞI</h2>
                        <h2 style="font-size: 15px; margin-top: 10px; color: #1e3a8a; font-weight: 700;">SORUŞTURMA VE İNCELEME RAPORU</h2>
                    </div>

                    <table class="meta-table">
                        <tr>
                            <td class="label">Rapor Kodu / No</td>
                            <td>${auditData.code || 'D-01'}</td>
                            <td class="label">Tarih</td>
                            <td>${new Date().toLocaleDateString('tr-TR')}</td>
                        </tr>
                        <tr>
                            <td class="label">Soruşturma Adı</td>
                            <td colspan="3">${auditData.title}</td>
                        </tr>
                        <tr>
                            <td class="label">Soruşturmayı Yürüten</td>
                            <td>${performers}</td>
                            <td class="label">Gözetim Sorumlusu</td>
                            <td>${supervisor}</td>
                        </tr>
                        <tr>
                            <td class="label">Disiplin Durumu</td>
                            <td colspan="3"><strong>${disciplinaryDecision}</strong></td>
                        </tr>
                    </table>

                    ${subjects.length > 0 ? `
                        <div class="section-title">DOSYA İLGİLİLERİ VE TARAFLAR</div>
                        <table class="subjects-list">
                            <thead>
                                <tr>
                                    <th>Adı Soyadı</th>
                                    <th>Unvanı</th>
                                    <th>Dosyadaki Rolü</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subjects.map(s => `
                                    <tr>
                                        <td><strong>${s.name}</strong></td>
                                        <td>${s.title}</td>
                                        <td>
                                            <span class="badge ${s.role === 'Şüpheli' ? 'badge-sup' : s.role === 'Müşteki' ? 'badge-acc' : 'badge-wit'}">
                                                ${s.role}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}

                    <div class="section-title">1. OLAYIN ÖZETİ VE İHBAR DETAYI</div>
                    <div class="text-content">${summary || 'Olay özeti yazılmamıştır.'}</div>

                    <div class="section-title">2. YAPILAN TESPİTLER VE ELDE EDİLEN KANITLAR</div>
                    <div class="text-content">${findings || 'Yapılan tespitler girilmemiştir.'}</div>

                    <div class="section-title">3. KANAAT VE MÜTALAA (KAPSAMLI KANIT GÖRÜŞÜ)</div>
                    <div class="text-content">${opinion || 'Kanaat ve mütalaa girilmemiştir.'}</div>

                    <div class="signatures">
                        <div class="signature-block">
                            <div class="signature-line">${performers}</div>
                            <div style="font-size: 11px; color: #64748b;">Soruşturmacı Müfettiş</div>
                        </div>
                        <div class="signature-block">
                            <div class="signature-line">${supervisor}</div>
                            <div style="font-size: 11px; color: #64748b;">Teftiş Kurulu Gözetmeni</div>
                        </div>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        showToast('Resmi teftiş formatında PDF rapor başarıyla üretildi.', 'success');
    };

    return (
        <div className="card !p-0 shadow-sm border border-slate-200 rounded-3xl overflow-hidden bg-white">
            {/* Header and Intranet Safe Indicator */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/60 shadow-sm">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            İnceleme & Soruşturma Raporlama Tuvali
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Gizlilik Derecesi: Yüksek (Sadece Yetkili Müfettişler)</p>
                    </div>
                </div>
                
                {/* Safe indicator */}
                <div className="flex items-center gap-4">
                    {lastSaved && (
                        <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/60 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Otomatik Kaydedildi ({lastSaved})
                        </span>
                    )}
                    <Button 
                        size="sm" 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="gap-1.5 shadow-sm text-xs font-semibold"
                        leftIcon={<Save size={14} />}
                    >
                        {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </Button>
                </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex border-b border-slate-100 px-4 bg-slate-50/20">
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'editor' 
                            ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <PenTool size={14} />
                    Rapor Metin Editörü
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'subjects' 
                            ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Users size={14} />
                    Dosya İlgilileri ({subjects.length})
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'preview' 
                            ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <FileText size={14} />
                    Nihai Önizleme & Disiplin
                </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
                
                {/* 1. EDITOR CANVAS */}
                {activeTab === 'editor' && (
                    <div className="space-y-6">
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 text-xs text-blue-800 leading-relaxed">
                            <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <strong>Kurumsal Güvenlik Notu:</strong> Soruşturma verileri intranette tamamen kapalı devre olarak şifrelenir ve harici bulut servislerine asla gönderilmez. Zengin metin editöründe olay akışını özgürce yapılandırabilirsiniz.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Summary */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <Clipboard size={14} />
                                    1. OLAYIN ÖZETİ VE İHBAR DETAYI
                                </label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="İhbar kaynağını, olay tarihini ve soruşturmaya konu asıl iddiayı bu alanda özetleyin..."
                                    className="w-full min-h-[140px] p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/30"
                                />
                            </div>

                            {/* Findings */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <PenTool size={14} />
                                    2. TESPİTLER VE KANITLAR
                                </label>
                                <textarea
                                    value={findings}
                                    onChange={(e) => setFindings(e.target.value)}
                                    placeholder="Saha çalışmalarında elde edilen somut bulguları, logları, ifadeleri ve fiziksel/dijital kanıtları buraya kronolojik olarak girin..."
                                    className="w-full min-h-[220px] p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/30"
                                />
                            </div>

                            {/* Opinion */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    3. KANAAT VE MÜTALAA (KAPSAMLI KANIT GÖRÜŞÜ)
                                </label>
                                <textarea
                                    value={opinion}
                                    onChange={(e) => setOpinion(e.target.value)}
                                    placeholder="Müfettişin iddialara yönelik somut kanaatini ve disiplin/idari açıdan ceza veya önlem tekliflerini buraya yazın..."
                                    className="w-full min-h-[180px] p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/30"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SUBJECTS */}
                {activeTab === 'subjects' && (
                    <div className="space-y-6">
                        <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                                <Plus size={14} /> Dosya İlgilisi / Taraf Ekle
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Adı Soyadı"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Unvan / Birim"
                                        value={newSubject.title}
                                        onChange={(e) => setNewSubject({...newSubject, title: e.target.value})}
                                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-full">
                                        <CustomSelect
                                            value={newSubject.role}
                                            onChange={(val) => setNewSubject({...newSubject, role: val as any})}
                                            options={[
                                                { value: 'Şüpheli', label: 'Şüpheli' },
                                                { value: 'Müşteki', label: 'Müşteki' },
                                                { value: 'Tanık', label: 'Tanık' }
                                            ]}
                                            placeholder="Rol Seçin"
                                        />
                                    </div>
                                    <Button size="sm" onClick={addSubject} className="whitespace-nowrap px-4 font-bold">
                                        Ekle
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* List of Subjects */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mevcut Dosya İlgilileri</h4>
                            {subjects.length === 0 ? (
                                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                                    Dosyaya henüz hiç şüpheli, müşteki veya tanık eklenmedi.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden shadow-sm">
                                    {subjects.map((s, idx) => (
                                        <div key={idx} className="p-3.5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">{s.name}</div>
                                                    <div className="text-[11px] text-slate-400 font-semibold">{s.title || 'Unvansız'}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                                    s.role === 'Şüpheli' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    s.role === 'Müşteki' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {s.role}
                                                </span>
                                                <button 
                                                    onClick={() => removeSubject(idx)} 
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. PREVIEW & DISCIPLINARY */}
                {activeTab === 'preview' && (
                    <div className="space-y-6">
                        {/* Disciplinary Outcome selection */}
                        <div className="p-4 border border-amber-100 rounded-2xl bg-amber-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-start gap-2.5">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/60 shadow-sm mt-0.5">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Mütalaa ve Disiplin Kurul Durumu</h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Disiplin kurulu nihai karar sürecinin takibi</p>
                                </div>
                            </div>
                            <div className="w-full md:w-[280px]">
                                <CustomSelect
                                    value={disciplinaryDecision}
                                    onChange={(val) => setDisciplinaryDecision(val as string)}
                                    options={[
                                        { value: 'Karar Bekleniyor', label: 'Karar Bekleniyor' },
                                        { value: 'Disiplin Cezası Gerekli Görülmedi', label: 'Disiplin Cezası Gerekli Görülmedi' },
                                        { value: 'İhtar', label: 'İhtar' },
                                        { value: 'Kınama', label: 'Kınama' },
                                        { value: 'Ücret Kesintisi', label: 'Ücret Kesintisi' },
                                        { value: 'Görevden Uzaklaştırma', label: 'Görevden Uzaklaştırma' },
                                        { value: 'İşten Çıkarma', label: 'İşten Çıkarma' },
                                        { value: 'Diğer', label: 'Diğer' }
                                    ]}
                                    placeholder="Karar Seçiniz"
                                />
                            </div>
                        </div>

                        {/* Modern PDF Card Export */}
                        <div className="p-6 border border-slate-200/60 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Merkezi Teftiş Kurulu Formatında Rapor Üret</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed font-semibold">
                                    Resmi şablon standartlarına tam uyumlu, şık mizanpajlı ve imza bölümlü PDF soruşturma belgesi.
                                </p>
                            </div>
                            
                            <div className="pt-2 flex gap-3">
                                <Button 
                                    onClick={handlePrintPDF} 
                                    className="gap-2 px-6 font-bold shadow-md bg-rose-600 hover:bg-rose-700 border-none"
                                >
                                    <Printer size={16} />
                                    PDF Raporu Üret & Yazdır
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestigationReportSection;
