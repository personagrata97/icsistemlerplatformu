// import type { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ORG } from './org-config';

// Eski Durum Renkleri - HEX formatı (stil nitelikleri için)
export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'Devam Ediyor': return '#3b82f6';
        case 'Planlandı': return '#8b5cf6';
        case 'Taslak': return '#94a3b8';
        case 'İptal Edildi': return '#ef4444';
        case 'Raporlanıyor': return '#f59e0b';
        case 'Gözden Geçirme': return '#8b5cf6';
        case 'Açık': return '#ef4444';
        case 'Kapalı': return '#10b981';
        case 'Onaylandı': return '#10b981';
        case 'Onayda': return '#f59e0b';
        case 'Reddedildi': return '#ef4444';
        case 'Yeni': return '#3b82f6';
        case 'İnceleniyor': return '#f59e0b';
        case 'Etkin': return '#10b981';
        case 'Gelişime Açık': return '#f59e0b';
        case 'Yetersiz': return '#ef4444';

        // Bulgu Özel Durumları
        case 'Gözden Geçirme Bekliyor': return '#a855f7'; // Purple-500 (Supervisor Review)
        case 'Onay Bekliyor': return '#f59e0b'; // Amber
        case 'Kapalı (Mutabık Değil)': return '#ea580c'; // Dark Orange
        case 'Tebliğ Edildi': return '#8b5cf6'; // Violet (Matching StatusBadge)
        case 'Birim Yanıtladı': return '#06b6d4'; // Cyan
        case 'Takip Ediliyor': return '#3b82f6'; // Blue (Monitoring)
        case 'Doğrulama Bekliyor': return '#f97316'; // Orange
        case 'Revizyon Gerekli': return '#f59e0b'; // Amber
        case 'Risk Kabul Edildi': return '#f97316'; // Orange
        case 'Cevaplandı': return '#06b6d4'; // Cyan
        case 'Mutabık Değil': return '#f97316'; // Orange
        case 'Düzeltme İstendi': return '#f59e0b'; // Amber
        case 'Tekrar Tebliğ Onayda': return '#d946ef'; // Pink/Fuchsia
        case 'İptal': return '#ef4444'; // Red
        case 'Denetim Esnasında Giderildi': return '#14b8a6'; // Teal

        default: return '#64748b'; // Gray-500
    }
};

// Unified Status Badge Classes - SINGLE SOURCE OF TRUTH for Tailwind classes
export const getStatusBadgeClass = (status: string): string => {
    switch (status) {
        // Taslak / Başlangıç Durumları
        case 'Taslak': return 'bg-gray-100 text-gray-600';
        case 'Açık': return 'bg-red-100 text-red-600';

        // Onay Akışı
        case 'Gözden Geçirme Bekliyor': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Onay Bekliyor': return 'bg-amber-100 text-amber-700';
        case 'Gözden Geçirme': return 'bg-purple-100 text-purple-700';
        case 'Onaylandı': return 'bg-green-100 text-green-700';
        case 'Reddedildi': return 'bg-red-100 text-red-600';
        case 'Düzeltme İstendi': return 'bg-red-100 text-red-600';

        // Tebliğ Durumları
        case 'Tebliğ Edildi': return 'bg-violet-100 text-violet-800 border-violet-200';
        case 'Birim Yanıtladı': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
        case 'Cevaplandı': return 'bg-cyan-100 text-cyan-800 border-cyan-200';

        // İzleme Durumu (UDS Uyumlu)
        case 'Takip Ediliyor': return 'bg-blue-100 text-blue-800 border-blue-200';

        // Doğrulama Durumları
        case 'Doğrulama Bekliyor': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Revizyon Gerekli': return 'bg-amber-100 text-amber-800 border-amber-200';

        // Kapalı Durumlar
        case 'Tamamlandı': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Kapalı': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Kapalı (Mutabık Değil)': return 'bg-emerald-50 text-emerald-700 border-emerald-100';

        // Risk / İstisna Durumları
        case 'Risk Kabul Edildi': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Mutabık Değil': return 'bg-orange-100 text-orange-800 border-orange-200';

        // Denetim Esnasında Giderilen Bulgular
        case 'Denetim Esnasında Giderildi': return 'bg-teal-100 text-teal-800 border-teal-200';

        // Denetim Durumları
        case 'Devam Ediyor': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Planlandı': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'Raporlanıyor': return 'bg-amber-100 text-amber-800 border-amber-200';

        // İptal Durumları
        case 'İptal': return 'bg-red-100 text-red-800 border-red-200';
        case 'İptal Edildi': return 'bg-red-100 text-red-800 border-red-200';

        // Diğer
        case 'Yeni': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'İnceleniyor': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Tekrar Tebliğ Onayda': return 'bg-fuchsia-100 text-fuchsia-700';

        default: return 'bg-gray-100 text-gray-600';
    }
};

