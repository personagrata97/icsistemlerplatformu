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

    private normalizeKey(key: string): string {
        return key
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ş/g, 's')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[\s\.\-\_\/]/g, '');
    }

    /**
     * Sütun adlarını ve verilerin içeriğini analiz ederek akıllı eşleştirme yapar
     */
    private detectColumnMapping(rawData: any[]): Record<string, string> {
        const mapping: Record<string, string> = {};
        if (rawData.length === 0) return mapping;

        const headers = Object.keys(rawData[0]);
        const assignedFields = new Set<string>();

        // Aşama 1: Sütun İsmine Göre Eşleştirme (Gevşek Eşleşme)
        for (const header of headers) {
            const normalized = this.normalizeKey(header);
            let field: string | null = null;

            if (normalized.includes('tckn') || normalized.includes('kimlik') || normalized === 'tc') {
                field = 'tc_kimlik';
            } else if (normalized.includes('tarih') || normalized.includes('baslangic') || normalized === 'date') {
                field = 'tarih';
            } else if (normalized.includes('tutar') || normalized.includes('bedel') || normalized.includes('hacim') || normalized.includes('volume') || normalized.includes('amount')) {
                field = 'sozlesme_tutari';
            } else if (normalized.includes('gecikme') || normalized.includes('dpd') || normalized.includes('npl') || normalized.includes('delay')) {
                field = 'gecikme_gunu';
            } else if (normalized.includes('bakiye') || normalized.includes('kalan') || normalized.includes('balance')) {
                field = 'kalan_bakiye';
            } else if (normalized.includes('sozlesmeno') || normalized.includes('sozlesmeid') || normalized.includes('hesapno') || normalized === 'sozlesme' || normalized === 'hesap' || normalized.includes('contractno')) {
                field = 'sozlesme_no';
            } else if (normalized.includes('musteri') || normalized.includes('adsoyad') || normalized.includes('adisoyadi') || normalized.includes('unvan') || normalized === 'ad' || normalized === 'adi' || normalized === 'isim') {
                field = 'ad_soyad';
            } else if (normalized.includes('iptal') || normalized.includes('fesih')) {
                field = 'iptal_mi';
            } else if (normalized.includes('vade') || normalized.includes('sure') || normalized.includes('ay') || normalized.includes('period') || normalized.includes('month')) {
                field = 'vade';
            } else if (normalized.includes('bolge') || normalized.includes('region')) {
                field = 'bolge';
            } else if (normalized.includes('sube') || normalized.includes('branch')) {
                field = 'sube';
            } else if (normalized.includes('segment')) {
                field = 'segment';
            } else if (normalized.includes('enyuksektaksit') || normalized.includes('maxtaksit') || normalized.includes('maximumtaksit')) {
                field = 'en_yuksek_taksit';
            } else if (normalized.includes('endusuktaksit') || normalized.includes('mintaksit') || normalized.includes('minimumtaksit')) {
                field = 'en_dusuk_taksit';
            } else if (normalized.includes('ercenteslim') || normalized.includes('teslimatvadesi') || normalized.includes('teslimatayi') || normalized.includes('teslimayi')) {
                field = 'teslimat_ayi';
            }

            if (field && !assignedFields.has(field)) {
                mapping[header] = field;
                assignedFields.add(field);
            }
        }

        // Aşama 2: Değer Analizine Göre Eşleştirme (Heuristic)
        const unassignedHeaders = headers.filter(h => !mapping[h]);
        const requiredFields = ['ad_soyad', 'sozlesme_no', 'sozlesme_tutari', 'vade', 'gecikme_gunu'];
        const missingFields = requiredFields.filter(f => !assignedFields.has(f));

        if (missingFields.length > 0 && rawData.length > 0) {
            const sampleRows = rawData.slice(0, Math.min(20, rawData.length));

            for (const field of missingFields) {
                let bestHeader: string | null = null;

                for (const header of unassignedHeaders) {
                    const values = sampleRows.map(row => row[header]).filter(val => val !== null && val !== undefined && String(val).trim() !== '');
                    if (values.length === 0) continue;

                    if (field === 'ad_soyad') {
                        // Boşluk barındıran ve harf içeren string değerler
                        const spaceStrings = values.filter(val => typeof val === 'string' && val.includes(' ') && /[a-zA-ZıİğĞüÜşŞöÖçÇ]/.test(val));
                        if (spaceStrings.length / values.length > 0.5) {
                            bestHeader = header;
                            break;
                        }
                    } else if (field === 'sozlesme_no') {
                        // Genellikle SZ veya CTR ile başlayan, ya da hem harf hem sayı barındıran ID'ler
                        const isCode = values.filter(val => {
                            const s = String(val).trim();
                            return s.length > 3 && (/\d/.test(s) && /[a-zA-Z]/.test(s) || s.startsWith('SZ') || s.startsWith('CTR') || s.startsWith('SZ-'));
                        });
                        if (isCode.length / values.length > 0.5) {
                            bestHeader = header;
                            break;
                        }
                    } else if (field === 'sozlesme_tutari') {
                        // 1000'den büyük sayısal değerler (Genellikle sözleşme tutarları büyüktür)
                        const largeNums = values.filter(val => {
                            const n = Number(val);
                            return !isNaN(n) && n > 1000;
                        });
                        if (largeNums.length / values.length > 0.8) {
                            bestHeader = header;
                            break;
                        }
                    } else if (field === 'vade') {
                        // 6 ile 360 arasındaki vade ayları
                        const typicalVade = values.filter(val => {
                            const n = Number(val);
                            return !isNaN(n) && Number.isInteger(n) && n >= 6 && n <= 360;
                        });
                        if (typicalVade.length / values.length > 0.8) {
                            bestHeader = header;
                            break;
                        }
                    } else if (field === 'gecikme_gunu') {
                        // 0 ile 1000 arasındaki tam sayılar (Gecikme DPD günleri)
                        const typicalGecikme = values.filter(val => {
                            const n = Number(val);
                            return !isNaN(n) && Number.isInteger(n) && n >= 0 && n < 1000;
                        });
                        if (typicalGecikme.length / values.length > 0.8) {
                            bestHeader = header;
                            break;
                        }
                    }
                }

                if (bestHeader) {
                    mapping[bestHeader] = field;
                    assignedFields.add(field);
                    unassignedHeaders.splice(unassignedHeaders.indexOf(bestHeader), 1);
                }
            }
        }

        return mapping;
    }

    /**
     * Akıllı Sütun Eşleştirme (Smart Column Mapping)
     */
    private mapColumns(rawRow: any, mapping: Record<string, string>): any {
        const mappedRow: any = {};
        const keys = Object.keys(rawRow);

        for (const key of keys) {
            const field = mapping[key];
            if (field) {
                const val = rawRow[key];
                if (field === 'sozlesme_tutari' || field === 'kalan_bakiye' || field === 'gecikme_gunu' || field === 'vade' || field === 'en_yuksek_taksit' || field === 'en_dusuk_taksit' || field === 'teslimat_ayi') {
                    mappedRow[field] = Number(val);
                } else if (field === 'tarih') {
                    if (typeof val === 'number') {
                        // Handle Excel serial date values
                        mappedRow.tarih = new Date((val - 25569) * 86400 * 1000);
                    } else if (val) {
                        mappedRow.tarih = new Date(val);
                    }
                } else if (field === 'iptal_mi') {
                    const strVal = String(val).toLowerCase();
                    mappedRow.iptal_mi = ['evet', 'true', 'iptal', 'fesih', '1'].includes(strVal);
                } else if (field === 'sozlesme_no') {
                    mappedRow.sozlesme_no = String(val);
                } else {
                    mappedRow[field] = val;
                }
            }
        }
        return mappedRow;
    }

    /**
     * Ön İnceleme (Pre-Flight Check)
     */
    async validateExcelData(buffer: Buffer): Promise<{ report: DataQualityReport, mappedData: any[] }> {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        this.logger.log(`Okunan sayfa isimleri: ${workbook.SheetNames.join(', ')}`);
        
        let sheetName = workbook.SheetNames[0];
        let sheet = workbook.Sheets[sheetName];
        let rawData: any[] = [];
        
        // Boş olmayan ilk sayfayı ve o sayfadaki başlık satırını bul
        for (const name of workbook.SheetNames) {
            const currentSheet = workbook.Sheets[name];
            const rows = xlsx.utils.sheet_to_json<any[]>(currentSheet, { header: 1 });
            
            let headerRowIndex = 0;
            let maxScore = 0;
            
            for (let i = 0; i < Math.min(20, rows.length); i++) {
                const row = rows[i];
                if (!Array.isArray(row)) continue;
                
                let score = 0;
                for (const cell of row) {
                    if (cell === null || cell === undefined || cell === '') continue;
                    const normalized = this.normalizeKey(String(cell));
                    
                    if (normalized.includes('tckn') || normalized.includes('kimlik') || normalized === 'tc' ||
                        normalized.includes('tarih') || normalized.includes('baslangic') || normalized === 'date' ||
                        normalized.includes('tutar') || normalized.includes('bedel') || normalized.includes('hacim') || normalized.includes('volume') || normalized.includes('amount') ||
                        normalized.includes('gecikme') || normalized.includes('dpd') || normalized.includes('npl') || normalized.includes('delay') ||
                        normalized.includes('sozlesmeno') || normalized.includes('sozlesmeid') || normalized.includes('hesapno') || normalized === 'sozlesme' || normalized === 'hesap' || normalized.includes('contractno') ||
                        normalized.includes('musteri') || normalized.includes('adsoyad') || normalized.includes('adisoyadi') || normalized.includes('unvan') || normalized === 'ad' || normalized === 'adi' || normalized === 'isim' ||
                        normalized.includes('vade') || normalized.includes('sure') || normalized.includes('ay') || normalized.includes('period') || normalized.includes('month')) {
                        score++;
                    }
                }
                
                if (score > maxScore) {
                    maxScore = score;
                    headerRowIndex = i;
                }
            }
            
            // Eğer anlamlı bir başlık satırı eşleşmesi varsa veya başka satır yoksa bu index'i kullan
            const data = xlsx.utils.sheet_to_json(currentSheet, { range: headerRowIndex });
            if (data.length > 0) {
                sheetName = name;
                sheet = currentSheet;
                rawData = data;
                this.logger.log(`Sayfa seçildi: ${name}, tespit edilen başlık satırı index: ${headerRowIndex}, veri satırı sayısı: ${data.length}`);
                break;
            }
        }

        // Filter out completely empty rows
        const validRawRows = rawData.filter((row: any) => {
            return Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '');
        });

        // Detect column mapping using loose name checks and content heuristics
        const columnMapping = this.detectColumnMapping(validRawRows);

        const report: DataQualityReport = {
            toplam_satir: validRawRows.length,
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

        validRawRows.forEach((row: any, index: number) => {
            const mapped = this.mapColumns(row, columnMapping);
            let rowValid = true;

            // Type Validations
            if (!mapped.ad_soyad) {
                rowValid = false;
                if (report.hatalar.length < 5) report.hatalar.push(`Satır ${index + 2}: Müşteri adı (Ad Soyad) bulunamadı.`);
            }

            if (mapped.gecikme_gunu !== undefined && !isNaN(mapped.gecikme_gunu)) hasGecikmeGunu = true;
            if (mapped.sozlesme_tutari !== undefined && !isNaN(mapped.sozlesme_tutari)) hasSozlesmeTutari = true;

            // Temmuz 2026 Mevzuat Kontrolleri (Taksit 1/3 Kuralı, Erken Teslimat Oranı ve Teslimat Süreleri)
            if (mapped.en_yuksek_taksit && mapped.en_dusuk_taksit) {
                const maxTaksit = Number(mapped.en_yuksek_taksit);
                const minTaksit = Number(mapped.en_dusuk_taksit);
                if (maxTaksit > 0 && minTaksit < maxTaksit / 3) {
                    if (report.uyarilar.length < 5) {
                        report.uyarilar.push(`Satır ${index + 2}: Taksit 1/3 Kuralı İhlali! En düşük taksit (${minTaksit.toFixed(0)} TL), en yüksek taksitin (${maxTaksit.toFixed(0)} TL) üçte birinden az olamaz.`);
                    }
                }
            }

            if (mapped.teslimat_ayi && mapped.vade) {
                const teslimAy = Number(mapped.teslimat_ayi);
                const vade = Number(mapped.vade);
                
                // Temmuz 2026 BDDK: En erken teslimat vadesi 6 ay (180 gün) olmalıdır.
                if (teslimAy < 6) {
                    if (report.uyarilar.length < 5) {
                        report.uyarilar.push(`Satır ${index + 2}: Teslim Süresi İhlali! En erken teslimat vadesi 6 aydan (180 gün) az olamaz.`);
                    }
                }
                
                // Temmuz 2026 BDDK: Tahsisat vadesi toplam vadenin %45'inden önce olamaz (Erken Teslim Azami Oranı)
                const erkenTeslimOrani = teslimAy / vade;
                if (erkenTeslimOrani < 0.45) {
                    if (report.uyarilar.length < 5) {
                        report.uyarilar.push(`Satır ${index + 2}: Erken Teslim Oranı İhlali! Teslimat vadesi (${teslimAy}. ay) toplam vadenin (${vade} ay) %45'inden önce olamaz.`);
                    }
                }
            }

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
        this.logger.log(`Tabloya yazılıyor... ${mappedData.length} kayıt.`);
        
        let successCount = 0;
        
        for (const data of mappedData) {
            try {
                // Musteriyi bul veya ad_soyad ile yarat
                let musteri = await this.prisma.musteri.findFirst({
                    where: { ad_soyad: String(data.ad_soyad) }
                });

                if (!musteri) {
                    musteri = await this.prisma.musteri.create({
                        data: {
                            ad_soyad: data.ad_soyad || 'Bilinmiyor',
                            segment: data.segment || 'BİREYSEL',
                            bolge: data.bolge || 'Marmara',
                            sube: data.sube || 'Merkez'
                        }
                    });
                }

                const toplamTutar = Number(data.sozlesme_tutari || 150000);
                const vade = Number(data.vade || 120);
                const taksitTutari = toplamTutar / vade;
                const baslangicTarihi = data.tarih || new Date();

                // Teslimat Planlanan Tarihi hesapla (Başlangıç Tarihi + Vade Ayı)
                const teslimTarihiPlanlanan = new Date(baslangicTarihi);
                teslimTarihiPlanlanan.setMonth(teslimTarihiPlanlanan.getMonth() + vade);

                // Sozlesme yarat veya guncelle
                const sozlesmeId = String(data.sozlesme_no || `Oto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
                const existingSozlesme = await this.prisma.sozlesme.findUnique({
                    where: { sozlesme_id: sozlesmeId }
                });

                let sozlesme;
                if (existingSozlesme) {
                    sozlesme = await this.prisma.sozlesme.update({
                        where: { sozlesme_id: sozlesmeId },
                        data: {
                            toplam_tutar: toplamTutar,
                            vade: vade,
                            taksit_tutari: taksitTutari,
                            durum: data.iptal_mi ? 'IPTAL' : 'AKTIF',
                            iptal_durumu: !!data.iptal_mi,
                            iptal_tarihi: data.iptal_mi ? (existingSozlesme.iptal_tarihi || new Date()) : null,
                        }
                    });
                } else {
                    sozlesme = await this.prisma.sozlesme.create({
                        data: {
                            sozlesme_id: sozlesmeId,
                            musteri_id: musteri.musteri_id,
                            toplam_tutar: toplamTutar,
                            vade: vade,
                            taksit_tutari: taksitTutari,
                            baslangic_tarihi: baslangicTarihi,
                            teslim_tarihi_planlanan: teslimTarihiPlanlanan,
                            durum: data.iptal_mi ? 'IPTAL' : 'AKTIF',
                            iptal_durumu: !!data.iptal_mi,
                            iptal_tarihi: data.iptal_mi ? new Date() : null,
                        }
                    });
                }

                // Gecikme hareketi ekleme veya guncelleme
                if (data.gecikme_gunu || data.kalan_bakiye) {
                    const existingOdeme = await this.prisma.odemeHareketi.findFirst({
                        where: {
                            sozlesme_id: sozlesme.sozlesme_id,
                            tip: 'GECIKME'
                        }
                    });

                    if (existingOdeme) {
                        await this.prisma.odemeHareketi.update({
                            where: { hareket_id: existingOdeme.hareket_id },
                            data: {
                                tutar: Number(data.kalan_bakiye || 0),
                                gecikme_gun: Number(data.gecikme_gunu || 0),
                                tarih: new Date()
                            }
                        });
                    } else {
                        await this.prisma.odemeHareketi.create({
                            data: {
                                sozlesme_id: sozlesme.sozlesme_id,
                                tarih: new Date(),
                                tutar: Number(data.kalan_bakiye || 0),
                                tip: 'GECIKME',
                                gecikme_gun: Number(data.gecikme_gunu || 0),
                            }
                        });
                    }
                }
                
                successCount++;
            } catch (err) {
                this.logger.error(`Veri yazılırken hata: ${err.message}`);
            }
        }

        return successCount;
    }
}
