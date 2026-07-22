import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReputationSignalService {
    private readonly logger = new Logger(ReputationSignalService.name);

    constructor(private prisma: PrismaService) {}

    // 8-Adımlı İç Sinyal Kural Motoru
    async evaluateSignalsForCustomer(musteriId: string): Promise<any[]> {
        this.logger.log(`İtibar riski ve iç sinyal değerlendirmesi yürütülüyor: ${musteriId}`);

        const signals: any[] = [];
        const musteri = await this.prisma.musteri.findUnique({
            where: { musteri_id: musteriId },
            include: { sozlesmeler: { include: { odeme_hareketleri: true } } }
        });

        if (!musteri) return [];

        for (const sozlesme of musteri.sozlesmeler) {
            // KURAL 1: Ödeme Yönlendirme (Tüzel kişi sözleşmesinde ödeme gerçek kişi hesabına isteniyor)
            for (const odeme of sozlesme.odeme_hareketleri) {
                if (musteri.musteri_tipi === 'TUZEL' && odeme.alacakliTuru === 'GERCEK_KISI') {
                    signals.push(await this.createSignal({
                        musteriId,
                        sozlesmeId: sozlesme.sozlesme_id,
                        kuralKodu: 'KURAL_1',
                        kuralAd: 'Tüzel Kişi Hesabından Gerçek Kişiye Ödeme Yönlendirme',
                        riskPuani: 90,
                        onemDuzeyi: 'YUKSEK',
                        tetiklenmeSebebi: `Tüzel müşteri (${musteri.ad_soyad}) sözleşme fesih/ödeme bedelini gerçek kişi hesabına (${odeme.alacakliAdSoyad || 'Bilinmeyen'}) yönlendirmiştir.`
                    }));
                }

                // KURAL 2: Üçüncü Tarafa Ödeme (Alacaklı sözleşme sahibinden farklı kişi/kurum)
                if (odeme.alacakliTuru === 'UCUNCU_TARAF') {
                    signals.push(await this.createSignal({
                        musteriId,
                        sozlesmeId: sozlesme.sozlesme_id,
                        kuralKodu: 'KURAL_2',
                        kuralAd: 'Üçüncü Tarafa Ödeme Talebi',
                        riskPuani: 85,
                        onemDuzeyi: 'YUKSEK',
                        tetiklenmeSebebi: `Alacaklı adı (${odeme.alacakliAdSoyad}), sözleşme sahibi müşteriden farklı bir 3. taraf olarak girilmiştir.`
                    }));
                }
            }

            // KURAL 3: Erken Fesih + Yüksek Tutar (İlk 1/3 sürede fesih)
            if (sozlesme.fesihTalepTarihi && sozlesme.baslangic_tarihi) {
                const diffDays = (sozlesme.fesihTalepTarihi.getTime() - sozlesme.baslangic_tarihi.getTime()) / (1000 * 3600 * 24);
                if (diffDays < 90 && Number(sozlesme.toplam_tutar) > 500000) {
                    signals.push(await this.createSignal({
                        musteriId,
                        sozlesmeId: sozlesme.sozlesme_id,
                        kuralKodu: 'KURAL_3',
                        kuralAd: 'Erken Fesih ve Yüksek Tutar Örüntüsü',
                        riskPuani: 75,
                        onemDuzeyi: 'ORTA',
                        tetiklenmeSebebi: `Sözleşme tesisinden 90 gün geçmeden 500.000 TL üzeri yüksek tutarlı fesih talebi iletilmiştir.`
                    }));
                }
            }

            // KURAL 4: Hızlı Devir Örüntüsü
            if (sozlesme.devirVarMi && sozlesme.devirTarihi) {
                const devirDays = (sozlesme.devirTarihi.getTime() - sozlesme.baslangic_tarihi.getTime()) / (1000 * 3600 * 24);
                if (devirDays < 60) {
                    signals.push(await this.createSignal({
                        musteriId,
                        sozlesmeId: sozlesme.sozlesme_id,
                        kuralKodu: 'KURAL_4',
                        kuralAd: 'Hızlı Sözleşme Devir Örüntüsü',
                        riskPuani: 80,
                        onemDuzeyi: 'YUKSEK',
                        tetiklenmeSebebi: `Sözleşme tesis tarihinden itibaren 60 gün içerisinde başka bir kişiye devredilmiştir.`
                    }));
                }
            }

            // KURAL 5: İlişkili Taraf Göstergesi
            if (sozlesme.devralanAdSoyad && musteri.ad_soyad) {
                const devredenSoyad = musteri.ad_soyad.split(' ').pop() || '';
                const devralanSoyad = sozlesme.devralanAdSoyad.split(' ').pop() || '';
                if (devredenSoyad && devredenSoyad === devralanSoyad) {
                    signals.push(await this.createSignal({
                        musteriId,
                        sozlesmeId: sozlesme.sozlesme_id,
                        kuralKodu: 'KURAL_5',
                        kuralAd: 'İlişkili Taraf Devir Göstergesi (Soyadı Eşleşmesi)',
                        riskPuani: 85,
                        onemDuzeyi: 'YUKSEK',
                        tetiklenmeSebebi: `Devreden müşteri ile devralan kişi arasında aynı soyadı (${devralanSoyad}) tespiti.`
                    }));
                }
            }
        }

        return signals;
    }

    private async createSignal(data: {
        musteriId: string;
        sozlesmeId?: string;
        kuralKodu: string;
        kuralAd: string;
        riskPuani: number;
        onemDuzeyi: string;
        tetiklenmeSebebi: string;
    }) {
        return this.prisma.reputationSignal.create({
            data: {
                ...data,
                durum: 'ACIK'
            }
        });
    }

    async getSignals(musteriId?: string) {
        const where = musteriId ? { musteriId } : {};
        return this.prisma.reputationSignal.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });
    }

    // Genişletilmiş Durum Tespiti (EDD) Kaydı Oluşturma
    async createEDDRecord(data: {
        musteriId: string;
        signalId?: string;
        iddiaTuru: string;
        iddiaAsamasi: string;
        kaynakAd: string;
        kaynakTarih?: string;
        guvenilirlikSkoru: string;
        ticaretSicilKontrol?: boolean;
        resmiGazeteKontrol?: boolean;
        tmsfKontrol?: Boolean;
        acikKaynakKontrol?: boolean;
        kurumIciKontrol?: boolean;
        kanitDosyaUrl?: string;
        kaynakBaglantisi?: string;
        karar: string;
        kararGerekcesi: string;
        user: string;
    }) {
        const ustOnayGerekli = data.karar === 'ISLEMI_REDDET_SIB' || data.karar === 'SARTLI_DEVAM';
        const edd = await this.prisma.enhancedDueDiligence.create({
            data: {
                musteriId: data.musteriId,
                signalId: data.signalId,
                iddiaTuru: data.iddiaTuru,
                iddiaAsamasi: data.iddiaAsamasi,
                kaynakAd: data.kaynakAd,
                kaynakTarih: data.kaynakTarih ? new Date(data.kaynakTarih) : null,
                guvenilirlikSkoru: data.guvenilirlikSkoru,
                ticaretSicilKontrol: data.ticaretSicilKontrol || false,
                resmiGazeteKontrol: data.resmiGazeteKontrol || false,
                tmsfKontrol: data.tmsfKontrol || false,
                acikKaynakKontrol: data.acikKaynakKontrol || false,
                kurumIciKontrol: data.kurumIciKontrol || false,
                kanitDosyaUrl: data.kanitDosyaUrl,
                kaynakBaglantisi: data.kaynakBaglantisi,
                karar: data.karar,
                kararGerekcesi: data.kararGerekcesi,
                ustOnayGerekli,
                ustOnayDurumu: ustOnayGerekli ? 'BEKLIYOR' : 'ONAYLANDI',
                inceleyenUser: data.user,
            }
        });

        if (data.signalId) {
            await this.prisma.reputationSignal.update({
                where: { id: data.signalId },
                data: { durum: 'EDD_ACILDI' }
            });
        }

        return edd;
    }

    async getEDDRecords() {
        return this.prisma.enhancedDueDiligence.findMany({
            orderBy: { created_at: 'desc' }
        });
    }
}
