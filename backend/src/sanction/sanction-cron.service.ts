import { Injectable, Logger } from '@nestjs/common';
import { SanctionService } from './sanction.service';
import { SanctionImportService } from './sanction-import.service';

@Injectable()
export class SanctionCronService {
    private readonly logger = new Logger(SanctionCronService.name);

    constructor(
        private readonly sanctionService: SanctionService,
        private readonly importService: SanctionImportService
    ) {}

    // Daily Cron Job execution (e.g. 06:00 AM)
    async handleDailySanctionCron(): Promise<any> {
        this.logger.log('Günlük otomatik yaptırım listesi senkronizasyonu ve portföy taraması başlatılıyor...');

        const listsToSync = ['MASAK_5549_6415_7262', 'OFAC_SDN', 'UN_SECURITY_COUNCIL', 'EU_CONSOLIDATED', 'INTERNAL_BLACK_LIST'];
        const syncResults = [];

        for (const kod of listsToSync) {
            try {
                const res = await this.importService.syncList(kod);
                syncResults.push(res);
            } catch (e) {
                this.logger.error(`${kod} listesi senkronize edilirken hata oluştu`, e);
            }
        }

        const scanResult = await this.sanctionService.screenAllPortfolios('Otomatik Günlük Cron');
        this.logger.log(`Günlük tarama tamamlandı: ${scanResult.eslesmeSayisi} eşleşme bulundu.`);

        return {
            status: 'SUCCESS',
            syncResults,
            scanResult,
            tarih: new Date(),
        };
    }
}
