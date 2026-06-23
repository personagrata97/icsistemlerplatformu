import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as xlsx from 'xlsx';

export interface DataQualityReport {
    toplam_satir: number;
    kabul_edilen: number;
    reddedilen: number;
    hatalar: string[];
    uyarilar: string[];
    eksik_bagimliliklar: string[];
    is_valid: boolean;
}

@Injectable()
export class DataIngestionService {
    private readonly logger = new Logger(DataIngestionService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Akıllı Sütun Eşleştirme (Smart Column Mapping)
     */
    private mapColumns(rawRow: any): any {
        const mappedRow: any = {};
        const keys = Object.keys(rawRow);

        for (const key of keys) {
            const normalizedKey = key.trim().toLowerCase().replace(/[\s\.\-]/g, '');

            if (['tc', 'tckimlik', 'tckn', 'kimlikno'].includes(normalizedKey)) {
                mappedRow.tc_kimlik = rawRow[key];
            } else if (['ad', 'soyad', 'adsoyad', 'isim', 'musteri', 'müşteri'].includes(normalizedKey)) {
                mappedRow.ad_soyad = rawRow[key];
            } else if (['sozlesmeno', 'sözleşmeno', 'sozlesme', 'hesapno'].includes(normalizedKey)) {
                mappedRow.sozlesme_no = rawRow[key];
            } else if (['tutar', 'bedel', 'sozlesmetutari', 'sözleşmetutarı', 'hacim'].includes(normalizedKey)) {
                mappedRow.sozlesme_tutari = Number(rawRow[key]);
            } else if (['tarih', 'kayittarihi', 'sözleşmetarihi'].includes(normalizedKey)) {
                mappedRow.tarih = new Date(rawRow[key]);
            } else if (['bakiye', 'kalanbakiye', 'kalan'].includes(normalizedKey)) {
                mappedRow.kalan_bakiye = Number(rawRow[key]);
            } else if (['gecikme', 'gecikmegunu', 'dpd', 'npl'].includes(normalizedKey)) {
                mappedRow.gecikme_gunu = Number(rawRow[key]);
            } else if (['iptal', 'iptalmi', 'durum'].includes(normalizedKey)) {
                const val = String(rawRow[key]).toLowerCase();
                mappedRow.iptal_mi = ['evet', 'true', 'iptal', 'fesih'].includes(val);
            }
        }
        return mappedRow;
    }

    /**
     * Ön İnceleme (Pre-Flight Check)
     */
    async validateExcelData(buffer: Buffer): Promise<{ report: DataQualityReport, mappedData: any[] }> {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet);

        const report: DataQualityReport = {
            toplam_satir: rawData.length,
            kabul_edilen: 0,
            reddedilen: 0,
            hatalar: [],
            uyarilar: [],
            eksik_bagimliliklar: [],
            is_valid: true
        };

        const mappedData: any[] = [];
        let hasGecikmeGunu = false;
        let hasSozlesmeTutari = false;

        rawData.forEach((row: any, index: number) => {
            const mapped = this.mapColumns(row);
            let rowValid = true;

            // Type Validations
            if (!mapped.tc_kimlik) {
                rowValid = false;
                if (report.hatalar.length < 5) report.hatalar.push(`Satır ${index + 2}: TCKN bulunamadı.`);
            }

            if (mapped.gecikme_gunu !== undefined) hasGecikmeGunu = true;
            if (mapped.sozlesme_tutari !== undefined && !isNaN(mapped.sozlesme_tutari)) hasSozlesmeTutari = true;

            if (rowValid) {
                report.kabul_edilen++;
                mappedData.push(mapped);
            } else {
                report.reddedilen++;
            }
        });

        // Dependency Checks
        if (!hasGecikmeGunu) {
            report.eksik_bagimliliklar.push('Gecikme Günü (DPD) verisi bulunamadı. NPL ve DPD analizleri çalışmayacaktır.');
            report.is_valid = false;
        }

        if (!hasSozlesmeTutari) {
            report.eksik_bagimliliklar.push('Sözleşme Tutarı bulunamadı. Hacim tabanlı risk analizleri hesaplanamaz.');
            report.is_valid = false;
        }

        if (report.kabul_edilen === 0) {
            report.is_valid = false;
            report.hatalar.push('Geçerli hiçbir veri satırı bulunamadı. Lütfen sütun isimlerinizi kontrol edin.');
        }

        return { report, mappedData };
    }

    /**
     * Staging'den Canlıya Aktarım (Process & Load)
     */
    async processAndLoadData(mappedData: any[]) {
        // MVP: Direk veritabanına yazıyoruz. Staging tablosu eklenebilir.
        this.logger.log(`Tabloya yazılıyor... ${mappedData.length} kayıt.`);
        
        let successCount = 0;
        
        for (const data of mappedData) {
            try {
                // Musteriyi bul veya yarat
                const musteri = await this.prisma.musteri.upsert({
                    where: { tc_kimlik: String(data.tc_kimlik) },
                    update: {},
                    create: {
                        tc_kimlik: String(data.tc_kimlik),
                        ad_soyad: data.ad_soyad || 'Bilinmiyor',
                        segment: 'BİREYSEL'
                    }
                });

                // Sozlesme yarat
                await this.prisma.sozlesme.create({
                    data: {
                        sozlesme_no: String(data.sozlesme_no || `Oto-${Date.now()}`),
                        musteri_id: musteri.musteri_id,
                        tutar: data.sozlesme_tutari || 100000,
                        durum: data.iptal_mi ? 'IPTAL' : 'AKTIF',
                        gecikme_gunu: data.gecikme_gunu || 0,
                    }
                });
                
                successCount++;
            } catch (err) {
                this.logger.error(`Veri yazılırken hata: ${err.message}`);
            }
        }

        return successCount;
    }
}
