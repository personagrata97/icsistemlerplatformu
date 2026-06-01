// import { toast } from '@/components/Toast'; // Moved to components
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from './audit-utils';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'; // Backend URL

export const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

const transformDecimals = (data: any): any => {
    if (data === null || data === undefined) return data;
    if (Object.prototype.toString.call(data) === '[object Date]' || (data && typeof data.getTime === 'function') || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0 && Object.getPrototypeOf(data) !== Object.prototype)) return data; // Date objelerini transform etme
    if (Array.isArray(data)) return data.map(transformDecimals);
    if (typeof data === 'object') {
        // Prisma Decimal object detection ({s, e, d})
        if (data.hasOwnProperty('s') && data.hasOwnProperty('e') && data.hasOwnProperty('d')) {
            return Number(data.toString ? data.toString() : JSON.stringify(data));
        }
        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = transformDecimals(data[key]);
            }
        }
        return result;
    }
    return data;
};

const handleResponse = async (res: Response) => {
    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            // Eğer zaten login sayfasındaysak redirect etme, hatayı fırlat
            if (window.location.pathname === '/login') {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
            }

            localStorage.removeItem('access_token');
            // localStorage.removeItem('user'); // Optional: clear user data too
            window.location.href = '/login';
        }
        throw new Error('Oturum süresi doldu');
    }
    if (!res.ok) {
        // Try to get error message from body
        let errorMessage = 'Bir hata oluştu';
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
            if (errorMessage === 'Internal Server Error') errorMessage = 'Sunucu hatası oluştu';
        } catch (e) {
            // ignore
        }
        throw new Error(errorMessage);
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return transformDecimals(data);
};

const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit = {}) => {
    const { timeout = 10000 } = options as any; // 10s default

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Sunucu yanıt vermiyor (Zaman aşımı)');
        }
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            throw new Error('Sunucuya erişilemiyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
        }
        throw error;
    }
};

// --- TYPES ---
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    title?: string;
    department?: string;
}

export interface Audit {
    id: number | string;
    title: string;
    code?: string;
    status: string;
    riskLevel?: string;
    startDate?: string;
    endDate?: string;
    team?: { id: string, name: string, role: string }[];
    unitId?: string;
    unit?: AuditableUnit;
    linkedEthicsReportId?: string;
    workpapers?: any[];
}

export interface Finding {
    id: number | string;
    auditId: number | string;
    title: string;
    code: string;
    riskLevel: string;
    category?: string | string[];
    status: string;
    dueDate?: string;
    description?: string;
    rootCause?: string;
    effect?: string;
    recommendation?: string;
    criteria?: string;
    inspectorRecommendation?: string;
    inspectorEvidence?: string[];
    isAgreed?: boolean | null;
    disagreementReason?: string;
    unitEvidence?: string[];
    actionPlan?: string;
    actions?: Array<{
        id: string;
        action: string;
        dueDate: string;
        responsible: string;
    }>;
    finalInspectorOpinion?: string;
    closingRemarks?: string;
    reviewNotes?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    assignedUserId?: string | null;
    assignedUser?: User;
    audit?: Audit;
    linkedEthicsReportId?: string;
    createdAt?: string;
    followUps?: any[];
    extensionRequests?: ExtensionRequest[];
    isRiskAccepted?: boolean;
    riskAcceptanceJustification?: string;
    resolvedDuringAudit?: boolean;
    // Professional Audit Features
    isRepeatFinding?: boolean;
    relatedFindingId?: string | null;
    relatedFinding?: Finding;
    tags?: string[];
    workingPaperRef?: string;
    workpaperId?: string | null;
    auditTestId?: string | null;
    // RCM Integration (IIA 2024 Prensip 15)
    processId?: string | null;
    riskId?: string | null;
    controlId?: string | null;
    history?: { action: string; date: string; user?: string }[];
}

