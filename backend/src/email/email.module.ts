import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ImapService } from './imap.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get('ETHICS_EMAIL_HOST') || 'mail.emlakkatilimtfs.com.tr',
                    port: parseInt(config.get('ETHICS_EMAIL_PORT') || '587'),
                    secure: config.get('ETHICS_EMAIL_SECURE') === 'true',
                    auth: {
                        user: config.get('ETHICS_EMAIL_USER') || 'etik@emlakkatilimtfs.com.tr',
                        pass: config.get('ETHICS_EMAIL_PASSWORD') || '',
                    },
                },
                defaults: {
                    from: '"Emlak Katılım Etik Hattı" <etik@emlakkatilimtfs.com.tr>',
                },
            }),
        }),
    ],
    providers: [EmailService, ImapService],
    exports: [EmailService, ImapService],
})
export class EmailModule { }