// Risk Renkleri - Tutarlı Renk Paleti (Bordo, Kırmızı, Turuncu, Sarı)
// Tek Kaynak Doğruluk Noktası
export const getRiskColor = (risk: string): string => {
    const riskLower = risk?.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
    if (riskLower.includes('kritik')) return '#7f1d1d'; // Bordo (Red-900)
    if (riskLower.includes('yuksek')) return '#dc2626'; // Kırmızı (Red-600)
    if (riskLower.includes('orta')) return '#f97316';   // Turuncu (Orange-500)
    if (riskLower.includes('dusuk')) return '#facc15';  // Sarı (Yellow-400)
    return '#64748b'; // Gray-500
};

// Risk Badge Sınıfı (Tailwind)
export const getRiskBadgeClass = (risk: string | undefined | null): string => {
    if (!risk) return 'hidden';
    const riskLower = risk.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (riskLower.includes('kritik')) return 'bg-[#7f1d1d] text-white border-[#7f1d1d]';
    if (riskLower.includes('yuksek')) return 'bg-[#dc2626] text-white border-[#dc2626]';
    if (riskLower.includes('orta')) return 'bg-[#f97316] text-white border-[#f97316]';
    if (riskLower.includes('dusuk')) return 'bg-[#facc15] text-gray-900 border-[#facc15]';
    
    return 'bg-gray-200 text-gray-700 border-gray-300';
};

// Risk Skor Rengi (Tailwind - İlerleme çubukları ve skorlar için)
export const getRiskScoreColor = (score: number): string => {
    if (score >= 85) return 'text-[#7f1d1d] bg-[#7f1d1d]/10';
    if (score >= 65) return 'text-[#dc2626] bg-[#dc2626]/10';
    if (score >= 40) return 'text-[#f97316] bg-[#f97316]/10';
    return 'text-[#854d0e] bg-[#facc15]/20';
};

export const getRiskLevelFromScore = (score: number): 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük' => {
    if (score >= 85) return 'Kritik';
    if (score >= 65) return 'Yüksek';
    if (score >= 40) return 'Orta';
    return 'Düşük';
};

export const getAuditCycleFromScore = (score: number): number => {
    if (score >= 85) return 1;
    if (score >= 65) return 2;
    if (score >= 40) return 3;
    return 5;
};

// Date formatting utility - Returns format: 23.09.2026 (dd.MM.yyyy)
export const formatDate = (dateString?: string | Date | null): string => {
    if (!dateString) return '-';
    try {
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        
        // Handle standard invalid dates
        if (isNaN(date.getTime())) {
            // Attempt manual parse if it's a string in a common Turkish format (e.g. DD.MM.YYYY)
            if (typeof dateString === 'string' && dateString.includes('.')) {
                const parts = dateString.split(/[.\s-]/);
                if (parts.length >= 3) {
                    // Try to construct YYYY-MM-DD
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    const testDate = new Date(`${year}-${month}-${day}`);
                    if (!isNaN(testDate.getTime())) return `${day}.${month}.${year}`;
                }
            }
            return '-';
        }

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return '-';
    }
};