export interface Workpaper {
    id: string;
    auditId: string;
    code: string;
    title: string;
    category: string;
    status: 'Taslak' | 'İncelemede' | 'Onaylandı' | 'Revizyon' | string;
    version: number;
    filename?: string;
    mimetype?: string;
    fileType?: string;
    size?: number;
    url?: string;
    notes?: string;
    tags?: string[];
    isLocked: boolean;
    lockedById?: string;
    lockedAt?: string;
    preparerId?: string;
    preparer?: User | any;
    reviewerId?: string;
    reviewer?: User | any;
    approverId?: string;
    approver?: User | any;
    testRefs?: string[];
    createdAt: string;
    updatedAt: string;
    history?: any[];
}


export interface CreateFindingDto {
    auditId: number | string;
    title: string;
    code?: string; // Optional override
    risk: string;
    category: string | string[];
    description?: string;
    status?: string;
    criteria?: string;
    rootCause?: string;
    effect?: string;
    recommendation?: string;
    departmentResponse?: string;
    inspectorRecommendation?: string;
    inspectorEvidence?: string[];
    unitEvidence?: string[];
    dueDate?: string | Date;
    assignedUserId?: string;
    department?: string;
    actionPlan?: string;
    actions?: any[];
    isAgreed?: boolean;
    disagreementReason?: string;
    finalInspectorOpinion?: string;
    closingRemarks?: string;
    processId?: string;
    riskId?: string;
    controlId?: string;
    resolvedDuringAudit?: boolean;
    isRepeatFinding?: boolean;
    relatedFindingId?: string;
    isRecurring?: boolean;
    recurringFindingId?: string;
    recurringNote?: string;
    tags?: string[];
    workingPaperRef?: string;
    workpaperId?: string;
    auditTestId?: string;
    financialImpact?: number;
    reviewerId?: string;
    regulatoryRisk?: boolean;
}

export interface UpdateFindingDto extends Partial<CreateFindingDto> {
    reviewNotes?: string;
    processHistory?: string;
    attachments?: string;
    lastEditedAt?: string;
    rejectionNote?: string;
}

export interface ExtensionRequest {
    id: string;
    findingId: string;
    followUpId?: string;
    currentDeadline: string;
    requestedDeadline: string;
    reason: string;
    status: string; // Beklemede, Onaylandı, Reddedildi
    notes?: string;
    requestorId: string;
    requestorName: string;
    createdAt: string;
}

export interface AuditableUnit {
    id: string;
    name: string;
    code?: string;
    type: 'Şube' | 'Birim' | 'Süreç' | 'Departman' | string;
    riskLevel?: 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük' | string;
    description?: string;
    manager?: string;
    location?: string;
    employeeCount?: number;
    transactionVolume?: 'Yüksek' | 'Orta' | 'Düşük' | string;
    financialImpact?: 'Yüksek' | 'Orta' | 'Düşük' | string;
    riskScore?: number;
    auditCycle?: number;
    lastAuditDate?: string;
    lastAuditResult?: string;
    openFindingsCount?: number;
    inherentRisk?: 'Yüksek' | 'Orta' | 'Düşük' | string;
    controlEffectiveness?: 'Güçlü' | 'Orta' | 'Zayıf' | string;
    changeRisk?: boolean;
    mandatoryAudit?: boolean;
    regulations?: string;
}

export interface Process {
    id: string;
    unitId: string;
    name: string;
    risks?: Risk[];
}

export interface Risk {
    id: string;
    processId: string;
    code?: string;
    name: string;
    level: string;
    controls?: Control[];
}

export interface Control {
    id: string;
    riskId: string;
    code?: string;
    name: string;
    description?: string;
    frequency?: string;
    type?: string;
}

export interface AuditTest {
    id: string;
    auditId: string;
    controlId: string;
    title?: string;
    procedure?: string;
    sampleSize?: number;
    designEffectiveness?: string;
    operatingEffectiveness?: string;
    testResult?: string;
    testedBy?: string;
    testDate?: string;
    notes?: string;
    evidence?: string;
    status?: string;
    reviewerId?: string;
    reviewedAt?: string;
    supervisorId?: string;
    supervisorApprovedAt?: string;
}




