import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Imap from 'imap';
import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedEthicsEmail {
    messageId: string;
    from: string;
    fromName?: string;
    subject: string;
    textContent: string;
    htmlContent?: string;
    date: Date;
    attachments: Array<{
        filename: string;
        contentType: string;
        size: number;
        content: Buffer;
    }>;
    inReplyTo?: string;
    references?: string[];
}

@Injectable()
export class ImapService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ImapService.name);
    private imap: Imap;
    private isConnected = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private readonly uploadDir = './private_uploads/ethics';

    constructor(
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2
    ) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async onModuleInit() {
        // Only start IMAP listener if configured
        const imapHost = this.configService.get('ETHICS_EMAIL_HOST');
        const imapUser = this.configService.get('ETHICS_EMAIL_USER');
        const imapPass = this.configService.get('ETHICS_EMAIL_PASSWORD');

        if (!imapHost || !imapUser || !imapPass) {
            this.logger.warn('IMAP credentials not configured. Email-to-ticket feature disabled.');
            this.logger.warn('Set ETHICS_EMAIL_HOST, ETHICS_EMAIL_USER, ETHICS_EMAIL_PASSWORD in .env to enable.');
            return;
        }

        this.initializeImap();
    }

    async onModuleDestroy() {
        this.disconnect();
    }

    private initializeImap() {
        const config = {
            user: this.configService.get('ETHICS_EMAIL_USER'),
            password: this.configService.get('ETHICS_EMAIL_PASSWORD'),
            host: this.configService.get('ETHICS_EMAIL_HOST'),
            port: parseInt(this.configService.get('ETHICS_IMAP_PORT') || '993'),
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 30000,
        };

        this.imap = new Imap(config);

        this.imap.once('ready', () => {
            this.isConnected = true;
            this.logger.log('IMAP connection established for etik@emlakkatilimtfs.com.tr');
            this.startListening();
        });

        this.imap.once('error', (err: Error) => {
            this.logger.error('IMAP connection error:', err.message);
            this.scheduleReconnect();
        });

        this.imap.once('end', () => {
            this.isConnected = false;
            this.logger.warn('IMAP connection ended');
            this.scheduleReconnect();
        });

        this.imap.connect();
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.logger.log('Attempting IMAP reconnection...');
            this.initializeImap();
        }, 30000); // Reconnect after 30 seconds
    }

    private startListening() {
        this.imap.openBox('INBOX', false, (err) => {
            if (err) {
                this.logger.error('Failed to open INBOX:', err.message);
                return;
            }

            this.logger.log('Listening for new emails in INBOX...');

            // Process existing unseen emails on startup
            this.processUnseenEmails();

            // Listen for new emails
            this.imap.on('mail', () => {
                this.logger.log('New email received');
                this.processUnseenEmails();
            });
        });
    }

    private async processUnseenEmails() {
        this.imap.search(['UNSEEN'], async (err, results) => {
            if (err) {
                this.logger.error('Failed to search for unseen emails:', err.message);
                return;
            }

            if (!results || results.length === 0) {
                return;
            }

            this.logger.log(`Found ${results.length} unseen email(s)`);

            const fetch = this.imap.fetch(results, {
                bodies: '',
                markSeen: true,
                struct: true
            });

            fetch.on('message', (msg) => {
                msg.on('body', async (stream) => {
                    try {
                        const parsed = await simpleParser(stream as any);
                        const ethicsEmail = await this.parseEmail(parsed);

                        // Emit event for EthicsService to handle
                        this.eventEmitter.emit('ethics.email.received', ethicsEmail);

                        this.logger.log(`Processed email from ${ethicsEmail.from}: ${ethicsEmail.subject}`);
                    } catch (parseErr) {
                        this.logger.error('Failed to parse email:', parseErr);
                    }
                });
            });

            fetch.once('error', (fetchErr) => {
                this.logger.error('Fetch error:', fetchErr.message);
            });
        });
    }

    private async parseEmail(parsed: ParsedMail): Promise<ParsedEthicsEmail> {
        const fromAddress = parsed.from?.value?.[0];

        // Save attachments to disk
        const savedAttachments: ParsedEthicsEmail['attachments'] = [];

        if (parsed.attachments && parsed.attachments.length > 0) {
            for (const attachment of parsed.attachments) {
                try {
                    const filename = `${Date.now()}_${attachment.filename || 'attachment'}`;
                    const filepath = path.join(this.uploadDir, filename);

                    fs.writeFileSync(filepath, attachment.content);

                    savedAttachments.push({
                        filename: attachment.filename || 'attachment',
                        contentType: attachment.contentType,
                        size: attachment.size,
                        content: attachment.content,
                    });

                    this.logger.log(`Saved attachment: ${filename}`);
                } catch (attachErr) {
                    this.logger.error(`Failed to save attachment ${attachment.filename}:`, attachErr);
                }
            }
        }

        return {
            messageId: parsed.messageId || `generated-${Date.now()}`,
            from: fromAddress?.address || 'unknown@unknown.com',
            fromName: fromAddress?.name,
            subject: parsed.subject || 'Konu Belirtilmemiş',
            textContent: parsed.text || '',
            htmlContent: parsed.html || undefined,
            date: parsed.date || new Date(),
            attachments: savedAttachments,
            inReplyTo: parsed.inReplyTo,
            references: parsed.references ?
                (Array.isArray(parsed.references) ? parsed.references : [parsed.references]) :
                undefined,
        };
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.imap && this.isConnected) {
            this.imap.end();
            this.isConnected = false;
            this.logger.log('IMAP disconnected');
        }
    }

    /**
     * Check if IMAP is connected and listening
     */
    isListening(): boolean {
        return this.isConnected;
    }
}