// Date & Time formatting utility - Returns format: 23.09.2026 - 14:30
// Adheres to Corporate Rule #11: "Gün Ay Yıl (01.01.2024 - 14:30) şeklinde olmalı."
export const formatDateTime = (dateString?: any): string => {
    if (dateString === null || dateString === undefined || dateString === '') return '-';
    
    try {
        let date = (dateString instanceof Date || Object.prototype.toString.call(dateString) === '[object Date]' || (dateString && typeof dateString.getTime === 'function')) 
            ? dateString 
            : new Date(dateString);
        
        // Eğer geçersizse ve string ise manuel ayrıştırma dene (DD.MM.YYYY formatı için)
        if (isNaN(date.getTime()) && typeof dateString === 'string') {
            const parts = dateString.split(/[.\s-:]+/).filter(Boolean);
            if (parts.length >= 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                const hours = parts[3]?.padStart(2, '0') || '00';
                const minutes = parts[4]?.padStart(2, '0') || '00';
                date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
            }
        }

        if (isNaN(date.getTime())) return '-';

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}.${month}.${year} - ${hours}:${minutes}`;
    } catch (e) {
        return '-';
    }
};

// Telefon numarası formatlama (05XX XXX XX XX)
export const formatPhone = (phone?: string): string => {
    if (!phone) return '-';
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a standard length mobile or landline
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9, 11)}`;
    }
    // If it's 10 digits without leading zero: 5321234567 -> 0532 123 45 67
    if (cleaned.length === 10) {
        return `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    }
    
    return phone;
};

// Holiday Cache
let holidayCache: Record<number, string[]> = {};

// Fetch public holidays for a given year
export const fetchPublicHolidays = async (year: number): Promise<string[]> => {
    if (holidayCache[year]) return holidayCache[year];

    try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TR`);
        if (!response.ok) throw new Error('Failed to fetch holidays');
        const data = await response.json();
        const holidays = data.map((d: any) => d.date); // YYYY-MM-DD format
        holidayCache[year] = holidays;
        return holidays;
    } catch (error) {
        console.warn('Holiday fetch failed, defaulting to weekend exclusion only:', error);
        return [];
    }
};

// Calculate business days between two dates
export const calculateBusinessDays = async (startDate?: string, endDate?: string): Promise<number> => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return 0;

    const yearStart = start.getFullYear();
    const yearEnd = end.getFullYear();

    // Fetch holidays for all involved years
    let holidays: string[] = [];
    for (let y = yearStart; y <= yearEnd; y++) {
        const h = await fetchPublicHolidays(y);
        holidays = [...holidays, ...h];
    }

    let count = 0;
    const curDate = new Date(start);

    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday=0, Saturday=6
        const dateString = curDate.toISOString().split('T')[0];
        const isHoliday = holidays.includes(dateString);

        if (!isWeekend && !isHoliday) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }

    return count;
};

// Eski senkron süre hesaplama (takvim günü) - Asenkronun zor olduğu yerlerde uyumluluk için
export const calculateDuration = (startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 0;
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
};

// ============================================================
// M16: BULGU SÜRE ÖLÇÜMLERİ VE BİRİM KARNESİ
// ============================================================

// Risk seviyesine göre maksimum cevaplanma süreleri (iş günü)
export const SLA_TANIMLARI: Record<string, { cevaplanmaSuresi: number; gidermeHedefSuresi: number }> = {
    'Kritik': { cevaplanmaSuresi: 5, gidermeHedefSuresi: 30 },
    'Yüksek': { cevaplanmaSuresi: 10, gidermeHedefSuresi: 60 },
    'Orta': { cevaplanmaSuresi: 15, gidermeHedefSuresi: 90 },
    'Düşük': { cevaplanmaSuresi: 20, gidermeHedefSuresi: 180 },
};

// Bulgu cevaplanma süresi hesaplama (tebliğ tarihi → birim yanıt tarihi)
export const hesaplaCevaplanmaSuresi = (tebligTarihi?: string, yanitTarihi?: string): number | null => {
    if (!tebligTarihi || !yanitTarihi) return null;
    return calculateDuration(tebligTarihi, yanitTarihi);
};

// Bulgu giderilme süresi hesaplama (açılma tarihi → kapatılma tarihi)
export const hesaplaGiderulmeSuresi = (acilmaTarihi?: string, kapatilmaTarihi?: string): number | null => {
    if (!acilmaTarihi || !kapatilmaTarihi) return null;
    return calculateDuration(acilmaTarihi, kapatilmaTarihi);
};