export interface StaffExperience {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description?: string;
    department?: string;
    companyName?: string;
    position?: string;
    isCurrent?: boolean;
    careerPaths?: any;
}

export interface StaffEducation {
    id: string;
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    schoolName?: string;
    faculty?: string;
    department?: string;
    graduationYear?: string;
}

export interface StaffTraining {
    id: string;
    name: string;
    provider: string;
    date: string;
    duration: number; // hours
    cpeCredits?: number;
    certificateUrl?: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    hours?: number;
    description?: string;
    status?: string;
}

export interface StaffPromotion {
    id: string;
    oldTitle: string;
    newTitle: string;
    date: string;
    reason?: string;
    title?: string;
    previousTitle?: string;
    type?: string;
    promotionDate?: string;
    endDate?: string;
    department?: string;
    notes?: string;
}

export interface AuditStaff {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    title: string;
    employeeId: string;
    registerNumber?: string;
    birthDate: string;
    hireDate: string;
    email: string;
    username?: string; // Added for filtering admin
    role?: string | string[]; // Added for role assignments
    roles?: string[]; // Alternative format
    phone: string;
    department: string;
    status: 'Aktif' | 'İzinli' | 'Pasif';
    annualLeave: number;
    usedLeave: number;
    certifications: string[];
    notes: string;
    photoUrl?: string;
    summary?: string;
    skills?: string;
    experiences?: StaffExperience[];
    education?: StaffEducation[];
    trainings?: StaffTraining[];
    promotions?: StaffPromotion[];
}

export const getWorkpaperUrl = (auditId: string, filename: string) => {
    return `${API_BASE_URL}/audit/audits/${auditId}/workpapers/${encodeURIComponent(filename)}`;
};

// LocalStorage Helper REMOVED - STRICT SERVER MODE

