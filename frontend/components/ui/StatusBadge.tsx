import React from 'react';

export type BadgeType = 'status' | 'risk' | 'priority' | 'result' | 'control' | 'plan-type' | 'activity-status' | 'severity' | 'approval';

export interface StatusBadgeProps {
    value?: string | null;
    type?: BadgeType;
    className?: string;
    size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    value,
    type = 'status',
    className = '',
    size = 'md'
}) => {
    if (!value) return <span className="text-slate-300 font-mono">-</span>;

    const strValue = typeof value === 'string' ? value : String(value);
    const normalizedValue = strValue.trim();
    const upperVal = normalizedValue.toUpperCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

    // Robust Fix for Turkish Character Encoding Issues
    let displayValue = normalizedValue
        .replace(/d.s.k/gi, 'Düşük')
        .replace(/y.ksek/gi, 'Yüksek')
        .replace(/.ikayet/gi, 'Şikayet')
        .replace(/usuls.z/gi, 'Usulsüz')
        .replace(/.nceleniyor/gi, 'İnceleniyor');

    if (displayValue.includes('?') && (type === 'risk' || type === 'priority' || type === 'severity')) {
        if (displayValue.toLowerCase().startsWith('d')) displayValue = 'Düşük';
        if (displayValue.toLowerCase().startsWith('y')) displayValue = 'Yüksek';
    }

    // Direct Risk Level & Color Codes (RED, YELLOW, GREEN)
    if (upperVal === 'RED' || upperVal === 'KRITIK' || upperVal === 'KRİTİK') {
        badgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
    } else if (upperVal === 'YELLOW' || upperVal === 'ORTA' || upperVal === 'BEKLEMEDE' || upperVal === 'ONAY BEKLİYOR') {
        badgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
    } else if (upperVal === 'GREEN' || upperVal === 'DÜŞÜK' || upperVal === 'DUSUK' || upperVal === 'ONAYLANDI' || upperVal === 'TAMAMLANDI' || upperVal === 'KAPALI') {
        badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (type === 'status' || type === 'approval') {
        switch (normalizedValue) {
            case 'Taslak':
            case 'İptal':
            case 'İptal Edildi':
            case 'Silindi':
                badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                break;
            case 'Revizyon Gerekli':
            case 'İnceleniyor':
            case 'Devam Ediyor':
            case 'Onay Bekliyor':
            case 'Beklemede':
            case 'Bekliyor':
            case 'Doğrulama Bekliyor':
            case 'Kısmen Mutabık':
                badgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
                break;
            case 'Planlandı':
            case 'Gözden Geçirme':
            case 'Tebliğ Edildi':
                badgeClass = 'bg-purple-100 text-purple-700 border-purple-200';
                break;
            case 'Tamamlandı':
            case 'Kapalı':
            case 'Kapalı (Mutabık Değil)':
            case 'Onaylandı':
            case 'Mutabık':
            case 'Aktif':
            case 'AKTIF':
            case 'Aktif Sözleşme':
                badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                break;
            case 'Açık':
            case 'Gönderildi':
            case 'Takip Ediliyor':
            case 'Birim Yanıtladı':
                badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                break;
            case 'Red':
            case 'Reddedildi':
            case 'Reddedilen':
            case 'Silindi':
            case 'Takipte':
            case 'TAKIPTE':
            case 'Takip / NPL':
            case 'Takip':
            case 'Gecikmiş':
            case 'İhlal':
                badgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
                break;
            default:
                badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        }
    } else if (type === 'risk' || type === 'priority' || type === 'control' || type === 'severity') {
        const lower = normalizedValue.toLowerCase();
        if (lower.includes('kritik') || lower === 'red') {
            badgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
            displayValue = 'Kritik';
        } else if (lower.includes('yüksek') || lower.includes('yuksek')) {
            badgeClass = 'bg-orange-100 text-orange-700 border-orange-200';
            displayValue = 'Yüksek';
        } else if (lower.includes('orta') || lower === 'yellow') {
            badgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
            displayValue = 'Orta';
        } else if (lower.includes('düşük') || lower.includes('dusuk') || lower === 'green') {
            badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
            displayValue = 'Düşük';
        } else if (type === 'control') {
            if (lower === 'güçlü') {
                badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                displayValue = 'Güçlü';
            } else if (lower === 'zayıf') {
                badgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
                displayValue = 'Zayıf';
            }
        }
    } else if (type === 'result') {
        switch (normalizedValue) {
            case 'Olumlu': badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200'; break;
            case 'Koşullu': badgeClass = 'bg-amber-100 text-amber-700 border-amber-200'; break;
            case 'Olumsuz': badgeClass = 'bg-rose-100 text-rose-700 border-rose-200'; break;
        }
    } else if (type === 'plan-type') {
        switch (normalizedValue) {
            case 'Yıllık Plan': badgeClass = 'bg-indigo-100 text-indigo-700 border-indigo-200'; break;
            case 'Revizyon-1': badgeClass = 'bg-amber-100 text-amber-700 border-amber-200'; break;
            case 'Revizyon-2': badgeClass = 'bg-orange-100 text-orange-700 border-orange-200'; break;
            case 'Revizyon-3': badgeClass = 'bg-rose-100 text-rose-700 border-rose-200'; break;
            default: badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        }
    } else if (type === 'activity-status') {
        switch (normalizedValue) {
            case 'Success':
            case 'Tamamlandı':
                badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                displayValue = 'Başarılı';
                break;
            case 'Warning':
            case 'Güncelleme':
            case 'İkaz':
            case 'Uyarı':
                badgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
                displayValue = 'Uyarı';
                break;
            case 'Info':
            case 'Bilgi':
            case 'Bilgi Notu':
                badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                displayValue = 'Bilgi';
                break;
            case 'Error':
            case 'Hata':
                badgeClass = 'bg-rose-100 text-rose-700 border-rose-200';
                displayValue = 'Hata';
                break;
        }
    }

    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

    return (
        <span className={`inline-flex items-center justify-center font-bold rounded-full border whitespace-nowrap ${badgeClass} ${sizeClass} ${className}`}>
            {displayValue}
        </span>
    );
};

export default StatusBadge;
