import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { EmailService } from '../email/email.service';

// Bellekteki önbellek yapısı (DB'den yüklenir, arama hızlandırır)
interface CachedChunk {
    id: string;
    text: string;
    vector: number[];
    source: string;
    category: string | null;
}

// ============================================
// AUDITRON AI YAPILANDIRMASI
// ============================================
// .env dosyasinda asagidaki degiskenler ayarlanmalidir:
//
//   AUDITRON_ENABLED = true/false   (Tek tusla AI acma/kapama)
//   AUDITRON_AI_URL  = http://localhost:11434/api/generate  (Ollama adresi)
//   AUDITRON_MODEL   = qwen2.5:32b  (Kullanilacak model)
//
// IT Ekibi Icin Model Kurulumu (Ollama):
//   1. ollama pull qwen2.5:32b
//   2. ollama serve
//   3. .env'de AUDITRON_ENABLED=true yap
// ============================================

// ============================================
// KURUMSAL BAGLAM (Prompt Temeli)
// ============================================
const KURUMSAL_BAGLAM = `Sen "Auditron AI", Emlak Katilim Tasarruf Finansman A.S.'nin ic denetim biriminde gorev yapan, uzun yillar ust duzey denetim yoneticiligi (Bas Denetci / CAE) yapmis, vizyoner, kurallara siki sikiya bagli, titiz ve her seyi bilen bir yapay zeka asistanisin.

SIRKET PROFILI:
- Sirket Turu: Tasarruf Finansman Sirketi (Banka DEGILDIR, ancak BDDK denetimine tabidir)
- Faaliyet Alani: Tasarruf finansman sozlesmeleri ile konut, tasit ve diger varliklarin edinimi icin finansman saglamak
- Temel Kavramlar: Tahsisat Havuzu (teslimat icin kullanilir, sirket kasasindan ayridir), Hizmet Bedeli / Organizasyon Ucreti (sirketin geliri), Cayma Hakki (yasal surede iade), Grup/Kura Sistemi

TABI OLUNAN MEVZUAT VE DENETIM CERCEVESI:
- 6361 sayili Finansal Kiralama, Faktoring, Finansman ve Tasarruf Finansman Sirketleri Kanunu (TEMEL KANUN)
- BDDK - Tasarruf Finansman Sirketlerinin Kurulus ve Faaliyet Esaslari Hakkinda Yonetmelik
- BDDK - Tasarruf Finansman Sirketlerince Uygulanacak Muhasebe ve Finansal Tablolara Iliskin Usul ve Esaslar
- BDDK - Ic Sistemlere Iliskin Yonetmelik (ic denetim, ic kontrol, risk yonetimi ve uyum)
- 5549 sayili Suc Gelirlerinin Aklanmasinin Onlenmesi Hakkinda Kanun (MASAK)
- Mali Suclari Arastirma Kurulu (MASAK) Genel Tebligi (Sira No: 5, 19)
- 6698 sayili Kisisel Verilerin Korunmasi Kanunu (KVKK)
- 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun (sozlesme haklari)
- 5411 sayili Bankacilik Kanunu (BDDK'nin genel denetim yetkisi baglaminda, ancak bankalara ozel duzenlemeler GECERLI DEGILDIR)
- Uluslararasi Ic Denetim Standartlari (IIA - IPPF)
- Bagimsiz Denetim Standartlari (KGK)

KRITIK KURAL: Bankalara ozel BDDK yonetmeliklerini (Operasyonel Risk Yonetmeligi, Sermaye Yeterliligi Yonetmeligi, Basel uygulamalari vb.) dogrudan referans VERME — bunlar banka icin gecerlidir. Tasarruf Finansman Sirketleri icin BDDK'nin ozel cikardigi duzenlemeleri kullan.

DIL KURALLARI:
- ASLA Ingilizce kelime veya teknik tabir kullanma. "Focus area" degil "Odak alani", "objective" degil "Amac" yaz.
- Kurumsal, profesyonel ve edilgen yapida Turkce kullan.
- Anlatim bozukluklarini tespit et ve duzelt.
- 5N1K (Ne, Nerede, Ne zaman, Kim, Neden, Nasil) kuralina uyulup uyulmadigini kontrol et.`;