// SLA uyum kontrolü
export const slaUyumKontrolu = (riskSeviyesi: string, gercekSure: number | null, slaAlani: 'cevaplanmaSuresi' | 'gidermeHedefSuresi'): 'uyumlu' | 'uyumsuz' | 'belirsiz' => {
    if (gercekSure === null) return 'belirsiz';
    const sla = SLA_TANIMLARI[riskSeviyesi];
    if (!sla) return 'belirsiz';
    return gercekSure <= sla[slaAlani] ? 'uyumlu' : 'uyumsuz';
};

// Bulgu yaşlandırma hesaplama (kaç gündür açık)
export const hesaplaBulguYasi = (acilmaTarihi?: string, kapanmaTarihi?: string): number => {
    if (!acilmaTarihi) return 0;
    const bitisTarihi = kapanmaTarihi || new Date().toISOString();
    return calculateDuration(acilmaTarihi, bitisTarihi);
};

// Birim Karnesi hesaplama yardımcısı
export interface BirimKarnesi {
    birimAdi: string;
    toplamBulgu: number;
    acikBulgu: number;
    kapaliBulgu: number;
    tekrarlayanBulgu: number;
    ortalamaCevaplanmaSuresi: number;
    ortalamaGiderulmeSuresi: number;
    slaUyumOrani: number; // yüzde
    riskDagilimi: Record<string, number>;
}

export const hesaplaBirimKarnesi = (birimAdi: string, bulgular: any[]): BirimKarnesi => {
    const birimBulgulari = bulgular.filter(b => b.unitName === birimAdi || b.department === birimAdi);
    const acik = birimBulgulari.filter(b => !['Tamamlandı', 'Kapalı', 'Risk Kabul Edildi', 'Denetim Esnasında Giderildi'].includes(b.status));
    const kapali = birimBulgulari.filter(b => ['Tamamlandı', 'Kapalı'].includes(b.status));
    const tekrarlayan = birimBulgulari.filter(b => b.isRepeatFinding || b.isRecurring);

    // Cevaplanma süreleri
    const cevaplanmaSureleri = birimBulgulari
        .map(b => hesaplaCevaplanmaSuresi(b.notifiedAt, b.respondedAt))
        .filter((s): s is number => s !== null);
    const ortCevaplanma = cevaplanmaSureleri.length > 0
        ? Math.round(cevaplanmaSureleri.reduce((a, b) => a + b, 0) / cevaplanmaSureleri.length)
        : 0;

    // Giderilme süreleri
    const giderulmeSureleri = kapali
        .map(b => hesaplaGiderulmeSuresi(b.createdAt, b.closedAt || b.updatedAt))
        .filter((s): s is number => s !== null);
    const ortGiderulme = giderulmeSureleri.length > 0
        ? Math.round(giderulmeSureleri.reduce((a, b) => a + b, 0) / giderulmeSureleri.length)
        : 0;

    // SLA uyum
    const slaKontrolleri = birimBulgulari.map(b => {
        const sure = hesaplaCevaplanmaSuresi(b.notifiedAt, b.respondedAt);
        return slaUyumKontrolu(b.riskLevel || b.risk || 'Orta', sure, 'cevaplanmaSuresi');
    }).filter(s => s !== 'belirsiz');
    const slaUyumlu = slaKontrolleri.filter(s => s === 'uyumlu').length;
    const slaOran = slaKontrolleri.length > 0 ? Math.round((slaUyumlu / slaKontrolleri.length) * 100) : 100;

    // Risk dağılımı
    const riskDagilimi: Record<string, number> = {};
    birimBulgulari.forEach(b => {
        const risk = b.riskLevel || b.risk || 'Belirtilmemiş';
        riskDagilimi[risk] = (riskDagilimi[risk] || 0) + 1;
    });

    return {
        birimAdi,
        toplamBulgu: birimBulgulari.length,
        acikBulgu: acik.length,
        kapaliBulgu: kapali.length,
        tekrarlayanBulgu: tekrarlayan.length,
        ortalamaCevaplanmaSuresi: ortCevaplanma,
        ortalamaGiderulmeSuresi: ortGiderulme,
        slaUyumOrani: slaOran,
        riskDagilimi,
    };
};

