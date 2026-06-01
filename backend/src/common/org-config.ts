// ============================================================
// ORGANİZASYON KONFİGÜRASYONU — MERKEZİ
// ============================================================
// Tüm şirket/birim/platform adları bu dosyadan okunmalıdır.
// Yeni bir modül eklenmesi durumunda bu dosyadan import edilmelidir.
// Hardcoded şirket/birim adı kullanımı kesinlikle yasaktır.
//
// Ortam değişkenleri (.env) ile override edilebilir:
//   ORG_COMPANY_NAME, ORG_DEPARTMENT_NAME, ORG_PLATFORM_NAME, vb.
// ============================================================

export const ORG = {
    /** Şirket tüzel adı (ör: Emlak Katılım) */
    companyName: process.env.ORG_COMPANY_NAME || 'Emlak Katılım',

    /** İç Denetim / Teftiş biriminin adı */
    departmentName: process.env.ORG_DEPARTMENT_NAME || 'Teftiş Kurulu',

    /** Platform / uygulama markası */
    platformName: process.env.ORG_PLATFORM_NAME || 'İç Sistemler Platformu',

    /** Rapor gizlilik derecesi */
    confidentiality: process.env.ORG_CONFIDENTIALITY || 'HİZMETE ÖZEL — GİZLİ',

    /** En üst amirin unvanı (imza sayfası vb.) */
    headTitle: process.env.ORG_HEAD_TITLE || 'Teftiş Kurulu Müdürü',

    /** Rapor alt bilgi notu */
    get footerNotice(): string {
        return `Bu rapor, ${this.companyName} ${this.departmentName} tarafından hazırlanmıştır.`;
    },

    /** Rapor başlık bandı (header bar) */
    get headerBand(): string {
        return `${this.companyName.toLocaleUpperCase('tr-TR')} | ${this.departmentName.toLocaleUpperCase('tr-TR')}`;
    },

    /** Resmi yazışma imza bloğu */
    get letterSignature(): string {
        return this.departmentName;
    },
};
