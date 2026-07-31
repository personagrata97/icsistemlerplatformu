import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { NotificationService } from '../common/notification/notification.service';

@Injectable()
export class ControlCronService {
  private readonly logger = new Logger(ControlCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkDeficiencyDeadlines() {
    this.logger.log('Checking control deficiency deadlines...');
    const now = new Date();
    
    // 7 gün yaklaşanlar
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const approachingDeficiencies = await this.prisma.controlDeficiency.findMany({
      where: {
        status: { in: ['Açık', 'Gecikmiş'] }, // or similar statuses depending on the workflow
        isDeleted: false,
        dueDate: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(sevenDaysLater.setHours(23, 59, 59, 999))
        }
      }
    });

    for (const def of approachingDeficiencies) {
      await this.notificationService.notifyByDepartment(def.responsibleUnit, {
        title: 'Aksiyon Termini Yaklaştı',
        description: `${def.code || def.id} numaralı eksiklik aksiyon termini 7 günden az kaldı.`,
        type: 'warning',
        module: 'control',
        link: `/control/deficiencies/${def.id}`
      });
    }

    // Geçenler
    const pastDeficiencies = await this.prisma.controlDeficiency.findMany({
        where: {
          status: { in: ['Açık', 'Gecikmiş'] },
          isDeleted: false,
          dueDate: {
              lt: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
    });

    for (const def of pastDeficiencies) {
        // Sorumluya ve yöneticiye
        await this.notificationService.notifyByDepartment(def.responsibleUnit, {
            title: 'Aksiyon Termini Geçti',
            description: `${def.code || def.id} numaralı eksiklik aksiyon termini geçmiştir! Lütfen acil aksiyon alın.`,
            type: 'error',
            module: 'control',
            link: `/control/deficiencies/${def.id}`
        });

        await this.notificationService.notifyByRole('Kontrol Yöneticisi', {
            title: 'Gecikmiş Eksiklik',
            description: `${def.responsibleUnit} birimine ait ${def.code || def.id} numaralı eksikliğin termini geçmiştir.`,
            type: 'error',
            module: 'control',
            link: `/control/deficiencies/${def.id}`
        });
    }

    this.logger.log(`Notified ${approachingDeficiencies.length} approaching, ${pastDeficiencies.length} past deadlines.`);
  }
}