// Eski İş Akışı Yapılandırması (Durum Makinesi)
export const findingWorkflow: Record<string, any> = {
    'Taslak': {
        transitions: [
            { to: 'Onay Bekliyor', label: 'Onaya Gönder', role: 'Müfettiş', icon: 'Send', style: 'primary' },
            { to: 'İnceleme Bekliyor', label: 'İncelemeye Gönder (Çapraz İnceleme)', role: 'Müfettiş', icon: 'UserCheck', style: 'info' }
        ]
    },
    'Revizyon Gerekli': {
        transitions: [
            { to: 'Onay Bekliyor', label: 'Tekrar Onaya Gönder', role: 'Müfettiş', icon: 'Send', style: 'primary' },
            { to: 'İnceleme Bekliyor', label: 'Tekrar İncelemeye Gönder', role: 'Müfettiş', icon: 'UserCheck', style: 'info' }
        ]
    },
    'İnceleme Bekliyor': {
        transitions: [
            { to: 'İnceleme Tamamlandı', label: 'İncelemeyi Tamamla', role: 'İncelemeci', icon: 'CheckCircle', style: 'success' },
            { to: 'Revizyon Gerekli', label: 'Revize Et (İade)', role: 'İncelemeci', icon: 'RefreshCcw', style: 'warning', requireNote: true }
        ]
    },
    'İnceleme Tamamlandı': {
        transitions: [
            { to: 'Onay Bekliyor', label: 'Onaya Gönder (Gözetim)', role: 'Müfettiş', icon: 'Send', style: 'primary' }
        ]
    },
    'Onay Bekliyor': {
        transitions: [
            { to: 'Onaylandı', label: 'Onayla', role: 'Gözetim Sorumlusu', icon: 'CheckCircle', style: 'success' },
            { to: 'Revizyon Gerekli', label: 'Revize Et', role: 'Gözetim Sorumlusu', icon: 'History', style: 'danger', requireNote: true }
        ]
    },
    'Onaylandı': {
        transitions: [
            { to: 'Tebliğ Edildi', label: 'Tebliğ Et', role: 'Müfettiş', icon: 'Send', style: 'info' }
        ]
    },
    'Tebliğ Edildi': {
        transitions: [
            { to: 'Birim Yanıtladı', label: 'Birim Yanıtı Alındı', role: 'Sistem/Birim', icon: 'MessageSquare', style: 'secondary' }
        ]
    },
    'Birim Yanıtladı': {
        transitions: [
            { to: 'Takip Ediliyor', label: 'Takibe Al', role: 'Müfettiş', icon: 'Eye', style: 'primary', condition: 'isAgreed && hasActions' },
            { to: 'Tamamlandı', label: 'Doğrula ve Kapat', role: 'Müfettiş', icon: 'CheckCircle', style: 'success', condition: 'isAgreed && !hasActions' }
        ]
    },
    'Takip Ediliyor': {
        transitions: [
            { to: 'Doğrulama Bekliyor', label: 'Kanıt Yüklendi', role: 'Birim', icon: 'Upload', style: 'info' }
        ]
    },
    'Doğrulama Bekliyor': {
        transitions: [
            { to: 'Tamamlandı', label: 'Onayla ve Kapat', role: 'Müfettiş', icon: 'CheckCircle', style: 'success' },
            { to: 'Takip Ediliyor', label: 'Reddet', role: 'Müfettiş', icon: 'XCircle', style: 'danger', requireNote: true }
        ]
    },
    'Tamamlandı': { transitions: [] },
    'Kapalı': { transitions: [] },
    'Risk Kabul Edildi': { transitions: [] }
};

