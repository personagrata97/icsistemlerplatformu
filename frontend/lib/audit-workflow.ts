
export type FindingStatus =
    | 'Taslak'
    | 'Gözden Geçirme Bekliyor'
    | 'Onay Bekliyor'
    | 'Revizyon Gerekli'
    | 'Onaylandı'
    | 'Tebliğ Edildi'
    | 'Birim Yanıtladı'
    | 'Takip Ediliyor'
    | 'Doğrulama Bekliyor'
    | 'Tamamlandı'
    | 'Risk Kabul Edildi'
    | 'Denetim Esnasında Giderildi';

export type UserRole = 'Müfettiş' | 'Gözetim Sorumlusu' | 'Birim Yöneticisi' | 'Sistem Yöneticisi';

export interface WorkflowTransition {
    to: FindingStatus;
    label: string;
    role: UserRole;
    icon: string; // lucide ikon adı
    style: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    requireNote?: boolean;
    notify?: string[];
    /** Bu geçiş yalnızca gözetim sorumlusu atanmışsa gösterilir */
    requireSupervisor?: boolean;
    /** Bu geçiş yalnızca gözetim sorumlusu ATANMAMIŞ ise gösterilir (bypass) */
    requireNoSupervisor?: boolean;
}

// Süreç Log Kaydı Arayüzü
export interface ProcessLogEntry {
    timestamp: string;
    user: string;
    action: string;
    note?: string;
    from?: string;
    to?: string;
}

export const findingWorkflow: Record<string, { transitions: WorkflowTransition[] }> = {
    'Taslak': {
        transitions: [
            // Gözetim sorumlusu varsa → Gözden Geçirme Bekliyor
            { to: 'Gözden Geçirme Bekliyor', label: 'Gözden Geçirmeye Gönder', role: 'Müfettiş', icon: 'Send', style: 'primary', notify: ['supervisor'], requireSupervisor: true },
            // Gözetim sorumlusu yoksa (küçük yapı bypass) → direkt Onay Bekliyor (CAE)
            { to: 'Onay Bekliyor', label: 'Onaya Gönder (CAE)', role: 'Müfettiş', icon: 'Send', style: 'primary', notify: ['cae'], requireNoSupervisor: true }
        ]
    },
    'Gözden Geçirme Bekliyor': {
        transitions: [
            { to: 'Onay Bekliyor', label: 'Onayla ve CAE\'ye Gönder', role: 'Gözetim Sorumlusu', icon: 'CheckCircle', style: 'success', notify: ['cae'] },
            { to: 'Revizyon Gerekli', label: 'Revize İste', role: 'Gözetim Sorumlusu', icon: 'History', style: 'danger', requireNote: true, notify: ['inspector'] }
        ]
    },
    'Onay Bekliyor': {
        transitions: [
            { to: 'Onaylandı', label: 'Onayla', role: 'Gözetim Sorumlusu', icon: 'CheckCircle', style: 'success', notify: ['inspector'] },
            { to: 'Revizyon Gerekli', label: 'Revize Et', role: 'Gözetim Sorumlusu', icon: 'History', style: 'danger', requireNote: true, notify: ['inspector'] }
        ]
    },
    'Revizyon Gerekli': {
        transitions: [
            { to: 'Gözden Geçirme Bekliyor', label: 'Tekrar Gözden Geçirmeye Gönder', role: 'Müfettiş', icon: 'RotateCw', style: 'warning', notify: ['supervisor'], requireSupervisor: true },
            { to: 'Onay Bekliyor', label: 'Tekrar Onaya Gönder', role: 'Müfettiş', icon: 'RotateCw', style: 'warning', notify: ['cae'], requireNoSupervisor: true }
        ]
    },
    'Onaylandı': {
        transitions: [
            { to: 'Tebliğ Edildi', label: 'Tebliğ Et', role: 'Müfettiş', icon: 'Send', style: 'info', notify: ['unit'] }
        ]
    },
    'Tebliğ Edildi': {
        transitions: []
        // Birim mutabakat modülü üzerinden yanıtlar → otomatik 'Birim Yanıtladı' geçişi
    },
    'Birim Yanıtladı': {
        transitions: [
            { to: 'Takip Ediliyor', label: 'Takibe Al', role: 'Müfettiş', icon: 'PlayCircle', style: 'primary' },
            { to: 'Tamamlandı', label: 'Doğrula ve Kapat', role: 'Müfettiş', icon: 'CheckCircle', style: 'success', requireNote: true }
        ]
    },
    'Takip Ediliyor': {
        transitions: [
            { to: 'Doğrulama Bekliyor', label: 'Kanıt Geldi (Doğrulamaya Al)', role: 'Müfettiş', icon: 'FileSearch', style: 'primary' }
        ]
    },
    'Doğrulama Bekliyor': {
        transitions: [
            { to: 'Tamamlandı', label: 'Onayla ve Kapat', role: 'Müfettiş', icon: 'CheckCircle', style: 'success', requireNote: true },
            { to: 'Takip Ediliyor', label: 'Reddet', role: 'Müfettiş', icon: 'XCircle', style: 'danger', requireNote: true }
        ]
    },
    'Tamamlandı': { transitions: [] },
    'Risk Kabul Edildi': { transitions: [] },
    'Denetim Esnasında Giderildi': { transitions: [] }
};

