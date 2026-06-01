export const ORGANIZATION_STRUCTURE = {
    "Yönetim Kurulu": [
        "Teftiş Kurulu Müdürlüğü",
        "İç Kontrol ve Uyum Müdürlüğü",
        "Risk Yönetimi Müdürlüğü"
    ],
    "Genel Müdür": [],
    "Hazine ve Mali İşler Genel Müdür Yardımcılığı": [
        "Mali İşler Direktörlüğü",
        "Muhasebe Servisi",
        "Bütçe ve Raporlama Servisi",
        "Finans Servisi"
    ],
    "Operasyon Genel Müdür Yardımcılığı": [
        "Operasyon Direktörlüğü",
        "Operasyon Servisi",
        "Tahsisat Servisi"
    ],
    "Satış ve Pazarlama Genel Müdür Yardımcılığı": [
        "Satış ve Pazarlama Direktörlüğü",
        "Satış ve Pazarlama Müdürlüğü",
        "Şubeler",
        "Satış Servisi",
        "CRM ve Performans Servisi"
    ],
    "Bilgi Teknolojileri": [
        "Bilgi Teknolojileri Servisi"
    ]
};

export const DEPARTMENTS = [
    // BOARD
    "Teftiş Kurulu Müdürlüğü",
    "İç Kontrol ve Uyum Müdürlüğü",
    "Risk Yönetimi Müdürlüğü",

    // TREASURY & FINANCE
    "Hazine ve Mali İşler Genel Müdür Yardımcılığı",
    "Mali İşler Direktörlüğü",
    "Muhasebe Servisi",
    "Bütçe ve Raporlama Servisi",
    "Finans Servisi",

    // OPERATIONS
    "Operasyon Genel Müdür Yardımcılığı",
    "Operasyon Direktörlüğü",
    "Operasyon Servisi",
    "Tahsisat Servisi",

    // SALES & MARKETING
    "Satış ve Pazarlama Genel Müdür Yardımcılığı",
    "Satış ve Pazarlama Direktörlüğü",
    "Satış ve Pazarlama Müdürlüğü",
    "Şubeler",
    "Satış Servisi",
    "CRM ve Performans Servisi",

    // IT
    "Bilgi Teknolojileri Müdürlüğü",
    "Bilgi Teknolojileri Servisi"
];

export const HIERARCHY = [
    {
        id: 'YK',
        title: 'Yönetim Kurulu',
        children: [
            { id: 'TEFTIS_KURULU', title: 'Teftiş Kurulu Müdürlüğü' },
            {
                id: 'IC_KONTROL_UYUM',
                title: 'İç Kontrol ve Uyum Müdürlüğü',
                children: [
                    { id: 'SRV_IC_KONTROL', title: 'İç Kontrol' },
                    { id: 'SRV_UYUM', title: 'Uyum' }
                ]
            },
            { id: 'RISK_YONETIMI', title: 'Risk Yönetimi Müdürlüğü' }
        ]
    },
    {
        id: 'GM',
        title: 'Genel Müdür',
        children: [
            {
                id: 'FINANS',
                title: 'Hazine ve Mali İşler Genel Müdür Yardımcılığı',
                children: [
                    {
                        id: 'DIR_MALI',
                        title: 'Mali İşler Direktörlüğü',
                        children: [
                            { id: 'SRV_MUHASEBE', title: 'Muhasebe Servisi' },
                            { id: 'SRV_BUTCE', title: 'Bütçe ve Raporlama Servisi' },
                            { id: 'SRV_FINANS', title: 'Finans Servisi' }
                        ]
                    }
                ]
            },
            {
                id: 'OPS',
                title: 'Operasyon Genel Müdür Yardımcılığı',
                children: [
                    {
                        id: 'DIR_OPS',
                        title: 'Operasyon Direktörlüğü',
                        children: [
                            { id: 'SRV_OPS', title: 'Operasyon Servisi' },
                            { id: 'SRV_TAHSISAT', title: 'Tahsisat Servisi' }
                        ]
                    }
                ]
            },
            {
                id: 'SALES',
                title: 'Satış ve Pazarlama Genel Müdür Yardımcılığı',
                children: [
                    {
                        id: 'DIR_SALES',
                        title: 'Satış ve Pazarlama Direktörlüğü',
                        children: [
                            {
                                id: 'MGR_SALES',
                                title: 'Satış ve Pazarlama Müdürlüğü',
                                children: [
                                    { id: 'BRANCHES', title: 'Şubeler' },
                                    { id: 'SRV_SALES', title: 'Satış Servisi' },
                                    { id: 'SRV_CRM', title: 'CRM ve Performans Servisi' }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'DIR_IT',
                title: 'Bilgi Teknolojileri Müdürlüğü',
                children: [
                    { id: 'SRV_IT', title: 'Bilgi Teknolojileri Servisi' }
                ]
            }
        ]
    }
];