// Etik Bildirim Kategorileri - Tek Kaynak Doğruluk Noktası
export const ETHICS_CATEGORIES = [
    { value: 'Yolsuzluk', label: 'Yolsuzluk ve Rüşvet' },
    { value: 'Hırsızlık', label: 'Hırsızlık, Zimmet ve Varlıkların Kötüye Kullanımı' },
    { value: 'MaliSuclar', label: 'Mali Suçlar ve Kayıt Hileleri' },
    { value: 'Cikar', label: 'Çıkar Çatışması' },
    { value: 'Mobbing', label: 'Mobbing (Psikolojik Taciz)' },
    { value: 'Taciz', label: 'Cinsel Taciz ve Şiddet' },
    { value: 'Ayrimcilik', label: 'Ayrımcılık ve Eşitsizlik' },
    { value: 'BilgiGuvenligi', label: 'Bilgi Güvenliği ve KVKK İhlali' },
    { value: 'Tedarikci', label: 'Tedarikçi ve İş Ortağı İhlalleri' },
    { value: 'Mevzuat', label: 'Mevzuat ve Kurum Politikalarına Aykırılık' },
    { value: 'ISG', label: 'Çevre, İş Sağlığı ve Güvenliği' },
    { value: 'Itibar', label: 'Kurum İtibarını Zedeleyici Eylemler' },
    { value: 'Diger', label: 'Diğer' }
];

export const DISCIPLINARY_ACTIONS = [
    { value: 'Karar Bekleniyor', label: 'Karar Bekleniyor' },
    { value: 'Disiplin Cezası Gerekli Görülmedi', label: 'Disiplin Cezası Gerekli Görülmedi' },
    { value: 'İhtar', label: 'İhtar' },
    { value: 'Kınama', label: 'Kınama' },
    { value: 'Ağır Kınama', label: 'Ağır Kınama' },
    { value: 'Ücret Kesintisi', label: 'Ücret Kesintisi' },
    { value: 'Görevden Uzaklaştırma', label: 'Görevden Uzaklaştırma' },
    { value: 'İşten Çıkarma (Haklı Fesih)', label: 'İşten Çıkarma (Haklı Fesih)' },
    { value: 'Diğer', label: 'Diğer' }
];