/**
 * Mevcut duruma göre kullanılabilir geçişleri döndürür.
 * @param hasSupervisor Denetimde gözetim sorumlusu atanmış mı? (Gözetim sorumlusu bypass kontrolü)
 */
export const getAvailableTransitions = (currentStatus: string, userRole: UserRole, hasSupervisor: boolean = true): WorkflowTransition[] => {
    const statusConfig = findingWorkflow[currentStatus];
    if (!statusConfig) return [];

    return statusConfig.transitions.filter(t => {
        // Rol kontrolü
        const roleMatch = t.role === userRole || userRole === 'Sistem Yöneticisi';
        if (!roleMatch) return false;

        // Gözetim sorumlusu bypass kontrolü
        if (t.requireSupervisor && !hasSupervisor) return false;
        if (t.requireNoSupervisor && hasSupervisor) return false;

        return true;
    });
};

// "Revizyon Gerekli" durumundan geçişe izin verilip verilmediğini kontrol et
export const canTransitionFromRejection = (finding: { status: string; modifiedAfterRejection?: boolean }): { allowed: boolean; reason?: string } => {
    if (finding.status !== 'Revizyon Gerekli') {
        return { allowed: true };
    }

    if (!finding.modifiedAfterRejection) {
        return {
            allowed: false,
            reason: 'Reddedilen bulguda değişiklik yapmadan tekrar onaya gönderemezsiniz! Lütfen bulguyu düzenleyin.'
        };
    }

    return { allowed: true };
};

// Bulguya süreç log kaydı ekle
export const addProcessLogEntry = (
    processLog: ProcessLogEntry[] = [],
    action: string,
    user: string,
    note?: string,
    from?: string,
    to?: string
): ProcessLogEntry[] => {
    return [...processLog, {
        timestamp: new Date().toISOString(),
        user,
        action,
        note,
        from,
        to
    }];
};

// Geriye uyumluluk için merkezi kaynaktan yeniden dışa aktar
export { getStatusBadgeClass } from './audit-utils';

// İş Akışı Geçiş Buton Stilleri
export const getTransitionButtonClass = (style: string): string => {
    switch (style) {
        case 'primary': return 'btn bg-primary text-white hover:bg-primary/90 shadow-sm';
        case 'success': return 'btn bg-green-600 text-white hover:bg-green-700 shadow-sm';
        case 'danger': return 'btn bg-red-600 text-white hover:bg-red-700 shadow-sm';
        case 'warning': return 'btn bg-amber-500 text-white hover:bg-amber-600 shadow-sm';
        case 'info': return 'btn bg-blue-600 text-white hover:bg-blue-700 shadow-sm';
        case 'secondary': return 'btn bg-gray-600 text-white hover:bg-gray-700 shadow-sm';
        default: return 'btn bg-gray-600 text-white hover:bg-gray-700 shadow-sm';
    }
};
