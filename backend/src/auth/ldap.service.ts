import { Injectable, Logger } from '@nestjs/common';
import * as ldap from 'ldapjs';

// ============================================
// LDAP / Active Directory Yapilandirmasi
// ============================================
// IT ekibi tarafindan doldurulacak ortam degiskenleri:
//
//   LDAP_URL        = ldap://dc01.emlakkatilimtfs.local:389
//   LDAP_DOMAIN     = emlakkatilimtfs.local
//   LDAP_BASE_DN    = DC=emlakkatilimtfs,DC=local
//   LDAP_ENABLED    = true
//
// Not: LDAP_ENABLED=false oldugunda AD dogrulamasi devre disi kalir
//      ve isAdUser=true olan kullanicilar giris yapamaz.
// ============================================

@Injectable()
export class LdapService {
    private readonly logger = new Logger(LdapService.name);

    private get ldapUrl(): string {
        return process.env.LDAP_URL || 'ldap://dc01.emlakkatilimtfs.local:389';
    }

    private get ldapDomain(): string {
        return process.env.LDAP_DOMAIN || 'emlakkatilimtfs.local';
    }

    private get isEnabled(): boolean {
        return process.env.LDAP_ENABLED === 'true';
    }

    /**
     * Active Directory uzerinden kullanici dogrulamasi.
     * Kullanicinin domain hesabi ve bilgisayar acilis sifresi ile
     * LDAP bind islemi yapilir.
     *
     * @param username - Kullanici adi (sicil no veya sAMAccountName)
     * @param password - Bilgisayar acilis sifresi (AD sifresi)
     * @returns true: dogrulama basarili, false: basarisiz
     */
    async authenticate(username: string, password: string): Promise<boolean> {
        if (!this.isEnabled) {
            this.logger.warn(
                'LDAP dogrulamasi devre disi (LDAP_ENABLED=false). ' +
                'IT ekibi .env dosyasindaki LDAP ayarlarini yapilandirmalidir.'
            );
            return false;
        }

        // UPN (User Principal Name) formati: kullanici@domain.local
        const upn = `${username}@${this.ldapDomain}`;

        return new Promise<boolean>((resolve) => {
            const client = ldap.createClient({
                url: this.ldapUrl,
                connectTimeout: 5000,
                timeout: 10000,
            });

            client.on('error', (err: any) => {
                this.logger.error(`LDAP baglanti hatasi: ${err.message}`);
                client.destroy();
                resolve(false);
            });

            client.bind(upn, password, (err: any) => {
                if (err) {
                    this.logger.warn(
                        `LDAP dogrulama basarisiz (${username}): ${err.message}`
                    );
                    client.unbind(() => {});
                    resolve(false);
                } else {
                    this.logger.log(`LDAP dogrulama basarili: ${username}`);
                    client.unbind(() => {});
                    resolve(true);
                }
            });
        });
    }
}
