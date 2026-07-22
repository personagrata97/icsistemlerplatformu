// ============================================
// JWT YAPILANDIRMASI — Güvenlik Kritik
// ============================================
// Production'da .env dosyasında aşağıdaki değişkenler ZORUNLUDUR:
//   JWT_SECRET=<en-az-64-karakter-rastgele-string>
//   JWT_ACCESS_EXPIRATION=15m
//   JWT_REFRESH_EXPIRATION=7d
//
// JWT_SECRET oluşturmak için:
//   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
// ============================================

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
    if (isProduction) {
        console.error(
            '\n❌ [KRİTİK GÜVENLİK HATASI] JWT_SECRET ortam değişkeni tanımlanmamış!\n' +
            '   Production ortamında uygulama güvenli başlatılamaz.\n' +
            '   .env dosyasına "JWT_SECRET=<güçlü-rastgele-anahtar>" ekleyiniz.\n'
        );
        process.exit(1);
    } else {
        console.warn(
            '⚠️  [GÜVENLİK UYARISI] JWT_SECRET tanımlı değil. Geliştirme anahtarı kullanılıyor.\n' +
            '   Production öncesi .env dosyasında JWT_SECRET mutlaka tanımlanmalıdır.'
        );
    }
}

export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'DEVELOPMENT-STATIC-JWT-SECRET-KEY-DEV-2026',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
};
