// AI Service for Finding Analysis
// Auditron AI servis baglanti dosyasi
// Kurum ici AI calistirma motorudur (Ollama uzerinden).

// Kurulacak model: qwen2.5:32b (guclu Turkce, iyi muhakeme)
// IT Ekibi Kurulum: ollama pull qwen2.5:32b && ollama serve
import { getHeaders } from './audit-api';
export const AI_MODELS = {
    default: 'qwen2.5:32b',
    options: [
        { id: 'qwen2.5:32b', name: 'Qwen 2.5 (32B)', desc: 'En iyi Turkce, guclu muhakeme', ram: '20GB VRAM' },
        { id: 'qwen2.5:14b', name: 'Qwen 2.5 (14B)', desc: 'Iyi Turkce, orta hiz', ram: '10GB VRAM' },
        { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', desc: 'Hafif, hizli', ram: '4GB VRAM' },
        { id: 'gemma3:4b', name: 'Gemma 3 (4B)', desc: 'En hafif, dusuk kalite', ram: '3GB VRAM' }
    ]
};

// Get configured model from localStorage or use default
export function getActiveModel(): string {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('ai_model') || AI_MODELS.default;
    }
    return AI_MODELS.default;
}

export interface AiAnalysisResult {
    riskLevel: string;
    riskReason: string;
    titleSuggestion: string;
    contentSuggestions: string[];
    suggestedCriteria: string[];
    relatedLegislation: string[];
    generalNotes: string;
    confidence: number;
    categorySuggestion: string;
    grammarCheck: string[];
    rootCauseSuggestion?: string;
    effectSuggestion?: string;
}

export async function checkAuditronStatus(): Promise<boolean> {
    try {
        const AUDITRON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${AUDITRON_API_URL}/auditron/status`, {
            method: 'GET',
            headers: getHeaders() as any,
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) return false;

        const data = await response.json();
        // Artik hem baglanti durumu hem enabled kontrolu yapilir
        return !!data.status && data.enabled !== false;
    } catch {
        return false;
    }
}

// Analyze finding content with Auditron AI (Powered locally via NestJS Backend)
export async function analyzeWithAuditron(findingData: any): Promise<AiAnalysisResult | null> {
    try {
        const AUDITRON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${AUDITRON_API_URL}/auditron/enhance`, {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' } as any,
            body: JSON.stringify({ findingData }),
            signal: AbortSignal.timeout(180000) // 3 minute timeout for LLM processing
        });

        if (!response.ok) {
            console.error(`Auditron Sunucu Hatasi (${response.status})`);
            return null;
        }

        const data = await response.json();

        if (data.success && data.enhanced) {
            return data.enhanced as AiAnalysisResult;
        }

        return null;
    } catch (error) {
        console.warn('Auditron AI baglanti bekleniyor...', (error as any)?.message || '');
        return null;
    }
}


