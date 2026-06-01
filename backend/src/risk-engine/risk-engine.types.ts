export interface RiskCalculationResult {
    kpi_kodu: string;
    deger: number;
    risk_seviyesi: 'GREEN' | 'YELLOW' | 'RED';
    detay?: any;
}

export interface ScenarioParameters {
    iptal_artis: number;      // Örn: 0.20 = %20 artış
    gecikme_artis: number;     // Örn: 0.15 = %15 artış
    teslimat_artis: number;    // Örn: 0.10 = %10 artış
    likidite_dusus: number;    // Örn: 0.12 = %12 düşüş
}

export const SCENARIO_TYPES = {
    OLUMSUZ: 'OLUMSUZ',
    BAZ: 'BAZ',
    OLUMLU: 'OLUMLU',
} as const;

export const RISK_LEVELS = {
    GREEN: 'GREEN',
    YELLOW: 'YELLOW',
    RED: 'RED',
} as const;
