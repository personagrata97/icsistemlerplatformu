import { getHeaders } from './audit-api';

export const AI_MODELS = {
    default: 'qwen2.5:32b',
    options: [
        { id: 'qwen2.5:32b', name: 'Qwen 2.5 (32B)', desc: 'En iyi Türkçe, güçlü muhakeme', ram: '20GB VRAM' },
        { id: 'qwen2.5:14b', name: 'Qwen 2.5 (14B)', desc: 'İyi Türkçe, orta hız', ram: '10GB VRAM' },
        { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', desc: 'Hafif, hızlı', ram: '4GB VRAM' },
        { id: 'gemma3:4b', name: 'Gemma 3 (4B)', desc: 'En hafif', ram: '3GB VRAM' }
    ]
};

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
        const PHAROS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${PHAROS_API_URL}/pharos/status`, {
            method: 'GET',
            headers: getHeaders() as any,
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) return false;
        const data = await response.json();
        return !!data.status && data.enabled !== false;
    } catch {
        return false;
    }
}

export async function analyzeWithAuditron(findingData: any): Promise<AiAnalysisResult | null> {
    try {
        const PHAROS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${PHAROS_API_URL}/pharos/enhance`, {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' } as any,
            body: JSON.stringify({ findingData }),
            signal: AbortSignal.timeout(180000)
        });

        if (!response.ok) return null;
        const data = await response.json();
        if (data.success && data.enhanced) {
            return data.enhanced as AiAnalysisResult;
        }
        return null;
    } catch (error) {
        return null;
    }
}
