// ============================================================
// RAPOR TÜRLERİ VE ÖNEKLERİ — MERKEZİ
// ============================================================
// Nihai Rapor (21.07.2026) uyarınca standartlaştırılmıştır.
// Tüm rapor üretim modülleri bu dosyadan tür bilgisi okumalıdır.
// ============================================================

export const REPORT_TYPES = {
    SUREC_DENETIM: { prefix: 'SD', label: 'Süreç/İç Denetim Raporu', shortLabel: 'Denetim Raporu' },
    INCELEME: { prefix: 'İS', label: 'İnceleme Raporu', shortLabel: 'İnceleme' },
    SORUSTURMA: { prefix: 'İS/D', label: 'Soruşturma Raporu', shortLabel: 'Soruşturma' },
    FAALIYET: { prefix: 'FR', label: 'Faaliyet Raporu', shortLabel: 'Faaliyet' },
    DENETIM_KOMITESI: { prefix: 'DK', label: 'Denetim Komitesi Sunumu', shortLabel: 'DK Sunumu' },
    YONETIM_KURULU: { prefix: 'YK', label: 'Yönetim Kurulu Raporu', shortLabel: 'YK Raporu' },
    BULGU_OZETI: { prefix: 'BÖ', label: 'Bulgu Özeti Raporu', shortLabel: 'Bulgu Özeti' },
    BULGU_YASLANDIRMA: { prefix: 'BY', label: 'Bulgu Yaşlandırma Raporu', shortLabel: 'Yaşlandırma' },
    RISK_DEGERLENDIRME: { prefix: 'RD', label: 'Risk Değerlendirme / Matris', shortLabel: 'Risk Matrisi' },
    PLAN_ILERLEME: { prefix: 'Pİ', label: 'Yıllık Plan İlerleme', shortLabel: 'Plan İlerleme' },
    BILGI_NOTU: { prefix: 'BN', label: 'Bilgi Notu', shortLabel: 'Bilgi Notu' },
} as const;

export type ReportTypeKey = keyof typeof REPORT_TYPES;

/**
 * Rapor numarası üretici
 * Format: [PREFIX].[SIRA].[YIL]
 * Örnek: SD.1.2026, BN.3.2026, İS.12.2026
 */
export function generateReportNumber(prefix: string, sequenceNumber: number, year?: number): string {
    const y = year || new Date().getFullYear();
    return `${prefix}.${sequenceNumber}.${y}`;
}
