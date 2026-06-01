import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { WorkpaperService } from './workpaper.service';
import { NotificationService } from '../common/notification/notification.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class SamplingService {
    private readonly logger = new Logger(SamplingService.name);

    constructor(
        private prisma: PrismaService,
        private workpaperService: WorkpaperService,
        private notificationService: NotificationService,
        private auditLogService: AuditLogService
    ) { }

    // Get all samples
    async getAll(filters?: { auditId?: string; method?: string; status?: string }) {
        const where: Prisma.AuditSampleWhereInput = {};
        if (filters?.auditId) where.auditId = filters.auditId;
        if (filters?.method) where.method = filters.method;
        if (filters?.status) where.status = filters.status;

        return this.prisma.auditSample.findMany({
            where,
            include: {
                audit: {
                    select: {
                        id: true,
                        title: true,
                        auditCode: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async getById(id: string) {
        const sample = await this.prisma.auditSample.findUnique({
            where: { id },
            include: {
                audit: {
                    select: {
                        id: true,
                        title: true,
                        auditCode: true,
                    },
                },
            },
        });
        if (!sample) throw new NotFoundException('Örnekleme planı bulunamadı');
        return sample;
    }

    // Create new sample plan
    async create(data: Prisma.AuditSampleCreateInput, user?: any) {
        const result = await this.prisma.auditSample.create({
            data: {
                ...(data as any),
                creatorId: user?.id,
                creatorName: user?.displayName || user?.username,
            },
            include: {
                audit: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        // Y2: Loglama
        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'Sistem',
                action: 'Örneklem Oluşturuldu',
                details: `"${result.title}" başlıklı örneklem planı oluşturuldu.`,
                targetType: 'AuditSample',
                targetId: result.id
            });
        }

        return result;
    }

    // Update sample plan
    async update(id: string, data: any) {
        const sample = await this.getById(id);

        let updateData = { ...data };

        // Eğer statü "Tamamlandı"ya çekiliyorsa veya sapma verisi geldiyse istatistikleri hesapla
        if (data.status === 'Tamamlandı' || data.deviationsFound !== undefined) {
            const deviationsFound = data.deviationsFound !== undefined ? data.deviationsFound : sample.deviationsFound;
            const stats = this.evaluateSampleResults(
                sample.sampleSize || 0,
                sample.populationSize || 0,
                Number(deviationsFound || 0),
                Number(sample.confidenceLevel || 95),
                Number(sample.errorRate || 5)
            );

            updateData = {
                ...updateData,
                observedDeviationRate: stats.observedDeviationRate,
                upperDeviationRate: stats.upperDeviationRate,
                precisionRate: stats.precisionRate,
                confidenceIntervalLower: stats.confidenceIntervalLower,
                confidenceIntervalUpper: stats.confidenceIntervalUpper,
                projectedPopulationErrors: stats.projectedPopulationErrors,
                sampleAdequacy: stats.sampleAdequacy,
                // Eğer kullanıcı bir kanaat belirtmemişse ve sapma sayısı da varsa otomatik kanaat oluştur
                conclusions: data.conclusions || (stats.upperDeviationRate <= Number(sample.errorRate || 5) ? 'Kabul' : 'Red')
            };
        }

        return this.prisma.auditSample.update({
            where: { id },
            data: updateData,
            include: {
                audit: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
    }

    // Delete sample plan
    async delete(id: string, user?: any) {
        const sample = await this.getById(id);
        const result = await this.prisma.auditSample.delete({ where: { id } });

        // Y2: Loglama (Hard delete yapılıyor)
        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'Sistem',
                action: 'Örneklem Silindi',
                details: `"${sample.title}" başlıklı, ${sample.method} yöntemli örneklem silindi.`,
                targetType: 'Audit',
                targetId: sample.auditId || id
            });
        }

        // Build notification
        if (this.notificationService && user) {
            try {
                await this.notificationService.create({
                    userId: user.id,
                    title: 'Örneklem Silindi',
                    description: `"${sample.title}" başlıklı, ${sample.method} bazlı örneklem başarıyla silindi.`,
                    type: 'warning',
                    category: 'DENETİM',
                });
            } catch (err) {
                this.logger.error('Bildirim oluşturulamadı:', err);
            }
        }

        return result;
    }

    async convertToFinding(id: string, user: any) {
        const sample = await this.prisma.auditSample.findUnique({
            where: { id },
            include: { audit: true }
        });

        if (!sample) throw new NotFoundException('Örneklem bulunamadı');
        if (sample.findingId) throw new Error('Bu örneklem için zaten bir bulgu oluşturulmuş.');

        // K1: Denetim durumu whitelist kontrolü — Sealing bypass engeli
        const ALLOWED_STATUSES = ['Taslak', 'Planlandı', 'Devam Ediyor', 'Raporlanıyor'];
        if (sample.audit && !ALLOWED_STATUSES.includes(sample.audit.status)) {
            throw new Error(`Bu denetim "${sample.audit.status}" durumunda olduğu için yeni bulgu oluşturulamaz. (Rapor Bütünlüğü Koruması)`);
        }

        const findingTitle = `Örneklem Hatası: ${sample.title}`;
        const findingDescription = `Yapılan ${sample.method} örnekleme sonucunda tespit edilen sapmalar: ${sample.deviationsFound || 0} / ${sample.sampleSize}. \n\nNotlar: ${sample.notes || ''}`;

        const finding = await this.prisma.finding.create({
            data: {
                auditId: sample.auditId,
                title: findingTitle,
                description: findingDescription,
                risk: 'Orta',
                status: 'Taslak',
                department: sample.audit.department,
                assignedUserId: user.id,
                created_at: new Date()
            }
        });

        await this.prisma.auditSample.update({
            where: { id },
            data: { findingId: finding.id, status: 'Bulguya Dönüştürüldü' }
        });

        // Y2: Loglama
        if (user) {
            await this.auditLogService.createLog({ 
                user: user.displayName || user.username || 'Sistem',
                action: 'Örneklemden Bulgu Oluşturuldu',
                details: `"${sample.title}" örneklemi sonucunda tespit edilen hatalar için bulgu oluşturuldu.`,
                targetType: 'AuditSample',
                targetId: sample.id
            });
        }

        return finding;
    }

    // Örneklem büyüklüğü hesaplama (istatistiksel formül)
    calculateSampleSize(data: {
        populationSize: number;
        confidenceLevel: number;
        errorRate: number;
        expectedErrorRate?: number; // Denetçinin beklediği hata oranı (%)
    }): { sampleSize: number; formula: string } {
        const { populationSize, confidenceLevel, errorRate } = data;

        // Z-skoru (güven düzeyine göre)
        let zScore = 1.96;
        if (confidenceLevel >= 99) zScore = 2.576;
        else if (confidenceLevel >= 95) zScore = 1.96;
        else if (confidenceLevel >= 90) zScore = 1.645;
        else if (confidenceLevel >= 85) zScore = 1.44;
        else if (confidenceLevel >= 80) zScore = 1.28;

        // Beklenen sapma oranı: Denetçi tahmini varsa onu kullan, yoksa en kötü durum (0.5)
        const p = data.expectedErrorRate !== undefined ? Math.min(Math.max(data.expectedErrorRate / 100, 0.0001), 0.9999) : 0.5;
        const e = Math.max(0.0001, errorRate / 100); // division by zero koruması

        // Sonlu popülasyon düzeltmeli formül
        const n0 = (zScore * zScore * p * (1 - p)) / (e * e);
        const n = n0 / (1 + (n0 - 1) / populationSize);

        const sampleSize = Math.ceil(n);

        const formula = `n = (Z² × p × (1-p) / e²) / (1 + (n₀-1) / N)
Z = ${zScore} (güven düzeyi: %${confidenceLevel})
p = ${p} (beklenen sapma oranı${data.expectedErrorRate !== undefined ? ': %' + data.expectedErrorRate : ' - en kötü durum'})
e = ${e} (kabul edilebilir hata payı: %${errorRate})
N = ${populationSize} (evren büyüklüğü)
n₀ = ${Math.ceil(n0)}
n = ${sampleSize}`;

        return { sampleSize, formula };
    }

    // Advanced Sampling with JSON Array Config & Rules (No File Upload - Safe Memory)
    async generateAdvancedSample(config: any, user?: any) {
        if (!config || !config.populationData || !Array.isArray(config.populationData)) {
            throw new Error('Gönderilen veri dizisi (Population Data) geçersiz veya bulunamadı.');
        }

        try {
            // Frontend'den Excel tablosunun parse edilmiş tertemiz JSON objesi geldi.
            const rows = config.populationData;
            const initialPopulationSize = rows.length;

            if (initialPopulationSize === 0) throw new Error('Veri seti tamamen boş.');

            // 2. Apply Rule Engine (Filters & Sorts)
            let processedData = [...rows];

            if (config.rules && Array.isArray(config.rules)) {
                // APPLY FILTERS
                const filterRules = config.rules.filter((r: any) => r.type === 'filter');
                for (const rule of filterRules) {
                    processedData = processedData.filter(row => {
                        const rowValue = row[rule.column];
                        if (rowValue === undefined || rowValue === null) return false;

                        const ruleVal = rule.value;

                        // Array Rule Evaluation for Multi-Selects!
                        if (Array.isArray(ruleVal)) {
                            // Empty array means no filter logic effectively, but UI prevents empty arrays usually.
                            if (ruleVal.length === 0) return true;
                            // Check if current row's string value is IN the selected array
                            return ruleVal.includes(rowValue.toString());
                        }

                        // Singular Rule Evaluation
                        const numRowVal = Number(rowValue);
                        const numRuleVal = Number(ruleVal);
                        const isNum = !isNaN(numRowVal) && !isNaN(numRuleVal) && ruleVal !== "";

                        switch (rule.operator) {
                            case '>': return isNum ? numRowVal > numRuleVal : false;
                            case '<': return isNum ? numRowVal < numRuleVal : false;
                            case '=': return rowValue.toString() === ruleVal.toString();
                            case '!=': return rowValue.toString() !== ruleVal.toString();
                            case 'contains': return rowValue.toString().toLowerCase().includes(ruleVal.toString().toLowerCase());
                            case 'between': {
                                if (typeof ruleVal !== 'string') return true;
                                const parts = ruleVal.split('-').map(p => p.trim());
                                if (parts.length !== 2) return true;

                                const [minStr, maxStr] = parts;

                                // Check if it's a date range (DD.MM.YYYY)
                                const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
                                if (dateRegex.test(minStr) && dateRegex.test(maxStr)) {
                                    const parseDate = (dStr: string) => {
                                        const [d, m, y] = dStr.split('.').map(Number);
                                        return new Date(y, m - 1, d).getTime();
                                    };

                                    const rowDateValue = rowValue.toString();
                                    const rowDate = parseDate(rowDateValue);
                                    const minDate = parseDate(minStr);
                                    const maxDate = parseDate(maxStr);

                                    if (!isNaN(rowDate) && !isNaN(minDate) && !isNaN(maxDate)) {
                                        return rowDate >= minDate && rowDate <= maxDate;
                                    }
                                }

                                // Fallback to numeric range
                                const nRow = Number(rowValue.toString().replace(/\./g, '').replace(',', '.'));
                                const nMin = Number(minStr.replace(/\./g, '').replace(',', '.'));
                                const nMax = Number(maxStr.replace(/\./g, '').replace(',', '.'));

                                if (!isNaN(nRow) && !isNaN(nMin) && !isNaN(nMax)) {
                                    return nRow >= nMin && nRow <= nMax;
                                }
                                return true;
                            }
                            default: return true;
                        }
                    });
                }

                // APPLY SORTS
                const sortRules = config.rules.filter((r: any) => r.type === 'sort');
                if (sortRules.length > 0) {
                    const rule = sortRules[0]; // Support first sort rule for now
                    processedData.sort((a, b) => {
                        let valA = a[rule.column]; let valB = b[rule.column];
                        if (typeof valA === 'number' && typeof valB === 'number') {
                            return rule.direction === 'desc' ? valB - valA : valA - valB;
                        }
                        valA = valA ? valA.toString() : ''; valB = valB ? valB.toString() : '';
                        return rule.direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
                    });
                }
            }

            const filteredPopulationSize = processedData.length;
            if (filteredPopulationSize === 0) throw new Error('Kurallar uygulandıktan sonra veri setinde hiçbir satır kalmadı. Kuralları esnetin.');

            let sampleSize = Number(config.sampleSize) || 50;
            if (sampleSize > filteredPopulationSize) sampleSize = filteredPopulationSize;

            // 3. Select Samples via Method
            let finalSelection: any[] = [];

            if (config.method === 'Rastgele' || config.method === 'Yargısal') {
                const shuffled = [...processedData].sort(() => 0.5 - Math.random());
                finalSelection = shuffled.slice(0, sampleSize);
                config.redistributionMessage = `Tamamen rastgele seçim yöntemi uygulanmıştır. Filtrelenmiş ${filteredPopulationSize} kayıt arasından her bir kaydın seçilme şansı eşit olacak şekilde ${finalSelection.length} adet veri çekilmiştir.`;
            } else if (config.method === 'Sistematik') {
                const interval = Math.floor(filteredPopulationSize / sampleSize);
                const startPoint = Math.floor(Math.random() * interval);

                let current = startPoint;
                while (current < filteredPopulationSize && finalSelection.length < sampleSize) {
                    finalSelection.push(processedData[current]);
                    current += interval;
                }
                config.redistributionMessage = `Sistematik seçim yöntemi uygulanmıştır. ${filteredPopulationSize} kayıtlık veri seti ${interval} aralıklarla taranmış ve başlangıç noktası olarak rastgele ${startPoint + 1}. kayıt seçilerek süreç tamamlanmıştır.`;
            } else if (config.method === 'Tabakalı') {
                const stratCol = config.stratifiedColumn;
                if (!stratCol) throw new Error('Tabakalı seçim için gruplama kolonu belirtilmedi.');

                // 3.1 Gruplara (Tabakalara) Ayır
                const groups: { [key: string]: any[] } = {};
                processedData.forEach(row => {
                    const val = row[stratCol] ? row[stratCol].toString() : 'Belirtilmemiş';
                    if (!groups[val]) groups[val] = [];
                    groups[val].push(row);
                });

                const groupKeys = Object.keys(groups);
                if (groupKeys.length === 0) throw new Error('Gruplanacak veri bulunamadı.');

                // 3.2 ORANTILI DAĞILIM (IIA/ISA Standardı - Proportional Allocation)
                // Her tabakadan, popülasyondaki oranına göre örneklem seç
                const selectedFromGroups = new Set<any>();
                let redistributionHappened = false;

                // Her gruba orantısal pay hesapla
                const groupAllocations: { key: string; allocation: number }[] = [];
                for (const key of groupKeys) {
                    const proportion = groups[key].length / filteredPopulationSize;
                    const allocation = Math.max(1, Math.round(sampleSize * proportion)); // En az 1
                    groupAllocations.push({ key, allocation });
                }

                // Yuvarlama düzeltmesi: toplam allocation = sampleSize olmalı
                let totalAllocated = groupAllocations.reduce((sum, g) => sum + g.allocation, 0);
                // Sırala: en büyük gruptan başla
                groupAllocations.sort((a, b) => groups[b.key].length - groups[a.key].length);
                while (totalAllocated > sampleSize) {
                    // Fazlayı en küçük gruptan düş
                    const smallest = [...groupAllocations].reverse().find(g => g.allocation > 1);
                    if (smallest) { smallest.allocation--; totalAllocated--; }
                    else break;
                }
                while (totalAllocated < sampleSize) {
                    // Eksiği en büyük gruptna tamamla
                    groupAllocations[0].allocation++;
                    totalAllocated++;
                }

                // Her gruptan payını rastgele seç
                let remainingTotal = sampleSize;
                for (const { key, allocation } of groupAllocations) {
                    const groupData = groups[key];
                    const take = Math.min(allocation, groupData.length, remainingTotal);

                    if (groupData.length < allocation) {
                        redistributionHappened = true;
                    }

                    const shuffled = [...groupData].sort(() => 0.5 - Math.random());
                    const taken = shuffled.slice(0, take);
                    finalSelection.push(...taken);
                    taken.forEach(item => selectedFromGroups.add(item));
                    remainingTotal -= take;
                }

                // 3.3 HALA EKSİK VARSA (küçük tabakalarda veri yetersiz kaldıysa)
                if (remainingTotal > 0) {
                    redistributionHappened = true;
                    const notSelected = processedData.filter(item => !selectedFromGroups.has(item));
                    const shuffledRemaining = [...notSelected].sort(() => 0.5 - Math.random());
                    const take = Math.min(remainingTotal, shuffledRemaining.length);
                    finalSelection.push(...shuffledRemaining.slice(0, take));
                }

                if (redistributionHappened) {
                    config.redistributionMessage = `Tabakalı seçim yöntemi (orantısal dağılım) uygulanmıştır. Bazı tabakalarda yeterli veri bulunmadığından, eksik paylar diğer tabakalardan dengelenerek toplam ${finalSelection.length} adet örneklem seçilmiştir.`;
                } else {
                    config.redistributionMessage = `Tabakalı seçim yöntemi (orantısal dağılım) uygulanmıştır. Veri seti "${stratCol}" kolonuna göre ${groupKeys.length} tabakaya ayrılmış ve her tabakadan popülasyondaki oranı nispetinde toplam ${finalSelection.length} adet örneklem seçilmiştir.`;
                }
            } else if (config.method === 'MUS') {
                // Parasal Birim Örneklemesi
                const headers = processedData.length > 0 ? Object.keys(processedData[0]) : [];
                const moneyCol = headers.find(c =>
                    c.toLowerCase().includes('tutar') || c.toLowerCase().includes('bakiye') || c.toLowerCase().includes('fon')
                ) || headers[0];
                if (!moneyCol) {
                    const shuffled = [...processedData].sort(() => 0.5 - Math.random());
                    finalSelection = shuffled.slice(0, sampleSize);
                } else {
                    const dataWithWeights = processedData.map(row => {
                        const val = row[moneyCol]?.toString().replace(/\./g, '').replace(',', '.') || '0';
                        return { row, weight: Math.max(0, Number(val)) };
                    });

                    const totalWeight = dataWithWeights.reduce((sum, item) => sum + item.weight, 0);

                    if (totalWeight === 0) {
                        finalSelection = [...processedData].sort(() => 0.5 - Math.random()).slice(0, sampleSize);
                    } else {
                        const selectedIndices = new Set<number>();

                        const nonZeroCount = dataWithWeights.filter(item => item.weight > 0).length;
                        const targetWeightedCount = Math.min(sampleSize, nonZeroCount);

                        // Ağırlıklı seçim döngüsü
                        while (selectedIndices.size < targetWeightedCount && selectedIndices.size < processedData.length) {
                            let random = Math.random() * totalWeight;
                            for (let i = 0; i < dataWithWeights.length; i++) {
                                random -= dataWithWeights[i].weight;
                                if (random <= 0) {
                                    selectedIndices.add(i);
                                    break;
                                }
                            }
                        }

                        if (selectedIndices.size < sampleSize && processedData.length >= sampleSize) {
                            const unselected = processedData.map((row, idx) => ({ row, idx })).filter(x => !selectedIndices.has(x.idx));
                            const shuffledRemaining = [...unselected].sort(() => 0.5 - Math.random());
                            const take = Math.min(sampleSize - selectedIndices.size, shuffledRemaining.length);
                            for (let i = 0; i < take; i++) {
                                selectedIndices.add(shuffledRemaining[i].idx);
                            }
                        }

                        finalSelection = Array.from(selectedIndices).map(idx => processedData[idx]);
                        config.redistributionMessage = `Parasal Birim Örneklemesi yöntemi uygulanmıştır. Seçimler "${moneyCol}" kolonundaki tutarların büyüklüğüyle orantılı olarak yapılmıştır (Büyük tutarlı kalemlerin seçilme şansı daha yüksektir).`;
                    }
                }
            } else if (config.method === 'Küme') {
                // Küme (Cluster) Örneklemesi
                const clusterCol = config.stratifiedColumn || config.clusterColumn;
                if (!clusterCol) throw new Error('Küme seçimi için gruplama kolonu belirtilmedi.');

                const clusters: { [key: string]: any[] } = {};
                processedData.forEach(row => {
                    const val = row[clusterCol] ? row[clusterCol].toString() : 'Belirtilmemiş';
                    if (!clusters[val]) clusters[val] = [];
                    clusters[val].push(row);
                });

                const clusterKeys = Object.keys(clusters);
                if (clusterKeys.length === 0) throw new Error('Kümelenecek veri bulunamadı.');

                const avgClusterSize = processedData.length / clusterKeys.length;
                let clustersToSelect = Math.max(1, Math.round(sampleSize / avgClusterSize));
                clustersToSelect = Math.min(clustersToSelect, clusterKeys.length);

                const shuffledKeys = [...clusterKeys].sort(() => 0.5 - Math.random());
                const selectedClusterKeys = shuffledKeys.slice(0, clustersToSelect);

                for (const key of selectedClusterKeys) {
                    finalSelection.push(...clusters[key]);
                }
                config.redistributionMessage = `Küme örneklemesi yöntemi uygulanmıştır. "${clusterCol}" kolonu baz alınarak popülasyon ${clusterKeys.length} kümeye ayrılmış, rastgele seçilen ${selectedClusterKeys.length} kümenin (${selectedClusterKeys.join(', ')}) tüm kayıtları örnekleme dahil edilmiştir.`;
            } else {
                // Bilinmeyen metot: ilk N kaydı al
                finalSelection = processedData.slice(0, sampleSize);
            }

            // 4. Save to DB
            // O4: auditId zorunlu — yoksa rastgele denetime bağlanma yerine hata fırlat
            const finalAuditId = config.auditId;
            if (!finalAuditId) {
                throw new Error('Örneklem oluşturmak için bir denetim (auditId) seçilmelidir. Denetim seçmeden örneklem oluşturulamaz.');
            }

            try {
                const sample = await this.prisma.auditSample.create({
                    data: {
                        auditId: finalAuditId,
                        title: config.title || 'Gelişmiş Kural Örneklemi',
                        method: config.method || 'Yargısal',
                        populationSize: filteredPopulationSize, // Save the actual population size AFTER filtering
                        sampleSize: finalSelection.length,
                        confidenceLevel: config.confidenceLevel ? Number(config.confidenceLevel) : 95,
                        errorRate: config.errorRate ? Number(config.errorRate) : 5,
                        status: 'Seçildi',
                        selectedItems: JSON.stringify(finalSelection), // Stores actual JSON objects!
                        notes: `Toplam ${initialPopulationSize} kayıt üstüne ${config.rules?.length || 0} kural işletilip ${filteredPopulationSize} kayıt elde edildi. ${finalSelection.length} satır ayrıldı. (Metot: ${config.method}${config.stratifiedColumn ? ' - ' + config.stratifiedColumn : ''})${config.redistributionMessage ? ' ' + config.redistributionMessage : ''}`,
                        creatorId: user?.id as string | undefined,
                        creatorName: user?.displayName || user?.username,
                    } as any
                });

                // Y2: Loglama
                if (user) {
                    await this.auditLogService.createLog({ 
                        user: user.displayName || user.username || 'Sistem',
                        action: 'Gelişmiş Örneklem Oluşturuldu',
                        details: `${config.rules?.length || 0} kural işletilerek ${finalSelection.length} adet örneklem seçildi.`,
                        targetType: 'AuditSample',
                        targetId: sample.id
                    });
                }

                return sample;
            } catch (dbError: any) {
                this.logger.error('Veritabanı kayıt hatası:', dbError);
                throw new Error(`Örneklem DB'ye kaydedilemedi: ${dbError.message}`);
            }
        } catch (error: any) {
            this.logger.error('Advanced Sampling Error ROOT CAUSE:', error);
            throw new Error(`Örneklem oluşturulamadı. Sunucu Hatası: ${error.message}`);
        }
    }

    // Perform random selection
    async performSelection(id: string, data?: { items?: string[] }): Promise<any> {
        const sample = await this.getById(id);

        if (sample.status !== 'Planlandı') {
            throw new Error('Sadece planlanmış örneklemeler için seçim yapılabilir');
        }

        let selectedItems: number[] = [];

        // If items provided, use them; otherwise generate random numbers
        if (data?.items && data.items.length > 0) {
            selectedItems = data.items.map(i => parseInt(i));
        } else {
            // Generate random selection
            const population = Array.from({ length: sample.populationSize }, (_, i) => i + 1);
            selectedItems = this.getRandomSelection(population, sample.sampleSize);
        }

        return this.prisma.auditSample.update({
            where: { id },
            data: {
                status: 'Seçildi',
                // actualSelected: selectedItems.length,
                // selectionDate: new Date(),
                selectedItems: JSON.stringify(selectedItems),
            },
        });
    }

    // Helper: Random selection without replacement
    private getRandomSelection(population: number[], sampleSize: number): number[] {
        const shuffled = [...population].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, sampleSize).sort((a, b) => a - b);
    }

    // Systematic sampling selection
    async systematicSelection(id: string): Promise<any> {
        const sample = await this.getById(id);

        if (sample.method !== 'Sistematik') {
            throw new Error('Bu yöntem sadece sistematik örnekleme için geçerli');
        }

        const interval = Math.floor(sample.populationSize / sample.sampleSize);
        const startPoint = Math.floor(Math.random() * interval) + 1;

        const selectedItems: number[] = [];
        let current = startPoint;
        while (current <= sample.populationSize && selectedItems.length < sample.sampleSize) {
            selectedItems.push(current);
            current += interval;
        }

        return this.prisma.auditSample.update({
            where: { id },
            data: {
                status: 'Seçildi',
                // actualSelected: selectedItems.length,
                // selectionDate: new Date(),
                selectedItems: JSON.stringify({
                    method: 'systematic',
                    interval,
                    startPoint,
                    items: selectedItems,
                }),
            },
        });
    }

    // Test sonuçlarını kaydet ve istatistiksel değerlendirme yap
    async recordResults(id: string, data: {
        testResult: string;
        deviationsFound: number;
        conclusions?: string;
        notes?: string;
    }) {
        const sample = await this.getById(id);

        // İstatistiksel değerlendirme hesapla
        const stats = this.evaluateSampleResults(
            sample.sampleSize,
            sample.populationSize,
            data.deviationsFound,
            Number(sample.confidenceLevel || 95),
            Number(sample.errorRate || 5)
        );

        // Otomatik karar: Üst Sapma Oranı ≤ Kabul Edilebilir Hata Oranı → Kabul
        const autoConclusion = stats.upperDeviationRate <= Number(sample.errorRate || 5)
            ? 'Kabul'
            : 'Red';

        const updated = await this.prisma.auditSample.update({
            where: { id },
            data: {
                testResult: data.testResult,
                deviationsFound: data.deviationsFound,
                conclusions: data.conclusions || autoConclusion,
                notes: data.notes,
                status: 'Tamamlandı',
                observedDeviationRate: stats.observedDeviationRate,
                upperDeviationRate: stats.upperDeviationRate,
                precisionRate: stats.precisionRate,
                confidenceIntervalLower: stats.confidenceIntervalLower,
                confidenceIntervalUpper: stats.confidenceIntervalUpper,
                projectedPopulationErrors: stats.projectedPopulationErrors,
                sampleAdequacy: stats.sampleAdequacy,
            },
        });

        // Y2: Loglama
        // user parametresi olmadığı için sistem bazlı sayıyoruz veya context eklenebilir.
        await this.auditLogService.createLog({ 
            user: 'Sistem', // recordResults metodu genelde user almıyordu, varsa param ekleneblir
            action: 'Örneklem Sonuçları Kaydedildi',
            details: `Örneklem test sonuçları kaydedildi. Kanaat: ${data.conclusions || autoConclusion}`,
            targetType: 'AuditSample',
            targetId: id
        });

        return updated;
    }

    // İstatistiksel Değerlendirme Fonksiyonu
    private evaluateSampleResults(
        sampleSize: number,
        populationSize: number,
        deviationsFound: number,
        confidenceLevel: number,
        tolerableErrorRate: number
    ) {
        // Z-skoru
        let zScore = 1.96;
        if (confidenceLevel >= 99) zScore = 2.576;
        else if (confidenceLevel >= 95) zScore = 1.96;
        else if (confidenceLevel >= 90) zScore = 1.645;

        const n = sampleSize;
        const N = populationSize;

        // 1. Gözlemlenen Sapma Oranı
        const pHat = n > 0 ? deviationsFound / n : 0;
        const observedDeviationRate = Math.round(pHat * 10000) / 100; // Yüzde olarak (2 ondalık)

        // 2. Kesinlik (Precision) — Sonlu popülasyon düzeltmeli
        const fpc = N > 0 ? Math.sqrt((N - n) / N) : 1; // Sonlu popülasyon düzeltme çarpanı
        const precision = n > 0 ? zScore * Math.sqrt((pHat * (1 - pHat)) / n) * fpc : 0;
        const precisionRate = Math.round(precision * 10000) / 100;

        // 3. Üst Sapma Oranı (Upper Deviation Rate)
        const udr = pHat + precision;
        const upperDeviationRate = Math.round(udr * 10000) / 100;

        // 4. Güven Aralığı (Alt ve Üst Sınır)
        const confidenceIntervalLower = Math.round(Math.max(0, pHat - precision) * 10000) / 100;
        const confidenceIntervalUpper = Math.round(Math.min(1, pHat + precision) * 10000) / 100;

        // 5. Popülasyona Projekte Edilen Tahmini Hata Sayısı
        const projectedPopulationErrors = Math.round(pHat * N);

        // 6. Örneklem Yeterliliği Kontrolü
        // Bulunan sapma oranı ile yeniden hesaplanan gerekli örneklem büyüklüğünü karşılaştır
        const e = Math.max(0.0001, tolerableErrorRate / 100); // DIVISION BY ZERO KORUMASI
        const requiredN0 = (zScore * zScore * pHat * (1 - pHat)) / (e * e);
        const requiredN = requiredN0 > 0 ? Math.ceil(requiredN0 / (1 + (requiredN0 - 1) / N)) : 0;
        const sampleAdequacy = n >= requiredN ? 'Yeterli' : 'Yetersiz';

        return {
            observedDeviationRate,
            upperDeviationRate,
            precisionRate,
            confidenceIntervalLower,
            confidenceIntervalUpper,
            projectedPopulationErrors,
            sampleAdequacy,
        };
    }

    // Get stats
    async getStats() {
        const [total, planned, selected, completed] = await Promise.all([
            this.prisma.auditSample.count(),
            this.prisma.auditSample.count({ where: { status: 'Planlandı' } }),
            this.prisma.auditSample.count({ where: { status: 'Seçildi' } }),
            this.prisma.auditSample.count({ where: { status: 'Tamamlandı' } }),
        ]);

        const byMethod = await this.prisma.auditSample.groupBy({
            by: ['method'],
            _count: { method: true },
        });

        return {
            total,
            byStatus: { planned, selected, completed },
            byMethod: byMethod.reduce((acc, m) => {
                acc[m.method] = m._count.method;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    // Gelişmiş Örneklem ve Ham Veri Saklama (Dosyalı)
    async generateAdvancedSampleWithFile(config: any, file: any, user: any) {
        // Eğer populationData config içinde gelmediyse (büyük veri optimizasyonu),
        // dosyadan parse et. Bu sayede FormData metin alanı küçük kalır.
        if (!config.populationData && file) {
            try {
                // Multer memoryStorage: file.buffer, diskStorage: file.path
                const fileBuffer = file.buffer;
                if (!fileBuffer || fileBuffer.length === 0) {
                    throw new Error('Yüklenen dosya boş veya okunamadı.');
                }

                const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true, cellNF: false, cellText: false });
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) {
                    throw new Error('Excel dosyasında sayfa bulunamadı.');
                }
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false, dateNF: 'dd.mm.yyyy' });

                if (!jsonData || jsonData.length === 0) {
                    throw new Error('Excel dosyasında veri bulunamadı. Dosyanın boş olmadığından emin olun.');
                }

                config.populationData = jsonData;
                this.logger.log(`Dosyadan ${jsonData.length} satır başarıyla parse edildi.`);
            } catch (parseError: any) {
                this.logger.error('Dosya parse hatası:', parseError);
                throw new Error(`Dosya okunamadı: ${parseError.message}`);
            }
        }

        if (!config.populationData || !Array.isArray(config.populationData) || config.populationData.length === 0) {
            throw new Error('Popülasyon verisi bulunamadı. Lütfen geçerli bir Excel dosyası yükleyin.');
        }

        // 1. Örneklemi oluştur (generateAdvancedSample motoru aynen çalışır)
        const sample = await this.generateAdvancedSample(config, user);

        // 2. Eğer dosya varsa, onu Çalışma Kağıdı olarak kaydet
        if (file && sample && config.auditId) {
            try {
                const workpaper = await this.workpaperService.uploadAndCreateWorkpaper(
                    config.auditId,
                    user.id,
                    file,
                    'Örneklem Popülasyonu'
                );

                // 3. Örneklem planını bu çalışma kağıdına linkle
                await (this.prisma.auditSample as any).update({
                    where: { id: sample.id },
                    data: { populationWorkpaperId: workpaper.id }
                });
            } catch (err) {
                this.logger.error('Ham veri saklanırken hata oluştu (Örneklem oluşturuldu ama dosya kaydedilemedi):', err);
            }
        }

        return sample;
    }

}
