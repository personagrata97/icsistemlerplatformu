// ============================================================
// ORGANİZASYON KONFİGÜRASYONU — MERKEZİ (Frontend)
// ============================================================
// Tüm şirket/birim/platform adları bu dosyadan okunmalıdır.
// Yeni bir bileşen eklenmesi durumunda bu dosyadan import edilmelidir.
// Hardcoded şirket/birim adı kullanımı kesinlikle yasaktır.
//
// Ortam değişkenleri (.env.local) ile override edilebilir:
//   NEXT_PUBLIC_ORG_COMPANY_NAME, NEXT_PUBLIC_ORG_DEPARTMENT_NAME, vb.
// ============================================================

export const ORG = {
    /** Şirket tüzel adı (ör: Emlak Katılım) */
    companyName: process.env.NEXT_PUBLIC_ORG_COMPANY_NAME || 'Emlak Katılım',

    /** İç Denetim / Teftiş biriminin adı */
    departmentName: process.env.NEXT_PUBLIC_ORG_DEPARTMENT_NAME || 'Teftiş Kurulu',

    /** Platform / uygulama markası */
    platformName: process.env.NEXT_PUBLIC_ORG_PLATFORM_NAME || 'İç Sistemler Platformu',

    /** Rapor alt bilgi notu */
    get footerNotice(): string {
        return `Bu rapor, ${this.companyName} ${this.departmentName} tarafından hazırlanmıştır.`;
    },

    /** Resmi yazışma imza bloğu */
    get letterSignature(): string {
        return this.departmentName;
    },
};