export const auditApi = {
    // LOGS
    getLogs: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/logs`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    getAuditHistory: async (auditId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${auditId}/history`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    verifyLogIntegrity: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/logs/verify-integrity`, {
            headers: getHeaders(),
            timeout: 60000, // 60 saniye (büyük log tabloları için)
        } as any);
        return handleResponse(res);
    },

    repairLogChain: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/logs/repair-chain`, {
            method: 'POST',
            headers: getHeaders(),
            timeout: 60000, // 60 saniye (büyük log tabloları için)
        } as any);
        return handleResponse(res);
    },

    getNotifications: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    getUnreadNotificationCount: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/unread-count`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    markNotificationAsRead: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    markAllNotificationsAsRead: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // STAFF
    getStaff: async (): Promise<AuditStaff[]> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff`, { headers: getHeaders() });
        return handleResponse(res);
    },

    createStaff: async (data: Partial<AuditStaff>): Promise<AuditStaff> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    updateStaff: async (id: string, data: Partial<AuditStaff>): Promise<AuditStaff> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    getStaffProfile: async (id: string): Promise<AuditStaff> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${id}/profile`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    addStaffPromotion: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${id}/promote`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    updateStaffPromotion: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/promotion/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    deleteStaffPromotion: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/promotion/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    addStaffExperience: async (userId: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${userId}/experience`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateStaffExperience: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/experience/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteStaffExperience: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/experience/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    addStaffEducation: async (userId: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${userId}/education`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateStaffEducation: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/education/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteStaffEducation: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/education/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- Mesleki Eğitim ---
    addStaffTraining: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${id}/training`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    updateStaffTraining: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/training/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    deleteStaffTraining: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/training/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    createTrainingBatch: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/trainings/bulk`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    cancelTrainingBatch: async (batchId: string, notes: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/trainings/batch/${batchId}/cancel`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ notes })
        });
        return handleResponse(res);
    },

    deleteStaff: async (id: string): Promise<void> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    uploadStaffPhoto: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        // Remove Content-Type to let browser set boundary
        const headers = getHeaders();
        delete (headers as any)['Content-Type'];

        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/upload-photo`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        return handleResponse(res);
    },

    getCpeStats: async (year?: number) => {
        const query = year ? `?year=${year}` : '';
        // Controller endpoint is @Get('staff/cpe-stats')
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/staff/cpe-stats${query}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    // AUDITS
    getAudits: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits`, { headers: getHeaders() });
        return handleResponse(res);
    },

    getAuditById: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    createAudit: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    updateAudit: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    deleteAudit: async (id: string, reason?: string, comment?: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ reason, comment })
        });
        return handleResponse(res);
    },

    approveDeleteAudit: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${id}/approve-delete`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    rejectDeleteAudit: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${id}/reject-delete`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // COMMUNICATIONS & MEETINGS
    getAuditCommunications: async (auditId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/communications`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getAuditCommunication: async (auditId: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/communications/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createAuditCommunication: async (auditId: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/communications`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateAuditCommunication: async (auditId: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/communications/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteAuditCommunication: async (auditId: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/communications/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
    getAuditMeetings: async (auditId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/meetings`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createAuditMeeting: async (auditId: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/meetings`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateAuditMeeting: async (auditId: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/meetings/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteAuditMeeting: async (auditId: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/${auditId}/meetings/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    getWorkpapers: async (auditId: string): Promise<Workpaper[]> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${auditId}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    getWorkpaperHistory: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/history`, { headers: getHeaders() });
        return handleResponse(res);
    },

    uploadWorkpaper: async (auditId: string, file: File, category: string = 'Genel') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        // Don't set Content-Type header, let browser set it with boundary
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${auditId}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!res.ok) throw new Error('Çalışma kağıdı yüklenemedi');
        return res.json();
    },

    createWorkpaper: async (auditId: string, data: Partial<Workpaper>) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${auditId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    updateWorkpaperFile: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/file`, {
            method: 'PUT',
            headers,
            body: formData,
        });
        if (!res.ok) throw new Error('Dosya güncellenemedi');
        return res.json();
    },

    createWorkpaperFromTemplate: async (auditId: string, templateId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${auditId}/from-template/${templateId}`, {
            method: 'POST',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    lockWorkpaper: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/lock`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    unlockWorkpaper: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/unlock`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    signOffWorkpaper: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/sign-off`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    approveWorkpaperAsSupervisor: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/supervisor-approve`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    requestWorkpaperRevision: async (id: string, revisionNotes: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}/revision`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ revisionNotes })
        });
        return handleResponse(res);
    },

    deleteWorkpaper: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpapers/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
    generateReport: async (type: string, period: string, templateId?: string, includeWatermark: boolean = true) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/reports/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ type, period, templateId, includeWatermark }),
        });
        return handleResponse(res);
    },
    generateWordReport: async (auditId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/reports/generate-word`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ auditId })
        });
        return handleResponse(res);
    },
    getGeneratedReports: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/reports/history`, { headers: getHeaders() });
        return handleResponse(res);
    },
    downloadReport: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/audit/reports/download/${id}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Rapor indirilemedi');
        return res.blob();
    },
    deleteReport: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/reports/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // ALL CONTROLS (for controls library page)
    getAllControls: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/controls`, { headers: getHeaders() });
        return handleResponse(res);
    },

    // CREATE DOCUMENT (stub for TestSteps evidence upload)
    createDocument: async (data: { name: string; type: string; size: string; uploadedBy: string; uploadedAt: string }) => {
        console.warn('createDocument: Using local stub - document not persisted to backend');
        return { id: Date.now().toString(), ...data };
    },

    getFindings: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings`, { headers: getHeaders() });
        return handleResponse(res);
    },

    // MULTI-YEAR PLAN
    getMultiYearPlans: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getMultiYearPlanById: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createMultiYearPlan: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateMultiYearPlan: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    // ITERATIVE CONCILIATION
    getConciliationMessages: async (findingId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${findingId}/conciliation-messages`, { headers: getHeaders() });
        return handleResponse(res);
    },
    addConciliationMessage: async (findingId: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${findingId}/conciliation-messages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteMultiYearPlan: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    approveMultiYearPlan: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/${id}/approve`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    exportMultiYearPlan: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/${id}/export`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    downloadMultiYearPlanFile: async (filename: string) => {
        const res = await fetch(`${API_BASE_URL}/audit/multi-year-plans/download/${filename}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Dosya indirilemedi');
        return res.blob();
    },
    addMultiYearPlanItem: async (planId: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/${planId}/items`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteMultiYearPlanItem: async (itemId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/multi-year-plans/items/${itemId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },



    getFinding: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    getFindingById: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    checkRecurringFindings: async (data: { unitId?: string, department?: string, category?: string, title?: string }) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/check-recurring`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    createFinding: async (data: CreateFindingDto) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    updateFinding: async (id: string, data: UpdateFindingDto) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    notifyFinding: async (id: string, email: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}/notify`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email }),
        });
        return handleResponse(res);
    },

    deleteFinding: async (id: string, reason?: string, comment?: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ reason, comment })
        });
        return handleResponse(res);
    },

    approveDeleteFinding: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}/approve-delete`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    rejectDeleteFinding: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}/reject-delete`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    uploadConciliationEvidence: async (findingId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const headers = getHeaders();
        delete (headers as any)['Content-Type'];

        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${findingId}/conciliation-evidence`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        return handleResponse(res);
    },

    uploadFindingEvidence: async (findingId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const headers = getHeaders();
        delete (headers as any)['Content-Type']; // Let browser set boundary for FormData

        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${findingId}/evidence`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        return handleResponse(res);
    },

    acceptRisk: async (id: string | number, justification: string, file?: File | null): Promise<Finding> => {
        const formData = new FormData();
        formData.append('justification', justification);
        if (file) {
            formData.append('file', file);
        }

        const headers = getHeaders();
        delete (headers as any)['Content-Type'];

        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}/accept-risk`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        return handleResponse(res);
    },

    getExtensionRequests: async (findingId?: string | number): Promise<ExtensionRequest[]> => {
        const url = findingId
            ? `${API_BASE_URL}/audit/extension-requests?findingId=${findingId}`
            : `${API_BASE_URL}/audit/extension-requests`;
        const res = await fetchWithTimeout(url, { headers: getHeaders() });
        return handleResponse(res);
    },

    createExtensionRequest: async (data: any): Promise<ExtensionRequest> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/extension-requests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    handleExtensionRequest: async (id: string, status: string, notes: string): Promise<ExtensionRequest> => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/extension-requests/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status, notes }),
        });
        return handleResponse(res);
    },


    // LOGS - getLogs defined above (line ~259)
    createLog: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/logs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },




    // AUDITABLE UNITS (UNIVERSE)
    getAuditableUnits: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/units`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createUnit: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/units`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateUnit: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/units/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteUnit: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/units/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // EDUCATION
    getEducations: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/educations`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createEducation: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/educations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateEducation: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/educations/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteEducation: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/educations/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },



    // --- TIMESHEETS ---
    async getTimesheets(week?: string) {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets${week ? `?week=${week}` : ''}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async getTimesheetStats() {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/stats`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    async logTime(data: any) {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async updateTimeEntry(id: string, data: any) {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async deleteTimeEntry(id: string) {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // IIA Std 2030: Denetim bazlı efor özeti
    async getAuditTimesheetSummary(auditId: string) {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/audit/${auditId}/summary`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // FOLLOW UP
    getFollowUps: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/follow-ups`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createFollowUp: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/follow-ups`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    updateFollowUp: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/follow-ups/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteFollowUp: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/follow-ups/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // ETHICS
    getEthicsStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/stats`, { headers: getHeaders() });
        return handleResponse(res);
    },
    // CONCILIATION
    getConciliations: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/conciliations`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createConciliation: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/conciliations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateConciliation: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/conciliations/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteConciliation: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/conciliations/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // WORKFLOW
    updateFindingStatus: async (id: string, status: string, note?: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/findings/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status, note }),
        });
        return handleResponse(res);
    },

    emptyTrash: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/empty`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // REPORTS
    getExecutiveStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/executive/stats`, { headers: getHeaders() });
        return handleResponse(res);
    },

    getActivityReportStats: async (period: string = '2024') => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/reports/activity-stats?period=${period}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    // Duplicates removed


    // RCM (RISK CONTROL MATRIX)
    getProcesses: async (unitId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/units/${unitId}/processes`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createProcess: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/processes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateProcess: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/processes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteProcess: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/processes/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    getRisks: async (processId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/processes/${processId}/risks`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createRisk: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/risks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateRisk: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/risks/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteRisk: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/risks/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    getControls: async (riskId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/risks/${riskId}/controls`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createControl: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/controls`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateControl: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/controls/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteControl: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/controls/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // Audit Tests
    getAuditTests: async (auditId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/audits/${auditId}/tests`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createAuditTest: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/tests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateAuditTest: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/tests/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteAuditTest: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/tests/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // Review Notes
    createReviewNote: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/review-notes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    // Timesheets
    getTimesheetsByAudit: async (auditId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/audit/${auditId}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createTimesheet: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateTimesheet: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteTimesheet: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/timesheets/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // AI
    analyzeFinding: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/ai/analyze-finding`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    chat: async (message: string, history: any[] = []) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ message, history }),
            timeout: 60000 // 60s for AI
        } as any);
        return handleResponse(res);
    },

    // ==================== QUALITY ASSURANCE ====================

    // Metrics
    getQualityMetrics: async (period?: string) => {
        const params = period ? `?period=${period}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/metrics${params}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    createQualityMetric: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/metrics`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateQualityMetric: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/metrics/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteQualityMetric: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/metrics/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // Assessments
    getQualityAssessments: async (type?: string) => {
        const params = type ? `?type=${type}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/assessments${params}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    getQualityAssessment: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/assessments/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    createQualityAssessment: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/assessments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateQualityAssessment: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/assessments/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteQualityAssessment: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/assessments/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // Actions
    getQualityActions: async (assessmentId?: string, status?: string) => {
        const params = new URLSearchParams();
        if (assessmentId) params.append('assessmentId', assessmentId);
        if (status) params.append('status', status);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/actions${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    createQualityAction: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/actions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateQualityAction: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/actions/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteQualityAction: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/actions/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // Quality Stats
    getQualityStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/stats`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    getAutoMetrics: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/quality/auto-metrics`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // ==================== INDEPENDENCE DECLARATION ====================

    getIndependenceDeclarations: async (filters?: { status?: string; year?: number; userId?: string; auditId?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.year) params.append('year', filters.year.toString());
        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.auditId) params.append('auditId', filters.auditId);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    getMyDeclarations: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/my`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    getPendingDeclarations: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/pending`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    getIndependenceStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/stats`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    getIndependenceDeclaration: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    createIndependenceDeclaration: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updateIndependenceDeclaration: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    reviewIndependenceDeclaration: async (id: string, data: { status: string; reviewNotes?: string }) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/${id}/review`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteIndependenceDeclaration: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/independence/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // ==================== SAMPLING ====================

    getSamples: async (filters?: { auditId?: string; method?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.auditId) params.append('auditId', filters.auditId);
        if (filters?.method) params.append('method', filters.method);
        if (filters?.status) params.append('status', filters.status);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling${queryString}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    getSample: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    createSample: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    generateAdvancedSample: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling/advanced-generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    generateAdvancedSampleWithFile: async (config: any, file: File) => {
        const formData = new FormData();
        formData.append('config', JSON.stringify(config));
        formData.append('file', file);
        const headers = getHeaders();
        delete (headers as any)['Content-Type'];
        
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling/advanced-generate-with-file`, {
            method: 'POST',
            headers,
            body: formData,
            timeout: 120000, // 2 dakika (büyük dosya parse süresi için)
        } as any);
        return handleResponse(res);
    },
    updateSample: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deleteSample: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    selectSample: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/sampling/${id}/select`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    calculateSampleSize: async (data: { populationSize: number; confidenceLevel: number; errorRate: number }) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/sampling/calculate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    performSampleSelection: async (id: string, data?: { items?: string[] }) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/sampling/${id}/select`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data || {})
        });
        return handleResponse(res);
    },
    recordSampleResults: async (id: string, data: { testResult: string; deviationsFound: number; conclusions: string; notes?: string }) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/sampling/${id}/results`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    downloadWorkpaper: async (id: string, defaultFileName: string = 'belge') => {
        const res = await fetch(`${API_BASE_URL}/audit/workpapers/${id}/download`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Dosya indirilemedi');
        
        let finalFileName = defaultFileName;
        const disposition = res.headers.get('content-disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) { 
                finalFileName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
            }
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },
    getSamplingStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/sampling/stats/summary`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- WORKPAPER TEMPLATES ---
    getWorkpaperTemplates: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpaper-templates`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    seedWorkpaperTemplates: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/workpaper-templates/seed`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // --- DOCUMENTS VERSIONING ---
    getDocumentHistory: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/${id}/history`, { headers: getHeaders() });
        return handleResponse(res);
    },
    restoreDocumentVersion: async (id: string, versionId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/${id}/restore/${versionId}`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    uploadDocument: async (formData: FormData) => {
        const headers = getHeaders();
        delete (headers as any)['Content-Type'];
        
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            headers: headers as any,
            body: formData
        });
        return handleResponse(res);
    },
    updateDocument: async (id: string, formData: FormData) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/${id}/update`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': undefined
            } as any,
            body: formData
        });
        return handleResponse(res);
    },
    getDocuments: async (category?: string) => {
        const url = category ? `${API_BASE_URL}/documents?category=${category}` : `${API_BASE_URL}/documents`;
        const res = await fetchWithTimeout(url, { headers: getHeaders() });
        return handleResponse(res);
    },
    deleteDocument: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    searchDocuments: async (query: string, category?: string) => {
        const params = new URLSearchParams({ q: query });
        if (category) params.append('category', category);
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/search?${params.toString()}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    aiSearchDocuments: async (query: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/documents/ai-search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
        return handleResponse(res);
    },

    // --- ETHICS ---
    getEthicsReports: async (filters?: any) => {
        const params = new URLSearchParams(filters);
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics?${params.toString()}`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    getReportWithHistory: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${id}/history`, {
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    createEthicsReport: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    updateEthicsReport: async (id: string, status: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${id}/status`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        });
        return handleResponse(res);
    },
    updateEthicsReportNotes: async (id: string, notes: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${id}/notes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ notes }),
        });
        return handleResponse(res);
    },

    assignEthicsReport: async (id: string, assigneeId: string, conflictDeclared: boolean, justification?: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${id}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ assigneeId, conflictDeclared, justification })
        });
        return handleResponse(res);
    },
    declareEthicsConflict: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${id}/declare-conflict`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    closeEthicsReport: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${id}/close`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    getEthicsReportByCode: async (code: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/query/${code}`, {
            headers: getHeaders()
        });
        if (res.status === 404) return null;
        return handleResponse(res);
    },
    uploadEthicsEvidence: async (trackingCode: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/query/${trackingCode}/evidence`, {
            method: 'POST',
            body: formData,
        });
        return handleResponse(res);
    },
    addReporterMessage: async (trackingCode: string, content: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/query/${trackingCode}/message`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(res);
    },

    // Admin message creation endpoint
    addEthicsMessage: async (reportId: string, content: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/ethics/${reportId}/message`, {
            method: 'POST',
            body: JSON.stringify({ content }),
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    // EXPORT UTILS
    exportToExcel: (data: any[], fileName: string) => {
        const worksheet = (XLSX.utils as any).json_to_sheet(data);
        const workbook = (XLSX.utils as any).book_new();
        (XLSX.utils as any).book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    },

    exportToPDF: (data: any[], title: string) => {
        const pdfTheme = require('./pdf-theme');
        const doc = new jsPDF();
        let y = pdfTheme.PDF_CONTENT_START_Y as number;
        const reportTitle = title;
        const C = pdfTheme.PDF_COLORS;

        y = pdfTheme.drawPdfSectionHeader(doc, title, y);

        if (data.length > 0) {
            if (data.length > 1) {
                const headers = Object.keys(data[0]);
                const rows = data.map((obj: any) => Object.values(obj));

                (autoTable as any)(doc, {
                    head: [headers],
                    body: rows as any,
                    startY: y,
                    headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold' },
                    styles: { fontSize: 8, lineColor: C.border, lineWidth: 0.3 },
                    alternateRowStyles: { fillColor: C.bgLight },
                });
            } else {
                const audit = data[0];
                doc.setFontSize(10);
                doc.setTextColor(C.text[0], C.text[1], C.text[2]);

                Object.entries(audit).forEach(([key, value]) => {
                    if (typeof value !== 'object' && value !== null) {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(9);
                        doc.setTextColor(C.textSecondary[0], C.textSecondary[1], C.textSecondary[2]);
                        doc.text(`${key}:`, 14, y);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(C.text[0], C.text[1], C.text[2]);
                        doc.text(String(value), 80, y);
                        y += 12;
                    }
                });
            }
        }

        pdfTheme.applyPdfTemplate(doc, reportTitle);
        doc.save(`${title}.pdf`);
    },

    // PLANS
    getPlans: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/plans`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getPlan: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/plans/${id}`, { headers: getHeaders() });
        return handleResponse(res);
    },
    createPlan: async (data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/plans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    updatePlan: async (id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/plans/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },
    deletePlan: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/plans/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    uploadPlanDocument: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/plans/${id}/document`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': undefined
            } as any,
            body: formData
        });
        return handleResponse(res);
    },

    // TRASH
    getDeletedAudits: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/audits`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getDeletedFindings: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/findings`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getDeletedPlans: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/plans`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getDeletedEthics: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/ethics`, { headers: getHeaders() });
        return handleResponse(res);
    },
    getDeletedDocuments: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/documents`, { headers: getHeaders() });
        return handleResponse(res);
    },
    restoreAudit: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/audits/${id}/restore`, { method: 'POST', headers: getHeaders() });
        return handleResponse(res);
    },
    restoreFinding: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/findings/${id}/restore`, { method: 'POST', headers: getHeaders() });
        return handleResponse(res);
    },
    restorePlan: async (id: string) => {
        // Assuming endpoint exists or similar pattern
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/plans/${id}/restore`, { method: 'POST', headers: getHeaders() });
        return handleResponse(res);
    },
    restoreEthics: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/ethics/${id}/restore`, { method: 'POST', headers: getHeaders() });
        return handleResponse(res);
    },
    restoreDocument: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/documents/${id}/restore`, { method: 'POST', headers: getHeaders() });
        return handleResponse(res);
    },

    permanentDeleteAudit: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/audits/${id}/permanent`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(res);
    },
    permanentDeleteFinding: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/findings/${id}/permanent`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(res);
    },
    permanentDeletePlan: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/plans/${id}/permanent`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(res);
    },
    permanentDeleteEthics: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/ethics/${id}/permanent`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(res);
    },
    permanentDeleteDocument: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/trash/documents/${id}/permanent`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(res);
    },



    sendReportToBDDK: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/audit/reports/${id}/send-to-bddk`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
};


