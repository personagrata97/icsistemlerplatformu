export const TERMS = {
    birimAdi: 'Teftiş Kurulu Müdürlüğü',
    birimKisa: 'Teftiş Kurulu',
    mufettis: 'Müfettiş',
    denetci: 'Denetçi',
    gozetimSorumlusu: 'Gözetim Sorumlusu',
    denetlenenBirim: 'Denetlenen Birim',
    uyumGorevlisi: 'Uyum Görevlisi',
    platform: 'Pharos Platformu',
    auditModule: 'Pharos Audit',
    riskModule: 'Pharos Risk',
    sanctionModule: 'Pharos Sanction',
    adminModule: 'Pharos Admin',
    controlModule: 'Pharos Control',
    auditModuleDescription: 'Denetim evrenini yönetin; risk esaslı yıllık planı kurun, saha çalışmasını ve çalışma kâğıtlarını yürütün, örneklem alın, bulguları birimlerle uzlaştırın, aksiyonları izleyin ve kurul raporlarını üretin.',
    riskModuleDescription: 'Mevzuat limitlerini ve finansal oranları sürekli izleyin; erken uyarı üretin, senaryo ve stres testi çalıştırın, BDDK cetvellerini hazırlayın.',
    sanctionModuleDescription: 'Yaptırım ve dondurma listelerini otomatik güncelleyin; müşteri portföyünü tarayın, eşleşmeleri karara bağlayın, şüpheli işlem bildirimlerini yönetin.',
    adminModuleDescription: 'Kullanıcı, rol ve yetkileri yönetin; organizasyon yapısını, bildirim ve sistem parametrelerini tanımlayın.',
    controlModuleDescription: 'Kontrol envanterini tutun, birim öz değerlendirmelerini yürütün, kontrol testlerini planlayın ve kontrol etkinliğini raporlayın.',
};

export const MODULE_TERMS = {
    audit: {
        birim: 'Teftiş Kurulu Başkanlığı',
        birimKisa: 'Teftiş Kurulu',
        unvanlar: ['Müfettiş Yardımcısı', 'Müfettiş', 'Başmüfettiş'],
        yoneticiUnvani: 'Teftiş Kurulu Müdürü',
        gozetimUnvani: 'Gözetim Sorumlusu',
        tespitAdi: 'Bulgu',
        calismaBirimi: 'Denetim',
        evren: 'Denetim Evreni',
        kanit: 'Çalışma Kâğıdı',
        plan: 'Yıllık Denetim Planı'
    },
    control: {
        birim: 'İç Kontrol Müdürlüğü',
        birimKisa: 'İç Kontrol',
        unvanlar: ['Denetçi Yardımcısı', 'Yetkili Denetçi Yardımcısı', 'Denetçi', 'Başdenetçi'],
        yoneticiUnvani: 'İç Kontrol Müdürü',
        gozetimUnvani: 'Gözetim Sorumlusu',
        tespitAdi: 'Kontrol Eksikliği',
        calismaBirimi: 'Kontrol Testi',
        evren: 'Kontrol Envanteri',
        kanit: 'Test Kanıtı',
        plan: 'Yıllık Kontrol Programı'
    },
    risk: {
        birim: 'Risk Yönetimi Müdürlüğü',
        birimKisa: 'Risk Yönetimi',
        unvanlar: ['Risk Yönetimi Uzman Yardımcısı', 'Risk Yönetimi Uzmanı', 'Risk Yönetimi Yönetmen Yardımcısı', 'Risk Yönetimi Yönetmeni'],
        yoneticiUnvani: 'Risk Yönetimi Müdürü',
        gozetimUnvani: 'Gözetim Sorumlusu',
        tespitAdi: 'Limit Aşımı',
        calismaBirimi: 'İzleme Dönemi',
        evren: 'Risk Envanteri',
        kanit: 'Veri Seti',
        plan: 'İzleme Takvimi'
    }
};
