// ============================================================
// KURUMSAL RENK PALETİ — MERKEZİ (TEK KAYNAK)
// ============================================================
// Tüm modüller (rapor, bulgu formu, e-posta, frontend) renkleri
// bu dosyadan okumalıdır. Hardcoded hex renk kodu kullanımı
// kesinlikle yasaktır.
//
// Nihai Rapor (21.07.2026) uyarınca:
//   - Ana renk #004a99 (mavi) → #0A7A4B (Emlak Katılım yeşili)
//   - Risk renkleri anlamsal olduğu için KORUNMUŞTUR.
//   - Altın aksan yeşille uyumlu olduğu için KORUNMUŞTUR.
// ============================================================

export const BRAND_COLORS = {
    // ── Ana Kurumsal Renkler (Emlak Katılım Yeşili) ──
    primary: '#0A7A4B',           // Emlak Katılım Yeşili (eski: #004a99 koyu mavi)
    primaryDark: '#064F31',       // Koyu yeşil gradient (eski: #001d3d)
    primaryLight: '#E6F4EE',      // Açık yeşil arka plan (eski: #e8f0fe)

    // ── Aksan / Premium ──
    gold: '#c9a84c',              // Altın aksan (korundu — yeşille uyumlu)

    // ── Temel Renkler ──
    white: '#ffffff',
    black: '#000000',

    // ── Metin Renkleri ──
    text: '#1a1a2e',              // Ana metin
    textSecondary: '#4a5568',     // İkincil metin
    textMuted: '#718096',         // Soluk metin

    // ── Kenarlık ──
    border: '#cbd5e0',            // Kenarlık
    borderLight: '#e2e8f0',       // Hafif kenarlık

    // ── Durum Renkleri ──
    success: '#0A7A4B',           // Yeşil (kurumsal yeşil ile birleştirildi)
    danger: '#dc2626',            // Kırmızı
    warning: '#f59e0b',           // Sarı
    orange: '#f97316',            // Turuncu

    // ── Risk Derecelendirme (anlamsal — DEĞİŞTİRİLMEZ) ──
    riskKritik: '#881337',        // Bordo
    riskYuksek: '#dc2626',        // Kırmızı
    riskOrta: '#f97316',          // Turuncu
    riskDusuk: '#ca8a04',         // Koyu sarı

    // ── Arka Plan ──
    bgLight: '#f8fafc',           // Açık arka plan
    bgAccent: '#EDF7F1',          // Aksan arka plan (eski: #f0f4ff mavi tonu → yeşil tonu)
};

// ── E-posta Şablonu için Yardımcı Renkler ──
export const EMAIL_COLORS = {
    headerGradientStart: BRAND_COLORS.primary,
    headerGradientEnd: BRAND_COLORS.primaryDark,
    headerBorderBottom: BRAND_COLORS.gold,
    badgeBg: BRAND_COLORS.primaryLight,
    badgeText: BRAND_COLORS.primary,
    detailBorderLeft: BRAND_COLORS.primary,
    ctaGradientStart: BRAND_COLORS.primary,
    ctaGradientEnd: '#055A37',        // Daha koyu yeşil (CTA butonu hover)
    ctaBorder: '#087A4D',             // Buton kenarlık
    ctaShadow: 'rgba(10,122,75,0.3)', // Yeşil gölge
};
