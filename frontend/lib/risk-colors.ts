// Risk seviyeleri için ortak renkler ve fonksiyonlar
// Düşük=Sarı, Orta=Turuncu, Yüksek=Kırmızı, Kritik=Bordo

export type RiskLevel = 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük';

// Badge arka plan renkleri - case insensitive
export const getRiskBadgeClass = (risk: string | undefined | null): string => {
    if (!risk) return 'hidden';
    const level = risk.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (level.includes('kritik')) return 'bg-rose-900 text-white';
    if (level.includes('yuksek')) return 'bg-red-500 text-white';
    if (level.includes('orta')) return 'bg-orange-500 text-white';
    if (level.includes('dusuk')) return 'bg-yellow-400 text-gray-900';
    return 'bg-gray-200 text-gray-700';
};

// Border renkleri
export const getRiskBorderColor = (risk: string): string => {
    switch (risk) {
        case 'Kritik': return 'border-rose-900';
        case 'Yüksek': return 'border-red-500';
        case 'Orta': return 'border-orange-500';
        case 'Düşük': return 'border-yellow-400';
        default: return 'border-gray-300';
    }
};

// Metin renkleri
export const getRiskTextColor = (risk: string): string => {
    switch (risk) {
        case 'Kritik': return 'text-rose-900';
        case 'Yüksek': return 'text-red-500';
        case 'Orta': return 'text-orange-500';
        case 'Düşük': return 'text-yellow-600';
        default: return 'text-gray-500';
    }
};

// Skor bazlı renkler
export const getRiskScoreColor = (score: number): string => {
    if (score >= 85) return 'text-rose-900 bg-rose-100';
    if (score >= 65) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-700 bg-yellow-100';
};

export const getRiskProgressColor = (score: number): string => {
    if (score >= 85) return 'bg-rose-900';
    if (score >= 65) return 'bg-red-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-yellow-400';
};

// Skora göre risk seviyesi belirleme
export const getRiskLevelFromScore = (score: number): RiskLevel => {
    if (score >= 85) return 'Kritik';
    if (score >= 65) return 'Yüksek';
    if (score >= 40) return 'Orta';
    return 'Düşük';
};

// Durum badge renkleri
export const getStatusBadgeClass = (status: string): string => {
    switch (status) {
        case 'Tamamlandı':
        case 'Kapatıldı':
        case 'Onaylandı':
            return 'bg-emerald-100 text-emerald-800';
        case 'Devam Ediyor':
        case 'Açık':
        case 'İnceleniyor':
            return 'bg-blue-100 text-blue-800';
        case 'Beklemede':
        case 'Taslak':
            return 'bg-gray-100 text-gray-800';
        case 'İptal':
        case 'Reddedildi':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
