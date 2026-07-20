import React from 'react';

type BadgeType = 'status' | 'risk' | 'priority' | 'result' | 'control' | 'plan-type' | 'activity-status';

interface StatusBadgeProps {
    value?: string | null;
    type?: BadgeType;
    className?: string;
    size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
    value,
    type = 'status',
    className = '',
    size = 'md'
}) => {
    if (!value) return <span className="text-gray-300">-</span>;

    const strValue = typeof value === 'string' ? value : String(value);
    const normalizedValue = strValue.trim();
    let badgeClass = 'bg-gray-100 text-gray-700';

    // Robust Fix for Turkish Character Encoding Issues
    let displayValue = normalizedValue
        .replace(/d.s.k/gi, 'Düşük')      // Matches D?s?k variations
        .replace(/y.ksek/gi, 'Yüksek')    // Matches Y?ksek variations
        .replace(/.ikayet/gi, 'Şikayet')  // Matches ?ikayet
        .replace(/usuls.z/gi, 'Usulsüz')  // Matches Usuls?z
        .replace(/.nceleniyor/gi, 'İnceleniyor'); // Matches ?nceleniyor

    // Fallback for very broken strings where characters are just missing or replaced by '?'
    if (displayValue.includes('?') && type === 'risk') {
        if (displayValue.toLowerCase().startsWith('d')) displayValue = 'Düşük';
        if (displayValue.toLowerCase().startsWith('y')) displayValue = 'Yüksek';
    }

    if (type === 'status') {
        switch (normalizedValue) {
            case 'Taslak': badgeClass = 'bg-slate-100 text-slate-700 border-slate-200'; break;
            case 'Revizyon Gerekli': badgeClass = 'bg-amber-100 text-amber-800 border-amber-200'; break;
            case 'Planlandı': badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200'; break;
            case 'Devam Ediyor': badgeClass = 'bg-blue-100 text-blue-800 border-blue-200'; break;
            case 'Gözden Geçirme': badgeClass = 'bg-purple-100 text-purple-800 border-purple-200'; break;
            case 'Tamamlandı': badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200'; break;
            case 'Silindi': case 'İptal': case 'İptal Edildi': badgeClass = 'bg-red-100 text-red-800 border-red-200'; break;
            case 'Onay Bekliyor': badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'; break;
            case 'Onaylandı': badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100'; break;
            case 'Gönderildi': case 'Takip Ediliyor': badgeClass = 'bg-blue-100 text-blue-800 border-blue-200'; break;
            case 'Aktif': case 'AKTIF': case 'Aktif Sözleşme': badgeClass = 'bg-blue-50 text-blue-700 border-blue-100'; break;
            case 'Takipte': case 'TAKIPTE': case 'Takip / NPL': case 'Takip': badgeClass = 'bg-red-100 text-red-800 border-red-200'; break;
            // Ethics Statuses
            case 'Yeni': case 'Beklemede': badgeClass = 'bg-gray-100 text-gray-700 border-gray-200'; break;
            case 'İnceleniyor': badgeClass = 'bg-amber-100 text-amber-800 border-amber-200'; break;
            case 'Kapatıldı': case 'Kapalı': badgeClass = 'bg-green-100 text-green-800 border-green-200'; break;
            // Finding Statuses
            case 'Kapalı (Mutabık Değil)': badgeClass = 'bg-green-50 text-green-700 border-green-200'; break;
            case 'Açık': badgeClass = 'bg-rose-50 text-rose-700 border-rose-200'; break;
            case 'Tebliğ Edildi': badgeClass = 'bg-purple-50 text-purple-700 border-purple-200'; break;
            case 'Birim Yanıtladı': badgeClass = 'bg-cyan-100 text-cyan-800 border-cyan-200'; break;
            case 'Doğrulama Bekliyor': badgeClass = 'bg-orange-100 text-orange-800 border-orange-200'; break;
            // Conciliation Statuses
            case 'Mutabık': badgeClass = 'bg-green-100 text-green-800 border-green-200'; break;
            case 'Red': case 'Reddedilen': badgeClass = 'bg-red-100 text-red-800 border-red-200'; break;
            case 'Kısmen Mutabık': badgeClass = 'bg-amber-50 text-amber-700 border-amber-200'; break;
            case 'Bekliyor': badgeClass = 'bg-blue-50 text-blue-700 border-blue-100'; break;
            default: badgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
        }
    } else if (type === 'risk' || type === 'priority' || type === 'control') {
        const lower = normalizedValue.toLowerCase();
        if (lower.includes('kritik')) {
            badgeClass = 'bg-[#7f1d1d] text-white border-[#7f1d1d]';
            displayValue = 'Kritik';
        } else if (lower.includes('yüksek') || lower.includes('yuksek') || (lower.includes('y') && lower.includes('ksek'))) {
            badgeClass = 'bg-[#dc2626] text-white border-[#dc2626]';
            displayValue = 'Yüksek';
        } else if (lower.includes('orta')) {
            badgeClass = 'bg-[#f97316] text-white border-[#f97316]';
            displayValue = 'Orta';
        } else if (lower.includes('düşük') || lower.includes('dusuk') || (lower.includes('d') && lower.includes('k') && lower.length <= 5)) {
            badgeClass = 'bg-[#facc15] text-[#854d0e] border-[#facc15] shadow-sm';
            displayValue = 'Düşük';
        } else if (type === 'control') {
            // Support for legacy Turkish control labels
            if (lower === 'güçlü') {
                badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                displayValue = 'Güçlü';
            } else if (lower === 'zayıf') {
                badgeClass = 'bg-red-100 text-red-700 border-red-200';
                displayValue = 'Zayıf';
            }
        }
    } else if (type === 'result') { // Audit Result (Olumlu/Olumsuz etc)
        switch (normalizedValue) {
            case 'Olumlu': badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200'; break;
            case 'Koşullu': badgeClass = 'bg-amber-100 text-amber-700 border-amber-200'; break;
            case 'Olumsuz': badgeClass = 'bg-red-100 text-red-700 border-red-200'; break;
        }
    } else if (type === 'plan-type') { // Audit Plan Types
        switch (normalizedValue) {
            case 'Yıllık Plan': badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200'; break;
            case 'Revizyon-1': badgeClass = 'bg-amber-100 text-amber-800 border-amber-200'; break;
            case 'Revizyon-2': badgeClass = 'bg-orange-100 text-orange-800 border-orange-200'; break;
            case 'Revizyon-3': badgeClass = 'bg-red-100 text-red-800 border-red-200'; break;
            default: badgeClass = 'bg-gray-100 text-gray-700 border-gray-200'; // Other plan types or fallbacks
        }
    } else if (type === 'activity-status') { // Dashboard Logs
        switch (normalizedValue) {
            case 'Success':
            case 'Tamamlandı':
                badgeClass = 'bg-green-100 text-green-700 border-green-200';
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
                badgeClass = 'bg-red-100 text-red-700 border-red-200';
                displayValue = 'Hata';
                break;
        }
    }

    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

    return (
        <span className={`inline-flex items-center justify-center font-bold rounded-full border ${badgeClass} ${sizeClass} ${className}`}>
            {displayValue}
        </span>
    );
};

export default StatusBadge;
