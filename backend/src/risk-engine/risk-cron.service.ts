import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { NotificationService } from '../common/notification/notification.service';

@Injectable()
export class RiskCronService {
  private readonly logger = new Logger(RiskCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkStaleData() {
    this.logger.log('Checking for stale risk data uploads...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // This is a simplified check. We look at the latest uploaded risk data or report.
    // If we assume DataIngestion updates some specific table, we can check its latest record.
    // E.g., latest `Musteri` or `Sozlesme` created_at, or a dedicated upload log.
    // As a fallback for this requirement, we'll check if any GunlukRiskOzet is older than 7 days, 
    // or simply simulate a check on a hypothetical "DataUpload" log.
    // We will check the last GunlukRiskOzet date as a proxy for data freshness.

    const latestSummary = await this.prisma.gunlukRiskOzet.findFirst({
        orderBy: { tarih: 'desc' },
        select: { tarih: true }
    });

    if (latestSummary && latestSummary.tarih < sevenDaysAgo) {
        await this.notificationService.notifyByRole('Risk Uzmanı', {
            title: 'Veri Yüklemesi Gecikti',
            description: `Sisteme 7 günden uzun süredir risk verisi yüklenmemiştir. (Son veri tarihi: ${latestSummary.tarih.toLocaleDateString('tr-TR')}). Lütfen veri aktarımını kontrol edin.`,
            type: 'error',
            module: 'risk',
            link: `/risk/data-upload`
        });
        this.logger.warn('Stale risk data notification sent.');
    }
  }
}
