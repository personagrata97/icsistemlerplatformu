import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class BusinessDaysService {
    constructor(private prisma: PrismaService) {}

    /**
     * İki tarih arasındaki spesifik 'İş Günü' süresini hesaplar.
     * Hafta sonları ve Holiday tablosundaki resmi tatiller düşülür.
     */
    async calculateBusinessDays(startDate: Date, endDate: Date): Promise<number> {
        if (startDate > endDate) return 0;

        // DB'den resmi tatilleri çek
        const holidays = await this.prisma.holiday.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const holidayStrings = new Set(
            holidays.map(h => h.date.toISOString().split('T')[0])
        );

        let businessDays = 0;
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            const dateString = current.toISOString().split('T')[0];
            
            // Eğer Cumartesi (6) veya Pazar (0) değilse ve Tatil(Holiday) tablosunda yoksa say.
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayStrings.has(dateString)) {
                businessDays++;
            }
            
            current.setDate(current.getDate() + 1);
        }

        return businessDays;
    }
}