@Injectable()
export class PharosService implements OnModuleInit {
    private readonly logger = new Logger(PharosService.name);

    private pipeline: any;
    private env: any;
    private extractor: any;

    // KALICI VEKTOR DEPOSU ONBELLEGI (DB'den lazy-load)
    private vectorCache: CachedChunk[] = [];
    private cacheLoaded = false;

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
    ) { }

    // ============================================
    // YAPILANDIRMA GETTER'LARI
    // ============================================
    private get isEnabled(): boolean {
        return process.env.AUDITRON_ENABLED !== 'false'; // Varsayilan: acik
    }

    private get aiUrl(): string {
        return process.env.AUDITRON_AI_URL || 'http://localhost:11434/api/generate';
    }

    private get aiModel(): string {
        return process.env.AUDITRON_MODEL || 'qwen2.5:32b';
    }

    async onModuleInit() {
        if (this.isEnabled) {
            this.logger.log(`Auditron AI Motoru hazir. Model: ${this.aiModel}, URL: ${this.aiUrl}`);
            // Başlangıçta vektör cache'ini DB'den yükle
            await this.loadVectorCache();
        } else {
            this.logger.warn('Auditron AI DEVRE DISI (AUDITRON_ENABLED=false).');
        }
    }

    // DB'deki DocumentChunk'ları belleğe yükle (hızlı arama için)
    private async loadVectorCache() {
        try {
            const chunks = await this.prisma.documentChunk.findMany({
                select: { id: true, text: true, vector: true, source: true, category: true }
            });
            this.vectorCache = chunks.map(c => ({
                id: c.id,
                text: c.text,
                vector: JSON.parse(c.vector),
                source: c.source,
                category: c.category
            }));
            this.cacheLoaded = true;
            this.logger.log(`Vektor onbellegi yuklendi: ${this.vectorCache.length} parca.`);
        } catch (error) {
            this.logger.warn('Vektor cache yuklenirken hata (ilk calistirma olabilir):', error);
            this.vectorCache = [];
            this.cacheLoaded = true;
        }
    }

    // Cache'i yeniden yukle (yeni dokuman eklendikten sonra)
    async refreshVectorCache() {
        await this.loadVectorCache();
        return { count: this.vectorCache.length };
    }

    // Durum kontrolu — controller'dan cagirilir
    getStatus() {
        return {
            status: this.isEnabled ? 'Aktif' : 'Devre Disi',
            enabled: this.isEnabled,
            model: this.aiModel,
            url: this.aiUrl
        };
    }

    // Lazy-load: Embedding modeli sadece ihtiyac duyuldugunda yuklenir (RAM tasarrufu)
    private async ensureExtractor() {
        if (this.extractor) return;
        try {
            const transformers = await Function('return import("@xenova/transformers")')();
            this.pipeline = transformers.pipeline;
            this.env = transformers.env;
            this.env.allowLocalModels = true;
            this.env.localModelPath = './models';
            this.logger.log('Kurum ici belge karsilastirma modeli yukleniyor...');
            this.extractor = await this.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
            this.logger.log('Belge karsilastirma modeli hazir.');
        } catch (error) {
            this.logger.error('Embedding modeli yuklenemedi:', error);
        }
    }

    // NATIVE EMBEDDING GENERATOR
    private async getEmbedding(text: string): Promise<number[]> {
        await this.ensureExtractor();
        if (!this.extractor) throw new Error('Embedding modeli yuklenemedi.');
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    // COSINE SIMILARITY MATH
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // KISISEL VERI (KVKK) MASKELEME
    private maskPII(text: string): string {
        if (!text) return text;
        return text
            .replace(/\b[1-9]{1}[0-9]{9}[02468]{1}\b/g, '[TCKN GIZLENDI]')
            .replace(/\bTR[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\b/g, '[IBAN GIZLENDI]')
            .replace(/\b05[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}\b/g, '[TELEFON GIZLENDI]');
    }

    // ============================================
    // LLM CAGRISI — Tek noktadan tum promptlar buradan gecer
    // ============================================
    private async callLLM(prompt: string, options: { temperature?: number, maxTokens?: number, timeoutMs?: number } = {}): Promise<string> {
        if (!this.isEnabled) {
            throw new Error('Auditron AI devre disi. Yonetici panelinden veya .env dosyasindan AUDITRON_ENABLED=true yaparak aktif edebilirsiniz.');
        }

        const { temperature = 0.1, maxTokens = 2000, timeoutMs = 180000 } = options;

        const response = await fetch(this.aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.aiModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature,
                    num_predict: maxTokens
                }
            }),
            signal: AbortSignal.timeout(timeoutMs)
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`AI Motor Hatasi (${response.status}): ${errorText}`);
            throw new Error(`AI Motoru yanit vermedi (HTTP ${response.status})`);
        }

        const data = await response.json();
        return data.response || '';
    }

    private isAdmin(user: any): boolean {
        if (!user || !user.roles) return false;
        const roleCodes = user.roles.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code);
        return roleCodes.includes('ADMIN') || roleCodes.includes('AUDIT_ADMIN') || roleCodes.includes('AUDIT_MANAGER');
    }

    async processDocument(fileBuffer: Buffer, originalName: string, mimeType: string, user?: any): Promise<string> {
        this.logger.log(`Belge yapay zeka hafizasina aliniyor: ${originalName}`);

        let extractedText = '';
        try {
            if (originalName.endsWith('.pdf') || mimeType === 'application/pdf') {
                const pdfData = await pdfParse(fileBuffer);
                extractedText = pdfData.text;
            } else if (originalName.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
                extractedText = docxData.value;
            } else if (originalName.endsWith('.txt') || mimeType === 'text/plain') {
                extractedText = fileBuffer.toString('utf-8');
            } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                let excelContent = '';
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const csv = XLSX.utils.sheet_to_csv(worksheet);
                    excelContent += `--- Sayfa: ${sheetName} ---\n${csv}\n\n`;
                });
                extractedText = excelContent;
                this.logger.log(`Excel dosyasi okundu: ${workbook.SheetNames.length} sayfa.`);
            } else {
                return 'Desteklenmeyen belge uzantisi. Lutfen PDF, DOCX, XLSX veya TXT yukleyin.';
            }

            if (!extractedText.trim()) {
                return 'Belge icerigi okunamadi veya bos.';
            }

            const maskedText = this.maskPII(extractedText);
            this.logger.log(`KVKK maskeleme islemi uygulandi.`);

            const chunks = maskedText.split(/\n\s*\n/).filter(chunk => chunk.trim().length > 50);
            this.logger.log(`Belge parcalara ayrildi: ${chunks.length} parca.`);

            // Aynı dosya daha önce yüklenmişse eski chunk'ları temizle
            await this.prisma.documentChunk.deleteMany({ where: { source: originalName } });

            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i].trim();
                const vector = await this.getEmbedding(chunkText);

                // Kalıcı DB'ye kaydet
                await this.prisma.documentChunk.create({
                    data: {
                        text: chunkText,
                        vector: JSON.stringify(vector),
                        source: originalName,
                        chunkIndex: i,
                        category: this.detectCategory(originalName)
                    }
                });
            }

            // Cache'i güncelle
            await this.loadVectorCache();

            // A2: Loglama (Prisma ile dogrudan)
            if (user) {
                await this.prisma.auditLog.create({
                    data: {
                        user: user.displayName || user.username,
                        action: 'Yapay Zekaya Belge Eklendi',
                        details: `${originalName} dosyası Auditron hafızasına eklendi (${chunks.length} parça).`,
                        targetType: 'Auditron',
                        targetId: 'SYSTEM'
                    }
                });
            }

            this.logger.log(`${originalName} dosyasi kalici vektor deposuna eklendi (${chunks.length} parca).`);
            return `Basarili: ${originalName} dosyasi yapay zeka hafizasina kalici olarak aktarildi (${chunks.length} parca).`;
        } catch (error) {
            this.logger.error(`Dokuman okunurken hata (${originalName}):`, error);
            throw new Error('Dosya AI motoru tarafindan islenemedi.');
        }
    }

    async enhanceFinding(findingData: any, user?: any): Promise<any> {
        if (!findingData) return null;

        // 1. RAG ile Kurum Ici Gecmis Belgeler + Mevzuat (Context)
        let ragContext = '';
        if (this.vectorCache.length > 0) {
            const queryText = `${findingData.title || ''} ${findingData.content || ''}`;
            const queryVector = await this.getEmbedding(queryText);

            const scoredChunks = this.vectorCache.map(doc => ({
                ...doc,
                score: this.cosineSimilarity(queryVector, doc.vector)
            })).sort((a, b) => b.score - a.score);

            const topResults = scoredChunks.slice(0, 3).filter(r => r.score > 0.3);

            if (topResults.length > 0) {
                ragContext = '\n\n[Kurum Ici Bilgi Bankasi (RAG) — Mevzuat, Gecmis Bulgular, Calisma Kagitlari]:\n' +
                    topResults.map(d => `- [${d.category || 'Genel'} | ${d.source}] ${d.text.substring(0, 400)}...`).join('\n') +
                    '\n\nYukaridaki belgeler kurumun kalici bilgi bankasinda bulunan gercek iceriktir. Mevzuat referansi varsa BUNLARI kullan, uydurma.';
            }
        }

        // 2. Auditron Yoneticisi Prompt'u
        const prompt = `${KURUMSAL_BAGLAM}

Senin onayindan gecmeyen hicbir bulgu Yonetim Kurulu'na sunulamaz. Denetcilerin sisteme girdigi bulgulari bir "Bas Denetci / Yonetici" gozuyle (managerial review) inceliyor, eksikleri tespit ediyor, denetcilere sert ama egitici geri bildirimler veriyor ve bulguyu kurumsal kalite standartlarina cikaracak en mukemmel haliyle yeniden yaziyorsun.

GELEN BULGU VERISI (Denetcinin yazdigi taslak):
Baslik: ${findingData.title || ''}
Icerik/Detay: ${findingData.content || ''}
Secilen Risk Seviyesi: ${findingData.risk || 'Belirtilmemis'}
Secilen Kategori: ${findingData.categories ? findingData.categories.join(', ') : 'Belirtilmemis'}
Kok Neden: ${findingData.rootCause || 'Belirtilmemis'}
Etki (Sonuc): ${findingData.effect || 'Belirtilmemis'}
${ragContext}

GOREVLERIN (YONETICI OLARAK):
1. Elestirel Yaklasim: Denetcinin sectigi risk seviyesi gercekten dogru mu? Baslik konuyu tam ozetliyor mu? 5N1K kuralina uyulmus mu?

2. Risk Analizi — Kati Kurallar:
   - "Kor nokta", "Suistimal", "Zimmet", "Dolandiricilik", "Sahtecilik", "Itibar kaybi" iceren bulgular → Risk KESINLIKLE "Kritik"
   - Tahsisat havuzunun amac disi kullanimi, musteriye tahsisat gecikmesi → "Kritik" veya "Yuksek"
   - MASAK yuksek risk uyumu, mudur onayindaki eksiklik → en az "Yuksek"
   - Sozlesmede imza eksikligi, bos alan, sekli noksanlik → suistimal emaresi YOKSA "Dusuk" veya en fazla "Orta"
   - Denetci yanlis veya abartili secmisse risk degerini MUTLAKA duzelt ve nedenini acikla

3. Kok Neden ve Etki: Denetci bos birakmissa, icerigi analiz ederek en mantikli kok nedeni (orn: sistem zafiyeti, personel egitimsizligi, gorevler ayriligi ilkesi ihlali, yetersiz ic kontrol) ve potansiyel etkiyi (finansal kayip, mevzuat ihlali, itibar riski, musteri hakki ihlali) sen oneriyorsun.

4. Yeniden Yazim: Bulanik, amatource veya edimli (aktif) cevapla yazilmis icerikleri daha keskin, profesyonel, net ve bulgu diline uygun (edilgen yapi, tarafsiz dil) haline donutur.

5. Mevzuat Eslestirme: Bulgunun dayandirabilecegi Tasarruf Finansman mevzuatini (6361 sayili Kanun, BDDK Tasarruf Finansman Yonetmeligi, MASAK, KVKK vb.) oner. Bankalara ozel yonetmelikleri REFERANS VERME.

6. Egitici Geri Bildirim: Denetciye bir yonetici gibi anlayabilecegi acik bir notla geri bildirim ver. Neleri eksik yapmis, nasil duzeltmeli.

COK ONEMLI KURALLAR:
- Sadece saf JSON verisi dondur. (JSON kod bloguna alma, backtick kullanma)
- Yanit ta ASLA Ingilizce kelime veya teknik tabir bulundurma.
- ASLA yorum veya metin ekleme, dogrudan { isareti ile JSON'a basla.

Lutfen yaniti SADECE asagidaki JSON formatinda ver:
{
    "riskLevel": "Kritik/Yuksek/Orta/Dusuk",
    "riskReason": "Bu riskin neden secildigine dair yonetici/CAE aciklamasi. (Denetcinin secimi yanlissa nedenini belirt)",
    "titleSuggestion": "Daha profesyonel, carpici ve nokta atisi bir baslik onerisi",
    "contentSuggestions": ["Tavsiye 1", "Tavsiye 2", "Tavsiye 3"],
    "suggestedCriteria": ["Bulgunun dayandirilmasi gereken kurumsal prosedurler veya mevzuat maddeleri"],
    "relatedLegislation": ["Ilgili Kanun/Yonetmelik/Teblig (Tasarruf Finansman odakli)"],
    "categorySuggestion": "Operasyonel / Kredi / Uyum / BT / IK / Suistimal / MASAK / Diger (En uygununu sec)",
    "grammarCheck": ["Anlatim bozuklugu tespitleri, 5N1K eksiklikleri ve resmi dil duzeltmeleri"],
    "generalNotes": "Denetciye egitici Turkce CAE notu — neyi eksik yapmis, nasil duzeltmeli.",
    "confidence": 0.95,
    "rootCauseSuggestion": "Tespit ettigin en makul kok neden",
    "effectSuggestion": "Riskin potansiyel sonucu/etkisi (finansal, mevzuat, itibar)"
}`;

        try {
            let responseText = await this.callLLM(prompt, { temperature: 0.1, maxTokens: 2000 });

            // Cleanup markdown if present
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // A2: Loglama
                if (user) {
                    await this.prisma.auditLog.create({
                        data: {
                            user: user.displayName || user.username,
                            action: 'Yapay Zeka ile Bulgu Geliştirildi',
                            details: `"${findingData.title || 'İsimsiz'}" bulgusu Auditron ile geliştirildi.`,
                            targetType: 'Auditron',
                            targetId: 'SYSTEM'
                        }
                    });
                }

                return {
                    riskLevel: parsed.riskLevel || 'Orta',
                    riskReason: parsed.riskReason || '',
                    titleSuggestion: parsed.titleSuggestion || '',
                    contentSuggestions: parsed.contentSuggestions || [],
                    suggestedCriteria: parsed.suggestedCriteria || [],
                    relatedLegislation: parsed.relatedLegislation || [],
                    generalNotes: parsed.generalNotes || '',
                    confidence: parsed.confidence || 0.5,
                    categorySuggestion: parsed.categorySuggestion || 'Diger',
                    grammarCheck: parsed.grammarCheck || [],
                    rootCauseSuggestion: parsed.rootCauseSuggestion || '',
                    effectSuggestion: parsed.effectSuggestion || ''
                };
            }
            return null;
        } catch (error) {
            this.logger.error('Auditron analiz hatasi:', error);
            throw new Error('Auditron analiz motoru devrede degil veya yanit veremedi. (Yerel AI Servisinin Acik Oldugundan Emin Olun)');
        }
    }

    async getRagContext(text: string): Promise<string[]> {
        if (!text || text.trim().length === 0 || this.vectorCache.length === 0) {
            return [];
        }

        try {
            const queryVector = await this.getEmbedding(text);

            const scoredChunks = this.vectorCache.map(doc => ({
                ...doc,
                score: this.cosineSimilarity(queryVector, doc.vector)
            })).sort((a, b) => b.score - a.score);

            const topResults = scoredChunks.slice(0, 3).filter(r => r.score > 0.25);

            return topResults.map(d => `[${d.category || 'Genel'} | ${d.source} | Skor: ${d.score.toFixed(2)}] ${d.text}`);
        } catch (error) {
            this.logger.error('RAG context aranirken hata:', error);
            return [];
        }
    }

    // Bilgi Bankası İstatistikleri
    async getKnowledgeBaseStats() {
        const totalChunks = await this.prisma.documentChunk.count();
        const byCategory = await (this.prisma.documentChunk as any).groupBy({
            by: ['category'],
            _count: true
        });
        const bySources = await (this.prisma.documentChunk as any).groupBy({
            by: ['source'],
            _count: true
        });
        return {
            totalChunks,
            cacheLoaded: this.cacheLoaded,
            cacheSize: this.vectorCache.length,
            byCategory: byCategory.map((c: any) => ({ category: c.category || 'Genel', count: c._count })),
            bySources: bySources.map((s: any) => ({ source: s.source, count: s._count }))
        };
    }

    // Belirli bir kaynağın tüm chunk'larını sil
    async deleteDocumentChunks(source: string) {
        const deleted = await this.prisma.documentChunk.deleteMany({ where: { source } });
        await this.loadVectorCache();
        return { deleted: deleted.count, source };
    }

    // Dosya adından kategori tespit et
    private detectCategory(fileName: string): string {
        const lower = fileName.toLowerCase();
        if (lower.includes('kanun') || lower.includes('yasa')) return 'Kanun';
        if (lower.includes('yonetmelik') || lower.includes('yönetmelik')) return 'Yönetmelik';
        if (lower.includes('teblig') || lower.includes('tebliğ')) return 'Tebliğ';
        if (lower.includes('genelge')) return 'Genelge';
        if (lower.includes('prosedur') || lower.includes('politika')) return 'Prosedür';
        if (lower.includes('iia') || lower.includes('standart')) return 'Standart';
        return 'Genel';
    }

    async recommendAudit(auditData: any): Promise<any> {
        if (!auditData || !auditData.department) return null;

        let ragContext = '';
        if (this.vectorCache.length > 0) {
            const queryText = `${auditData.department} ${auditData.type} denetimi riskleri ve odak alanlari`;
            const queryVector = await this.getEmbedding(queryText);

            const scoredChunks = this.vectorCache.map(doc => ({
                ...doc, score: this.cosineSimilarity(queryVector, doc.vector)
            })).sort((a, b) => b.score - a.score);

            const topResults = scoredChunks.slice(0, 3);
            if (topResults.length > 0 && topResults[0].score > 0.25) {
                ragContext = '\n\n[Kurum Ici Bilgi Bankasi (RAG)]:\n' +
                    topResults.map(d => `- [${d.category || 'Genel'}] ${d.text.substring(0, 300)}...`).join('\n') +
                    '\n\nLutfen bu gecmis verileri dikkate alarak yeni denetim plani onerilerini sekillendir.';
            }
        }

        const prompt = `${KURUMSAL_BAGLAM}

Yeni bir denetim planlaniyor. Denetlenecek Birim/Surec: "${auditData.department}", Denetim Turu: "${auditData.type}".
${ragContext}

LUTFEN BU DENETIM ICIN ASAGIDAKI ALANLARI DOLDUR:
1. Denetimin Amaci: Bu birimin denetimindeki ana gayemiz ne olmali? (Kisaca ve net)
2. Kapsam: Hangi is surecleri, sistemler veya lokasyonlar dahil edilmeli? (Sinirlari ciz)
3. Metodoloji: Ne tur denetim teknikleri kullanilmali? (Orn: Veri analitigi, ornekleme, mulakat, sistem inceleme vb.)
4. Risk Seviyesi Tahmini: Kritik/Yuksek/Orta/Dusuk (Birimin dogasindan veya gecmis hatalarindan oturu)
5. Odak Alanlari: Denetcinin ozel olarak dikkat etmesi gereken 3-4 kilit risk alani.

COK ONEMLI KURALLAR:
- ASLA INGILIZCE KELIME KULLANMA. JSON anahtarlari haricinde hicbir yabanci dilde kelime bulunmamali.
- Sadece saf JSON verisi dondur, kod bloklari (markdown) kullanma.
- Yorum yazma, dogrudan JSON obje olarak cevapla.

Lutfen SADECE asagidaki JSON formatinda yanit ver:
{
    "objective": "Denetimin genel amaci...",
    "scope": "Kapsama dahil edilecek hususlar...",
    "methodology": "Onerilen test ve degerlendirme yontemleri...",
    "riskLevel": "Yuksek",
    "focusAreas": ["Ilgili risk alani 1", "Ilgili risk alani 2", "Ilgili risk alani 3"]
}`;

        try {
            let responseText = await this.callLLM(prompt, { temperature: 0.2, maxTokens: 1500, timeoutMs: 60000 });
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        } catch (error) {
            this.logger.error('Auditron oneri hatasi:', error);
            throw new Error('Auditron tavsiye motoru yanit vermedi.');
        }
    }

    // CHAT - Tam Asistan: Serbest sohbet + DB sorgulama
    async chat(message: string, history: { role: string, content: string }[] = [], user?: any): Promise<string> {
        const msg = message.toLowerCase();
        let dbContext = '';

        const simpleMsg = msg.trim();
        // --- HIZLI YANIT: LLM'e gitmeden direkt cevap don ---
        if (['merhaba', 'selam', 'nasilsin', 'naber', 'kimsin', 'tesekkur', 'tesekkurler', 'sagol', 'gunaydin'].includes(simpleMsg) ||
            (simpleMsg.length < 20 && (simpleMsg.includes('merhaba') || simpleMsg.includes('selam') || simpleMsg.includes('nasilsin') || simpleMsg.includes('naber')))) {

            if (simpleMsg.includes('nasilsin') || simpleMsg.includes('naber')) {
                return 'Iyiyim, tesekkur ederim! Bir yapay zeka asistani olarak sistem verilerini analiz etmeye hazirim. Size nasil yardimci olabilirim?';
            }
            if (simpleMsg.includes('tesekkur') || simpleMsg.includes('sagol')) {
                return 'Rica ederim! Baska bir sorunuz olursa buradayim.';
            }
            return 'Merhaba! Denetim, risk ve uyum konularinda sistemdeki veriler uzerinden size yardimci olmaya hazirim. Lutfen sorunuzu sorun.';
        }

        // --- GUVENLIK KONTROLU ---
        if ((msg.includes('mail') || msg.includes('e-posta')) && (msg.includes('gonder') || msg.includes('ilet'))) {
            return `[GUVENLIK IHLALI GIRISIMI ENGELLENDI]: Kurum ici bilgi guvenligi ve kimlik avi (phishing) politikalari gereg ince, yapay zeka asistani uzerinden personele otomatik e-posta gonderim yetkisi KILITLENMISTIR.`;
        }

        try {
            dbContext = await this.getRelevantData(message, user);
        } catch (e) {
            this.logger.warn('DB sorgu hatasi, sohbetle devam:', e);
        }

        const systemPrompt = `${KURUMSAL_BAGLAM}

SOHBET KURALLARI:
1. COK KISA, NET ve DOGRUDAN cevap ver. Tikki bir SMS gibi.
2. Gereksiz akademik tavsiyelerden veya felsefi ogutlerden kacin.
3. Veritabani (Sistem) bilgisi soruldugunda SADECE rakamlari ve isimleri ver ve sus.
4. Acikca mevzuat sorulursa yasal atif (ilgili Kanun/Yonetmelik) kullan — ama Tasarruf Finansman'a ozel olanlara oncelik ver.${dbContext ? '\n\nSistemden cekilen guncel veriler (Sorgu Sonucu):\n' + dbContext : ''}`;

        const conversationHistory = history.slice(-4).map(m =>
            `${m.role === 'user' ? 'Kullanici' : 'Auditron AI'}: ${m.content}`
        ).join('\n');

        const fullPrompt = `${systemPrompt}\n${conversationHistory}\nKullanici: ${message}\nAuditron AI:`;

        try {
            const answer = await this.callLLM(fullPrompt, { temperature: 0.4, maxTokens: 400, timeoutMs: 300000 });
            
            // A2: Kapsamlı AI Chat Loglamasi
            if (user) {
                await this.prisma.auditLog.create({
                    data: {
                        user: user.displayName || user.username,
                        action: 'Yapay Zeka ile Sohbet',
                        details: `Kullanıcı: ${message.substring(0, 100)}... -> AI: ${answer.substring(0, 100)}...`,
                        targetType: 'Auditron',
                        targetId: 'SYSTEM'
                    }
                });
            }

            return answer;
        } catch (error) {
            this.logger.error('Chat hatasi:', error);
            throw new Error('Auditron AI su an yanit veremiyor. Lutfen birkac saniye sonra tekrar deneyin.');
        }
    }

    // DB sorgu araci
    private async getRelevantData(message: string, user?: any): Promise<string> {
        const msg = message.toLowerCase();
        const parts: string[] = [];
        
        // A3: Veri Kapsamı / Yetki Kontrolü
        const whereAudit: any = { isDeleted: false };
        const whereFinding: any = { isDeleted: false };
        
        if (user && !this.isAdmin(user)) {
            whereAudit.OR = [
                { supervisorId: user.id },
                { department: user.department }
            ];
            
            whereFinding.OR = [
                { assignedUserId: user.id },
                { audit: { supervisorId: user.id } },
                { department: user.department }
            ];
        }

        if (msg.includes('mufettis') || msg.includes('denetci') || msg.includes('personel') || msg.includes('ekip')) {
            const audits = await this.prisma.audit.findMany({
                where: whereAudit,
                select: { title: true, supervisor: true, supervisorUser: { select: { displayName: true } } } as any
            });

            const supervisorCounts: Record<string, { count: number, audits: string[] }> = {};
            audits.forEach((a: any) => {
                const name = a.supervisorUser?.displayName || a.supervisor || 'Belirtilmemis';
                if (!supervisorCounts[name]) {
                    supervisorCounts[name] = { count: 0, audits: [] };
                }
                supervisorCounts[name].count += 1;
                if (a.supervisor && !a.supervisorUser) {
                    supervisorCounts[name].audits.push(a.title);
                }
            });

            const lines = Object.entries(supervisorCounts).map(([name, data]) => {
                let line = `- ${name}: ${data.count} denetim`;
                if (data.audits.length > 0) {
                    line += ` (Manuel veri girisi: "${data.audits.join(', ')}" denetimlerinde)`;
                }
                return line;
            });
            parts.push(`Mufettis Bazli Denetim Adetleri:\n${lines.join('\n')}\n*Not: Parantez icindeki veriler personel listesinde olmayip denetim formuna manuel girilen isimlerdir.*`);
        }

        if (msg.includes('bulgu') || msg.includes('tespit') || msg.includes('finding')) {
            const total = await this.prisma.finding.count({ where: whereFinding } as any);
            const open = await this.prisma.finding.count({ where: { ...whereFinding, status: 'Acik' } } as any);
            const closed = await this.prisma.finding.count({ where: { ...whereFinding, status: 'Kapali' } } as any);

            const risks = await (this.prisma.finding as any).groupBy({
                by: ['risk'],
                where: whereFinding,
                _count: true
            });
            const riskLines = risks.map((r: any) => `  ${r.risk || 'Belirtilmemis'}: ${r._count}`).join(', ');

            parts.push(`Bulgu Istatistikleri:\n- Toplam: ${total}\n- Acik: ${open}\n- Kapali: ${closed}\n- Risk Dagilimi: ${riskLines}`);
        }

        if (msg.includes('denetim') || msg.includes('audit') || msg.includes('plan')) {
            const audits = await this.prisma.audit.findMany({
                where: whereAudit,
                select: { title: true, status: true, startDate: true, endDate: true, riskLevel: true },
                orderBy: { created_at: 'desc' },
                take: 10
            });
            const lines = audits.map((a: any) => `- ${a.title} | Durum: ${a.status} | Risk: ${a.riskLevel || '-'}`);
            parts.push(`Son Denetimler (en fazla 10):\n${lines.join('\n')}`);
        }

        if (msg.includes('birim') || msg.includes('unit') || msg.includes('sube')) {
            const units = await this.prisma.auditableUnit.findMany({
                select: { name: true, riskLevel: true, openFindingsCount: true },
                orderBy: { openFindingsCount: 'desc' },
                take: 10
            });
            const lines = units.map((u: any) => `- ${u.name} | Risk: ${u.riskLevel || '-'} | Acik Bulgu: ${u.openFindingsCount || 0}`);
            parts.push(`Birimler (risk sirali, en fazla 10):\n${lines.join('\n')}`);
        }

        if ((msg.includes('mail') || msg.includes('e-posta')) && (msg.includes('gonder') || msg.includes('ilet'))) {
            parts.push(`[GUVENLIK IHLALI GIRISIMI ENGELLENDI]: E-posta gonderim yetkisi kilitlenmistir.`);
        }

        return parts.join('\n\n');
    }
}