export const generateSamplingReport = async (plan: any) => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { PDF_COLORS, applyPdfTemplate, drawPdfSectionHeader, PDF_CONTENT_START_Y } = await import('./pdf-theme');

    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.width;
    const reportTitle = 'Denetim Örnekleme Raporu';

    // ----- METADATA SECTION -----
    let currentY = PDF_CONTENT_START_Y;

    currentY = drawPdfSectionHeader(doc, 'Denetim Kapsamı ve Örneklem Parametreleri', currentY);

    const details = [
        ["Denetim Görevi", plan.auditName || '-'],
        ["Veri Seti (Popülasyon)", plan.title || '-'],
        ["Seçim Yöntemi", plan.method || '-'],
        ["Örneklem Durumu", plan.status || '-'],
    ];

    const metrics = [
        ["Toplam Kayıt (N)", plan.populationSize?.toLocaleString() || '-'],
        ["Örneklem Çapı (n)", plan.sampleSize?.toLocaleString() || '-'],
        ["Güven Aralığı", `%${plan.confidenceLevel || '-'}`],
        ["Hata Payı Toleransı", `%${plan.errorRate || '-'}`],
    ];

    autoTable(doc, {
        startY: currentY,
        body: details,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2, textColor: [75, 85, 99] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: PDF_COLORS.text as any } },
        margin: { left: 14 },
        tableWidth: pageWidth / 2 - 20
    });

    autoTable(doc, {
        startY: currentY,
        body: metrics,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2, textColor: [75, 85, 99] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: PDF_COLORS.text as any } },
        margin: { left: pageWidth / 2 },
        tableWidth: pageWidth / 2 - 20
    });

    currentY = Math.max((doc as any).lastAutoTable.finalY + 15, currentY + 40);

    // ----- INSPECTOR EVALUATION / TEST RESULTS -----
    currentY = drawPdfSectionHeader(doc, 'Müfettiş İnceleme Bulguları & Değerlendirmeler', currentY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(
        "Aşağıdaki tablo, oluşturulan örneklem listesi üzerinde yapılan iç denetim testlerinin özet sonuçlarını içermektedir.",
        14, currentY, { maxWidth: pageWidth - 28 }
    );

    currentY += 12;

    const results = [
        ["Kontrol Esaslarından Sapan Kayıt Sayısı", `${plan.deviationsFound?.toString() || "0"} adet işlemde standartlara aykırılık ve istisna tespit edilmiştir.`],
        ["Genel Test Sonucu ve Özeti", plan.testResult ? plan.testResult : "Detaylı test sonuçları sisteme henüz girilmemiştir."],
        ["Müfettiş Nihai Kanaati", plan.conclusions ? plan.conclusions : "İnceleme Bekliyor (Henüz değerlendirilmedi)"]
    ];

    autoTable(doc, {
        startY: currentY,
        head: [['Denetçi Analizi / Kriter', 'Değerlendirme Özeti ve Gerekçeler']],
        body: results,
        theme: 'grid',
        headStyles: { fillColor: PDF_COLORS.primary as any, textColor: PDF_COLORS.white as any, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4, lineColor: PDF_COLORS.border as any, lineWidth: 0.3 },
        columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold', textColor: PDF_COLORS.textSecondary as any } },
        alternateRowStyles: { fillColor: PDF_COLORS.bgLight as any },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // ----- SAMPLE DATA TABLE -----
    if (plan.selectedItems) {
        try {
            const items = JSON.parse(plan.selectedItems);
            if (Array.isArray(items) && items.length > 0) {
                if (currentY > doc.internal.pageSize.height - 40) doc.addPage();

                currentY = drawPdfSectionHeader(doc, `Detaylı Örneklem Matrisi (${items.length} Kayıt)`, currentY);

                const allHeaders = Object.keys(items[0]);
                const displayHeaders = ['Sıra No', ...allHeaders.slice(0, 6), 'Müfettiş Notu'];

                const tableRows = items.map((row: any, idx: number) => {
                    const rowData = [
                        (idx + 1).toString(),
                        ...allHeaders.slice(0, 6).map(h => {
                            let val = row[h];
                            if (val === null || val === undefined) return '-';
                            const strVal = val.toString();
                            return strVal.length > 25 ? strVal.substring(0, 22) + '...' : strVal;
                        }),
                        ""
                    ];
                    return rowData;
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [displayHeaders],
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: PDF_COLORS.primaryDark as any, textColor: PDF_COLORS.white as any, fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', lineColor: PDF_COLORS.border as any, lineWidth: 0.3 },
                    alternateRowStyles: { fillColor: PDF_COLORS.bgLight as any },
                    columnStyles: { [displayHeaders.length - 1]: { cellWidth: 50 } }
                });

                currentY = (doc as any).lastAutoTable.finalY + 10;

                if (allHeaders.length > 6) {
                    doc.setFontSize(8);
                    doc.setTextColor(...PDF_COLORS.danger);
                    doc.setFont("helvetica", "bold");
                    doc.text(`* Sisteme yüklenen veri setinde daha fazla kolon (${allHeaders.length}) mevcuttur. Tam veri için Excel raporunu kullanınız.`, 14, currentY);
                }
            }
        } catch (e) {
            console.error("PDF data table parsing error", e);
        }
    }

    // ----- SIGNATURE AREA -----
    if (currentY > doc.internal.pageSize.height - 40) doc.addPage();
    currentY = Math.max((doc as any).lastAutoTable?.finalY + 20 || currentY + 20, currentY);

    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFont("helvetica", "bold");
    doc.text("Hazırlayan / İmza", pageWidth - 70, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Ad Soyad: ................................", pageWidth - 70, currentY + 12);
    doc.text("Tarih: ....../....../...........", pageWidth - 70, currentY + 22);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.line(pageWidth - 70, currentY + 35, pageWidth - 14, currentY + 35);

    // Apply unified template
    applyPdfTemplate(doc, reportTitle);

    doc.save(`Orneklem_${plan.title?.substring(0, 15).replace(/\s+/g, '-') || 'Raporu'}.pdf`);
};

export const exportSamplingPlans = async (plans: any[]) => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { PDF_COLORS, applyPdfTemplate, drawPdfSectionHeader, PDF_CONTENT_START_Y } = await import('./pdf-theme');

    const doc = new jsPDF();
    const reportTitle = 'Örnekleme Planları Listesi';
    let y = PDF_CONTENT_START_Y;

    y = drawPdfSectionHeader(doc, reportTitle, y);

    const rows = plans.map(p => [
        p.auditName,
        p.title,
        p.method,
        p.populationSize,
        p.sampleSize,
        `%${p.confidenceLevel}`,
        p.status
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Denetim', 'Popülasyon', 'Yöntem', 'Pop. N', 'Örnek n', 'Güven', 'Durum']],
        body: rows,
        headStyles: { fillColor: PDF_COLORS.primary as any, textColor: PDF_COLORS.white as any, fontStyle: 'bold' },
        styles: { fontSize: 8, lineColor: PDF_COLORS.border as any, lineWidth: 0.3 },
        alternateRowStyles: { fillColor: PDF_COLORS.bgLight as any },
    });

    applyPdfTemplate(doc, reportTitle);
    doc.save("tum-ornekleme-planlari.pdf");
};

export const generateEnhancedSamplingExcel = async (plan: any, rawData?: any[]) => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    // 1. SUMMARY SHEET
    const summaryData = [
        ["DENETİM ÖRNEKLEME RAPORU ÖZETİ", ""],
        ["Oluşturulma Tarihi", new Date().toLocaleString('tr-TR')],
        ["", ""],
        ["GENEL BİLGİLER", ""],
        ["Denetim / Birim", plan.auditName || "-"],
        ["Popülasyon Tanımı", plan.title || "-"],
        ["Örnekleme Yöntemi", plan.method || "-"],
        ["Durum", plan.status || "-"],
        ["", ""],
        ["İSTATİSTİKSEL PARAMETRELER", ""],
        ["Popülasyon Büyüklüğü (N)", plan.populationSize || 0],
        ["Örneklem Çapı (n)", plan.sampleSize || 0],
        ["Güven Düzeyi", `%${plan.confidenceLevel || 95}`],
        ["Kabul Edilebilir Hata Oranı", `%${plan.errorRate || 5}`],
        ["", ""],
        ["TEST SONUÇLARI VE DEĞERLENDİRME", ""],
        ["Bulunan Sapma Sayısı", plan.deviationsFound ?? "-"],
        ["Gözlemlenen Sapma Oranı", plan.observedDeviationRate !== undefined ? `%${plan.observedDeviationRate}` : "-"],
        ["Nihai Kanaat", plan.conclusions || "-"],
        ["Değerlendirme Özeti", plan.testResult || "-"],
        ["", ""],
        ["Örneklem Notları", plan.notes || "-"]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style summary sheet (basic column width)
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 80 }];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Örneklem Özeti");

    // 2. SAMPLE SHEET
    let sampleItems = [];
    if (plan.selectedItems) {
        try {
            sampleItems = typeof plan.selectedItems === 'string' ? JSON.parse(plan.selectedItems) : plan.selectedItems;
        } catch (e) {
            console.error("Örneklem verisi ayrıştırılamadı", e);
        }
    }

    if (Array.isArray(sampleItems) && sampleItems.length > 0) {
        // Flatten nested objects if any
        const flatSample = sampleItems.map(item => {
            const flat: any = {};
            Object.entries(item).forEach(([key, val]) => {
                if (typeof val === 'object' && val !== null) {
                    const str = JSON.stringify(val);
                    // Excel hard limit: 32,767 characters per cell. Limit to 32,700 for safety.
                    flat[key] = str.length > 32700 ? str.substring(0, 32700) + '... [KIRPILDI]' : str;
                } else {
                    const strVal = String(val ?? '');
                    flat[key] = strVal.length > 32700 ? strVal.substring(0, 32700) + '... [KIRPILDI]' : val;
                }
            });
            return flat;
        });

        const sampleSheet = XLSX.utils.json_to_sheet(flatSample);
        XLSX.utils.book_append_sheet(workbook, sampleSheet, "Örneklem");
    }

    // 3. RAW DATA SHEET (HAM VERİ)
    if (Array.isArray(rawData) && rawData.length > 0) {
        const rawSheet = XLSX.utils.json_to_sheet(rawData);
        XLSX.utils.book_append_sheet(workbook, rawSheet, "Ham Veri");
    }

    // Download the workbook
    const fileName = `Orneklem_Raporu_${plan.title?.substring(0, 20).replace(/\s+/g, '_') || 'Detay'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
};
