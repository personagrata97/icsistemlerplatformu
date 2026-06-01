console.log("🚀 APP.JS YÜKLEME BAŞLADI");

// Global Error Handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Global Error:', msg, error);
    const mainView = document.getElementById('main-view');
    if (mainView) {
        mainView.innerHTML = `
            <div style="padding: 2rem; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; rounded: 0.5rem;">
                <h3>Bir hata oluştu</h3>
                <p>${msg}</p>
                <small>${url}:${lineNo}</small>
                <pre style="margin-top: 1rem; font-size: 0.75rem;">${error?.stack || ''}</pre>
            </div>
        `;
    }
    return false;
};

// Toggle Submenu Function
window.toggleSubmenu = function (id) {
    console.log('toggleSubmenu called with:', id);
    const submenu = document.getElementById(id);
    if (!submenu) {
        console.error('Submenu not found:', id);
        return;
    }

    const isHidden = submenu.style.display === 'none' || submenu.style.display === '';
    submenu.style.display = isHidden ? 'block' : 'none';

    // Find chevron icon (works even if lucide hasn't initialized yet)
    const parentLink = submenu.previousElementSibling;
    if (parentLink) {
        const chevronIcon = parentLink.querySelector('[data-lucide="chevron-down"], .lucide-chevron-down, svg');
        if (chevronIcon) {
            chevronIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    console.log('Submenu toggled. Now visible:', isHidden);
};

// GLOBAL UTILS
window.formatCurrency = function (amount) {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

window.formatDate = function (dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
};

window.getStatusColor = function (status) {
    switch (status) {
        case 'Tamamlandı': return '#10b981';
        case 'Devam Ediyor': return '#3b82f6';
        case 'Planlandı': return '#8b5cf6';
        case 'Taslak': return '#94a3b8';
        case 'İptal Edildi': return '#ef4444';
        case 'Raporlanıyor': return '#f59e0b';
        case 'Gözden Geçirme': return '#8b5cf6';
        case 'Açık': return '#ef4444';
        case 'Kapalı': return '#10b981';
        case 'Onaylandı': return '#10b981';
        case 'Onayda': return '#f59e0b';
        case 'Reddedildi': return '#ef4444';
        case 'Yeni': return '#3b82f6';
        case 'İnceleniyor': return '#f59e0b';
        case 'Etkin': return '#10b981';
        case 'Gelişime Açık': return '#f59e0b';
        case 'Yetersiz': return '#ef4444';
        default: return '#64748b';
    }
};

window.getRiskColor = function (risk) {
    switch (risk) {
        case 'Kritik': return '#dc2626';
        case 'Yüksek': return '#ea580c';
        case 'Orta': return '#ca8a04';
        case 'Düşük': return '#16a34a';
        default: return '#64748b';
    }
};


// Helper: Clean deleted items older than 30 days
function cleanOldDeletedItems(deletedItems) {
    if (!Array.isArray(deletedItems)) return [];
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return deletedItems.filter(item => {
        if (!item.deletedDate) return true;
        const deletedTime = new Date(item.deletedDate).getTime();
        return deletedTime > thirtyDaysAgo;
    });
}

// LocalStorage Functions
function loadFromStorage() {
    // v3 = clean version, no demo data
    let saved = localStorage.getItem('auditSystemData_v3');

    // Migration: If v3 doesn't exist but v2 does, migrate user's real data
    if (!saved) {
        const oldData = localStorage.getItem('auditSystemData_v2');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                // Demo data IDs are 1-10, user data is typically > 10 (Date.now() based)
                // Filter out demo audits and findings
                const demoAuditIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                const demoFindingIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

                parsed.audits = (parsed.audits || []).filter(a => !demoAuditIds.includes(Number(a.id)));
                parsed.findings = (parsed.findings || []).filter(f => !demoFindingIds.includes(Number(f.id)));

                // Save migrated data to v3
                localStorage.setItem('auditSystemData_v3', JSON.stringify(parsed));
                console.log('✅ v2 → v3 migration complete. User data preserved, demo data removed.');
                saved = localStorage.getItem('auditSystemData_v3');
            } catch (e) {
                console.error('Migration error:', e);
            }
        }
    }

    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Ensure deletedAudits exists
            if (!data.deletedAudits) {
                data.deletedAudits = [];
            }
            // Ensure staff exists
            if (!data.staff || data.staff.length === 0) {
                console.log("👥 Seeding default staff data...");
                data.staff = [
                    { id: 1, name: 'Ahmet Yılmaz', title: 'Kıdemli Müfettiş', status: 'Aktif' },
                    { id: 2, name: 'Ayşe Demir', title: 'Müfettiş', status: 'Aktif' },
                    { id: 3, name: 'Mehmet Öz', title: 'Müfettiş Yrd.', status: 'Aktif' },
                    { id: 4, name: 'Fatma Kaya', title: 'Baş Müfettiş', status: 'Aktif' }
                ];
            }

            // Clean up items older than 30 days
            data.deletedAudits = cleanOldDeletedItems(data.deletedAudits);
            return data;
        } catch (e) {
            console.error('Error loading data:', e);
            return getDefaultData();
        }
    }
    return getDefaultData();
}

// ...

function saveToStorage() {
    const data = {
        audits: state.audits,
        findings: state.findings,
        deletedAudits: state.deletedAudits,
        deletedFindings: state.deletedFindings,
        deletedPlans: state.deletedPlans,
        deletedWorkpapers: state.deletedWorkpapers,
        logs: state.logs,
        ethicsReports: state.ethicsReports,
        auditPlans: state.auditPlans,
        staff: state.staff
    };
    localStorage.setItem('auditSystemData_v3', JSON.stringify(data));
    updateTrashCount();
    window.state = state;
}

// Update trash count badge
function updateTrashCount() {
    const trashBadge = document.getElementById('trash-count');
    if (trashBadge) {
        const count = state.deletedAudits.length;
        if (count > 0) {
            trashBadge.textContent = count;
            trashBadge.style.display = 'flex';
        } else {
            trashBadge.style.display = 'none';
        }
    }
}

function getDefaultData() {
    // Varsayılan veri boş olmalı - kullanıcı kendi verilerini ekleyecek
    // Demo veriler localStorage ile çakışma yaratıyordu
    return {
        audits: [],
        findings: [],
        deletedAudits: [],
        ethicsReports: [
            {
                id: 101,
                subject: 'Mobbing / Ayrımcılık',
                category: 'Mobbing',
                name: 'İsimsiz',
                email: '-',
                phone: '-',
                message: 'Şube müdürü tarafından sürekli psikolojik baskı görüyoruz. Son 6 aydır devam ediyor.',
                date: '2023-11-10T10:00:00.000Z',
                status: 'İnceleniyor',
                source: 'Web',
                priority: 'Yüksek',
                dueDate: '2023-12-15',
                assignedTo: 'Ahmet Yılmaz',
                files: [],
                notes: [
                    { id: 1, date: '2023-11-11T09:00:00.000Z', author: 'Ahmet Yılmaz', content: 'İlk inceleme yapıldı. Şube kayıtları talep edildi.' }
                ],
                communications: [
                    { id: 1, date: '2023-11-12T10:00:00.000Z', type: 'email', direction: 'out', content: 'Sayın bildiren, başvurunuz alınmıştır. En kısa sürede size dönüş yapılacaktır.', to: 'Anonim' }
                ],
                requestedDocs: [
                    { id: 1, title: 'Şube personel listesi', status: 'Tamamlandı', requestedAt: '2023-11-11T10:00:00.000Z' }
                ],
                history: [
                    { date: '2023-11-10T10:00:00.000Z', action: 'Bildirim Alındı', by: 'Sistem' },
                    { date: '2023-11-11T09:00:00.000Z', action: 'İncelemeye Alındı', by: 'Ahmet Yılmaz' }
                ]
            },
            {
                id: 102,
                subject: 'Çıkar Çatışması',
                category: 'Çıkar Çatışması',
                name: 'Ahmet Yılmaz',
                email: 'ahmet@banka.com',
                phone: '555-1234',
                message: 'Satın alma birimindeki X şahsının tedarikçi ile akrabalık ilişkisi var.',
                date: '2023-11-12T14:30:00.000Z',
                status: 'Yeni',
                source: 'Email',
                priority: 'Orta',
                dueDate: null,
                assignedTo: null,
                files: [],
                notes: [],
                communications: [],
                requestedDocs: [],
                history: [
                    { date: '2023-11-12T14:30:00.000Z', action: 'Bildirim Alındı', by: 'Sistem' }
                ]
            },
            {
                id: 103,
                subject: 'Yolsuzluk / Usulsüzlük',
                category: 'Yolsuzluk',
                name: 'Canan K.',
                email: 'canan@mail.com',
                phone: '-',
                message: 'Kasa açığı personelden tahsil edilmeye çalışılıyor.',
                date: '2023-11-05T09:15:00.000Z',
                status: 'Tamamlandı',
                source: 'Web',
                priority: 'Yüksek',
                dueDate: '2023-11-20',
                assignedTo: 'Selin Kaya',
                files: [],
                notes: [
                    { id: 1, date: '2023-11-06T10:00:00.000Z', author: 'Selin Kaya', content: 'Kasa kayıtları incelendi. Tutarsızlık tespit edildi.' },
                    { id: 2, date: '2023-11-15T14:00:00.000Z', author: 'Selin Kaya', content: 'Soruşturma tamamlandı. Rapor hazırlandı.' }
                ],
                communications: [],
                requestedDocs: [],
                history: [
                    { date: '2023-11-05T09:15:00.000Z', action: 'Bildirim Alındı', by: 'Sistem' },
                    { date: '2023-11-06T10:00:00.000Z', action: 'İncelemeye Alındı', by: 'Selin Kaya' },
                    { date: '2023-11-20T16:00:00.000Z', action: 'Tamamlandı', by: 'Selin Kaya' }
                ]
            },
            { id: 104, subject: 'Bilgi Güvenliği İhlali', category: 'Bilgi Güvenliği', name: '-', email: '-', phone: '-', message: 'Müşteri verileri şifresiz USB ile taşınıyor.', date: '2023-11-15T16:00:00.000Z', status: 'Yeni', source: 'Telefon', priority: 'Yüksek', dueDate: null, assignedTo: null, files: [], notes: [], communications: [], requestedDocs: [], history: [{ date: '2023-11-15T16:00:00.000Z', action: 'Bildirim Alındı', by: 'Sistem' }] },
            { id: 105, subject: 'Rüşvet / Haksız Kazanç', category: 'Rüşvet', name: 'İsimsiz', email: '-', phone: '-', message: 'Kredi tahsis sürecinde komisyon talep ediliyor.', date: '2023-10-20T11:00:00.000Z', status: 'Reddedildi', source: 'Web', priority: 'Düşük', dueDate: null, assignedTo: 'Mehmet Öz', files: [], notes: [{ id: 1, date: '2023-10-25T10:00:00.000Z', author: 'Mehmet Öz', content: 'Yeterli kanıt bulunamadı.' }], communications: [], requestedDocs: [], history: [{ date: '2023-10-20T11:00:00.000Z', action: 'Bildirim Alındı', by: 'Sistem' }, { date: '2023-10-25T10:00:00.000Z', action: 'Reddedildi', by: 'Mehmet Öz' }] },
            { id: 106, subject: 'İş Sağlığı ve Güvenliği', category: 'İSG', name: 'Mehmet Demir', email: 'mehmet@banka.com', phone: '555-5678', message: 'Yangın merdivenleri kilitli tutuluyor.', date: '2023-11-25T09:00:00.000Z', status: 'Yeni', source: 'Form', priority: 'Orta', dueDate: null, assignedTo: null, files: [], notes: [], communications: [], requestedDocs: [], history: [{ date: '2023-11-25T09:00:00.000Z', action: 'Bildirim Alındı', by: 'Sistem' }] }
        ],
        logs: [],
        // Advanced Audit Module - Phase 1: Audit Universe
        auditUniverse: [
            { id: 1, name: 'Genel Müdürlük', type: 'Unit', parentId: null, riskScore: 85, lastAuditDate: '2023-01-15' },
            { id: 2, name: 'Şubeler', type: 'Unit', parentId: null, riskScore: 90, lastAuditDate: '2023-05-20' },
            { id: 3, name: 'Bilgi Teknolojileri (IT)', type: 'Unit', parentId: 1, riskScore: 95, lastAuditDate: '2023-11-10' },
            { id: 4, name: 'İnsan Kaynakları', type: 'Unit', parentId: 1, riskScore: 40, lastAuditDate: '2022-08-01' },
            { id: 5, name: 'Kredi Tahsis', type: 'Process', parentId: 1, riskScore: 88, lastAuditDate: '2023-09-15' },
            { id: 6, name: 'Müşteri Kabul', type: 'Process', parentId: 2, riskScore: 75, lastAuditDate: '2023-06-10' },
            { id: 7, name: 'Kadıköy Şubesi', type: 'Branch', parentId: 2, riskScore: 65, lastAuditDate: '2023-11-20' },
            { id: 8, name: 'Beşiktaş Şubesi', type: 'Branch', parentId: 2, riskScore: 70, lastAuditDate: '2022-12-05' }
        ],
        auditPlans: [], // Yıllık Denetim Planları
        // Teftiş Kurulu Personeli
        staff: [
            {
                id: 1,
                name: 'Selim Kaya',
                title: 'Müfettiş',
                employeeId: 'TK-001',
                birthDate: '1985-03-15',
                hireDate: '2010-09-01',
                email: 'selim.kaya@sirket.com',
                phone: '555-1234',
                department: 'Teftiş Kurulu',
                status: 'Aktif',
                annualLeave: 24,
                usedLeave: 8,
                certifications: ['CIA', 'CISA'],
                notes: 'Kıdemli müfettiş, bankacılık denetimleri konusunda uzman.'
            },
            {
                id: 2,
                name: 'Yasin Köktaş',
                title: 'Müfettiş Yardımcısı',
                employeeId: 'TK-002',
                birthDate: '1992-07-22',
                hireDate: '2020-03-15',
                email: 'yasin.koktas@sirket.com',
                phone: '555-5678',
                department: 'Teftiş Kurulu',
                status: 'Aktif',
                annualLeave: 18,
                usedLeave: 5,
                certifications: [],
                notes: 'IT denetimleri alanında gelişiyor.'
            }
        ],
        // Education / Training Data
        trainings: [
            { id: 1, title: 'CIA Sertifikasyon Eğitimi', type: 'Sertifikasyon', provider: 'TİDE', participants: ['Selim Kaya', 'Selin Şahin'], date: '2023-05-15', duration: 40, cost: 25000 },
            { id: 2, title: 'Bilgi Güvenliği Denetimi', type: 'Teknik', provider: 'ISACA', participants: ['Yasin Köktaş', 'Ali Vural'], date: '2023-08-20', duration: 24, cost: 18000 },
            { id: 3, title: 'Duygusal Zeka ve İletişim', type: 'Kişisel Gelişim', provider: 'HR', participants: ['Tüm Ekip'], date: '2023-02-10', duration: 8, cost: 5000 },
            { id: 4, title: 'Tasarruf Finansman Mevzuatı', type: 'Mevzuat', provider: 'BDDK', participants: ['Tüm Ekip'], date: '2023-01-20', duration: 16, cost: 0 },
            { id: 5, title: 'SQL Veri Analizi', type: 'Teknik', provider: 'Udemy', participants: ['Yasin Köktaş'], date: '2023-11-01', duration: 20, cost: 500 }
        ]
    };
}

// State Management - Load saved data first
const initialData = loadFromStorage();
const state = {
    currentPage: 'dashboard',
    currentAuditId: null,
    currentPlanId: null,
    audits: initialData.audits || [],
    findings: initialData.findings || [],
    deletedAudits: initialData.deletedAudits || [],
    deletedFindings: initialData.deletedFindings || [],
    deletedPlans: initialData.deletedPlans || [],
    deletedWorkpapers: initialData.deletedWorkpapers || [],
    ethicsReports: initialData.ethicsReports || [],
    logs: initialData.logs || [],
    auditUniverse: initialData.auditUniverse || [],
    auditPlans: initialData.auditPlans || [],
    staff: initialData.staff || [
        {
            id: 1,
            name: 'Selim Kaya',
            title: 'Müfettiş',
            employeeId: 'TK-001',
            birthDate: '1985-03-15',
            hireDate: '2010-09-01',
            email: 'selim.kaya@sirket.com',
            phone: '555-1234',
            department: 'Teftiş Kurulu',
            status: 'Aktif',
            annualLeave: 24,
            usedLeave: 8,
            certifications: ['CIA', 'CISA'],
            notes: 'Kıdemli müfettiş, bankacılık denetimleri konusunda uzman.'
        },
        {
            id: 2,
            name: 'Yasin Köktaş',
            title: 'Müfettiş Yardımcısı',
            employeeId: 'TK-002',
            birthDate: '1992-07-22',
            hireDate: '2020-03-15',
            email: 'yasin.koktas@sirket.com',
            phone: '555-5678',
            department: 'Teftiş Kurulu',
            status: 'Aktif',
            annualLeave: 18,
            usedLeave: 5,
            certifications: [],
            notes: 'IT denetimleri alanında gelişiyor.'
        }
    ],
    trainings: initialData.trainings || [],
    documents: initialData.documents || [],
    // New Feature: Role Based Access Control (RBAC)
    currentUserRole: 'Müfettiş', // Options: 'Müfettiş', 'Birim', 'Gözden Geçiren', 'Sistem Yöneticisi'
    currentUserDepartment: null // e.g., 'Bilgi Teknolojileri (IT)' - only used when role is 'Birim'
};
// Expose state globally for other scripts (e.g., rejection-modal.js)
window.state = state;

console.log("✅ State initialized with", state.audits.length, "audits and", state.findings.length, "findings from localStorage");

// ... (MockNotificationService remains same)

// ...

function getFindingStatusColor(status) {
    if (status === 'Onaylandı') return '#10b981'; // Green
    if (status === 'Kapalı') return '#059669'; // Dark Green
    if (status === 'Kapalı (Mutabık Değil)') return '#ea580c'; // Dark Orange
    if (status === 'Tebliğ Edildi') return '#3b82f6'; // Blue
    if (status === 'Cevaplandı') return '#8b5cf6'; // Purple
    if (status === 'Mutabık Değil') return '#f97316'; // Orange
    if (status === 'Düzeltme İstendi') return '#ef4444'; // Red
    if (status === 'Gözden Geçirme') return '#f59e0b'; // Amber
    if (status === 'Taslak') return '#6b7280'; // Gray
    if (status === 'Tekrar Tebliğ Onayda') return '#d946ef'; // Pink/Fuchsia
    return '#6b7280';
}

// Mock Notification Service
const MockNotificationService = {
    sendEmail: (to, subject, body) => {
        console.log(`[Mock Mail] To: ${to}, Subject: ${subject}`);
        showToast(`📧 E-posta gönderildi: ${to}`, 'info');
    },
    sendSlack: (channel, message) => {
        console.log(`[Mock Slack] Channel: ${channel}, Message: ${message}`);
        showToast(`💬 Slack bildirimi: ${channel}`, 'info');
    }
};

// Workflow Configuration (State Machine)
// Workflow Configuration (State Machine)
const findingWorkflow = {
    'Taslak': {
        transitions: [
            { to: 'Gözden Geçirme', label: 'Onaya Gönder', role: 'Müfettiş', icon: 'send', style: 'primary', notify: ['supervisor'] }
        ]
    },
    'Gözden Geçirme': {
        transitions: [
            { to: 'Onaylandı', label: 'Onayla', role: 'Gözden Geçiren', icon: 'check-circle', style: 'success', notify: ['inspector'] },
            { to: 'Düzeltme İstendi', label: 'Düzeltme İste (Red)', role: 'Gözden Geçiren', icon: 'x-circle', style: 'danger', requireNote: true, notify: ['inspector'] }
        ]
    },
    'Düzeltme İstendi': {
        transitions: [
            { to: 'Gözden Geçirme', label: 'Tekrar Onaya Gönder', role: 'Müfettiş', icon: 'rotate-cw', style: 'warning', notify: ['supervisor'] }
        ]
    },
    'Onaylandı': {
        transitions: [
            { to: 'Tebliğ Edildi', label: 'Tebliğ Et', role: 'Müfettiş', icon: 'mail', style: 'info', notify: ['unit'] }
        ]
    },
    'Tebliğ Edildi': {
        transitions: [
            { to: 'Cevaplandı', label: 'Cevaplandı (Manuel)', role: 'Müfettiş', icon: 'message-square', style: 'secondary' }
        ]
    },
    'Cevaplandı': {
        transitions: [
            { to: 'Kapalı', label: 'Bulguyu Kapat', role: 'Müfettiş', icon: 'check', style: 'success' }
        ]
    },
    'Mutabık Değil': {
        transitions: [
            { to: 'Kapalı (Mutabık Değil)', label: 'Son Görüşle Kapat', role: 'Müfettiş', icon: 'file-text', style: 'warning', requireNote: true }
        ]
    },
    'Kapalı': { transitions: [] },
    'Kapalı (Mutabık Değil)': { transitions: [] },
    'Takipte': { transitions: [] },
    'Açık': { transitions: [] }, // Legacy support
    'İnceleniyor': { transitions: [] }, // Legacy support
    'Tekrar Tebliğ Onayda': {
        transitions: [
            { to: 'Onaylandı', label: 'Tekrar Tebliği Onayla', role: 'Gözden Geçiren', icon: 'check-circle', style: 'success', notify: ['inspector'] },
            { to: 'Cevaplandı', label: 'Tekrar Tebliği Reddet', role: 'Gözden Geçiren', icon: 'x-circle', style: 'danger', requireNote: true, notify: ['inspector'] }
        ]
    }
};
// Expose workflow globally
window.findingWorkflow = findingWorkflow;

// ============================================
// CRITICAL: FORM SUBMISSION HANDLERS
// These were MISSING and caused data loss!
// ============================================

// Handle Create/Update Audit Form
window.handleCreateAudit = function (event) {
    event.preventDefault();
    console.log("📝 handleCreateAudit called");

    const form = event.target;
    const formData = new FormData(form);

    const auditId = formData.get('id');
    const isEdit = auditId && auditId.trim() !== '';

    const auditData = {
        id: isEdit ? auditId : Date.now().toString(),
        auditCode: formData.get('auditCode'),
        title: formData.get('title'),
        type: formData.get('type'),
        status: formData.get('status'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        team: formData.get('team'),
        supervisor: formData.get('supervisor') || '',
        progress: 0,
        createdAt: new Date().toISOString()
    };

    console.log("Audit data:", auditData);

    // Ensure state.audits is initialized
    if (!state.audits) state.audits = [];

    if (isEdit) {
        // Update existing audit
        const index = state.audits.findIndex(a => String(a.id) === String(auditId));
        if (index !== -1) {
            const oldAudit = state.audits[index];
            state.audits[index] = { ...oldAudit, ...auditData };
            addLog('Denetim Güncellendi', `"${auditData.title}" denetimi güncellendi.`, 'Audit', auditData.id);
            showToast('Denetim başarıyla güncellendi!', 'success');
        } else {
            showToast('Güncellenecek denetim bulunamadı!', 'error');
            return;
        }
    } else {
        // Create new audit
        state.audits.push(auditData);
        addLog('Yeni Denetim', `"${auditData.title}" denetimi oluşturuldu.`, 'Audit', auditData.id);
        showToast('Denetim başarıyla oluşturuldu!', 'success');
    }

    saveToStorage();
    closeModal('audit-modal');
    renderAudits();
    console.log("✅ Audit saved successfully. Total audits:", state.audits.length);
};

// Handle Create/Update Finding Form
window.handleCreateFinding = function (event) {
    event.preventDefault();
    console.log("📝 handleCreateFinding called");

    const form = event.target;
    const formData = new FormData(form);

    const findingId = formData.get('id');
    const isEdit = findingId && findingId.trim() !== '';

    const findingData = {
        id: isEdit ? findingId : Date.now().toString(),
        auditId: formData.get('auditId'),
        findingCode: formData.get('findingCode'),
        title: formData.get('title'),
        risk: formData.get('risk'),
        criterion: formData.get('criterion') || '',
        content: formData.get('content'),
        inspectorRecommendation: formData.get('inspectorRecommendation') || '',
        dueDate: formData.get('dueDate') || '',
        status: isEdit ? undefined : 'Taslak', // Keep existing status on edit
        createdAt: new Date().toISOString(),
        processLog: []
    };

    console.log("Finding data:", findingData);

    // Ensure state.findings is initialized
    if (!state.findings) state.findings = [];

    if (isEdit) {
        // Update existing finding
        const index = state.findings.findIndex(f => String(f.id) === String(findingId));
        if (index !== -1) {
            const oldFinding = state.findings[index];
            // Preserve status and other existing fields
            state.findings[index] = {
                ...oldFinding,
                ...findingData,
                status: oldFinding.status, // Keep existing status
                processLog: oldFinding.processLog || []
            };
            addLog('Bulgu Güncellendi', `"${findingData.title}" bulgusu güncellendi.`, 'Finding', findingData.id);
            showToast('Bulgu başarıyla güncellendi!', 'success');
        } else {
            showToast('Güncellenecek bulgu bulunamadı!', 'error');
            return;
        }
    } else {
        // Create new finding
        findingData.status = 'Taslak';
        findingData.processLog = [{
            action: 'Bulgu Oluşturuldu',
            user: state.currentUser || 'Sistem',
            timestamp: new Date().toISOString()
        }];
        state.findings.push(findingData);
        addLog('Yeni Bulgu', `"${findingData.title}" bulgusu oluşturuldu.`, 'Finding', findingData.id);
        showToast('Bulgu başarıyla oluşturuldu!', 'success');
    }

    saveToStorage();
    closeModal('finding-modal');

    // Refresh the appropriate view
    if (state.currentPage === 'audits' && state.currentAuditId) {
        renderAuditDetail();
    } else {
        renderFindings();
    }
    console.log("✅ Finding saved successfully. Total findings:", state.findings.length);
};


// Global Helper for Status Change
window.changeFindingStatus = function (findingId, newStatus) {
    console.log(`[DEBUG] changeFindingStatus called. ID: ${findingId}, NewStatus: ${newStatus}`);
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        console.error('[DEBUG] Finding not found!');
        return;
    }

    // Validation for Rejected Findings
    if (finding.status === 'Düzeltme İstendi' && newStatus !== 'Düzeltme İstendi') {
        if (!finding.modifiedAfterRejection) {
            showToast('Reddedilen bulguda değişiklik yapmadan onaya gönderemezsiniz!', 'error');
            return;
        }
    }

    const oldStatus = finding.status;
    console.log(`[DEBUG] Current Status: ${oldStatus}`);

    // Safety check for findingWorkflow
    if (!window.findingWorkflow) {
        console.error('[DEBUG] window.findingWorkflow is undefined!');
        return;
    }

    const transition = findingWorkflow[oldStatus]?.transitions.find(t => t.to === newStatus);
    console.log('[DEBUG] Transition found:', transition);

    // Check if Note is required (e.g. Rejection)
    if (transition && transition.requireNote) {
        console.log('[DEBUG] Note required. Opening modal...');

        // Special handling for Mutabık Değil -> Kapalı (Mutabık Değil) transition
        if (newStatus === 'Kapalı (Mutabık Değil)') {
            openFinalOpinionModal(findingId);
        } else if (typeof openRejectionModal === 'function') {
            openRejectionModal(findingId);
        } else {
            console.error('[DEBUG] openRejectionModal function is missing!');
        }
    } else {
        console.log('[DEBUG] Performing direct status change...');
        performStatusChange(finding, oldStatus, newStatus, transition);
    }
};

function performStatusChange(finding, oldStatus, newStatus, transition, note = null) {
    finding.status = newStatus;

    // Add to process log
    addFindingProcessLog(finding.id, newStatus, state.currentUserRole, note);

    // Log the change
    const changes = { old: { status: oldStatus }, new: { status: newStatus } };
    let logMessage = `Durum "${oldStatus}" -> "${newStatus}" olarak güncellendi.`;

    if (note) {
        logMessage += ` (Red Sebebi Belirtildi)`; // Keep purely string for main details
        finding.rejectionNote = note; // Store note explicitly on finding
        changes.new.rejectionNote = note; // Add to changes for detailed log view
    } else {
        // Clear rejection note if moving out of rejection state (optional, but good practice)
        if (newStatus !== 'Düzeltme İstendi') finding.rejectionNote = null;

        // Validation Logic: Reset flag if rejected again or move out
        if (newStatus === 'Düzeltme İstendi') {
            finding.modifiedAfterRejection = false;
        }
    }

    addLog('İş Akışı', logMessage, 'Finding', finding.id, state.currentUserRole, changes);

    // Notifications
    if (transition && transition.notify) {
        transition.notify.forEach(recipient => {
            if (recipient === 'unit') MockNotificationService.sendEmail('birim@banka.internal', `Bulgu Tebliğ Edildi`, `"${finding.title}" konu başlıklı bulgu biriminize tebliğ edilmiştir.`);
            if (recipient === 'supervisor') MockNotificationService.sendEmail('gozden.geciren@banka.internal', 'Onay Bekleyen Bulgu', `"${finding.title}" onayınıza sunuldu.`);
            if (recipient === 'inspector') {
                const msg = note ? `Düzeltme İsteği: ${note}` : `Bulgu Onaylandı`;
                MockNotificationService.sendSlack('#mufettis-ozel', `"${finding.title}" durumu güncellendi: ${msg}`);
            }
        });
    }

    saveToStorage();
    showToast(`Durum güncellendi: ${newStatus}`, 'success');

    // Refresh View
    if (typeof viewFinding === 'function') viewFinding(finding.id);
}

// Process Log System for Findings
function addFindingProcessLog(findingId, action, user, note = null) {
    const finding = state.findings.find(f => f.id === findingId);
    if (!finding) return;

    // Initialize processLog if it doesn't exist
    if (!finding.processLog) {
        finding.processLog = [];
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        user: user,
        action: action,
        note: note
    };

    finding.processLog.push(logEntry);
}

// Check if finding can be notified (tebliğ edilebilir mi?)
function canNotifyFinding(findingId) {
    const finding = state.findings.find(f => f.id === findingId);
    if (!finding) return false;

    // Sadece "Onaylandı" durumundaki bulgular tebliğ edilebilir
    return finding.status === 'Onaylandı';
}

// Open Rejection Modal with validation
window.openRejectionModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        showToast('Bulgu bulunamadı', 'error');
        return;
    }

    // Check if modal HTML exists in DOM, if not create it
    if (!document.getElementById('rejection-modal')) {
        const modalHtml = `
        <div class="modal-overlay" id="rejection-modal">
            <div class="modal" style="max-width: 550px;">
                <div class="modal-header" style="border-bottom: 2px solid #fee2e2;">
                    <h3 class="modal-title" style="color: #991b1b; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="alert-circle" style="width: 20px;"></i> Düzeltme İsteği / Red
                    </h3>
                    <button class="close-modal" onclick="closeModal('rejection-modal')"><i data-lucide="x"></i></button>
                </div>
                <form onsubmit="handleRejectionSubmit(event)">
                    <input type="hidden" name="findingId" id="rejection-finding-id">
                    <div class="modal-body" style="padding: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label" style="color: #7f1d1d;">Ret Sebebi / Düzeltme İsteği <span style="color: #ef4444;">*</span></label>
                            <textarea name="rejectionNote" id="rejection-note-input" class="form-input" rows="5" 
                                placeholder="Örn: Bulgu açıklaması yetersiz, daha fazla detay ve kanıt gerekiyor..." 
                                style="border-color: #fca5a5; min-height: 120px;" required></textarea>
                            <span style="font-size: 0.75rem; color: #991b1b; margin-top: 0.5rem; display: block;">
                                * Bu açıklama müfettişe iletilecektir.
                            </span>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('rejection-modal')">İptal</button>
                            <button type="submit" class="btn btn-danger" style="background: #ef4444; color: white;">Düzeltme İste</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        lucide.createIcons();
    }

    // Set Finding ID
    const modalFindingIdInput = document.getElementById('rejection-finding-id');
    if (modalFindingIdInput) modalFindingIdInput.value = findingId;

    // Clear previous input
    const noteInput = document.getElementById('rejection-note-input');
    if (noteInput) noteInput.value = '';

    // Force open modal - Bypass openModal helper to ensure visibility
    const modal = document.getElementById('rejection-modal');
    if (modal) {
        modal.classList.add('open');
        modal.style.display = 'flex'; // Ensure display property matches CSS
        console.log("Rejection modal forced open for ID:", findingId);
    }
};

// Submit rejection with validation
window.handleRejectionSubmit = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const findingId = formData.get('findingId');
    const note = formData.get('rejectionNote');

    if (!note || note.trim().length < 5) {
        showToast('Lütfen geçerli bir açıklama giriniz (en az 5 karakter).', 'error');
        return;
    }

    // Perform the status change
    const finding = state.findings.find(f => f.id == findingId);
    if (finding) {
        const transition = findingWorkflow[finding.status]?.transitions.find(t => t.to === 'Düzeltme İstendi');
        performStatusChange(finding, finding.status, 'Düzeltme İstendi', transition, note);
        closeModal('rejection-modal');
    }
};

// Role Switcher
window.switchRole = function (role, department = null) {
    state.currentUserRole = role;

    // If Birim role, need to set department
    if (role === 'Birim' && !department) {
        // Show department selector modal
        const departments = [
            'Bilgi Teknolojileri (IT)',
            'İnsan Kaynakları',
            'Finans',
            'Operasyon',
            'Pazarlama',
            'Satış',
            'Hukuk',
            'İç Kontrol'
        ];

        showConfirmDialog(
            'Birim Seçin',
            `<div class="form-group">
                <label class="form-label">Hangi birim olarak giriş yapıyorsunuz?</label>
                <select id="department-select" class="form-select" style="width:100%">
                    ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>`,
            () => {
                const selectedDept = document.getElementById('department-select').value;
                state.currentUserDepartment = selectedDept;
                showToast(`Rol: Birim (${selectedDept})`, 'info');
                updateRoleDisplay();
                renderConciliation(); // Refresh with filtered view
            },
            'Devam Et',
            'var(--primary)'
        );
        return;
    }

    if (role !== 'Birim') {
        state.currentUserDepartment = null;
    } else if (department) {
        state.currentUserDepartment = department;
    }

    showToast(`Rol değiştirildi: ${role}${state.currentUserDepartment ? ' (' + state.currentUserDepartment + ')' : ''}`, 'info');

    // Update header dropdown
    updateRoleDisplay();

    // Refresh dashboard or current view
    if (document.querySelector('.card h2')) { // If in detail view
        // Try to find current ID or just back to list if complicated
        const findingTitle = document.querySelector('.card h2').textContent;
        const finding = state.findings.find(f => f.title === findingTitle);
        if (finding) viewFinding(finding.id);
    }
    renderDashboard(); // Update dashboard widgets if role dependent (maybe not needed but safe)
}

function updateRoleDisplay() {
    // Update header dropdown
    const roleDropdown = document.getElementById('role-switcher');
    if (roleDropdown) {
        roleDropdown.value = state.currentUserRole;
    }
}

// Mock LDAP Users
const ldapUsers = [
    { id: 'u1', name: 'Ahmet Yılmaz', title: 'Baş Müfettiş', avatar: 'https://ui-avatars.com/api/?name=Ahmet+Yilmaz&background=0D8ABC&color=fff' },
    { id: 'u2', name: 'Ayşe Demir', title: 'Kıdemli Müfettiş', avatar: 'https://ui-avatars.com/api/?name=Ayse+Demir&background=db2777&color=fff' },
    { id: 'u3', name: 'Mehmet Öz', title: 'Müfettiş Yardımcısı', avatar: 'https://ui-avatars.com/api/?name=Mehmet+Oz&background=ea580c&color=fff' },
    { id: 'u4', name: 'Zeynep Kaya', title: 'Şube Müdürü', avatar: 'https://ui-avatars.com/api/?name=Zeynep+Kaya&background=65a30d&color=fff' },
    { id: 'u5', name: 'Caner Erkin', title: 'Süreç Yöneticisi', avatar: 'https://ui-avatars.com/api/?name=Caner+Erkin&background=7c3aed&color=fff' },
    { id: 'u6', name: 'Selin Şahin', title: 'İç Kontrolör', avatar: 'https://ui-avatars.com/api/?name=Selin+Sahin&background=0891b2&color=fff' }
];

// Data Refresh
async function refreshData() {
    try {
        const [audits, findings, logs] = await Promise.all([
            AuditAPI.getAudits(),
            AuditAPI.getFindings(),
            AuditAPI.getLogs()
        ]);
        state.audits = audits;
        state.findings = findings;
        state.logs = logs;
        renderPage(state.currentPage);
    } catch (e) {
        console.error("Failed to load data", e);
        showToast("Veri yüklenemedi!", "error");
    }
}

// DOM Elements
const mainView = document.getElementById('main-view');
const pageTitle = document.getElementById('page-title');
const navLinks = document.querySelectorAll('.nav-link');

// ...

function renderPage(page) {
    try {
        if (!mainView) {
            console.error("Critical Error: 'main-view' element not found in DOM.");
            return;
        }
        mainView.innerHTML = '';

        switch (page) {
            case 'dashboard':
                if (pageTitle) pageTitle.textContent = 'Genel Bakış';
                renderDashboard();
                break;
            case 'audits':
                if (pageTitle) pageTitle.textContent = 'Denetim Listesi';
                renderAudits();
                break;
            case 'audit-detail':
                const audit = state.audits.find(a => a.id === state.currentAuditId);
                if (pageTitle) pageTitle.textContent = audit ? audit.title : 'Denetim Detayı';
                renderAuditDetail();
                break;
            case 'findings':
                if (pageTitle) pageTitle.textContent = 'Bulgular';
                renderFindings();
                break;
            case 'reports':
                if (pageTitle) pageTitle.textContent = 'Raporlar & Analiz';
                renderReports();
                break;
            case 'ethics-submit':
                if (pageTitle) pageTitle.textContent = 'Etik Bildirim';
                renderEthicsSubmit();
                break;
            case 'ethics-view':
                if (pageTitle) pageTitle.textContent = 'Gelen Bildirimler';
                renderEthicsView();
                break;
            // ethics-analytics added?
            case 'trash':
                if (pageTitle) pageTitle.textContent = 'Silinen Kayıtlar (Çöp Kutusu)';
                renderTrash();
                break;
            case 'logs': // Audit logs
                if (pageTitle) pageTitle.textContent = 'Süreç Geçmişi';
                renderLogs();
                break;
            // Conciliation View
            case 'conciliation':
                if (pageTitle) pageTitle.textContent = 'Bulgu Tebliğ ve Mutabakat';
                renderConciliation();
                break;
            case 'staff':
                if (pageTitle) pageTitle.textContent = 'Teftiş Kurulu Personeli';
                renderStaff();
                break;
            case 'education':
                if (pageTitle) pageTitle.textContent = 'Eğitim Faaliyetleri';
                renderEducation();
                break;
            case 'activity-report':
                if (pageTitle) pageTitle.textContent = 'Faaliyet Raporu';
                renderActivityReportDashboard();
                break;
            case 'settings':
                if (pageTitle) pageTitle.textContent = 'Ayarlar';
                renderSettings();
                break;
            case 'sanction-scanner':
                if (pageTitle) pageTitle.textContent = 'Yaptırım Tarama';
                renderSanctionScanner();
                break;
            case 'follow-up-findings':
                if (pageTitle) pageTitle.textContent = 'Takip Edilecek Bulgular';
                renderFollowUpFindings();
                break;
            default:
                mainView.innerHTML = '<p>Sayfa bulunamadı.</p>';
        }

        lucide.createIcons();

        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    } catch (error) {
        console.error("renderPage Error:", error);
        mainView.innerHTML = `<div class="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
            <h3 class="font-bold">Bir hata oluştu</h3>
            <pre class="text-xs mt-2 overflow-auto">${error.message}</pre>
        </div>`;
    }
}

// Toast Notification System
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: white;
        border-radius: 0.5rem;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 300px;
        border-left: 4px solid;
        animation: slideIn 0.3s ease-out;
        margin-bottom: 0.75rem;
        border-left-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    const iconColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';

    toast.innerHTML = `
        <span style="font-size: 1.25rem; color: ${iconColor};">${icon}</span>
        <span style="flex: 1; font-size: 0.9rem; color: #374151;">${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Audit Trail Logging
// Enhanced Audit Trail Logging
function addLog(action, details, targetType, targetId, user = 'Admin User', changeData = null) {
    const log = {
        id: Date.now(),
        date: new Date().toISOString(),
        user,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details),
        targetType, // 'Audit', 'Finding', 'System'
        targetId,
        changeData, // { before: {...}, after: {...} }
        metadata: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`
        }
    };
    state.logs.unshift(log); // Add to beginning
    // Limit log size to prevent LS overflow
    if (state.logs.length > 1000) state.logs.pop();

    // Save to storage (Debounced)
    saveToStorageDebounced();

    // Automatically refresh log view if active
    if (state.currentPage === 'logs') {
        renderLogs();
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

const saveToStorageDebounced = debounce(() => {
    saveToStorage();
}, 1000);

function getLogIcon(action) {
    if (action.includes('Oluştur')) return 'plus-circle';
    if (action.includes('Sil')) return 'trash-2';
    if (action.includes('Güncel')) return 'edit-3';
    if (action.includes('Giriş')) return 'log-in';
    return 'activity';
}

function formatLogDiff(before, after) {
    if (!before || !after) return '';

    let html = '<div class="diff-container" style="display: grid; gap: 0.5rem;">';

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    allKeys.forEach(key => {
        const val1 = before[key];
        const val2 = after[key];

        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            // Exclude internal fields
            if (['id', 'lastUpdated', 'lastUpdatedBy'].includes(key)) return;

            html += `
                <div class="diff-item" style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 1rem; padding: 0.5rem; background: #f8fafc; border-radius: 0.25rem; font-size: 0.85rem;">
                    <div style="font-weight: 600; color: #64748b;">${key}</div>
                    <div style="color: #ef4444; background: #fef2f2; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                        <span style="font-size: 0.7rem; display: block; opacity: 0.7;">ESKİ</span>
                        ${val1 !== undefined ? val1 : '<em style="color:#aaa">Yok</em>'}
                    </div>
                    <div style="color: #22c55e; background: #f0fdf4; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                        <span style="font-size: 0.7rem; display: block; opacity: 0.7;">YENİ</span>
                        ${val2 !== undefined ? val2 : '<em style="color:#aaa">Yok</em>'}
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
}

window.viewLogDetails = function (id) {
    const log = state.logs.find(l => l.id === id);
    if (!log) return;

    // Remove existing modal
    const existingModal = document.getElementById('log-modal');
    if (existingModal) existingModal.remove();

    const diffHtml = log.changeData ? formatLogDiff(log.changeData.before, log.changeData.after) : '';

    const modalHtml = `
        <div id="log-modal" class="modal-overlay" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 10000;
        ">
            <div class="modal" style="
                background: white; border-radius: 1rem; width: 100%; max-width: 700px;
                max-height: 90vh; overflow-y: auto; padding: 2rem;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="
                            width: 48px; height: 48px; background: #f3f4f6; 
                            border-radius: 12px; display: flex; align-items: center; 
                            justify-content: center; color: #4b5563;
                        ">
                            <i data-lucide="${getLogIcon(log.action)}" style="width: 24px; height: 24px;"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0;">${log.action}</h3>
                            <div style="color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem;">${log.details}</div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('log-modal').remove()" style="background: none; border: none; cursor: pointer;">
                        <i data-lucide="x" style="color: #9ca3af;"></i>
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <span style="display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">KULLANICI</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 24px; height: 24px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
                                ${log.user.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-weight: 500; color: #374151;">${log.user}</span>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <span style="display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">ZAMAN</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #374151;">
                            <i data-lucide="calendar" style="width: 16px;"></i>
                            <span style="font-weight: 500;">${new Date(log.date).toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>

                ${diffHtml ? `
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">Yapılan Değişiklikler</h4>
                        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem;">
                            ${diffHtml}
                        </div>
                    </div>
                ` : ''}

                ${log.metadata ? `
                    <div>
                        <h4 style="font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 1rem;">Teknik Detaylar</h4>
                        <div style="background: #1e293b; color: #94a3b8; padding: 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.8rem;">
                            ${JSON.stringify(log.metadata, null, 2)}
                        </div>
                    </div>
                `: ''}

                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="document.getElementById('log-modal').remove()">Kapat</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
    `;
    document.body.appendChild(container);

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    return container;
}

// Confirmation Modal System
function showConfirmDialog(title, message, onConfirm, confirmText = 'Sil', confirmColor = '#ef4444', hideCancel = false) {
    // Remove existing confirm modal if any
    const existingModal = document.getElementById('confirm-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
        <div id="confirm-modal" class="modal-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease-out;
        ">
            <div class="modal" style="
                background: white;
                border-radius: 1rem;
                width: 100%;
                max-width: 550px;
                max-height: 85vh;
                padding: 0;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
                animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow-y: auto;
            ">
                <div style="text-align: center; padding: 2rem 1.5rem;">
                    <div style="
                        width: 64px;
                        height: 64px;
                        background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1.25rem;
                        color: #ef4444;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
                    ">
                        <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
                    </div>
                    <h3 style="
                        font-size: 1.35rem;
                        font-weight: 600;
                        margin-bottom: 0.75rem;
                        color: #111827;
                    ">${title}</h3>
                    <p style="
                        font-size: 0.95rem;
                        color: #6b7280;
                        line-height: 1.6;
                        margin-bottom: 2rem;
                        text-align: left;
                    ">${message}</p>
                    <div style="
                        display: flex;
                        gap: 0.75rem;
                        justify-content: center;
                    ">
                        ${!hideCancel ? `<button class="btn" onclick="closeConfirmDialog()" style="
                            background: #f3f4f6;
                            color: #374151;
                            min-width: 90px;
                            padding: 0.65rem 1.25rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            border: 1px solid #d1d5db;
                        ">İptal</button>` : ''}
                        <button class="btn" onclick="confirmDialogAction()" style="
                            background: ${confirmColor};
                            color: white;
                            min-width: 110px;
                            padding: 0.65rem 1.25rem;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 8px ${confirmColor}33;
                        ">${confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add animations if not already present
    if (!document.getElementById('confirm-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'confirm-modal-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add open class to trigger visibility
    const modalElement = document.getElementById('confirm-modal');
    // Use setTimeout to ensure the transition triggers if relying on CSS transitions, 
    // but mainly to ensure the class is applied after insertion.
    requestAnimationFrame(() => {
        if (modalElement) {
            modalElement.classList.add('open');
        }
    });

    // Store the callback
    window.confirmDialogCallback = onConfirm;

    // Initialize lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    console.log("✅ Confirmation modal displayed");
}

// Make sure these are globally accessible
window.showConfirmDialog = showConfirmDialog;


window.closeConfirmDialog = function () {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease-out forwards';
        setTimeout(() => modal.remove(), 200);
    }
    window.confirmDialogCallback = null;
}

window.confirmDialogAction = function () {
    if (window.confirmDialogCallback) {
        window.confirmDialogCallback();
    }
    closeConfirmDialog(); // Modal otomatik kapansın
}

// Logout Function
window.logout = function () {
    showConfirmDialog(
        'Çıkış Yap',
        'Oturumunuzu sonlandırmak istediğinize emin misiniz?',
        () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        },
        'Çıkış Yap',
        '#ef4444'
    );
};

// Router/Navigation Logic
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NAVIGATE') {
        console.log('External navigation request:', event.data.page);
        navigateTo(event.data.page);
    }
});

window.navigateTo = function (page) {
    console.log("🧭 navigateTo called:", page);
    state.currentPage = page;

    // Get nav links dynamically (not from undefined variable)
    const navLinks = document.querySelectorAll('.nav-link[data-page]');

    // Update active state in sidebar
    navLinks.forEach(link => {
        const pageLink = link.dataset.page;
        if (pageLink === page) {

            // Cross-App navigation
            if (page === 'sanction-scanner') {
                window.parent.location.href = '/sanction';
                return;
            }

            link.classList.add('active');
            // If it's a submenu item, ensure parent is open
            const parent = link.closest('.nav-submenu');
            if (parent) {
                parent.style.display = 'block';
                // Rotate chevron of parent
                const parentLink = parent.previousElementSibling;
                if (parentLink) {
                    const chevron = parentLink.querySelector('[data-lucide="chevron-down"]');
                    if (chevron) chevron.style.transform = 'rotate(180deg)';
                }
            }
        } else {
            link.classList.remove('active');
        }
    });

    renderPage(page);

    // Mobile sidebar close
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }

    console.log("✅ navigateTo completed:", page);
}
console.log("✅ window.navigateTo tanımlandı");

window.toggleSubmenu = function (id) {
    const submenu = document.getElementById(id);
    const link = submenu.previousElementSibling;
    const chevron = link.querySelector('[data-lucide="chevron-down"]');

    if (submenu.style.display === 'none') {
        submenu.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    } else {
        submenu.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    }
}



function renderPage(page) {
    mainView.innerHTML = '';

    // Inject Role Switcher if not exists
    setTimeout(() => {
        const headerRight = document.querySelector('header > div:last-child');
        if (headerRight && !document.getElementById('role-switcher')) {
            const switcher = document.createElement('div');
            switcher.id = 'role-switcher';
            switcher.style.marginRight = '1rem';
            switcher.innerHTML = `
               <select onchange="switchRole(this.value)" style="padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border); font-size: 0.8rem; background: #fff;">
                   <option value="Müfettiş">Müfettiş Modu</option>
                   <option value="Gözden Geçiren">Gözden Geçiren Modu</option>
               </select>
           `;
            headerRight.insertBefore(switcher, headerRight.firstChild);
        }
    }, 500);


    switch (page) {
        case 'dashboard':
            if (pageTitle) pageTitle.textContent = 'Genel Bakış';
            renderDashboard();
            break;
        case 'audits':
            if (pageTitle) pageTitle.textContent = 'Denetim Listesi';
            renderAudits();
            break;
        case 'audit-detail':
            const audit = state.audits.find(a => a.id === state.currentAuditId);
            if (pageTitle) pageTitle.textContent = audit ? audit.title : 'Denetim Detayı';
            renderAuditDetail();
            break;
        case 'findings':
            if (pageTitle) pageTitle.textContent = 'Bulgular';
            renderFindings();
            break;
        case 'reports':
            if (pageTitle) pageTitle.textContent = 'Raporlar';
            renderReports();
            break;
        case 'ethics-submit':
            if (pageTitle) pageTitle.textContent = 'Bildirim Ver';
            renderEthicsSubmit();
            break;
        case 'ethics-view':
            if (pageTitle) pageTitle.textContent = 'Bildirimleri Görüntüle';
            renderEthicsView();
            break;
        case 'ethics-reports':
            if (pageTitle) pageTitle.textContent = 'Etik Raporları';
            renderEthicsReports();
            break;
        case 'trash':
            if (pageTitle) pageTitle.textContent = 'Silinenler';
            renderTrash();
            break;
        case 'conciliation':
            if (pageTitle) pageTitle.textContent = 'Tebliğ ve Mutabakat';
            renderConciliation();
            break;
        case 'settings':
            if (pageTitle) pageTitle.textContent = 'Ayarlar';
            renderSettings();
            break;
        case 'sanction-scanner':
            if (pageTitle) pageTitle.textContent = 'Yaptırım Tarama';
            renderSanctionScanner();
            break;
        case 'audit-plan':
            if (pageTitle) pageTitle.textContent = 'Yıllık Denetim Planı';
            renderAuditPlan();
            break;
        case 'audit-plan-detail':
            const plan = state.auditPlans.find(p => p.id === state.currentPlanId);
            if (pageTitle) pageTitle.textContent = plan ? plan.title : 'Plan Detayı';
            renderAuditPlanDetail();
            break;
        case 'audit-universe':
            if (pageTitle) pageTitle.textContent = 'Denetim Evreni';
            renderAuditUniverse();
            break;
        case 'audit-logs': // Corrected case name to match usage if needed, or keep 'logs'
            // Wait, previous code had 'logs' case 533. 
            // In the snippet I see 'audit-logs' at 1101.
            // I should stick to 'logs' if that's what navigateTo sends.
            // The navigation ID in 'logs' case (Step 105 view) was 'logs'.
            // Let's check consistency. Line 533 said 'logs'.
            // Here it says 'audit-logs'.
            // I will use 'logs' to be safe or add both.
            if (pageTitle) pageTitle.textContent = 'Süreç Geçmişi';
            renderAuditLogs();
            break;
        case 'logs':
            if (pageTitle) pageTitle.textContent = 'Süreç Geçmişi';
            renderAuditLogs();
            break;
        case 'follow-up-findings':
            if (pageTitle) pageTitle.textContent = 'Takip Edilecek Bulgular';
            renderFollowUpFindings();
            break;
        case 'activity-report':
            if (pageTitle) pageTitle.textContent = 'Faaliyet Raporu';
            renderActivityReportDashboard();
            break;

        case 'staff':
            if (pageTitle) pageTitle.textContent = 'Teftiş Kurulu Personeli';
            renderStaff();
            break;
        case 'education':
            if (pageTitle) pageTitle.textContent = 'Eğitim Faaliyetleri';
            renderEducation();
            break;
        case 'documents-audit':
            if (pageTitle) pageTitle.textContent = 'Teftiş Kurulu Dokümanları';
            renderDocuments('audit');
            break;
        case 'documents-other':
            if (pageTitle) pageTitle.textContent = 'Diğer Birim Dokümanları';
            renderDocuments('other');
            break;
        case 'documents-legislation':
            if (pageTitle) pageTitle.textContent = 'Mevzuat';
            renderDocuments('legislation');
            break;
        default:
            mainView.innerHTML = '<p>Sayfa bulunamadı.</p>';
    }

    lucide.createIcons();

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('active');
    }
}

window.viewEthicsReport = function (id) {
    const report = state.ethicsReports.find(r => r.id === id);
    if (!report) return;

    // Remove existing modal if any
    const existingModal = document.getElementById('ethics-modal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div id="ethics-modal" class="modal-overlay" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 10000;
            opacity: 0; visibility: hidden; transition: all 0.3s ease;
        ">
            <div class="modal" style="
                background: white; border-radius: 1rem; width: 100%; max-width: 600px;
                max-height: 90vh; overflow-y: auto; padding: 2rem;
                transform: scale(0.95); transition: transform 0.3s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--primary); margin-bottom: 0.25rem;">${report.subject}</h3>
                        <span style="font-size: 0.85rem; color: var(--text-light);">${new Date(report.date).toLocaleString('tr-TR')}</span>
                    </div>
                    <button onclick="document.getElementById('ethics-modal').classList.remove('open'); setTimeout(() => document.getElementById('ethics-modal').remove(), 300);" style="background: none; border: none; cursor: pointer; color: var(--text-light);">
                        <i data-lucide="x" style="width: 24px; height: 24px;"></i>
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">
                    <div>
                        <span style="display: block; font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">Bildiren</span>
                        <span style="font-weight: 500;">${report.name}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">E-posta</span>
                        <span style="font-weight: 500;">${report.email}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">Kaynak</span>
                        <span class="badge ${report.source === 'Email' ? 'badge-blue' : 'badge-gray'}">${report.source}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">Durum</span>
                        <select onchange="updateEthicsStatus(${report.id}, this.value)" class="form-select" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;">
                            <option value="Yeni" ${report.status === 'Yeni' ? 'selected' : ''}>Yeni</option>
                            <option value="İnceleniyor" ${report.status === 'İnceleniyor' ? 'selected' : ''}>İnceleniyor</option>
                            <option value="Tamamlandı" ${report.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                            <option value="Reddedildi" ${report.status === 'Reddedildi' ? 'selected' : ''}>Reddedildi</option>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Bildirim Detayı</label>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); white-space: pre-wrap;">${report.message}</div>
                </div>

                ${report.files && report.files.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Kanıt / Belgeler</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${report.files.map(file => `
                                <div style="display: flex; align-items: center; gap: 0.5rem; background: #eff6ff; padding: 0.5rem 0.75rem; border-radius: 0.25rem; border: 1px solid #dbeafe; color: #1e40af; font-size: 0.85rem;">
                                    <i data-lucide="file" style="width: 14px;"></i> ${file}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                    <button class="btn btn-secondary" onclick="document.getElementById('ethics-modal').classList.remove('open'); setTimeout(() => document.getElementById('ethics-modal').remove(), 300);">Kapat</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();

    // Trigger animation
    requestAnimationFrame(() => {
        const modal = document.getElementById('ethics-modal');
        if (modal) {
            modal.classList.add('open');
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }
    });
}

window.updateEthicsStatus = function (id, newStatus) {
    const report = state.ethicsReports.find(r => r.id === id);
    if (report) {
        report.status = newStatus;
        saveToStorage();
        showToast(`Bildirim durumu "${newStatus}" olarak güncellendi`, 'success');
        renderEthicsView(); // Refresh list
    }
}

function renderEthicsSubmit() {
    mainView.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <h3 style="margin-bottom: 1.5rem;">Bildirim Ver</h3>
            <form onsubmit="handleEthicsSubmit(event)">
                <div class="form-group">
                    <label class="form-label">Konu</label>
                    <select name="subject" class="form-select" required>
                        <option value="">Seçiniz...</option>
                        <option value="Yolsuzluk / Usulsüzlük">Yolsuzluk / Usulsüzlük</option>
                        <option value="Mobbing / Ayrımcılık">Mobbing / Ayrımcılık</option>
                        <option value="Çıkar Çatışması">Çıkar Çatışması</option>
                        <option value="Bilgi Güvenliği İhlali">Bilgi Güvenliği İhlali</option>
                        <option value="Diğer">Diğer</option>
                    </select>
                </div>
                
                <div class="grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Ad Soyad (İsteğe Bağlı)</label>
                        <input type="text" name="name" class="form-input" placeholder="İsimsiz kalabilir">
                    </div>
                    <div class="form-group">
                        <label class="form-label">E-posta (İsteğe Bağlı)</label>
                        <input type="email" name="email" class="form-input" placeholder="Geri dönüş için">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Bildirim Detayı</label>
                    <textarea name="message" class="form-input" rows="6" required placeholder="Lütfen durumu detaylıca açıklayınız..."></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Dosya Yükle (Kanıt vb.)</label>
                    <div style="border: 2px dashed var(--border); padding: 2rem; text-align: center; border-radius: 0.5rem; cursor: pointer;" onclick="document.getElementById('file-upload').click()">
                        <i data-lucide="upload-cloud" style="width: 32px; height: 32px; color: var(--text-light); margin-bottom: 0.5rem;"></i>
                        <p style="color: var(--text-light); font-size: 0.9rem;">Dosyaları buraya sürükleyin veya seçmek için tıklayın</p>
                        <input type="file" id="file-upload" multiple style="display: none" onchange="handleFileUpload(this)">
                    </div>
                    <div id="file-list" style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="navigateTo('dashboard')">İptal</button>
                    <button type="submit" class="btn btn-primary">Bildirimi Gönder</button>
                </div>
            </form>
        </div>
    `;
    lucide.createIcons();
}

window.handleFileUpload = function (input) {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    window.uploadedFiles = [];

    if (input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            window.uploadedFiles.push(file.name);
            const fileItem = document.createElement('div');
            fileItem.style.cssText = `
                display: flex; 
                align-items: center; 
                gap: 0.5rem; 
                background: #eff6ff; 
                padding: 0.5rem 0.75rem; 
                border-radius: 0.25rem; 
                border: 1px solid #dbeafe; 
                color: #1e40af; 
                font-size: 0.85rem;
            `;
            fileItem.innerHTML = `<i data-lucide="file" style="width: 14px;"></i> ${file.name}`;
            fileList.appendChild(fileItem);
        });
        lucide.createIcons();
    }
}


window.renderEthicsView = function () {
    // Ensure data exists
    if (!state.ethicsReports) state.ethicsReports = [];

    const mainView = document.getElementById('main-view');
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Bildirimleri Görüntüle';

    // Build ethics list HTML similar to audit list style
    const listHtml = state.ethicsReports.map(report => {
        const statusColor = getEthicsStatusColor(report.status);
        const priorityColor = report.priority === 'Yüksek' ? '#ef4444' : report.priority === 'Orta' ? '#f59e0b' : '#3b82f6';

        return `
        <div class="ethics-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid var(--border);"
            data-status="${report.status}"
            data-priority="${report.priority || 'Düşük'}"
            data-search="${report.subject.toLowerCase()} ${report.name?.toLowerCase() || ''} ${report.source?.toLowerCase() || ''}">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                    <h4 style="font-size: 1.1rem;">${report.subject}</h4>
                    <span style="font-size: 0.75rem; padding: 0.1rem 0.5rem; background: #f3f4f6; border-radius: 4px; color: #4b5563;">${report.category || 'Genel'}</span>
                    <span style="font-size: 0.75rem; padding: 0.15rem 0.5rem; background: ${priorityColor}15; color: ${priorityColor}; font-weight: 600; border-radius: 4px;">${report.priority || 'Düşük'}</span>
                </div>
                <div style="display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--text-light);">
                    <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="calendar" style="width: 14px;"></i> ${new Date(report.date).toLocaleDateString('tr-TR')}</span>
                    <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="${report.source === 'Email' ? 'mail' : report.source === 'Telefon' ? 'phone' : 'globe'}" style="width: 14px;"></i> ${report.source}</span>
                    <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="user" style="width: 14px;"></i> ${report.name || 'İsimsiz'}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; background: ${statusColor}15; color: ${statusColor};">
                    ${report.status}
                </span>
                <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="viewEthicsDetail('${report.id}')">İncele</button>
            </div>
        </div>
        `;
    }).join('');

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Etik Bildirimleri</h3>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <select class="form-select" style="width: 150px;" id="ethics-filter-status" onchange="filterEthicsItems()">
                    <option value="all">Tüm Durumlar</option>
                    <option value="Yeni">Yeni</option>
                    <option value="İnceleniyor">İnceleniyor</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="Reddedildi">Reddedildi</option>
                </select>
                <select class="form-select" style="width: 130px;" id="ethics-filter-priority" onchange="filterEthicsItems()">
                    <option value="all">Tüm Öncelikler</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Orta">Orta</option>
                    <option value="Düşük">Düşük</option>
                </select>
                <input type="text" class="form-input" id="ethics-search" placeholder="Bildirim ara..." style="width: 250px;" oninput="filterEthicsItems()">
            </div>

            <div id="ethics-list">
                ${listHtml || '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Henüz bildirim bulunmamaktadır.</p>'}
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.filterEthicsItems = function () {
    const search = document.getElementById('ethics-search').value.toLowerCase();
    const status = document.getElementById('ethics-filter-status').value;
    const priority = document.getElementById('ethics-filter-priority').value;

    const items = document.querySelectorAll('.ethics-item');

    items.forEach(item => {
        const itemSearch = item.getAttribute('data-search');
        const itemStatus = item.getAttribute('data-status');
        const itemPriority = item.getAttribute('data-priority');

        const matchesSearch = itemSearch.includes(search);
        const matchesStatus = status === 'all' || itemStatus === status;
        const matchesPriority = priority === 'all' || itemPriority === priority;

        item.style.display = matchesSearch && matchesStatus && matchesPriority ? 'flex' : 'none';
    });
};

window.renderEthicsTableRows = function (reports) {
    if (!reports || reports.length === 0) {
        return '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #6b7280;">Kayıt bulunamadı.</td></tr>';
    }

    return reports.map(r => {
        const statusColor = getEthicsStatusColor(r.status);
        const priorityColor = r.priority === 'Yüksek' ? '#ef4444' : r.priority === 'Orta' ? '#f59e0b' : '#3b82f6';

        return `
            <tr class="ethics-row" data-status="${r.status}" data-priority="${r.priority || 'Düşük'}">
                <td><span style="font-family: monospace; color: #6b7280;">#${r.id.toString().slice(-4)}</span></td>
                <td>
                    <div style="font-weight: 500; color: #111827;">${r.subject}</div>
                    <div style="font-size: 0.8rem; color: #6b7280;">${r.category || 'Genel'}</div>
                </td>
                <td>
                    <span class="badge" style="background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;">
                        <i data-lucide="${r.source === 'Email' ? 'mail' : r.source === 'Telefon' ? 'phone' : 'globe'}" style="width: 12px; margin-right: 4px;"></i>
                        ${r.source}
                    </span>
                </td>
                <td>${new Date(r.date).toLocaleDateString('tr-TR')}</td>
                <td>
                    <span style="color: ${priorityColor}; font-weight: 500; font-size: 0.85rem;">
                        ${r.priority || 'Düşük'}
                    </span>
                </td>
                <td>
                    <span class="status-badge" style="background-color: ${statusColor}20; color: ${statusColor};">
                        ${r.status}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewEthicsDetail('${r.id}')">
                        <i data-lucide="eye" style="width: 14px; margin-right: 4px;"></i> İncele
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

window.filterEthicsTable = function () {
    const search = document.getElementById('ethics-search').value.toLowerCase();
    const status = document.getElementById('ethics-filter-status').value;
    const priority = document.getElementById('ethics-filter-priority').value;

    const rows = document.querySelectorAll('.ethics-row');

    rows.forEach(row => {
        const rowText = row.innerText.toLowerCase();
        const rowStatus = row.getAttribute('data-status');
        const rowPriority = row.getAttribute('data-priority');

        const matchesSearch = rowText.includes(search);
        const matchesStatus = status === 'all' || rowStatus === status;
        const matchesPriority = priority === 'all' || rowPriority === priority;

        row.style.display = matchesSearch && matchesStatus && matchesPriority ? '' : 'none';
    });
};

window.viewEthicsDetail = function (id) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (!report) return;

    // Initialize arrays if not exists
    if (!report.notes) report.notes = [];
    if (!report.communications) report.communications = [];
    if (!report.history) report.history = [];
    if (!report.requestedDocs) report.requestedDocs = [];
    if (!report.files) report.files = [];

    state.currentEthicsId = report.id;
    state.currentPage = 'ethics-detail';
    renderEthicsDetailPage(report);
};

window.renderEthicsDetailPage = function (report) {
    if (!report) {
        report = state.ethicsReports.find(r => r.id == state.currentEthicsId);
        if (!report) return;
    }

    const mainView = document.getElementById('main-view');
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Bildirim Detayı #' + report.id.toString().slice(-4);

    const statusColor = getEthicsStatusColor(report.status);
    const priorityColor = report.priority === 'Yüksek' ? '#ef4444' : report.priority === 'Orta' ? '#f59e0b' : '#3b82f6';
    const staffOptions = (state.staff || []).map(s => `<option value="${s.name}" ${report.assignedTo === s.name ? 'selected' : ''}>${s.name}</option>`).join('');

    mainView.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="navigateTo('ethics-view')" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="arrow-left" style="width: 16px;"></i> Geri
            </button>
        </div>

        <!-- Header Card -->
        <div class="card" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2 style="margin-bottom: 0.5rem;">${report.subject}</h2>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.875rem; color: var(--text-light);">
                        <span><i data-lucide="calendar" style="width: 14px; display: inline;"></i> ${new Date(report.date).toLocaleDateString('tr-TR')}</span>
                        <span><i data-lucide="${report.source === 'Email' ? 'mail' : report.source === 'Telefon' ? 'phone' : 'globe'}" style="width: 14px; display: inline;"></i> ${report.source}</span>
                        <span><i data-lucide="user" style="width: 14px; display: inline;"></i> ${report.name || 'İsimsiz'}</span>
                        ${report.email && report.email !== '-' ? `<span><i data-lucide="at-sign" style="width: 14px; display: inline;"></i> ${report.email}</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; background: ${statusColor}15; color: ${statusColor};">${report.status}</span>
                    <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; background: ${priorityColor}15; color: ${priorityColor};">${report.priority || 'Düşük'}</span>
                </div>
            </div>
        </div>

        <!-- Process Flow Bar -->
        <div class="card" style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 1rem;">Süreç Akışı</h3>
            <div style="display: flex; align-items: center; gap: 0;">
                ${['Yeni', 'İnceleniyor', 'Tamamlandı'].map((step, idx) => {
        const isCompleted =
            (step === 'Yeni') ||
            (step === 'İnceleniyor' && ['İnceleniyor', 'Tamamlandı', 'Reddedildi'].includes(report.status)) ||
            (step === 'Tamamlandı' && ['Tamamlandı', 'Reddedildi'].includes(report.status));
        const isCurrent = report.status === step || (step === 'Tamamlandı' && report.status === 'Reddedildi');
        const isRejected = step === 'Tamamlandı' && report.status === 'Reddedildi';
        const stepColor = isRejected ? '#ef4444' : isCompleted ? '#10b981' : '#e5e7eb';
        const textColor = isCompleted ? '#10b981' : '#94a3b8';

        return `
                        <div style="flex: 1; text-align: center; position: relative;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${stepColor}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-size: 0.8rem; font-weight: 600; ${isCurrent ? 'box-shadow: 0 0 0 4px ' + stepColor + '30;' : ''}">
                                ${isRejected ? '✕' : isCompleted ? '✓' : idx + 1}
                            </div>
                            <div style="font-size: 0.8rem; color: ${textColor}; font-weight: ${isCurrent ? '600' : '400'};">${isRejected ? 'Reddedildi' : step}</div>
                            ${idx < 2 ? `<div style="position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: ${isCompleted && idx < 1 ? '#10b981' : '#e5e7eb'}; z-index: -1;"></div>` : ''}
                        </div>
                    `;
    }).join('')}
            </div>
            ${report.assignedTo ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.9rem;"><strong>Sorumlu Müfettiş:</strong> ${report.assignedTo}</div>` : ''}
        </div>

        ${(report.status === 'Tamamlandı' || report.status === 'Reddedildi') ? `
        <!-- Closure Information -->
        <div class="card" style="margin-bottom: 1.5rem; ${report.status === 'Tamamlandı' ? 'border-left: 4px solid #10b981;' : 'border-left: 4px solid #ef4444;'}">
            <h3 style="margin-bottom: 1rem; color: ${report.status === 'Tamamlandı' ? '#10b981' : '#ef4444'};">
                ${report.status === 'Tamamlandı' ? 'Kapanış Bilgileri' : 'Red Bilgileri'}
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-light);">${report.status === 'Tamamlandı' ? 'Sonuç' : 'Red Gerekçesi'}</div>
                    <div style="font-weight: 600;">${report.closureResult || report.rejectionReason || '-'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-light);">Kapanış Tarihi</div>
                    <div style="font-weight: 600;">${report.closedAt ? new Date(report.closedAt).toLocaleDateString('tr-TR') : '-'}</div>
                </div>
            </div>
            ${report.closureActions ? `
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.25rem;">Alınan Aksiyonlar</div>
                    <div style="background: #f9fafb; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem;">${report.closureActions}</div>
                </div>
            ` : ''}
            ${report.closureNote || report.rejectionNote ? `
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.25rem;">${report.status === 'Tamamlandı' ? 'Kapanış Notu' : 'Açıklama'}</div>
                    <div style="background: #f9fafb; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem;">${report.closureNote || report.rejectionNote}</div>
                </div>
            ` : ''}
        </div>
        ` : ''}

        <!-- Main Grid -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <!-- Left Column -->
            <div>
                <!-- Bildirim İçeriği -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Bildirim İçeriği</h3>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${report.message || 'İçerik girilmemiş.'}</div>
                </div>

                <!-- Notlar -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Notlar</h3>
                        <button class="btn btn-secondary" onclick="openAddEthicsNoteModal('${report.id}')" style="padding: 0.4rem 0.75rem; font-size: 0.85rem;">
                            <i data-lucide="plus" style="width: 14px;"></i> Not Ekle
                        </button>
                    </div>
                    ${report.notes && report.notes.length > 0 ? report.notes.map(n => `
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 6px; border-left: 3px solid var(--primary); margin-bottom: 0.5rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.25rem;">
                                <span><strong>${n.author}</strong></span>
                                <span>${new Date(n.date).toLocaleString('tr-TR')}</span>
                            </div>
                            <div style="font-size: 0.9rem;">${n.content}</div>
                        </div>
                    `).join('') : '<p style="color: var(--text-light); font-size: 0.9rem;">Henüz not eklenmemiş.</p>'}
                </div>

                <!-- İletişim Geçmişi -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>İletişim Geçmişi</h3>
                        <button class="btn btn-secondary" onclick="openSendEthicsMessageModal('${report.id}')" style="padding: 0.4rem 0.75rem; font-size: 0.85rem;" ${!report.email || report.email === '-' ? 'disabled title="E-posta adresi yok"' : ''}>
                            <i data-lucide="send" style="width: 14px;"></i> Mesaj Gönder
                        </button>
                    </div>
                    ${report.communications && report.communications.length > 0 ? report.communications.map(c => `
                        <div style="padding: 0.75rem; background: ${c.direction === 'out' ? '#eff6ff' : '#f0fdf4'}; border-radius: 6px; margin-bottom: 0.5rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.25rem;">
                                <span><i data-lucide="${c.direction === 'out' ? 'arrow-up-right' : 'arrow-down-left'}" style="width: 12px;"></i> ${c.direction === 'out' ? 'Gönderildi' : 'Alındı'}</span>
                                <span>${new Date(c.date).toLocaleString('tr-TR')}</span>
                            </div>
                            <div style="font-size: 0.9rem;">${c.content}</div>
                        </div>
                    `).join('') : '<p style="color: var(--text-light); font-size: 0.9rem;">Henüz iletişim yapılmamış.</p>'}
                </div>

                <!-- Süreç Geçmişi -->
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Süreç Geçmişi</h3>
                    ${report.history && report.history.length > 0 ? `
                        <div style="border-left: 2px solid var(--border); padding-left: 1rem; margin-left: 0.5rem;">
                            ${report.history.slice().reverse().map(h => `
                                <div style="position: relative; padding-bottom: 1rem;">
                                    <div style="position: absolute; left: -1.35rem; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--primary);"></div>
                                    <div style="font-size: 0.8rem; color: var(--text-light);">${new Date(h.date).toLocaleString('tr-TR')}</div>
                                    <div style="font-weight: 500;">${h.action}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-light);">Sorumlu: ${h.by}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="color: var(--text-light); font-size: 0.9rem;">Geçmiş kaydı yok.</p>'}
                </div>
            </div>

            <!-- Right Column -->
            <div>
                <!-- Durum Güncelle -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Durum Güncelle</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button class="btn btn-secondary" style="width: 100%;" onclick="updateEthicsStatus('${report.id}', 'İnceleniyor')">İncelemeye Al</button>
                        <button class="btn btn-primary" style="width: 100%;" onclick="updateEthicsStatus('${report.id}', 'Tamamlandı')">Tamamla</button>
                        <button class="btn" style="width: 100%; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca;" onclick="updateEthicsStatus('${report.id}', 'Reddedildi')">Reddet</button>
                    </div>
                </div>

                <!-- Atama -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Sorumlu Müfettiş</h3>
                    <select class="form-select" style="width: 100%;" onchange="assignEthicsReport('${report.id}', this.value)">
                        <option value="">Atanmamış</option>
                        ${staffOptions}
                    </select>
                </div>

                <!-- Öncelik -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Öncelik</h3>
                    <select class="form-select" style="width: 100%;" onchange="setEthicsPriority('${report.id}', this.value)">
                        <option value="Düşük" ${report.priority === 'Düşük' ? 'selected' : ''}>Düşük</option>
                        <option value="Orta" ${report.priority === 'Orta' ? 'selected' : ''}>Orta</option>
                        <option value="Yüksek" ${report.priority === 'Yüksek' ? 'selected' : ''}>Yüksek</option>
                    </select>
                </div>

                <!-- Termin -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Termin Tarihi</h3>
                    <input type="date" class="form-input" style="width: 100%;" value="${report.dueDate || ''}" onchange="setEthicsDueDate('${report.id}', this.value)">
                </div>

                <!-- Bildirenden Ek Bilgi Talebi -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Ek Bilgi/Belge Talebi</h3>
                        ${report.email && report.email !== '-' ? `
                            <button class="btn btn-secondary" onclick="openRequestInfoFromReporterModal('${report.id}')" style="padding: 0.4rem 0.75rem; font-size: 0.85rem;">
                                <i data-lucide="message-circle" style="width: 14px;"></i> Talep Gönder
                            </button>
                        ` : ''}
                    </div>
                    ${report.email && report.email !== '-' ? `
                        <p style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.75rem;">Bildirenden ek bilgi veya belge talep edebilirsiniz.</p>
                    ` : `
                        <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem;">
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                                <i data-lucide="alert-triangle" style="width: 16px; color: #ca8a04; flex-shrink: 0; margin-top: 2px;"></i>
                                <div style="font-size: 0.85rem; color: #92400e;">
                                    <strong>İsimsiz Bildirim</strong><br>
                                    Bildiren kişi iletişim bilgisi paylaşmamış. Geri dönüş yapılamaz, ek bilgi/belge talep edilemez.
                                </div>
                            </div>
                        </div>
                    `}
                    ${report.requestedDocs && report.requestedDocs.length > 0 ? report.requestedDocs.map(d => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f9fafb; border-radius: 4px; margin-bottom: 0.25rem;">
                            <div style="font-size: 0.9rem;">${d.title}</div>
                            <span style="font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: ${d.status === 'Tamamlandı' ? '#dcfce7' : '#fef3c7'}; color: ${d.status === 'Tamamlandı' ? '#16a34a' : '#ca8a04'};">${d.status}</span>
                        </div>
                    `).join('') : ''}
                    
                    ${report.files && report.files.length > 0 ? `
                        <div style="margin-top: 1rem;">
                            <strong style="font-size: 0.9rem;">Eklenen Dosyalar:</strong>
                            ${report.files.map(f => `<div style="font-size: 0.85rem; color: var(--text-light);"><i data-lucide="file" style="width: 12px;"></i> ${f.name}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.updateEthicsStatus = function (id, newStatus) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (!report) return;

    // For Tamamlandı or Reddedildi, require closure documentation
    if (newStatus === 'Tamamlandı') {
        showConfirmDialog('Bildirimi Tamamla', `
            <div class="form-group">
                <label class="form-label">Sonuç</label>
                <select id="ethics-closure-result" class="form-select">
                    <option value="Haklı Bulundu">Haklı Bulundu</option>
                    <option value="Kısmen Haklı Bulundu">Kısmen Haklı Bulundu</option>
                    <option value="Haksız Bulundu">Haksız Bulundu</option>
                    <option value="Kanıt Yetersiz">Kanıt Yetersiz</option>
                    <option value="Başka Birime Yönlendirildi">Başka Birime Yönlendirildi</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Alınan Aksiyonlar</label>
                <textarea id="ethics-closure-actions" class="form-input" rows="3" placeholder="Yapılan inceleme ve alınan aksiyonları yazın..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Kapanış Notu</label>
                <textarea id="ethics-closure-note" class="form-input" rows="2" placeholder="Kapanış açıklaması..."></textarea>
            </div>
        `, () => {
            const result = document.getElementById('ethics-closure-result').value;
            const actions = document.getElementById('ethics-closure-actions').value;
            const note = document.getElementById('ethics-closure-note').value;
            if (!actions.trim()) {
                showToast('Alınan aksiyonlar alanı zorunludur!', 'error');
                return;
            }
            completeEthicsCase(id, result, actions, note);
            closeConfirmDialog();
        }, 'Tamamla', 'var(--success)');
    } else if (newStatus === 'Reddedildi') {
        showConfirmDialog('Bildirimi Reddet', `
            <div class="form-group">
                <label class="form-label">Red Gerekçesi</label>
                <select id="ethics-reject-reason" class="form-select">
                    <option value="Yetersiz Bilgi">Yetersiz Bilgi</option>
                    <option value="Kapsam Dışı">Kapsam Dışı</option>
                    <option value="Mükerrer Bildirim">Mükerrer Bildirim</option>
                    <option value="Asılsız Bildirim">Asılsız Bildirim</option>
                    <option value="Diğer">Diğer</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Açıklama</label>
                <textarea id="ethics-reject-note" class="form-input" rows="3" placeholder="Red gerekçesini açıklayın..."></textarea>
            </div>
        `, () => {
            const reason = document.getElementById('ethics-reject-reason').value;
            const note = document.getElementById('ethics-reject-note').value;
            if (!note.trim()) {
                showToast('Açıklama alanı zorunludur!', 'error');
                return;
            }
            rejectEthicsCase(id, reason, note);
            closeConfirmDialog();
        }, 'Reddet', '#ef4444');
    } else if (newStatus === 'İnceleniyor') {
        // For İnceleniyor, require inspector assignment
        const staffOptions = (state.staff || []).map(s => `<option value="${s.name}">${s.name}</option>`).join('');

        showConfirmDialog('İncelemeye Al', `
            <div class="form-group">
                <label class="form-label">Sorumlu Müfettiş <span style="color: #ef4444;">*</span></label>
                <select id="ethics-assign-inspector" class="form-select">
                    <option value="">Seçiniz...</option>
                    ${staffOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Başlangıç Notu (Opsiyonel)</label>
                <textarea id="ethics-start-note" class="form-input" rows="2" placeholder="İnceleme ile ilgili başlangıç notu..."></textarea>
            </div>
        `, () => {
            const inspector = document.getElementById('ethics-assign-inspector').value;
            const note = document.getElementById('ethics-start-note').value;
            if (!inspector) {
                showToast('Sorumlu müfettiş seçimi zorunludur!', 'error');
                return;
            }
            startEthicsReview(id, inspector, note);
            closeConfirmDialog();
        }, 'İncelemeye Al', 'var(--primary)');
    } else {
        // For other statuses, update directly
        report.status = newStatus;
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: newStatus,
            by: state.currentUser?.name || 'Admin'
        });
        saveToStorage();
        showToast(`Bildirim durumu "${newStatus}" olarak güncellendi.`, 'success');
        renderEthicsDetailPage(report);
    }
};

window.startEthicsReview = function (id, inspector, note) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        report.status = 'İnceleniyor';
        report.assignedTo = inspector;
        report.reviewStartedAt = new Date().toISOString();
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: `İncelemeye alındı - Sorumlu: ${inspector}`,
            by: state.currentUser?.name || 'Admin'
        });
        if (note) {
            if (!report.notes) report.notes = [];
            report.notes.push({
                id: Date.now(),
                date: new Date().toISOString(),
                author: state.currentUser?.name || 'Admin',
                content: note
            });
        }
        saveToStorage();
        showToast(`Bildirim ${inspector}'a atandı ve incelemeye alındı.`, 'success');
        renderEthicsDetailPage(report);
    }
};

window.completeEthicsCase = function (id, result, actions, note) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        report.status = 'Tamamlandı';
        report.closureResult = result;
        report.closureActions = actions;
        report.closureNote = note;
        report.closedAt = new Date().toISOString();
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: `Tamamlandı - ${result}`,
            by: state.currentUser?.name || 'Admin',
            details: actions
        });
        saveToStorage();
        showToast('Bildirim tamamlandı.', 'success');
        renderEthicsDetailPage(report);
    }
};

window.rejectEthicsCase = function (id, reason, note) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        report.status = 'Reddedildi';
        report.rejectionReason = reason;
        report.rejectionNote = note;
        report.closedAt = new Date().toISOString();
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: `Reddedildi - ${reason}`,
            by: state.currentUser?.name || 'Admin',
            details: note
        });
        saveToStorage();
        showToast('Bildirim reddedildi.', 'success');
        renderEthicsDetailPage(report);
    }
};

window.assignEthicsReport = function (id, staffName) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        report.assignedTo = staffName || null;
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: staffName ? `Atandı: ${staffName}` : 'Atama Kaldırıldı',
            by: state.currentUser?.name || 'Admin'
        });
        saveToStorage();
        showToast(staffName ? `Bildirim ${staffName}'a atandı.` : 'Atama kaldırıldı.', 'success');
    }
};

window.setEthicsPriority = function (id, priority) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        report.priority = priority;
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: `Öncelik değişti: ${priority}`,
            by: state.currentUser?.name || 'Admin'
        });
        saveToStorage();
        showToast(`Öncelik "${priority}" olarak güncellendi.`, 'success');
        renderEthicsDetailPage(report);
    }
};

window.setEthicsDueDate = function (id, date) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        report.dueDate = date || null;
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: date ? `Termin belirlendi: ${formatDate(date)}` : 'Termin kaldırıldı',
            by: state.currentUser?.name || 'Admin'
        });
        saveToStorage();
        showToast(date ? `Termin tarihi güncellendi.` : 'Termin tarihi kaldırıldı.', 'success');
    }
};

window.openAddEthicsNoteModal = function (id) {
    showConfirmDialog('Not Ekle', `
        <div class="form-group">
            <label class="form-label">Not İçeriği</label>
            <textarea id="ethics-note-content" class="form-input" rows="4" placeholder="Notunuzu yazın..."></textarea>
        </div>
    `, () => {
        const content = document.getElementById('ethics-note-content').value;
        if (!content.trim()) {
            showToast('Not içeriği boş olamaz!', 'error');
            return;
        }
        addEthicsNote(id, content);
        closeConfirmDialog();
    }, 'Ekle', 'var(--primary)');
};

window.addEthicsNote = function (id, content) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        if (!report.notes) report.notes = [];
        report.notes.push({
            id: Date.now(),
            date: new Date().toISOString(),
            author: state.currentUser?.name || 'Admin',
            content: content
        });
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: 'Not eklendi',
            by: state.currentUser?.name || 'Admin'
        });
        saveToStorage();
        showToast('Not eklendi.', 'success');
        renderEthicsDetailPage(report);
    }
};

window.openSendEthicsMessageModal = function (id) {
    const report = state.ethicsReports.find(r => r.id == id);
    showConfirmDialog('Mesaj Gönder', `
        <div class="form-group">
            <label class="form-label">Alıcı</label>
            <input type="text" class="form-input" value="${report?.email || ''}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Mesaj</label>
            <textarea id="ethics-message-content" class="form-input" rows="4" placeholder="Mesajınızı yazın..."></textarea>
        </div>
    `, () => {
        const content = document.getElementById('ethics-message-content').value;
        if (!content.trim()) {
            showToast('Mesaj içeriği boş olamaz!', 'error');
            return;
        }
        sendEthicsMessage(id, content);
        closeConfirmDialog();
    }, 'Gönder', 'var(--primary)');
};

window.sendEthicsMessage = function (id, content) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        if (!report.communications) report.communications = [];
        report.communications.push({
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'email',
            direction: 'out',
            content: content,
            to: report.email
        });
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: 'Mesaj gönderildi',
            by: state.currentUser?.name || 'Admin'
        });
        saveToStorage();
        showToast('Mesaj gönderildi.', 'success');
        renderEthicsDetailPage(report);
    }
};

window.openRequestInfoFromReporterModal = function (id) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (!report || !report.email || report.email === '-') {
        showToast('Bu bildirim anonim, geri dönüş yapılamaz.', 'error');
        return;
    }

    showConfirmDialog('Ek Bilgi / Belge Talebi', `
        <div class="form-group">
            <label class="form-label">Alıcı</label>
            <input type="text" class="form-input" value="${report.email}" readonly>
        </div>
        <div class="form-group">
            <label class="form-label">Talep Türü</label>
            <select id="ethics-request-type" class="form-select">
                <option value="Ek Bilgi">Ek Bilgi İstiyorum</option>
                <option value="Belge">Belge/Kanıt İstiyorum</option>
                <option value="Açıklama">Detaylı Açıklama İstiyorum</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Mesaj</label>
            <textarea id="ethics-request-message" class="form-input" rows="4" placeholder="Bildirenden talep ettiğiniz bilgi/belgeyi açıklayın..."></textarea>
        </div>
    `, () => {
        const type = document.getElementById('ethics-request-type').value;
        const message = document.getElementById('ethics-request-message').value;
        if (!message.trim()) {
            showToast('Mesaj alanı zorunludur!', 'error');
            return;
        }
        sendInfoRequestToReporter(id, type, message);
        closeConfirmDialog();
    }, 'Talep Gönder', 'var(--primary)');
};

window.sendInfoRequestToReporter = function (id, type, message) {
    const report = state.ethicsReports.find(r => r.id == id);
    if (report) {
        // Add to communications
        if (!report.communications) report.communications = [];
        report.communications.push({
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'email',
            direction: 'out',
            content: `[${type}] ${message}`,
            to: report.email
        });

        // Add to requested docs
        if (!report.requestedDocs) report.requestedDocs = [];
        report.requestedDocs.push({
            id: Date.now(),
            title: type,
            status: 'Bekliyor',
            requestedAt: new Date().toISOString()
        });

        // Add to history
        if (!report.history) report.history = [];
        report.history.push({
            date: new Date().toISOString(),
            action: `${type} talep edildi`,
            by: state.currentUser?.name || 'Admin'
        });

        saveToStorage();
        showToast('Talep bildirene gönderildi.', 'success');
        renderEthicsDetailPage(report);
    }
};

window.renderEthicsReports = function () {
    const reports = state.ethicsReports || [];

    // Calculate Stats
    const total = reports.length;
    const completed = reports.filter(r => r.status === 'Tamamlandı').length;
    const pending = reports.filter(r => r.status === 'İnceleniyor').length;
    const newReports = reports.filter(r => r.status === 'Yeni').length;
    const rejected = reports.filter(r => r.status === 'Reddedildi').length;

    // Priority Distribution
    const highPriority = reports.filter(r => r.priority === 'Yüksek').length;
    const mediumPriority = reports.filter(r => r.priority === 'Orta').length;
    const lowPriority = reports.filter(r => r.priority === 'Düşük' || !r.priority).length;

    // Category Distribution
    const categories = {};
    reports.forEach(r => {
        const cat = r.category || 'Diğer';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    const mainView = document.getElementById('main-view');
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Etik Raporları';

    mainView.innerHTML = `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">Toplam Bildirim</div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--text-main);">${total}</div>
                    </div>
                    <div style="width: 40px; height: 40px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="inbox" style="width: 20px; color: #3b82f6;"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">Yeni Bildirimler</div>
                        <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${newReports}</div>
                    </div>
                    <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="bell" style="width: 20px; color: #3b82f6;"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">İnceleniyor</div>
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${pending}</div>
                    </div>
                    <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="search" style="width: 20px; color: #f59e0b;"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">Tamamlanan</div>
                        <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${completed}</div>
                    </div>
                    <div style="width: 40px; height: 40px; background: #d1fae5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="check-circle" style="width: 20px; color: #10b981;"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Grid -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <!-- Left Column -->
            <div>
                <!-- Category Distribution -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Kategori Dağılımı</h3>
                    ${Object.entries(categories).map(([cat, count]) => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.9rem;">
                                <span>${cat}</span>
                                <span style="font-weight: 600;">${count}</span>
                            </div>
                            <div style="width: 100%; background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(count / total) * 100}%; background: var(--primary); height: 100%; border-radius: 4px;"></div>
                            </div>
                        </div>
                    `).join('')}
                    ${Object.keys(categories).length === 0 ? '<p style="color: var(--text-light); text-align: center;">Veri yok</p>' : ''}
                </div>

                <!-- Priority Breakdown -->
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Öncelik Dağılımı</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div style="text-align: center; padding: 1rem; background: #fef2f2; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${highPriority}</div>
                            <div style="font-size: 0.85rem; color: #ef4444;">Yüksek</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #fffbeb; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${mediumPriority}</div>
                            <div style="font-size: 0.85rem; color: #f59e0b;">Orta</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #eff6ff; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${lowPriority}</div>
                            <div style="font-size: 0.85rem; color: #3b82f6;">Düşük</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div>
                <!-- Status Summary -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Durum Özeti</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 6px;">
                            <span style="font-size: 0.9rem;">Yeni</span>
                            <span style="padding: 0.25rem 0.75rem; background: #dbeafe; color: #3b82f6; border-radius: 999px; font-size: 0.8rem; font-weight: 500;">${newReports}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 6px;">
                            <span style="font-size: 0.9rem;">İnceleniyor</span>
                            <span style="padding: 0.25rem 0.75rem; background: #fef3c7; color: #f59e0b; border-radius: 999px; font-size: 0.8rem; font-weight: 500;">${pending}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 6px;">
                            <span style="font-size: 0.9rem;">Tamamlandı</span>
                            <span style="padding: 0.25rem 0.75rem; background: #d1fae5; color: #10b981; border-radius: 999px; font-size: 0.8rem; font-weight: 500;">${completed}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 6px;">
                            <span style="font-size: 0.9rem;">Reddedildi</span>
                            <span style="padding: 0.25rem 0.75rem; background: #fee2e2; color: #ef4444; border-radius: 999px; font-size: 0.8rem; font-weight: 500;">${rejected}</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Reports -->
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Son Bildirimler</h3>
                    ${reports.slice(0, 5).map(r => `
                        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${getEthicsStatusColor(r.status)};"></div>
                            <div style="flex: 1; overflow: hidden;">
                                <div style="font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.subject}</div>
                                <div style="font-size: 0.75rem; color: var(--text-light);">${new Date(r.date).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                    `).join('')}
                    ${reports.length === 0 ? '<p style="color: var(--text-light); text-align: center; padding: 1rem;">Bildirim yok</p>' : ''}
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.handleEthicsSubmit = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newReport = {
        id: Date.now(),
        subject: formData.get('subject'),
        name: formData.get('name') || 'İsimsiz',
        email: formData.get('email') || '-',
        message: formData.get('message'),
        date: new Date().toISOString(),
        status: 'Yeni',
        source: 'Web',
        files: window.uploadedFiles || [] // Assume uploadedFiles is handled globally or we need to fix handleFileUpload
    };

    state.ethicsReports.unshift(newReport);
    saveToStorage();
    window.uploadedFiles = []; // Reset
    showToast('Bildiriminiz başarıyla alındı. Teşekkür ederiz.', 'success');
    navigateTo('ethics-view');
}

window.simulateIncomingEmail = function () {
    const newReport = {
        id: Date.now(),
        subject: 'Şüpheli İşlem Bildirimi',
        name: 'Ahmet Yılmaz (Dış Kaynak)',
        email: 'ahmet.yilmaz@example.com',
        message: 'Sayın Yetkili, X şubesinde yapılan son işlemlerde usulsüzlük olduğunu düşünüyorum. Ekteki belgeleri incelemenizi rica ederim.',
        date: new Date().toISOString(),
        status: 'Yeni',
        source: 'Email',
        files: ['dekont_ornek.pdf', 'yazisma.docx']
    };

    state.ethicsReports.unshift(newReport);
    saveToStorage();
    showToast('Yeni e-posta bildirimi düştü!', 'info');

    if (state.currentPage === 'ethics-view') {
        renderEthicsView();
    }
}

function getEthicsStatusColor(status) {
    switch (status) {
        case 'Yeni': return 'var(--primary)';
        case 'İnceleniyor': return 'var(--warning)';
        case 'Tamamlandı': return 'var(--success)';
        case 'Reddedildi': return 'var(--danger)';
        default: return 'var(--text-light)';
    }
}

function renderEthicsAnalytics() {
    const reports = state.ethicsReports;
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'Yeni' || r.status === 'İnceleniyor').length;
    const closed = reports.filter(r => r.status === 'Tamamlandı' || r.status === 'Reddedildi').length;

    // Group by Subject
    const bySubject = {};
    reports.forEach(r => { bySubject[r.subject] = (bySubject[r.subject] || 0) + 1; });

    // Group by Source
    const bySource = {};
    reports.forEach(r => { bySource[r.source] = (bySource[r.source] || 0) + 1; });

    mainView.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>Etik Hattı Analizleri</h3>
            <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-secondary" onclick="exportEthicsData('excel')">
                    <i data-lucide="file-spreadsheet" style="width: 16px; margin-right: 0.5rem;"></i> Excel İndir
                </button>
                <button class="btn btn-secondary" onclick="exportEthicsData('pdf')">
                    <i data-lucide="file-text" style="width: 16px; margin-right: 0.5rem;"></i> PDF İndir
                </button>
            </div>
        </div>

        <div class="grid-cols-3">
            <div class="card">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="background: var(--primary); color: white; padding: 1rem; border-radius: 0.5rem;">
                        <i data-lucide="inbox" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.9rem; color: var(--text-light);">Toplam Bildirim</h3>
                        <p style="font-size: 1.5rem; font-weight: 700;">${total}</p>
                    </div>
                </div>
            </div>
             <div class="card">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="background: var(--warning); color: white; padding: 1rem; border-radius: 0.5rem;">
                        <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.9rem; color: var(--text-light);">Bekleyen / İncelenen</h3>
                        <p style="font-size: 1.5rem; font-weight: 700;">${pending}</p>
                    </div>
                </div>
            </div>
             <div class="card">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="background: var(--success); color: white; padding: 1rem; border-radius: 0.5rem;">
                        <i data-lucide="check-circle" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.9rem; color: var(--text-light);">Sonuçlanan</h3>
                        <p style="font-size: 1.5rem; font-weight: 700;">${closed}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid-cols-2" style="margin-top: 1.5rem;">
            <div class="card">
                <h3 style="margin-bottom: 1.25rem;">Konulara Göre Dağılım</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${Object.entries(bySubject).map(([subject, count]) => `
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                <span>${subject}</span>
                                <span style="font-weight: 600;">${count}</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(count / total) * 100}%; height: 100%; background: var(--primary);"></div>
                            </div>
                        </div>
                    `).join('') || '<p style="color: var(--text-light);">Veri yok</p>'}
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 1.25rem;">Bildirim Kaynakları</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${Object.entries(bySource).map(([source, count]) => `
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                <span>${source}</span>
                                <span style="font-weight: 600;">${count}</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${(count / total) * 100}%; height: 100%; background: ${source === 'Web' ? '#3b82f6' : '#8b5cf6'};"></div>
                            </div>
                        </div>
                    `).join('') || '<p style="color: var(--text-light);">Veri yok</p>'}
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// Widget Registry
const widgetRegistry = {
    'total-stats': {
        title: 'Genel İstatistikler',
        colSpan: 1, // Will wrap in grid-cols-3 in legacy view, or full width
        render: () => {
            const totalAudits = state.audits.length;
            const activeAudits = state.audits.filter(a => a.status === 'Devam Ediyor').length;
            const completedAudits = state.audits.filter(a => a.status === 'Tamamlandı').length;
            const plannedAudits = state.audits.filter(a => a.status === 'Planlandı').length;

            return `
            <div class="card h-full">
                <h3 style="color: var(--text-light); font-size: 0.875rem;">Toplam Denetim</h3>
                <p style="font-size: 2rem; font-weight: 700; color: var(--primary);">${totalAudits}</p>
                <div style="font-size: 0.875rem; margin-top: 0.75rem; line-height: 1.8;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-light);">Devam Ediyor:</span>
                        <strong style="color: var(--warning);">${activeAudits}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-light);">Tamamlandı:</span>
                        <strong style="color: var(--success);">${completedAudits}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-light);">Planlandı:</span>
                        <strong>${plannedAudits}</strong>
                    </div>
                </div>
            </div>`;
        }
    },
    'open-findings-summary': {
        title: 'Açık Bulgu Dağılımı',
        colSpan: 1,
        render: () => {
            const openFindings = state.findings.filter(f => f.status === 'Açık').length;
            const auditTypes = ['Şube', 'IT', 'Süreç', 'İnceleme', 'Soruşturma'];
            const openFindingsByAuditType = {};
            auditTypes.forEach(type => {
                const auditsOfType = state.audits.filter(a => a.type === type);
                const auditIds = auditsOfType.map(a => a.id);
                openFindingsByAuditType[type] = state.findings.filter(f => f.status === 'Açık' && auditIds.includes(f.auditId)).length;
            });

            return `
            <div class="card h-full">
                <h3 style="color: var(--text-light); font-size: 0.875rem;">Açık Bulgular</h3>
                <p style="font-size: 2rem; font-weight: 700; color: var(--danger);">${openFindings}</p>
                <div style="font-size: 0.75rem; margin-top: 0.75rem; line-height: 1.6;">
                    ${auditTypes.filter(type => openFindingsByAuditType[type] > 0).map(type => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span style="color: var(--text-light);">${type}:</span>
                            <strong>${openFindingsByAuditType[type]}</strong>
                        </div>
                    `).join('')}
                    ${Object.values(openFindingsByAuditType).every(v => v === 0) ? '<span style="color: var(--text-light);">Denetim türü dağılımı yok</span>' : ''}
                </div>
            </div>`;
        }
    },
    'risk-action-status': {
        title: 'Risk Aksiyon Durumu',
        colSpan: 1,
        render: () => {
            // Calculate hypothetical completion rate
            let completionRate = 0;
            if (state.findings.length > 0) {
                const totalActions = state.findings.reduce((acc, f) => acc + (f.actions ? f.actions.length : 0), 0);
                const completedActions = state.findings.reduce((acc, f) => acc + (f.actions ? f.actions.filter(a => a.status === 'Tamamlandı').length : 0), 0);
                completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
            }

            return `
            <div class="card h-full" style="display: flex; flex-direction: column;">
                <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Risk Aksiyon Durumu</h3>
                <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                    <div style="position: relative; width: 150px; height: 150px;">
                        <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" stroke-width="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="var(--primary)" stroke-width="3" stroke-dasharray="${completionRate}, 100" />
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                            <span style="display: block; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">${completionRate}%</span>
                            <span style="font-size: 0.75rem; color: var(--text-light);">Tamamlanma</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    },
    'audit-universe-summary': {
        title: 'Denetim Evreni Risk Durumu',
        colSpan: 1,
        render: () => {
            const universeRisks = { Critical: 0, High: 0, Medium: 0, Low: 0 };
            if (state.auditUniverse) {
                state.auditUniverse.forEach(item => {
                    if (item.riskScore >= 90) universeRisks.Critical++;
                    else if (item.riskScore >= 70) universeRisks.High++;
                    else if (item.riskScore >= 50) universeRisks.Medium++;
                    else universeRisks.Low++;
                });
            }
            return `
            <div class="card h-full">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="font-size: 1.1rem;">Denetim Evreni Risk Durumu</h3>
                    <button class="btn btn-sm btn-secondary" onclick="navigateTo('audit-universe')">Detay</button>
                </div>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #fee2e2; border-radius: 0.5rem;">
                        <span style="font-weight: 500; color: #991b1b;">Kritik Riskli Birimler</span>
                        <span style="font-weight: 700; color: #991b1b;">${universeRisks.Critical}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #ffedd5; border-radius: 0.5rem;">
                        <span style="font-weight: 500; color: #9a3412;">Yüksek Riskli Birimler</span>
                        <span style="font-weight: 700; color: #9a3412;">${universeRisks.High}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #fef9c3; border-radius: 0.5rem;">
                        <span style="font-weight: 500; color: #854d0e;">Orta Riskli Birimler</span>
                        <span style="font-weight: 700; color: #854d0e;">${universeRisks.Medium}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #d1fae5; border-radius: 0.5rem;">
                        <span style="font-weight: 500; color: #065f46;">Düşük Riskli Birimler</span>
                        <span style="font-weight: 700; color: #065f46;">${universeRisks.Low}</span>
                    </div>
                </div>
            </div>`;
        }
    },
    'recent-activity': {
        title: 'Son Aktiviteler',
        colSpan: 2,
        render: () => {
            const recentLogs = [...state.logs]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            const getLogIcon = (action) => {
                if (action.includes('Silindi')) return 'trash-2';
                if (action.includes('Düzenlendi')) return 'edit';
                if (action.includes('Oluşturuldu')) return 'plus-circle';
                if (action.includes('Tebliğ')) return 'send';
                return 'activity';
            };
            const getLogColor = (action) => {
                if (action.includes('Silindi')) return '#fef2f2; color: #ef4444';
                if (action.includes('Oluşturuldu')) return '#f0fdf4; color: #16a34a';
                return '#f3f4f6; color: #4b5563';
            };

            return `
            <div class="card h-full">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Son Aktiviteler (Canlı)</h3>
                    <button class="btn btn-sm btn-secondary" onclick="navigateTo('audit-logs')">Tümünü Gör</button>
                </div>
                <div id="activity-list" style="margin-top: 1rem;">
                    ${recentLogs.length > 0 ? recentLogs.map(log => `
                        <div style="padding: 1rem 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; background: ${getLogColor(log.action).split(';')[0] || '#f3f4f6'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${getLogColor(log.action).split(';')[1]}">
                                <i data-lucide="${getLogIcon(log.action)}"></i>
                            </div>
                            <div>
                                <p style="font-weight: 500;">${log.action}</p>
                                <p style="font-size: 0.875rem; color: var(--text-light);">${log.details}</p>
                            </div>
                            <div style="margin-left: auto; text-align: right;">
                                <span style="display: block; font-size: 0.75rem; color: var(--text-light);">${new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span style="font-size: 0.7rem; color: var(--text-light);">${log.user}</span>
                            </div>
                        </div>
                    `).join('') : '<p style="color: var(--text-light); padding: 1rem;">Henüz aktivite yok.</p>'}
                </div>
            </div>`;
        }
    },
    'quick-actions': {
        title: 'Hızlı İşlemler',
        colSpan: 1,
        render: () => {
            return `
            <div class="card h-full">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Hızlı İşlemler</h3>
                    <button class="btn btn-icon" onclick="openCustomizeModal()" title="Özelleştir">
                        <i data-lucide="settings-2" style="width: 16px;"></i>
                    </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
                    ${(() => {
                    let config = quickActionsConfig;
                    try {
                        const saved = localStorage.getItem('quickActionsConfig');
                        if (saved) {
                            const savedConfig = JSON.parse(saved);
                            config = quickActionsConfig.map(def => {
                                const s = savedConfig.find(c => c.id === def.id);
                                return { ...def, visible: s ? s.visible : def.visible };
                            });
                        }
                    } catch (e) { }
                    return config.filter(i => i.visible).map(i => `<button class="btn btn-secondary" onclick="${i.action}" style="justify-content: flex-start;"><i data-lucide="${i.icon}" style="width: 16px; margin-right: 0.5rem;"></i> ${i.label}</button>`).join('');
                })()}
                </div>
            </div>`;
        }
    }
};

// Default Layout
const defaultDashboardLayout = [
    'total-stats', 'open-findings-summary', 'audit-universe-summary',
    'risk-action-status', 'recent-activity', 'quick-actions'
];

// Page Renderers
function renderDashboard() {
    // Determine layout order (could be loaded from storage in future)
    const layout = defaultDashboardLayout;

    // We will use a simple grid layout logic. 
    // We'll dump them all into a CSS Grid container that auto-fits.

    // Actually, to match previous specific design:
    // Row 1: Stats, Open Findings, Audit Universe (3 cols)
    // Row 2: Charts/Activity (2 cols + 1 col)

    // Let's make it a smart grid wrapper.
    let widgetsHtml = '';

    layout.forEach(widgetId => {
        const widget = widgetRegistry[widgetId];
        if (widget) {
            // Using a wrapper div to control individual cell styling if needed
            widgetsHtml += `<div class="dashboard-widget" style="grid-column: span ${widget.colSpan || 1};">${widget.render()}</div>`;
        }
    });

    // Main Container (Rol değiştirici header'da olacak, burada gereksiz)
    mainView.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; grid-auto-rows: minmax(min-content, max-content);">
            ${widgetsHtml}
        </div>
    `;

    lucide.createIcons();
    updateRoleDisplay(); // Header dropdown'ı güncel rol ile senkronize et
}

function renderSettings() {
    mainView.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h3>Profil Ayarları</h3>
            <form style="margin-top: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="width: 80px; height: 80px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
                        AU
                    </div>
                    <div>
                        <button type="button" class="btn btn-secondary">Fotoğraf Değiştir</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Ad Soyad</label>
                    <input type="text" class="form-input" value="Admin User">
                </div>
                <div class="form-group">
                    <label class="form-label">E-posta</label>
                    <input type="email" class="form-input" value="admin@emlakkatilimtfs.com.tr">
                </div>
                <div class="form-group">
                    <label class="form-label">Departman</label>
                    <input type="text" class="form-input" value="Teftiş Kurulu" disabled style="background: #f3f4f6;">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="showToast('Ayarlar kaydedildi!', 'success')">Kaydet</button>
                </div>
            </form>
        </div>
    `;
}

function renderReports() {
    // Calculate Statistics
    const totalAudits = state.audits.length;
    const completedAudits = state.audits.filter(a => a.status === 'Tamamlandı').length;
    const activeAudits = state.audits.filter(a => a.status === 'Devam Ediyor').length;
    const plannedAudits = state.audits.filter(a => a.status === 'Planlandı').length;

    const totalFindings = state.findings.length;
    const openFindings = state.findings.filter(f => f.status === 'Açık').length;
    const closedFindings = state.findings.filter(f => f.status === 'Kapalı').length;

    const kritikFindings = state.findings.filter(f => f.risk === 'Kritik').length;
    const highRiskFindings = state.findings.filter(f => f.risk === 'Yüksek').length;
    const mediumRiskFindings = state.findings.filter(f => f.risk === 'Orta').length;
    const lowRiskFindings = state.findings.filter(f => f.risk === 'Düşük').length;

    // Audit Types - TÜM TÜRLERİ GÖSTER (sıfır olanlar dahil)
    const auditTypes = ['Şube', 'IT', 'Süreç', 'İnceleme', 'Soruşturma'];
    const auditsByType = {};
    auditTypes.forEach(type => auditsByType[type] = 0);
    state.audits.forEach(audit => {
        if (auditsByType[audit.type] !== undefined) {
            auditsByType[audit.type]++;
        } else {
            auditsByType[audit.type] = 1;
        }
    });

    const typeStatsHtml = auditTypes.map(type => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-weight: 500;">${type}</span>
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${auditsByType[type] || 0}</span>
        </div>
    `).join('');

    mainView.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card">
                <h4 style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.75rem;">Toplam Denetim</h4>
                <p style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">${totalAudits}</p>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.85rem;">
                    <span style="color: var(--success);">✓ ${completedAudits} Tamamlandı</span>
                    <span style="color: var(--warning);">● ${activeAudits} Aktif</span>
                </div>
            </div>
            
            <div class="card">
                <h4 style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.75rem;">Toplam Bulgu</h4>
                <p style="font-size: 2.5rem; font-weight: 700; color: var(--danger);">${totalFindings}</p>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.85rem;">
                    <span style="color: var(--danger);">◉ ${openFindings} Açık</span>
                    <span style="color: var(--success);">✓ ${closedFindings} Kapalı</span>
                </div>
            </div>
            
            <div class="card">
                <h4 style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.75rem;">Risk Dağılımı</h4>
                <div style="margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.85rem;">Kritik</span>
                        <span style="font-weight: 600; color: #991b1b;">${kritikFindings}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.85rem;">Yüksek</span>
                        <span style="font-weight: 600; color: #ef4444;">${highRiskFindings}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.85rem;">Orta</span>
                        <span style="font-weight: 600; color: #f97316;">${mediumRiskFindings}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 0.85rem;">Düşük</span>
                        <span style="font-weight: 600; color: #eab308;">${lowRiskFindings}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <div class="card">
                <h3 style="margin-bottom: 1.5rem;">Denetim Durumu</h3>
                <div style="display: flex; gap: 2rem; align-items: center;">
                    <div style="flex: 1;">
                        <div style="position: relative; width: 200px; height: 200px; margin: 0 auto;">
                            <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" stroke-width="3"></circle>
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--success)" stroke-width="3" 
                                        stroke-dasharray="${(completedAudits / totalAudits * 100).toFixed(1)} 100"></circle>
                            </svg>
                            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                <span style="font-size: 2rem; font-weight: 700;">${((completedAudits / totalAudits) * 100).toFixed(0)}%</span>
                                <span style="font-size: 0.75rem; color: var(--text-light);">Tamamlandı</span>
                            </div>
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 12px; height: 12px; background: var(--success); border-radius: 50%;"></div>
                                <div style="flex: 1;">
                                    <div style="font-size: 0.85rem; color: var(--text-light);">Tamamlandı</div>
                                    <div style="font-weight: 600;">${completedAudits} Denetim</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 12px; height: 12px; background: var(--warning); border-radius: 50%;"></div>
                                <div style="flex: 1;">
                                    <div style="font-size: 0.85rem; color: var(--text-light);">Devam Ediyor</div>
                                    <div style="font-weight: 600;">${activeAudits} Denetim</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 12px; height: 12px; background: var(--primary); border-radius: 50%;"></div>
                                <div style="flex: 1;">
                                    <div style="font-size: 0.85rem; color: var(--text-light);">Planlandı</div>
                                    <div style="font-weight: 600;">${plannedAudits} Denetim</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="margin-bottom: 1.5rem;">Denetim Türleri</h3>
                ${typeStatsHtml}
            </div>
        </div>
    `;
}

window.saveAuditOpinion = function (auditId) {
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) return;

    const select = document.getElementById('audit-opinion-select');
    if (select) {
        audit.opinion = select.value;
        saveToStorage();
        showToast('Denetim görüşü kaydedildi.', 'success');
        renderAuditDetail();
    }
};

function renderAuditDetail() {
    // Loose equality required since ID types (string/number) may vary
    const audit = state.audits.find(a => a.id == state.currentAuditId);

    if (!audit) {
        mainView.innerHTML = '<div class="card"><p>Denetim bulunamadı.</p></div>';
        return;
    }

    // Workflow Steps
    const steps = ['Taslak', 'Planlandı', 'Devam Ediyor', 'Gözden Geçirme', 'Tamamlandı'];
    const currentStepIndex = steps.indexOf(audit.status);

    const stepperHtml = `
        <div class="stepper">
            ${steps.map((step, index) => {
        let statusClass = '';
        if (index < currentStepIndex) statusClass = 'active completed';
        else if (index === currentStepIndex) statusClass = 'active current';

        return `
                    <div class="step ${statusClass}">
                        <div class="step-circle">
                            ${index < currentStepIndex ? '<i data-lucide="check" style="width: 16px;"></i>' : index + 1}
                        </div>
                        <span class="step-label">${step}</span>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    // Action Buttons Logic
    let actionButtons = '';
    if (audit.status === 'Taslak') {
        actionButtons = `<button class="btn btn-primary" onclick="updateAuditStatus('${audit.id}', 'Planlandı')">Planlamaya Al</button>`;
    } else if (audit.status === 'Planlandı') {
        actionButtons = `<button class="btn btn-primary" onclick="updateAuditStatus('${audit.id}', 'Devam Ediyor')">Denetimi Başlat</button>`;
    } else if (audit.status === 'Devam Ediyor') {
        actionButtons = `<button class="btn" style="background: #8b5cf6; color: white; font-weight: 600;" onclick="updateAuditStatus('${audit.id}', 'Gözden Geçirme')">
            <i data-lucide="send" style="width: 16px; margin-right: 0.5rem;"></i> Gözden Geçirmeye Gönder
        </button>`;
    } else if (audit.status === 'Gözden Geçirme') {
        actionButtons = `
            <button class="btn btn-secondary" onclick="updateAuditStatus('${audit.id}', 'Devam Ediyor')">Reddet (Geri Gönder)</button>
            <button class="btn btn-primary" onclick="updateAuditStatus('${audit.id}', 'Tamamlandı')">Onayla ve Kapat</button>
        `;
    }

    // Get findings for this audit
    const auditFindings = state.findings.filter(f => f.auditId === audit.id);

    const findingsHtml = auditFindings.length > 0 ? auditFindings.map(finding => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.75rem;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <h5 style="font-size: 0.95rem; font-weight: 600;">${finding.title}</h5>
                   <span style="font-size: 0.7rem; padding: 0.15rem 0.5rem; background: ${getRiskColor(finding.risk)}15; border-radius: 4px; color: ${getRiskColor(finding.risk)}; font-weight: 600;">${finding.risk}</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-light);">Aksiyon Tarihi: ${finding.dueDate} | Durum: ${finding.status}</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="viewFinding('${finding.id}')">Detay</button>
        </div>
    `).join('') : '<p style="color: var(--text-light); font-size: 0.9rem;">Bu denetimde henüz bulgu bulunmamaktadır.</p>';

    mainView.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="navigateTo('audits')" style="display: inline-flex; align-items: center;">
                <i data-lucide="arrow-left" style="width: 16px; margin-right: 0.5rem;"></i> Geri Dön
            </button>
        </div>
        
        <div class="card">
            ${stepperHtml}
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                <div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <h2>${audit.title}</h2>
                        ${audit.auditCode ? `<span style="font-size: 0.9rem; font-weight: 600; color: var(--primary); background: #f0fdf4; padding: 0.25rem 0.5rem; border-radius: 4px;">${audit.auditCode}</span>` : ''}
                        <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 500; background: ${getStatusColor(audit.status)}15; color: ${getStatusColor(audit.status)};">
                            ${audit.status}
                        </span>
                    </div>
                    <p style="color: var(--text-light); font-size: 0.9rem;">Tür: ${audit.type}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-icon" title="Raporu Yazdır / Önizle" onclick="window.generateAuditReportHTML('${audit.id}')" style="background: white; border: 1px solid var(--border); color: var(--text-main);">
                        <i data-lucide="printer" style="width: 18px;"></i>
                    </button>
                    ${actionButtons}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Planlanan Başlangıç</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${formatDate(audit.startDate)}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Planlanan Bitiş</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${formatDate(audit.endDate)}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Planlanan Süre</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${calculateDuration(audit.startDate, audit.endDate)} gün</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Gerçekleşen Başlangıç</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${formatDate(audit.actualStartDate || audit.startDate)}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Gerçekleşen Bitiş</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${formatDate(audit.actualEndDate || (audit.status === 'Tamamlandı' ? new Date().toISOString().split('T')[0] : '-'))}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Gerçekleşen Süre</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${audit.actualStartDate ? calculateDuration(audit.actualStartDate, audit.actualEndDate || new Date().toISOString().split('T')[0]) + ' gün' : '-'}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Denetim Ekibi</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${audit.team || 'Atanmamış'}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Gözetim Sorumlusu</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${audit.supervisor || 'Atanmamış'}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">İlerleme</h4>
                    <p style="font-size: 1rem; font-weight: 500;">${audit.progress || 0}%</p>
                </div>
            <!-- Timeline Grid End -->
            </div>
            
            <!-- Audit Opinion Section -->
            <div style="background: white; border: 1px solid var(--border); padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem; border-left: 4px solid var(--primary);">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <i data-lucide="award" style="width: 24px; color: var(--primary);"></i>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0;">Denetim Görüşü</h3>
                </div>
                <div style="display: flex; gap: 1rem; align-items: flex-end;">
                    <div style="flex: 1;">
                        <label class="form-label" style="font-weight: 500; margin-bottom: 0.5rem; display: block;">Görüş Türü</label>
                        <select id="audit-opinion-select" class="form-select" style="width: 100%;">
                            <option value="">Seçiniz...</option>
                            <option value="Etkin" ${audit.opinion === 'Etkin' ? 'selected' : ''}>Etkin (Kontroller makul güvence sağlamaktadır)</option>
                            <option value="Gelişime Açık" ${audit.opinion === 'Gelişime Açık' ? 'selected' : ''}>Gelişime Açık (Bazı eksiklikler bulunmaktadır)</option>
                            <option value="Yetersiz" ${audit.opinion === 'Yetersiz' ? 'selected' : ''}>Yetersiz (Kritik riskler/zafiyetler mevcuttur)</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="window.saveAuditOpinion('${audit.id}')">
                        <i data-lucide="save" style="width: 16px; margin-right: 0.5rem;"></i> Kaydet
                    </button>
                </div>
                ${audit.opinion ? `<div style="margin-top: 0.75rem; font-size: 0.9rem; color: var(--text-light);"><i data-lucide="info" style="width: 14px; display: inline; margin-right: 4px;"></i> Bu görüş raporda yer alacaktır.</div>` : ''}
            </div>

            <!-- Final Report Section (visible when completed) -->
            ${audit.status === 'Tamamlandı' ? `
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #6ee7b7; padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <i data-lucide="file-check" style="width: 28px; color: #059669;"></i>
                    <div style="font-weight: 600; color: #059669; font-size: 1.1rem;">Denetim Raporu</div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <!-- PDF Rapor -->
                    <div style="background: white; border-radius: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <i data-lucide="file-text" style="width: 20px; color: #ef4444;"></i>
                            <span style="font-weight: 600; font-size: 0.9rem;">PDF Rapor</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn" style="flex: 1; background: #fef2f2; color: #ef4444; border: 1px solid #ef4444; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.previewAuditReportPDF('${audit.id}')">
                                <i data-lucide="eye" style="width: 14px;"></i> Görüntüle
                            </button>
                            <button class="btn" style="flex: 1; background: #ef4444; color: white; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.generateAuditReportPDF('${audit.id}')">
                                <i data-lucide="download" style="width: 14px;"></i> İndir
                            </button>
                        </div>
                    </div>
                    
                    <!-- Word/HTML Rapor -->
                    <div style="background: white; border-radius: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <i data-lucide="file-type" style="width: 20px; color: #3b82f6;"></i>
                            <span style="font-weight: 600; font-size: 0.9rem;">Word Rapor</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn" style="flex: 1; background: #eff6ff; color: #3b82f6; border: 1px solid #3b82f6; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.generateAuditReportHTML('${audit.id}')">
                                <i data-lucide="eye" style="width: 14px;"></i> Görüntüle
                            </button>
                            <button class="btn" style="flex: 1; background: #3b82f6; color: white; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.downloadAuditReportHTML('${audit.id}')">
                                <i data-lucide="download" style="width: 14px;"></i> İndir
                            </button>
                        </div>
                    </div>
                    
                    <!-- İmzalı Rapor -->
                    <div style="background: white; border-radius: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <i data-lucide="pen-tool" style="width: 20px; color: #10b981;"></i>
                            <span style="font-weight: 600; font-size: 0.9rem;">İmzalı Rapor</span>
                        </div>
                        ${audit.finalReport ? `
                            <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.5rem;">${audit.finalReport.fileName}</div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn" style="flex: 1; background: #f0fdf4; color: #10b981; border: 1px solid #10b981; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.viewFinalReport('${audit.id}')">
                                    <i data-lucide="eye" style="width: 14px;"></i> Görüntüle
                                </button>
                                <button class="btn" style="flex: 1; background: #10b981; color: white; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.downloadFinalReport('${audit.id}')">
                                    <i data-lucide="download" style="width: 14px;"></i> İndir
                                </button>
                            </div>
                            <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem; padding: 0.3rem 0.5rem; font-size: 0.75rem;" onclick="window.uploadFinalReport('${audit.id}')">
                                <i data-lucide="refresh-cw" style="width: 12px;"></i> Güncelle
                            </button>
                        ` : `
                            <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.5rem;">Henüz yüklenmedi</div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn" style="flex: 1; background: #10b981; color: white; padding: 0.4rem 0.5rem; font-size: 0.8rem;" onclick="window.uploadFinalReport('${audit.id}')">
                                    <i data-lucide="upload" style="width: 14px;"></i> Yükle
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                <div class="history-header" onclick="toggleHistory(this)">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main);">
                        <i data-lucide="history" style="width: 16px;"></i> Süreç Geçmişi
                    </div>
                    <i data-lucide="chevron-down" class="history-arrow" style="width: 16px; margin-left: auto;"></i>
                </div>
                <div class="history-content">
                    <div class="log-list" style="margin-top: 1rem;">
                        ${state.logs.filter(l => l.targetType === 'Audit' && l.targetId == audit.id).map(log => `
                            <div style="display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                                <div style="font-size: 0.85rem; color: var(--text-light); min-width: 140px;">
                                    ${new Date(log.date).toLocaleString('tr-TR')}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; font-size: 0.9rem;">${log.action}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-light);">${log.details}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.25rem;">İşlem Yapan: ${log.user}</div>
                                </div>
                                ${log.changeData ? `
                                <div>
                                    <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="viewHistoryChanges('${log.id}')">
                                        <i data-lucide="eye" style="width: 14px; margin-right: 0.25rem;"></i>Değişimi Gör
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        `).join('') || '<p style="color: var(--text-light); font-size: 0.9rem;">Henüz kayıt bulunmamaktadır.</p>'}
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                <div style="display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem;">
                    <button class="audit-tab active" data-tab="findings" onclick="switchAuditTab('findings', '${audit.id}')" style="padding: 0.75rem 1.5rem; font-weight: 600; font-size: 0.95rem; border: none; background: none; cursor: pointer; border-bottom: 2px solid var(--primary); margin-bottom: -2px; color: var(--primary);">
                        <i data-lucide="alert-circle" style="width: 16px; margin-right: 0.5rem; display: inline;"></i> Bulgular (${auditFindings.length})
                    </button>
                    <button class="audit-tab" data-tab="workpapers" onclick="switchAuditTab('workpapers', '${audit.id}')" style="padding: 0.75rem 1.5rem; font-weight: 600; font-size: 0.95rem; border: none; background: none; cursor: pointer; color: var(--text-light);">
                        <i data-lucide="clipboard-list" style="width: 16px; margin-right: 0.5rem; display: inline;"></i> Çalışma Kağıtları
                    </button>
                    <button class="audit-tab" data-tab="attachments" onclick="switchAuditTab('attachments', '${audit.id}')" style="padding: 0.75rem 1.5rem; font-weight: 600; font-size: 0.95rem; border: none; background: none; cursor: pointer; color: var(--text-light);">
                        <i data-lucide="paperclip" style="width: 16px; margin-right: 0.5rem; display: inline;"></i> Rapor Ekleri
                    </button>
                </div>

                <!-- Findings Tab Panel -->
                <div id="tab-findings" class="tab-panel" style="display: block;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Bulgular</h3>
                        <button class="btn btn-primary" onclick="window.openModal('finding-modal', '${audit.id}', true)">
                            <i data-lucide="plus" style="width: 16px; margin-right: 0.5rem;"></i> Yeni Bulgu Ekle
                        </button>
                    </div>
                    ${findingsHtml}
                </div>

                <!-- Workpapers Tab Panel -->
                <div id="tab-workpapers" class="tab-panel" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Çalışma Kağıtları</h3>
                        <button class="btn btn-primary" onclick="window.openAddWorkpaperModal('${audit.id}')">
                            <i data-lucide="plus" style="width: 16px; margin-right: 0.5rem;"></i> Yeni Çalışma Kağıdı
                        </button>
                    </div>
                    <div id="workpapers-list-${audit.id}">
                        ${renderWorkpapersContent(audit.id)}
                    </div>
                </div>

                <!-- Report Attachments Tab Panel -->
                <div id="tab-attachments" class="tab-panel" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Rapor Ekleri</h3>
                        <button class="btn btn-primary" onclick="window.openAddAttachmentModal('${audit.id}')">
                            <i data-lucide="plus" style="width: 16px; margin-right: 0.5rem;"></i> Yeni Ek Ekle
                        </button>
                    </div>
                    <div id="attachments-list-${audit.id}">
                        ${renderAttachmentsContent(audit.id)}
                    </div>
                </div>
            </div>

        </div>
    `;
    lucide.createIcons();
}

// Render Workpapers Content
function renderWorkpapersContent(auditId) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit) return '';

    const workpapers = audit.workpapers || [];

    if (workpapers.length === 0) {
        return `
            <div style="text-align: center; padding: 3rem 2rem; color: var(--text-light); background: #f9fafb; border-radius: 0.75rem;">
                <i data-lucide="clipboard-list" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.4;"></i>
                <p style="font-size: 1rem; margin-bottom: 0.5rem;">Henüz çalışma kağıdı eklenmemiş</p>
                <p style="font-size: 0.85rem;">Test prosedürlerini ve kontrol adımlarını buraya ekleyebilirsiniz.</p>
            </div>
        `;
    }

    return workpapers.map((wp, index) => `
        <div style="border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <h4 style="font-size: 1rem; font-weight: 600;">${wp.title}</h4>
                        <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 999px; font-weight: 500; background: ${getWorkpaperStatusColor(wp.status)}15; color: ${getWorkpaperStatusColor(wp.status)};">${wp.status}</span>
                        ${wp.result ? `<span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 999px; font-weight: 500; background: ${getWorkpaperResultColor(wp.result)}15; color: ${getWorkpaperResultColor(wp.result)};">${wp.result}</span>` : ''}
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.5rem;">${wp.procedure || '-'}</p>
                    ${wp.notes ? `<p style="font-size: 0.85rem; color: var(--text-light); font-style: italic;"><strong>Not:</strong> ${wp.notes}</p>` : ''}
                    ${wp.evidence && wp.evidence.length > 0 ? `
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                            ${wp.evidence.map(e => `<span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #f3f4f6; border-radius: 4px;"><i data-lucide="file" style="width: 12px; display: inline;"></i> ${e.name}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="padding: 0.35rem 0.5rem;" onclick="window.editWorkpaper('${auditId}', ${index})"><i data-lucide="edit" style="width: 14px;"></i></button>
                    <button class="btn" style="padding: 0.35rem 0.5rem; background: #ef4444; color: white;" onclick="window.deleteWorkpaper('${auditId}', ${index})"><i data-lucide="trash-2" style="width: 14px;"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// Switch Tab Function
window.switchAuditTab = function (tabName, auditId) {
    // Update tab buttons
    document.querySelectorAll('.audit-tab').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.style.borderBottom = '2px solid var(--primary)';
            tab.style.color = 'var(--primary)';
            tab.classList.add('active');
        } else {
            tab.style.borderBottom = 'none';
            tab.style.color = 'var(--text-light)';
            tab.classList.remove('active');
        }
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    lucide.createIcons();
};

// Workpaper Status Color
function getWorkpaperStatusColor(status) {
    switch (status) {
        case 'Başlanmadı': return '#6b7280';
        case 'Devam Ediyor': return '#3b82f6';
        case 'Tamamlandı': return '#10b981';
        default: return '#6b7280';
    }
}

// Workpaper Result Color
function getWorkpaperResultColor(result) {
    switch (result) {
        case 'Uygun': return '#10b981';
        case 'Uygun Değil': return '#ef4444';
        case 'Kısmen Uygun': return '#f59e0b';
        default: return '#6b7280';
    }
}



window.updateAuditStatus = function (auditId, newStatus) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit) return;

    // Validation: Check for findings without department response before moving to Review or Completed
    if (newStatus === 'Gözden Geçirme' || newStatus === 'Tamamlandı') {
        const incompleteFindings = state.findings.filter(f => f.auditId === auditId && !f.departmentResponse);
        if (incompleteFindings.length > 0) {
            showToast('Tüm bulgular için Birim Cevabı girilmeden denetim durumu ilerletilemez.', 'error');
            return;
        }
    }

    // Confirmation Dialog
    const confirmTitle = 'Durum Değişikliği';
    const confirmMessage = `Denetim durumunu "${audit.status}" -> "${newStatus}" olarak değiştirmek istediğinize emin misiniz?`;
    let confirmBtnText = 'Değiştir';
    let confirmBtnColor = 'var(--primary)';

    if (newStatus === 'Gözden Geçirme') {
        confirmBtnText = 'Gönder';
        confirmBtnColor = 'var(--review)';
    } else if (newStatus === 'Tamamlandı') {
        confirmBtnText = 'Tamamla';
        confirmBtnColor = 'var(--success)';
    }

    showConfirmDialog(confirmTitle, confirmMessage, () => {
        const oldStatus = audit.status;
        audit.status = newStatus;

        // Auto update progress based on status
        if (newStatus === 'Taslak') audit.progress = 0;
        if (newStatus === 'Planlandı') audit.progress = 10;
        if (newStatus === 'Devam Ediyor') audit.progress = 50;
        if (newStatus === 'Gözden Geçirme') audit.progress = 90;
        if (newStatus === 'Tamamlandı') audit.progress = 100;

        addLog('Durum Değişikliği', `Denetim durumu "${oldStatus}" -> "${newStatus}" olarak güncellendi.`, 'Audit', audit.id);
        saveToStorage();
        showToast(`Denetim durumu güncellendi`, 'success');
        renderAuditDetail();
    }, confirmBtnText, confirmBtnColor);
}

// Filter Audits
// Filter Audits
window.filterAudits = function () {
    const statusFilter = document.getElementById('status-filter')?.value;
    const inspectorFilter = document.getElementById('inspector-filter')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('year-filter')?.value;
    const typeFilter = document.getElementById('type-filter')?.value;
    const searchTerm = document.getElementById('audit-search')?.value.toLowerCase() || '';

    const audits = document.querySelectorAll('.audit-item');
    audits.forEach(audit => {
        const status = audit.getAttribute('data-status');
        const title = audit.getAttribute('data-title');
        const type = audit.getAttribute('data-type');
        const team = audit.getAttribute('data-team');
        const supervisor = audit.getAttribute('data-supervisor');
        const year = audit.getAttribute('data-year');

        let statusMatch = !statusFilter || statusFilter === 'Tüm Durumlar' || status === statusFilter;
        let inspectorMatch = !inspectorFilter || team.includes(inspectorFilter) || supervisor.includes(inspectorFilter);
        let yearMatch = !yearFilter || yearFilter === 'Tüm Yıllar' || year === yearFilter;
        let typeMatch = !typeFilter || typeFilter === 'Tüm Türler' || type === typeFilter.toLowerCase();
        let searchMatch = !searchTerm ||
            title.includes(searchTerm) ||
            type.includes(searchTerm);

        audit.style.display = (statusMatch && inspectorMatch && yearMatch && typeMatch && searchMatch) ? 'flex' : 'none';
    });
}

function renderAudits() {
    // Safety check - filter out any corrupted data
    const validAudits = (state.audits || []).filter(a => a && a.id && a.title);

    // Get unique years for filter (with null safety)
    const years = [...new Set(validAudits.map(a => (a.startDate || '').split('-')[0]).filter(y => y))].sort().reverse();
    // Get unique types for filter (with null safety)
    const types = [...new Set(validAudits.map(a => a.type || '').filter(t => t))].sort();

    // Render all audits with data attributes for filtering
    const listHtml = validAudits.map(audit => `
    <div class="audit-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid var(--border);" 
        data-status="${audit.status || ''}" 
        data-title="${(audit.title || '').toLowerCase()}" 
        data-type="${(audit.type || '').toLowerCase()}" 
        data-team="${(audit.team || '').toLowerCase()}" 
        data-supervisor="${audit.supervisor ? audit.supervisor.toLowerCase() : ''}"
        data-year="${(audit.startDate || '').split('-')[0] || ''}">
        <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                <h4 style="font-size: 1.1rem;">${audit.title || 'Başlıksız'}</h4>
                ${audit.auditCode ? `<span style="font-size: 0.8rem; font-weight: 600; color: var(--primary); background: #f0fdf4; padding: 0.1rem 0.5rem; border-radius: 4px;">${audit.auditCode}</span>` : ''}
                <span style="font-size: 0.75rem; padding: 0.1rem 0.5rem; background: #f3f4f6; border-radius: 4px; color: #4b5563;">${audit.type || '-'}</span>
            </div>
            <div style="display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--text-light);">
                <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="calendar" style="width: 14px;"></i> ${formatDate(audit.startDate)} - ${formatDate(audit.endDate)}</span>
                <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="users" style="width: 14px;"></i> ${audit.team || '-'}</span>
                ${audit.supervisor ? `<span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="user-check" style="width: 14px;"></i> ${audit.supervisor}</span>` : ''}
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
            <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; background: ${getStatusColor(audit.status)}15; color: ${getStatusColor(audit.status)};">
                ${audit.status}
            </span>
            <div style="display: flex; gap: 0.5rem;">
                <!-- Updated Buttons to ensure ID is passed correctly, converted to string if needed -->
                <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.viewAudit('${audit.id}')">İncele</button>
                <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.editAudit('${audit.id}')">Düzenle</button>
                <button class="btn" style="padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #ef4444; color: white;" onclick="window.deleteAudit('${audit.id}')">Sil</button>
            </div>
        </div>
    </div>
    `).join('');

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Denetim Listesi</h3>
                <button class="btn btn-primary" onclick="openModal('audit-modal', null, true)">
                    <i data-lucide="plus" style="width: 18px; margin-right: 0.5rem;"></i> Yeni Denetim
                </button>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <select class="form-select" style="width: 120px;" id="year-filter" onchange="filterAudits()">
                    <option>Tüm Yıllar</option>
                    ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
                <select class="form-select" style="width: 150px;" id="status-filter" onchange="filterAudits()">
                    <option>Tüm Durumlar</option>
                    <option>Planlandı</option>
                    <option>Devam Ediyor</option>
                    <option>Tamamlandı</option>
                </select>
                <select class="form-select" style="width: 130px;" id="type-filter" onchange="filterAudits()">
                    <option>Tüm Türler</option>
                    ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <input type="text" class="form-input" id="inspector-filter" placeholder="Müfettiş ara..." style="width: 200px;" oninput="filterAudits()">
                <input type="text" class="form-input" id="audit-search" placeholder="Denetim adı ara..." style="width: 250px;" oninput="filterAudits()">
            </div>

            <div>${listHtml}</div>
    `;
    lucide.createIcons();
}

// Filter Findings
window.filterFindings = function () {
    const statusFilter = document.getElementById('status-filter')?.value;
    const yearFilter = document.getElementById('year-filter')?.value;
    const typeFilter = document.getElementById('type-filter')?.value;
    const inspectorFilter = document.getElementById('inspector-filter')?.value.toLowerCase() || '';
    const searchTerm = document.getElementById('finding-search')?.value.toLowerCase() || '';

    const findings = document.querySelectorAll('.finding-item');
    findings.forEach(finding => {
        const status = finding.getAttribute('data-status');
        const title = finding.getAttribute('data-title');
        const year = finding.getAttribute('data-year');
        const type = finding.getAttribute('data-type'); // Audit type
        const team = finding.getAttribute('data-team');
        const supervisor = finding.getAttribute('data-supervisor');
        const auditTitle = finding.getAttribute('data-audit-title');

        let statusMatch = !statusFilter || statusFilter === 'Tüm Durumlar' || status === statusFilter;
        let yearMatch = !yearFilter || yearFilter === 'Tüm Yıllar' || year === yearFilter;
        let typeMatch = !typeFilter || typeFilter === 'Tüm Türler' || type === typeFilter.toLowerCase();
        let inspectorMatch = !inspectorFilter || team.includes(inspectorFilter) || supervisor.includes(inspectorFilter);
        let searchMatch = !searchTerm ||
            title.includes(searchTerm) ||
            auditTitle.includes(searchTerm);

        finding.style.display = (statusMatch && yearMatch && typeMatch && inspectorMatch && searchMatch) ? 'flex' : 'none';
    });
}

function renderFindings() {
    // Get unique years for filter
    const years = [...new Set(state.audits.map(a => a.startDate.split('-')[0]))].sort().reverse();
    // Get unique types for filter
    const types = [...new Set(state.audits.map(a => a.type))].sort();

    const listHtml = state.findings.map(finding => {
        const audit = state.audits.find(a => a.id === finding.auditId);
        const auditTitle = audit ? audit.title.toLowerCase() : '';
        const auditYear = audit ? audit.startDate.split('-')[0] : '';
        const auditTeam = audit ? audit.team.toLowerCase() : '';
        const auditSupervisor = audit ? (audit.supervisor || '').toLowerCase() : '';
        // Assuming current user is creator for now or finding has a 'creator' field.
        // For visual, let's use audit team as "Müfettiş"
        const inspectorName = audit ? audit.team : 'Bilinmeyen';

        return `
        <div class="finding-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid var(--border);" 
            data-risk="${finding.risk}" 
            data-title="${finding.title.toLowerCase()}" 
            data-status="${finding.status}"
            data-audit-title="${auditTitle}"
            data-year="${auditYear}"
            data-type="${audit ? audit.type.toLowerCase() : ''}"
            data-team="${auditTeam}"
            data-supervisor="${auditSupervisor}">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                    <h4 style="font-size: 1.1rem;">${finding.title}</h4>
                    <span style="font-size: 0.75rem; padding: 0.1rem 0.5rem; background: ${getRiskColor(finding.risk)}15; border-radius: 4px; color: ${getRiskColor(finding.risk)}; font-weight: 600;">${finding.risk}</span>
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-light);">
                    <span><span style="font-weight: 500;">Denetim:</span> ${audit ? audit.title : 'Bilinmeyen'}</span>
                    <span><span style="font-weight: 500;">Müfettiş:</span> ${inspectorName}</span>
                    <span><span style="font-weight: 500;">Aksiyon Tarihi:</span> ${formatDate(finding.dueDate)}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; background: ${getFindingStatusColor(finding.status)}15; color: ${getFindingStatusColor(finding.status)};">
                    ${finding.status}
                </span>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.viewFinding('${finding.id}')">İncele</button>
                    <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.editFinding('${finding.id}')">Düzenle</button>
                    <button class="btn" style="padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #ef4444; color: white;" onclick="window.deleteFinding('${finding.id}')">Sil</button>
                </div>
            </div>
        </div>
    `}).join('');

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Bulgular</h3>
                <button class="btn btn-primary" onclick="openModal('finding-modal', null, true)">
                    <i data-lucide="plus" style="width: 18px; margin-right: 0.5rem;"></i> Yeni Bulgu
                </button>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <select class="form-select" style="width: 120px;" id="year-filter" onchange="filterFindings()">
                    <option>Tüm Yıllar</option>
                    ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
                <select class="form-select" style="width: 150px;" id="status-filter" onchange="filterFindings()">
                    <option>Tüm Durumlar</option>
                    <option value="Taslak">Taslak</option>
                    <option value="Açık">Açık</option>
                    <option value="Onayda">Onayda</option>
                    <option value="Onaylandı">Onaylandı</option>
                    <option value="Tebliğ Edildi">Tebliğ Edildi</option>
                    <option value="Cevaplandı">Cevaplandı</option>
                    <option value="Düzeltme İstendi">Düzeltme İstendi</option>
                    <option value="Mutabık Değil">Mutabık Değil</option>
                    <option value="Takipte">Takipte</option>
                    <option value="Kapalı">Kapalı</option>
                    <option value="Kapalı (Mutabık Değil)">Kapalı (Mutabık Değil)</option>
                </select>
                <select class="form-select" style="width: 130px;" id="type-filter" onchange="filterFindings()">
                    <option>Tüm Türler</option>
                    ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <input type="text" class="form-input" id="inspector-filter" placeholder="Müfettiş ara..." style="width: 200px;" oninput="filterFindings()">
                <input type="text" class="form-input" id="finding-search" placeholder="Bulgu veya Denetim ara..." style="width: 250px;" oninput="filterFindings()">
            </div>

            <div>${listHtml}</div>
        </div>

    `;
    lucide.createIcons();
}

// Calculate duration between two dates in days
// Helper to format date to DD.MM.YYYY
window.formatDate = function (dateString) {
    if (!dateString || dateString === '-') return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    } catch (e) {
        return dateString;
    }
};

function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Get finding notification and response dates from logs
function getFindingDatesFromLogs(findingId) {
    const findingLogs = state.logs.filter(l => l.targetType === 'Finding' && l.targetId === findingId);

    // Find "Tebliğ Edildi" log for notification date
    const notificationLog = findingLogs.find(l => l.action === 'Tebliğ Edildi');

    // Find response log (Birim cevabı veya Cevaplandı)
    const responseLog = findingLogs.find(l =>
        l.action.includes('Cevap') ||
        l.action.includes('Birim Yanıtı') ||
        l.details.includes('cevap')
    );

    return {
        notificationDate: notificationLog ? notificationLog.date : null,
        responseDate: responseLog ? responseLog.date : null
    };
}

// Calculate response time in days
function calculateResponseTime(findingId) {
    const dates = getFindingDatesFromLogs(findingId);
    if (!dates.notificationDate || !dates.responseDate) return null;

    const notification = new Date(dates.notificationDate);
    const response = new Date(dates.responseDate);
    const diffTime = Math.abs(response - notification);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getStatusColor(status) {
    if (status === 'Tamamlandı') return 'var(--success)';
    if (status === 'Devam Ediyor') return 'var(--warning)';
    if (status === 'Planlandı') return 'var(--info)';
    if (status === 'Taslak') return 'var(--draft)';
    if (status === 'Gözden Geçirme') return 'var(--review)';
    return 'var(--primary)';
}

function getRiskColor(risk) {
    if (risk === 'Kritik') return '#991b1b';
    if (risk === 'Yüksek') return '#ef4444';
    if (risk === 'Orta') return '#f97316';
    if (risk === 'Düşük') return '#eab308';
    return '#eab308';
}

function getFindingStatusColor(status) {
    if (status === 'Açık') return '#ef4444'; // Red
    if (status === 'Kapalı') return '#10b981'; // Green
    if (status === 'Kısmen Açık') return '#f97316'; // Orange
    if (status === 'Düzeltmeye Kapalı') return '#6b7280'; // Gray
    return '#6b7280';
}

// Modal Functions
// Modal Functions
// Consolidated Modal Logic
window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
        // Optional: Reset on close to be safe? 
        // No, let openModal handle reset logic to avoid clearing data user might want to keep temporarily?
        // Actually best practice is to clear on open if it's new.
    }
}

window.openModal = function (modalId, auditId = null, forceReset = false) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const form = modal.querySelector('form');

        // Logic to determine if we should reset the form
        // 1. If forceReset is true (Explicit "New" button click)
        // 2. If it's finding-modal and auditId is provided (New Finding for Audit)
        // 3. If we can detect it's a "New" operation (e.g. no existing ID in hidden field - but that might be dirty from previous edit)

        let shouldReset = forceReset || (modalId === 'finding-modal' && auditId);

        if (shouldReset && form) {
            form.reset();
            const idInput = form.querySelector('input[name="id"]');
            if (idInput) idInput.value = ''; // Ensure ID is clear

            // Set Titles for "New" context
            const titleEl = modal.querySelector('.modal-title');
            const submitBtn = modal.querySelector('button[type="submit"]');

            if (modalId === 'audit-modal') {
                if (titleEl) titleEl.textContent = 'Yeni Denetim Oluştur';
                if (submitBtn) submitBtn.textContent = 'Oluştur';
            } else if (modalId === 'finding-modal') {
                if (titleEl) titleEl.textContent = 'Yeni Bulgu Ekle';
                if (submitBtn) submitBtn.textContent = 'Oluştur';

                // Hide Due Date for new findings
                const dueDateInput = form.querySelector('[name="dueDate"]');
                if (dueDateInput) {
                    const group = dueDateInput.closest('.form-group');
                    if (group) group.style.display = 'none';
                }
            } else if (modalId === 'action-modal') {
                if (titleEl) titleEl.textContent = 'Yeni Aksiyon Ekle';
            }
        }

        // Dropdown Population Logic (Always run to ensure data is fresh)
        if (modalId === 'finding-modal') {
            const select = modal.querySelector('select[name="auditId"]');
            const selectGroup = select ? select.closest('.form-group') : null;

            // Remove any existing audit name display
            const existingDisplay = modal.querySelector('#audit-name-display');
            if (existingDisplay) existingDisplay.remove();

            if (select) {
                // Ensure audits are loaded
                if ((!state.audits || state.audits.length === 0) && localStorage.getItem('audit_audits')) {
                    try { state.audits = JSON.parse(localStorage.getItem('audit_audits')); }
                    catch (e) { console.error('Error reloading audits', e); }
                }

                select.innerHTML = '<option value="">Denetim Seçin</option>' +
                    (state.audits || []).map(a => `<option value="${a.id}" ${auditId && auditId == a.id ? 'selected' : ''}>${a.title}</option>`).join('');

                if (auditId) {
                    select.value = auditId;
                    select.style.display = 'none'; // Hide dropdown

                    // Show audit name as static text
                    const audit = state.audits.find(a => a.id == auditId);
                    if (selectGroup && audit) {
                        const displayDiv = document.createElement('div');
                        displayDiv.id = 'audit-name-display';
                        displayDiv.style.cssText = 'padding: 0.75rem; background: #f3f4f6; border-radius: 8px; font-weight: 500; color: #374151;';
                        displayDiv.innerHTML = '<i data-lucide="file-text" style="width: 14px; display: inline; vertical-align: middle; margin-right: 0.5rem;"></i>' + audit.title;
                        select.parentNode.insertBefore(displayDiv, select.nextSibling);
                        lucide.createIcons();
                    }
                } else {
                    // Show dropdown for manual selection (from Bulgular page)
                    select.style.display = 'block';
                }
            }
        }

        // Populate staff dropdowns for audit-modal
        if (modalId === 'audit-modal') {
            const teamSelect = document.getElementById('audit-team-select');
            const supervisorSelect = document.getElementById('audit-supervisor-select');

            if (teamSelect && supervisorSelect && state.staff) {
                const activeStaff = state.staff.filter(s => s.status === 'Aktif');

                // Populate team dropdown (all active staff)
                teamSelect.innerHTML = '<option value="">Müfettiş Seçin</option>' +
                    activeStaff.map(s => `<option value="${s.name}">${s.name} (${s.title})</option>`).join('');

                // Populate supervisor dropdown (all active staff)
                supervisorSelect.innerHTML = '<option value="">Gözetim Sorumlusu Seçin (Opsiyonel)</option>' +
                    activeStaff.map(s => `<option value="${s.name}">${s.name} (${s.title})</option>`).join('');

                // Add validation: same person can't be both team and supervisor
                teamSelect.addEventListener('change', function () {
                    const selectedTeam = this.value;
                    Array.from(supervisorSelect.options).forEach(opt => {
                        if (opt.value && opt.value === selectedTeam) {
                            opt.disabled = true;
                            opt.text = opt.text.replace(' (Müfettiş olarak atandı)', '') + ' (Müfettiş olarak atandı)';
                        } else {
                            opt.disabled = false;
                            opt.text = opt.text.replace(' (Müfettiş olarak atandı)', '');
                        }
                    });
                    // Clear supervisor if same person was selected
                    if (supervisorSelect.value === selectedTeam) {
                        supervisorSelect.value = '';
                    }
                });

                supervisorSelect.addEventListener('change', function () {
                    const selectedSupervisor = this.value;
                    Array.from(teamSelect.options).forEach(opt => {
                        if (opt.value && opt.value === selectedSupervisor) {
                            opt.disabled = true;
                            opt.text = opt.text.replace(' (Gözetim Sorumlusu olarak atandı)', '') + ' (Gözetim Sorumlusu olarak atandı)';
                        } else {
                            opt.disabled = false;
                            opt.text = opt.text.replace(' (Gözetim Sorumlusu olarak atandı)', '');
                        }
                    });
                    // Clear team if same person was selected
                    if (teamSelect.value === selectedSupervisor) {
                        teamSelect.value = '';
                    }
                });
            }
        }

        modal.classList.add('open');
    }
}

window.addAction = function (findingId) {
    showToast('Aksiyon ekleme özelliği yakında aktif olacak', 'info');
};

window.openConciliationModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        showToast('Bulgu bulunamadı', 'error');
        return;
    }

    // Get tomorrow's date as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    showConfirmDialog(
        'Bulguya Cevap ve Aksiyon Ekle',
        `<form id="resp-form">
            <div style="margin-bottom:1.25rem">
                <label style="display:block;margin-bottom:0.5rem;font-weight:600;color:#374151">Birim Cevabı *</label>
                <textarea id="resp-text" required rows="3" style="width:100%;padding:0.75rem;border:1px solid #d1d5db;border-radius:0.5rem;font-size:0.9rem" placeholder="Bulguya verilecek cevabı yazınız..."></textarea>
            </div>
            
            <div style="margin-bottom:1.25rem">
                <label style="display:block;margin-bottom:0.5rem;font-weight:600;color:#374151">Kanıt Yükle</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="evidence-file" class="file-upload-input" multiple>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Dosyaları seçmek için tıklayın veya sürükleyin</span>
                        <span class="file-upload-hint">PDF, Word, Excel, Resim</span>
                    </div>
                </div>
                <div id="evidence-file-list" style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.25rem;font-size:0.8rem;color:#374151"></div>
            </div>
            
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:0.5rem;padding:1rem;margin-bottom:1rem">
                <div style="font-weight:600;color:#166534;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem">
                    <i data-lucide="clipboard-check" style="width:16px"></i> Düzeltici Aksiyon (CAPA)
                </div>
                
                <div style="margin-bottom:0.75rem">
                    <label style="display:block;margin-bottom:0.35rem;font-weight:500;font-size:0.875rem;color:#374151">Yapılacak İş *</label>
                    <textarea id="action-desc" required rows="2" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:0.375rem;font-size:0.875rem" placeholder="Düzeltici aksiyonu tanımlayın..."></textarea>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                    <div>
                        <label style="display:block;margin-bottom:0.35rem;font-weight:500;font-size:0.875rem;color:#374151">Sorumlu *</label>
                        <input type="text" id="action-resp" required style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:0.375rem;font-size:0.875rem" placeholder="Ad Soyad">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:0.35rem;font-weight:500;font-size:0.875rem;color:#374151">Aksiyon Tarihi *</label>
                        <input type="date" id="action-date" required value="${defaultDate}" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:0.375rem;font-size:0.875rem">
                    </div>
                </div>
            </div>
            
            <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.75rem;border-radius:0.5rem;font-size:0.8rem;color:#1e40af;display:flex;align-items:center;gap:0.5rem">
                <i data-lucide="info" style="width:14px;flex-shrink:0"></i>
                Aksiyon tarihi, bulgunun takip tarihi olarak kullanılacaktır.
            </div>
        </form>`,
        () => {
            const response = document.getElementById('resp-text').value;
            const actionDesc = document.getElementById('action-desc').value;
            const actionResp = document.getElementById('action-resp').value;
            const actionDate = document.getElementById('action-date').value;

            if (response && actionDesc && actionResp && actionDate) {
                // Get fresh reference from state to ensure persistence
                const findingIndex = state.findings.findIndex(f => f.id == findingId);
                if (findingIndex === -1) {
                    showToast('Bulgu bulunamadı!', 'error');
                    return;
                }
                const targetFinding = state.findings[findingIndex];

                // Save response
                targetFinding.departmentResponse = response;
                targetFinding.status = 'Cevaplandı';
                targetFinding.dueDate = actionDate; // Use action date as follow-up date

                // Add action
                if (!targetFinding.actions) targetFinding.actions = [];
                targetFinding.actions.push({
                    id: Date.now(),
                    description: actionDesc,
                    responsible: actionResp,
                    dueDate: actionDate,
                    status: 'Beklemede',
                    createdAt: new Date().toISOString(),
                    createdBy: 'Birim'
                });

                console.log('[DEBUG] Action added:', targetFinding.actions);

                addLog('Cevap ve Aksiyon Eklendi', 'Birim bulguya cevap verdi ve düzeltici aksiyon taahhüt etti.', 'Finding', targetFinding.id);

                // Store evidence file names (mock - actual files would go to server)
                const evidenceInput = document.getElementById('evidence-file');
                if (evidenceInput && evidenceInput.files.length > 0) {
                    if (!finding.evidence) finding.evidence = [];
                    for (let file of evidenceInput.files) {
                        finding.evidence.push({
                            id: Date.now() + Math.random(),
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            uploadedBy: 'Birim'
                        });
                    }
                }

                saveToStorage();
                showToast('Cevap ve aksiyon başarıyla kaydedildi!', 'success');

                // Always show finding detail to display new action in CAPA section
                viewFinding(finding.id);
            }
        },
        'Gönder',
        '#10b981'
    );

    // Refresh icons and add file change handler after dialog renders
    setTimeout(() => {
        lucide.createIcons();
        const fileInput = document.getElementById('evidence-file');
        const fileList = document.getElementById('evidence-file-list');
        if (fileInput && fileList) {
            fileInput.addEventListener('change', (e) => {
                fileList.innerHTML = Array.from(e.target.files).map(f =>
                    `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0.5rem;background:#f0fdf4;border-radius:4px;"><i data-lucide="file" style="width:12px;color:#16a34a"></i>${f.name}</div>`
                ).join('');
                lucide.createIcons();
            });
        }
    }, 100);
};

// NOTE: handleCreateAudit is defined at line ~552 (localStorage version)

window.editAudit = function (id) {
    console.log("✏️ editAudit called with ID:", id);

    // Robust ID comparison - convert to string
    let audit = state.audits.find(a => String(a.id) === String(id));

    // Fallback: Try loadFromStorage if not found
    if (!audit) {
        console.log("⚠️ Audit not found in state, trying loadFromStorage fallback...");
        const freshData = loadFromStorage();
        if (freshData && freshData.audits) {
            audit = freshData.audits.find(a => String(a.id) === String(id));
            if (audit) {
                state.audits = freshData.audits;
                console.log("✅ Audit found via localStorage fallback");
            }
        }
    }

    if (!audit) {
        showToast('Denetim bulunamadı! ID: ' + id, 'error');
        console.error("❌ Audit not found! ID:", id);
        return;
    }

    const modal = document.getElementById('audit-modal');
    if (!modal) {
        showToast('Denetim modalı bulunamadı', 'error');
        return;
    }

    const form = modal.querySelector('form');
    if (!form) {
        showToast('Denetim formu bulunamadı', 'error');
        return;
    }

    // Reset form first
    form.reset();

    // Store before state for change tracking
    window._editBeforeState = JSON.parse(JSON.stringify(audit));

    // Populate fields safely
    const setField = (name, value) => {
        const el = form.querySelector(`[name="${name}"]`);
        if (el) el.value = value || '';
    };

    setField('id', audit.id);
    setField('auditCode', audit.auditCode);
    setField('title', audit.title);
    setField('type', audit.type);
    setField('status', audit.status);
    setField('startDate', audit.startDate);
    setField('endDate', audit.endDate);
    setField('team', audit.team);
    setField('supervisor', audit.supervisor);

    // Update Modal Title
    const titleEl = modal.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = 'Denetim Düzenle';

    const submitBtn = modal.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Güncelle';

    openModal('audit-modal');
    console.log("✅ Audit modal opened for editing:", audit.title);
}

// Notify Finding (Tebliğ Et)
window.notifyFinding = function (findingId) {
    console.log("notifyFinding triggered for ID:", findingId);
    if (!state || !state.findings) {
        console.error("State or findings not initialized");
        return;
    }
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        console.error("Finding not found for ID:", findingId);
        showToast('Bulgu bulunamadı!', 'error');
        return;
    }

    // Onay kontrolü - sadece "Onaylandı" durumundaki bulgular tebliğ edilebilir
    if (!canNotifyFinding(finding.id)) {
        showConfirmDialog(
            'Tebliğ Edilemez',
            `<div style="text-align: left; margin-bottom: 2rem;">
                <p style="margin-bottom: 1rem;"><strong>"${finding.title}"</strong> bulgusunu tebliğ edemezsiniz.</p>
                <p style="color: #ef4444; font-weight: 500;">⚠ Bu bulgu henüz gözden geçiren tarafından onaylanmamış.</p>
                <p style="margin-top: 0.5rem; color: #6b7280;">Tebliğ edebilmek için önce bulgunun "Onaylandı" durumuna geçmesi gerekiyor.</p>
                <div style="margin-top: 1rem; padding: 0.75rem; background: #f3f4f6; border-radius: 0.5rem;">
                    <div style="font-size: 0.875rem; color: #4b5563;">
                        <strong>Mevcut Durum:</strong> <span style="color: ${getFindingStatusColor(finding.status)}; font-weight: 600;">${finding.status}</span>
                    </div>
                </div>
            </div>`,
            () => {
                // Kapanır
            },
            'Anladım',
            'var(--primary)'
        );
        return;
    }
    const departments = [
        'Bilgi Teknolojileri (IT)',
        'İnsan Kaynakları',
        'Finans',
        'Operasyon',
        'Pazarlama',
        'Satış',
        'Hukuk',
        'İç Kontrol'
    ];

    showConfirmDialog(
        'Bulgu Tebliğ Et',
        `<div style="margin-bottom: 1rem;">
            <p>"<strong>${finding.title}</strong>" bulgusunu hangi birime tebliğ etmek istiyorsunuz?</p>
        </div>
        <div class="form-group">
            <label class="form-label">Tebliğ Edilecek Birim *</label>
            <select id="notify-department" class="form-select" style="width:100%">
                ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem;">
            Durum 'Tebliğ Edildi' olarak güncellenecek ve seçilen birim ekranına düşecektir.
        </p>`,
        () => {
            const selectedDept = document.getElementById('notify-department').value;
            const oldStatus = finding.status;
            finding.status = 'Tebliğ Edildi';
            finding.assignedTo = selectedDept;
            finding.notifiedAt = new Date().toISOString();
            addFindingProcessLog(finding.id, 'Tebliğ Edildi', state.currentUserRole, `Birim: ${selectedDept}`);
            addLog('Tebliğ Edildi', `Bulgu "${selectedDept}" birimine tebliğ edildi.`, 'Finding', finding.id, state.currentUserRole, { old: { status: oldStatus }, new: { status: 'Tebliğ Edildi', assignedTo: selectedDept } });
            saveToStorage();
            showToast(`Bulgu "${selectedDept}" birimine tebliğ edildi.`, 'success');
            renderFindings();
        },
        'Tebliğ Et',
        'var(--primary)'
    );
}

    // View Finding Detail with Workflow Buttons and Process Log
    ;

window.editFinding = function (id) {
    console.log("✏️ editFinding called with ID:", id);

    // Robust ID comparison - convert to string
    let finding = state.findings.find(f => String(f.id) === String(id));

    // Fallback: Try loadFromStorage if not found
    if (!finding) {
        console.log("⚠️ Finding not found in state, trying loadFromStorage fallback...");
        const freshData = loadFromStorage();
        if (freshData && freshData.findings) {
            finding = freshData.findings.find(f => String(f.id) === String(id));
            if (finding) {
                state.findings = freshData.findings;
                console.log("✅ Finding found via localStorage fallback");
            }
        }
    }

    if (!finding) {
        showToast('Bulgu bulunamadı! ID: ' + id, 'error');
        console.error("❌ Finding not found! ID:", id);
        return;
    }

    const modal = document.getElementById('finding-modal');
    const form = modal.querySelector('form');

    // Reset form first
    form.reset();

    // Store before state for change tracking
    window._editBeforeState = JSON.parse(JSON.stringify(finding));

    // Populate fields
    form.querySelector('[name="id"]').value = finding.id;
    form.querySelector('[name="auditId"]').value = finding.auditId;
    form.querySelector('[name="findingCode"]').value = finding.findingCode || '';
    form.querySelector('[name="title"]').value = finding.title;
    form.querySelector('[name="risk"]').value = finding.risk;
    form.querySelector('[name="criterion"]').value = finding.criterion || '';
    form.querySelector('[name="content"]').value = finding.content || '';
    form.querySelector('[name="inspectorRecommendation"]').value = finding.inspectorRecommendation || '';
    // content of department response etc. should usually be read-only here or hidden if we want Strict flow
    // But for admin editing, we might leave them. 
    // User requested "Action Date" (dueDate) to be NOT set by Inspector during creation.
    // So we can hide/disable it here?
    // Let's hide date input row in Modal HTML (need to find where modal is defined in index.html, but we assume it's static?)
    // Actually the modal HTML is in index.html which we can't edit easily.
    // However, we can use JS to hide the field wrapper.

    // Attempt to hide Due Date field in this modal
    const dueDateInput = form.querySelector('[name="dueDate"]');
    if (dueDateInput) {
        // Find parent form-group to hide
        const group = dueDateInput.closest('.form-group');
        if (group) group.style.display = 'none';
    }

    // Also Populate other fields if they exist
    if (form.querySelector('[name="departmentResponse"]')) form.querySelector('[name="departmentResponse"]').value = finding.departmentResponse || '';
    if (form.querySelector('[name="remediationStatus"]')) form.querySelector('[name="remediationStatus"]').value = finding.remediationStatus || 'Açık';

    if (finding.agreement === 'yes') {
        const radio = form.querySelector('input[name="agreement"][value="yes"]');
        if (radio) radio.checked = true;
    } else {
        const radio = form.querySelector('input[name="agreement"][value="no"]');
        if (radio) radio.checked = true;
    }

    // Update Modal Title
    modal.querySelector('.modal-title').textContent = 'Bulgu Düzenle';
    modal.querySelector('button[type="submit"]').textContent = 'Güncelle';

    openModal('finding-modal');
}


// Helper for file input preview
window.updateFileLabel = function (input) {
    const previewContainer = document.getElementById('file-list-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-light); background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px;';
            fileItem.innerHTML = `<i data-lucide="file" style="width: 14px;"></i> ${file.name}`;
            previewContainer.appendChild(fileItem);
        });
        lucide.createIcons();
    }
}

window.handleCreateFinding = async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');

    // Handle File Uploads (Mock)
    const evidenceFiles = [];
    const fileInput = e.target.querySelector('input[name="evidence"]');
    if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            evidenceFiles.push({
                name: file.name,
                size: (file.size / 1024).toFixed(2) + ' KB',
                type: file.type,
                date: new Date().toLocaleDateString('tr-TR')
            });
        }
    }

    if (id) {
        // Edit existing finding
        const finding = state.findings.find(f => f.id == id);
        if (finding) {
            const beforeState = window._editBeforeState || JSON.parse(JSON.stringify(finding));

            finding.auditId = parseInt(formData.get('auditId'));
            finding.findingCode = formData.get('findingCode');
            finding.title = formData.get('title');
            finding.risk = formData.get('risk');
            finding.status = formData.get('remediationStatus'); // Sync status
            finding.dueDate = formData.get('dueDate');
            finding.criterion = formData.get('criterion');
            finding.content = formData.get('content');
            finding.inspectorRecommendation = formData.get('inspectorRecommendation');
            // Removed: departmentResponse and agreement from EDIT during creation phase usually
            // but if we are editing an existing one that has them, we might want to keep?
            // For now, let's just update what is in the form. If form doesn't have it, formData.get returns null.
            // If we want to preserve existing values if they are not in form, we should check null.

            // However, user said "remove from screen", implying they shouldn't be edited here.

            finding.remediationStatus = formData.get('remediationStatus');

            if (evidenceFiles.length > 0) {
                finding.evidence = [...(finding.evidence || []), ...evidenceFiles];
            }

            const afterState = JSON.parse(JSON.stringify(finding));
            addLog('Düzenlendi', `"${finding.title}" bulgusu düzenlendi.`, 'Finding', finding.id, 'Admin User', { before: beforeState, after: afterState });

            // Mark as modified if it was rejected
            if (finding.status === 'Düzeltme İstendi') {
                finding.modifiedAfterRejection = true;
            }

            delete window._editBeforeState;
            saveToStorage();
            closeModal('finding-modal');
            showToast('Bulgu başarıyla güncellendi!', 'success');

            if (state.currentPage === 'audit-detail' && state.currentAuditId == finding.auditId) {
                renderAuditDetail();
            } else {
                renderFindings();
            }
        }
    } else {
        // Create new finding
        console.log("Creating new finding...");
        try {
            const newFinding = await AuditAPI.createFinding({
                auditId: formData.get('auditId'),
                title: formData.get('title'),
                findingCode: formData.get('findingCode'), // Added missing field
                risk: formData.get('risk'),
                criterion: formData.get('criterion'),
                content: formData.get('content'),
                inspectorRecommendation: formData.get('inspectorRecommendation'),
                // departmentResponse: null, // Removed
                // agreement: null, // Removed
                dueDate: formData.get('dueDate'),
                status: 'Taslak', // Force default status to Draft as per workflow
                remediationStatus: formData.get('remediationStatus'),
                evidence: JSON.stringify(evidenceFiles)
            });

            await refreshData();
            addLog('Oluşturuldu', `"${newFinding.title}" bulgusu oluşturuldu.`, 'Finding', newFinding.id);
            closeModal('finding-modal');
            showToast('Bulgu başarıyla eklendi!', 'success');

            if (state.currentPage === 'audit-detail' && state.currentAuditId == newFinding.auditId) {
                renderAuditDetail();
            } else {
                renderFindings();
            }
        } catch (error) {
            console.error("Error creating finding:", error);
            showToast('Bulgu oluşturulurken hata oluştu!', 'error');
        }
    }
}

// Global Helper for Status Change


window.switchRole = function (role) {
    state.currentUserRole = role;
    showToast(`Rol değiştirildi: ${role}`, 'info');
    // Refresh dashboard or current view
    if (document.querySelector('.card h2')) { // If in detail view
        const findingTitle = document.querySelector('.card h2').textContent;
        const finding = state.findings.find(f => f.title === findingTitle);
        if (finding) viewFinding(finding.id);
    }
    renderDashboard();
}

// History Toggle
window.toggleHistory = function (header) {
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    content.classList.toggle('open');
}

// View History Changes - Show Before/After Diff
window.viewHistoryChanges = function (logId) {
    const log = state.logs.find(l => l.id == logId);
    if (!log || !log.changeData) {
        showToast('Değişim bilgisi bulunamadı', 'error');
        return;
    }

    const before = log.changeData.before || log.changeData.old || {};
    const after = log.changeData.after || log.changeData.new || {};

    // Define field labels for better display
    const fieldLabels = {
        title: 'Başlık',
        auditCode: 'Denetim Numarası',
        findingCode: 'Bulgu Numarası',
        type: 'Tür',
        status: 'Durum',
        risk: 'Risk Seviyesi',
        startDate: 'Başlangıç Tarihi',
        endDate: 'Bitiş Tarihi',
        dueDate: 'Aksiyon Tarihi',
        team: 'Ekip',
        supervisor: 'Gözetim Sorumlusu',
        auditId: 'Bağlı Denetim',
        criterion: 'Kriter-Dayanak',
        content: 'Bulgu İçeriği',
        inspectorRecommendation: 'Müfettiş Önerisi',
        departmentResponse: 'Birim Cevabı',
        remediationStatus: 'Düzeltme Durumu',
        agreement: 'Mutabakat'
    };

    // Create diff HTML
    let diffHtml = '';
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const ignoredKeys = ['id', 'progress', 'evidence']; // Fields to ignore

    allKeys.forEach(key => {
        if (ignoredKeys.includes(key)) return;

        const beforeValue = before[key] !== undefined ? String(before[key]) : '-';
        const afterValue = after[key] !== undefined ? String(after[key]) : '-';

        if (beforeValue !== afterValue) {
            const label = fieldLabels[key] || key;
            diffHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; background: #f9fafb;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">${label}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">Öncesi</div>
                            <div style="padding: 0.5rem; background: #fee; border-left: 3px solid #ef4444; border-radius: 0.25rem; word-wrap: break-word;">${beforeValue}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">Sonrası</div>
                            <div style="padding: 0.5rem; background: #efe; border-left: 3px solid #10b981; border-radius: 0.25rem; word-wrap: break-word;">${afterValue}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    if (!diffHtml) {
        diffHtml = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">Değişiklik tespit edilemedi.</p>';
    }

    // Create and show modal
    showConfirmDialog(
        'Değişiklik Detayları',
        diffHtml,
        () => { }, // No action needed
        'Kapat',
        'var(--primary)'
    );

    // Override confirm button to just close
    const confirmBtn = document.querySelector('.confirm-dialog button.btn-primary, .confirm-dialog button[style*="background: var(--primary)"]');
    if (confirmBtn) {
        confirmBtn.onclick = closeConfirmDialog;
    }

    // Re-initialize icons for the modal
    setTimeout(() => lucide.createIcons(), 100);
}

// View Log Detail - shows all log information
window.viewLogDetail = function (logId) {
    const log = state.logs.find(l => l.id == logId);
    if (!log) {
        showToast('Kayıt bulunamadı', 'error');
        return;
    }

    // Get target info if available
    let targetInfo = '';
    if (log.targetType === 'Audit' && log.targetId) {
        const audit = state.audits.find(a => a.id == log.targetId);
        if (audit) {
            targetInfo = `<div style="background: #eff6ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>İlgili Denetim:</strong> ${audit.title}
            </div>`;
        }
    } else if (log.targetType === 'Finding' && log.targetId) {
        const finding = state.findings.find(f => f.id == log.targetId);
        if (finding) {
            targetInfo = `<div style="background: #fef3c7; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>İlgili Bulgu:</strong> ${finding.title}
            </div>`;
        }
    } else if (log.targetType === 'Staff' && log.targetId) {
        const person = state.staff?.find(s => s.id == log.targetId);
        if (person) {
            targetInfo = `<div style="background: #d1fae5; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>İlgili Personel:</strong> ${person.name}
            </div>`;
        }
    } else if (log.targetType === 'AuditPlan' && log.targetId) {
        const plan = state.auditPlans?.find(p => p.id == log.targetId);
        if (plan) {
            targetInfo = `<div style="background: #e0e7ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>İlgili Plan:</strong> ${plan.title}
            </div>`;
        }
    }

    // Build changes section if available
    let changesHtml = '';
    if (log.changeData) {
        const before = log.changeData.before || log.changeData.old || {};
        const after = log.changeData.after || log.changeData.new || {};
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        const ignoredKeys = ['id', 'progress', 'evidence'];

        // Turkish field name mapping
        const fieldLabels = {
            name: 'Ad Soyad',
            title: 'Ünvan',
            employeeId: 'Sicil No',
            status: 'Durum',
            birthDate: 'Doğum Tarihi',
            hireDate: 'İşe Giriş Tarihi',
            email: 'E-posta',
            phone: 'Telefon',
            annualLeave: 'Yıllık İzin',
            usedLeave: 'Kullanılan İzin',
            certifications: 'Sertifikalar',
            notes: 'Notlar',
            auditCode: 'Denetim No',
            findingCode: 'Bulgu No',
            type: 'Tür',
            risk: 'Risk',
            startDate: 'Başlangıç Tarihi',
            endDate: 'Bitiş Tarihi',
            dueDate: 'Aksiyon Tarihi',
            team: 'Ekip',
            supervisor: 'Gözetim Sorumlusu',
            criterion: 'Kriter-Dayanak',
            content: 'İçerik',
            inspectorRecommendation: 'Müfettiş Önerisi',
            departmentResponse: 'Birim Cevabı'
        };

        // Format date values (YYYY-MM-DD -> GG.AA.YYYY)
        const formatValue = (key, val) => {
            if (!val || val === '-') return val;
            // Check if it's a date field and format it
            if ((key.toLowerCase().includes('date') || key === 'birthDate' || key === 'hireDate') && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                const parts = val.split('-');
                return `${parts[2]}.${parts[1]}.${parts[0]}`;
            }
            return val;
        };

        let hasChanges = false;
        changesHtml = '<div style="margin-top: 1rem;"><strong>Değişiklikler:</strong><table style="width: 100%; margin-top: 0.5rem; border-collapse: collapse; font-size: 0.85rem;">';
        changesHtml += '<tr style="background: #f3f4f6;"><th style="padding: 0.5rem; text-align: left; border: 1px solid #e5e7eb;">Alan</th><th style="padding: 0.5rem; text-align: left; border: 1px solid #e5e7eb;">Önceki</th><th style="padding: 0.5rem; text-align: left; border: 1px solid #e5e7eb;">Yeni</th></tr>';

        allKeys.forEach(key => {
            if (ignoredKeys.includes(key)) return;
            const beforeVal = before[key] !== undefined ? String(before[key]) : '-';
            const afterVal = after[key] !== undefined ? String(after[key]) : '-';
            if (beforeVal !== afterVal) {
                hasChanges = true;
                const label = fieldLabels[key] || key;
                changesHtml += `<tr><td style="padding: 0.5rem; border: 1px solid #e5e7eb; font-weight: 500;">${label}</td><td style="padding: 0.5rem; border: 1px solid #e5e7eb; color: #ef4444; text-decoration: line-through;">${formatValue(key, beforeVal)}</td><td style="padding: 0.5rem; border: 1px solid #e5e7eb; color: #10b981;">${formatValue(key, afterVal)}</td></tr>`;
            }
        });
        changesHtml += '</table></div>';
        if (!hasChanges) changesHtml = '';
    }

    const content = `
        <div style="text-align: left;">
            ${targetInfo}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div><strong>İşlem:</strong> ${log.action}</div>
                <div><strong>Kullanıcı:</strong> ${log.user}</div>
                <div><strong>Tarih:</strong> ${new Date(log.date).toLocaleString('tr-TR')}</div>
                <div><strong>Hedef Tip:</strong> ${log.targetType === 'Finding' ? 'Bulgu' : log.targetType === 'Audit' ? 'Denetim' : log.targetType === 'Staff' ? 'Personel' : log.targetType === 'AuditPlan' ? 'Plan' : log.targetType || 'Sistem'}</div>
            </div>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <strong>Detay:</strong>
                <p style="margin-top: 0.5rem; color: #374151;">${log.details || 'Detay bilgisi yok'}</p>
            </div>
            ${changesHtml}
        </div>
    `;

    showConfirmDialog(
        'İz Kaydı Detayı',
        content,
        () => { closeConfirmDialog(); },
        'Kapat',
        'var(--primary)',
        true
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// Sidebar Toggle
window.toggleSidebar = function () {
    document.querySelector('.sidebar').classList.toggle('active');
}

// View Audit Detail
window.viewAudit = function (auditId) {
    // Use loose equality to handle both string and number IDs
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) {
        showToast('Denetim bulunamadı!', 'error');
        return;
    }
    state.currentAuditId = audit.id;
    navigateTo('audit-detail');
}

// Delete Audit (Soft Delete - Move to Trash)
window.deleteAudit = function (auditId) {
    console.log("❌ deleteAudit ÇAĞRILDI! ID:", auditId, "Type:", typeof auditId);

    // Ensure state.audits is loaded
    if (!state.audits || state.audits.length === 0) {
        console.warn("State audits empty, reloading from storage...");
        const loaded = loadFromStorage();
        state.audits = loaded.audits;
    }

    // Use loose equality (==) to handle both string and number IDs
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) {
        console.error('Audit not found:', auditId);
        return;
    }

    showConfirmDialog(
        'Denetimi Sil',
        `"${audit.title}" denetimini silinenlere taşımak istediğinizden emin misiniz ? Daha sonra geri getirebilirsiniz.`,
        () => {
            // Add deletedAt timestamp and deletedBy info
            audit.deletedAt = new Date().toISOString();
            audit.deletedBy = "Admin User"; // Currently static, can be dynamic later

            // Move to trash
            state.deletedAudits.push(audit);
            state.audits = state.audits.filter(a => a.id !== auditId);

            addLog('Silindi', `"${audit.title}" denetimi silinenlere taşındı.`, 'Audit', audit.id);
            saveToStorage();
            showToast(`"${audit.title}" silinenlere taşındı`, 'success');
            renderAudits();
        }
    );
}
console.log("✅ window.deleteAudit tanımlandı");

// Delete Finding
window.deleteFinding = function (findingId) {
    console.log("❌ deleteFinding ÇAĞRILDI! ID:", findingId);
    // Use loose equality (==) to handle both string and number IDs
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) return;

    showConfirmDialog(
        'Bulguyu Sil',
        `"${finding.title}" bulgusunu silmek istediğinizden emin misiniz? Bulgu çöp kutusuna taşınacak ve 30 gün içinde geri alınabilir.`,
        () => {
            // Move to deleted findings (soft delete)
            const deletedFinding = { ...finding, deletedAt: new Date().toISOString() };
            if (!state.deletedFindings) state.deletedFindings = [];
            state.deletedFindings.push(deletedFinding);

            // Remove from active findings
            state.findings = state.findings.filter(f => f.id != findingId);

            addLog('Bulgu Silindi', `"${finding.title}" bulgusu çöp kutusuna taşındı.`, 'Finding', finding.id);
            saveToStorage();
            showToast(`"${finding.title}" bulgusu çöp kutusuna taşındı`, 'success');
            renderFindings();
        }
    );
}

// NOTE: viewFinding is defined below at line ~5655 (comprehensive version with robust ID handling)
// NOTE: editFinding is defined at line ~4503 (with robust ID handling)

// Trash/Recycle Bin Functions
function renderTrash() {
    const listHtml = state.deletedAudits.length > 0 ? state.deletedAudits.map(audit => {
        const daysLeft = Math.ceil((new Date(audit.deletedAt).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000));
        return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                <input type="checkbox" class="trash-checkbox" data-audit-id="${audit.id}" style="width: 18px; height: 18px; cursor: pointer;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <h4 style="font-size: 1.1rem;">${audit.title}</h4>
                        <span style="font-size: 0.75rem; padding: 0.1rem 0.5rem; background: #fee2e2; border-radius: 4px; color: #991b1b;">${daysLeft} gün kaldı</span>
                    </div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--text-light);">
                        <span>Tür: ${audit.type}</span>
                        <span>Silinme: ${formatDate(audit.deletedAt)}</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn" style="background: var(--primary); color: white; padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.restoreAudit('${audit.id}')">
                    <i data-lucide="undo-2" style="width: 14px; margin-right: 0.25rem;"></i> Geri Getir
                </button>
                <button class="btn" style="background: #dc2626; color: white; padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.permanentDeleteAudit('${audit.id}')">>
                    <i data-lucide="trash" style="width: 14px; margin-right: 0.25rem;"></i> Kalıcı Sil
                </button>
            </div>
        </div>
        `}).join('') : `
        <div class="card" style="text-align: center; padding: 3rem;">
            <i data-lucide="trash-2" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--text-light);"></i>
            <h3 style="color: var(--text-light); margin-bottom: 0.5rem;">Silinenler Boş</h3>
            <p style="color: var(--text-light); font-size: 0.9rem;">Silinen öğeler 30 gün boyunca burada saklanır.</p>
        </div>
        `;

    // Prepare Filters data
    const years = [...new Set(state.audits.map(a => a.startDate.split('-')[0]))].sort().reverse();
    const types = [...new Set(state.audits.map(a => a.type))].sort();

    const totalDeleted = state.deletedAudits.length + (state.deletedFindings?.length || 0) + (state.deletedPlans?.length || 0);

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <h3>Silinenler</h3>
                    <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.25rem;">
                        ${state.deletedAudits.length} denetim, ${state.deletedFindings?.length || 0} bulgu • 30 gün sonra otomatik silinir
                    </p>
                </div>
                ${totalDeleted > 0 ? `
                    <div style="display: flex; gap: 0.75rem;">
                        <button class="btn btn-primary" onclick="restoreSelected()" id="bulk-restore-btn" style="display: none;">
                            <i data-lucide="undo-2" style="width: 16px; margin-right: 0.5rem;"></i> Seçilenleri Geri Getir
                        </button>
                        <button class="btn" style="background: #dc2626; color: white;" onclick="emptyTrash()">
                            <i data-lucide="trash" style="width: 16px; margin-right: 0.5rem;"></i> Tümünü Temizle
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <!-- Deleted Audits -->
            ${state.deletedAudits.length > 0 ? `
                <h4 style="margin-bottom: 1rem; color: var(--text-light);">Silinen Denetimler</h4>
                ${listHtml}
            ` : ''}
            
            <!-- Deleted Findings -->
            ${state.deletedFindings && state.deletedFindings.length > 0 ? `
                <h4 style="margin: 1.5rem 0 1rem; color: var(--text-light);">Silinen Bulgular</h4>
                ${state.deletedFindings.map(finding => {
        const daysLeft = Math.ceil((new Date(finding.deletedAt).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000));
        return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #fef9c3; border: 1px solid #fde047; border-radius: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                                <h5 style="font-size: 1rem; font-weight: 600;">${finding.title}</h5>
                                <span style="font-size: 0.7rem; padding: 0.1rem 0.4rem; background: #fef08a; border-radius: 4px; color: #854d0e;">${daysLeft} gün</span>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-light);">
                                Risk: ${finding.risk || 'Belirtilmemiş'} • Silinme: ${formatDate(finding.deletedAt)}
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary btn-sm" onclick="restoreFinding(${finding.id})">
                                <i data-lucide="undo-2" style="width: 14px; margin-right: 0.25rem;"></i> Geri Getir
                            </button>
                            <button class="btn btn-sm" style="background: #dc2626; color: white;" onclick="permanentDeleteFinding(${finding.id})">
                                <i data-lucide="trash" style="width: 14px;"></i>
                            </button>
                        </div>
                    </div>
                    `;
    }).join('')}
            ` : ''}
            
            <!-- Deleted Audit Plans -->
            ${state.deletedPlans && state.deletedPlans.length > 0 ? `
                <h4 style="margin: 1.5rem 0 1rem; color: var(--text-light);">Silinen Denetim Planları</h4>
                ${state.deletedPlans.map(plan => {
        const daysLeft = Math.ceil((new Date(plan.deletedAt).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000));
        return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 0.5rem; margin-bottom: 0.75rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                                <i data-lucide="calendar" style="width: 18px; color: #16a34a;"></i>
                                <h5 style="font-size: 1rem; font-weight: 600;">${plan.title}</h5>
                                <span style="font-size: 0.7rem; padding: 0.1rem 0.4rem; background: #dcfce7; border-radius: 4px; color: #166534;">${daysLeft} gün</span>
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-light);">
                                Yıl: ${plan.year || 'Belirtilmemiş'} • Silinme: ${formatDate(plan.deletedAt)}
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary btn-sm" onclick="restorePlan('${plan.id}')">
                                <i data-lucide="undo-2" style="width: 14px; margin-right: 0.25rem;"></i> Geri Getir
                            </button>
                            <button class="btn btn-sm" style="background: #dc2626; color: white;" onclick="permanentDeletePlan('${plan.id}')">
                                <i data-lucide="trash" style="width: 14px;"></i>
                            </button>
                        </div>
                    </div>
                    `;
    }).join('')}
            ` : ''}
            
            ${totalDeleted === 0 ? `
                <div style="text-align: center; padding: 3rem;">
                    <i data-lucide="trash-2" style="width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--text-light);"></i>
                    <h4 style="color: var(--text-light);">Çöp Kutusu Boş</h4>
                    <p style="color: var(--text-light); font-size: 0.9rem;">Silinen öğeler 30 gün boyunca burada saklanır.</p>
                </div>
            ` : ''}
        </div>
        `;

    // Add checkbox event listeners for bulk selection
    setTimeout(() => {
        const checkboxes = document.querySelectorAll('.trash-checkbox');
        const bulkRestoreBtn = document.getElementById('bulk-restore-btn');

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const anyChecked = Array.from(checkboxes).some(c => c.checked);
                if (bulkRestoreBtn) {
                    bulkRestoreBtn.style.display = anyChecked ? 'inline-flex' : 'none';
                }
            });
        });
    }, 100);
    lucide.createIcons();
}

// Restore Audit from Trash
window.restoreAudit = function (auditId) {
    console.log("♻️ restoreAudit ÇAĞRILDI! ID:", auditId);
    // Use loose equality (==) to handle both string and number IDs
    const audit = state.deletedAudits.find(a => a.id == auditId);
    if (!audit) return;

    showConfirmDialog(
        'Öğeyi Geri Getir',
        `"${audit.title}" öğesini geri getirmek istediğinizden emin misiniz ? `,
        () => {
            // Remove deletedAt timestamp
            delete audit.deletedAt;

            // Move back to active audits
            state.audits.unshift(audit);
            state.deletedAudits = state.deletedAudits.filter(a => a.id !== auditId);

            saveToStorage();
            showToast(`"${audit.title}" başarıyla geri getirildi`, 'success');
            renderTrash();
        },
        'Geri Getir',
        'var(--primary)'
    );
}

// Restore Finding from Trash
window.restoreFinding = function (findingId) {
    console.log("♻️ restoreFinding ÇAĞRILDI! ID:", findingId);
    const finding = state.deletedFindings?.find(f => f.id == findingId);
    if (!finding) {
        showToast('Bulgu bulunamadı', 'error');
        return;
    }

    showConfirmDialog(
        'Bulguyu Geri Getir',
        `"${finding.title}" bulgusunu geri getirmek istediğinizden emin misiniz?`,
        () => {
            // Remove deletedAt timestamp
            delete finding.deletedAt;

            // Move back to active findings
            state.findings.unshift(finding);
            state.deletedFindings = state.deletedFindings.filter(f => f.id != findingId);

            addLog('Bulgu Geri Getirildi', `"${finding.title}" bulgusu geri getirildi.`, 'Finding', finding.id);
            saveToStorage();
            showToast(`"${finding.title}" bulgusu başarıyla geri getirildi`, 'success');
            renderTrash();
        },
        'Geri Getir',
        'var(--primary)'
    );
}

// Permanent Delete Finding
window.permanentDeleteFinding = function (findingId) {
    const finding = state.deletedFindings?.find(f => f.id == findingId);
    if (!finding) return;

    showConfirmDialog(
        'Kalıcı Sil',
        `"${finding.title}" bulgusunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`,
        () => {
            state.deletedFindings = state.deletedFindings.filter(f => f.id != findingId);
            addLog('Bulgu Kalıcı Silindi', `"${finding.title}" bulgusu kalıcı olarak silindi.`, 'Finding', finding.id);
            saveToStorage();
            showToast(`"${finding.title}" kalıcı olarak silindi`, 'success');
            renderTrash();
        },
        'Kalıcı Sil',
        '#dc2626'
    );
}

// Permanent Delete Audit
// Duplicate functions removed


// Permanent Delete Audit
window.permanentDeleteAudit = function (auditId) {
    console.log("🔥 permanentDeleteAudit ÇAĞRILDI! ID:", auditId);
    // Use loose equality (==) to handle both string and number IDs
    const audit = state.deletedAudits.find(a => a.id == auditId);
    if (!audit) return;

    showConfirmDialog(
        'Kalıcı Olarak Sil',
        `"${audit.title}" denetimini kalıcı olarak silmek istediğinizden emin misiniz ? Bu işlem GERİ ALINAMAZ!`,
        () => {
            state.deletedAudits = state.deletedAudits.filter(a => a.id !== auditId);
            // Also delete related findings
            state.findings = state.findings.filter(f => f.auditId !== auditId);

            saveToStorage();
            showToast(`"${audit.title}" kalıcı olarak silindi`, 'error');
            renderTrash();
        }
    );
}

// Restore Selected Audits
window.restoreSelected = function () {
    const checkboxes = document.querySelectorAll('.trash-checkbox:checked');
    if (checkboxes.length === 0) return;

    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.auditId));
    const selectedAudits = state.deletedAudits.filter(a => selectedIds.includes(a.id));

    showConfirmDialog(
        'Denetimleri Geri Getir',
        `${selectedAudits.length} denetimi geri getirmek istediğinizden emin misiniz ? `,
        () => {
            selectedAudits.forEach(audit => {
                // Remove deletedAt timestamp
                delete audit.deletedAt;
                delete audit.deletedBy;

                // Move back to active audits
                state.audits.unshift(audit);
            });

            // Remove from trash
            state.deletedAudits = state.deletedAudits.filter(a => !selectedIds.includes(a.id));

            saveToStorage();
            showToast(`${selectedAudits.length} denetim başarıyla geri getirildi`, 'success');
            renderTrash();
        },
        'Geri Getir',
        'var(--primary)'
    );
}

// Empty Entire Trash
window.emptyTrash = function () {
    console.log("🗑️ emptyTrash ÇAĞRILDI!");
    if (state.deletedAudits.length === 0) return;

    showConfirmDialog(
        'Tüm Silinenleri Temizle',
        `Tüm silinen denetimleri(${state.deletedAudits.length} adet) kalıcı olarak silmek istediğinizden emin misiniz ? Bu işlem GERİ ALINAMAZ!`,
        () => {
            const count = state.deletedAudits.length;
            const deletedAuditIds = state.deletedAudits.map(a => a.id);

            // Delete all audits in trash
            state.deletedAudits = [];

            // Also delete all findings related to these audits
            state.findings = state.findings.filter(f => !deletedAuditIds.includes(f.auditId));

            saveToStorage();
            showToast(`${count} denetim kalıcı olarak silindi`, 'error');
            renderTrash();
        },
        'Tümünü Sil',
        '#dc2626'
    );
}

// Restore Plan from Trash
window.restorePlan = function (planId) {
    if (!state.deletedPlans) return;
    const plan = state.deletedPlans.find(p => p.id == planId);
    if (!plan) return;

    showConfirmDialog(
        'Planı Geri Getir',
        `"${plan.title}" planını geri getirmek istediğinizden emin misiniz?`,
        () => {
            delete plan.deletedAt;
            if (!state.auditPlans) state.auditPlans = [];
            state.auditPlans.unshift(plan);
            state.deletedPlans = state.deletedPlans.filter(p => p.id != planId);
            addLog('Plan Geri Getirildi', `"${plan.title}" planı geri getirildi.`, 'AuditPlan', plan.id);
            saveToStorage();
            showToast(`"${plan.title}" başarıyla geri getirildi`, 'success');
            renderTrash();
        },
        'Geri Getir',
        'var(--primary)'
    );
};

// Permanent Delete Plan
window.permanentDeletePlan = function (planId) {
    if (!state.deletedPlans) return;
    const plan = state.deletedPlans.find(p => p.id == planId);
    if (!plan) return;

    showConfirmDialog(
        'Planı Kalıcı Sil',
        `"${plan.title}" planını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem GERİ ALINAMAZ!`,
        () => {
            state.deletedPlans = state.deletedPlans.filter(p => p.id != planId);
            addLog('Plan Kalıcı Silindi', `"${plan.title}" planı kalıcı olarak silindi.`, 'AuditPlan', planId);
            saveToStorage();
            showToast(`"${plan.title}" kalıcı olarak silindi`, 'error');
            renderTrash();
        },
        'Kalıcı Sil',
        '#dc2626'
    );
};

// Event Listeners
// Event Listeners
// (DOMContentLoaded consolidated at the end of file)

// Quick Actions Config
const quickActionsConfig = [
    { id: 'qa-audit', label: 'Yeni Denetim Oluştur', icon: 'plus', action: "openModal('audit-modal')", visible: true },
    { id: 'qa-finding', label: 'Yeni Bulgu Ekle', icon: 'alert-circle', action: "openModal('finding-modal')", visible: true },
    { id: 'qa-ethics', label: 'Etik Bildirim Ver', icon: 'send', action: "navigateTo('ethics-submit')", visible: true },
    { id: 'qa-trash', label: 'Silinenler', icon: 'trash-2', action: "navigateTo('trash')", visible: true },
    { id: 'qa-reports', label: 'Raporları Görüntüle', icon: 'bar-chart-2', action: "navigateTo('reports')", visible: true },
    { id: 'qa-settings', label: 'Ayarlar', icon: 'settings', action: "navigateTo('settings')", visible: false },
    { id: 'qa-audits', label: 'Denetimleri Görüntüle', icon: 'file-text', action: "navigateTo('audits')", visible: false },
    { id: 'qa-findings', label: 'Bulguları Görüntüle', icon: 'alert-triangle', action: "navigateTo('findings')", visible: false },
    { id: 'qa-ethics-view', label: 'Etik Bildirimleri Görüntüle', icon: 'list', action: "navigateTo('ethics-view')", visible: false }
];
window.openCustomizeModal = function () {
    let savedConfig = localStorage.getItem('quickActionsConfig');
    let config = savedConfig ? JSON.parse(savedConfig) : quickActionsConfig;
    quickActionsConfig.forEach(def => {
        let saved = config.find(c => c.id === def.id);
        if (!saved) config.push(def);
        else { saved.label = def.label; saved.icon = def.icon; saved.action = def.action; }
    });
    localStorage.setItem('quickActionsConfig', JSON.stringify(config));
    const list = document.getElementById('customize-list');
    list.innerHTML = config.map((item, i) => `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--secondary);border-radius:8px;"><input type="checkbox" ${item.visible ? 'checked' : ''} id="${item.id}-check" class="qa-checkbox" style="width:18px;height:18px;"><span style="flex:1;">${item.label}</span><button type="button" class="btn btn-icon" onclick="moveItem(${i},-1)" ${i === 0 ? 'disabled' : ''} style="padding:0.25rem;"><i data-lucide="chevron-up" style="width:16px;"></i></button><button type="button" class="btn btn-icon" onclick="moveItem(${i},1)" ${i === config.length - 1 ? 'disabled' : ''} style="padding:0.25rem;"><i data-lucide="chevron-down" style="width:16px;"></i></button></div>`).join('');

    // Add event listeners to limit to 5 checkboxes
    setTimeout(() => {
        document.querySelectorAll('.qa-checkbox').forEach(cb => {
            cb.addEventListener('change', function () {
                const checkedCount = document.querySelectorAll('.qa-checkbox:checked').length;
                if (checkedCount > 5) {
                    this.checked = false;
                    showToast('Maksimum 5 buton seçebilirsiniz!', 'warning');
                }
            });
        });
    }, 100);

    openModal('customize-modal');
    setTimeout(() => lucide.createIcons(), 100);
};
window.moveItem = function (index, dir) {
    let config = JSON.parse(localStorage.getItem('quickActionsConfig') || JSON.stringify(quickActionsConfig));
    let newIndex = index + dir;
    if (newIndex < 0 || newIndex >= config.length) return;
    [config[index], config[newIndex]] = [config[newIndex], config[index]];
    localStorage.setItem('quickActionsConfig', JSON.stringify(config));
    openCustomizeModal();
};
window.saveCustomization = function () {
    let config = JSON.parse(localStorage.getItem('quickActionsConfig') || JSON.stringify(quickActionsConfig));
    let visibleCount = 0;
    config.forEach(item => {
        const cb = document.getElementById(item.id + '-check');
        if (cb && cb.checked) visibleCount++;
    });

    if (visibleCount > 5) {
        showToast('Maksimum 5 buton seçebilirsiniz!', 'warning');
        return;
    }

    config.forEach(item => {
        const cb = document.getElementById(item.id + '-check');
        if (cb) item.visible = cb.checked;
    });
    localStorage.setItem('quickActionsConfig', JSON.stringify(config));
    closeModal('customize-modal');
    showToast('Özelleştirme kaydedildi!', 'success');
    navigateTo('dashboard');
};

// View Finding Detail (Comprehensive version with robust ID handling)
window.viewFinding = function (findingId) {
    console.log("👁️ viewFinding called with ID:", findingId);

    // Robust ID comparison - convert to string for comparison
    let finding = state.findings.find(f => String(f.id) === String(findingId));

    // Fallback: Try loadFromStorage if not found
    if (!finding) {
        console.log("⚠️ Finding not found in state, trying loadFromStorage fallback...");
        const freshData = loadFromStorage();
        if (freshData && freshData.findings) {
            finding = freshData.findings.find(f => String(f.id) === String(findingId));
            if (finding) {
                state.findings = freshData.findings;
                console.log("✅ Finding found via localStorage fallback");
            }
        }
    }

    if (!finding) {
        showToast('Bulgu bulunamadı! ID: ' + findingId, 'error');
        console.error("❌ Finding not found! ID:", findingId);
        return;
    }
    const audit = state.audits.find(a => a.id === finding.auditId);
    const auditTitle = audit ? audit.title : 'Bilinmeyen Denetim';

    // Intelligent Back Button Logic
    const isAuditContext = state.currentAuditId == finding.auditId;
    const isFromFollowUp = state.currentPage === 'follow-up-findings';

    let backAction, backLabel;
    if (isFromFollowUp) {
        backAction = "navigateTo('follow-up-findings')";
        backLabel = "Takip Edileceklere Dön";
    } else if (isAuditContext) {
        backAction = "renderAuditDetail()";
        backLabel = "Denetime Dön";
    } else {
        backAction = "navigateTo('findings')";
        backLabel = "Bulgulara Dön";
    }

    const html = `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="${backAction}" style="display: inline-flex; align-items: center;">
                <i data-lucide="arrow-left" style="width: 16px; margin-right: 0.5rem;"></i> ${backLabel}
            </button>
        </div>
        <div class="card">
            <div style="margin-bottom: 1.5rem;">
                <h2>${finding.title}</h2>
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 500; background: ${getRiskColor(finding.risk)}15; color: ${getRiskColor(finding.risk)};">${finding.risk}</span>
                        <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 500; background: ${getFindingStatusColor(finding.status)}15; color: ${getFindingStatusColor(finding.status)};">${finding.status}</span>
                    </div>
                    
                    <!-- Workflow Actions -->
                    <div class="workflow-actions" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        ${(() => {
            const config = findingWorkflow[finding.status] || { transitions: [] };
            const userActions = config.transitions.filter(t => t.role === state.currentUserRole);

            if (userActions.length === 0 && config.transitions.length > 0) {
                return `<span style="font-size: 0.75rem; color: var(--text-light); font-style: italic;">(${state.currentUserRole} için aksiyon yok)</span>`;
            }

            return userActions.map(action => `
                                <button class="btn btn-${action.style}" onclick="changeFindingStatus('${finding.id}', '${action.to}')">
                                    <i data-lucide="${action.icon}" style="width: 14px; margin-right: 0.25rem;"></i> ${action.label}
                                </button>
                            `).join('');
        })()}
                    </div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Denetim</h4>
                    <p>${auditTitle}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Aksiyon Tarihi</h4>
                    <p>${finding.dueDate || '-'}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Atanan Birim</h4>
                    <p>${finding.assignedTo || 'Henüz atanmadı'}</p>
                </div>
                ${(() => {
            const dates = getFindingDatesFromLogs(finding.id);
            const responseTime = calculateResponseTime(finding.id);
            return `
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Tebliğ Tarihi</h4>
                    <p>${dates.notificationDate ? formatDate(dates.notificationDate) : 'Henüz tebliğ edilmedi'}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Cevap Tarihi</h4>
                    <p>${dates.responseDate ? formatDate(dates.responseDate) : 'Henüz cevap verilmedi'}</p>
                </div>
                <div>
                    <h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Cevap Süresi</h4>
                    <p style="font-weight: 600; color: ${responseTime && responseTime > 15 ? '#ef4444' : responseTime && responseTime > 7 ? '#f59e0b' : '#10b981'};">
                        ${responseTime !== null ? responseTime + ' gün' : '-'}
                    </p>
                </div>
                    `;
        })()}
                ${finding.criterion ? `<div style="grid-column: 1 / -1;"><h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Kriter-Dayanak</h4><p>${finding.criterion}</p></div>` : ''}
                ${finding.content ? `<div style="grid-column: 1 / -1;"><h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Bulgu İçeriği</h4><p>${finding.content}</p></div>` : ''}
                ${finding.inspectorRecommendation ? `<div style="grid-column: 1 / -1;"><h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Müfettiş Önerisi</h4><p>${finding.inspectorRecommendation}</p></div>` : ''}
                ${finding.departmentResponse ? `<div style="grid-column: 1 / -1;"><h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Birim Cevabı</h4><p>${finding.departmentResponse}</p></div>` : ''}
                ${finding.remediationStatus ? `<div><h4 style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Bulgu Durumu</h4><p>${finding.remediationStatus}</p></div>` : ''}
                ${finding.rejectionNote && finding.status === 'Düzeltme İstendi' ? `<div style="grid-column: 1 / -1; background: #fef2f2; padding: 1rem; border-radius: 8px; border: 1px solid #fecaca;"><h4 style="font-size: 0.85rem; color: #991b1b; margin-bottom: 0.5rem; display:flex; align-items:center gap:0.5rem;"><i data-lucide="alert-circle" width="14"></i> Düzeltme İsteği / Red Sebebi</h4><p style="color: #7f1d1d; font-style: italic;">"${finding.rejectionNote}"</p></div>` : ''}
                ${finding.disagreementReason ? `
                <div style="grid-column: 1 / -1; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #fdba74; margin-top: 0.5rem;">
                    <h4 style="font-size: 0.9rem; color: #c2410c; margin-bottom: 0.75rem; display:flex; align-items:center; gap:0.5rem;">
                        <i data-lucide="alert-triangle" style="width:16px"></i> Birim İtirazı
                        <span style="background: #f97316; color: white; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.65rem; font-weight: 600;">Mutabık Değil</span>
                    </h4>
                    <p style="color: #9a3412; font-style: italic; line-height: 1.6;">"${finding.disagreementReason}"</p>
                    ${finding.disagreementDate ? `<div style="font-size: 0.75rem; color: #c2410c; margin-top: 0.5rem;">${new Date(finding.disagreementDate).toLocaleString('tr-TR')} - ${finding.disagreementBy || 'Birim'}</div>` : ''}
                </div>
                ` : ''}
    
            ${finding.inspectorFinalOpinion ? `
                <div style="grid-column: 1 / -1; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #fca5a5; margin-top: 0.5rem;">
                    <h4 style="font-size: 0.9rem; color: #991b1b; margin-bottom: 0.75rem; display:flex; align-items:center; gap:0.5rem;">
                        <i data-lucide="gavel" style="width:16px"></i> Müfettiş Son Görüşü
                    </h4>
                    <p style="color: #7f1d1d; line-height: 1.6;">${finding.inspectorFinalOpinion}</p>
                    ${finding.finalOpinionDate ? `<div style="font-size: 0.75rem; color: #991b1b; margin-top: 0.5rem;">${new Date(finding.finalOpinionDate).toLocaleString('tr-TR')}</div>` : ''}
                </div>
                ` : ''}
            </div>

            <!-- Action Tracking & Verification Section -->
            <div style="margin-top: 2rem;">
                <h3 style="font-size: 1.1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="check-square" style="width: 20px;"></i> Aksiyon Takibi ve Doğrulama
                </h3>
                
                ${finding.actions && finding.actions.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${finding.actions.map(action => `
                            <div style="border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                    <div>
                                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">${action.description}</div>
                                        <div style="font-size: 0.85rem; color: var(--text-light);">
                                            Sorumlu: <span style="font-weight: 500; color: var(--text-main);">${action.responsible}</span> • 
                                            Termin: <span style="font-weight: 500; color: var(--text-main);">${formatDate(action.dueDate)}</span>
                                        </div>
                                    </div>
                                    <span style="padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; 
                                        background: ${action.status === 'Doğrulandı' ? '#dcfce7' : action.status === 'Tamamlandı' ? '#dbeafe' : action.status === 'Reddedildi' ? '#fee2e2' : '#f3f4f6'}; 
                                        color: ${action.status === 'Doğrulandı' ? '#166534' : action.status === 'Tamamlandı' ? '#1e40af' : action.status === 'Reddedildi' ? '#991b1b' : '#374151'};">
                                        ${action.status}
                                    </span>
                                </div>

                                ${action.completionNote ? `
                                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;">
                                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; font-weight: 600;">TAMAMLANMA DETAYI - ${formatDate(action.completedAt)} (${action.completedBy})</div>
                                        <div style="font-style: italic; color: #334155; margin-bottom: 0.5rem;">"${action.completionNote}"</div>
                                        ${renderActionEvidence(action.evidence)}
                                    </div>
                                ` : ''}

                                ${action.verificationNote ? `
                                    <div style="background: ${action.status === 'Doğrulandı' ? '#f0fdf4' : '#fef2f2'}; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid ${action.status === 'Doğrulandı' ? '#bbf7d0' : '#fecaca'};">
                                        <div style="font-size: 0.75rem; color: ${action.status === 'Doğrulandı' ? '#166534' : '#991b1b'}; margin-bottom: 0.5rem; font-weight: 600;">
                                            ${action.status === 'Doğrulandı' ? 'DOĞRULAMA NOTU' : 'RED NOTU'} - ${formatDate(action.verifiedAt)} (${action.verifiedBy})
                                        </div>
                                        <div style="font-style: italic; color: ${action.status === 'Doğrulandı' ? '#14532d' : '#7f1d1d'};">"${action.verificationNote}"</div>
                                    </div>
                                ` : ''}

                                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 0.5rem;">
                                    ${state.currentUserRole === 'Birim' && (action.status === 'Beklemede' || action.status === 'Reddedildi') ? `
                                        <button class="btn btn-primary" onclick="window.completeAction('${finding.id}', ${action.id})" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">
                                            <i data-lucide="check-circle" style="width: 14px; margin-right: 0.5rem;"></i> Aksiyonu Tamamla
                                        </button>
                                    ` : ''}

                                    ${(state.currentUserRole === 'Kurul Başkanı' || state.currentUserRole === 'Müfettiş' || state.currentUserRole === 'Kıdemli Müfettiş') && action.status === 'Tamamlandı' ? `
                                        <button class="btn" style="background: #ef4444; color: white; font-size: 0.85rem; padding: 0.4rem 0.75rem;" onclick="window.verifyAction('${finding.id}', ${action.id}, false)">
                                            <i data-lucide="x-circle" style="width: 14px; margin-right: 0.5rem;"></i> Reddet
                                        </button>
                                        <button class="btn btn-primary" style="background: #10b981; border-color: #10b981; font-size: 0.85rem; padding: 0.4rem 0.75rem;" onclick="window.verifyAction('${finding.id}', ${action.id}, true)">
                                            <i data-lucide="check-circle-2" style="width: 14px; margin-right: 0.5rem;"></i> Doğrula
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 2rem; background: #f9fafb; border-radius: 8px; border: 1px dashed var(--border); color: var(--text-light);">
                        <i data-lucide="list-x" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                        <p>Bu bulgu için tanımlanmış aksiyon bulunmamaktadır.</p>
                    </div>
                `}
            </div>

            ${finding.revisionHistory && finding.revisionHistory.length > 0 ? `
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                <div class="history-header" onclick="toggleHistory(this)">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main);">
                        <i data-lucide="git-compare" style="width: 16px;"></i> Revizyon Geçmişi
                        <span style="background: #d946ef; color: white; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600;">${finding.revisionHistory.length}</span>
                    </div>
                    <i data-lucide="chevron-down" class="history-arrow" style="width: 16px; margin-left: auto;"></i>
                </div>
                <div class="history-content">
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                    ${finding.revisionHistory.slice().reverse().map((rev, index) => `
                        <div style="background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%); border: 1px solid #e9d5ff; border-radius: 12px; padding: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div>
                                    <div style="font-weight: 600; color: #7c3aed; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
                                        <i data-lucide="${rev.type === 'renotification_edit' ? 'edit-3' : 'copy'}" style="width: 14px;"></i>
                                        ${rev.type === 'renotification_edit' ? 'Düzenlenerek Tekrar Tebliğ' : 'İlk Haliyle Tekrar Tebliğ'}
                                        <span style="background: #8b5cf6; color: white; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.65rem;">#${rev.renotificationCount || index + 1}</span>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;">
                                        <strong>${rev.user}</strong> tarafından
                                    </div>
                                </div>
                                <div style="text-align: right; font-size: 0.75rem; color: #6b7280;">
                                    ${formatDate(rev.date)}<br>
                                    ${new Date(rev.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            
                            <div style="background: white; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #e5e7eb;">
                                <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Gerekçe</div>
                                <div style="color: #374151; font-style: italic;">"${rev.reason}"</div>
                            </div>
                            
                            ${Object.keys(rev.changes).length > 0 ? `
                            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">Değişiklikler</div>
                            ${Object.entries(rev.changes).map(([field, change]) => `
                                <div style="background: white; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #e5e7eb;">
                                    <div style="font-weight: 600; color: #374151; font-size: 0.85rem; margin-bottom: 0.5rem;">
                                        ${field === 'title' ? 'Başlık' : field === 'content' ? 'Bulgu İçeriği' : 'Müfettiş Önerisi'}
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                        <div>
                                            <div style="font-size: 0.7rem; color: #dc2626; font-weight: 500; margin-bottom: 0.25rem;">ÖNCEKİ</div>
                                            <div style="background: #fef2f2; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; color: #7f1d1d; border-left: 3px solid #dc2626;">${change.old || '<i>Boş</i>'}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 0.7rem; color: #16a34a; font-weight: 500; margin-bottom: 0.25rem;">YENİ</div>
                                            <div style="background: #f0fdf4; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; color: #166534; border-left: 3px solid #16a34a;">${change.new || '<i>Boş</i>'}</div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                            ` : '<div style="font-size: 0.85rem; color: #6b7280; font-style: italic;">İçerik değişikliği yapılmadı.</div>'}
                        </div>
                    `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            ${finding.responseHistory && finding.responseHistory.length > 0 ? `
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                <div class="history-header" onclick="toggleHistory(this)">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main);">
                        <i data-lucide="message-circle" style="width: 16px;"></i> Birim Cevabı Güncelleme Geçmişi
                        <span style="background: #8b5cf6; color: white; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600;">${finding.responseHistory.length}</span>
                    </div>
                    <i data-lucide="chevron-down" class="history-arrow" style="width: 16px; margin-left: auto;"></i>
                </div>
                <div class="history-content">
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
                    ${finding.responseHistory.slice().reverse().map((rev, index) => `
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div>
                                    <div style="font-weight: 600; color: #2563eb; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">
                                        <i data-lucide="edit-3" style="width: 14px;"></i>
                                        Cevap Güncellendi
                                        <span style="background: #3b82f6; color: white; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.65rem;">#${finding.responseHistory.length - index}</span>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;">
                                        <strong>${rev.user}</strong> tarafından
                                    </div>
                                </div>
                                <div style="text-align: right; font-size: 0.75rem; color: #6b7280;">
                                    ${formatDate(rev.date)}<br>
                                    ${new Date(rev.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            
                            <div style="background: white; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #e5e7eb;">
                                <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">Güncelleme Gerekçesi</div>
                                <div style="color: #374151; font-style: italic;">"${rev.reason}"</div>
                            </div>
                            
                            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">Cevap Değişikliği</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                <div>
                                    <div style="font-size: 0.7rem; color: #dc2626; font-weight: 500; margin-bottom: 0.25rem;">ÖNCEKİ CEVAP</div>
                                    <div style="background: #fef2f2; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; color: #7f1d1d; border-left: 3px solid #dc2626; max-height: 100px; overflow-y: auto;">${rev.oldResponse || '<i>Boş</i>'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.7rem; color: #16a34a; font-weight: 500; margin-bottom: 0.25rem;">YENİ CEVAP</div>
                                    <div style="background: #f0fdf4; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; color: #166534; border-left: 3px solid #16a34a; max-height: 100px; overflow-y: auto;">${rev.newResponse || '<i>Boş</i>'}</div>
                                </div>
                            </div>
                            
                            ${rev.newDueDate ? `
                            <div style="margin-top: 1rem;">
                                <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">Aksiyon Tarihi Değişikliği</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                    <div>
                                        <div style="font-size: 0.7rem; color: #dc2626; font-weight: 500; margin-bottom: 0.25rem;">ÖNCEKİ TARİH</div>
                                        <div style="background: #fef2f2; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; color: #7f1d1d; border-left: 3px solid #dc2626;">${rev.oldDueDate || '<i>Belirtilmemiş</i>'}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.7rem; color: #16a34a; font-weight: 500; margin-bottom: 0.25rem;">YENİ TARİH</div>
                                        <div style="background: #f0fdf4; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; color: #166534; border-left: 3px solid #16a34a;">${rev.newDueDate}</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                <div class="history-header" onclick="toggleHistory(this)">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-main);">
                        <i data-lucide="history" style="width: 16px;"></i> Süreç Geçmişi
                    </div>
                    <i data-lucide="chevron-down" class="history-arrow" style="width: 16px; margin-left: auto;"></i>
                </div>
                <div class="history-content">
                    <div class="log-list" style="margin-top: 1rem;">
                    ${(() => {
            const findingLogs = state.logs.filter(l => l.targetType === 'Finding' && l.targetId === finding.id).sort((a, b) => new Date(b.date) - new Date(a.date));
            if (findingLogs.length === 0) return '<div style="padding:1rem; color:var(--text-light); text-align:center;">Henüz kayıt yok.</div>';

            return findingLogs.map(log => `
                            <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <div style="font-weight: 500; font-size: 0.9rem; color: var(--text-main);">${log.action}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.1rem;">
                                        ${(() => {
                    const details = log.details;
                    if (typeof details === 'object') return JSON.stringify(details);
                    if (String(details).includes('[object Object]')) return '<i>Detay Görüntülenemiyor (Eski Veri)</i>';

                    let output = details;
                    if (log.changeData && log.changeData.new && log.changeData.new.rejectionNote) {
                        output += `<br><span style="color: #ef4444; font-style: italic;"><strong>Red Sebebi:</strong> ${log.changeData.new.rejectionNote}</span>`;
                    }
                    return output;
                })()}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-main);">${log.user}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-light);">${new Date(log.date).toLocaleString('tr-TR')}</div>
                                </div>
                            </div>
                        `).join('');
        })()}
                </div>
            </div>
                <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Aksiyonlar (CAPA)</h3>
                    <div style="display: flex; gap: 0.5rem;">
                         ${finding.status === 'Tebliğ Edildi' || finding.status === 'Açık' ? `
                            <button class="btn btn-primary" onclick="window.openConciliationModal('${finding.id}')">
                    <i data-lucide="check" style="width: 16px; margin-right: 0.5rem;"></i> Kabul Et & Aksiyon Ekle
                </button>
                            <button class="btn" style="background: #f97316; color: white;" onclick="window.openDisagreementModal('${finding.id}')">
                    <i data-lucide="x" style="width: 16px; margin-right: 0.5rem;"></i> Mutabık Değilim
                </button>
                         ` : ''}
                    </div>
                </div>
                <div class="action-list">
                    ${finding.actions && finding.actions.length > 0 ? finding.actions.map(action => `
                        <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f9fafb; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.75rem;">
                            <input type="checkbox" ${action.status === 'Tamamlandı' ? 'checked' : ''} 
                                onchange="toggleActionStatus(${finding.id}, ${action.id}, this.checked)"
                                style="width: 18px; height: 18px; margin-top: 0.25rem; cursor: pointer;">
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-weight: 600; ${action.status === 'Tamamlandı' ? 'text-decoration: line-through; color: var(--text-light);' : ''}">${action.description}</span>
                                    <span style="font-size: 0.8rem; color: var(--text-light);">${action.dueDate}</span>
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-light);">
                                    Sorumlu: ${action.responsible}
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p style="color: var(--text-light); font-size: 0.9rem;">Henüz aksiyon eklenmemiş.</p>'}
                </div>
            </div>
        </div>`;

    mainView.innerHTML = html;
    lucide.createIcons();
};

// CAPA Functions
window.openActionModal = function (findingId) {
    const modal = document.getElementById('action-modal');
    if (modal) {
        modal.querySelector('input[name="findingId"]').value = findingId;
        modal.classList.add('open');
    }
}

window.handleAddAction = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const findingId = parseInt(formData.get('findingId'));

    const finding = state.findings.find(f => f.id === findingId);
    if (!finding) return;

    if (!finding.actions) finding.actions = [];

    const newAction = {
        id: Date.now(),
        responsible: formData.get('responsible'),
        dueDate: formData.get('dueDate'),
        description: formData.get('description'),
        status: 'Devam Ediyor',
        createdAt: new Date().toISOString()
    };

    finding.actions.push(newAction);

    addLog('Aksiyon Eklendi', `"${finding.title}" bulgusu için yeni aksiyon eklendi: ${newAction.description}`, 'Finding', finding.id);
    saveToStorage();

    closeModal('action-modal');
    showToast('Aksiyon başarıyla eklendi', 'success');

    // Refresh view
    viewFinding(findingId);
}

// Conciliation View (Tebliğ ve Mutabakat)
function renderConciliation() {
    // Show findings that are in 'Tebliğ Edildi' or 'Cevaplandı' status (or all for demo)
    // Filter based on user role - Birim only sees findings assigned to their department
    let conciliationFindings = state.findings.filter(f => ['Tebliğ Edildi', 'Cevaplandı', 'Mutabık Değil', 'Kapalı (Mutabık Değil)', 'Mutabık', 'Red'].includes(f.status));

    // If current user is Birim, only show findings assigned to their department
    if (state.currentUserRole === 'Birim' && state.currentUserDepartment) {
        conciliationFindings = conciliationFindings.filter(f =>
            f.assignedTo === state.currentUserDepartment ||
            f.department === state.currentUserDepartment ||
            !f.assignedTo // Show findings without assignment for testing
        );
    }

    const listHtml = conciliationFindings.map(finding => {
        const audit = state.audits.find(a => a.id === finding.auditId);
        const inspectorName = audit ? audit.team : 'Bilinmeyen';
        const auditYear = audit ? audit.startDate.split('-')[0] : '';
        const auditType = audit ? audit.type.toLowerCase() : '';
        // Assuming inspector is part of the team string
        const auditTeamLower = audit ? audit.team.toLowerCase() : '';

        return `
        <div class="finding-item" 
             style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid var(--border);"
             data-status="${finding.status}"
             data-year="${auditYear}"
             data-type="${auditType}"
             data-inspector="${auditTeamLower}"
             data-title="${finding.title.toLowerCase()}"
             data-audit-title="${audit ? audit.title.toLowerCase() : ''}"
        >
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                    <h4 style="font-size: 1.1rem;">${finding.title}</h4>
                    <span style="font-size: 0.75rem; padding: 0.1rem 0.5rem; background: ${getRiskColor(finding.risk)}15; border-radius: 4px; color: ${getRiskColor(finding.risk)}; font-weight: 600;">${finding.risk}</span>
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-light);">
                    <span><span style="font-weight: 500;">Denetim:</span> ${audit ? audit.title : 'Bilinmeyen'}</span>
                    <span><span style="font-weight: 500;">Müfettiş:</span> ${inspectorName}</span>
                    <span><span style="font-weight: 500;">Aksiyon Tarihi:</span> ${finding.dueDate || '-'}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span style="padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; background: ${getFindingStatusColor(finding.status)}15; color: ${getFindingStatusColor(finding.status)};">
                    ${finding.status}
                </span>
                <div style="display: flex; gap: 0.5rem;">
                    ${finding.status === 'Tebliğ Edildi' ?
                `<button class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="viewFinding('${finding.id}')">
                            <i data-lucide="eye" style="width: 16px; margin-right: 0.5rem;"></i> Bulguyu Oku ve Cevapla
                        </button>` :
                finding.status === 'Cevaplandı' ?
                    `<button class="btn btn-primary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="window.openUpdateResponseModal('${finding.id}')">
                            <i data-lucide="edit-3" style="width: 16px; margin-right: 0.5rem;"></i> Cevabı Güncelle
                        </button>` :
                    finding.status === 'Mutabık Değil' ?
                        `<button class="btn" style="padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #f59e0b; color: white;" onclick="viewFinding('${finding.id}')">
                            <i data-lucide="clock" style="width: 16px; margin-right: 0.5rem;"></i> Müfettiş Görüşü Bekleniyor
                        </button>` :
                        `<button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="viewFinding('${finding.id}')">
                            <i data-lucide="eye" style="width: 16px; margin-right: 0.5rem;"></i> Detayı Gör
                        </button>`
            }
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Prepare Filters data (Reusing from state for visual consistency)
    const years = [...new Set(state.audits.map(a => a.startDate.split('-')[0]))].sort().reverse();
    const types = [...new Set(state.audits.map(a => a.type))].sort();

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Tebliğ ve Mutabakat</h3>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <select class="form-select" style="width: 120px;" id="conc-year-filter" onchange="filterConciliations()">
                    <option>Tüm Yıllar</option>
                    ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
                <select class="form-select" style="width: 180px;" id="conc-status-filter" onchange="filterConciliations()">
                    <option>Tüm Durumlar</option>
                    <option value="Tebliğ Edildi">Tebliğ Edildi</option>
                    <option value="Cevaplandı">Cevaplandı</option>
                    <option value="Mutabık Değil">Mutabık Değil</option>
                    <option value="Kapalı (Mutabık Değil)">Kapalı (Mutabık Değil)</option>
                    <option value="Mutabık">Mutabık</option>
                    <option value="Red">Red</option>
                </select>
                <select class="form-select" style="width: 130px;" id="conc-type-filter" onchange="filterConciliations()">
                    <option>Tüm Türler</option>
                    ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <input type="text" class="form-input" placeholder="Müfettiş ara..." style="width: 200px;" id="conc-inspector-filter" oninput="filterConciliations()">
                <input type="text" class="form-input" placeholder="Bulgu veya Denetim ara..." style="width: 250px;" id="conc-search-filter" oninput="filterConciliations()">
            </div>

            <div id="conc-list-container">${listHtml}</div>
        </div>
    `;
    lucide.createIcons();
}

window.filterConciliations = function () {
    const statusFilter = document.getElementById('conc-status-filter')?.value;
    const yearFilter = document.getElementById('conc-year-filter')?.value;
    const typeFilter = document.getElementById('conc-type-filter')?.value;
    const inspectorFilter = document.getElementById('conc-inspector-filter')?.value.toLowerCase() || '';
    const searchTerm = document.getElementById('conc-search-filter')?.value.toLowerCase() || '';

    const items = document.querySelectorAll('.finding-item');
    items.forEach(item => {
        const itemStatus = item.getAttribute('data-status');
        const itemYear = item.getAttribute('data-year');
        const itemType = item.getAttribute('data-type');
        const itemInspector = item.getAttribute('data-inspector'); // stored as lowercase
        const itemTitle = item.getAttribute('data-title');
        const itemAuditTitle = item.getAttribute('data-audit-title');

        let statusMatch = !statusFilter || statusFilter === 'Tüm Durumlar' || itemStatus === statusFilter;
        let yearMatch = !yearFilter || yearFilter === 'Tüm Yıllar' || itemYear === yearFilter;
        let typeMatch = !typeFilter || typeFilter === 'Tüm Türler' || itemType === typeFilter.toLowerCase();
        let inspectorMatch = !inspectorFilter || itemInspector.includes(inspectorFilter);
        let searchMatch = !searchTerm || itemTitle.includes(searchTerm) || itemAuditTitle.includes(searchTerm);

        item.style.display = (statusMatch && yearMatch && typeMatch && inspectorMatch && searchMatch) ? 'flex' : 'none';
    });
}

window.openConciliationModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) return;

    if (!document.getElementById('conciliation-modal')) {
        const modalHtml = `
        <div class="modal-overlay" id="conciliation-modal">
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">Bulgu Cevaplama ve Mutabakat</h3>
                    <button class="close-modal" onclick="closeModal('conciliation-modal')"><i data-lucide="x"></i></button>
                </div>
                <form onsubmit="handleConciliationSubmit(event)">
                    <input type="hidden" name="findingId">
                    <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; max-height: 70vh;">
                        <div style="margin-bottom:1.5rem; padding:1rem; background:#f3f4f6; border-radius:8px;">
                            <h4 style="font-size:0.9rem; margin-bottom:0.5rem; color:#374151;">Bulgu Detayı</h4>
                            <p id="con-finding-title" style="font-weight:600; font-size:1.1rem; margin-bottom:0.5rem;"></p>
                            <p id="con-finding-rec" style="font-size:0.9rem; color:#4b5563;"></p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Birim Cevabı</label>
                            <textarea name="departmentResponse" class="form-input" rows="4" placeholder="Bulguya istinaden cevabınızı ve alacağınız aksiyonları detaylandırın..." required></textarea>
                        </div>

                        <div class="grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Aksiyon Tarihi</label>
                                <input type="date" name="dueDate" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Aksiyon Sorumlusu</label>
                                <input type="text" name="responsible" class="form-input" placeholder="Ad Soyad" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Kanıt Yükle</label>
                            <div class="file-upload-area" onclick="document.getElementById('con-evidence').click()" style="border: 2px dashed var(--border); padding: 1.5rem; text-align: center; border-radius: 0.5rem; cursor: pointer;">
                                <input type="file" id="con-evidence" name="evidence" multiple hidden onchange="updateFileLabel(this)">
                                <i data-lucide="upload-cloud" style="width: 24px; height: 24px; margin-bottom: 0.5rem; color: var(--primary);"></i>
                                <p style="font-size: 0.9rem; color: var(--text-light);">Dosyaları buraya sürükleyin veya seçin</p>
                            </div>
                            <div id="con-file-list" style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;"></div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('conciliation-modal')">İptal</button>
                        <button type="submit" class="btn btn-primary">Kaydet ve Gönder</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        lucide.createIcons();
    }

    const modal = document.getElementById('conciliation-modal');
    const form = modal.querySelector('form');

    // Populate
    form.reset();
    form.querySelector('[name="findingId"]').value = finding.id;
    modal.querySelector('#con-finding-title').textContent = finding.title;
    modal.querySelector('#con-finding-rec').textContent = "Öneri: " + (finding.inspectorRecommendation || '-');

    if (finding.departmentResponse) form.querySelector('[name="departmentResponse"]').value = finding.departmentResponse;
    if (finding.dueDate) form.querySelector('[name="dueDate"]').value = finding.dueDate;
    if (finding.responsible) form.querySelector('[name="responsible"]').value = finding.responsible;
    if (finding.agreement) {
        const radio = form.querySelector(`input[name="agreement"][value="${finding.agreement}"]`);
        if (radio) radio.checked = true;
    }

    openModal('conciliation-modal');
}

window.handleConciliationSubmit = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('findingId');
    const finding = state.findings.find(f => f.id == id);
    if (!finding) return;

    finding.departmentResponse = formData.get('departmentResponse');
    finding.dueDate = formData.get('dueDate');
    finding.responsible = formData.get('responsible');
    finding.agreement = formData.get('agreement');
    finding.status = 'Cevaplandı';

    // Evidence Mock
    const fileInput = e.target.querySelector('input[name="evidence"]');
    if (fileInput && fileInput.files.length > 0) {
        if (!finding.evidence) finding.evidence = [];
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            finding.evidence.push({
                name: file.name,
                size: (file.size / 1024).toFixed(2) + ' KB',
                type: file.type,
                date: new Date().toLocaleDateString('tr-TR'),
                uploader: 'Birim Kullanıcısı'
            });
        }
    }

    addLog('Cevaplandı', `Mutabakat durumu: ${finding.agreement === 'yes' ? 'Mutabık' : 'Mutabık Değil'}. Birim tarafından cevap girildi.`, 'Finding', finding.id);
    saveToStorage();
    closeModal('conciliation-modal');
    showToast('Cevabınız ve mutabakat durumunuz kaydedildi.', 'success');
    renderConciliation(); // Or refresh whatever view is active
    if (state.currentPage === 'audit-detail') renderAuditDetail();
    if (state.currentPage === 'findings') renderFindings();
}

window.toggleActionStatus = function (findingId, actionId, isChecked) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding || !finding.actions) return;

    const action = finding.actions.find(a => a.id == actionId);
    if (action) {
        const oldStatus = action.status;
        action.status = isChecked ? 'Tamamlandı' : 'Devam Ediyor';

        addLog('Aksiyon Güncellendi', `Aksiyon durumu "${oldStatus}" -> "${action.status}" olarak güncellendi.`, 'Finding', finding.id);
        saveToStorage();
        showToast('Aksiyon durumu güncellendi', 'success');
    }
}


// Sanction Scanner Functions
function renderSanctionScanner() {
    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <h3>Yaptırım Tarama Sonuçları</h3>
                    <p style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">
                        Resmi Gazete tarama sonuçlarını görüntüleyin.
                    </p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="document.getElementById('scan-upload').click()">
                        <i data-lucide="upload" style="width: 16px; margin-right: 0.5rem;"></i> Sonuç Yükle (JSON)
                    </button>
                    <input type="file" id="scan-upload" accept=".json" style="display: none;" onchange="handleScanResultsUpload(this)">
                </div>
            </div>

            <div id="scan-results-container">
                <div style="text-align: center; padding: 3rem; color: var(--text-light); background: #f9fafb; border-radius: 0.5rem; border: 2px dashed var(--border);">
                    <i data-lucide="scan-line" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Henüz bir tarama sonucu yüklenmedi.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Python robotu tarafından üretilen <strong>scan_results.json</strong> dosyasını yükleyiniz.</p>
                </div>
            </div>
        </div>
        `;
    lucide.createIcons();
}

window.handleScanResultsUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const results = JSON.parse(e.target.result);
            displayScanResults(results);
            showToast('Tarama sonuçları başarıyla yüklendi.', 'success');
        } catch (error) {
            console.error('JSON parse error:', error);
            showToast('Dosya formatı hatalı!', 'error');
        }
    };
    reader.readAsText(file);
    input.value = ''; // Reset input
}

function displayScanResults(results) {
    const container = document.getElementById('scan-results-container');

    if (!results || !results.matches) {
        container.innerHTML = '<p class="text-danger">Geçersiz sonuç dosyası.</p>';
        return;
    }

    const matchCount = results.matches.length;
    const date = new Date(results.scan_date).toLocaleString('tr-TR');

    let html = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: #f0fdf4; padding: 1rem; border-radius: 0.5rem; border: 1px solid #dcfce7;">
                <span style="display: block; font-size: 0.85rem; color: #166534; margin-bottom: 0.25rem;">Tarama Tarihi</span>
                <strong style="color: #15803d; font-size: 1.1rem;">${date}</strong>
            </div>
            <div style="background: #eff6ff; padding: 1rem; border-radius: 0.5rem; border: 1px solid #dbeafe;">
                <span style="display: block; font-size: 0.85rem; color: #1e40af; margin-bottom: 0.25rem;">Taranan İsim Sayısı</span>
                <strong style="color: #1d4ed8; font-size: 1.1rem;">${results.total_names_scanned}</strong>
            </div>
            <div style="background: ${matchCount > 0 ? '#fef2f2' : '#f9fafb'}; padding: 1rem; border-radius: 0.5rem; border: 1px solid ${matchCount > 0 ? '#fee2e2' : '#e5e7eb'};">
                <span style="display: block; font-size: 0.85rem; color: ${matchCount > 0 ? '#991b1b' : '#374151'}; margin-bottom: 0.25rem;">Eşleşen Müşteri</span>
                <strong style="color: ${matchCount > 0 ? '#b91c1c' : '#111827'}; font-size: 1.1rem;">${matchCount}</strong>
            </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">İlgili Kararlar</h4>
            <ul style="list-style: disc; padding-left: 1.5rem; color: var(--text-light); font-size: 0.9rem;">
                ${results.decrees_found.map(d => `<li>${d}</li>`).join('')}
            </ul>
        </div>
        `;

    container.innerHTML = html;
}

// ============================================
// STAFF MODULE - Teftiş Kurulu Personeli
// ============================================
function renderStaff() {
    const staffList = state.staff || [];

    mainView.innerHTML = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 600; color: var(--text-main);">Teftiş Kurulu Personeli</h1>
                <p style="color: var(--text-light); font-size: 0.9rem;">Müfettiş ve yardımcılarının yönetimi</p>
            </div>
            <button class="btn btn-primary" onclick="openAddStaffModal()">
                <i data-lucide="user-plus" style="width: 18px; height: 18px;"></i>
                <span>Yeni Personel Ekle</span>
            </button>
        </div>
        
        <div class="card" style="padding: 1.5rem;">
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Personel</th>
                            <th>Ünvan</th>
                            <th>Sicil No</th>
                            <th>İletişim</th>
                            <th>İşe Giriş</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staffList.map(s => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 32px; height: 32px; background: #e0e7ff; color: #4338ca; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem;">
                                            ${s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <span style="font-weight: 500;">${s.name}</span>
                                    </div>
                                </td>
                                <td>${s.title}</td>
                                <td>${s.registrationNumber || '-'}</td>
                                <td style="font-size: 0.85rem;">
                                    <div>${s.email || '-'}</div>
                                    <div style="color: var(--text-light);">${s.phone || '-'}</div>
                                </td>
                                <td>${s.hireDate || '-'}</td>
                                <td><span class="badge badge-${s.status === 'Aktif' ? 'success' : 'secondary'}">${s.status}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="editStaff('${s.id}')" title="Düzenle">
                                        <i data-lucide="edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteStaff('${s.id}')" title="Sil" style="color: var(--danger);">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

window.openAddStaffModal = function () {
    openModal('staff-modal', null, true);
};

window.editStaff = function (staffId) {
    const staff = state.staff.find(s => s.id == staffId);
    if (!staff) return;
    openModal('staff-modal');

    // Auto-fill form
    setTimeout(() => {
        const modal = document.getElementById('staff-modal');
        const form = modal.querySelector('form');
        if (form) {
            form.querySelector('[name="id"]').value = staff.id;
            form.querySelector('[name="name"]').value = staff.name;
            form.querySelector('[name="title"]').value = staff.title;
            form.querySelector('[name="email"]').value = staff.email || '';
            form.querySelector('[name="phone"]').value = staff.phone || '';
            form.querySelector('[name="hireDate"]').value = staff.hireDate || '';
            form.querySelector('[name="registrationNumber"]').value = staff.registrationNumber || '';
            form.querySelector('[name="status"]').value = staff.status || 'Aktif';

            modal.querySelector('.modal-title').textContent = 'Personel Düzenle';
            modal.querySelector('button[type="submit"]').textContent = 'Güncelle';
        }
    }, 100);
};

window.handleStaffSubmit = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const isEdit = id && id.trim() !== '';

    const staffData = {
        id: isEdit ? id : Date.now().toString(),
        name: formData.get('name'),
        title: formData.get('title'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        hireDate: formData.get('hireDate'),
        registrationNumber: formData.get('registrationNumber'),
        status: formData.get('status') || 'Aktif'
    };

    if (!state.staff) state.staff = [];

    if (isEdit) {
        const index = state.staff.findIndex(s => s.id == id);
        if (index !== -1) {
            state.staff[index] = { ...state.staff[index], ...staffData };
            showToast('Personel güncellendi', 'success');
        }
    } else {
        state.staff.push(staffData);
        showToast('Personel eklendi', 'success');
    }

    saveToStorage();
    closeModal('staff-modal');
    renderStaff();
};

window.deleteStaff = function (staffId) {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    state.staff = state.staff.filter(s => s.id != staffId);
    saveToStorage();
    renderStaff();
    showToast('Personel silindi', 'success');
};

function getEducationStatusColor(status) {
    const colors = {
        'Planlandı': 'info',
        'Devam Ediyor': 'warning',
        'Tamamlandı': 'success',
        'İptal Edildi': 'danger'
    };
    return colors[status] || 'secondary';
}

window.openEducationModal = function () {
    openModal('education-modal');
};

window.handleEducationSubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const educationId = formData.get('id');
    const isEdit = educationId && educationId.trim() !== '';

    // Get selected participants
    const selectedParticipants = [];
    form.querySelectorAll('input[name="participants"]:checked').forEach(cb => {
        selectedParticipants.push(cb.value);
    });

    const educationData = {
        id: isEdit ? educationId : Date.now().toString(),
        title: formData.get('title'),
        instructor: formData.get('instructor'),
        date: formData.get('date'),
        endDate: formData.get('endDate'),
        duration: formData.get('duration'),
        location: formData.get('location'),
        description: formData.get('description'),
        status: formData.get('status') || 'Planlandı',
        participants: selectedParticipants, // Use list of names
        createdAt: new Date().toISOString()
    };

    if (!state.trainings) state.trainings = [];

    if (isEdit) {
        const index = state.trainings.findIndex(t => String(t.id) === String(educationId));
        if (index !== -1) {
            state.trainings[index] = { ...state.trainings[index], ...educationData };
            showToast('Eğitim başarıyla güncellendi!', 'success');
        }
    } else {
        state.trainings.push(educationData);
        addLog('Yeni Eğitim', `"${educationData.title}" eğitimi oluşturuldu.`, 'Training', educationData.id);
        showToast('Eğitim başarıyla oluşturuldu!', 'success');
    }

    saveToStorage();
    closeModal('education-modal');
    renderEducation();
};

// Alias for HTML form compatibility
window.handleAddEducation = window.handleEducationSubmit;

// ============================================
// AUDIT UNIVERSE PAGE - Denetim Evreni
// ============================================
function renderAuditUniverse() {
    const universe = state.auditUniverse || [];

    mainView.innerHTML = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h1 style="font-size: 1.5rem; font-weight: 600; color: var(--text-main);">Denetim Evreni</h1>
                <p style="color: var(--text-light); font-size: 0.9rem;">Denetlenebilir varlıklar ve risk değerlendirmeleri</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('audit-universe-modal')">
                <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
                <span>Yeni Varlık Ekle</span>
            </button>
        </div>
        
        <div class="card" style="padding: 1.5rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <input type="text" class="form-input" placeholder="Varlık ara..." style="max-width: 300px;" id="universe-search">
                <select class="form-select" style="max-width: 200px;" id="universe-risk-filter">
                    <option value="">Tüm Risk Seviyeleri</option>
                    <option value="Kritik">Kritik</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Orta">Orta</option>
                    <option value="Düşük">Düşük</option>
                </select>
                <select class="form-select" style="max-width: 200px;" id="universe-type-filter">
                    <option value="">Tüm Türler</option>
                    <option value="Şube">Şube</option>
                    <option value="Departman">Departman</option>
                    <option value="Süreç">Süreç</option>
                    <option value="IT Sistemi">IT Sistemi</option>
                </select>
            </div>
            
            <div class="table-container">
                <table class="data-table" id="universe-table">
                    <thead>
                        <tr>
                            <th>Varlık Adı</th>
                            <th>Tür</th>
                            <th>Risk Seviyesi</th>
                            <th>Son Denetim</th>
                            <th>Denetim Sıklığı</th>
                            <th>Sonraki Denetim</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody id="universe-table-body">
                        ${universe.length === 0 ? `
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
                                    <i data-lucide="globe" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 1rem;"></i>
                                    <p>Henüz denetim evreni varlığı bulunmuyor.</p>
                                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openModal('audit-universe-modal')">
                                        <i data-lucide="plus"></i> İlk Varlığı Ekle
                                    </button>
                                </td>
                            </tr>
                        ` : universe.map(u => `
                            <tr data-id="${u.id}">
                                <td><strong>${u.name}</strong></td>
                                <td>${u.type || '-'}</td>
                                <td><span class="badge badge-${getRiskBadgeColor(u.riskLevel)}">${u.riskLevel || 'Belirsiz'}</span></td>
                                <td>${u.lastAuditDate ? formatDate(u.lastAuditDate) : 'Yok'}</td>
                                <td>${u.auditFrequency || '-'}</td>
                                <td>${u.nextAuditDate ? formatDate(u.nextAuditDate) : '-'}</td>
                                <td>
                                    <button class="btn-icon" onclick="viewUniverseItem('${u.id}')" title="Görüntüle">
                                        <i data-lucide="eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="editUniverseItem('${u.id}')" title="Düzenle">
                                        <i data-lucide="edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteUniverseItem('${u.id}')" title="Sil" style="color: var(--danger);">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function getRiskBadgeColor(risk) {
    const colors = {
        'Kritik': 'critical',
        'Yüksek': 'danger',
        'Orta': 'warning',
        'Düşük': 'success'
    };
    return colors[risk] || 'secondary';
}

window.handleUniverseSubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const itemId = formData.get('id');
    const isEdit = itemId && itemId.trim() !== '';

    const itemData = {
        id: isEdit ? itemId : Date.now().toString(),
        name: formData.get('name'),
        type: formData.get('type'),
        riskLevel: formData.get('riskLevel'),
        description: formData.get('description'),
        lastAuditDate: formData.get('lastAuditDate'),
        auditFrequency: formData.get('auditFrequency'),
        nextAuditDate: formData.get('nextAuditDate'),
        createdAt: new Date().toISOString()
    };

    if (!state.auditUniverse) state.auditUniverse = [];

    if (isEdit) {
        const index = state.auditUniverse.findIndex(u => String(u.id) === String(itemId));
        if (index !== -1) {
            state.auditUniverse[index] = { ...state.auditUniverse[index], ...itemData };
            showToast('Varlık başarıyla güncellendi!', 'success');
        }
    } else {
        state.auditUniverse.push(itemData);
        addLog('Yeni Varlık', `"${itemData.name}" varlığı oluşturuldu.`, 'Universe', itemData.id);
        showToast('Varlık başarıyla oluşturuldu!', 'success');
    }

    saveToStorage();
    closeModal('audit-universe-modal');
    renderAuditUniverse();
};


// Reuse confirm dialog or create a custom simple modal for details
// Since showConfirmDialog is specific, let's just alert for now or build a quick modal overlay if needed.
// Better: Create a dedicated simple modal for this.

const modalId = 'log-details-modal';
let modal = document.getElementById(modalId);
if (!modal) {
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
}




// Export Ethics Data (Mock)
window.exportEthicsData = function (type) {
    showToast(`Etik Raporları(${type.toUpperCase()}) indiriliyor...`, 'info');
    setTimeout(() => {
        showToast('İndirme tamamlandı.', 'success');
    }, 1500);
}

// Filter Activities in Dashboard
window.filterActivities = function (searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const activityItems = document.querySelectorAll('#activity-list > div');

    activityItems.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    // If no matches, show message (optional but good UX)
    // We'd need a way to insert/remove a "No results" message dynamically, 
    // but for now keeping it simple is fine as per user request.
}

// Initialize Application (Consolidated)
document.addEventListener('DOMContentLoaded', async () => {
    // Add Submenu CSS
    const style = document.createElement('style');
    style.textContent = `
        .submenu {
        transition: all 0.3s ease;
    }
        .nav - link {
        user - select: none;
    }
    `;
    document.head.appendChild(style);

    console.log("🔧 Denetim Sistemi Başlatılıyor...");

    // 1. Check & Load local data
    let savedData = loadFromStorage();

    // Force Default Data if empty (Crucial for "Empty Data" issue)
    if (!savedData.audits || savedData.audits.length === 0) {
        console.warn("⚠️ Veri bulunamadı veya boş, varsayılan veriler yükleniyor...");
        const defaultData = getDefaultData();
        state.audits = defaultData.audits;
        state.findings = defaultData.findings;
        state.deletedAudits = [];
        state.ethicsReports = defaultData.ethicsReports || [];
        state.logs = [];
        state.auditPlans = [];
        saveToStorage(); // Persist immediately
    } else {
        state.audits = savedData.audits;
        state.findings = savedData.findings;
        state.deletedAudits = savedData.deletedAudits || [];
        state.ethicsReports = savedData.ethicsReports || [];
        state.logs = savedData.logs || [];
        state.auditPlans = savedData.auditPlans || [];
    }

    // 2. Initialize navigation
    const navLinks = document.querySelectorAll('.nav-link');
    console.log(`🔍 Nav Links Found: ${navLinks.length} `);

    // 3. Populate LDAP Datalist
    const ldapList = document.getElementById('ldap-users');
    if (ldapList) {
        ldapList.innerHTML = ldapUsers.map(u => `<option value="${u.name}">${u.title}</option>`).join('');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            console.log('🖱️ Nav Link Clicked:', e.currentTarget.dataset.page);
            const page = e.currentTarget.dataset.page;
            if (page) {
                navigateTo(page);
            } else {
                // Handle submenu toggles which might not have data-page
                const submenuParent = e.currentTarget.nextElementSibling;
                if (submenuParent && submenuParent.classList.contains('submenu')) {
                    // It's a submenu toggle
                    console.log('📂 Submenu toggled via click listener');
                }
            }
        });
    });

    // 3. Embedded Mode Check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('embedded') === 'true') {
        const sidebar = document.querySelector('.sidebar');
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const mainContent = document.querySelector('.main-content');

        if (sidebar) sidebar.style.display = 'none';
        if (mobileBtn) mobileBtn.style.display = 'none';
        if (mainContent) {
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
            mainContent.style.padding = '1rem';
        }
    }

    // 4. Update UI
    updateTrashCount();

    // Initial Render
    // Check URL params for view??
    // The main app router (Next.js) handles the view param -> iframe src messge
    // But standalone, we default to dashboard.
    renderPage('dashboard');

    // 5. Try to refresh data from API (background)
    // Don't await this blocking if backend is slow/down
    refreshData().then(() => {
        console.log("✅ Veriler güncellendi (API)");
    }).catch(err => {
        console.warn("⚠️ API verisi alınamadı, yerel veri kullanılıyor:", err);
    });

    console.log("✅ Denetim Sistemi Hazır!");
});


// Cross-origin Navigation Handler (Fix for Sidebar Links)
window.addEventListener('message', function (event) {
    // Security check: You might want to check event.origin here in production
    if (event.data && event.data.type === 'NAVIGATE') {
        const page = event.data.page;
        console.log("📥 Received Navigation Request:", page);

        // Handle specific views mappings if necessary
        // The sidebar passes 'ethics-submit' etc, which match our data-page usage.

        if (typeof navigateTo === 'function') {
            navigateTo(page);
        } else if (typeof renderPage === 'function') {
            renderPage(page);
        } else {
            console.error("navigateTo or renderPage function not found!");
        }
    }
});

// Modal Control Functions are handled in modal-helpers.js

// Handle Add Action (Previously missing)
window.handleAddAction = function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const findingId = formData.get('findingId');

    // Convert to number/string consistent with IDs
    const finding = state.findings.find(f => f.id == findingId);

    if (!finding) {
        showToast('Bulgu bulunamadı!', 'error');
        return;
    }

    if (!finding.actions) finding.actions = [];

    const syncJira = formData.get('syncJira') === 'on';
    const jiraKey = syncJira ? `AUD-${Math.floor(Math.random() * 10000)}` : null;

    const newAction = {
        id: Date.now(),
        responsible: formData.get('responsible'),
        dueDate: formData.get('dueDate'),
        description: formData.get('description'),
        status: 'Devam Ediyor',
        createdAt: new Date().toISOString(),
        jiraKey: jiraKey, // Mock Jira Integration
        jiraLink: jiraKey ? `https://jira.banka.internal/browse/${jiraKey}` : null
    };

    if (syncJira) {
        showToast(`Jira taskı oluşturuldu: ${jiraKey}`, 'info');
    }

    finding.actions.push(newAction);

    // Update finding status if needed, or just log
    addLog('Aksiyon Eklendi', `"${finding.title}" bulgusu için yeni aksiyon tanımlandı.`, 'Finding', finding.id);

    saveToStorage();
    closeModal('action-modal');
    showToast('Aksiyon başarıyla eklendi!', 'success');

    // Refresh view if active
    if (state.currentPage === 'finding-detail' || document.getElementById('finding-modal')?.classList.contains('open')) {
        // If we are on finding view, refresh it.
        // If we are strictly in a modal, no need to refresh page content unless it's visible background
    }
    // If we're inside viewFinding detail
    const detailsView = document.querySelector('.card h2'); // loose check
    if (detailsView && detailsView.textContent === finding.title) {
        viewFinding(finding.id);
    }
}


// Audit Universe View
function renderAuditUniverse() {
    // Helper to build tree
    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => item.parentId === parentId)
            .map(item => ({ ...item, children: buildTree(items, item.id) }));
    };

    const treeData = buildTree(state.auditUniverse || []);

    // Recursively render tree rows
    const renderTreeRows = (nodes, depth = 0) => {
        return nodes.map(node => {
            const paddingLeft = depth * 20 + 20;
            const hasChildren = node.children && node.children.length > 0;

            return `
            <div class="tree-row" style="display: flex; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border);">
                <div style="flex: 2; padding-left: ${paddingLeft}px; display: flex; align-items: center; gap: 0.5rem;">
                    ${hasChildren ? '<i data-lucide="folder" style="width: 16px; color: var(--text-light);"></i>' : '<i data-lucide="file" style="width: 16px; color: var(--text-light);"></i>'}
                    <span style="font-weight: 500;">${node.name}</span>
                </div>
                <div style="flex: 1; color: var(--text-light); font-size: 0.9rem;">
                   <span style="padding: 0.2rem 0.6rem; background: #f3f4f6; border-radius: 4px;">${node.type}</span>
                </div>
                <div style="flex: 1; display:flex; align-items:center; gap:0.5rem;">
                    <div style="flex:1; height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden;">
                        <div style="width: ${node.riskScore}%; height: 100%; background: ${getRiskScoreColor(node.riskScore)};"></div>
                    </div>
                    <span style="font-size: 0.85rem; font-weight: 600; color: ${getRiskScoreColor(node.riskScore)};">${node.riskScore}</span>
                </div>
                <div style="flex: 1; color: var(--text-light); font-size: 0.9rem;">
                    ${node.lastAuditDate}
                </div>
                <div style="width: 100px; text-align: right;">
                    <button class="btn btn-sm btn-secondary" onclick="editUniverseItem(${node.id})">
                        <i data-lucide="edit-2" style="width: 14px;"></i>
                    </button>
                </div>
            </div>
            ${renderTreeRows(node.children, depth + 1)}
            `;
        }).join('');
    };

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Denetim Evreni</h3>
                <button class="btn btn-primary" onclick="window.addUniverseItem()">
                    <i data-lucide="plus" style="width: 18px; margin-right: 0.5rem;"></i> Yeni Varlık Ekle
                </button>
            </div>
            
            <div class="tree-header" style="display: flex; padding: 0.75rem 0; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--text-light); font-size: 0.85rem;">
                <div style="flex: 2; padding-left: 20px;">Varlık Adı</div>
                <div style="flex: 1;">Tür</div>
                <div style="flex: 1;">Risk Skoru</div>
                <div style="flex: 1;">Son Denetim</div>
                <div style="width: 100px; text-align: right;">İşlemler</div>
            </div>

            <div class="tree-body">
                ${renderTreeRows(treeData)}
            </div>
        </div>
    `;
    lucide.createIcons();
}

function getRiskScoreColor(score) {
    if (score >= 90) return '#ef4444'; // Critical
    if (score >= 70) return '#f97316'; // High
    if (score >= 50) return '#eab308'; // Medium
    return '#10b981'; // Low
}

window.renderAuditUniverse = renderAuditUniverse;
// Audit Universe Actions
window.addUniverseItem = function () {
    openModal('audit-universe-modal');
    // Prepare form for new item
    const form = document.querySelector('#audit-universe-modal form');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    document.getElementById('uni-modal-title').textContent = 'Yeni Varlık Ekle';
    document.getElementById('uni-modal-btn').textContent = 'Ekle';

    // Populate Parent Dropdown
    const parentSelect = document.getElementById('uni-parent-select');
    parentSelect.innerHTML = '<option value="">- Yok (Ana Varlık) -</option>';

    // Flat list is easier to populate dropdown
    state.auditUniverse.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name + ' (' + item.type + ')';
        parentSelect.appendChild(option);
    });
};

window.editUniverseItem = function (id) {
    const item = state.auditUniverse.find(i => i.id === id);
    if (!item) return;

    openModal('audit-universe-modal');
    const form = document.querySelector('#audit-universe-modal form');

    // Populate form
    form.querySelector('[name="id"]').value = item.id;
    form.querySelector('[name="name"]').value = item.name;
    form.querySelector('[name="type"]').value = item.type;
    form.querySelector('[name="riskScore"]').value = item.riskScore;
    form.querySelector('[name="lastAuditDate"]').value = item.lastAuditDate || ''; // Handle potential null/dash

    document.getElementById('uni-modal-title').textContent = 'Varlık Düzenle';
    document.getElementById('uni-modal-btn').textContent = 'Güncelle';

    // Populate Parent Dropdown (exclude self to prevent cycles)
    const parentSelect = document.getElementById('uni-parent-select');
    parentSelect.innerHTML = '<option value="">- Yok (Ana Varlık) -</option>';

    state.auditUniverse.forEach(uItem => {
        if (uItem.id !== item.id) { // Simple cycle prevention (self)
            const option = document.createElement('option');
            option.value = uItem.id;
            // Select if currently parent
            if (item.parentId && item.parentId == uItem.id) option.selected = true;
            option.textContent = uItem.name + ' (' + uItem.type + ')';
            parentSelect.appendChild(option);
        }
    });

    if (!item.parentId) parentSelect.value = "";
};

window.handleUniverseSubmit = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');

    const itemData = {
        name: formData.get('name'),
        type: formData.get('type'),
        parentId: formData.get('parentId') ? Number(formData.get('parentId')) : null,
        riskScore: Number(formData.get('riskScore')),
        lastAuditDate: formData.get('lastAuditDate') || '-'
    };

    if (id) {
        // Edit
        const item = state.auditUniverse.find(i => i.id == id);
        if (item) {
            const changes = { old: { ...item }, new: { ...item, ...itemData } };
            Object.assign(item, itemData);
            addLog('Düzenlendi', `"${item.name}" varlığı güncellendi.`, 'Universe', item.id, changes);
            showToast('Varlık güncellendi', 'success');
        }
    } else {
        // Create
        const newItem = {
            id: Date.now(),
            ...itemData,
            children: [] // Initial empty children
        };
        state.auditUniverse.push(newItem);
        addLog('Oluşturuldu', `"${newItem.name}" varlığı evrene eklendi.`, 'Universe', newItem.id);
        showToast('Yeni varlık eklendi', 'success');
    }

    saveToStorage();
    closeModal('audit-universe-modal');
    renderAuditUniverse(); // Re-render tree
};

// Global Audit Logs View
function renderAuditLogs() {
    // Sort logs by date desc
    const sortedLogs = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get unique Users and Actions for dropdowns
    const users = [...new Set(state.logs.map(l => l.user))].sort();
    const actions = [...new Set(state.logs.map(l => l.action))].sort();

    // Helper for log icon
    const getLogIcon = (action) => {
        if (action.includes('Silindi')) return 'trash-2';
        if (action.includes('Düzenlendi')) return 'edit';
        if (action.includes('Oluşturuldu')) return 'plus-circle';
        if (action.includes('Tebliğ')) return 'send';
        if (action.includes('Giriş')) return 'log-in';
        return 'activity';
    };

    const listHtml = sortedLogs.length > 0 ? sortedLogs.map(log => {
        const targetTypeDisplay = log.targetType === 'Finding' ? 'Bulgu' :
            log.targetType === 'Audit' ? 'Denetim' :
                log.targetType === 'Staff' ? 'Personel' :
                    log.targetType === 'AuditPlan' ? 'Plan' :
                        log.targetType || 'Sistem';

        return `
        <div class="log-item" 
             style="display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border); hover:background: #f9fafb;"
             data-user="${log.user.toLowerCase()}"
             data-action="${log.action.toLowerCase()}"
             data-type="${(log.targetType || 'System').toLowerCase()}"
             data-date="${log.date}"
             data-search="${(log.details + ' ' + log.action + ' ' + log.user).toLowerCase()}"
        >
            <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                <i data-lucide="${getLogIcon(log.action)}" style="width: 20px; color: var(--text-light);"></i>
            </div>
            <div style="flex: 2;">
                <div style="font-weight: 500; color: var(--text-main);">${log.action}</div>
                <div style="font-size: 0.85rem; color: var(--text-light);">
                    ${formatLogDetails(log.details, log.changeData)}
                </div>
            </div>
            <div style="flex: 1; font-size: 0.9rem; color: var(--text-main);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                     <div style="width: 24px; height: 24px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
                        ${log.user.charAt(0).toUpperCase()}
                    </div>
                    ${log.user}
                </div>
            </div>
            <div style="flex: 1; font-size: 0.85rem; color: var(--text-light);">
                ${formatDate(log.date)} ${new Date(log.date).toLocaleTimeString('tr-TR')}
            </div>
             <div style="flex: 1; font-size: 0.85rem; color: var(--text-light);">
                <span style="padding: 0.2rem 0.6rem; background: #f3f4f6; border-radius: 4px;">${targetTypeDisplay}</span>
            </div>
            <div style="width: 100px; text-align: right;">
                <button class="btn btn-sm btn-secondary" onclick="viewLogDetail(${log.id})">
                    <i data-lucide="eye" style="width: 14px; margin-right: 0.25rem;"></i> Detay
                </button>
            </div>
        </div>
    `}).join('') : '<div style="padding: 2rem; text-align: center; color: var(--text-light);">Henüz kayıt bulunmamaktadır.</div>';

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>İz Kayıtları (Audit Trail)</h3>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="exportLogs()">
                        <i data-lucide="download" style="width: 16px; margin-right: 0.5rem;"></i> Excel İndir
                    </button>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <input type="text" id="log-search" class="form-input" placeholder="İşlem, kullanıcı veya detay ara..." style="width: 250px;" oninput="filterAuditLogs()">
                
                <select id="log-type-filter" class="form-select" style="width: 140px;" onchange="filterAuditLogs()">
                    <option value="">Tüm Tipler</option>
                    <option value="Audit">Denetim</option>
                    <option value="Finding">Bulgu</option>
                    <option value="Staff">Personel</option>
                    <option value="AuditPlan">Plan</option>
                    <option value="System">Sistem</option>
                </select>

                <select id="log-user-filter" class="form-select" style="width: 140px;" onchange="filterAuditLogs()">
                    <option value="">Tüm Kullanıcılar</option>
                    ${users.map(u => `<option value="${u}">${u}</option>`).join('')}
                </select>

                <select id="log-action-filter" class="form-select" style="width: 160px;" onchange="filterAuditLogs()">
                    <option value="">Tüm İşlemler</option>
                    ${actions.map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-light);">Tarih:</span>
                    <input type="date" id="log-date-start" class="form-input" style="width: 130px;" onchange="filterAuditLogs()">
                    <span style="font-size: 0.85rem; color: var(--text-light);">-</span>
                    <input type="date" id="log-date-end" class="form-input" style="width: 130px;" onchange="filterAuditLogs()">
                </div>
            </div>

            <div class="log-table-header" style="display: flex; padding: 0.75rem 1rem; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--text-light); font-size: 0.85rem; background: #f9fafb; border-radius: 8px 8px 0 0;">
                <div style="width: 56px;"></div> <!-- Icon placeholder -->
                <div style="flex: 2;">İşlem</div>
                <div style="flex: 1;">Kullanıcı</div>
                <div style="flex: 1;">Zaman</div>
                <div style="flex: 1;">Hedef</div>
                <div style="width: 100px; text-align: right;">İşlemler</div>
            </div>

            <div id="audit-log-list" class="log-table-body">
                ${listHtml}
            </div>
            <div id="log-no-results" style="display: none; padding: 2rem; text-align: center; color: var(--text-light);">
                Kriterlere uygun kayıt bulunamadı.
            </div>
        </div>
    `;
    lucide.createIcons();
}

// Helper to safely format log details and handle legacy/corrupted data
function formatLogDetails(details, changeData) {
    if (typeof details === 'object') return JSON.stringify(details);
    if (String(details).includes('[object Object]')) return '<i>İşlem detayı görüntülenemiyor (Eski veri)</i>';

    let output = details;
    // Append rejection note if present in changeData (for logs)
    if (changeData && changeData.new && changeData.new.rejectionNote) {
        output += `<br><span style="color: #ef4444; font-style: italic;"><strong>Red Sebebi:</strong> ${changeData.new.rejectionNote}</span>`;
    }
    return output;
}

window.renderAuditLogs = renderAuditLogs;
window.exportLogs = () => showToast('Log indirme işlemi başlatıldı...', 'info');
// Unified Filter Function
window.filterAuditLogs = function () {
    const searchTerm = document.getElementById('log-search')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('log-type-filter')?.value.toLowerCase();
    const userFilter = document.getElementById('log-user-filter')?.value.toLowerCase();
    const actionFilter = document.getElementById('log-action-filter')?.value.toLowerCase();
    const startDateVal = document.getElementById('log-date-start')?.value;
    const endDateVal = document.getElementById('log-date-end')?.value;

    const startDate = startDateVal ? new Date(startDateVal) : null;
    const endDate = endDateVal ? new Date(endDateVal) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999); // Include full end day

    const rows = document.querySelectorAll('#audit-log-list .log-item');
    let visibleCount = 0;

    rows.forEach(row => {
        const rowSearch = row.getAttribute('data-search');
        const rowType = row.getAttribute('data-type');
        const rowUser = row.getAttribute('data-user');
        const rowAction = row.getAttribute('data-action');
        const rowDate = new Date(row.getAttribute('data-date'));

        let isMatch = true;

        if (searchTerm && !rowSearch.includes(searchTerm)) isMatch = false;
        if (typeFilter && rowType !== typeFilter) isMatch = false;
        if (userFilter && rowUser !== userFilter) isMatch = false;
        if (actionFilter && rowAction !== actionFilter) isMatch = false;

        if (startDate && rowDate < startDate) isMatch = false;
        if (endDate && rowDate > endDate) isMatch = false;

        if (isMatch) {
            row.style.display = 'flex';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    const noResults = document.getElementById('log-no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

// Remove legacy filter functions if they exist in global scope to avoid confusion
delete window.filterLogs;
delete window.filterLogsByType;
delete window.filterLogsByDateRange;

// ============================
// Takip Edilecek Bulgular (Follow-Up Findings)
// ============================
function renderFollowUpFindings() {
    const now = new Date();

    // Filter: Open findings with future due dates (not Closed, not Draft)
    const followUpFindings = state.findings.filter(f => {
        if (f.status === 'Kapalı' || f.status === 'Taslak') return false;
        if (!f.dueDate) return false;
        const dueDate = new Date(f.dueDate);
        return dueDate >= now;
    }).map(f => {
        const dueDate = new Date(f.dueDate);
        const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        let urgency = 'normal';
        if (daysRemaining <= 7) urgency = 'critical';
        else if (daysRemaining <= 30) urgency = 'warning';
        return { ...f, daysRemaining, urgency };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Stats
    const criticalCount = followUpFindings.filter(f => f.urgency === 'critical').length;
    const warningCount = followUpFindings.filter(f => f.urgency === 'warning').length;
    const normalCount = followUpFindings.filter(f => f.urgency === 'normal').length;

    const urgencyStyles = {
        critical: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', label: 'Acil', icon: 'alert-triangle' },
        warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', label: 'Yaklaşıyor', icon: 'clock' },
        normal: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', label: 'Normal', icon: 'calendar' }
    };

    let listHtml = '';
    if (followUpFindings.length === 0) {
        listHtml = '<div style="text-align: center; padding: 3rem; color: var(--text-light);"><i data-lucide="check-circle" style="width: 64px; height: 64px; margin-bottom: 1rem; opacity: 0.3;"></i><p style="font-size: 1.1rem;">Takip edilecek bulgu bulunmamaktadır.</p></div>';
    } else {
        listHtml = followUpFindings.map(finding => {
            const audit = state.audits.find(a => a.id === finding.auditId);
            const auditTitle = audit ? audit.title : 'Bilinmeyen Denetim';
            const inspectors = audit ? audit.team : '-';
            const department = audit ? audit.department : '-';
            const style = urgencyStyles[finding.urgency];
            const dueDateFormatted = formatDate(finding.dueDate);

            return '<div class="follow-up-item" style="background: ' + style.bg + '; border: 1px solid ' + style.border + '; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;" data-urgency="' + finding.urgency + '" data-status="' + finding.status + '" data-department="' + (department || '').toLowerCase() + '">' +
                '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">' +
                '<div style="flex: 1;">' +
                '<div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">' +
                '<h4 style="font-size: 1.1rem; font-weight: 600; color: #1f2937;">' + finding.title + '</h4>' +
                '<span style="padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: ' + getRiskColor(finding.risk) + '15; color: ' + getRiskColor(finding.risk) + ';">' + finding.risk + '</span>' +
                '<span style="padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; background: ' + getFindingStatusColor(finding.status) + '15; color: ' + getFindingStatusColor(finding.status) + ';">' + finding.status + '</span>' +
                '</div>' +
                '<p style="font-size: 0.9rem; color: #6b7280;">' + auditTitle + '</p>' +
                '</div>' +
                '<div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: ' + style.color + '15; border-radius: 8px;">' +
                '<i data-lucide="' + style.icon + '" style="width: 18px; height: 18px; color: ' + style.color + ';"></i>' +
                '<div style="text-align: right;">' +
                '<div style="font-size: 1.25rem; font-weight: 700; color: ' + style.color + ';">' + finding.daysRemaining + '</div>' +
                '<div style="font-size: 0.7rem; color: ' + style.color + '; text-transform: uppercase;">gün kaldı</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.7); border-radius: 8px; margin-bottom: 1rem;">' +
                '<div><div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.25rem;">Birim</div><div style="font-size: 0.9rem; font-weight: 500; color: #374151;">' + department + '</div></div>' +
                '<div><div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.25rem;">Müfettiş</div><div style="font-size: 0.9rem; font-weight: 500; color: #374151;">' + inspectors + '</div></div>' +
                '<div><div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.25rem;">Aksiyon Tarihi</div><div style="font-size: 0.9rem; font-weight: 500; color: #374151;">' + dueDateFormatted + '</div></div>' +
                '<div><div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.25rem;">Sorumlu</div><div style="font-size: 0.9rem; font-weight: 500; color: #374151;">' + (finding.responsible || '-') + '</div></div>' +
                '</div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<div style="display: flex; gap: 0.5rem;">' +
                (finding.urgency === 'critical' ? '<button class="btn" style="background: #dc2626; color: white; padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="sendFollowUpReminder(\'' + finding.id + '\')"><i data-lucide="bell" style="width: 14px; margin-right: 0.5rem;"></i> Hatırlatma Gönder</button>' : '') +
                '<button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="openReNotificationModal(\'' + finding.id + '\')"><i data-lucide="send" style="width: 14px; margin-right: 0.5rem;"></i> Tekrar Tebliğ Et</button>' +
                '</div>' +
                '<button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="viewFinding(\'' + finding.id + '\')"><i data-lucide="eye" style="width: 14px; margin-right: 0.5rem;"></i> Detay</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    mainView.innerHTML =
        '<div class="card" style="margin-bottom: 1.5rem;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">' +
        '<div>' +
        '<h3 style="font-size: 1.5rem; font-weight: 700;">Takip Edilecek Bulgular</h3>' +
        '<p style="color: var(--text-light); font-size: 0.9rem; margin-top: 0.25rem;">Aksiyon tarihi yaklaşan açık bulgular. Sistem otomatik hatırlatma gönderir.</p>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="sendBulkReminders()"><i data-lucide="bell-ring" style="width: 16px; margin-right: 0.5rem;"></i> Toplu Hatırlatma</button>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">' +
        '<div style="background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 1.25rem; border-radius: 12px; text-align: center;">' +
        '<div style="font-size: 2rem; font-weight: 700; color: #dc2626;">' + criticalCount + '</div>' +
        '<div style="font-size: 0.85rem; color: #991b1b; font-weight: 500;">Acil (7 gün içinde)</div>' +
        '</div>' +
        '<div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 1.25rem; border-radius: 12px; text-align: center;">' +
        '<div style="font-size: 2rem; font-weight: 700; color: #d97706;">' + warningCount + '</div>' +
        '<div style="font-size: 0.85rem; color: #92400e; font-weight: 500;">Yaklaşıyor (30 gün içinde)</div>' +
        '</div>' +
        '<div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 1.25rem; border-radius: 12px; text-align: center;">' +
        '<div style="font-size: 2rem; font-weight: 700; color: #16a34a;">' + normalCount + '</div>' +
        '<div style="font-size: 0.85rem; color: #166534; font-weight: 500;">Normal (30+ gün)</div>' +
        '</div>' +
        '<div style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe); padding: 1.25rem; border-radius: 12px; text-align: center;">' +
        '<div style="font-size: 2rem; font-weight: 700; color: #4f46e5;">' + followUpFindings.length + '</div>' +
        '<div style="font-size: 0.85rem; color: #3730a3; font-weight: 500;">Toplam Takip</div>' +
        '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; padding: 1rem; background: #f9fafb; border-radius: 8px;">' +
        '<select class="form-select" style="width: 150px;" id="followup-urgency-filter" onchange="filterFollowUpFindings()">' +
        '<option value="">Tüm Durumlar</option>' +
        '<option value="critical">🔴 Acil</option>' +
        '<option value="warning">🟡 Yaklaşıyor</option>' +
        '<option value="normal">🟢 Normal</option>' +
        '</select>' +
        '<select class="form-select" style="width: 180px;" id="followup-status-filter" onchange="filterFollowUpFindings()">' +
        '<option value="">Tüm Bulgu Durumları</option>' +
        '<option value="Tebliğ Edildi">Tebliğ Edildi</option>' +
        '<option value="Cevaplandı">Cevaplandı</option>' +
        '<option value="Açık">Açık</option>' +
        '</select>' +
        '<input type="text" class="form-input" placeholder="Birim veya bulgu ara..." style="flex: 1; min-width: 200px;" id="followup-search" oninput="filterFollowUpFindings()">' +
        '</div>' +
        '<div id="followup-list-container">' + listHtml + '</div>' +
        '</div>' +
        '<div class="card">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">' +
        '<h4 style="font-size: 1.1rem; font-weight: 600;">Otomatik Bildirim Ayarları</h4>' +
        '<span style="padding: 0.25rem 0.75rem; background: #dcfce7; color: #16a34a; border-radius: 999px; font-size: 0.8rem; font-weight: 500;"><i data-lucide="check" style="width: 12px; display: inline;"></i> Aktif</span>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">' +
        '<div style="padding: 1rem; background: #f9fafb; border-radius: 8px;"><div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem;">İlk Hatırlatma</div><div style="font-weight: 600; color: #374151;">7 gün önce</div><div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">Birim + Müfettiş</div></div>' +
        '<div style="padding: 1rem; background: #f9fafb; border-radius: 8px;"><div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem;">İkinci Hatırlatma</div><div style="font-weight: 600; color: #374151;">3 gün önce</div><div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">Birim + Müfettiş + Yönetici</div></div>' +
        '<div style="padding: 1rem; background: #f9fafb; border-radius: 8px;"><div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem;">Son Hatırlatma</div><div style="font-weight: 600; color: #374151;">Vade günü</div><div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">Tüm paydaşlar</div></div>' +
        '</div>' +
        '</div>';

    lucide.createIcons();
}

// Filter Follow-Up Findings
window.filterFollowUpFindings = function () {
    const urgencyFilter = document.getElementById('followup-urgency-filter')?.value || '';
    const statusFilter = document.getElementById('followup-status-filter')?.value || '';
    const searchTerm = document.getElementById('followup-search')?.value.toLowerCase() || '';

    const items = document.querySelectorAll('.follow-up-item');
    items.forEach(item => {
        const itemUrgency = item.getAttribute('data-urgency');
        const itemStatus = item.getAttribute('data-status');
        const itemText = item.innerText.toLowerCase();

        let urgencyMatch = !urgencyFilter || itemUrgency === urgencyFilter;
        let statusMatch = !statusFilter || itemStatus === statusFilter;
        let searchMatch = !searchTerm || itemText.includes(searchTerm);

        item.style.display = (urgencyMatch && statusMatch && searchMatch) ? 'block' : 'none';
    });
};

// Send Follow-Up Reminder
window.sendFollowUpReminder = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) return;

    const audit = state.audits.find(a => a.id === finding.auditId);
    const department = audit ? audit.department : 'İlgili Birim';

    showConfirmDialog(
        'Hatırlatma Gönder',
        '"' + finding.title + '" bulgusu için ' + department + ' birimine ve takip eden müfettişlere hatırlatma e-postası gönderilecek. Onaylıyor musunuz?',
        () => {
            addLog('Hatırlatma Gönderildi', '"' + finding.title + '" bulgusu için hatırlatma gönderildi.', 'Finding', finding.id);
            saveToStorage();
            showToast('Hatırlatma başarıyla gönderildi!', 'success');
        },
        'Gönder',
        'var(--primary)'
    );
};

// Send Bulk Reminders
window.sendBulkReminders = function () {
    const criticalFindings = state.findings.filter(f => {
        if (f.status === 'Kapalı' || f.status === 'Taslak' || !f.dueDate) return false;
        const daysRemaining = Math.ceil((new Date(f.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 7 && daysRemaining >= 0;
    });

    if (criticalFindings.length === 0) {
        showToast('Acil hatırlatma gönderilecek bulgu yok.', 'info');
        return;
    }

    showConfirmDialog(
        'Toplu Hatırlatma Gönder',
        criticalFindings.length + ' adet acil bulgu için ilgili birimlere ve müfettişlere toplu hatırlatma gönderilecek. Onaylıyor musunuz?',
        () => {
            criticalFindings.forEach(f => {
                addLog('Toplu Hatırlatma', '"' + f.title + '" için otomatik hatırlatma gönderildi.', 'Finding', f.id);
            });
            saveToStorage();
            showToast(criticalFindings.length + ' bulgu için hatırlatma gönderildi!', 'success');
        },
        'Tümüne Gönder',
        '#dc2626'
    );
};

// Re-Notification Modal (Tekrar Tebliğ)
window.openReNotificationModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) return;

    const audit = state.audits.find(a => a.id === finding.auditId);

    // Remove old modal if exists
    const oldModal = document.getElementById('renotification-modal');
    if (oldModal) oldModal.remove();

    const modalHtml =
        '<div class="modal-overlay" id="renotification-modal">' +
        '<div class="modal" style="max-width: 700px;">' +
        '<div class="modal-header">' +
        '<h3 class="modal-title">Bulguyu Tekrar Tebliğ Et</h3>' +
        '<button class="close-modal" onclick="closeModal(\'renotification-modal\')"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form onsubmit="handleReNotification(event)">' +
        '<input type="hidden" name="findingId" value="' + finding.id + '">' +
        '<div class="modal-body" style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">' +
        '<div style="background: #fef3c7; border: 1px solid #fde68a; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">' +
        '<div style="display: flex; align-items: flex-start; gap: 0.75rem;">' +
        '<i data-lucide="alert-triangle" style="width: 20px; color: #d97706; flex-shrink: 0;"></i>' +
        '<div>' +
        '<p style="font-weight: 600; color: #92400e; margin-bottom: 0.25rem;">Gözden Geçiren Onayına Gidecek</p>' +
        '<p style="font-size: 0.85rem; color: #a16207;">Bu işlem gözden geçiren onayından sonra bulguyu tekrar ilgili birime tebliğ edecektir.</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div style="margin-bottom: 1.5rem; padding: 1rem; background: #f3f4f6; border-radius: 8px;">' +
        '<h4 style="font-weight: 600; margin-bottom: 0.5rem;">' + finding.title + '</h4>' +
        '<p style="font-size: 0.9rem; color: #6b7280;">' + (audit ? audit.title : 'Denetim bilgisi bulunamadı') + '</p>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom: 1.5rem;">' +
        '<label class="form-label" style="font-weight: 600; margin-bottom: 1rem; display: block;">Tekrar Tebliğ Yöntemi</label>' +
        '<div style="display: flex; flex-direction: column; gap: 1rem;">' +
        '<label style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;" onclick="selectRenotifType(\'as-is\')">' +
        '<input type="radio" name="renotifType" value="as-is" required style="margin-top: 0.25rem; width: 18px; height: 18px;">' +
        '<div style="flex: 1;">' +
        '<div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">İlk Haliyle Tekrar Tebliğ Et</div>' +
        '<p style="font-size: 0.85rem; color: #6b7280;">Bulgu içeriği değiştirilmeden aynen tekrar tebliğ edilir.</p>' +
        '</div>' +
        '</label>' +
        '<label style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;" onclick="selectRenotifType(\'edit\')">' +
        '<input type="radio" name="renotifType" value="edit" style="margin-top: 0.25rem; width: 18px; height: 18px;">' +
        '<div style="flex: 1;">' +
        '<div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Düzenleyerek Tekrar Tebliğ Et</div>' +
        '<p style="font-size: 0.85rem; color: #6b7280;">Bulgu içeriği güncellenerek revize edilmiş haliyle tebliğ edilir.</p>' +
        '</div>' +
        '</label>' +
        '</div>' +
        '</div>' +
        '<div id="renotif-edit-section" style="display: none; margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa;">' +
        '<h5 style="font-weight: 600; margin-bottom: 1rem; color: #374151;">Bulgu Düzenleme</h5>' +
        '<div class="form-group"><label class="form-label">Bulgu Başlığı</label><input type="text" name="editedTitle" class="form-input" value="' + finding.title.replace(/"/g, '&quot;') + '"></div>' +
        '<div class="form-group"><label class="form-label">Bulgu İçeriği</label><textarea name="editedContent" class="form-input" rows="4">' + (finding.content || '') + '</textarea></div>' +
        '<div class="form-group"><label class="form-label">Müfettiş Önerisi</label><textarea name="editedRecommendation" class="form-input" rows="3">' + (finding.inspectorRecommendation || '') + '</textarea></div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label">Müfettiş Notu (Tekrar Tebliğ Gerekçesi)</label>' +
        '<textarea name="inspectorNote" class="form-input" rows="3" placeholder="Tekrar tebliğ gerekçesini açıklayınız..." required></textarea>' +
        '</div>' +
        '<div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 1rem; border-radius: 8px; margin-top: 1rem;">' +
        '<div style="display: flex; align-items: center; gap: 0.5rem; color: #1e40af;">' +
        '<i data-lucide="info" style="width: 16px;"></i>' +
        '<span style="font-size: 0.9rem;">Yeni aksiyon tarihi, birim tarafından cevaplama aşamasında belirlenecektir.</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">' +
        '<button type="button" class="btn btn-secondary" onclick="closeModal(\'renotification-modal\')">İptal</button>' +
        '<button type="submit" class="btn btn-primary"><i data-lucide="send" style="width: 14px; margin-right: 0.5rem;"></i> Onaya Gönder</button>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();
    openModal('renotification-modal');
};

window.selectRenotifType = function (type) {
    const editSection = document.getElementById('renotif-edit-section');
    if (editSection) {
        editSection.style.display = type === 'edit' ? 'block' : 'none';
    }
};

window.handleReNotification = function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const findingId = formData.get('findingId');
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) return;

    const renotifType = formData.get('renotifType');
    const inspectorNote = formData.get('inspectorNote');
    const oldStatus = finding.status;

    // Store original values before any changes
    const originalData = {
        title: finding.title,
        content: finding.content,
        inspectorRecommendation: finding.inspectorRecommendation,
        status: oldStatus
    };

    // Initialize revision history if doesn't exist
    if (!finding.revisionHistory) {
        finding.revisionHistory = [];
    }

    // If editing, track changes
    if (renotifType === 'edit') {
        const newTitle = formData.get('editedTitle') || finding.title;
        const newContent = formData.get('editedContent') || finding.content;
        const newRecommendation = formData.get('editedRecommendation') || finding.inspectorRecommendation;

        // Create revision record
        const revision = {
            id: Date.now(),
            date: new Date().toISOString(),
            user: state.currentRole || 'Müfettiş',
            type: 'renotification_edit',
            reason: inspectorNote,
            renotificationCount: (finding.reNotificationCount || 0) + 1,
            changes: {}
        };

        // Track only changed fields
        if (newTitle !== finding.title) {
            revision.changes.title = { old: finding.title, new: newTitle };
        }
        if (newContent !== finding.content) {
            revision.changes.content = { old: finding.content, new: newContent };
        }
        if (newRecommendation !== finding.inspectorRecommendation) {
            revision.changes.inspectorRecommendation = { old: finding.inspectorRecommendation, new: newRecommendation };
        }

        // Only add revision if there are actual changes
        if (Object.keys(revision.changes).length > 0) {
            finding.revisionHistory.push(revision);
        }

        // Apply changes
        finding.title = newTitle;
        finding.content = newContent;
        finding.inspectorRecommendation = newRecommendation;
    } else {
        // For as-is renotification, add a simple record
        finding.revisionHistory.push({
            id: Date.now(),
            date: new Date().toISOString(),
            user: state.currentRole || 'Müfettiş',
            type: 'renotification_asis',
            reason: inspectorNote,
            renotificationCount: (finding.reNotificationCount || 0) + 1,
            changes: {} // No content changes
        });
    }

    finding.status = 'Tekrar Tebliğ Onayda';
    finding.reNotificationType = renotifType;
    finding.reNotificationNote = inspectorNote;
    finding.reNotificationRequestDate = new Date().toISOString();
    finding.reNotificationCount = (finding.reNotificationCount || 0) + 1;
    finding.pendingReviewerApproval = true;

    const logDetails = renotifType === 'edit'
        ? 'Bulgu düzenlenerek tekrar tebliğ için gözden geçiren onayına gönderildi.'
        : 'Bulgu ilk haliyle tekrar tebliğ için gözden geçiren onayına gönderildi.';

    addLog('Tekrar Tebliğ Talebi', logDetails + ' Gerekçe: "' + inspectorNote.substring(0, 80) + '"', 'Finding', finding.id, {
        old: originalData,
        new: { status: 'Tekrar Tebliğ Onayda', renotifType: renotifType }
    });

    saveToStorage();
    closeModal('renotification-modal');
    showToast('Tekrar tebliğ talebi gözden geçiren onayına gönderildi!', 'success');
    renderFollowUpFindings();
};

window.renderFollowUpFindings = renderFollowUpFindings;

// Department Response Update Modal
window.openUpdateResponseModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        showToast('Bulgu bulunamadı', 'error');
        return;
    }

    const currentResponse = finding.departmentResponse || '';
    const currentAction = finding.actions && finding.actions.length > 0 ? finding.actions[finding.actions.length - 1] : null;

    // Default date 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const defaultDate = futureDate.toISOString().split('T')[0];

    showConfirmDialog(
        'Birim Cevabını ve Aksiyonu Güncelle',
        `<form id="update-resp-form">
            <div style="background:#fef3c7;border:1px solid #fde68a;padding:0.75rem;border-radius:0.5rem;margin-bottom:1.25rem;display:flex;align-items:flex-start;gap:0.5rem">
                <i data-lucide="info" style="width:16px;color:#d97706;flex-shrink:0;margin-top:2px"></i>
                <span style="font-size:0.85rem;color:#92400e;">Bu güncelleme kaydedilecek ve geriye dönük izlenebilir olacaktır.</span>
            </div>
            
            <div class="form-group">
                <label class="form-label">Güncellenmiş Birim Cevabı *</label>
                <textarea id="updated-resp-text" class="form-input" required rows="3">${currentResponse}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Mevcut Aksiyon Tarihi</label>
                <input type="date" id="updated-due-date" class="form-input" value="${finding.dueDate || ''}">
                <span style="font-size:0.75rem;color:var(--text-light);margin-top:0.25rem;display:block">Değiştirmezseniz mevcut tarih korunur</span>
            </div>
            
            <div class="form-group">
                <label class="form-label">Güncelleme Gerekçesi *</label>
                <textarea id="update-reason" class="form-input" required rows="2" placeholder="Neden güncelleme yapıyorsunuz?"></textarea>
            </div>
            
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:0.5rem;padding:1rem;margin-bottom:1rem">
                <div style="font-weight:600;color:#166534;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem">
                    <i data-lucide="clipboard-check" style="width:16px"></i> Ek Aksiyon Ekle (Opsiyonel)
                </div>
                
                <div class="form-group" style="margin-bottom:0.75rem">
                    <label class="form-label">Yapılacak İş</label>
                    <textarea id="new-action-desc" class="form-input" rows="2" placeholder="Yeni düzeltici aksiyonu tanımlayın..."></textarea>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Sorumlu</label>
                        <input type="text" id="new-action-resp" class="form-input" placeholder="Ad Soyad">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Aksiyon Tarihi</label>
                        <input type="date" id="new-action-date" class="form-input" value="${defaultDate}">
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Ek Kanıt Yükle</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="update-evidence-file" class="file-upload-input" multiple>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Dosyaları seçmek için tıklayın</span>
                        <span class="file-upload-hint">PDF, Word, Excel, Resim</span>
                    </div>
                </div>
                <div id="update-evidence-file-list" style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.25rem"></div>
            </div>
        </form>`,
        () => {
            const newResponse = document.getElementById('updated-resp-text').value;
            const updateReason = document.getElementById('update-reason').value;
            const newActionDesc = document.getElementById('new-action-desc').value;
            const newActionResp = document.getElementById('new-action-resp').value;
            const newActionDate = document.getElementById('new-action-date').value;

            if (newResponse && updateReason) {
                const newDueDate = document.getElementById('updated-due-date').value;
                const oldDueDate = finding.dueDate;

                // Track response revision with due date changes
                if (!finding.responseHistory) finding.responseHistory = [];
                finding.responseHistory.push({
                    id: Date.now(),
                    date: new Date().toISOString(),
                    user: 'Birim',
                    reason: updateReason,
                    oldResponse: finding.departmentResponse,
                    newResponse: newResponse,
                    oldDueDate: oldDueDate,
                    newDueDate: newDueDate !== oldDueDate ? newDueDate : null
                });

                // Update response
                finding.departmentResponse = newResponse;

                // Update due date if changed
                if (newDueDate && newDueDate !== oldDueDate) {
                    finding.dueDate = newDueDate;
                }

                // Add new action if provided
                if (newActionDesc && newActionResp && newActionDate) {
                    if (!finding.actions) finding.actions = [];
                    finding.actions.push({
                        id: Date.now(),
                        description: newActionDesc,
                        responsible: newActionResp,
                        dueDate: newActionDate,
                        status: 'Beklemede',
                        createdAt: new Date().toISOString(),
                        createdBy: 'Birim (Güncelleme)'
                    });
                    finding.dueDate = newActionDate; // Update follow-up date
                }

                // Store evidence
                const evidenceInput = document.getElementById('update-evidence-file');
                if (evidenceInput && evidenceInput.files.length > 0) {
                    if (!finding.evidence) finding.evidence = [];
                    for (let file of evidenceInput.files) {
                        finding.evidence.push({
                            id: Date.now() + Math.random(),
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            uploadedBy: 'Birim (Güncelleme)'
                        });
                    }
                }

                addLog('Birim Cevabı Güncellendi', 'Cevap güncellendi. Gerekçe: "' + updateReason.substring(0, 80) + '"', 'Finding', finding.id);
                saveToStorage();
                showToast('Güncelleme başarıyla kaydedildi!', 'success');
                renderConciliation();
            }
        },
        'Güncelle',
        '#10b981'
    );

    // Refresh icons and add file handler
    setTimeout(() => {
        lucide.createIcons();
        const fileInput = document.getElementById('update-evidence-file');
        const fileList = document.getElementById('update-evidence-file-list');
        if (fileInput && fileList) {
            fileInput.addEventListener('change', (e) => {
                fileList.innerHTML = Array.from(e.target.files).map(f =>
                    `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0.5rem;background:#f0fdf4;border-radius:4px;font-size:0.8rem;"><i data-lucide="file" style="width:12px;color:#16a34a"></i>${f.name}</div>`
                ).join('');
                lucide.createIcons();
            });
        }
    }, 100);
};

// Department Disagreement Modal
window.openDisagreementModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        showToast('Bulgu bulunamadı', 'error');
        return;
    }

    showConfirmDialog(
        'Bulguya İtiraz',
        `<form id="disagree-form">
            <div style="background:#fef2f2;border:1px solid #fecaca;padding:0.75rem;border-radius:0.5rem;margin-bottom:1.25rem;display:flex;align-items:flex-start;gap:0.5rem">
                <i data-lucide="alert-triangle" style="width:18px;color:#dc2626;flex-shrink:0;margin-top:2px"></i>
                <div style="font-size:0.85rem;color:#991b1b;">
                    <strong>Uyarı:</strong> İtiraz ettiğinizde müfettiş son görüşünü yazarak bulguyu kapatacaktır. Bu işlem geri alınamaz.
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">İtiraz Gerekçeniz *</label>
                <textarea id="disagree-reason" class="form-input" required rows="4" placeholder="Neden mutabık değilsiniz? Gerekçenizi detaylı açıklayın..."></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Destekleyici Kanıt (Opsiyonel)</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="disagree-evidence" class="file-upload-input" multiple>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Kanıt dosyası ekleyin</span>
                        <span class="file-upload-hint">PDF, Word, Excel, Resim</span>
                    </div>
                </div>
                <div id="disagree-evidence-list" style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.25rem"></div>
            </div>
        </form>`,
        () => {
            const reason = document.getElementById('disagree-reason').value;

            if (reason) {
                // Save disagreement
                finding.disagreementReason = reason;
                finding.disagreementDate = new Date().toISOString();
                finding.disagreementBy = 'Birim';
                finding.status = 'Mutabık Değil';

                // Store evidence
                const evidenceInput = document.getElementById('disagree-evidence');
                if (evidenceInput && evidenceInput.files.length > 0) {
                    if (!finding.evidence) finding.evidence = [];
                    for (let file of evidenceInput.files) {
                        finding.evidence.push({
                            id: Date.now() + Math.random(),
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            uploadedBy: 'Birim (İtiraz)',
                            category: 'disagreement'
                        });
                    }
                }

                addLog('Birim Mutabık Değil', 'Birim bulguya itiraz etti. Müfettiş son görüşü bekleniyor.', 'Finding', finding.id);
                saveToStorage();
                showToast('İtirazınız kaydedildi. Müfettiş son görüşünü bildirecektir.', 'warning');
                renderConciliation();
            }
        },
        'İtiraz Et',
        '#f97316'
    );

    // Refresh icons and add file handler
    setTimeout(() => {
        lucide.createIcons();
        const fileInput = document.getElementById('disagree-evidence');
        const fileList = document.getElementById('disagree-evidence-list');
        if (fileInput && fileList) {
            fileInput.addEventListener('change', (e) => {
                fileList.innerHTML = Array.from(e.target.files).map(f =>
                    `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0.5rem;background:#fef2f2;border-radius:4px;font-size:0.8rem;"><i data-lucide="file" style="width:12px;color:#dc2626"></i>${f.name}</div>`
                ).join('');
                lucide.createIcons();
            });
        }
    }, 100);
};

// Inspector Final Opinion Modal (for closing Mutabık Değil findings)
window.openFinalOpinionModal = function (findingId) {
    const finding = state.findings.find(f => f.id == findingId);
    if (!finding) {
        showToast('Bulgu bulunamadı', 'error');
        return;
    }

    showConfirmDialog(
        'Son Görüşle Kapat',
        `<form id="final-opinion-form">
            <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fdba74; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.25rem;">
                <div style="font-weight: 600; color: #c2410c; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="alert-triangle" style="width: 16px;"></i> Birim İtirazı
                </div>
                <p style="color: #9a3412; font-style: italic; line-height: 1.5; font-size: 0.9rem;">"${finding.disagreementReason || 'İtiraz gerekçesi bulunamadı'}"</p>
                ${finding.disagreementDate ? `<div style="font-size: 0.75rem; color: #c2410c; margin-top: 0.5rem;">${new Date(finding.disagreementDate).toLocaleString('tr-TR')}</div>` : ''}
            </div>
            
            <div class="form-group">
                <label class="form-label">Müfettiş Son Görüşü *</label>
                <textarea id="final-opinion" class="form-input" required rows="4" placeholder="İtirazı değerlendirerek son görüşünüzü yazın. Bu görüş bulguyla birlikte arşivlenecektir."></textarea>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; color: #991b1b; display: flex; align-items: flex-start; gap: 0.5rem;">
                <i data-lucide="info" style="width: 16px; flex-shrink: 0; margin-top: 2px;"></i>
                <span>Bu işlem bulguyu <strong>"Kapalı (Mutabık Değil)"</strong> durumuna getirecek ve geri alınamayacaktır.</span>
            </div>
        </form>`,
        () => {
            const finalOpinion = document.getElementById('final-opinion').value;

            if (finalOpinion) {
                const oldStatus = finding.status;

                // Save final opinion
                finding.inspectorFinalOpinion = finalOpinion;
                finding.finalOpinionDate = new Date().toISOString();
                finding.status = 'Kapalı (Mutabık Değil)';

                addLog('Mutabık Değil - Kapatıldı', 'Müfettiş son görüşünü yazarak bulguyu kapattı.', 'Finding', finding.id);
                addFindingProcessLog(finding.id, 'Kapalı (Mutabık Değil)', state.currentUserRole, finalOpinion);

                saveToStorage();
                showToast('Bulgu son görüşle kapatıldı.', 'success');

                // Refresh view
                if (state.currentPage === 'conciliation') renderConciliation();
                else if (typeof viewFinding === 'function') viewFinding(finding.id);
            }
        },
        'Son Görüşle Kapat',
        '#ea580c'
    );

    setTimeout(() => lucide.createIcons(), 100);
};

// ============================================================================
// YILLIK DENETİM PLANI YÖNETİMİ
// ============================================================================

// Render Audit Plan List
function renderAuditPlan() {
    // Initialize auditPlans if not exists
    if (!state.auditPlans) state.auditPlans = [];

    // Get unique years for filter
    const years = [...new Set(state.auditPlans.map(p => p.year))].sort().reverse();
    if (years.length === 0) years.push(new Date().getFullYear());

    // Calculate stats
    const currentYear = new Date().getFullYear();
    const currentPlan = state.auditPlans.find(p => p.year === currentYear && p.status === 'Onaylandı');
    const plannedCount = currentPlan ? currentPlan.audits.length : 0;
    const completedCount = currentPlan ? currentPlan.audits.filter(a => a.status === 'Tamamlandı').length : 0;
    const completionRate = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

    const listHtml = state.auditPlans.length > 0 ? state.auditPlans.map(plan => {
        const auditCount = plan.audits ? plan.audits.length : 0;
        const completedAudits = plan.audits ? plan.audits.filter(a => a.status === 'Tamamlandı').length : 0;
        const progress = auditCount > 0 ? Math.round((completedAudits / auditCount) * 100) : 0;

        return `
        <div class="audit-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border: 1px solid var(--border); border-radius: 0.75rem; margin-bottom: 1rem; background: white;"
            data-year="${plan.year}" data-status="${plan.status}">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <h4 style="font-size: 1.1rem; font-weight: 600;">${plan.title}</h4>
                    <span style="font-size: 0.75rem; padding: 0.2rem 0.6rem; background: ${getPlanStatusColor(plan.status)}15; border-radius: 999px; color: ${getPlanStatusColor(plan.status)}; font-weight: 600;">${plan.status}</span>
                </div>
                <div style="display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--text-light);">
                    <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="calendar" style="width: 14px;"></i> ${plan.year}</span>
                    <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="clipboard-list" style="width: 14px;"></i> ${auditCount} Denetim</span>
                    <span style="display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="clock" style="width: 14px;"></i> ${plan.totalPlannedDays || 0} Adam-Gün</span>
                </div>
                <div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
                    <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: ${progress === 100 ? '#10b981' : '#3b82f6'};"></div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 600; color: ${progress === 100 ? '#10b981' : '#3b82f6'};">${progress}%</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-left: 1rem;">
                <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem;" onclick="window.viewAuditPlan('${plan.id}')">
                    <i data-lucide="eye" style="width: 14px;"></i>
                </button>
                ${plan.status === 'Taslak' ? `<button class="btn btn-secondary" style="padding: 0.5rem 0.75rem;" onclick="window.editAuditPlan('${plan.id}')"><i data-lucide="edit" style="width: 14px;"></i></button>` : ''}
                ${plan.status === 'Taslak' ? `<button class="btn" style="padding: 0.5rem 0.75rem; background: #ef4444; color: white;" onclick="window.deleteAuditPlan('${plan.id}')"><i data-lucide="trash-2" style="width: 14px;"></i></button>` : ''}
            </div>
        </div>
    `}).join('') : `
        <div style="text-align: center; padding: 4rem 2rem; color: var(--text-light);">
            <i data-lucide="calendar-off" style="width: 64px; height: 64px; margin-bottom: 1rem; opacity: 0.4;"></i>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Henüz denetim planı oluşturulmamış</p>
            <p style="font-size: 0.9rem;">Yeni bir yıllık denetim planı oluşturmak için "Yeni Plan" butonuna tıklayın.</p>
        </div>
    `;

    mainView.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card" style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                    <i data-lucide="calendar-range" style="width: 24px;"></i>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Toplam Plan</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${state.auditPlans.length}</div>
                </div>
            </div>
            <div class="card" style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                    <i data-lucide="check-circle" style="width: 24px;"></i>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">${currentYear} Tamamlanan</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${completedCount}/${plannedCount}</div>
                </div>
            </div>
            <div class="card" style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
                    <i data-lucide="trending-up" style="width: 24px;"></i>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Plan Gerçekleşme</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${completionRate}%</div>
                </div>
            </div>
        </div>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Denetim Planları</h3>
                <button class="btn btn-primary" onclick="window.openCreatePlanModal()">
                    <i data-lucide="plus" style="width: 18px; margin-right: 0.5rem;"></i> Yeni Plan
                </button>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <select class="form-select" style="width: 120px;" id="plan-year-filter" onchange="filterAuditPlans()">
                    <option value="">Tüm Yıllar</option>
                    ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
                <select class="form-select" style="width: 140px;" id="plan-status-filter" onchange="filterAuditPlans()">
                    <option value="">Tüm Durumlar</option>
                    <option value="Taslak">Taslak</option>
                    <option value="Onayda">Onayda</option>
                    <option value="Onaylandı">Onaylandı</option>
                    <option value="Revize Edildi">Revize Edildi</option>
                </select>
            </div>

            <div id="plan-list">${listHtml}</div>
        </div>
    `;
    lucide.createIcons();
}

// Filter Audit Plans
window.filterAuditPlans = function () {
    const yearFilter = document.getElementById('plan-year-filter')?.value;
    const statusFilter = document.getElementById('plan-status-filter')?.value;

    const plans = document.querySelectorAll('#plan-list .audit-item');
    plans.forEach(plan => {
        const year = plan.getAttribute('data-year');
        const status = plan.getAttribute('data-status');

        const yearMatch = !yearFilter || year === yearFilter;
        const statusMatch = !statusFilter || status === statusFilter;

        plan.style.display = (yearMatch && statusMatch) ? 'flex' : 'none';
    });
};

// Get Plan Status Color
function getPlanStatusColor(status) {
    switch (status) {
        case 'Taslak': return '#6b7280';
        case 'Onayda': return '#f59e0b';
        case 'Onaylandı': return '#10b981';
        case 'Revize Edildi': return '#8b5cf6';
        default: return '#6b7280';
    }
}

// Open Create Plan Modal
window.openCreatePlanModal = function () {
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear + 1, currentYear + 2].map(y =>
        `<option value="${y}">${y}</option>`
    ).join('');

    showConfirmDialog(
        'Yeni Denetim Planı Oluştur',
        `<form id="create-plan-form">
            <div class="form-group">
                <label class="form-label">Yıl *</label>
                <select id="plan-year" class="form-select" required>
                    ${yearOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Plan Başlığı *</label>
                <input type="text" id="plan-title" class="form-input" value="${currentYear} Yılı Denetim Planı" required>
            </div>
            <div class="form-group">
                <label class="form-label">Açıklama</label>
                <textarea id="plan-description" class="form-input" rows="3" placeholder="Plan hakkında notlar..."></textarea>
            </div>
        </form>`,
        () => {
            const year = parseInt(document.getElementById('plan-year').value);
            const title = document.getElementById('plan-title').value;
            const description = document.getElementById('plan-description').value;

            if (title && year) {
                const newPlan = {
                    id: Date.now(),
                    year: year,
                    title: title,
                    description: description,
                    status: 'Taslak',
                    approvedBy: null,
                    approvedDate: null,
                    totalPlannedDays: 0,
                    audits: [],
                    revisions: [],
                    createdAt: new Date().toISOString(),
                    createdBy: state.currentUserRole
                };

                state.auditPlans.unshift(newPlan);
                addLog('Plan Oluşturuldu', `"${title}" denetim planı oluşturuldu.`, 'System', newPlan.id);
                saveToStorage();
                showToast('Denetim planı oluşturuldu!', 'success');
                renderAuditPlan();
            }
        },
        'Oluştur',
        'var(--primary)'
    );
};

// View Audit Plan Detail
window.viewAuditPlan = function (planId) {
    state.currentPlanId = planId;
    navigateTo('audit-plan-detail');
};

// Render Audit Plan Detail
function renderAuditPlanDetail() {
    const plan = state.auditPlans.find(p => p.id == state.currentPlanId);
    if (!plan) {
        mainView.innerHTML = '<div class="card"><p>Plan bulunamadı.</p></div>';
        return;
    }

    const auditListHtml = plan.audits && plan.audits.length > 0 ? plan.audits.map((audit, index) => {
        // Loose equality for robust matching
        const linkedAudit = audit.auditId ? state.audits.find(a => a.id == audit.auditId) : null;
        const actualStatus = linkedAudit ? linkedAudit.status : audit.status;

        return `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.75rem; font-weight: 500;">${audit.title}</td>
            <td style="padding: 0.75rem;"><span class="badge" style="background: #f3f4f6; color: #374151;">${audit.type || '-'}</span></td>
            <td style="padding: 0.75rem; text-align: center;">${audit.plannedQ || '-'}. Çeyrek</td>
            <td style="padding: 0.75rem;">
                <span style="padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500; background: ${audit.priority === 'Yüksek' ? '#fee2e2' : audit.priority === 'Normal' ? '#fef3c7' : '#d1fae5'}; color: ${audit.priority === 'Yüksek' ? '#dc2626' : audit.priority === 'Normal' ? '#d97706' : '#059669'};">
                    ${audit.priority || 'Normal'}
                </span>
            </td>
            <td style="padding: 0.75rem;">
                <span style="padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500; background: ${getStatusColor(actualStatus)}15; color: ${getStatusColor(actualStatus)};">
                    ${actualStatus}
                </span>
            </td>
            <td style="padding: 0.75rem; text-align: right;">
                ${plan.status === 'Taslak' ? `<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.removePlanAudit('${plan.id}', ${index})"><i data-lucide="trash-2" style="width: 12px;"></i></button>` : ''}
                ${plan.status === 'Onaylandı' && !audit.auditId ? `<button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="window.startAuditFromPlan('${plan.id}', ${index})"><i data-lucide="play" style="width: 12px; margin-right: 0.25rem;"></i> Başlat</button>` : ''}
                ${linkedAudit ? `<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.25rem;" onclick="window.viewAudit('${linkedAudit.id}')"><i data-lucide="external-link" style="width: 12px;"></i></button>` : ''}
            </td>
        </tr>
    `}).join('') : `
        <tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-light);">Henüz denetim eklenmemiş</td></tr>
    `;

    // Calculate quarterly distribution
    const q1 = plan.audits.filter(a => a.plannedQ === 1).length;
    const q2 = plan.audits.filter(a => a.plannedQ === 2).length;
    const q3 = plan.audits.filter(a => a.plannedQ === 3).length;
    const q4 = plan.audits.filter(a => a.plannedQ === 4).length;

    mainView.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="navigateTo('audit-plan')" style="display: inline-flex; align-items: center;">
                <i data-lucide="arrow-left" style="width: 16px; margin-right: 0.5rem;"></i> Geri Dön
            </button>
        </div>
        
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <h2 style="font-size: 1.5rem;">${plan.title}</h2>
                        <span style="padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; background: ${getPlanStatusColor(plan.status)}15; color: ${getPlanStatusColor(plan.status)};">${plan.status}</span>
                    </div>
                    <p style="color: var(--text-light);">${plan.description || 'Açıklama eklenmemiş'}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    ${plan.status === 'Taslak' ? `
                        <button class="btn btn-success" style="background: #10b981; color: white;" onclick="window.approvePlan('${plan.id}')">
                            <i data-lucide="check" style="width: 16px; margin-right: 0.5rem;"></i> Onayla
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- Approval Document Section -->
            ${plan.status === 'Onaylandı' ? `
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #6ee7b7; padding: 1rem 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i data-lucide="check-circle" style="width: 24px; color: #059669;"></i>
                        <div>
                            <div style="font-weight: 600; color: #059669;">Plan Onaylandı</div>
                            <div style="font-size: 0.85rem; color: #047857;">
                                Onaylayan: ${plan.approvedBy || '-'} | Tarih: ${plan.approvedDate ? new Date(plan.approvedDate).toLocaleDateString('tr-TR') : '-'}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${plan.approvalDocument ? `
                            <a href="#" onclick="window.viewApprovalDocument('${plan.id}'); return false;" style="font-size: 0.85rem; color: #059669; text-decoration: underline;">
                                <i data-lucide="file-check" style="width: 14px; display: inline;"></i> Onay Belgesi
                            </a>
                        ` : `
                            <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="window.uploadApprovalDocument('${plan.id}')">
                                <i data-lucide="upload" style="width: 14px; margin-right: 0.25rem;"></i> Onay Belgesi Yükle
                            </button>
                        `}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Stats Row -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                <div style="padding: 1rem; background: #f9fafb; border-radius: 0.75rem; text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary);">${plan.audits.length}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Planlanan Denetim</div>
                </div>
                <div style="padding: 1rem; background: #f9fafb; border-radius: 0.75rem; text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: #10b981;">${plan.audits.filter(a => a.status === 'Tamamlandı' || a.auditId).length}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Başlatılan</div>
                </div>
                <div style="padding: 1rem; background: #f9fafb; border-radius: 0.75rem; text-align: center;">
                    <div style="font-size: 0.9rem; font-weight: 600;">Q1: ${q1} | Q2: ${q2} | Q3: ${q3} | Q4: ${q4}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem;">Çeyrek Dağılımı</div>
                </div>
            </div>

            <!-- Audit List -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>Planlanan Denetimler</h3>
                ${plan.status === 'Taslak' ? `<button class="btn btn-secondary" onclick="window.openAddAuditToPlanModal('${plan.id}')"><i data-lucide="plus" style="width: 16px; margin-right: 0.5rem;"></i> Denetim Ekle</button>` : ''}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f9fafb;">
                        <th style="padding: 0.75rem; text-align: left; font-weight: 600; font-size: 0.85rem;">Denetim Adı</th>
                        <th style="padding: 0.75rem; text-align: left; font-weight: 600; font-size: 0.85rem;">Tür</th>
                        <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.85rem;">Dönem</th>
                        <th style="padding: 0.75rem; text-align: left; font-weight: 600; font-size: 0.85rem;">Öncelik</th>
                        <th style="padding: 0.75rem; text-align: left; font-weight: 600; font-size: 0.85rem;">Durum</th>
                        <th style="padding: 0.75rem; text-align: right; font-weight: 600; font-size: 0.85rem;">İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditListHtml}
                </tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

// Add Audit to Plan Modal
window.openAddAuditToPlanModal = function (planId) {
    const auditTypes = ['Şube', 'IT', 'Süreç', 'İnceleme', 'Soruşturma'];

    showConfirmDialog(
        'Plana Denetim Ekle',
        `<form id="add-audit-form">
            <div class="form-group">
                <label class="form-label">Denetim Adı *</label>
                <input type="text" id="audit-title" class="form-input" placeholder="Örn: Kadıköy Şube Denetimi" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Denetim Türü *</label>
                    <select id="audit-type" class="form-select" required>
                        ${auditTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Planlanan Çeyrek *</label>
                    <select id="audit-quarter" class="form-select" required>
                        <option value="1">1. Çeyrek (Oca-Mar)</option>
                        <option value="2">2. Çeyrek (Nis-Haz)</option>
                        <option value="3">3. Çeyrek (Tem-Eyl)</option>
                        <option value="4">4. Çeyrek (Eki-Ara)</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Öncelik</label>
                <select id="audit-priority" class="form-select">
                    <option value="Normal">Normal</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Düşük">Düşük</option>
                </select>
            </div>
        </form>`,
        () => {
            const title = document.getElementById('audit-title').value;
            const type = document.getElementById('audit-type').value;
            const quarter = parseInt(document.getElementById('audit-quarter').value);
            const priority = document.getElementById('audit-priority').value;

            if (title && type && quarter) {
                const plan = state.auditPlans.find(p => p.id == planId);
                if (plan) {
                    plan.audits.push({
                        title: title,
                        type: type,
                        plannedQ: quarter,
                        priority: priority,
                        status: 'Planlandı',
                        auditId: null
                    });

                    addLog('Denetim Eklendi', `"${title}" denetimi plana eklendi.`, 'System', plan.id);
                    saveToStorage();
                    showToast('Denetim plana eklendi!', 'success');
                    renderAuditPlanDetail();
                }
            }
        },
        'Ekle',
        'var(--primary)'
    );
};

// Remove Audit from Plan
window.removePlanAudit = function (planId, auditIndex) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (plan && plan.audits[auditIndex]) {
        const auditTitle = plan.audits[auditIndex].title;
        showConfirmDialog(
            'Denetimi Kaldır',
            `"${auditTitle}" denetimini plandan kaldırmak istediğinize emin misiniz?`,
            () => {
                plan.audits.splice(auditIndex, 1);
                plan.totalPlannedDays = plan.audits.reduce((sum, a) => sum + (a.plannedDays || 0), 0);
                saveToStorage();
                showToast('Denetim plandan kaldırıldı.', 'info');
                renderAuditPlanDetail();
            },
            'Kaldır',
            '#ef4444'
        );
    }
};

// Send Plan for Approval
window.sendPlanForApproval = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (plan) {
        if (plan.audits.length === 0) {
            showToast('En az bir denetim eklemeden onaya gönderemezsiniz!', 'error');
            return;
        }
        showConfirmDialog(
            'Onaya Gönder',
            'Bu planı Denetim Komitesi onayına göndermek istediğinize emin misiniz?',
            () => {
                plan.status = 'Onayda';
                addLog('Plan Onaya Gönderildi', `"${plan.title}" Denetim Komitesi onayına gönderildi.`, 'System', plan.id);
                saveToStorage();
                showToast('Plan onaya gönderildi!', 'success');
                renderAuditPlanDetail();
            },
            'Gönder',
            'var(--primary)'
        );
    }
};

// Approve Plan (with document upload - IIA 2020 compliant)
window.approvePlan = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (!plan) return;

    showConfirmDialog(
        'Planı Onayla',
        `<div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #6ee7b7; padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #059669; margin-bottom: 0.5rem;">
                <i data-lucide="info" style="width: 16px;"></i> Onay Bilgisi
            </div>
            <p style="font-size: 0.9rem; color: #047857; margin: 0;">Denetim Komitesi/Yönetim Kurulu'ndan alınan imzalı onay belgesini yükleyerek planı onaylayabilirsiniz.</p>
        </div>
        <form id="approve-plan-form">
            <div class="form-group">
                <label class="form-label">İmzalı Onay Belgesi * (PDF/Resim)</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="approval-doc-input" class="file-upload-input" accept=".pdf,.jpg,.jpeg,.png" required>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Onay belgesini seçin</span>
                        <span class="file-upload-hint">PDF, JPG, PNG</span>
                    </div>
                </div>
                <div id="approval-file-preview" style="margin-top: 0.5rem;"></div>
            </div>
            <div class="form-group">
                <label class="form-label">Onaylayan Kişi/Kurum *</label>
                <input type="text" id="approval-by" class="form-input" value="Denetim Komitesi" required>
            </div>
            <div class="form-group">
                <label class="form-label">Onay Tarihi</label>
                <input type="date" id="approval-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label class="form-label">Ek Not</label>
                <textarea id="approval-note" class="form-input" rows="2" placeholder="Varsa ek not..."></textarea>
            </div>
        </form>`,
        () => {
            const fileInput = document.getElementById('approval-doc-input');
            const approvedBy = document.getElementById('approval-by').value;
            const approvalDate = document.getElementById('approval-date').value;
            const note = document.getElementById('approval-note').value;

            if (!fileInput.files.length) {
                showToast('Lütfen onay belgesini yükleyin!', 'error');
                return;
            }

            const file = fileInput.files[0];
            plan.approvalDocument = {
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                uploadedAt: new Date().toISOString(),
                note: note
            };
            plan.status = 'Onaylandı';
            plan.approvedBy = approvedBy;
            plan.approvedDate = approvalDate || new Date().toISOString();

            addLog('Plan Onaylandı', `"${plan.title}" ${approvedBy} tarafından onaylandı. Onay belgesi: ${file.name}`, 'System', plan.id);
            saveToStorage();
            showToast('Plan onaylandı!', 'success');
            renderAuditPlanDetail();
        },
        'Onayla',
        '#10b981'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// Reject Plan
window.rejectPlan = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (plan) {
        showConfirmDialog(
            'Planı Reddet',
            `<div class="form-group">
                <label class="form-label">Red Gerekçesi *</label>
                <textarea id="reject-reason" class="form-input" rows="3" placeholder="Reddetme nedeninizi yazın..." required></textarea>
            </div>`,
            () => {
                const reason = document.getElementById('reject-reason').value;
                if (reason) {
                    plan.status = 'Taslak';
                    plan.revisions.push({
                        date: new Date().toISOString(),
                        description: `Reddedildi: ${reason}`,
                        changedBy: state.currentUserRole
                    });
                    addLog('Plan Reddedildi', `"${plan.title}" reddedildi. Sebep: ${reason}`, 'System', plan.id);
                    saveToStorage();
                    showToast('Plan reddedildi ve taslak durumuna alındı.', 'warning');
                    renderAuditPlanDetail();
                }
            },
            'Reddet',
            '#ef4444'
        );
    }
};

// Delete Audit Plan (Soft Delete - Move to Trash)
window.deleteAuditPlan = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (plan) {
        showConfirmDialog(
            'Planı Sil',
            `"${plan.title}" planını silinenlere taşımak istediğinize emin misiniz?`,
            () => {
                // Add deletion metadata
                plan.deletedAt = new Date().toISOString();
                plan.deletedBy = state.currentUserRole;
                plan._type = 'Plan'; // For trash display

                // Move to deleted items
                if (!state.deletedPlans) state.deletedPlans = [];
                state.deletedPlans.push(plan);
                state.auditPlans = state.auditPlans.filter(p => p.id != planId);

                addLog('Plan Silindi', `"${plan.title}" denetim planı silinenlere taşındı.`, 'System', planId);
                saveToStorage();
                showToast('Plan silinenlere taşındı.', 'info');
                renderAuditPlan();
            },
            'Sil',
            '#ef4444'
        );
    }
};

// Edit Audit Plan
window.editAuditPlan = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (!plan) return;

    showConfirmDialog(
        'Planı Düzenle',
        `<form id="edit-plan-form">
            <div class="form-group">
                <label class="form-label">Plan Başlığı *</label>
                <input type="text" id="edit-plan-title" class="form-input" value="${plan.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Açıklama</label>
                <textarea id="edit-plan-description" class="form-input" rows="3">${plan.description || ''}</textarea>
            </div>
        </form>`,
        () => {
            const title = document.getElementById('edit-plan-title').value;
            const description = document.getElementById('edit-plan-description').value;

            if (title) {
                const oldTitle = plan.title;
                plan.title = title;
                plan.description = description;
                addLog('Plan Düzenlendi', `"${oldTitle}" planı "${title}" olarak güncellendi.`, 'System', plan.id);
                saveToStorage();
                showToast('Plan güncellendi!', 'success');
                renderAuditPlan();
            }
        },
        'Kaydet',
        'var(--primary)'
    );
};

// Start Audit from Plan (Create actual audit from planned item)
window.startAuditFromPlan = function (planId, auditIndex) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (!plan || !plan.audits[auditIndex]) return;

    const plannedAudit = plan.audits[auditIndex];
    if (!state.staff) state.staff = []; // specific safety

    // Supervisors - Allow (almost) everyone, or just sort them
    const supervisors = state.staff || [];

    const supervisorOptions = supervisors.map(s => `<option value="${s.name}">${s.name} (${s.title})</option>`).join('');

    // Team Checkbox List
    const teamCheckboxes = staffList.map(s => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer;">
            <input type="checkbox" name="audit-team" value="${s.name}" style="width: 16px; height: 16px;">
            <span>${s.name} <span style="color: #6b7280; font-size: 0.8rem;">(${s.title})</span></span>
        </label>
    `).join('');

    showConfirmDialog(
        'Denetimi Başlat',
        `<div style="margin-bottom: 1rem;">
            <strong>"${plannedAudit.title}"</strong> denetimini başlatmak üzeresiniz.
        </div>
        <form id="start-audit-form">
            <div class="form-group">
                <label class="form-label">Denetim Numarası *</label>
                <input type="text" id="start-audit-code" class="form-input" placeholder="Örn: DNT-${plan.year}-001" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Başlangıç Tarihi *</label>
                    <input type="date" id="start-audit-startdate" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Bitiş Tarihi *</label>
                    <input type="date" id="start-audit-enddate" class="form-input" required>
                </div>
            </div>
            
             <div class="form-group">
                <label class="form-label">Gözetim Sorumlusu</label>
                <select id="start-audit-supervisor" class="form-select">
                    <option value="">Seçiniz...</option>
                    ${supervisorOptions}
                    <option value="Diğer">Diğer (Manuel Giriş)</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Denetim Ekibi</label>
                <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 10px; background: #f9fafb;">
                    ${teamCheckboxes || '<div style="color: #999;">Personel bulunamadı</div>'}
                </div>
            </div>
           
        </form>`,
        () => {
            const auditCode = document.getElementById('start-audit-code').value;
            const startDate = document.getElementById('start-audit-startdate').value;
            const endDate = document.getElementById('start-audit-enddate').value;
            const supervisor = document.getElementById('start-audit-supervisor').value;

            // Collect Team
            const teamCheckboxes = document.querySelectorAll('input[name="audit-team"]:checked');
            const team = Array.from(teamCheckboxes).map(cb => cb.value).join(', ');

            if (auditCode && startDate && endDate) {
                // Create new audit
                const newAuditId = Date.now();
                const newAudit = {
                    id: newAuditId,
                    auditCode: auditCode,
                    title: plannedAudit.title,
                    type: plannedAudit.type,
                    status: 'Planlandı', // Starts as Planlandı since it comes from approved plan
                    startDate: startDate,
                    endDate: endDate,
                    team: team || 'Atanmamış',
                    supervisor: supervisor || '',
                    planId: plan.id, // Link to source plan
                    createdAt: new Date().toISOString()
                };

                state.audits.push(newAudit);

                // Update plan audit reference
                plannedAudit.auditId = newAuditId;
                plannedAudit.status = 'Başladı';

                addLog('Denetim Başlatıldı', `"${plannedAudit.title}" denetimi ${plan.title} planından başlatıldı.`, 'Audit', newAuditId);
                saveToStorage();
                showToast('Denetim başlatıldı!', 'success');
                renderAuditPlanDetail();
            }
        },
        'Başlat',
        '#10b981'
    );
};

// Upload Approval Document
window.uploadApprovalDocument = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (!plan) return;

    showConfirmDialog(
        'Onay Belgesi Yükle',
        `<form id="upload-approval-form">
            <div class="form-group">
                <label class="form-label">İmzalı Onay Belgesi (PDF/Resim)</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="approval-doc-input" class="file-upload-input" accept=".pdf,.jpg,.jpeg,.png">
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Dosya seçmek için tıklayın</span>
                        <span class="file-upload-hint">PDF, JPG, PNG</span>
                    </div>
                </div>
                <div id="approval-file-preview" style="margin-top: 0.5rem;"></div>
            </div>
            <div class="form-group">
                <label class="form-label">Onaylayan Kişi/Kurum</label>
                <input type="text" id="approval-by" class="form-input" value="${plan.approvedBy || 'Denetim Komitesi'}">
            </div>
            <div class="form-group">
                <label class="form-label">Ek Not</label>
                <textarea id="approval-note" class="form-input" rows="2" placeholder="Varsa ek not..."></textarea>
            </div>
        </form>`,
        () => {
            const fileInput = document.getElementById('approval-doc-input');
            const approvedBy = document.getElementById('approval-by').value;
            const note = document.getElementById('approval-note').value;

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                plan.approvalDocument = {
                    name: file.name,
                    type: file.type,
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    uploadedAt: new Date().toISOString(),
                    note: note
                };
                plan.approvedBy = approvedBy;

                addLog('Onay Belgesi Yüklendi', `"${plan.title}" için onay belgesi yüklendi: ${file.name}`, 'System', plan.id);
                saveToStorage();
                showToast('Onay belgesi yüklendi!', 'success');
                renderAuditPlanDetail();
            } else {
                showToast('Lütfen bir dosya seçin.', 'warning');
            }
        },
        'Yükle',
        'var(--primary)'
    );
};

// View Approval Document
window.viewApprovalDocument = function (planId) {
    const plan = state.auditPlans.find(p => p.id == planId);
    if (!plan || !plan.approvalDocument) return;

    const doc = plan.approvalDocument;
    showConfirmDialog(
        'Onay Belgesi',
        `<div style="text-align: center; padding: 1rem;">
            <i data-lucide="file-check" style="width: 48px; height: 48px; color: #10b981; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">${doc.name}</h4>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
                ${doc.size} | ${new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
            </div>
            ${doc.note ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.9rem; text-align: left;"><strong>Not:</strong> ${doc.note}</div>` : ''}
            <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 1rem;">
                <i data-lucide="info" style="width: 14px; display: inline;"></i> 
                Not: Gerçek dosya backend entegrasyonu gerektirir.
            </p>
        </div>`,
        () => { },
        'Kapat',
        'var(--primary)'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// =============================================
// WORKPAPER CRUD FUNCTIONS
// =============================================

// Add Workpaper Modal
window.openAddWorkpaperModal = function (auditId) {
    showConfirmDialog(
        'Yeni Çalışma Kağıdı',
        `<form id="add-workpaper-form">
            <div class="form-group">
                <label class="form-label">Başlık *</label>
                <input type="text" id="wp-title" class="form-input" placeholder="Örn: Stok Sayım Kontrolü" required>
            </div>
            <div class="form-group">
                <label class="form-label">Test Prosedürü / Açıklama</label>
                <textarea id="wp-procedure" class="form-input" rows="2" placeholder="Yapılan incelemenin açıklaması..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Kanıt Dosyaları (Excel, Mail, PDF vb.)</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="wp-files" class="file-upload-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.msg,.eml" multiple>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Dosyaları seçin (birden fazla seçebilirsiniz)</span>
                        <span class="file-upload-hint">Excel, PDF, Word, Resim, Mail</span>
                    </div>
                </div>
                <div id="wp-file-list" style="margin-top: 0.5rem;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Durum</label>
                    <select id="wp-status" class="form-select">
                        <option value="Başlanmadı">Başlanmadı</option>
                        <option value="Devam Ediyor">Devam Ediyor</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sonuç</label>
                    <select id="wp-result" class="form-select">
                        <option value="">Henüz Belirlenmedi</option>
                        <option value="Uygun">Uygun</option>
                        <option value="Uygun Değil">Uygun Değil</option>
                        <option value="Kısmen Uygun">Kısmen Uygun</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Notlar</label>
                <textarea id="wp-notes" class="form-input" rows="2" placeholder="Ek notlar..."></textarea>
            </div>
        </form>`,
        () => {
            const title = document.getElementById('wp-title').value;
            const procedure = document.getElementById('wp-procedure').value;
            const status = document.getElementById('wp-status').value;
            const result = document.getElementById('wp-result').value;
            const notes = document.getElementById('wp-notes').value;
            const fileInput = document.getElementById('wp-files');

            if (!title) {
                showToast('Başlık zorunludur!', 'error');
                return;
            }

            const audit = state.audits.find(a => a.id === auditId);
            if (!audit) return;

            if (!audit.workpapers) audit.workpapers = [];

            // Process files
            const evidence = [];
            if (fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    evidence.push({
                        name: file.name,
                        type: file.type,
                        size: (file.size / 1024).toFixed(2) + ' KB',
                        uploadedAt: new Date().toISOString()
                    });
                }
            }

            audit.workpapers.push({
                id: Date.now(),
                title: title,
                procedure: procedure,
                status: status,
                result: result || null,
                notes: notes,
                evidence: evidence,
                createdAt: new Date().toISOString()
            });

            const evidenceText = evidence.length > 0 ? ` (${evidence.length} dosya)` : '';
            addLog('Çalışma Kağıdı Eklendi', `"${title}" çalışma kağıdı eklendi${evidenceText}.`, 'Audit', auditId);
            saveToStorage();
            showToast('Çalışma kağıdı eklendi!', 'success');

            // Refresh workpapers content
            const container = document.getElementById(`workpapers-list-${auditId}`);
            if (container) {
                container.innerHTML = renderWorkpapersContent(auditId);
                lucide.createIcons();
            }
        },
        'Ekle',
        'var(--primary)'
    );
};

// Edit Workpaper
window.editWorkpaper = function (auditId, wpIndex) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit || !audit.workpapers || !audit.workpapers[wpIndex]) return;

    const wp = audit.workpapers[wpIndex];

    showConfirmDialog(
        'Çalışma Kağıdını Düzenle',
        `<form id="edit-workpaper-form">
            <div class="form-group">
                <label class="form-label">Başlık *</label>
                <input type="text" id="wp-title" class="form-input" value="${wp.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Test Prosedürü</label>
                <textarea id="wp-procedure" class="form-input" rows="3">${wp.procedure || ''}</textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Durum</label>
                    <select id="wp-status" class="form-select">
                        <option value="Başlanmadı" ${wp.status === 'Başlanmadı' ? 'selected' : ''}>Başlanmadı</option>
                        <option value="Devam Ediyor" ${wp.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option>
                        <option value="Tamamlandı" ${wp.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sonuç</label>
                    <select id="wp-result" class="form-select">
                        <option value="" ${!wp.result ? 'selected' : ''}>Henüz Belirlenmedi</option>
                        <option value="Uygun" ${wp.result === 'Uygun' ? 'selected' : ''}>Uygun</option>
                        <option value="Uygun Değil" ${wp.result === 'Uygun Değil' ? 'selected' : ''}>Uygun Değil</option>
                        <option value="Kısmen Uygun" ${wp.result === 'Kısmen Uygun' ? 'selected' : ''}>Kısmen Uygun</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Notlar</label>
                <textarea id="wp-notes" class="form-input" rows="2">${wp.notes || ''}</textarea>
            </div>
        </form>`,
        () => {
            const title = document.getElementById('wp-title').value;
            const procedure = document.getElementById('wp-procedure').value;
            const status = document.getElementById('wp-status').value;
            const result = document.getElementById('wp-result').value;
            const notes = document.getElementById('wp-notes').value;

            if (!title) {
                showToast('Başlık zorunludur!', 'error');
                return;
            }

            wp.title = title;
            wp.procedure = procedure;
            wp.status = status;
            wp.result = result || null;
            wp.notes = notes;
            wp.updatedAt = new Date().toISOString();

            addLog('Çalışma Kağıdı Güncellendi', `"${title}" çalışma kağıdı güncellendi.`, 'Audit', auditId);
            saveToStorage();
            showToast('Çalışma kağıdı güncellendi!', 'success');

            const container = document.getElementById(`workpapers-list-${auditId}`);
            if (container) {
                container.innerHTML = renderWorkpapersContent(auditId);
                lucide.createIcons();
            }
        },
        'Kaydet',
        'var(--primary)'
    );
};

// Delete Workpaper
window.deleteWorkpaper = function (auditId, wpIndex) {
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit || !audit.workpapers || !audit.workpapers[wpIndex]) return;

    const wp = audit.workpapers[wpIndex];

    showConfirmDialog(
        'Çalışma Kağıdını Sil',
        `"${wp.title}" çalışma kağıdını silmek istediğinize emin misiniz?`,
        () => {
            // Soft delete - move to deletedWorkpapers
            if (!state.deletedWorkpapers) state.deletedWorkpapers = [];
            const deletedWp = {
                ...wp,
                id: Date.now(),
                auditId: auditId,
                auditTitle: audit.title,
                deletedAt: new Date().toISOString()
            };
            state.deletedWorkpapers.push(deletedWp);

            // Remove from active workpapers
            audit.workpapers.splice(wpIndex, 1);
            addLog('Çalışma Kağıdı Silindi', `"${wp.title}" çalışma kağıdı silindi.`, 'Audit', auditId);
            saveToStorage();
            showToast('Çalışma kağıdı silindi. Silinenler\'den geri getirebilirsiniz.', 'info');

            const container = document.getElementById(`workpapers-list-${auditId}`);
            if (container) {
                container.innerHTML = renderWorkpapersContent(auditId);
                lucide.createIcons();
            }
        },
        'Sil',
        '#ef4444'
    );
};

// =============================================
// REPORT ATTACHMENTS FUNCTIONS
// =============================================

// Render Attachments Content
function renderAttachmentsContent(auditId) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit) return '';

    const attachments = audit.attachments || [];

    if (attachments.length === 0) {
        return `
            <div style="text-align: center; padding: 3rem 2rem; color: var(--text-light); background: #f9fafb; border-radius: 0.75rem;">
                <i data-lucide="paperclip" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.4;"></i>
                <p style="font-size: 1rem; margin-bottom: 0.5rem;">Henüz rapor eki eklenmemiş</p>
                <p style="font-size: 0.85rem;">Denetim raporuna eklenecek belgeleri buraya yükleyebilirsiniz.</p>
            </div>
        `;
    }

    return attachments.map((att, index) => `
        <div style="border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; background: white; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; background: ${getFileIconColor(att.type)}15; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${getFileIcon(att.type)}" style="width: 20px; color: ${getFileIconColor(att.type)};"></i>
                </div>
                <div>
                    <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem;">${att.title}</h4>
                    <div style="font-size: 0.8rem; color: var(--text-light);">
                        ${att.fileName} • ${att.size} • ${formatDate(att.uploadedAt)}
                    </div>
                    ${att.description ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem;">${att.description}</p>` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary" style="padding: 0.35rem 0.5rem;" onclick="window.editAttachment('${auditId}', ${index})"><i data-lucide="edit" style="width: 14px;"></i></button>
                <button class="btn" style="padding: 0.35rem 0.5rem; background: #ef4444; color: white;" onclick="window.deleteAttachment('${auditId}', ${index})"><i data-lucide="trash-2" style="width: 14px;"></i></button>
            </div>
        </div>
    `).join('');
}

// File Icon Helper
function getFileIcon(type) {
    if (type && type.includes('pdf')) return 'file-text';
    if (type && type.includes('word')) return 'file-text';
    if (type && type.includes('excel') || type && type.includes('spreadsheet')) return 'table';
    if (type && type.includes('image')) return 'image';
    return 'file';
}

function getFileIconColor(type) {
    if (type && type.includes('pdf')) return '#ef4444';
    if (type && type.includes('word')) return '#3b82f6';
    if (type && type.includes('excel') || type && type.includes('spreadsheet')) return '#10b981';
    if (type && type.includes('image')) return '#8b5cf6';
    return '#6b7280';
}

// Add Attachment Modal
window.openAddAttachmentModal = function (auditId) {
    showConfirmDialog(
        'Yeni Rapor Eki',
        `<form id="add-attachment-form">
            <div class="form-group">
                <label class="form-label">Ek Başlığı *</label>
                <input type="text" id="att-title" class="form-input" placeholder="Örn: Risk Matrisi" required>
            </div>
            <div class="form-group">
                <label class="form-label">Dosya *</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="att-file" class="file-upload-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" required>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Dosya seçin</span>
                        <span class="file-upload-hint">PDF, Word, Excel, Resim</span>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Açıklama</label>
                <textarea id="att-description" class="form-input" rows="2" placeholder="Ek hakkında açıklama..."></textarea>
            </div>
        </form>`,
        () => {
            const title = document.getElementById('att-title').value;
            const fileInput = document.getElementById('att-file');
            const description = document.getElementById('att-description').value;

            if (!title || !fileInput.files.length) {
                showToast('Başlık ve dosya zorunludur!', 'error');
                return;
            }

            const file = fileInput.files[0];
            const audit = state.audits.find(a => a.id === auditId);
            if (!audit) return;

            if (!audit.attachments) audit.attachments = [];

            audit.attachments.push({
                id: Date.now(),
                title: title,
                fileName: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                description: description,
                uploadedAt: new Date().toISOString()
            });

            addLog('Rapor Eki Eklendi', `"${title}" eki eklendi: ${file.name}`, 'Audit', auditId);
            saveToStorage();
            showToast('Rapor eki eklendi!', 'success');

            const container = document.getElementById(`attachments-list-${auditId}`);
            if (container) {
                container.innerHTML = renderAttachmentsContent(auditId);
                lucide.createIcons();
            }
        },
        'Ekle',
        'var(--primary)'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// Edit Attachment
window.editAttachment = function (auditId, attIndex) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit || !audit.attachments || !audit.attachments[attIndex]) return;

    const att = audit.attachments[attIndex];

    showConfirmDialog(
        'Rapor Ekini Düzenle',
        `<form id="edit-attachment-form">
            <div class="form-group">
                <label class="form-label">Ek Başlığı *</label>
                <input type="text" id="att-title" class="form-input" value="${att.title}" required>
            </div>
            <div style="padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; margin-bottom: 1rem;">
                <div style="font-size: 0.9rem; font-weight: 500;">${att.fileName}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${att.size}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Açıklama</label>
                <textarea id="att-description" class="form-input" rows="2">${att.description || ''}</textarea>
            </div>
        </form>`,
        () => {
            const title = document.getElementById('att-title').value;
            const description = document.getElementById('att-description').value;

            if (!title) {
                showToast('Başlık zorunludur!', 'error');
                return;
            }

            att.title = title;
            att.description = description;
            att.updatedAt = new Date().toISOString();

            addLog('Rapor Eki Güncellendi', `"${title}" eki güncellendi.`, 'Audit', auditId);
            saveToStorage();
            showToast('Rapor eki güncellendi!', 'success');

            const container = document.getElementById(`attachments-list-${auditId}`);
            if (container) {
                container.innerHTML = renderAttachmentsContent(auditId);
                lucide.createIcons();
            }
        },
        'Kaydet',
        'var(--primary)'
    );
};

// Delete Attachment
window.deleteAttachment = function (auditId, attIndex) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit || !audit.attachments || !audit.attachments[attIndex]) return;

    const att = audit.attachments[attIndex];

    showConfirmDialog(
        'Rapor Ekini Sil',
        `"${att.title}" ekini silmek istediğinize emin misiniz?`,
        () => {
            audit.attachments.splice(attIndex, 1);
            addLog('Rapor Eki Silindi', `"${att.title}" eki silindi.`, 'Audit', auditId);
            saveToStorage();
            showToast('Rapor eki silindi.', 'info');

            const container = document.getElementById(`attachments-list-${auditId}`);
            if (container) {
                container.innerHTML = renderAttachmentsContent(auditId);
                lucide.createIcons();
            }
        },
        'Sil',
        '#ef4444'
    );
};

// =============================================
// FINAL REPORT FUNCTIONS
// =============================================

// Upload Final Report (signed)
window.uploadFinalReport = function (auditId) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit) return;

    showConfirmDialog(
        'Nihai Raporu Yükle',
        `<div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #6ee7b7; padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #059669; margin-bottom: 0.5rem;">
                <i data-lucide="file-check" style="width: 16px;"></i> Nihai Rapor
            </div>
            <p style="font-size: 0.9rem; color: #047857; margin: 0;">İmzalanmış nihai denetim raporunu PDF veya Word formatında yükleyin.</p>
        </div>
        <form id="final-report-form">
            <div class="form-group">
                <label class="form-label">İmzalı Rapor Dosyası *</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="final-report-file" class="file-upload-input" accept=".pdf,.doc,.docx" required>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Dosya seçin</span>
                        <span class="file-upload-hint">PDF, Word</span>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Rapor Tarihi</label>
                <input type="date" id="final-report-date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label class="form-label">Not</label>
                <textarea id="final-report-note" class="form-input" rows="2" placeholder="Varsa ek not..."></textarea>
            </div>
        </form>`,
        () => {
            const fileInput = document.getElementById('final-report-file');
            const reportDate = document.getElementById('final-report-date').value;
            const note = document.getElementById('final-report-note').value;

            if (!fileInput.files.length) {
                showToast('Lütfen rapor dosyasını yükleyin!', 'error');
                return;
            }

            const file = fileInput.files[0];
            audit.finalReport = {
                fileName: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(2) + ' KB',
                reportDate: reportDate,
                note: note,
                uploadedAt: new Date().toISOString()
            };

            addLog('Nihai Rapor Yüklendi', `Nihai rapor yüklendi: ${file.name}`, 'Audit', auditId);
            saveToStorage();
            showToast('Nihai rapor yüklendi!', 'success');
            renderAuditDetail();
        },
        'Yükle',
        '#10b981'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// View Final Report
window.viewFinalReport = function (auditId) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit || !audit.finalReport) return;

    const report = audit.finalReport;
    showConfirmDialog(
        'Nihai Rapor',
        `<div style="text-align: center; padding: 1rem;">
            <i data-lucide="file-check" style="width: 48px; height: 48px; color: #10b981; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">${report.fileName}</h4>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
                ${report.size} | Rapor Tarihi: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString('tr-TR') : '-'}
            </div>
            ${report.note ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.9rem; text-align: left;"><strong>Not:</strong> ${report.note}</div>` : ''}
            <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 1rem;">
                <i data-lucide="info" style="width: 14px; display: inline;"></i> 
                Gerçek dosya indirme backend entegrasyonu gerektirir.
            </p>
        </div>`,
        () => { },
        'Kapat',
        'var(--primary)'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// View Workpaper File (show file info since actual file storage requires backend)
window.viewWorkpaperFile = function (auditId, wpIndex, fileIndex) {
    const audit = state.audits.find(a => a.id === auditId);
    if (!audit || !audit.workpapers || !audit.workpapers[wpIndex]) return;

    const wp = audit.workpapers[wpIndex];
    if (!wp.evidence || !wp.evidence[fileIndex]) return;

    const file = wp.evidence[fileIndex];

    showConfirmDialog(
        'Dosya Bilgisi',
        `<div style="text-align: center; padding: 1rem;">
            <i data-lucide="${getFileIcon(file.type)}" style="width: 48px; height: 48px; color: ${getFileIconColor(file.type)}; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">${file.name}</h4>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
                ${file.size} | ${new Date(file.uploadedAt).toLocaleDateString('tr-TR')}
            </div>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; color: #92400e;">
                <i data-lucide="info" style="width: 14px; display: inline;"></i>
                Gerçek dosya indirme ve görüntüleme için backend entegrasyonu gereklidir. 
                Şu an dosya bilgileri kaydedilmektedir.
            </div>
        </div>`,
        () => { },
        'Kapat',
        'var(--primary)'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// =============================================
// AUDIT REPORT GENERATION
// =============================================

// Generate PDF Report
window.generateAuditReportPDF = function (auditId) {
    const { jsPDF } = window.jspdf;
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) {
        showToast('Denetim bulunamadı!', 'error');
        return;
    }

    const auditFindings = state.findings.filter(f => f.auditId == auditId);
    const doc = new jsPDF();
    let y = 20;

    // Header with company name
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('İÇ SİSTEMLER PLATFORMU', 105, y, { align: 'center' });
    y += 6;
    doc.text('DENETİM YÖNETİM SİSTEMİ', 105, y, { align: 'center' });
    y += 15;

    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 69); // Green color
    doc.text('DENETİM RAPORU', 105, y, { align: 'center' });
    y += 15;

    // Audit Info Box
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setDrawColor(0, 156, 69);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, y, 180, 40, 3, 3, 'FD');

    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(audit.title, 20, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Denetim Kodu: ${audit.auditCode || '-'}`, 20, y);
    doc.text(`Tür: ${audit.type}`, 120, y);
    y += 5;
    doc.text(`Tarih: ${audit.startDate} - ${audit.endDate}`, 20, y);
    doc.text(`Durum: ${audit.status}`, 120, y);
    y += 5;
    doc.text(`Denetim Ekibi: ${audit.team || '-'}`, 20, y);
    doc.text(`Gözetim: ${audit.supervisor || '-'}`, 120, y);
    y += 20;

    // Findings Section
    if (auditFindings.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 69);
        doc.text('BULGULAR', 15, y);
        y += 8;

        auditFindings.forEach((finding, index) => {
            // New page if needed
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            // Finding Header
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${finding.title}`, 15, y);
            y += 6;

            // Finding Details
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80);


            doc.text(`Risk: ${finding.risk} | Durum: ${finding.status}`, 20, y);
            y += 5;

            if (finding.content) {
                const lines = doc.splitTextToSize(`İçerik: ${finding.content}`, 170);
                doc.text(lines, 20, y);
                y += lines.length * 4 + 2;
            }

            if (finding.inspectorRecommendation) {
                const lines = doc.splitTextToSize(`Müfettiş Önerisi: ${finding.inspectorRecommendation}`, 170);
                doc.text(lines, 20, y);
                y += lines.length * 4 + 2;
            }

            if (finding.departmentResponse) {
                doc.setTextColor(60, 130, 246); // Blue for response
                const lines = doc.splitTextToSize(`Birim Cevabı: ${finding.departmentResponse}`, 170);
                doc.text(lines, 20, y);
                y += lines.length * 4 + 2;
                doc.setTextColor(80);
            }

            y += 8;
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Bu denetimde bulgu bulunmamaktadır.', 15, y);
        y += 10;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Rapor Tarihi: ${formatDate(new Date())} | Sayfa ${i}/${pageCount}`, 105, 290, { align: 'center' });
    }

    // Save
    doc.save(`Denetim_Raporu_${audit.auditCode || audit.id}.pdf`);

    addLog('Rapor Oluşturuldu', `PDF raporu oluşturuldu: ${audit.title}`, 'Audit', auditId);
    showToast('PDF raporu indirildi!', 'success');
};

// Generate HTML Report (for preview and print)
// Generate HTML Report (for preview and print)
window.generateAuditReportHTML = function (auditId) {
    // Loose equality for robust matching
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) {
        showToast('Denetim bulunamadı!', 'error');
        return;
    }

    const auditFindings = state.findings.filter(f => f.auditId == auditId);

    // Statistics
    const riskStats = {
        Yüksek: auditFindings.filter(f => f.risk === 'Yüksek').length,
        Orta: auditFindings.filter(f => f.risk === 'Orta').length,
        Düşük: auditFindings.filter(f => f.risk === 'Düşük').length
    };

    // Dates
    const reportDate = new Date().toLocaleDateString('tr-TR');
    const startDate = formatDate(audit.startDate);
    const endDate = formatDate(audit.endDate);

    // Supervisor Info Fetch Logic
    let supervisorTitle = '';
    const supervisorName = audit.supervisor;
    if (supervisorName && state.staff) {
        let supervisorPerson = state.staff.find(s => s.name === supervisorName);
        if (supervisorPerson) {
            supervisorTitle = ` (${supervisorPerson.title})`;
        }
    }

    const reportHTML = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Teftiş Raporu - ${audit.title}</title>
        <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.5; color: #333; margin: 0; padding: 20px; }
            h1 { font-size: 16pt; text-transform: uppercase; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 30px; }
            h2 { font-size: 14pt; color: #1e40af; margin-top: 20px; margin-bottom: 10px; }
            h3 { font-size: 11pt; font-weight: bold; margin-bottom: 5px; color: #333; }
            .cover { text-align: center; margin-top: 100px; page-break-after: always; }
            .finding-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 20px; background: #f9fafb; page-break-inside: avoid; }
            .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; color: white; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; vertical-align: top; }
            th { background-color: #f3f4f6; font-weight: bold; width: 150px; }
            .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 5px; }
        </style>
    </head>
    <body onload="window.print()">
        <!-- Cover Page -->
        <div class="cover">
            <h1 style="border: none; font-size: 24pt;">TEFTİŞ KURULU BAŞKANLIĞI</h1>
            <h2 style="font-size: 20pt; color: #333; margin-top: 50px;">DENETİM RAPORU</h2>
            <div style="margin-top: 50px; font-size: 14pt;">
                <strong>${audit.title}</strong><br>
                <span style="font-size: 12pt; color: #666;">${audit.auditCode || ''}</span>
            </div>
            <div style="margin-top: 100px;">
                <p><strong>Rapor Tarihi:</strong> ${reportDate}</p>
                <p><strong>Denetim Ekibi:</strong> ${audit.team}</p>
                ${audit.supervisor ? `<p><strong>Gözetim:</strong> ${audit.supervisor}${supervisorTitle}</p>` : ''}
            </div>
        </div>

        <h1>1. YÖNETİCİ ÖZETİ</h1>
        <p><strong>${audit.title}</strong>, ${startDate} ile ${endDate} tarihleri arasında gerçekleştirilmiştir. Denetim sonucunda toplam <strong>${auditFindings.length}</strong> bulgu tespit edilmiştir.</p>
        
        <h3>Risk Dağılımı</h3>
        <ul>
            <li><strong>Yüksek:</strong> ${riskStats.Yüksek}</li>
            <li><strong>Orta:</strong> ${riskStats['Orta']}</li>
            <li><strong>Düşük:</strong> ${riskStats['Düşük']}</li>
        </ul>

        <h1>2. BULGULAR VE DETAYLAR</h1>
        ${auditFindings.length > 0 ? auditFindings.map((f, index) => `
            <div class="finding-box">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 1px solid #d1d5db; padding-bottom: 5px;">
                    <div style="font-weight: bold; color: #1e3a8a;">${index + 1}. ${f.title} <span style="font-weight: normal; color: #666;">(${f.findingCode || 'N/A'})</span></div>
                    <span class="risk-badge" style="background-color: ${f.risk === 'Kritik' ? '#dc2626' : f.risk === 'Yüksek' ? '#ea580c' : f.risk === 'Orta' ? '#ca8a04' : '#16a34a'};">${f.risk}</span>
                </div>
                
                <table>
                    <tr><th>Kriter / Dayanak</th><td>${f.criterion || 'Belirtilmemiş'}</td></tr>
                    <tr><th>Bulgu Detayı</th><td>${f.content}</td></tr>
                    <tr><th>Kök Neden</th><td>${f.rootCause || '-'}</td></tr>
                    <tr><th>Etki / Risk</th><td>${f.impact || '-'}</td></tr>
                    <tr><th>Müfettiş Önerisi</th><td>${f.inspectorRecommendation || '-'}</td></tr>
                    <tr><th>Birim Görüşü</th><td>${f.departmentResponse || 'Henüz yanıtlanmadı'}</td></tr>
                    <tr><th>Sorumlu</th><td>${f.responsible || '-'}</td></tr>
                    <tr><th>Termin</th><td>${f.dueDate ? formatDate(f.dueDate) : '-'}</td></tr>
                </table>
            </div>
        `).join('') : '<p>Bu denetimde raporlanacak bulgu bulunmamaktadır.</p>'}

        <div class="footer">
            Gizli ve Hizmete Özeldir - ${audit.auditCode || audit.title}
        </div>
    </body>
    </html>
    `;

    const popup = window.open('', '_blank');
    if (popup) {
        popup.document.write(reportHTML);
        popup.document.close();
    } else {
        alert('Lütfen pop-up engelleyiciyi kapatınız.');
    }
};



// Preview PDF Report (open in new tab)
window.previewAuditReportPDF = function (auditId) {
    const { jsPDF } = window.jspdf;
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) {
        showToast('Denetim bulunamadı!', 'error');
        return;
    }

    const auditFindings = state.findings.filter(f => f.auditId == auditId);
    const doc = new jsPDF();
    let y = 20;

    // Build same PDF as download
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('İÇ SİSTEMLER PLATFORMU', 105, y, { align: 'center' });
    y += 6;
    doc.text('DENETİM YÖNETİM SİSTEMİ', 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(18);
    doc.setTextColor(0, 100, 69);
    doc.text('DENETİM RAPORU', 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setDrawColor(0, 156, 69);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, y, 180, 40, 3, 3, 'FD');

    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(audit.title, 20, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Denetim Kodu: ${audit.auditCode || '-'} `, 20, y);
    doc.text(`Tür: ${audit.type} `, 120, y);
    y += 5;
    doc.text(`Tarih: ${audit.startDate} - ${audit.endDate} `, 20, y);
    doc.text(`Durum: ${audit.status} `, 120, y);
    y += 5;
    doc.text(`Denetim Ekibi: ${audit.team || '-'} `, 20, y);
    doc.text(`Gözetim: ${audit.supervisor || '-'} `, 120, y);
    y += 20;

    if (auditFindings.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 69);
        doc.text('BULGULAR', 15, y);
        y += 8;

        auditFindings.forEach((finding, index) => {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${finding.title} `, 15, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80);
            doc.text(`Risk: ${finding.risk} | Durum: ${finding.status} `, 20, y);
            y += 5;
            if (finding.content) {
                const lines = doc.splitTextToSize(`İçerik: ${finding.content} `, 170);
                doc.text(lines, 20, y);
                y += lines.length * 4 + 2;
            }
            if (finding.departmentResponse) {
                doc.setTextColor(60, 130, 246);
                const lines = doc.splitTextToSize(`Birim Cevabı: ${finding.departmentResponse} `, 170);
                doc.text(lines, 20, y);
                y += lines.length * 4 + 2;
                doc.setTextColor(80);
            }
            y += 8;
        });
    }

    // Open as blob URL
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');

    addLog('Rapor Görüntülendi', `PDF raporu görüntülendi: ${audit.title} `, 'Audit', auditId);
};

// Download HTML as Word document
window.downloadAuditReportHTML = function (auditId) {
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit) {
        showToast('Denetim bulunamadı!', 'error');
        return;
    }

    const auditFindings = state.findings.filter(f => f.auditId == auditId);

    const reportHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><title>Denetim Raporu</title></head>
    <body style="font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #009c45; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 12px; color: #666;">İÇ SİSTEMLER PLATFORMU - DENETİM YÖNETİM SİSTEMİ</div>
            <h1 style="color: #009c45;">DENETİM RAPORU</h1>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #6ee7b7; padding: 20px; margin-bottom: 30px;">
            <h2>${audit.title}</h2>
            <p><strong>Denetim Kodu:</strong> ${audit.auditCode || '-'} | <strong>Tür:</strong> ${audit.type}</p>
            <p><strong>Başlangıç:</strong> ${audit.startDate} | <strong>Bitiş:</strong> ${audit.endDate}</p>
            <p><strong>Denetim Ekibi:</strong> ${audit.team || '-'} | <strong>Gözetim:</strong> ${audit.supervisor || '-'}</p>
            <p><strong>Durum:</strong> ${audit.status}</p>
        </div>
        <h2 style="color: #009c45;">Bulgular (${auditFindings.length})</h2>
        ${auditFindings.map((f, i) => `
            <div style="background: #f9fafb; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                <h3>${i + 1}. ${f.title}</h3>
                <p><strong>Risk:</strong> ${f.risk} | <strong>Durum:</strong> ${f.status}</p>
                ${f.content ? `<p><strong>İçerik:</strong> ${f.content}</p>` : ''}
                ${f.inspectorRecommendation ? `<p><strong>Müfettiş Önerisi:</strong> ${f.inspectorRecommendation}</p>` : ''}
                ${f.departmentResponse ? `<p style="background: #eff6ff; padding: 10px;"><strong>Birim Cevabı:</strong> ${f.departmentResponse}</p>` : ''}
            </div>
        `).join('')}
        <div style="text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Rapor Tarihi: ${formatDate(new Date())}
        </div>
    </body>
    </html>`;

    const blob = new Blob(['\ufeff', reportHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Denetim_Raporu_${audit.auditCode || audit.id}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog('Rapor İndirildi', `Word raporu indirildi: ${audit.title} `, 'Audit', auditId);
    showToast('Word raporu indirildi!', 'success');
};

// Download signed final report
window.downloadFinalReport = function (auditId) {
    const audit = state.audits.find(a => a.id == auditId);
    if (!audit || !audit.finalReport) {
        showToast('İmzalı rapor bulunamadı!', 'error');
        return;
    }

    // In real app, this would download actual file from server
    // For now, show info modal
    showConfirmDialog(
        'İmzalı Rapor İndir',
        `<div style="text-align: center; padding: 1rem;">
            <i data-lucide="file-check" style="width: 48px; height: 48px; color: #10b981; margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">${audit.finalReport.fileName}</h4>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem;">
                ${audit.finalReport.size} | ${formatDate(audit.finalReport.uploadedAt)}
            </div>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; color: #92400e;">
                <i data-lucide="info" style="width: 14px; display: inline;"></i>
                Gerçek dosya indirme için backend entegrasyonu gereklidir.
            </div>
        </div>`,
        () => { },
        'Kapat',
        'var(--primary)'
    );
    setTimeout(() => lucide.createIcons(), 100);

    addLog('İmzalı Rapor İndirildi', `İmzalı rapor indirildi: ${audit.finalReport.fileName} `, 'Audit', auditId);
};

// =============================================
// STAFF MANAGEMENT (Teftiş Kurulu Personeli)
// =============================================

// Calculate age from birth date
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Calculate years of service
function calculateYearsOfService(hireDate) {
    const today = new Date();
    const hire = new Date(hireDate);
    let years = today.getFullYear() - hire.getFullYear();
    const monthDiff = today.getMonth() - hire.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
        years--;
    }
    return years;
}

// Render Staff Page
function renderStaff() {
    if (!state.staff) state.staff = [];

    const staffCards = state.staff.map(person => {
        const age = calculateAge(person.birthDate);
        const yearsOfService = calculateYearsOfService(person.hireDate);
        const remainingLeave = person.annualLeave - person.usedLeave;

        return `
    <div class="card" style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 1.5rem;">
            <!-- Avatar -->
            <div style="flex-shrink: 0;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, #059669 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 600;">
                    ${person.name.split(' ').map(n => n[0]).join('')}
                </div>
            </div>

            <!-- Info -->
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin-bottom: 0.25rem;">${person.name}</h3>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span style="background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500;">${person.title}</span>
                            <span style="color: var(--text-light); font-size: 0.85rem;">${person.employeeId}</span>
                            <span style="color: ${person.status === 'Aktif' ? '#10b981' : '#ef4444'}; font-size: 0.8rem;">● ${person.status}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="viewStaffDetail(${person.id})">
                            <i data-lucide="eye" style="width: 14px;"></i> Detay
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editStaff(${person.id})">
                            <i data-lucide="edit" style="width: 14px;"></i>
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Yaş</div>
                        <div style="font-weight: 600;">${age} yaş</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Kıdem</div>
                        <div style="font-weight: 600;">${yearsOfService} yıl</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">İşe Giriş</div>
                        <div style="font-weight: 600;">${formatDate(person.hireDate)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Kalan İzin</div>
                        <div style="font-weight: 600; color: ${remainingLeave < 5 ? '#ef4444' : '#10b981'};">${remainingLeave} gün</div>
                    </div>
                </div>

                ${person.certifications && person.certifications.length > 0 ? `
                    <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${person.certifications.map(cert => `
                            <span style="background: #eff6ff; color: #3b82f6; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${cert}</span>
                        `).join('')}
                    </div>
                    ` : ''}
            </div>
        </div>
        </div>
    `;
    }).join('');

    mainView.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3>Teftiş Kurulu Personeli</h3>
                <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.25rem;">${state.staff.length} personel kayıtlı</p>
            </div>
            <button class="btn btn-primary" onclick="openAddStaffModal()">
                <i data-lucide="user-plus" style="width: 16px; margin-right: 0.5rem;"></i> Yeni Personel Ekle
            </button>
        </div>
        </div>

    ${staffCards || '<div class="card"><p style="text-align: center; color: var(--text-light);">Henüz personel kaydı bulunmamaktadır.</p></div>'}
`;

    lucide.createIcons();
}

// View Staff Detail
window.viewStaffDetail = function (staffId) {
    const person = state.staff.find(s => s.id == staffId);
    if (!person) return;

    const age = calculateAge(person.birthDate);
    const yearsOfService = calculateYearsOfService(person.hireDate);

    // Count audits assigned to this person
    const assignedAudits = state.audits.filter(a =>
        (a.team && a.team.includes(person.name)) ||
        (a.supervisor && a.supervisor.includes(person.name))
    ).length;

    showConfirmDialog(
        person.name,
        `<div style="text-align: left;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, #059669 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 600;">
                    ${person.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                    <h3 style="margin-bottom: 0.25rem;">${person.name}</h3>
                    <div style="color: var(--primary); font-weight: 500;">${person.title}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">${person.employeeId}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div><strong>Yaş:</strong> ${age} yaş</div>
                <div><strong>Kıdem:</strong> ${yearsOfService} yıl</div>
                <div><strong>Doğum Tarihi:</strong> ${formatDate(person.birthDate)}</div>
                <div><strong>İşe Giriş:</strong> ${formatDate(person.hireDate)}</div>
                <div><strong>E-posta:</strong> ${person.email}</div>
                <div><strong>Telefon:</strong> ${person.phone}</div>
                <div><strong>Yıllık İzin:</strong> ${person.annualLeave} gün</div>
                <div><strong>Kullanılan:</strong> ${person.usedLeave} gün</div>
                <div><strong>Kalan İzin:</strong> <span style="color: ${person.annualLeave - person.usedLeave < 5 ? '#ef4444' : '#10b981'}; font-weight: 600;">${person.annualLeave - person.usedLeave} gün</span></div>
                <div><strong>Atanan Denetim:</strong> ${assignedAudits}</div>
            </div>
            
            ${person.certifications && person.certifications.length > 0 ? `
            <div style="margin-top: 1rem;">
                <strong>Sertifikalar:</strong>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${person.certifications.map(cert => `<span style="background: #eff6ff; color: #3b82f6; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem;">${cert}</span>`).join('')}
                </div>
            </div>
            ` : ''
        }
            
            ${person.notes ? `
            <div style="margin-top: 1rem;">
                <strong>Notlar:</strong>
                <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 0.25rem;">${person.notes}</p>
            </div>
            ` : ''
        }
        </div>`,
        () => { closeConfirmDialog(); },
        'Kapat',
        'var(--primary)',
        true
    );
    setTimeout(() => lucide.createIcons(), 100);
};

// Add Staff Modal
window.openAddStaffModal = function () {
    showConfirmDialog(
        'Yeni Personel Ekle',
        `<form id="add-staff-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Ad Soyad *</label>
                    <input type="text" id="staff-name" class="form-input" placeholder="Örn: Ahmet Yıldız" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Ünvan *</label>
                    <select id="staff-title" class="form-select">
                        <option value="Müfettiş Yardımcısı">Müfettiş Yardımcısı</option>
                        <option value="Yetkili Müfettiş Yardımcısı">Yetkili Müfettiş Yardımcısı</option>
                        <option value="Müfettiş">Müfettiş</option>
                        <option value="Kıdemli Müfettiş">Kıdemli Müfettiş</option>
                        <option value="Başmüfettiş">Başmüfettiş</option>
                        <option value="Müdür">Müdür</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sicil No</label>
                    <input type="text" id="staff-employeeId" class="form-input" placeholder="Örn: TK-003">
                </div>
                <div class="form-group">
                    <label class="form-label">Doğum Tarihi</label>
                    <input type="date" id="staff-birthDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">İşe Giriş Tarihi</label>
                    <input type="date" id="staff-hireDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">E-posta</label>
                    <input type="email" id="staff-email" class="form-input" placeholder="ornek@sirket.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Telefon</label>
                    <input type="text" id="staff-phone" class="form-input" placeholder="555-0000">
                </div>
                <div class="form-group">
                    <label class="form-label">Yıllık İzin Hakkı</label>
                    <input type="number" id="staff-annualLeave" class="form-input" value="18">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Notlar</label>
                <textarea id="staff-notes" class="form-input" rows="2" placeholder="Uzmanlık alanları, notlar..."></textarea>
            </div>
        </form>`,
        () => {
            const name = document.getElementById('staff-name').value;
            if (!name) {
                showToast('Ad Soyad zorunludur!', 'error');
                return;
            }

            const newStaff = {
                id: Date.now(),
                name: name,
                title: document.getElementById('staff-title').value,
                employeeId: document.getElementById('staff-employeeId').value || `TK - ${String(state.staff.length + 1).padStart(3, '0')} `,
                birthDate: document.getElementById('staff-birthDate').value || '1990-01-01',
                hireDate: document.getElementById('staff-hireDate').value || new Date().toISOString().split('T')[0],
                email: document.getElementById('staff-email').value || '',
                phone: document.getElementById('staff-phone').value || '',
                department: 'Teftiş Kurulu',
                status: 'Aktif',
                annualLeave: parseInt(document.getElementById('staff-annualLeave').value) || 18,
                usedLeave: 0,
                certifications: [],
                notes: document.getElementById('staff-notes').value || ''
            };

            if (!state.staff) state.staff = [];
            state.staff.push(newStaff);

            addLog('Personel Eklendi', `${newStaff.name} (${newStaff.title}) personel listesine eklendi.`, 'Staff', newStaff.id);
            saveToStorage();
            showToast(`${newStaff.name} başarıyla eklendi!`, 'success');
            renderStaff();
        },
        'Ekle',
        'var(--primary)'
    );
};

// Edit Staff
window.editStaff = function (staffId) {
    const person = state.staff.find(s => s.id == staffId);
    if (!person) return;

    showConfirmDialog(
        'Personel Düzenle',
        `<form id="edit-staff-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Ad Soyad *</label>
                    <input type="text" id="staff-name" class="form-input" value="${person.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Ünvan *</label>
                    <select id="staff-title" class="form-select">
                        <option value="Müfettiş Yardımcısı" ${person.title === 'Müfettiş Yardımcısı' ? 'selected' : ''}>Müfettiş Yardımcısı</option>
                        <option value="Yetkili Müfettiş Yardımcısı" ${person.title === 'Yetkili Müfettiş Yardımcısı' ? 'selected' : ''}>Yetkili Müfettiş Yardımcısı</option>
                        <option value="Müfettiş" ${person.title === 'Müfettiş' ? 'selected' : ''}>Müfettiş</option>
                        <option value="Kıdemli Müfettiş" ${person.title === 'Kıdemli Müfettiş' ? 'selected' : ''}>Kıdemli Müfettiş</option>
                        <option value="Başmüfettiş" ${person.title === 'Başmüfettiş' ? 'selected' : ''}>Başmüfettiş</option>
                        <option value="Müdür" ${person.title === 'Müdür' ? 'selected' : ''}>Müdür</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Sicil No</label>
                    <input type="text" id="staff-employeeId" class="form-input" value="${person.employeeId || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Durum</label>
                    <select id="staff-status" class="form-select">
                        <option value="Aktif" ${person.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
                        <option value="Pasif" ${person.status === 'Pasif' ? 'selected' : ''}>Pasif</option>
                        <option value="İzinli" ${person.status === 'İzinli' ? 'selected' : ''}>İzinli</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Doğum Tarihi</label>
                    <input type="date" id="staff-birthDate" class="form-input" value="${person.birthDate || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">İşe Giriş Tarihi</label>
                    <input type="date" id="staff-hireDate" class="form-input" value="${person.hireDate || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">E-posta</label>
                    <input type="email" id="staff-email" class="form-input" value="${person.email || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Telefon</label>
                    <input type="text" id="staff-phone" class="form-input" value="${person.phone || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Yıllık İzin</label>
                    <input type="number" id="staff-annualLeave" class="form-input" value="${person.annualLeave}">
                </div>
                <div class="form-group">
                    <label class="form-label">Kullanılan İzin</label>
                    <input type="number" id="staff-usedLeave" class="form-input" value="${person.usedLeave}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Sertifikalar (virgülle ayırın)</label>
                <input type="text" id="staff-certifications" class="form-input" value="${(person.certifications || []).join(', ')}" placeholder="CIA, CISA, CFE">
            </div>
            <div class="form-group">
                <label class="form-label">Notlar</label>
                <textarea id="staff-notes" class="form-input" rows="2">${person.notes || ''}</textarea>
            </div>
        </form > `,
        () => {
            // Capture before state
            const beforeState = {
                name: person.name,
                title: person.title,
                employeeId: person.employeeId,
                status: person.status,
                birthDate: person.birthDate,
                hireDate: person.hireDate,
                email: person.email,
                phone: person.phone,
                annualLeave: person.annualLeave,
                usedLeave: person.usedLeave,
                certifications: (person.certifications || []).join(', '),
                notes: person.notes
            };

            // Apply changes
            person.name = document.getElementById('staff-name').value;
            person.title = document.getElementById('staff-title').value;
            person.employeeId = document.getElementById('staff-employeeId').value;
            person.status = document.getElementById('staff-status').value;
            person.birthDate = document.getElementById('staff-birthDate').value;
            person.hireDate = document.getElementById('staff-hireDate').value;
            person.email = document.getElementById('staff-email').value;
            person.phone = document.getElementById('staff-phone').value;
            person.annualLeave = parseInt(document.getElementById('staff-annualLeave').value) || 0;
            person.usedLeave = parseInt(document.getElementById('staff-usedLeave').value) || 0;
            const certsInput = document.getElementById('staff-certifications').value;
            person.certifications = certsInput ? certsInput.split(',').map(c => c.trim()).filter(c => c) : [];
            person.notes = document.getElementById('staff-notes').value;

            // Capture after state
            const afterState = {
                name: person.name,
                title: person.title,
                employeeId: person.employeeId,
                status: person.status,
                birthDate: person.birthDate,
                hireDate: person.hireDate,
                email: person.email,
                phone: person.phone,
                annualLeave: person.annualLeave,
                usedLeave: person.usedLeave,
                certifications: person.certifications.join(', '),
                notes: person.notes
            };

            // Build change summary
            const changes = [];
            if (beforeState.name !== afterState.name) changes.push(`Ad: ${beforeState.name} → ${afterState.name} `);
            if (beforeState.title !== afterState.title) changes.push(`Ünvan: ${beforeState.title} → ${afterState.title} `);
            if (beforeState.employeeId !== afterState.employeeId) changes.push(`Sicil: ${beforeState.employeeId} → ${afterState.employeeId} `);
            if (beforeState.status !== afterState.status) changes.push(`Durum: ${beforeState.status} → ${afterState.status} `);
            if (beforeState.annualLeave !== afterState.annualLeave) changes.push(`Yıllık İzin: ${beforeState.annualLeave} → ${afterState.annualLeave} `);
            if (beforeState.usedLeave !== afterState.usedLeave) changes.push(`Kullanılan İzin: ${beforeState.usedLeave} → ${afterState.usedLeave} `);

            const detailMsg = changes.length > 0 ? `${person.name}: ${changes.join(', ')} ` : `${person.name} bilgileri güncellendi.`;

            addLog('Personel Güncellendi', detailMsg, 'Staff', person.id, 'Admin User', { before: beforeState, after: afterState });
            saveToStorage();
            showToast(`${person.name} güncellendi!`, 'success');
            renderStaff();
        },
        'Kaydet',
        'var(--primary)'
    );
};

// Get staff list for dropdowns

// ==========================================
// ACTION VERIFICATION HELPERS
// ==========================================

window.completeAction = function (findingId, actionId) {
    showConfirmDialog(
        'Aksiyonu Tamamla',
        `<form id="complete-action-form">
            <div class="form-group">
                <label class="form-label">Tamamlanma Notu *</label>
                <textarea id="completion-note" class="form-input" rows="3" required placeholder="Aksiyon nasıl tamamlandı? Açıklayınız..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Kanıt Yükle</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="action-evidence" class="file-upload-input" multiple>
                    <div class="file-upload-label">
                        <i data-lucide="upload-cloud" class="file-upload-icon"></i>
                        <span class="file-upload-text">Kanıt dosyaları seçin</span>
                    </div>
                </div>
            </div>
        </form > `,
        () => {
            const note = document.getElementById('completion-note').value;
            if (!note) {
                showToast('Lütfen bir not giriniz.', 'warning');
                return; // Prevent closing if invalid, though confirm dialog logic closes. Best handled with validation inside confirm logic if possible or validation before show.
                // Note: The simple showConfirmDialog implementation usually closes on Confirm. 
                // For a robust implementation, we'd check validity. Assuming user enters data for now or we rely on backend checks (simulated).
            }

            const finding = state.findings.find(f => f.id == findingId);
            const action = finding.actions.find(a => a.id == actionId);

            action.status = 'Tamamlandı';
            action.completedAt = new Date().toISOString();
            action.completedBy = state.currentUser;
            action.completionNote = note;

            // Handle evidence (Mock upload)
            const fileInput = document.getElementById('action-evidence');
            if (fileInput.files.length > 0) {
                action.evidence = Array.from(fileInput.files).map(file => ({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                }));
            }

            addLog('Aksiyon Tamamlandı', `"${action.description}" aksiyonu tamamlandı.`, 'Finding', findingId);
            saveToStorage();
            showToast('Aksiyon başarıyla tamamlandı.', 'success');

            // Refresh View
            if (typeof viewFinding === 'function') viewFinding(findingId);
        },
        'Tamamla',
        '#2563eb'
    );
    setTimeout(() => lucide.createIcons(), 100);
};

window.verifyAction = function (findingId, actionId, isApproved) {
    const actionType = isApproved ? 'Doğrula' : 'Reddet';
    const color = isApproved ? '#10b981' : '#ef4444';

    showConfirmDialog(
        `Aksiyonu ${actionType} `,
        `<form id="verify-action-form">
    <div class="form-group">
        <label class="form-label">${isApproved ? 'Doğrulama Notu' : 'Red Gerekçesi'} *</label>
        <textarea id="verification-note" class="form-input" rows="3" required placeholder="${isApproved ? 'Doğrulama notu ekleyebilirsiniz...' : 'Neden reddedildiğini açıklayınız...'}"></textarea>
    </div>
        </form>`,
        () => {
            const note = document.getElementById('verification-note').value;
            if (!isApproved && !note) {
                showToast('Red için gerekçe girmelisiniz.', 'warning');
                return;
            }

            const finding = state.findings.find(f => f.id == findingId);
            const action = finding.actions.find(a => a.id == actionId);

            action.status = isApproved ? 'Doğrulandı' : 'Reddedildi';
            action.verifiedAt = new Date().toISOString();
            action.verifiedBy = state.currentUser;
            action.verificationNote = note;

            addLog(`Aksiyon ${actionType} ndi`, `"${action.description}" aksiyonu ${isApproved ? 'doğrulandı' : 'reddedildi'}.`, 'Finding', findingId);
            saveToStorage();
            showToast(`Aksiyon ${isApproved ? 'doğrulandı' : 'reddedildi'}.`, isApproved ? 'success' : 'error');

            // Refresh View
            if (typeof viewFinding === 'function') viewFinding(findingId);
        },
        actionType,
        color
    );
};

window.renderActionEvidence = function (evidenceList) {
    if (!evidenceList || evidenceList.length === 0) return '';
    return `
    <div style="margin-top: 0.5rem; border-top: 1px dashed #cbd5e1; padding-top: 0.5rem;">
            <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; font-weight: 600;">EKLENEN KANITLAR</div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                ${evidenceList.map(ev => `
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #334155;">
                        <i data-lucide="file" style="width: 14px; color: #475569;"></i>
                        <span style="flex: 1;">${ev.name}</span>
                        <span style="font-size: 0.75rem; color: #94a3b8;">${ev.size}</span>
                        <a href="#" style="color: #2563eb; font-size: 0.75rem; text-decoration: none;">İndir</a>
                    </div>
                `).join('')}
            </div>
        </div >
    `;
};

// =============================================
// ACTIVITY REPORT (Faaliyet Raporu)
// =============================================

window.renderActivityReportDashboard = function () {
    const currentYear = new Date().getFullYear();
    const audits = state.audits.filter(a => new Date(a.startDate).getFullYear() === currentYear);
    const findings = state.findings.filter(f => audits.some(a => a.id === f.auditId));
    const openFindings = findings.filter(f => f.status !== 'Kapalı');
    const ethics = state.ethicsReports.filter(e => new Date(e.date).getFullYear() === currentYear);
    const staff = state.staff || [];
    const trainings = (state.trainings || []).filter(t => new Date(t.date).getFullYear() === currentYear);

    // Calculate Completion Rate
    const completedAudits = audits.filter(a => a.status === 'Tamamlandı').length;
    const progress = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) : 0;

    mainView.innerHTML = `
    <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div>
                <h2 style="font-size: 1.5rem; font-weight: 600; color: #1e293b;">${currentYear} Yılı Faaliyet Raporu</h2>
                <p style="color: #64748b;">Kurul faaliyetlerinin ve performans göstergelerinin özeti</p>
            </div>
            <div style="display: flex; gap: 1rem;">
                <select id="report-year" class="form-select" style="width: 120px;" onchange="showToast('Yıl değiştirme henüz aktif değil', 'info')">
                    <option value="${currentYear}">${currentYear}</option>
                    <option value="${currentYear - 1}">${currentYear - 1}</option>
                </select>
                <button class="btn btn-primary" onclick="generateActivityReportHTML(${currentYear})">
                    <i data-lucide="file-text" style="width: 16px; margin-right: 0.5rem;"></i> Raporu İndir (PDF)
                </button>
            </div>
        </div>

        <!--Stats Grid-->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card">
                <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Denetim Planı</div>
                <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${progress}%</div>
                <div style="font-size: 0.875rem; color: #10b981;">${completedAudits} / ${audits.length} Tamamlandı</div>
            </div>
            <div class="card">
                <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Toplam Bulgu</div>
                <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${findings.length}</div>
                <div style="font-size: 0.875rem; color: #ef4444;">${openFindings.length} Açık</div>
            </div>
             <div class="card">
                <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Etik Bildirim</div>
                <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${ethics.length}</div>
                <div style="font-size: 0.875rem; color: #3b82f6;">İncelenen: ${ethics.filter(e => e.status !== 'Yeni').length}</div>
            </div>
            <div class="card">
                <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Eğitim/Sertifika</div>
                <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${trainings.length}</div>
                <div style="font-size: 0.875rem; color: #8b5cf6;">${trainings.reduce((acc, t) => acc + t.duration, 0)} Saat Toplam</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <div class="card">
                <h3>Denetim Faaliyetleri</h3>
                <div style="overflow-x: auto; margin-top: 1rem;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #f1f5f9; text-align: left;">
                                <th style="padding: 10px;">Denetim Adı</th>
                                <th style="padding: 10px;">Tür</th>
                                <th style="padding: 10px;">Ekip</th>
                                <th style="padding: 10px;">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${audits.map(a => `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 10px; font-weight: 500;">${a.title}</td>
                                    <td style="padding: 10px;">${a.type}</td>
                                    <td style="padding: 10px; font-size: 0.85rem; color: #64748b;">${a.team}</td>
                                    <td style="padding: 10px;">
                                        <span style="padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; background: ${a.status === 'Tamamlandı' ? '#dcfce7' : '#f1f5f9'}; color: ${a.status === 'Tamamlandı' ? '#166534' : '#64748b'};">
                                            ${a.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="card">
                <h3>Personel Yetkinlik</h3>
                <div style="margin-top: 1rem;">
                    ${state.staff.slice(0, 5).map(s => `
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #475569;">${s.name.charAt(0)}</div>
                            <div>
                                <div style="font-weight: 500;">${s.name}</div>
                                <div style="font-size: 0.75rem; color: #64748b;">${s.title}</div>
                            </div>
                        </div>
                    `).join('')}
                    ${state.staff.length > 5 ? `<div style="text-align: center; color: #3b82f6; font-size: 0.85rem;">+${state.staff.length - 5} kişi daha</div>` : ''}
                </div>
            </div>
        </div>
    </div>
    `;
    lucide.createIcons();
};


window.generateActivityReportHTML = function (year) {
    const audits = state.audits.filter(a => new Date(a.startDate).getFullYear() === year);
    const findings = state.findings.filter(f => audits.some(a => a.id === f.auditId));
    const ethics = state.ethicsReports.filter(e => new Date(e.date).getFullYear() === year);
    const trainings = (state.trainings || []).filter(t => new Date(t.date).getFullYear() === year);

    // Detailed HTML Generation
    const reportHTML = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <title>${year} Faaliyet Raporu</title>
        <style>
            @page { margin: 0; size: A4; }
            body { 
                font-family: 'Arial', sans-serif; 
                font-size: 10pt; 
                line-height: 1.5; 
                color: #333; 
                margin: 0;
                padding: 0;
                background: #fff;
            }
            .page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0 auto;
                background: #fff;
                box-sizing: border-box;
                position: relative;
                page-break-after: always;
            }
            .page:last-child { page-break-after: auto; }
            
            h1 { font-size: 16pt; color: #164e63; border-bottom: 2px solid #164e63; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
            h2 { font-size: 14pt; color: #0891b2; margin-top: 15px; margin-bottom: 10px; font-weight: 600; }
            h3 { font-size: 12pt; color: #475569; margin-top: 10px; font-weight: 600; }
            p { margin-bottom: 10px; text-align: justify; }
            
            .cover-page {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100%;
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            .logo { width: 250px; margin-bottom: 40px; }
            .report-title { font-size: 28pt; font-weight: bold; color: #164e63; margin-bottom: 10px; letter-spacing: 1px; }
            .report-subtitle { font-size: 18pt; color: #64748b; margin-bottom: 60px; }
            .report-meta { font-size: 12pt; color: #94a3b8; margin-top: auto; padding-bottom: 50px; }
            
            .stats-grid { display: flex; gap: 15px; margin-bottom: 20px; }
            .stat-box { 
                flex: 1; 
                padding: 15px; 
                border: 1px solid #cbd5e1; 
                border-radius: 6px; 
                background: #f8fafc;
                text-align: center;
            }
            .stat-value { font-size: 20pt; font-weight: bold; color: #164e63; display: block; }
            .stat-label { font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-top: 5px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9pt; }
            th { background: #164e63; color: white; text-align: left; padding: 8px 10px; font-weight: 600; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; color: #334155; vertical-align: top; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            .footer {
                position: absolute;
                bottom: 10mm;
                left: 20mm;
                right: 20mm;
                text-align: center;
                font-size: 8pt;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
            }
        </style>
    </head>
    <body onload="window.print()">
        <!-- PAGE 1: COVER -->
        <div class="page cover-page">
            <img src="/logo.png" class="logo" alt="Emlak Katılım Logo" onerror="this.style.display='none'; document.write('<h1 style=\\'font-size:30pt; color:#164e63\\'>EMLAK KATILIM</h1>')">
            <div class="report-title">TEFTİŞ KURULU BAŞKANLIĞI</div>
            <div class="report-subtitle">${year} YILI FAALİYET RAPORU</div>
            <div class="report-meta">
                <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
                <p>Rapor Numarası: FR-${year}-001</p>
                <p>Gizlilik Derecesi: <strong>HİZMETE ÖZEL</strong></p>
            </div>
        </div>

        <!-- PAGE 2 -->
        <div class="page">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">
                <div style="color: #164e63; font-weight: bold; font-size: 14pt;">EMLAK KATILIM</div>
                <div style="color: #64748b; font-size: 9pt;">${year} Faaliyet Raporu</div>
            </div>

            <h1>1. Yönetici Özeti</h1>
            <p>${year} yılı içerisinde toplam <strong>${audits.length}</strong> adet denetim faaliyeti gerçekleştirilmiştir. Bu denetimlerde toplam <strong>${findings.length}</strong> adet bulgu tespit edilmiştir.</p>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <span class="stat-value">${audits.length}</span>
                    <span class="stat-label">Toplam Denetim</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value">${findings.length}</span>
                    <span class="stat-label">Toplam Bulgu</span>
                </div>
                 <div class="stat-box">
                    <span class="stat-value" style="color: #dc2626;">${findings.filter(f => f.risk === 'Kritik').length}</span>
                    <span class="stat-label">Kritik Risk</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value" style="color: #ea580c;">${findings.filter(f => f.risk === 'Yüksek').length}</span>
                    <span class="stat-label">Yüksek Risk</span>
                </div>
            </div>

            <h1>2. Denetim Faaliyetleri</h1>
            <table>
                <thead>
                    <tr>
                        <th style="width: 35%;">Denetim Adı</th>
                        <th style="width: 15%;">Tür</th>
                        <th style="width: 25%;">Denetim Ekibi</th>
                        <th style="width: 15%;">Tarih</th>
                        <th style="width: 10%;">Durum</th>
                    </tr>
                </thead>
                <tbody>
                    ${audits.map(a => `
                        <tr>
                            <td><strong>${a.title}</strong><br><span style="font-size:8pt; color:#64748b;">${a.auditCode || '-'}</span></td>
                            <td>${a.type}</td>
                            <td>${a.team}</td>
                            <td>${formatDate(a.startDate)}</td>
                            <td>${a.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">Sayfa 2</div>
        </div>

        <!-- PAGE 3 -->
        <div class="page">
           <h1>3. İnsan Kaynakları ve Eğitim</h1>
           <p>Teftiş Kurulu'nun mesleki yetkinliğini artırmak amacıyla ${year} yılında aşağıdaki eğitim faaliyetleri gerçekleştirilmiştir.</p>
            <table>
                <thead>
                    <tr>
                        <th>Eğitim Konusu</th>
                        <th>Türü</th>
                        <th>Sağlayıcı</th>
                        <th>Katılımcılar</th>
                        <th style="text-align:center;">Süre</th>
                    </tr>
                </thead>
                <tbody>
                     ${trainings.map(t => `
                        <tr>
                            <td>${t.title}</td>
                            <td>${t.type}</td>
                            <td>${t.provider}</td>
                            <td>${t.participants.join(', ')}</td>
                            <td style="text-align:center;">${t.duration} Saat</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h1>4. Etik Hattı</h1>
            <p>Yıl içerisinde toplam <strong>${ethics.length}</strong> etik bildirimi alınmıştır.</p>
            <table style="width: 50%;">
                <thead><tr><th>Konu Başlığı</th><th>Adet</th></tr></thead>
                 <tbody>
                    ${Object.entries(ethics.reduce((acc, e) => { acc[e.subject] = (acc[e.subject] || 0) + 1; return acc; }, {})).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
                </tbody>
            </table>

            <div class="footer">Sayfa 3</div>
        </div>
    </body>
    </html>
    `;

    const popup = window.open('', '_blank');
    popup.document.write(reportHTML);
    popup.document.close();
};

// Sidebar Injection for Activity Report
// Sidebar injection removed (Added to index.html manually)

// ============================================
// AI SUGGESTION PANEL & ANALYSIS FUNCTIONS
// ============================================

// AI Suggestion Panel Initialization
function initAiSuggestionPanel() {
    // Check if panel already exists
    if (document.getElementById('ai-suggestion-panel')) return;

    const panelHTML = `
        <div id="ai-suggestion-panel" style="
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 380px;
            max-height: 520px;
            background: var(--white, #ffffff);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 156, 69, 0.1);
            z-index: 9999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--font-family, 'Poppins', sans-serif);
        ">
            <div style="
                padding: 14px 18px;
                background: linear-gradient(135deg, #009c45 0%, #007a36 100%);
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        width: 36px;
                        height: 36px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i data-lucide="sparkles" style="width: 20px; height: 20px; color: white;"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600; color: white; font-size: 15px;">AI Asistan</div>
                        <div id="ai-status-text" style="font-size: 11px; color: rgba(255,255,255,0.85);">Hazır</div>
                    </div>
                </div>
                <button onclick="toggleAiPanel()" style="
                    background: rgba(255,255,255,0.15);
                    border: none;
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                    <i data-lucide="x" style="width: 16px; height: 16px; color: white;"></i>
                </button>
            </div>
            <div id="ai-suggestion-content" style="
                padding: 20px;
                overflow-y: auto;
                flex: 1;
                background: #f9fafb;
                color: var(--text-main, #111827);
                font-size: 13px;
                line-height: 1.7;
            ">
                <div style="text-align: center; padding: 40px 20px; color: var(--text-light, #6b7280);">
                    <div style="
                        width: 56px; 
                        height: 56px; 
                        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                    ">
                        <i data-lucide="message-circle" style="width: 28px; height: 28px; color: #009c45;"></i>
                    </div>
                    <p style="font-size: 14px; font-weight: 500; margin: 0;">Bulgu yazarken AI önerileri burada görünecek</p>
                    <p style="font-size: 12px; margin-top: 8px; opacity: 0.7;">İçerik yazdıkça otomatik analiz başlar</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Toggle AI Panel visibility
window.toggleAiPanel = function () {
    const panel = document.getElementById('ai-suggestion-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    }
};

// Show AI Panel
function showAiPanel() {
    const panel = document.getElementById('ai-suggestion-panel');
    if (panel) {
        panel.style.display = 'flex';
    }
}

// Check AI Service Status
function checkAiStatus() {
    const statusText = document.getElementById('ai-status-text');
    if (statusText) {
        statusText.textContent = 'Bağlantı kontrol ediliyor...';
    }

    fetch('http://localhost:5500/ai/status', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            if (statusText) {
                statusText.textContent = data.status === 'ok' ? '✓ Bağlı' : '✗ Bağlantı yok';
                statusText.style.color = data.status === 'ok' ? '#4ade80' : '#f87171';
            }
        })
        .catch(() => {
            if (statusText) {
                statusText.textContent = '✗ Backend bağlantısı yok';
                statusText.style.color = '#f87171';
            }
        });
}

// CRITICAL KEYWORDS - These alone trigger Kritik (fraud, money laundering, etc.)
const CRITICAL_KEYWORDS = [
    'zimmet', 'dolandırıcılık', 'yolsuzluk', 'rüşvet', 'kara para',
    'aklama', 'terör', 'yaptırım', 'ambargo', 'sahtecilik', 'suistimal'
];

// CONTEXT_SENSITIVE_KEYWORDS - These trigger Kritik when combined with negative context
const CONTEXT_KEYWORDS = ['imza', 'sözleşme', 'uyuşmuyor', 'uyuşmazlık', 'usulsüzlük', 'onay', 'belge', 'evrak'];

// NEGATIVE_CONTEXT - Words that indicate a problem/issue
const NEGATIVE_CONTEXT = [
    'eksik', 'yok', 'hatalı', 'geçersiz', 'sahte', 'bulunmuyor', 'uyumsuz',
    'ihlal', 'usulsüz', 'aykırı', 'atmamış', 'atmadı', 'yapılmamış', 'yapılmadı',
    'alınmamış', 'alınmadı', 'verilmemiş', 'verilmedi', 'olmadan', 'olmaksızın',
    'mevcut değil', 'bulunamadı', 'bulunmamakta', 'tespit edilemedi', 'kayıp',
    'müşteri atmamış', 'imzasız', 'onaysız', 'yetkisiz', 'izinsiz'
];

// Smart Kritik detection - considers context
function containsCriticalKeyword(text) {
    if (!text) return { isCritical: false, keyword: null, reason: null };
    const lowerText = text.toLowerCase();

    // 1. Check absolute critical keywords (always trigger)
    for (const keyword of CRITICAL_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            return { isCritical: true, keyword, reason: 'Kritik anahtar kelime tespit edildi' };
        }
    }

    // 2. Check context-sensitive keywords (need negative context)
    for (const keyword of CONTEXT_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            // Check if negative context exists
            const hasNegativeContext = NEGATIVE_CONTEXT.some(neg => lowerText.includes(neg.toLowerCase()));
            if (hasNegativeContext) {
                const foundNegative = NEGATIVE_CONTEXT.find(neg => lowerText.includes(neg.toLowerCase()));
                return {
                    isCritical: true,
                    keyword,
                    reason: `"${keyword}" ile birlikte "${foundNegative}" bağlamında tespit edildi`
                };
            }
        }
    }

    return { isCritical: false, keyword: null, reason: null };
}

// AI Analysis Function
function analyzeWithAi(title, content) {
    const contentDiv = document.getElementById('ai-suggestion-content');
    if (!contentDiv) return;

    showAiPanel();

    // Show loading state
    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 30px 0;">
            <div style="
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255,255,255,0.1);
                border-top-color: #818cf8;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            "></div>
            <p style="color: #94a3b8;">AI analiz ediyor...</p>
        </div>
    `;

    // Check for critical keywords FIRST (Frontend override - now context-aware)
    const combinedText = (title + ' ' + content);
    const criticalResult = containsCriticalKeyword(combinedText);

    // Make API call
    fetch('http://localhost:5500/ai/analyze-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingTitle: title, findingContent: content })
    })
        .then(response => response.json())
        .then(result => {
            // CRITICAL: Override risk if critical keyword found with context
            if (criticalResult.isCritical) {
                result.suggestedRiskLevel = 'Kritik';
                result.riskReason = criticalResult.reason;
            }

            displayAiResult(result, criticalResult.isCritical, criticalResult.keyword);
        })
        .catch(error => {
            console.error('AI Analysis Error:', error);

            // Even on error, show critical keyword warning if applicable
            if (criticalResult.isCritical) {
                contentDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, var(--danger-light, #fef2f2), #fff5f5); padding: 20px; border-radius: 16px; margin-bottom: 16px; border: 1px solid var(--danger, #ef4444); box-shadow: 0 4px 12px rgba(239,68,68,0.15);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <div style="background: var(--danger, #ef4444); padding: 8px; border-radius: 10px;">
                            <i data-lucide="alert-triangle" style="width: 18px; height: 18px; color: white;"></i>
                        </div>
                        <span style="font-weight: 700; color: var(--danger, #ef4444); font-size: 14px;">KRİTİK BULGU TESPİTİ</span>
                    </div>
                    <p style="color: #991b1b; font-size: 13px; margin: 0;">"${criticalResult.keyword}" ${criticalResult.reason}</p>
                </div>
                <div style="background: var(--bg-secondary, #f9fafb); padding: 16px; border-radius: 12px; color: var(--text-secondary, #6b7280); font-size: 13px; border: 1px solid var(--border, #e5e7eb);">
                    <p style="margin: 0;"><i data-lucide="info" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 6px;"></i>AI servisi şu an yanıt vermiyor. Kritik kelime tespiti frontend tarafından yapıldı.</p>
                </div>
            `;
            } else {
                contentDiv.innerHTML = `
                <div style="background: var(--bg-secondary, #f9fafb); padding: 24px; border-radius: 16px; text-align: center; border: 1px solid var(--border, #e5e7eb);">
                    <div style="background: var(--warning-light, #fef3c7); padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 12px;">
                        <i data-lucide="wifi-off" style="width: 24px; height: 24px; color: var(--warning, #f59e0b);"></i>
                    </div>
                    <p style="color: var(--text-secondary, #6b7280); font-size: 14px; margin: 0;">AI servisi şu an kullanılamıyor.<br><span style="font-size: 12px;">Backend bağlantısını kontrol edin.</span></p>
                </div>
            `;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
}

// Display AI Analysis Result - LIGHT THEME with full analysis
function displayAiResult(result, hasCriticalKeyword = false, foundKeyword = null) {
    const contentDiv = document.getElementById('ai-suggestion-content');
    if (!contentDiv) return;

    // Light theme risk colors
    const riskColors = {
        'Kritik': { bg: '#fef2f2', text: '#991b1b', border: '#dc2626', icon: 'alert-triangle' },
        'Yüksek': { bg: '#fff7ed', text: '#9a3412', border: '#ea580c', icon: 'alert-circle' },
        'Orta': { bg: '#fefce8', text: '#854d0e', border: '#ca8a04', icon: 'info' },
        'Düşük': { bg: '#f0fdf4', text: '#166534', border: '#16a34a', icon: 'check-circle' }
    };

    const risk = result.suggestedRiskLevel || result.riskLevel || 'Orta';
    const colors = riskColors[risk] || riskColors['Orta'];

    let html = '';

    // AI Status Indicator at top
    html += `
        <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f0fdf4; border-radius: 8px; margin-bottom: 16px; border: 1px solid #86efac;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></div>
            <span style="font-size: 12px; color: #166534; font-weight: 500;">AI Aktif - Analiz Tamamlandı</span>
        </div>
    `;

    // Critical keyword warning if found
    if (hasCriticalKeyword) {
        html += `
            <div style="background: #fef2f2; padding: 14px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #dc2626;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <i data-lucide="alert-triangle" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    <span style="font-weight: 700; color: #991b1b; font-size: 13px;">KRİTİK BULGU TESPİTİ</span>
                </div>
                <p style="color: #b91c1c; font-size: 12px; margin: 0;">"${foundKeyword}" kelimesi nedeniyle risk <strong>Kritik</strong> seviyeye yükseltildi.</p>
            </div>
        `;
    }

    // 1. RISK LEVEL with DETAILED REASONING
    html += `
        <div style="background: ${colors.bg}; padding: 16px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid ${colors.border};">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="${colors.icon}" style="width: 20px; height: 20px; color: ${colors.border};"></i>
                    <span style="font-size: 13px; color: ${colors.text}; font-weight: 600;">Risk Seviyesi</span>
                </div>
                <span style="background: ${colors.border}; color: white; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">${risk}</span>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; margin-top: 8px;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">📝 GEREKÇE:</div>
                <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.5;">${result.riskReason || 'Gerekçe belirtilmedi - AI analizi için Ollama servisinin çalıştığından emin olun.'}</p>
            </div>
        </div>
    `;

    // 2. TITLE SUGGESTION
    if (result.titleSuggestion) {
        html += `
            <div style="background: #eff6ff; padding: 14px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #bfdbfe;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <i data-lucide="edit-3" style="width: 16px; height: 16px; color: #2563eb;"></i>
                    <span style="font-size: 13px; color: #1e40af; font-weight: 600;">Başlık Önerisi</span>
                </div>
                <div style="background: white; padding: 10px 12px; border-radius: 8px; color: #1e3a8a; font-size: 13px;">
                    ${result.titleSuggestion}
                </div>
                <button onclick="copyToClipboard('${result.titleSuggestion.replace(/'/g, "\\'")}', this)" 
                    style="margin-top: 8px; background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer;">
                    Kopyala
                </button>
            </div>
        `;
    }

    // 3. CONTENT SUGGESTIONS
    if (result.contentSuggestions && result.contentSuggestions.length > 0) {
        html += `
            <div style="background: #faf5ff; padding: 14px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e9d5ff;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <i data-lucide="lightbulb" style="width: 16px; height: 16px; color: #7c3aed;"></i>
                    <span style="font-size: 13px; color: #5b21b6; font-weight: 600;">İçerik İyileştirme Önerileri</span>
                </div>
                ${result.contentSuggestions.map((sug, i) => `
                    <div style="display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; background: white; border-radius: 8px; margin-bottom: 6px;">
                        <span style="background: #7c3aed; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;">${i + 1}</span>
                        <span style="color: #4c1d95; font-size: 12px; line-height: 1.5;">${sug}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 4. DAYANAK/CRITERIA SUGGESTIONS
    if (result.suggestedCriteria && result.suggestedCriteria.length > 0) {
        html += `
            <div style="background: #ecfdf5; padding: 14px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #a7f3d0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <i data-lucide="book-open" style="width: 16px; height: 16px; color: #059669;"></i>
                    <span style="font-size: 13px; color: #047857; font-weight: 600;">Önerilen Dayanaklar</span>
                </div>
                ${result.suggestedCriteria.map(crit => `
                    <div style="background: white; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #10b981;">
                        <div style="font-size: 12px; color: #065f46; line-height: 1.5;">${crit.text || crit}</div>
                        ${crit.source ? `<div style="font-size: 10px; color: #6b7280; margin-top: 4px;">📚 Kaynak: ${crit.source}</div>` : ''}
                        <button onclick="copyToClipboard('${String(crit.text || crit).replace(/'/g, "\\'")}', this)" 
                            style="margin-top: 6px; background: #059669; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 10px; cursor: pointer;">
                            Kopyala
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 5. GENERAL NOTES
    if (result.generalNotes) {
        html += `
            <div style="background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i data-lucide="message-circle" style="width: 16px; height: 16px; color: #64748b;"></i>
                    <span style="font-size: 13px; color: #475569; font-weight: 600;">Genel Notlar</span>
                </div>
                <p style="color: #334155; font-size: 12px; margin: 0; line-height: 1.5;">${result.generalNotes}</p>
            </div>
        `;
    }

    // If no detailed analysis available
    if (!result.riskReason && !result.titleSuggestion && !result.contentSuggestions && !result.suggestedCriteria) {
        html += `
            <div style="background: #fef3c7; padding: 14px; border-radius: 12px; border: 1px solid #fcd34d;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i data-lucide="alert-circle" style="width: 16px; height: 16px; color: #b45309;"></i>
                    <span style="font-size: 13px; color: #92400e; font-weight: 600;">Detaylı Analiz Yapılamadı</span>
                </div>
                <p style="color: #78350f; font-size: 12px; margin: 0;">
                    AI servisi (Ollama) çalışmıyor veya yanıt vermiyor. Detaylı analiz için:<br>
                    <code style="background: #fef9c3; padding: 2px 6px; border-radius: 4px; font-size: 11px;">ollama serve</code> komutu ile Ollama'yı başlatın.
                </p>
            </div>
        `;
    }

    // Add pulse animation
    html += `<style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }</style>`;

    contentDiv.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Kopyala fonksiyonu
window.copyToClipboard = function (text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Kopyalandı!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#fbbf24';
        }, 1500);
    });
};

// Add spin animation style
const aiStyle = document.createElement('style');
aiStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(aiStyle);

// Trigger AI Analysis when writing findings
let aiDebounceTimer;
window.triggerAiAnalysis = function () {
    const titleInput = document.getElementById('finding-title-input');
    const contentInput = document.getElementById('finding-content-input');

    const title = titleInput?.value || '';
    const content = contentInput?.value || '';

    // En az 10 karakter olmalı
    if (title.length + content.length < 10) return;

    // Debounce to prevent flickering and excessive API calls
    clearTimeout(aiDebounceTimer);
    aiDebounceTimer = setTimeout(() => {
        initAiSuggestionPanel();
        analyzeWithAi(title, content);
    }, 1500); // 1.5s delay
};

// Initialize AI panel on load
setTimeout(() => {
    initAiSuggestionPanel();
    checkAiStatus();
}, 1000);

// ============================================
// EDUCATION RENDER FUNCTION
// ============================================
function renderEducation() {
    const trainings = state.trainings || [];

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0;">Eğitim Faaliyetleri</h2>
                <button class="btn btn-primary" onclick="openAddTrainingModal()">
                    <i data-lucide="plus" style="width: 16px;"></i> Eğitim Ekle
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                ${trainings.length > 0 ? trainings.map(t => `
                    <div class="card" style="border: 1px solid var(--border); margin: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0 0 0.5rem 0;">${t.title}</h4>
                                <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${t.type}</span>
                            </div>
                        </div>
                        <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-light);">
                            <div><strong>Sağlayıcı:</strong> ${t.provider}</div>
                            <div><strong>Tarih:</strong> ${formatDate(t.date)}</div>
                            <div><strong>Süre:</strong> ${t.duration} Saat</div>
                            <div><strong>Katılımcılar:</strong> ${Array.isArray(t.participants) ? t.participants.join(', ') : t.participants}</div>
                            ${t.cost > 0 ? `<div><strong>Maliyet:</strong> ${formatCurrency(t.cost)}</div>` : ''}
                        </div>
                    </div>
                `).join('') : '<p style="color: var(--text-light); grid-column: 1/-1; text-align: center; padding: 2rem;">Henüz eğitim kaydı bulunmuyor.</p>'}
            </div>
        </div>
    `;

    lucide.createIcons();
}

// ============================================
// DOCUMENTS RENDER FUNCTION
// ============================================
function renderDocuments(category) {
    const categoryTitles = {
        'audit': 'Teftiş Kurulu Dokümanları',
        'other': 'Diğer Birim Dokümanları',
        'legislation': 'Mevzuat'
    };

    const categoryDescriptions = {
        'audit': 'Teftiş Kurulu tarafından hazırlanan prosedür, yönetmelik ve dokümanlar.',
        'other': 'Diğer birimlerden gelen ve denetim süreçlerinde kullanılan dokümanlar.',
        'legislation': 'Yürürlükteki kanun, yönetmelik ve mevzuat dokümanları.'
    };

    // TODO: Backend API'den dokümanları çek
    // fetch('http://localhost:5500/documents?category=' + category)

    const documents = state.documents?.filter(d => d.category === category) || [];

    mainView.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <h2 style="margin: 0;">${categoryTitles[category] || 'Dokümanlar'}</h2>
                    <p style="color: var(--text-light); font-size: 0.85rem; margin: 0.5rem 0 0 0;">${categoryDescriptions[category] || ''}</p>
                </div>
                <button class="btn btn-primary" onclick="openUploadDocumentModal('${category}')">
                    <i data-lucide="upload" style="width: 16px;"></i> Doküman Yükle
                </button>
            </div>
            
            <div style="margin-top: 1.5rem;">
                ${documents.length > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Doküman Adı</th>
                                <th>Tür</th>
                                <th>Yüklenme Tarihi</th>
                                <th>Yükleyen</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${documents.map(doc => `
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <i data-lucide="file-text" style="width: 16px; color: var(--primary);"></i>
                                            ${doc.name}
                                        </div>
                                    </td>
                                    <td>${doc.type || '-'}</td>
                                    <td>${formatDate(doc.uploadDate)}</td>
                                    <td>${doc.uploadedBy || '-'}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="viewDocument('${doc.id}')">
                                            <i data-lucide="eye" style="width: 14px;"></i>
                                        </button>
                                        <button class="btn btn-secondary btn-sm" onclick="downloadDocument('${doc.id}')">
                                            <i data-lucide="download" style="width: 14px;"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div style="text-align: center; padding: 3rem; background: #f9fafb; border-radius: 8px;">
                        <i data-lucide="folder-open" style="width: 48px; height: 48px; color: #9ca3af; margin-bottom: 1rem;"></i>
                        <p style="color: var(--text-light); margin: 0;">Bu kategoride henüz doküman bulunmuyor.</p>
                    </div>
                `}
            </div>
        </div>
    `;

    lucide.createIcons();
}

// Document helper functions
window.openUploadDocumentModal = function (category) {
    showToast('Doküman yükleme özelliği yakında aktif olacak.', 'info');
};

window.viewDocument = function (docId) {
    showToast('Doküman görüntüleme özelliği yakında aktif olacak.', 'info');
};

window.downloadDocument = function (docId) {
    showToast('Doküman indirme özelliği yakında aktif olacak.', 'info');
};

// Open Add Training Modal
window.openAddTrainingModal = function () {
    // Reset form generic approach if IDs vary, but assuming specific ID from context or just leave it for now
    // Populate participant list
    const participantList = document.getElementById('education-participant-list');
    if (participantList && state.staff) {
        participantList.innerHTML = state.staff.map(s => `
            <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
                <input type="checkbox" name="participants" value="${s.name}" id="p-${s.id}" style="margin-right: 0.5rem;">
                <label for="p-${s.id}">${s.name}</label>
            </div>
        `).join('');
    }

    openModal('education-modal');
};

window.handleEducationSubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const educationId = formData.get('id');
    const isEdit = educationId && educationId.trim() !== '';

    // Get selected participants
    const selectedParticipants = [];
    form.querySelectorAll('input[name="participants"]:checked').forEach(cb => {
        selectedParticipants.push(cb.value);
    });

    const educationData = {
        id: isEdit ? educationId : Date.now().toString(),
        title: formData.get('title'),
        instructor: formData.get('instructor'),
        date: formData.get('date'),
        endDate: formData.get('endDate'),
        duration: formData.get('duration'),
        location: formData.get('location'),
        description: formData.get('description'),
        status: formData.get('status') || 'Planlandı',
        participants: selectedParticipants, // Use multiselect array
        createdAt: new Date().toISOString()
    };

    if (isEdit) {
        if (state.trainings) {
            state.trainings = state.trainings.map(t => t.id === educationId ? educationData : t);
        }
    } else {
        if (!state.trainings) state.trainings = [];
        state.trainings.push(educationData);
    }

    if (typeof renderEducation === 'function') renderEducation();
    if (typeof saveDataToAPI === 'function') saveDataToAPI();
    if (typeof closeModal === 'function') closeModal('education-modal');
    if (typeof showToast === 'function') showToast(`Eğitim başarıyla ${isEdit ? 'güncellendi' : 'eklendi'}.`, 'success');
};

// DATABASE INTEGRATION (Backend API)
// ============================================

// API Base URL
const API_BASE_URL = 'http://localhost:5500';

// Generic API fetch helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        // Fallback to localStorage
        return null;
    }
}

// Load data from API with localStorage fallback
async function loadDataFromAPI() {
    try {
        // Try to fetch from backend
        const apiData = await apiRequest('/audit/data');

        if (apiData) {
            // Merge with current state
            Object.assign(state, apiData);
            console.log('Data loaded from API');
            return true;
        }
    } catch (error) {
        console.log('API not available, using localStorage');
    }

    // Fallback to localStorage
    const localData = loadFromStorage();
    if (localData) {
        Object.assign(state, localData);
        console.log('Data loaded from localStorage');
    }
    return false;
}

// Save data to API with localStorage backup
async function saveDataToAPI() {
    // Always save to localStorage as backup
    saveToStorage();

    try {
        await apiRequest('/audit/data', 'POST', state);
        console.log('Data saved to API');
    } catch (error) {
        console.log('API save failed, data saved to localStorage only');
    }
}

// ============================================
// PAGE INITIALIZATION - DOMContentLoaded
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    console.log("📄 DOMContentLoaded - Audit Module Initializing...");

    // Verify state has data
    console.log("📊 State contains:", state.audits?.length || 0, "audits,", state.findings?.length || 0, "findings");

    // If state is empty, try loading again from localStorage
    if ((!state.audits || state.audits.length === 0) && (!state.findings || state.findings.length === 0)) {
        console.log("⚠️ State appears empty, reloading from localStorage...");
        const freshData = loadFromStorage();
        if (freshData) {
            if (freshData.audits) state.audits = freshData.audits;
            if (freshData.findings) state.findings = freshData.findings;
            if (freshData.deletedAudits) state.deletedAudits = freshData.deletedAudits;
            if (freshData.deletedFindings) state.deletedFindings = freshData.deletedFindings;
            if (freshData.ethicsReports) state.ethicsReports = freshData.ethicsReports;
            if (freshData.logs) state.logs = freshData.logs;
            if (freshData.auditPlans) state.auditPlans = freshData.auditPlans;
            if (freshData.staff) state.staff = freshData.staff;
            console.log("✅ Data reloaded:", state.audits?.length || 0, "audits,", state.findings?.length || 0, "findings");
        }
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Render initial page (dashboard)
    if (typeof renderPage === 'function') {
        renderPage('dashboard');
        console.log("✅ Dashboard rendered");
    } else if (typeof renderDashboard === 'function') {
        renderDashboard();
        console.log("✅ Dashboard rendered via renderDashboard");
    }

    // Update trash count badge
    if (typeof updateTrashCount === 'function') {
        updateTrashCount();
    }

    console.log("✅ Audit Module Initialization Complete!");
});

console.log("🚀 APP.JS YÜKLEME TAMAMLANDI");
// Update user display in header
function updateUserDisplay() {
    const displayNameEl = document.getElementById('user-display-name');
    const usernameEl = document.getElementById('user-username');

    if (displayNameEl && state.currentUser) {
        displayNameEl.textContent = state.currentUser.displayName || 'Kullanıcı';
    }
    if (usernameEl && state.currentUser) {
        usernameEl.textContent = state.currentUser.username || 'user';
    }
    console.log("👤 User display updated:", state.currentUser?.displayName);
}

// Call immediately if state exists
if (typeof state !== 'undefined' && state.currentUser) {
    updateUserDisplay();
}
// AUDIT PLAN VALIDATION & LOGGING
// Add these functions to app.js

// Validate plan before approval
function validatePlanApproval(plan) {
    const planAudits = state.audits.filter(a => a.planId === plan.id);
    if (!planAudits || planAudits.length === 0) {
        showToast('Denetim planını onaylamak için en az bir denetim eklemelisiniz!', 'error');
        return false;
    }
    return true;
}

// Log activity report creation to audit logs
function logActivityReport(reportData) {
    addLog(
        'Faaliyet Raporu Oluşturuldu',
        `${reportData.period} dönemi faaliyet raporu oluşturuldu`,
        'ActivityReport',
        reportData.id
    );
}

// Add to plan approval handler
window.handlePlanApproval = function (planId) {
    const plan = state.auditPlans?.find(p => p.id === planId);
    if (!plan) return;

    if (!validatePlanApproval(plan)) {
        return; // Validation failed
    }

    // Proceed with approval
    plan.status = 'Onaylandı';
    saveToStorage();
    addLog('Plan Onaylandı', `"${plan.title}" planı onaylandı`, 'AuditPlan', planId);
    showToast('Plan başarıyla onaylandı', 'success');
    renderAuditPlans();
};

console.log("✅ Plan validation & activity logging functions added");
// DEBUGGING: Data Loss Tracker
// Add to app.js after saveToStorage function

const originalSaveToStorage = saveToStorage;
window.saveToStorage = function () {
    console.log("💾 SAVE:", state.audits?.length, "audits,", state.findings?.length, "findings");
    console.trace("Called from:");
    return originalSaveToStorage();
};

// Watch state.audits for changes
let auditCount = state.audits?.length || 0;
setInterval(() => {
    if (state.audits?.length !== auditCount) {
        console.log("⚠️ AUDITS CHANGED:", auditCount, "→", state.audits?.length);
        console.trace("Stack:");
        auditCount = state.audits?.length;
    }
}, 500);

console.log("🔍 Data loss debugger active");
