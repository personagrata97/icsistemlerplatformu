'use client';

import React, { useState, useEffect } from 'react';
import { 
    FileText, PenTool, ShieldAlert, CheckCircle, 
    Save, Printer, Users, User, AlertTriangle, 
    Plus, Trash2, Clipboard, Info, Activity,
    DollarSign, Briefcase, Lock
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/Toast';
import CustomSelect from '@/components/ui/CustomSelect';
import { auditApi } from '@/lib/audit-api';
import { DISCIPLINARY_ACTIONS } from '@/lib/audit-utils';
import Tooltip from '@/components/ui/Tooltip';

interface InvestigationReportSectionProps {
    status: string;
    auditId: string;
    auditData: any;
    allStaff?: any[];
}

interface Subject {
    name: string;
    title: string;
    role: 'İncelenen' | 'İhbarcı' | 'Bilgisine Başvurulan';
}

const InvestigationReportSection: React.FC<InvestigationReportSectionProps> = ({
    status,
    auditId,
    auditData,
    allStaff = []
}) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'metadata' | 'editor' | 'preview'>('metadata');
    
    // Editor State (Drafts)
    const [summary, setSummary] = useState('');
    const [findings, setFindings] = useState('');
    const [opinion, setOpinion] = useState('');
    
    // ACFE Structural Fields
    const [fraudType, setFraudType] = useState(auditData.fraudType || '');
    const [financialImpact, setFinancialImpact] = useState<number | ''>(auditData.financialImpact ? Number(auditData.financialImpact) : '');
    const [currency, setCurrency] = useState(auditData.currency || 'TRY');
    const [disciplinaryDecision, setDisciplinaryDecision] = useState(auditData.disciplinaryAction || 'Karar Bekleniyor');
    
    // Subjects State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [newSubject, setNewSubject] = useState<Subject>({ name: '', title: '', role: 'İncelenen' });
    
    const [lastSaved, setLastSaved] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Load initial data from DB and LocalStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Priority: Local storage for drafts
            const savedData = localStorage.getItem(`inv_report_${auditId}`);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setSummary(parsed.summary || '');
                    setFindings(parsed.findings || '');
                    setOpinion(parsed.opinion || '');
                    if (parsed.lastSaved) {
                        setLastSaved(parsed.lastSaved);
                    }
                } catch (e) {
                    console.error('LocalStorage load error', e);
                }
            } else {
                setSummary(
                    auditData.title?.includes('Eskişehir') 
                    ? `Teftiş Kurulu Müdürlüğüne 12.01.2026 tarihinde gelen e-postada; Eskişehir Şubesi'nde çalışan Ahmet Veli'nin (sicil no 123) müşteri adına evrak düzenlediğine dair şikayet tarafımıza iletilmiştir.`
                    : auditData.title?.includes('CRM') 
                    ? `Teftiş Kurulu Müdürlüğünün 05.02.2026 tarihli görevlendirmesine istinaden; Bankamız CRM (Müşteri İlişkileri Yönetimi) uygulamasında kullanıcı yetki tanımları ve onay mekanizmalarının güncel durumu ve işlem logları incelenmiştir.`
                    : `Olay, ${auditData.title || 'Soruşturma Konusu İşlem'} kapsamında tebliğ edilen ihbar/etik bildirim üzerine incelenmiştir.`
                );
                setFindings(
                    auditData.title?.includes('Eskişehir')
                    ? `Eskişehir Şubesi'nde, imza mutabakatsızlığı bulunan tasarruf finansman sözleşmesine ait evraka ilişkin tarihlerin görüntüsünün izlenmesi neticesinde;\n1. İlgili sözleşmenin 07.01.2026 tarihi saat 13.10'da yazdırıldığı, imzalanan sözleşmenin ise CRM uygulamamıza aynı tarihte saat 13.50'de yüklendiği,\n2. 321 numaralı müşterinin o saat aralığında şubeye hiç gelmediği ve Ahmet Veli isimli çalışanın yazıcıdan aldığı evrakı kendi masasında müşteri adına imzalayarak CRM uygulamamıza yüklediği\ngörülmüştür.`
                    : auditData.title?.includes('CRM')
                    ? `CRM uygulamasında yapılan teknik ve yerel incelemelerde aşağıdaki tespitlere ulaşılmıştır:\n1. İş akdi feshedilen 15 personelin aktif CRM yetkilerinin manuel olarak kapatılmadığı,\n2. Kredi kullandırım süreçlerinde "Şube Müdürü Onayı" adımının sistemsel bir zafiyet nedeniyle bazı operasyonlarda pas geçilebildiği,\n3. Kritik müşteri verilerinden olan iletişim (telefon) numarası güncelleme işlemlerinde, çift onay (maker-checker) kuralının uygulanmadığı ve tek personelin serbestçe değişiklik yapabildiği\ntespit edilmiştir.`
                    : `Yapılan yerel saha çalışmasında ve ilgili sistem log kayıtlarının incelenmesi neticesinde somut bulgulara ulaşılmış ve ekler tablosunda sunulmuştur.`
                );
                setOpinion(
                    auditData.title?.includes('Eskişehir')
                    ? `Ahmet Veli isimli çalışanın yazılı ifadesinde; "Bunu prim kazanabilmek için yaptığını ve pişman olduğunu" belirtmesi ve kamera kayıtları ile evrak loglarının uyuşması neticesinde çalışanın mütamadiyen kusurlu olduğu kanaatine varılmıştır.`
                    : auditData.title?.includes('CRM')
                    ? `Elde edilen bulgular doğrultusunda;\n- Kurumdan ayrılan personelin yetkilerinin İK-BT entegrasyonuyla otomatik iptal edilmesi,\n- "Şube Müdürü Onayı" adımındaki sistemsel açığın acilen yamanması,\n- Telefon no güncelleme işlemlerine ivedilikle çift onay (maker-checker) kuralı getirilmesi,\n- İşbu teknik zafiyetlerin giderilmesi adına Bilgi Teknolojileri Müdürlüğü'ne bulgu kaydı açılması\nkanaatine varılmıştır.`
                    : `Elde edilen deliller ve alınan yazılı ifadeler doğrultusunda, sorumluluğu tespit edilen personel hakkında Kurum disiplin politikaları çerçevesinde işlem yapılması kanaatine varılmıştır.`
                );
            }

            // DB data for analytical fields
            if (auditData.involvedParties) {
                try {
                    setSubjects(JSON.parse(auditData.involvedParties));
                } catch (e) {
                    console.error("Failed to parse involved parties", e);
                }
            }
        }
    }, [auditId, auditData]);

    const handleSave = async () => {
        setIsSaving(true);
        
        // 1. Save drafts to LocalStorage (for rich text)
        const dataToDraft = {
            summary,
            findings,
            opinion,
            lastSaved: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        localStorage.setItem(`inv_report_${auditId}`, JSON.stringify(dataToDraft));

        // 2. Save structural fields to Backend DB
        try {
            await auditApi.updateAudit(auditId, {
                fraudType,
                financialImpact: financialImpact === '' ? null : Number(financialImpact),
                currency,
                disciplinaryAction: disciplinaryDecision,
                involvedParties: JSON.stringify(subjects)
            });

            setLastSaved(dataToDraft.lastSaved);
            showToast('Değişiklikler veritabanına ve yerel önbelleğe güvenle kaydedildi.', 'success');
        } catch (error) {
            console.error('Failed to save investigation metadata', error);
            showToast('Veritabanına kaydetme sırasında bir hata oluştu.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addSubject = () => {
        if (!newSubject.name.trim()) {
            showToast('Lütfen ad soyad bilgisini girin.', 'error');
            return;
        }
        setSubjects([...subjects, newSubject]);
        setNewSubject({ name: '', title: '', role: 'İncelenen' });
        showToast('Kişi başarıyla dosyaya eklendi.', 'success');
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
        showToast('Kişi dosyadan kaldırıldı.', 'success');
    };

    const handleCreateSystemicFinding = () => {
        // Trigger external modal or route logic to create a finding from this investigation
        showToast('Bulgu oluşturma paneline yönlendiriliyorsunuz...', 'info');
        // This relies on the parent component's state, but for now we simulate the interaction:
        const event = new CustomEvent('openFindingModalFromInvestigation', { detail: { auditId } });
        window.dispatchEvent(event);
    };

    // Print / PDF Export Functionality
    const handlePrintPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const performers = auditData.performers || 'Atanmamış';
        const supervisor = auditData.supervisor || 'Atanmamış';
        const impactTxt = financialImpact ? Number(financialImpact).toLocaleString('tr-TR') + ' ' + currency : 'Yok / Belirsiz';
        
        let subjectsHtml = '';
        if (subjects.length > 0) {
            subjectsHtml = [
                '<div class="section-title">DOSYA İLGİLİLERİ</div>',
                '<table class="subjects-list">',
                '<thead><tr><th>Adı Soyadı</th><th>Ünvanı</th><th>Rolü</th></tr></thead>',
                '<tbody>',
                subjects.map(s => '<tr><td><strong>' + s.name + '</strong></td><td>' + s.title + '</td><td>' + s.role + '</td></tr>').join(''),
                '</tbody></table>'
            ].join('');
        }

        const html = [
            '<html><head><meta charset="UTF-8">',
            '<title>SORUŞTURMA RAPORU - ' + (auditData.code || 'D-01') + '</title>',
            '<style>',
            "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');",
            "body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; }",
            ".header { text-align: center; border-bottom: 2px double #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }",
            ".header h1 { font-size: 18px; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; color: #0f172a; }",
            ".meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }",
            ".meta-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 13px; }",
            ".meta-table td.label { font-weight: 600; background-color: #f8fafc; width: 25%; }",
            ".section-title { font-size: 15px; font-weight: 700; text-transform: uppercase; border-left: 4px solid #1e3a8a; padding-left: 10px; margin: 25px 0 15px 0; color: #1e3a8a; }",
            ".text-content { white-space: pre-line; margin-bottom: 25px; text-align: justify; }",
            ".subjects-list { width: 100%; border-collapse: collapse; margin-bottom: 25px; }",
            ".subjects-list th, .subjects-list td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }",
            ".subjects-list th { background-color: #f1f5f9; font-weight: 600; }",
            ".signatures { margin-top: 60px; display: flex; justify-content: space-between; page-break-inside: avoid; }",
            ".signature-block { text-align: center; width: 45%; }",
            ".signature-line { margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 13px; font-weight: 600; }",
            '</style></head><body>',
            '<div class="header"><h1>T.C. EMLAK KATILIM BANKASI A.Ş.</h1><h2 style="font-size: 15px; margin-top: 10px; color: #1e3a8a;">SORUŞTURMA VE İNCELEME RAPORU</h2></div>',
            '<table class="meta-table"><tr><td class="label">Rapor No</td><td>' + (auditData.code || 'D-01') + '</td><td class="label">Tarih</td><td>' + new Date().toLocaleDateString('tr-TR') + '</td></tr>',
            '<tr><td class="label">Olay Türü</td><td>' + (fraudType || 'Belirtilmedi') + '</td><td class="label">Zarar Tutarı</td><td>' + impactTxt + '</td></tr>',
            '<tr><td class="label">Disiplin Durumu</td><td colspan="3"><strong>' + disciplinaryDecision + '</strong></td></tr></table>',
            subjectsHtml,
            '<div class="section-title">1. OLAYIN ÖZETİ</div><div class="text-content">' + (summary || '-') + '</div>',
            '<div class="section-title">2. TESPİTLER VE KANITLAR</div><div class="text-content">' + (findings || '-') + '</div>',
            '<div class="section-title">3. KANAAT VE MÜTALAA</div><div class="text-content">' + (opinion || '-') + '</div>',
            '<div class="signatures"><div class="signature-block"><div class="signature-line">' + performers + '</div><div style="font-size: 11px; color: #64748b;">Soruşturmacı Müfettiş</div></div>',
            '<div class="signature-block"><div class="signature-line">' + supervisor + '</div><div style="font-size: 11px; color: #64748b;">Teftiş Kurulu Gözetmeni</div></div></div>',
            '<script>window.onload = function() { window.print(); };</script>',
            '</body></html>'
        ].join('\n');

        printWindow.document.write(html);
        printWindow.document.close();
        showToast('Resmi teftiş formatında PDF rapor başarıyla üretildi.', 'success');
    };

    return (
        <div className="card !p-0 shadow-sm border border-slate-200 rounded-3xl overflow-hidden bg-white">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/60 shadow-sm">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            İnceleme & Soruşturma Raporlama Merkezi
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                            <Lock size={12} className="text-rose-500" />
                            Gizlilik Derecesi: Çok Gizli (KVKK / Suistimal)
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {lastSaved && (
                        <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/60 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Senkronize ({lastSaved})
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
                    onClick={() => setActiveTab('metadata')}
                    className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'metadata' 
                            ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Briefcase size={15} />
                    1. Olay Künyesi & İlgililer
                </button>
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'editor' 
                            ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <PenTool size={15} />
                    2. İnceleme ve Çözümlemeler
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                        activeTab === 'preview' 
                            ? 'border-primary text-primary bg-primary/5 rounded-t-lg' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Activity size={15} />
                    3. Sonuç ve Öneriler
                </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
                
                {/* STAGE 1: METADATA & SUBJECTS */}
                {activeTab === 'metadata' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Analytical Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <AlertTriangle size={14} className="text-amber-500" /> Suistimal Türü
                                </label>
                                <CustomSelect
                                    value={fraudType}
                                    onChange={(val) => setFraudType(val as string)}
                                    options={[
                                        { value: 'Zimmet', label: 'Zimmet' },
                                        { value: 'Bilgi Sızdırma / KVKK', label: 'Bilgi Sızdırma / KVKK' },
                                        { value: 'Çıkar Çatışması', label: 'Çıkar Çatışması' },
                                        { value: 'Rüşvet ve Yolsuzluk', label: 'Rüşvet ve Yolsuzluk' },
                                        { value: 'Taciz / Mobbing', label: 'Taciz / Mobbing' },
                                        { value: 'Operasyonel Hata', label: 'Operasyonel Hata' },
                                        { value: 'Diğer', label: 'Diğer' }
                                    ]}
                                    placeholder="Tür Seçiniz"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <DollarSign size={14} className="text-emerald-500" /> Finansal Etki / Zarar
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={financialImpact}
                                        onChange={(e) => setFinancialImpact(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <div className="w-[100px]">
                                        <CustomSelect
                                            value={currency}
                                            onChange={(val) => setCurrency(val as string)}
                                            options={[
                                                { value: 'TRY', label: 'TRY' },
                                                { value: 'USD', label: 'USD' },
                                                { value: 'EUR', label: 'EUR' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <Activity size={14} className="text-rose-500" /> Olası Disiplin Önerisi
                                </label>
                                <CustomSelect
                                    value={disciplinaryDecision}
                                    onChange={(val) => setDisciplinaryDecision(val as string)}
                                    options={DISCIPLINARY_ACTIONS}
                                    placeholder="Disiplin Kararı"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        {/* Subjects */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Users size={16} className="text-primary" /> Dosya İlgilileri ve İfade Sahipleri
                                </h4>
                            </div>

                            <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="md:col-span-1">
                                        <input
                                            type="text"
                                            placeholder="Adı Soyadı"
                                            value={newSubject.name}
                                            onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                                            className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <input
                                            type="text"
                                            placeholder="Ünvan / Birim"
                                            value={newSubject.title}
                                            onChange={(e) => setNewSubject({...newSubject, title: e.target.value})}
                                            className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <CustomSelect
                                            value={newSubject.role}
                                            onChange={(val) => setNewSubject({...newSubject, role: val as any})}
                                            options={[
                                                { value: 'İncelenen', label: 'İncelenen' },
                                                { value: 'İhbarcı', label: 'İhbarcı' },
                                                { value: 'Bilgisine Başvurulan', label: 'Bilgisine Başvurulan' }
                                            ]}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Button onClick={addSubject} className="w-full font-bold shadow-sm" leftIcon={<Plus size={14} />}>
                                            Listeye Ekle
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Subjects List */}
                            {subjects.length === 0 ? (
                                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                                    Dosyaya henüz taraf veya ifade sahibi eklenmedi.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {subjects.map((s, idx) => (
                                        <div key={idx} className="p-3.5 border border-slate-100 rounded-xl bg-white flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{s.name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                            s.role === 'İncelenen' ? 'bg-red-50 text-red-600' :
                                                            s.role === 'İhbarcı' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-amber-50 text-amber-600'
                                                        }`}>
                                                            {s.role}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 font-medium">{s.title || 'Ünvan Belirtilmedi'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Tooltip content="Listeden Sil">
                                                <button 
                                                    onClick={() => removeSubject(idx)} 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STAGE 2: EDITOR CANVAS */}
                {activeTab === 'editor' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 text-xs text-blue-800 leading-relaxed">
                            <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <strong>Kurumsal Güvenlik Notu:</strong> Soruşturma metinleri harici bulut servislerine veya yapay zekaya gönderilmez. Zengin metin editöründe kronolojik akışı yapılandırabilirsiniz.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <Clipboard size={14} /> 1. OLAYLAR VE SAVLAR
                                </label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="Soruşturmaya/İncelemeye konu olaylar ve savlar..."
                                    className="w-full min-h-[140px] p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <PenTool size={14} /> 2. İNCELEME VE ÇÖZÜMLEMELER
                                </label>
                                <textarea
                                    value={findings}
                                    onChange={(e) => setFindings(e.target.value)}
                                    placeholder="İnceleme yöntemi, elde edilen kanıtlar, yazılı ifadeler ve ulaşılan tespitler..."
                                    className="w-full min-h-[220px] p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                    <CheckCircle size={14} /> 3. SONUÇ VE KANAAT
                                </label>
                                <textarea
                                    value={opinion}
                                    onChange={(e) => setOpinion(e.target.value)}
                                    placeholder="Müfettişin nihai kanaati ve sonuç bölümü..."
                                    className="w-full min-h-[160px] p-4 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/30"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STAGE 3: PREVIEW & SYSTEMIC ACTIONS */}
                {activeTab === 'preview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        
                        {/* Systemic Finding Trigger */}
                        <div className="p-6 border border-primary/20 rounded-3xl bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 shrink-0">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Sistemik Zafiyet Tespit Edildi Mi?</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-lg font-medium">
                                        Eğer bu suistimal olayının temelinde kurumsal bir süreç veya Bilgi Teknolojileri kontrol zafiyeti tespit ettiyseniz, 
                                        bu durumu ilgili birimlere <strong>resmi bir bulgu olarak</strong> raporlamalısınız. 
                                        Personel disiplin süreci tamamlansa dahi, tespit edilen sistemsel zafiyetlerin giderilmesi teftiş süreçlerinin bir gereğidir.
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={handleCreateSystemicFinding} 
                                className="whitespace-nowrap px-6 font-bold shadow-md hover:-translate-y-0.5 transition-transform"
                                leftIcon={<AlertTriangle size={16} />}
                            >
                                Bulgu Oluştur
                            </Button>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        {/* Modern PDF Card Export */}
                        <div className="p-8 border border-slate-200/60 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm">
                                <FileText size={32} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-800">Nihai Raporu Dışa Aktar</h4>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed font-medium">
                                    Girilen yapısal veriler ve tuval metinleri birleştirilerek, resmi kurul şablonuna 
                                    uygun imzalı PDF dokümanı oluşturulacaktır.
                                </p>
                            </div>
                            
                            <div className="pt-3">
                                <Button 
                                    onClick={handlePrintPDF} 
                                    className="gap-2 px-8 py-3 text-sm font-bold shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 border-none rounded-xl"
                                >
                                    <Printer size={18} />
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
