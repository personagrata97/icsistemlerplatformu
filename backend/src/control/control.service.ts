import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ControlService {
    private readonly logger = new Logger(ControlService.name);

    constructor(private prisma: PrismaService) {}

    async getControlStats() {
        return {
            totalControls: 48,
            effectiveControls: 38,
            needsImprovement: 7,
            ineffectiveControls: 3,
            selfAssessmentCompletion: 88,
            lastSelfAssessmentDate: '2026-07-20',
        };
    }

    async getControlInventory(params?: { search?: string; type?: string; status?: string }) {
        const sampleControls = [
            {
                id: 'KONTROL-01',
                kod: 'KNT-KRE-001',
                ad: 'Kredi Limit Aşımlarının Otomatik Blokaj Kontrolü',
                surec: 'Kredi Tahsis ve Operasyon',
                tur: 'ÖNLEYİCİ',
                yontem: 'OTOMATİK (SİSTEMSEL)',
                siklik: 'GÜNLÜK (ANLIK)',
                sahip: 'Kredi Operasyonları Müdürlüğü',
                dayandigiRisk: 'Yetkisiz Kredi Kullandırımı Riski',
                etkinlikSkoru: 95,
                durum: 'ETKİN',
                sonTestTarihi: '2026-07-15'
            },
            {
                id: 'KONTROL-02',
                kod: 'KNT-KVKK-008',
                ad: 'Müşteri İzin Formu Girişi ve Onay Kontrolü',
                surec: 'Müşteri İlişkileri ve Gişe',
                tur: 'TESPİT EDİCİ',
                yontem: 'MANUEL',
                siklik: 'HAFTALIK',
                sahip: 'Birim Uyum Sorumlusu',
                dayandigiRisk: 'KVKK İhlali ve İdari Para Cezası Riski',
                etkinlikSkoru: 65,
                durum: 'GELİŞİME_AÇIK',
                sonTestTarihi: '2026-07-10'
            },
            {
                id: 'KONTROL-03',
                kod: 'KNT-MUH-012',
                ad: 'Gün Sonu Genel Muhasebe Mutabakatı',
                surec: 'Mali İşler ve Muhasebe',
                tur: 'TESPİT EDİCİ',
                yontem: 'OTOMATİK',
                siklik: 'GÜNLÜK',
                sahip: 'Genel Muhasebe Müdürlüğü',
                dayandigiRisk: 'Mali Tablo Hataları Riski',
                etkinlikSkoru: 98,
                durum: 'ETKİN',
                sonTestTarihi: '2026-07-21'
            }
        ];

        return sampleControls.filter(c => {
            if (params?.status && params.status !== 'ALL' && c.durum !== params.status) return false;
            if (params?.search && !c.ad.toLowerCase().includes(params.search.toLowerCase()) && !c.kod.toLowerCase().includes(params.search.toLowerCase())) return false;
            return true;
        });
    }

    async getSelfAssessments() {
        return [
            { id: '1', birim: 'Kredi Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 92, tarih: '2026-07-15' },
            { id: '2', birim: 'Hazine ve Fon Yönetimi', donem: '2026 Q2', durum: 'TAMAMLANDI', skor: 96, tarih: '2026-07-18' },
            { id: '3', birim: 'Şube Operasyonları Müdürlüğü', donem: '2026 Q2', durum: 'DEĞERLENDİRMEDE', skor: 78, tarih: '2026-07-20' },
        ];
    }
}
