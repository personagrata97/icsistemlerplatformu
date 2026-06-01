// Global State
const state = {
    currentPage: 'dashboard',
    scanResults: [], // History of scans
    stats: {
        totalScanned: 0,
        matchesFound: 0,
        lastScanDate: '-'
    },
    currentBulkResults: [], // Store bulk scan results for pagination/export
    currentManualResults: [], // Store manual scan results
    pagination: {
        currentPage: 1,
        itemsPerPage: 10
    },
    // Current User/Operator (MASAK Uyum için)
    currentUser: localStorage.getItem('CURRENT_USER') || null,
    // Active Data Sources (Persisted in LocalStorage)
    activeSources: JSON.parse(localStorage.getItem('ACTIVE_SOURCES')) || {
        UN: true,
        EU: true,
        OFAC: true,
        TR: true, // Resmi Gazete
        MASAK: true
    }
};

// Kullanıcı bilgisini al
function getCurrentUser() {
    return state.currentUser || 'Bilinmeyen Kullanıcı';
}

// Kullanıcı bilgisini ayarla
function setCurrentUser(username) {
    state.currentUser = username;
    localStorage.setItem('CURRENT_USER', username);
    addSystemLog('Kullanıcı girişi', `${username} sisteme giriş yaptı`, 'auth');
}

function toggleSource(source) {
    state.activeSources[source] = !state.activeSources[source];
    localStorage.setItem('ACTIVE_SOURCES', JSON.stringify(state.activeSources));
    console.log(`Source ${source} toggled: ${state.activeSources[source]}`);
}

// Resmi Gazete MASAK Otomatik Tarama
const RG_KEYWORDS = ['malvarlığı dondurma', 'malvarlıklarının dondurulması', '6415', '7262', 'terörizmin finansmanı', 'masak'];

async function scanResmiGazete() {
    try {
        // CORS proxy kullanarak Resmi Gazete'yi tara
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = encodeURIComponent('https://www.resmigazete.gov.tr/default.aspx');

        const response = await fetch(proxyUrl + targetUrl);
        if (!response.ok) throw new Error('Fetch failed');

        const html = await response.text();

        // Tarih ve sayı çıkar
        const dateMatch = html.match(/(\d{2})\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})\s+Tarihli/i);
        const numberMatch = html.match(/(\d+)\s+Sayılı\s+Resmî\s+Gazete/i);

        const gazetteDate = dateMatch ? `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}` : 'Bilinmiyor';
        const gazetteNumber = numberMatch ? numberMatch[1] : '-';

        // Karar linklerini bul
        const linkRegex = /<a[^>]+href="([^"]*eskiler[^"]*)"[^>]*>([^<]+)<\/a>/gi;
        const decisions = [];
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            decisions.push({ url: match[1], title: match[2].trim() });
        }

        // MASAK ile ilgili kararları bul
        const foundDecisions = [];
        for (const d of decisions) {
            const titleLower = d.title.toLowerCase();
            for (const kw of RG_KEYWORDS) {
                if (titleLower.includes(kw.toLowerCase())) {
                    foundDecisions.push({ ...d, matched_keyword: kw });
                    break;
                }
            }
        }

        const result = {
            scanned: true,
            scan_time: new Date().toISOString(),
            gazette_date: gazetteDate,
            gazette_number: gazetteNumber,
            total_decisions: decisions.length,
            found_count: foundDecisions.length,
            found_decisions: foundDecisions,
            has_alert: foundDecisions.length > 0
        };

        // LocalStorage'a kaydet
        localStorage.setItem('RG_ALERT_STATUS', JSON.stringify(result));
        window.RG_ALERT_STATUS = result;

        console.log('Resmi Gazete tarandı:', result);
        return result;
    } catch (e) {
        console.error('Resmi Gazete tarama hatası:', e);
        // Hata durumunda eski veriyi kullan
        const cached = localStorage.getItem('RG_ALERT_STATUS');
        if (cached) {
            window.RG_ALERT_STATUS = JSON.parse(cached);
        }
        return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    addDetailsModal();

    // Kullanıcı zaten platformda giriş yapmış, varsayılan kullanıcı ayarla
    if (!state.currentUser) {
        setCurrentUser('Platform Kullanıcısı');
    }

    // Sistem başlatma logu
    addSystemLog('Sistem başlatıldı', `Oturum açıldı - ${new Date().toLocaleString('tr-TR')}`, 'auth');

    // Resmi Gazete'yi otomatik tara (Background)
    scanResmiGazete().then(() => {
        // Eğer hala dashboarddaysak ve yeni veri geldiyse yenile
        if (state.currentPage === 'dashboard') {
            renderPage('dashboard');
        }
    });

    renderPage('dashboard');

    // Load Sanctions Data
    try {
        await SanctionsDB.loadData();
        console.log('Sanctions data loaded');
        addSystemLog('Veri yükleme', 'Yaptırım verileri başarıyla yüklendi', 'general');
        if (state.currentPage === 'dashboard') {
            renderPage('dashboard');
        }
    } catch (e) {
        console.error('Failed to load sanctions data', e);
        addSystemLog('Veri yükleme hatası', `Yaptırım verileri yüklenemedi: ${e.message}`, 'error');
    }
});

// --- Navigation & Routing ---
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NAVIGATE') {
        console.log('External navigation request:', event.data.page);
        // Special case for Sanction app which uses renderPage directly in some places or updates active link
        // We should use the click simulation or direct render
        renderPage(event.data.page);
    }
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) {
                // Cross-App Navigation
                // Removed incorrect dashboard redirect

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Render page
                renderPage(page);
            }
        });
    });
}

function renderPage(page) {
    state.currentPage = page;
    const mainView = document.getElementById('main-view');
    const pageTitle = document.getElementById('page-title');

    // Update Title
    const titles = {
        'dashboard': 'Genel Bakış',
        'scan': 'Tarama Yap',
        'results': 'Tarama Sonuçları',
        'settings': 'Ayarlar',
        'report': 'Şüpheli İşlem Bildir',
        'reports-admin': 'Bildirim Yönetimi',
        'reports-analytics': 'Bildirim Raporları',
        'activity-log': 'İşlem Geçmişi / Log'
    };
    pageTitle.textContent = titles[page] || 'Uyum Yönetimi';

    // Render Content
    switch (page) {
        case 'dashboard':
            mainView.innerHTML = renderDashboard();
            break;
        case 'scan':
            mainView.innerHTML = renderScanPage();
            break;
        case 'results':
            mainView.innerHTML = renderResultsPage();
            break;
        case 'settings':
            mainView.innerHTML = renderSettingsPage();
            break;
        case 'report':
            mainView.innerHTML = renderReportPage();
            break;
        case 'reports-admin':
            mainView.innerHTML = renderReportsAdminPage();
            break;
        case 'reports-analytics':
            mainView.innerHTML = renderReportsAnalyticsPage();
            break;
        case 'activity-log':
            mainView.innerHTML = renderActivityLogPage();
            break;
        default:
            mainView.innerHTML = '<h1>Sayfa bulunamadı</h1>';
    }

    lucide.createIcons();
    updateActiveLink(page);
}

function updateActiveLink(page) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(l => {
        l.classList.remove('active');
        if (l.dataset.page === page) l.classList.add('active');
    });
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// --- Page Renderers ---

function renderDashboard() {
    const meta = window.SANCTIONS_META || {};
    const sources = meta.sources || { UN: {}, EU: {}, OFAC: {}, TR: {} };
    const decrees = meta.decrees || [];

    // Calculate MASAK Stats
    const masakCount = SanctionsDB.data ? SanctionsDB.data.filter(i => i.list.includes('MASAK')).length : 0;
    const masakLastUpdate = localStorage.getItem('MASAK_LAST_UPDATE') || 'Bilinmiyor';

    // Get Resmi Gazete Alert Status
    const rgAlert = window.RG_ALERT_STATUS || null;
    let rgAlertHtml = '';

    if (rgAlert && rgAlert.scanned) {
        if (rgAlert.has_alert && rgAlert.found_decisions && rgAlert.found_decisions.length > 0) {
            // Alert mode - new MASAK decision found!
            rgAlertHtml = `
                <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; animation: pulse 2s infinite;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="background: #ef4444; color: white; padding: 0.75rem; border-radius: 0.5rem;">
                            <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="color: #dc2626; margin: 0;">⚠️ YENİ MASAK/YAPTIRIM KARARI TESPİT EDİLDİ!</h3>
                            <p style="margin: 0.25rem 0; font-size: 0.9rem; color: #7f1d1d;">
                                Resmi Gazete ${rgAlert.gazette_date} (Sayı: ${rgAlert.gazette_number}) tarihinde ${rgAlert.found_count} adet yeni karar yayınlandı.
                            </p>
                            <div style="margin-top: 0.5rem; font-size: 0.85rem;">
                                ${rgAlert.found_decisions.map(d => `
                                    <div style="background: white; padding: 0.5rem; border-radius: 0.25rem; margin-top: 0.25rem; border-left: 3px solid #ef4444;">
                                        <a href="https://www.resmigazete.gov.tr${d.url}" target="_blank" style="color: #dc2626; text-decoration: none; font-weight: 500;">
                                            ${d.title}
                                        </a>
                                        <div style="font-size: 0.75rem; color: #666;">Eşleşen: "${d.matched_keyword}"</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: #991b1b;">
                        Son tarama: ${new Date(rgAlert.scan_time).toLocaleString('tr-TR')}
                    </div>
                </div>
            `;
        } else {
            // No alert - all clear
            rgAlertHtml = `
                <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #22c55e;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="background: #22c55e; color: white; padding: 0.75rem; border-radius: 0.5rem;">
                            <i data-lucide="check-circle" style="width: 24px; height: 24px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h4 style="color: #16a34a; margin: 0;">✅ Resmi Gazete Tarandı - Yeni MASAK Kararı Yok</h4>
                            <p style="margin: 0.25rem 0; font-size: 0.85rem; color: #15803d;">
                                ${rgAlert.gazette_date} tarihli Resmi Gazete (Sayı: ${rgAlert.gazette_number}) incelendi. 
                                Toplam ${rgAlert.total_decisions} kararda MASAK/yaptırım ile ilgili yeni karar bulunamadı.
                            </p>
                        </div>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #166534;">
                        Son tarama: ${new Date(rgAlert.scan_time).toLocaleString('tr-TR')} | 
                        <a href="https://www.resmigazete.gov.tr" target="_blank" style="color: #15803d;">Resmi Gazete'yi Aç</a>
                    </div>
                </div>
            `;
        }
    } else {
        // Not scanned yet
        rgAlertHtml = `
            <div class="card" style="margin-bottom: 1.5rem; background: #f8fafc; border: 1px solid #cbd5e1;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="background: #94a3b8; color: white; padding: 0.75rem; border-radius: 0.5rem;">
                        <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h4 style="color: #475569; margin: 0;">Resmi Gazete Henüz Taranmadı</h4>
                        <p style="margin: 0.25rem 0; font-size: 0.85rem; color: #64748b;">
                            Günlük tarama henüz yapılmadı. <code>scripts/check_rg_masak.py</code> scriptini çalıştırarak tarama yapabilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="grid-cols-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;">
            <div class="card">
                <h3>Toplam Taranan</h3>
                <p style="font-size: 2rem; font-weight: bold; color: var(--primary);">${state.stats.totalScanned}</p>
            </div>
            <div class="card">
                <h3>Eşleşme Bulunan</h3>
                <p style="font-size: 2rem; font-weight: bold; color: var(--danger);">${state.stats.matchesFound}</p>
            </div>
            <div class="card">
                <h3>Veri Tabanı</h3>
                <p style="font-size: 1.2rem; font-weight: 500; color: var(--text);">${meta.lastUpdated || '-'}</p>
                <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 0.5rem;">${SanctionsDB.data ? SanctionsDB.data.length.toLocaleString() : 0} Kayıt</p>
            </div>
            <div class="card">
                <h3>Son Tarama</h3>
                <p style="font-size: 1.2rem; color: var(--text-light);">${state.stats.lastScanDate || '-'}</p>
            </div>
        </div>

        <!-- Source Status -->
        <div class="card" style="margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Veri Kaynakları Durumu</h3>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="window.location.reload()" title="Sayfayı yenileyerek son verileri yükle">
                        <i data-lucide="refresh-cw" style="margin-right: 0.5rem;"></i> Verileri Yenile
                    </button>
                    <button class="btn btn-secondary" onclick="alert('Otomatik Güncelleme: \\nscripts/daily_update.bat dosyasını Windows Zamanlanmış Görevler\\'e ekleyerek verilerin her gün otomatik güncellenmesini sağlayabilirsiniz.')" title="Otomatik Güncelleme Bilgisi">
                        <i data-lucide="info"></i>
                    </button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-top: 1rem;">
                <!-- MASAK Card -->
                <div style="padding: 1rem; background: #fff7ed; border-radius: 0.5rem; border: 1px solid #ffedd5;">
                    <strong>🇹🇷 MASAK</strong>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Güncelleme: ${masakLastUpdate}</div>
                    <div style="font-size: 0.8rem; font-weight: 500;">${masakCount.toLocaleString()} Kayıt</div>
                </div>
                <div style="padding: 1rem; background: #fef2f2; border-radius: 0.5rem; border: 1px solid #fee2e2;">
                    <strong>🇹🇷 Resmi Gazete</strong>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Güncelleme: ${sources.TR ? sources.TR.lastUpdated : '-'}</div>
                    <div style="font-size: 0.8rem; font-weight: 500;">${sources.TR ? sources.TR.count : 0} Karar</div>
                </div>
                <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                    <strong>🇺🇳 BM (UN)</strong>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Güncelleme: ${sources.UN.lastUpdated || '-'}</div>
                    <div style="font-size: 0.8rem; font-weight: 500;">${sources.UN.count || 0} Kayıt</div>
                </div>
                <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                    <strong>🇪🇺 AB (EU)</strong>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Güncelleme: ${sources.EU.lastUpdated || '-'}</div>
                    <div style="font-size: 0.8rem; font-weight: 500;">${sources.EU.count || 0} Kayıt</div>
                </div>
                <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                    <strong>🇺🇸 OFAC (ABD)</strong>
                    <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">Güncelleme: ${sources.OFAC.lastUpdated || '-'}</div>
                    <div style="font-size: 0.8rem; font-weight: 500;">${sources.OFAC.count || 0} Kayıt</div>
                </div>
            </div>
        </div>
        
        <div class="grid-cols-2" style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>Resmi Gazete - Günlük Tarama</h3>
                    ${rgAlert && rgAlert.scanned ?
            (rgAlert.has_alert ?
                '<span style="background: #fef2f2; color: #dc2626; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">⚠️ YENİ KARAR!</span>' :
                '<span style="background: #f0fdf4; color: #16a34a; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">✅ Temiz</span>'
            ) :
            '<span style="background: #f1f5f9; color: #64748b; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">Taranmadı</span>'
        }
                </div>
                <div style="margin-top: 1rem; max-height: 200px; overflow-y: auto;">
                    ${rgAlert && rgAlert.scanned ? `
                        <div style="padding: 0.75rem; background: ${rgAlert.has_alert ? '#fef2f2' : '#f0fdf4'}; border-radius: 0.5rem; margin-bottom: 0.75rem; border-left: 3px solid ${rgAlert.has_alert ? '#ef4444' : '#22c55e'};">
                            <div style="font-weight: 500; color: ${rgAlert.has_alert ? '#dc2626' : '#16a34a'};">
                                ${rgAlert.has_alert ? '⚠️ Yeni MASAK/Yaptırım Kararı Bulundu!' : '✅ Yeni MASAK Kararı Yok'}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                                ${rgAlert.gazette_date} - Sayı: ${rgAlert.gazette_number} | ${rgAlert.total_decisions} karar tarandı
                            </div>
                            ${rgAlert.has_alert && rgAlert.found_decisions ? rgAlert.found_decisions.map(d => `
                                <div style="margin-top: 0.5rem; padding: 0.5rem; background: white; border-radius: 0.25rem;">
                                    <a href="https://www.resmigazete.gov.tr${d.url}" target="_blank" style="color: #dc2626; text-decoration: none; font-weight: 500; font-size: 0.85rem;">
                                        ${d.title}
                                    </a>
                                </div>
                            `).join('') : ''}
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.5rem;">Son tarama: ${new Date(rgAlert.scan_time).toLocaleString('tr-TR')}</div>
                        </div>
                    ` : `
                        <div style="padding: 0.75rem; background: #fef9c3; border-radius: 0.5rem; border-left: 3px solid #eab308;">
                            <div style="color: #854d0e; font-size: 0.85rem;">⏳ Resmi Gazete taranıyor...</div>
                        </div>
                    `}
                    ${decrees.length > 0 ? `
                        <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-light);">Son 1 Yıldaki Kararlar:</div>
                        <ul style="list-style: none; padding: 0;">
                            ${decrees.map(d => `
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <a href="${d.url}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500;">
                                            ${d.title}
                                        </a>
                                        <span style="font-size: 0.8rem; color: var(--text-light);">${d.date}</span>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>

            <div class="card">
                <h3>Hızlı İşlemler</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="renderPage('scan'); updateActiveLink('scan')">
                        <i data-lucide="scan-line" style="margin-right: 0.5rem;"></i> Yeni Tarama Başlat
                    </button>
                    <a href="https://www.resmigazete.gov.tr" target="_blank" class="btn btn-secondary" style="text-align: center;">
                        <i data-lucide="external-link" style="margin-right: 0.5rem;"></i> Resmi Gazete'ye Git
                    </a>
                </div>
            </div>
        </div>
    `;
}

function renderScanPage() {
    return `
        <div class="grid-cols-2" style="display: grid; gap: 1.5rem; grid-template-columns: 1fr 1fr;">
            <div class="card">
                <h3>Manuel Tarama</h3>
                <p style="color: var(--text-light); margin-bottom: 1rem;">Tek bir şirket veya şahıs ismini tarayın.</p>
                
                <div class="form-group">
                    <label class="form-label">İsim / Ünvan</label>
                    <input type="text" class="form-input" id="scan-input-name" placeholder="Örn: ABC Ticaret Ltd. Şti.">
                </div>

                <div class="form-group">
                    <label class="form-label">TCKN / VKN (Opsiyonel)</label>
                    <input type="text" class="form-input" id="scan-input-tckn" placeholder="Örn: 12345678901" maxlength="11" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                </div>
                
                <button class="btn btn-primary" onclick="performManualScan()">
                    <i data-lucide="search" style="margin-right: 0.5rem;"></i> Tara
                </button>
            </div>

            <div class="card">
                <h3>Toplu Tarama (Excel / CRM)</h3>
                <p style="color: var(--text-light); margin-bottom: 1rem;">Müşteri listenizi Excel'den yükleyin veya CRM'den çekin.</p>
                
                <!-- File Upload -->
                <div class="file-upload-wrapper">
                    <input type="file" id="file-upload" class="file-upload-input" accept=".xlsx, .xls, .csv, .pdf" onchange="handleFileUpload(this)">
                    <div class="file-upload-label">
                        <i data-lucide="upload" class="file-upload-icon"></i>
                        <span class="file-upload-text">Excel veya PDF dosyasını buraya sürükleyin</span>
                    </div>
                </div>

                <div style="text-align: center; margin: 1rem 0; color: var(--text-light); font-size: 0.8rem;">- VEYA -</div>

                <!-- CRM Integration Button -->
                <button class="btn btn-secondary" style="width: 100%; justify-content: center;" onclick="fetchFromCRM()">
                    <i data-lucide="database" style="margin-right: 0.5rem;"></i> CRM Sisteminden Müşterileri Çek
                </button>

                <div id="upload-status" style="margin-top: 1rem; font-size: 0.9rem;"></div>
            </div>
        </div>

        <div class="card" id="scan-result-area" style="display: none;">
            <h3>Sonuçlar</h3>
            <div id="manual-scan-results"></div>
        </div>
    `;
}

function renderResultsPage() {
    if (state.scanResults.length === 0) {
        return `
            <div class="card" style="text-align: center; padding: 3rem;">
                <i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--text-light); margin-bottom: 1rem;"></i>
                <h3>Henüz sonuç yok</h3>
                <p style="color: var(--text-light);">Tarama işlemi yaptığınızda sonuçlar burada listelenecektir.</p>
            </div>
        `;
    }

    return `
        <div class="card">
            <h3>Tarama Geçmişi</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Aranan</th>
                            <th>Eşleşen</th>
                            <th>Kaynak</th>
                            <th>Benzerlik</th>
                            <th>Detay</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.scanResults.map(r => `
                            <tr>
                                <td>${r.date}</td>
                                <td>${r.query}</td>
                                <td>${r.match}</td>
                                <td><span class="badge badge-warning">${r.source}</span></td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <div style="width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                                            <div style="width: ${r.score}%; height: 100%; background: ${r.score > 90 ? '#16a34a' : '#ca8a04'};"></div>
                                        </div>
                                        <span style="font-weight: 600; color: ${r.score > 90 ? '#16a34a' : '#ca8a04'};">%${r.score}</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="alert('${(r.details || '').replace(/'/g, "\\'")}')">
                                        <i data-lucide="info" style="width: 12px; height: 12px;"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Şüpheli İşlem Bildirimi Sayfası (Şube Personeli İçin)
function renderReportPage() {
    return `
        <div style="max-width: 800px; margin: 0 auto;">
            <div class="card" style="border-top: 4px solid #dc2626;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 1rem; border-radius: 0.75rem;">
                        <i data-lucide="alert-triangle" style="color: white; width: 32px; height: 32px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; color: #dc2626;">Şüpheli İşlem / Müşteri Bildirimi</h2>
                        <p style="margin: 0.25rem 0 0 0; color: var(--text-light); font-size: 0.9rem;">
                            Tüm bildirimler gizli tutulur ve Uyum birimine iletilir.
                        </p>
                    </div>
                </div>
                
                <form id="report-form" onsubmit="submitSuspiciousReport(event)">
                    <!-- Bildiren Bilgileri -->
                    <div style="background: #f8fafc; padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--text); display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="user" style="width: 18px; height: 18px;"></i>
                            Bildiren Bilgileri
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Şube *</label>
                                <select class="form-input" id="report-branch" required>
                                    <option value="">Şube Seçiniz...</option>
                                    <option value="İstanbul Kadıköy Şubesi">İstanbul Kadıköy Şubesi</option>
                                    <option value="İstanbul Beşiktaş Şubesi">İstanbul Beşiktaş Şubesi</option>
                                    <option value="İstanbul Ataşehir Şubesi">İstanbul Ataşehir Şubesi</option>
                                    <option value="Ankara Kızılay Şubesi">Ankara Kızılay Şubesi</option>
                                    <option value="Ankara Çankaya Şubesi">Ankara Çankaya Şubesi</option>
                                    <option value="İzmir Alsancak Şubesi">İzmir Alsancak Şubesi</option>
                                    <option value="Bursa Nilüfer Şubesi">Bursa Nilüfer Şubesi</option>
                                    <option value="Antalya Merkez Şubesi">Antalya Merkez Şubesi</option>
                                    <option value="Genel Müdürlük">Genel Müdürlük</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Personel Adı Soyadı *</label>
                                <input type="text" class="form-input" id="report-reporter" placeholder="Adınız Soyadınız" required>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Şüpheli Kişi/Kurum Bilgileri -->
                    <div style="background: #fef2f2; padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #fecaca;">
                        <h4 style="margin: 0 0 1rem 0; color: #dc2626; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="user-x" style="width: 18px; height: 18px;"></i>
                            Şüpheli Kişi/Kurum Bilgileri
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Ad Soyad / Ünvan *</label>
                                <input type="text" class="form-input" id="report-name" placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti." required>
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">TCKN / VKN</label>
                                <input type="text" class="form-input" id="report-tckn" placeholder="11 haneli kimlik no" maxlength="11">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Müşteri No / Hesap No</label>
                                <input type="text" class="form-input" id="report-account" placeholder="Varsa müşteri veya hesap numarası">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Telefon</label>
                                <input type="text" class="form-input" id="report-phone" placeholder="İletişim numarası">
                            </div>
                        </div>
                    </div>
                    
                    <!-- İşlem Detayları -->
                    <div style="background: #fffbeb; padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #fcd34d;">
                        <h4 style="margin: 0 0 1rem 0; color: #b45309; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
                            İşlem Detayları
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">İşlem Türü *</label>
                                <select class="form-input" id="report-type" required>
                                    <option value="">Seçiniz...</option>
                                    <option value="Yüksek Tutarlı Nakit İşlem">💵 Yüksek Tutarlı Nakit İşlem</option>
                                    <option value="Şüpheli Para Transferi">💸 Şüpheli Para Transferi</option>
                                    <option value="Parçalı İşlem (Structuring)">📊 Parçalı İşlem (Structuring)</option>
                                    <option value="Şüpheli Hesap Hareketi">📈 Şüpheli Hesap Hareketi</option>
                                    <option value="Sahte/Şüpheli Kimlik">🪪 Sahte/Şüpheli Kimlik</option>
                                    <option value="Üçüncü Şahıs Adına İşlem">👥 Üçüncü Şahıs Adına İşlem</option>
                                    <option value="Olağandışı Davranış">⚠️ Olağandışı Davranış</option>
                                    <option value="Yaptırım Listesi Şüphesi">🚫 Yaptırım Listesi Şüphesi</option>
                                    <option value="Diğer">📝 Diğer</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Risk Seviyesi *</label>
                                <select class="form-input" id="report-risk" required>
                                    <option value="">Seçiniz...</option>
                                    <option value="Düşük">🟢 Düşük - Takip Edilmeli</option>
                                    <option value="Orta">🟡 Orta - İncelenmeli</option>
                                    <option value="Yüksek">🟠 Yüksek - Acil İnceleme</option>
                                    <option value="Kritik">🔴 Kritik - Derhal Müdahale</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">İşlem Tarihi</label>
                                <input type="date" class="form-input" id="report-date" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">İşlem Tutarı (TL)</label>
                                <input type="number" class="form-input" id="report-amount" placeholder="Örn: 500000">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Açıklama -->
                    <div class="form-group">
                        <label class="form-label">Detaylı Açıklama *</label>
                        <textarea class="form-input" id="report-description" rows="5" 
                            placeholder="Şüphelenmenizin nedenini detaylı açıklayın. Müşterinin davranışları, işlemin olağandışılığı, kimlik doğrulama sorunları, vb. belirtin..." required></textarea>
                    </div>
                    
                    <!-- Kanıt Yükleme -->
                    <div style="background: #f0f9ff; padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #bae6fd;">
                        <h4 style="margin: 0 0 1rem 0; color: #0369a1; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="paperclip" style="width: 18px; height: 18px;"></i>
                            Kanıt / Ek Dosyalar
                        </h4>
                        <div class="form-group" style="margin: 0;">
                            <input type="file" class="form-input" id="report-evidence" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style="padding: 0.5rem;">
                            <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">
                                Dekont, kimlik fotokopisi, ekran görüntüsü vb. ekleyebilirsiniz. (Max: 5 dosya, Her biri 5MB)
                            </div>
                        </div>
                        <div id="evidence-preview" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;"></div>
                    </div>
                    
                    <div id="report-status" style="margin-bottom: 1rem;"></div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('report-form').reset(); document.getElementById('evidence-preview').innerHTML = '';">
                            <i data-lucide="x" style="margin-right: 0.5rem;"></i>
                            Temizle
                        </button>
                        <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                            <i data-lucide="send" style="margin-right: 0.5rem;"></i>
                            Bildirimi Gönder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// Bildirim Yönetimi Sayfası (Uyum Birimi İçin)
function renderReportsAdminPage() {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const pendingCount = reports.filter(r => r.status === 'pending').length;
    const processedCount = reports.filter(r => r.status === 'processed').length;
    const highRiskCount = reports.filter(r => r.risk === 'Yüksek' || r.risk === 'Kritik').length;

    return `
        <!-- İstatistikler -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="card" style="text-align: center; padding: 1.25rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <div style="font-size: 2.5rem; font-weight: bold;">${reports.length}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Toplam Bildirim</div>
            </div>
            <div class="card" style="text-align: center; padding: 1.25rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                <div style="font-size: 2.5rem; font-weight: bold;">${pendingCount}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Bekleyen</div>
            </div>
            <div class="card" style="text-align: center; padding: 1.25rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                <div style="font-size: 2.5rem; font-weight: bold;">${processedCount}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">İşlenen</div>
            </div>
            <div class="card" style="text-align: center; padding: 1.25rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                <div style="font-size: 2.5rem; font-weight: bold;">${highRiskCount}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Yüksek Risk</div>
            </div>
        </div>
        
        <!-- Bildirim Listesi -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">📋 Tüm Bildirimler</h3>
                <div style="display: flex; gap: 0.5rem;">
                    <select class="form-input" id="filter-status" onchange="filterAdminReports()" style="width: auto;">
                        <option value="all">Tüm Durumlar</option>
                        <option value="pending">⏳ Bekleyenler</option>
                        <option value="processed">✅ İşlenenler</option>
                    </select>
                    <select class="form-input" id="filter-risk" onchange="filterAdminReports()" style="width: auto;">
                        <option value="all">Tüm Risk Seviyeleri</option>
                        <option value="Kritik">🔴 Kritik</option>
                        <option value="Yüksek">🟠 Yüksek</option>
                        <option value="Orta">🟡 Orta</option>
                        <option value="Düşük">🟢 Düşük</option>
                    </select>
                    <button class="btn btn-secondary" onclick="exportReportsCSV()">
                        <i data-lucide="download" style="margin-right: 0.5rem;"></i>
                        Dışa Aktar
                    </button>
                </div>
            </div>
            
            ${reports.length === 0 ? `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i data-lucide="inbox" style="width: 64px; height: 64px; margin-bottom: 1rem;"></i>
                    <h3>Henüz Bildirim Yok</h3>
                    <p>Şubelerden gelen bildirimler burada listelenecek.</p>
                </div>
            ` : `
                <div class="table-container">
                    <table class="data-table" id="reports-table">
                        <thead>
                            <tr>
                                <th style="width: 80px;">No</th>
                                <th>Tarih/Saat</th>
                                <th>Şube</th>
                                <th>Şüpheli Kişi/Kurum</th>
                                <th>İşlem Türü</th>
                                <th>Tutar</th>
                                <th>Risk</th>
                                <th>Durum</th>
                                <th style="width: 120px;">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reports.slice().reverse().map(r => `
                                <tr data-status="${r.status}" data-risk="${r.risk || ''}">
                                    <td style="font-family: monospace; font-weight: 600;">#${r.id.toString().slice(-6)}</td>
                                    <td>
                                        <div style="font-weight: 500;">${new Date(r.date).toLocaleDateString('tr-TR')}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-light);">${new Date(r.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td>
                                        <div style="font-weight: 500;">${r.branch || '-'}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-light);">${r.reporter || ''}</div>
                                    </td>
                                    <td>
                                        <div style="font-weight: 600; color: #dc2626;">${r.name}</div>
                                        ${r.tckn ? `<div style="font-size: 0.75rem; color: var(--text-light);">TCKN: ${r.tckn}</div>` : ''}
                                    </td>
                                    <td><span style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.8rem;">${r.type || '-'}</span></td>
                                    <td style="font-weight: 600;">${r.amount ? Number(r.amount).toLocaleString('tr-TR') + ' ₺' : '-'}</td>
                                    <td><span style="background: ${getRiskBg(r.risk)}; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">${r.risk || '-'}</span></td>
                                    <td><span style="background: ${r.status === 'pending' ? '#fef08a' : '#bbf7d0'}; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${r.status === 'pending' ? '⏳ Bekliyor' : '✅ İşlendi'}</span></td>
                                    <td>
                                        <div style="display: flex; gap: 0.25rem;">
                                            <button class="btn btn-sm btn-secondary" onclick="viewReportDetails(${r.id})" title="Detay Görüntüle">
                                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                            </button>
                                            <button class="btn btn-sm btn-secondary" onclick="editReport(${r.id})" title="Düzenle" style="background: #3b82f6; color: white;">
                                                <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                                            </button>
                                            ${r.status === 'pending' ? `
                                                <button class="btn btn-sm" onclick="markAsProcessed(${r.id})" title="İşlendi Olarak İşaretle" style="background: #22c55e; color: white;">
                                                    <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

// Bildirim Raporları Sayfası
function renderReportsAnalyticsPage() {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');

    // Şube bazında grupla
    const branchStats = {};
    const employeeStats = {};
    const monthlyStats = {};
    const riskStats = { 'Düşük': 0, 'Orta': 0, 'Yüksek': 0, 'Kritik': 0 };
    const typeStats = {};

    reports.forEach(r => {
        // Şube
        const branch = r.branch || 'Belirtilmedi';
        if (!branchStats[branch]) branchStats[branch] = { total: 0, pending: 0, processed: 0, amount: 0 };
        branchStats[branch].total++;
        if (r.status === 'pending') branchStats[branch].pending++;
        else branchStats[branch].processed++;
        branchStats[branch].amount += Number(r.amount) || 0;

        // Personel
        const employee = r.reporter || 'Belirtilmedi';
        if (!employeeStats[employee]) employeeStats[employee] = { total: 0, branch: branch };
        employeeStats[employee].total++;

        // Aylık
        const month = new Date(r.date).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
        if (!monthlyStats[month]) monthlyStats[month] = 0;
        monthlyStats[month]++;

        // Risk
        if (r.risk && riskStats[r.risk] !== undefined) riskStats[r.risk]++;

        // İşlem Türü
        const type = r.type || 'Diğer';
        if (!typeStats[type]) typeStats[type] = 0;
        typeStats[type]++;
    });

    const totalAmount = reports.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return `
        <!-- Özet Kartlar -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${reports.length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Toplam Bildirim</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${Object.keys(branchStats).length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Aktif Şube</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${Object.keys(employeeStats).length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Bildiren Personel</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                <div style="font-size: 1.5rem; font-weight: bold;">${totalAmount.toLocaleString('tr-TR')} ₺</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Toplam Tutar</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${riskStats['Yüksek'] + riskStats['Kritik']}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Yüksek Riskli</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <!-- Şube Bazlı -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>📊 Şube Bazlı Bildirimler</h3>
                    <button class="btn btn-sm btn-secondary" onclick="exportBranchReport()">
                        <i data-lucide="download" style="width: 14px; height: 14px; margin-right: 0.25rem;"></i>
                        Excel
                    </button>
                </div>
                <div class="table-container" style="max-height: 350px; overflow-y: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Şube</th>
                                <th style="text-align: center;">Toplam</th>
                                <th style="text-align: center;">Bekleyen</th>
                                <th style="text-align: center;">İşlenen</th>
                                <th style="text-align: right;">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(branchStats).sort((a, b) => b[1].total - a[1].total).map(([branch, stats]) => `
                                <tr>
                                    <td style="font-weight: 500;">${branch}</td>
                                    <td style="text-align: center; font-weight: 600;">${stats.total}</td>
                                    <td style="text-align: center; color: #f59e0b;">${stats.pending}</td>
                                    <td style="text-align: center; color: #22c55e;">${stats.processed}</td>
                                    <td style="text-align: right; font-weight: 500;">${stats.amount.toLocaleString('tr-TR')} ₺</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Personel Bazlı -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>👤 Personel Bazlı Bildirimler</h3>
                    <button class="btn btn-sm btn-secondary" onclick="exportEmployeeReport()">
                        <i data-lucide="download" style="width: 14px; height: 14px; margin-right: 0.25rem;"></i>
                        Excel
                    </button>
                </div>
                <div class="table-container" style="max-height: 350px; overflow-y: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Personel</th>
                                <th>Şube</th>
                                <th style="text-align: center;">Bildirim Sayısı</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(employeeStats).sort((a, b) => b[1].total - a[1].total).map(([employee, stats]) => `
                                <tr>
                                    <td style="font-weight: 500;">${employee}</td>
                                    <td style="font-size: 0.85rem; color: var(--text-light);">${stats.branch}</td>
                                    <td style="text-align: center; font-weight: 600;">${stats.total}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Risk Dağılımı -->
            <div class="card">
                <h3>⚠️ Risk Dağılımı</h3>
                <div style="margin-top: 1rem;">
                    ${Object.entries(riskStats).map(([risk, count]) => {
        const percent = reports.length > 0 ? ((count / reports.length) * 100).toFixed(1) : 0;
        const color = getRiskBg(risk);
        return `
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span>${risk}</span>
                                    <span style="font-weight: 600;">${count} (%${percent})</span>
                                </div>
                                <div style="background: #e2e8f0; border-radius: 0.5rem; height: 12px; overflow: hidden;">
                                    <div style="background: ${color}; width: ${percent}%; height: 100%;"></div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
            
            <!-- İşlem Türü Dağılımı -->
            <div class="card">
                <h3>📋 İşlem Türü Dağılımı</h3>
                <div style="margin-top: 1rem;">
                    ${Object.entries(typeStats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, count]) => {
        const percent = reports.length > 0 ? ((count / reports.length) * 100).toFixed(1) : 0;
        return `
                            <div style="margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-size: 0.85rem;">${type}</span>
                                    <span style="font-weight: 600;">${count}</span>
                                </div>
                                <div style="background: #e2e8f0; border-radius: 0.5rem; height: 8px; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${percent}%; height: 100%;"></div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function exportBranchReport() {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const branchStats = {};
    reports.forEach(r => {
        const branch = r.branch || 'Belirtilmedi';
        if (!branchStats[branch]) branchStats[branch] = { total: 0, pending: 0, processed: 0, amount: 0 };
        branchStats[branch].total++;
        if (r.status === 'pending') branchStats[branch].pending++;
        else branchStats[branch].processed++;
        branchStats[branch].amount += Number(r.amount) || 0;
    });

    const headers = ['Şube', 'Toplam Bildirim', 'Bekleyen', 'İşlenen', 'Toplam Tutar'];
    let csv = headers.join(';') + '\n';
    Object.entries(branchStats).forEach(([branch, stats]) => {
        csv += `"${branch}";${stats.total};${stats.pending};${stats.processed};${stats.amount}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sube_bazli_rapor_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function exportEmployeeReport() {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const employeeStats = {};
    reports.forEach(r => {
        const employee = r.reporter || 'Belirtilmedi';
        if (!employeeStats[employee]) employeeStats[employee] = { total: 0, branch: r.branch || '' };
        employeeStats[employee].total++;
    });

    const headers = ['Personel', 'Şube', 'Bildirim Sayısı'];
    let csv = headers.join(';') + '\n';
    Object.entries(employeeStats).forEach(([employee, stats]) => {
        csv += `"${employee}";"${stats.branch}";${stats.total}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `personel_bazli_rapor_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Kapsamlı İşlem Geçmişi / Log Sayfası (MASAK Uyumu İçin)
function renderActivityLogPage() {
    const logs = JSON.parse(localStorage.getItem('SYSTEM_ACTIVITY_LOG') || '[]');

    // İstatistikler
    const scanLogs = logs.filter(l => l.category === 'scan');
    const reportLogs = logs.filter(l => l.category === 'report');
    const matchLogs = logs.filter(l => l.action.includes('EŞLEŞME'));
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);

    return `
        <!-- Uyarı Banner -->
        <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: white; padding: 1rem 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
            <i data-lucide="shield-check" style="width: 32px; height: 32px;"></i>
            <div>
                <strong style="font-size: 1.1rem;">MASAK Uyum Kayıtları</strong>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">Tüm tarama ve bildirim işlemleri otomatik olarak kaydedilmektedir. Bu kayıtlar yasal denetim süreçlerinde kullanılabilir.</p>
            </div>
        </div>
        
        <!-- İstatistik Kartları -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${logs.length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Toplam Log</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${scanLogs.length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Tarama İşlemi</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${reportLogs.length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Bildirim İşlemi</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${matchLogs.length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Eşleşme Bulundu</div>
            </div>
            <div class="card" style="text-align: center; padding: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                <div style="font-size: 2rem; font-weight: bold;">${todayLogs.length}</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Bugünkü İşlem</div>
            </div>
        </div>
        
        <div class="card">
            <!-- Filtre ve Export -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <div>
                        <label style="font-size: 0.85rem; color: var(--text-light);">Kategori:</label>
                        <select class="form-input" id="log-filter-category" onchange="filterActivityLogs()" style="width: auto; display: inline-block; margin-left: 0.5rem;">
                            <option value="all">Tümü</option>
                            <option value="scan">Tarama</option>
                            <option value="report">Bildirim</option>
                            <option value="general">Genel</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 0.85rem; color: var(--text-light);">Başlangıç:</label>
                        <input type="date" class="form-input" id="log-filter-start" onchange="filterActivityLogs()" style="width: auto; display: inline-block; margin-left: 0.5rem;">
                    </div>
                    <div>
                        <label style="font-size: 0.85rem; color: var(--text-light);">Bitiş:</label>
                        <input type="date" class="form-input" id="log-filter-end" onchange="filterActivityLogs()" style="width: auto; display: inline-block; margin-left: 0.5rem;">
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="exportActivityLogCSV()">
                        <i data-lucide="download" style="width: 16px; height: 16px; margin-right: 0.5rem;"></i>
                        CSV İndir
                    </button>
                    <button class="btn btn-secondary" onclick="exportActivityLogExcel()">
                        <i data-lucide="file-spreadsheet" style="width: 16px; height: 16px; margin-right: 0.5rem;"></i>
                        Excel İndir
                    </button>
                </div>
            </div>
            
            <!-- Log Tablosu -->
            <div class="table-container" style="max-height: 600px; overflow-y: auto;">
                <table class="data-table" id="activity-log-table">
                    <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                        <tr>
                            <th style="width: 60px;">No</th>
                            <th style="width: 160px;">Tarih/Saat</th>
                            <th style="width: 120px;">Kullanıcı</th>
                            <th style="width: 100px;">Kategori</th>
                            <th>İşlem</th>
                            <th>Detaylar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.length === 0 ? `
                            <tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-light);">
                                <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                                <p>Henüz log kaydı bulunmuyor.</p>
                                <p style="font-size: 0.85rem;">Tarama yaptığınızda veya bildirim işlemi gerçekleştirdiğinizde loglar buraya kaydedilecektir.</p>
                            </td></tr>
                        ` : logs.slice().reverse().map((log, index) => `
                            <tr data-category="${log.category}" data-date="${log.timestamp}">
                                <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-light);">${logs.length - index}</td>
                                <td>
                                    <div style="font-weight: 500;">${new Date(log.timestamp).toLocaleDateString('tr-TR')}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-light);">${new Date(log.timestamp).toLocaleTimeString('tr-TR')}</div>
                                </td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                                        <i data-lucide="user" style="width: 14px; height: 14px; color: var(--text-light);"></i>
                                        <span style="font-size: 0.85rem; font-weight: 500;">${log.user || '-'}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style="background: ${getCategoryColor(log.category)}; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">
                                        ${getCategoryLabel(log.category)}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 1.25rem;">${getLogIcon(log.action)}</span>
                                        <span style="font-weight: 500; ${log.action.includes('EŞLEŞME') ? 'color: #dc2626;' : ''}">${log.action}</span>
                                    </div>
                                </td>
                                <td style="font-size: 0.85rem; color: var(--text-light); max-width: 400px; word-wrap: break-word;">${log.details || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getCategoryColor(category) {
    switch (category) {
        case 'scan': return '#0ea5e9';
        case 'report': return '#f59e0b';
        case 'general': return '#6b7280';
        default: return '#94a3b8';
    }
}

function getCategoryLabel(category) {
    switch (category) {
        case 'scan': return '🔍 Tarama';
        case 'report': return '📝 Bildirim';
        case 'general': return '📋 Genel';
        default: return category;
    }
}

function filterActivityLogs() {
    const category = document.getElementById('log-filter-category').value;
    const startDate = document.getElementById('log-filter-start').value;
    const endDate = document.getElementById('log-filter-end').value;

    const rows = document.querySelectorAll('#activity-log-table tbody tr');
    rows.forEach(row => {
        const rowCategory = row.dataset.category;
        const rowDate = row.dataset.date;

        let show = true;

        if (category !== 'all' && rowCategory !== category) show = false;
        if (startDate && rowDate && new Date(rowDate) < new Date(startDate)) show = false;
        if (endDate && rowDate && new Date(rowDate) > new Date(endDate + 'T23:59:59')) show = false;

        row.style.display = show ? '' : 'none';
    });
}

function exportActivityLogCSV() {
    const logs = JSON.parse(localStorage.getItem('SYSTEM_ACTIVITY_LOG') || '[]');
    if (logs.length === 0) { alert('Dışa aktarılacak log yok.'); return; }

    const headers = ['No', 'Tarih', 'Saat', 'Kullanıcı', 'Kategori', 'İşlem', 'Detaylar'];
    let csv = headers.join(';') + '\n';

    logs.forEach((log, index) => {
        const date = new Date(log.timestamp);
        csv += `${index + 1};"${date.toLocaleDateString('tr-TR')}";"${date.toLocaleTimeString('tr-TR')}";"${log.user || '-'}";"${getCategoryLabel(log.category)}";"${log.action}";"${(log.details || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `masak_islem_logi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function exportActivityLogExcel() {
    // CSV olarak indir (Excel uyumlu)
    exportActivityLogCSV();
    alert('Excel uyumlu CSV dosyası indirildi. Excel\'de açabilirsiniz.');
}

function getRiskBg(risk) {
    switch (risk) {
        case 'Düşük': return '#22c55e';
        case 'Orta': return '#eab308';
        case 'Yüksek': return '#f97316';
        case 'Kritik': return '#dc2626';
        default: return '#94a3b8';
    }
}

function getLogIcon(action) {
    if (action.includes('oluştur') || action.includes('Bildirim')) return '📝';
    if (action.includes('incel') || action.includes('görüntü')) return '👁️';
    if (action.includes('düzenle') || action.includes('güncelle')) return '✏️';
    if (action.includes('işlendi') || action.includes('İşlendi')) return '✅';
    if (action.includes('tarama') || action.includes('sorgula')) return '🔍';
    if (action.includes('eşleşme') || action.includes('bulundu')) return '⚠️';
    return '📋';
}

// Bildirim için aktivite log ekleme
function addReportLog(reportId, action, details = '') {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) return;

    if (!reports[index].activityLog) reports[index].activityLog = [];
    reports[index].activityLog.push({
        timestamp: new Date().toISOString(),
        action: action,
        details: details
    });

    localStorage.setItem('SUSPICIOUS_REPORTS', JSON.stringify(reports));
}

// Sistem geneli aktivite log
function addSystemLog(action, details = '', category = 'general') {
    const logs = JSON.parse(localStorage.getItem('SYSTEM_ACTIVITY_LOG') || '[]');
    logs.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: getCurrentUser(), // Kim yaptı
        action: action,
        details: details,
        category: category
    });
    // Son 5000 log tut (MASAK için yeterli geçmiş)
    if (logs.length > 5000) logs.shift();
    localStorage.setItem('SYSTEM_ACTIVITY_LOG', JSON.stringify(logs));
}

// İsim bazlı sorgu geçmişi - belirli bir isim/kişi için tüm sorguları getir
function getNameQueryHistory(searchName) {
    if (!searchName) return [];

    const logs = JSON.parse(localStorage.getItem('SYSTEM_ACTIVITY_LOG') || '[]');
    const normalizedSearch = searchName.toLocaleLowerCase('tr-TR').trim();

    // Bu isimle ilgili tüm sorguları bul
    return logs.filter(log => {
        if (!log.details) return false;
        const details = log.details.toLocaleLowerCase('tr-TR');
        return details.includes(normalizedSearch);
    }).map(log => ({
        date: new Date(log.timestamp).toLocaleString('tr-TR'),
        user: log.user || '-',
        action: log.action,
        details: log.details
    }));
}

// İsim için sorgu geçmişi HTML'i oluştur
function renderNameQueryHistory(name) {
    const history = getNameQueryHistory(name);
    if (history.length === 0) return '';

    return `
        <div style="margin-top: 1.5rem;">
            <h4 style="margin: 0 0 0.75rem 0; color: #7c3aed;">
                <i data-lucide="history" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 0.5rem;"></i>
                Bu Kişi/Kurum için Sorgu Geçmişi (${history.length})
            </h4>
            <div style="background: #faf5ff; border-radius: 0.5rem; border: 1px solid #e9d5ff; max-height: 200px; overflow-y: auto;">
                ${history.slice(0, 20).map(h => `
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #e9d5ff; display: flex; gap: 1rem; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="background: #8b5cf6; color: white; padding: 0.15rem 0.5rem; border-radius: 0.25rem; font-size: 0.7rem;">${h.user}</span>
                                <span style="font-weight: 500; font-size: 0.85rem;">${h.action}</span>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">${h.details}</div>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-light); white-space: nowrap;">${h.date}</div>
                    </div>
                `).join('')}
                ${history.length > 20 ? `<div style="padding: 0.5rem; text-align: center; color: var(--text-light); font-size: 0.8rem;">...ve ${history.length - 20} kayıt daha</div>` : ''}
            </div>
        </div>
    `;
}

// Tarama ekranı için sorgu geçmişi (kim kaç kez sorguladı)
function renderScanQueryHistory(name) {
    if (!name) return '';

    const logs = JSON.parse(localStorage.getItem('SYSTEM_ACTIVITY_LOG') || '[]');
    const normalizedSearch = name.toLocaleLowerCase('tr-TR').trim();

    // Bu isimle ilgili tarama loglarını bul
    const scanLogs = logs.filter(log => {
        if (log.category !== 'scan') return false;
        if (!log.details) return false;
        const details = log.details.toLocaleLowerCase('tr-TR');
        return details.includes(normalizedSearch);
    });

    if (scanLogs.length === 0) return '';

    // Kullanıcı bazlı istatistik
    const userStats = {};
    scanLogs.forEach(log => {
        const user = log.user || 'Bilinmeyen';
        if (!userStats[user]) {
            userStats[user] = { count: 0, lastDate: null };
        }
        userStats[user].count++;
        if (!userStats[user].lastDate || new Date(log.timestamp) > new Date(userStats[user].lastDate)) {
            userStats[user].lastDate = log.timestamp;
        }
    });

    const userList = Object.entries(userStats).sort((a, b) => b[1].count - a[1].count);

    return `
        <div style="margin-top: 1.5rem; border-top: 1px solid var(--border); padding-top: 1rem;">
            <h4 style="margin: 0 0 0.75rem 0; color: #7c3aed; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="history" style="width: 18px; height: 18px;"></i>
                Bu Kişi için Sorgu Geçmişi
            </h4>
            
            <!-- Özet -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 2rem; font-weight: bold;">${scanLogs.length}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">Toplam Sorgu</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: bold;">${userList.length}</div>
                        <div style="font-size: 0.85rem; opacity: 0.9;">Farklı Kullanıcı</div>
                    </div>
                </div>
            </div>
            
            <!-- Kullanıcı Listesi -->
            <div style="background: #faf5ff; border-radius: 0.5rem; border: 1px solid #e9d5ff;">
                <div style="padding: 0.5rem 1rem; background: #ede9fe; border-radius: 0.5rem 0.5rem 0 0; font-weight: 600; font-size: 0.85rem; color: #6b21a8;">
                    Kim, Kaç Kez Sorguladı?
                </div>
                ${userList.map(([user, stats]) => `
                    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #e9d5ff; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="user" style="width: 16px; height: 16px; color: #8b5cf6;"></i>
                            <span style="font-weight: 500;">${user}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="background: #8b5cf6; color: white; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 600;">${stats.count} kez</span>
                            <span style="font-size: 0.75rem; color: var(--text-light);">Son: ${new Date(stats.lastDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Son Sorgular -->
            <div style="margin-top: 1rem; max-height: 150px; overflow-y: auto;">
                <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Son 5 Sorgu:</div>
                ${scanLogs.slice(-5).reverse().map(log => `
                    <div style="padding: 0.5rem; background: #f8fafc; border-radius: 0.25rem; margin-bottom: 0.25rem; font-size: 0.8rem; display: flex; justify-content: space-between;">
                        <span><strong>${log.user || '-'}</strong> - ${log.action}</span>
                        <span style="color: var(--text-light);">${new Date(log.timestamp).toLocaleString('tr-TR')}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function filterAdminReports() {
    const statusFilter = document.getElementById('filter-status').value;
    const riskFilter = document.getElementById('filter-risk').value;
    const rows = document.querySelectorAll('#reports-table tbody tr');

    rows.forEach(row => {
        const status = row.dataset.status;
        const risk = row.dataset.risk;
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const riskMatch = riskFilter === 'all' || risk === riskFilter;
        row.style.display = statusMatch && riskMatch ? '' : 'none';
    });
}

function viewReportDetails(id) {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const r = reports.find(rep => rep.id === id);
    if (!r) return;

    // Detay görüntüleme logu
    addSystemLog('Bildirim detay görüntüleme', `#${id.toString().slice(-6)} - ${r.name} bildirim detayı incelendi`, 'report');

    const modal = document.getElementById('details-modal');
    const content = document.getElementById('details-content');

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border);">
            <div>
                <h2 style="margin: 0; color: #dc2626;">Bildirim Detayı</h2>
                <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem;">Bildirim No: #${r.id.toString().slice(-6)}</div>
            </div>
            <span style="background: ${r.status === 'pending' ? '#fef08a' : '#bbf7d0'}; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600;">
                ${r.status === 'pending' ? '⏳ Bekliyor' : '✅ İşlendi'}
            </span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: var(--text-light);">👤 Bildiren Bilgileri</h4>
                <p style="margin: 0.25rem 0;"><strong>Şube:</strong> ${r.branch || '-'}</p>
                <p style="margin: 0.25rem 0;"><strong>Personel:</strong> ${r.reporter || '-'}</p>
                <p style="margin: 0.25rem 0;"><strong>Tarih:</strong> ${new Date(r.date).toLocaleString('tr-TR')}</p>
            </div>
            <div style="background: #fef2f2; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #dc2626;">
                <h4 style="margin: 0 0 0.75rem 0; color: #dc2626;">🚨 Şüpheli Kişi/Kurum</h4>
                <p style="margin: 0.25rem 0;"><strong>Ad/Ünvan:</strong> ${r.name}</p>
                <p style="margin: 0.25rem 0;"><strong>TCKN/VKN:</strong> ${r.tckn || 'Belirtilmedi'}</p>
                <p style="margin: 0.25rem 0;"><strong>Hesap No:</strong> ${r.account || 'Belirtilmedi'}</p>
                <p style="margin: 0.25rem 0;"><strong>Telefon:</strong> ${r.phone || 'Belirtilmedi'}</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1.5rem;">
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 0.75rem; color: var(--text-light);">İşlem Türü</div>
                <div style="font-weight: 600; margin-top: 0.25rem;">${r.type || '-'}</div>
            </div>
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 0.75rem; color: var(--text-light);">İşlem Tarihi</div>
                <div style="font-weight: 600; margin-top: 0.25rem;">${r.transactionDate || '-'}</div>
            </div>
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                <div style="font-size: 0.75rem; color: var(--text-light);">Tutar</div>
                <div style="font-weight: 600; margin-top: 0.25rem;">${r.amount ? Number(r.amount).toLocaleString('tr-TR') + ' ₺' : '-'}</div>
            </div>
            <div style="background: ${getRiskBg(r.risk)}20; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 2px solid ${getRiskBg(r.risk)};">
                <div style="font-size: 0.75rem; color: var(--text-light);">Risk Seviyesi</div>
                <div style="font-weight: 600; margin-top: 0.25rem; color: ${getRiskBg(r.risk)};">${r.risk || '-'}</div>
            </div>
        </div>
        
        <div style="margin-top: 1.5rem;">
            <h4 style="margin: 0 0 0.75rem 0; color: var(--text-light);">📝 Açıklama</h4>
            <div style="background: #fffbeb; padding: 1rem; border-radius: 0.5rem; border: 1px solid #fcd34d; white-space: pre-wrap;">
                ${r.description || 'Açıklama girilmemiş.'}
            </div>
        </div>
        
        ${r.evidenceFiles && r.evidenceFiles.length > 0 ? `
            <div style="margin-top: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: var(--text-light);">📎 Ekli Dosyalar (${r.evidenceFiles.length})</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${r.evidenceFiles.map(f => `
                        <div style="background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 0.25rem; font-size: 0.85rem;">
                            📄 ${f.name} <span style="color: var(--text-light);">(${(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${r.reviewNotes ? `
            <div style="margin-top: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #0369a1;">💼 Uyum İnceleme Notu</h4>
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; border: 1px solid #bae6fd; white-space: pre-wrap;">
                    ${r.reviewNotes}
                </div>
            </div>
        ` : ''}
        
        ${r.activityLog && r.activityLog.length > 0 ? `
            <div style="margin-top: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: var(--text-light);">📋 Bildirim İşlem Geçmişi</h4>
                <div style="background: #f8fafc; border-radius: 0.5rem; border: 1px solid var(--border); max-height: 200px; overflow-y: auto;">
                    ${r.activityLog.map(log => `
                        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; align-items: flex-start;">
                            <div style="font-size: 1.25rem;">${getLogIcon(log.action)}</div>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                    <span style="font-weight: 500;">${log.action}</span>
                                    ${log.user ? `<span style="background: #8b5cf6; color: white; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.7rem;">${log.user}</span>` : ''}
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">${log.details || ''}</div>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-light); white-space: nowrap;">
                                ${new Date(log.timestamp).toLocaleString('tr-TR')}
                            </div>
                        </div>
                    `).reverse().join('')}
                </div>
            </div>
        ` : ''}
        
        ${renderNameQueryHistory(r.name)}
        
        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            ${r.status === 'pending' ? `
                <button class="btn btn-primary" onclick="markAsProcessed(${r.id}); closeDetailsModal();" style="background: #22c55e;">
                    <i data-lucide="check" style="margin-right: 0.5rem;"></i>
                    İşlendi Olarak İşaretle
                </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="closeDetailsModal()">Kapat</button>
        </div>
    `;

    modal.style.display = 'flex';
    lucide.createIcons();
}

function markAsProcessed(id) {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const index = reports.findIndex(r => r.id === id);
    if (index !== -1) {
        reports[index].status = 'processed';
        reports[index].processedDate = new Date().toISOString();
        reports[index].processedBy = getCurrentUser();

        // Activity log ekle
        if (!reports[index].activityLog) reports[index].activityLog = [];
        reports[index].activityLog.push({
            timestamp: new Date().toISOString(),
            user: getCurrentUser(),
            action: 'İşlendi olarak işaretlendi',
            details: `${getCurrentUser()} tarafından incelendi ve işlendi`
        });

        localStorage.setItem('SUSPICIOUS_REPORTS', JSON.stringify(reports));
        addSystemLog('Bildirim işlendi', `#${id.toString().slice(-6)} - ${getCurrentUser()} tarafından işlendi olarak işaretlendi`, 'report');
        renderPage('reports-admin');
        lucide.createIcons();
    }
}

function deleteReport(id) {
    if (!confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) return;
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem('SUSPICIOUS_REPORTS', JSON.stringify(filtered));
    renderPage('reports-admin');
    lucide.createIcons();
}

function exportReportsCSV() {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    if (reports.length === 0) { alert('Dışa aktarılacak bildirim yok.'); return; }

    const headers = ['No', 'Tarih', 'Şube', 'Personel', 'Şüpheli Kişi', 'TCKN', 'İşlem Türü', 'Tutar', 'Risk', 'Durum', 'Açıklama'];
    const rows = reports.map(r => [
        r.id, new Date(r.date).toLocaleString('tr-TR'), r.branch || '', r.reporter || '',
        r.name, r.tckn || '', r.type || '', r.amount || '', r.risk || '',
        r.status === 'pending' ? 'Bekliyor' : 'İşlendi', (r.description || '').replace(/"/g, '""')
    ]);

    let csv = headers.join(';') + '\n';
    rows.forEach(row => { csv += row.map(c => `"${c}"`).join(';') + '\n'; });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `supheli_islem_bildirimleri_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

function editReport(id) {
    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const r = reports.find(rep => rep.id === id);
    if (!r) return;

    const modal = document.getElementById('details-modal');
    const content = document.getElementById('details-content');

    content.innerHTML = `
        <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border);">
            <h2 style="margin: 0; color: var(--primary);">✏️ Bildirimi Düzenle</h2>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem;">Bildirim No: #${r.id.toString().slice(-6)}</div>
        </div>
        
        <form id="edit-report-form" onsubmit="saveEditedReport(event, ${r.id})">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Şube</label>
                    <input type="text" class="form-input" id="edit-branch" value="${r.branch || ''}" readonly style="background: #f1f5f9;">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Personel</label>
                    <input type="text" class="form-input" id="edit-reporter" value="${r.reporter || ''}" readonly style="background: #f1f5f9;">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Şüpheli Kişi/Kurum *</label>
                    <input type="text" class="form-input" id="edit-name" value="${r.name || ''}" required>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">TCKN/VKN</label>
                    <input type="text" class="form-input" id="edit-tckn" value="${r.tckn || ''}" maxlength="11">
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">İşlem Türü</label>
                    <select class="form-input" id="edit-type">
                        <option value="" ${!r.type ? 'selected' : ''}>Seçiniz...</option>
                        <option value="Yüksek Tutarlı Nakit İşlem" ${r.type === 'Yüksek Tutarlı Nakit İşlem' ? 'selected' : ''}>💵 Yüksek Tutarlı Nakit İşlem</option>
                        <option value="Şüpheli Para Transferi" ${r.type === 'Şüpheli Para Transferi' ? 'selected' : ''}>💸 Şüpheli Para Transferi</option>
                        <option value="Parçalı İşlem (Structuring)" ${r.type === 'Parçalı İşlem (Structuring)' ? 'selected' : ''}>📊 Parçalı İşlem (Structuring)</option>
                        <option value="Şüpheli Hesap Hareketi" ${r.type === 'Şüpheli Hesap Hareketi' ? 'selected' : ''}>📈 Şüpheli Hesap Hareketi</option>
                        <option value="Sahte/Şüpheli Kimlik" ${r.type === 'Sahte/Şüpheli Kimlik' ? 'selected' : ''}>🪪 Sahte/Şüpheli Kimlik</option>
                        <option value="Üçüncü Şahıs Adına İşlem" ${r.type === 'Üçüncü Şahıs Adına İşlem' ? 'selected' : ''}>👥 Üçüncü Şahıs Adına İşlem</option>
                        <option value="Olağandışı Davranış" ${r.type === 'Olağandışı Davranış' ? 'selected' : ''}>⚠️ Olağandışı Davranış</option>
                        <option value="Yaptırım Listesi Şüphesi" ${r.type === 'Yaptırım Listesi Şüphesi' ? 'selected' : ''}>🚫 Yaptırım Listesi Şüphesi</option>
                        <option value="Diğer" ${r.type === 'Diğer' ? 'selected' : ''}>📝 Diğer</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Risk Seviyesi</label>
                    <select class="form-input" id="edit-risk">
                        <option value="" ${!r.risk ? 'selected' : ''}>Seçiniz...</option>
                        <option value="Düşük" ${r.risk === 'Düşük' ? 'selected' : ''}>🟢 Düşük</option>
                        <option value="Orta" ${r.risk === 'Orta' ? 'selected' : ''}>🟡 Orta</option>
                        <option value="Yüksek" ${r.risk === 'Yüksek' ? 'selected' : ''}>🟠 Yüksek</option>
                        <option value="Kritik" ${r.risk === 'Kritik' ? 'selected' : ''}>🔴 Kritik</option>
                    </select>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">İşlem Tutarı (TL)</label>
                    <input type="number" class="form-input" id="edit-amount" value="${r.amount || ''}">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Durum</label>
                    <select class="form-input" id="edit-status">
                        <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>⏳ Bekliyor</option>
                        <option value="processed" ${r.status === 'processed' ? 'selected' : ''}>✅ İşlendi</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Açıklama</label>
                <textarea class="form-input" id="edit-description" rows="4">${r.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">İnceleme Notu (Uyum Birimi)</label>
                <textarea class="form-input" id="edit-notes" rows="3" placeholder="İnceleme sonucu, alınan aksiyonlar vb.">${r.reviewNotes || ''}</textarea>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                <button type="button" class="btn btn-secondary" onclick="closeDetailsModal()">İptal</button>
                <button type="submit" class="btn btn-primary">
                    <i data-lucide="save" style="margin-right: 0.5rem;"></i>
                    Kaydet
                </button>
            </div>
        </form>
    `;

    modal.style.display = 'flex';
    lucide.createIcons();
}

function saveEditedReport(event, id) {
    event.preventDefault();

    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return;

    const oldReport = { ...reports[index] }; // Eski değerleri sakla

    // Yeni değerleri al
    const newName = document.getElementById('edit-name').value;
    const newTckn = document.getElementById('edit-tckn').value;
    const newType = document.getElementById('edit-type').value;
    const newRisk = document.getElementById('edit-risk').value;
    const newAmount = document.getElementById('edit-amount').value;
    const newStatus = document.getElementById('edit-status').value;
    const newDescription = document.getElementById('edit-description').value;
    const newNotes = document.getElementById('edit-notes').value;

    // Değişiklikleri tespit et
    const changes = [];
    if (oldReport.name !== newName) changes.push(`İsim: "${oldReport.name}" → "${newName}"`);
    if (oldReport.tckn !== newTckn) changes.push(`TCKN: "${oldReport.tckn || '-'}" → "${newTckn || '-'}"`);
    if (oldReport.type !== newType) changes.push(`İşlem Türü: "${oldReport.type}" → "${newType}"`);
    if (oldReport.risk !== newRisk) changes.push(`Risk: "${oldReport.risk}" → "${newRisk}"`);
    if (oldReport.amount !== newAmount) changes.push(`Tutar: "${oldReport.amount || '-'}" → "${newAmount || '-'}"`);
    if (oldReport.status !== newStatus) changes.push(`Durum: "${oldReport.status === 'pending' ? 'Bekliyor' : 'İşlendi'}" → "${newStatus === 'pending' ? 'Bekliyor' : 'İşlendi'}"`);
    if (oldReport.description !== newDescription) changes.push(`Açıklama güncellendi`);
    if ((oldReport.reviewNotes || '') !== newNotes) {
        if (!oldReport.reviewNotes && newNotes) changes.push(`İnceleme notu eklendi`);
        else if (oldReport.reviewNotes && !newNotes) changes.push(`İnceleme notu silindi`);
        else changes.push(`İnceleme notu güncellendi`);
    }

    // Değerleri güncelle
    reports[index].name = newName;
    reports[index].tckn = newTckn;
    reports[index].type = newType;
    reports[index].risk = newRisk;
    reports[index].amount = newAmount;
    reports[index].status = newStatus;
    reports[index].description = newDescription;
    reports[index].reviewNotes = newNotes;
    reports[index].lastUpdated = new Date().toISOString();
    reports[index].lastUpdatedBy = getCurrentUser();

    // Activity log ekle
    if (!reports[index].activityLog) reports[index].activityLog = [];

    const logDetails = changes.length > 0 ? changes.join(' | ') : 'Değişiklik yok';

    reports[index].activityLog.push({
        timestamp: new Date().toISOString(),
        user: getCurrentUser(),
        action: 'Bildirim düzenlendi',
        details: logDetails
    });

    localStorage.setItem('SUSPICIOUS_REPORTS', JSON.stringify(reports));
    addSystemLog('Bildirim düzenlendi', `#${id.toString().slice(-6)} tarafından ${getCurrentUser()} | ${logDetails}`, 'report');
    closeDetailsModal();
    renderPage('reports-admin');
    lucide.createIcons();
    alert('Bildirim güncellendi!');
}

function submitSuspiciousReport(event) {
    event.preventDefault();

    // Dosya bilgilerini al (file içeriklerini değil, sadece meta bilgileri)
    const fileInput = document.getElementById('report-evidence');
    const evidenceFiles = [];
    if (fileInput.files.length > 0) {
        for (let i = 0; i < Math.min(fileInput.files.length, 5); i++) {
            evidenceFiles.push({
                name: fileInput.files[i].name,
                size: fileInput.files[i].size,
                type: fileInput.files[i].type
            });
        }
    }

    const report = {
        id: Date.now(),
        date: new Date().toISOString(),
        branch: document.getElementById('report-branch').value,
        reporter: document.getElementById('report-reporter').value,
        name: document.getElementById('report-name').value,
        tckn: document.getElementById('report-tckn').value,
        account: document.getElementById('report-account').value,
        phone: document.getElementById('report-phone').value,
        type: document.getElementById('report-type').value,
        risk: document.getElementById('report-risk').value,
        transactionDate: document.getElementById('report-date').value,
        amount: document.getElementById('report-amount').value,
        description: document.getElementById('report-description').value,
        evidenceFiles: evidenceFiles,
        status: 'pending'
    };

    const reports = JSON.parse(localStorage.getItem('SUSPICIOUS_REPORTS') || '[]');
    reports.push(report);
    localStorage.setItem('SUSPICIOUS_REPORTS', JSON.stringify(reports));

    // Log kaydet
    addReportLog(report.id, 'Bildirim oluşturuldu', `${report.branch} - ${report.reporter} tarafından`);
    addSystemLog('Yeni şüpheli işlem bildirimi', `#${report.id.toString().slice(-6)} - ${report.name} - ${report.type}`, 'report');

    document.getElementById('report-status').innerHTML = `
        <div style="background: #dcfce7; color: #15803d; padding: 1.25rem; border-radius: 0.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
            <strong style="font-size: 1.1rem;">Bildiriminiz Başarıyla Kaydedildi!</strong>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Bildirim No: <strong>#${report.id.toString().slice(-6)}</strong></p>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #16a34a;">Uyum birimi en kısa sürede inceleyecektir.</p>
        </div>
    `;

    document.getElementById('report-form').reset();
    document.getElementById('evidence-preview').innerHTML = '';
}

function renderSettingsPage() {
    const masakData = localStorage.getItem('MASAK_LOCAL_DATA');
    const masakCount = masakData ? JSON.parse(masakData).length : 0;
    const masakLastUpdate = localStorage.getItem('MASAK_LAST_UPDATE') || '-';

    // Get global meta data for other sources
    const meta = window.SANCTIONS_META || {};
    const sources = meta.sources || { UN: {}, EU: {}, OFAC: {}, TR: {} };

    return `
        <div class="card">
            <h3>Veri Kaynakları ve Ayarlar</h3>
            <p style="color: var(--text-light); margin-bottom: 1.5rem;">Tarama yapılacak kaynakları buradan yönetebilirsiniz.</p>

            <!-- MASAK Upload Section (Styled like others) -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong>MASAK Veri Yükleme (Manuel)</strong>
                        <span style="font-size: 0.7rem; background: ${SanctionsDB.data && SanctionsDB.data.some(i => i.list.includes('MASAK')) ? '#f0fdf4' : '#fef2f2'}; color: ${SanctionsDB.data && SanctionsDB.data.some(i => i.list.includes('MASAK')) ? '#16a34a' : '#dc2626'}; padding: 0.1rem 0.4rem; border-radius: 0.25rem;">
                            ${SanctionsDB.data && SanctionsDB.data.some(i => i.list.includes('MASAK')) ? 'Aktif' : 'Veri Yok'}
                        </span>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                        Sistemde toplam ${SanctionsDB.data ? SanctionsDB.data.filter(i => i.list.includes('MASAK')).length.toLocaleString() : 0} MASAK kaydı bulunuyor.
                    </p>
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <label for="masak-upload" class="btn btn-sm btn-outline-primary" style="cursor: pointer; display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border: 1px solid var(--primary); border-radius: 0.25rem; color: var(--primary); font-size: 0.8rem;">
                            <i data-lucide="upload" style="width: 14px; height: 14px; margin-right: 0.25rem;"></i> Dosya Yükle (Excel/CSV)
                        </label>
                        <input type="file" id="masak-upload" accept=".csv, .xlsx, .xls" multiple onchange="handleMasakUpload(this)" style="display: none;">
                        
                        <button class="btn btn-sm btn-outline-danger" onclick="if(confirm('Manuel yüklenen verileri temizlemek istediğinize emin misiniz?')) { localStorage.removeItem('MASAK_LOCAL_DATA'); localStorage.removeItem('MASAK_LAST_UPDATE'); window.location.reload(); }" style="display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border: 1px solid var(--danger); border-radius: 0.25rem; color: var(--danger); background: none; font-size: 0.8rem; cursor: pointer;">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; margin-right: 0.25rem;"></i> Temizle
                        </button>
                    </div>
                    <div id="masak-upload-status" style="font-size: 0.8rem; margin-top: 0.25rem;"></div>
                </div>
                <label class="switch">
                    <input type="checkbox" ${state.activeSources.MASAK ? 'checked' : ''} onchange="toggleSource('MASAK')">
                    <span class="slider round"></span>
                </label>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>TR Resmi Gazete</strong>
                    <p style="font-size: 0.8rem; color: var(--text-light);">Malvarlığı Dondurma Kararları</p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                        Sistemde toplam ${sources.TR ? (sources.TR.count || 0).toLocaleString() : 0} karar bulunuyor.
                    </p>
                </div>
                <label class="switch">
                    <input type="checkbox" ${state.activeSources.TR ? 'checked' : ''} onchange="toggleSource('TR')">
                    <span class="slider round"></span>
                </label>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>BM Konsolide Listesi</strong>
                    <p style="font-size: 0.8rem; color: var(--text-light);">Birleşmiş Milletler Güvenlik Konseyi</p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                        Sistemde toplam ${sources.UN ? (sources.UN.count || 0).toLocaleString() : 0} kayıt bulunuyor.
                    </p>
                </div>
                <label class="switch">
                    <input type="checkbox" ${state.activeSources.UN ? 'checked' : ''} onchange="toggleSource('UN')">
                    <span class="slider round"></span>
                </label>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>AB Finansal Yaptırımlar</strong>
                    <p style="font-size: 0.8rem; color: var(--text-light);">Avrupa Birliği Komisyonu</p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                        Sistemde toplam ${sources.EU ? (sources.EU.count || 0).toLocaleString() : 0} kayıt bulunuyor.
                    </p>
                </div>
                <label class="switch">
                    <input type="checkbox" ${state.activeSources.EU ? 'checked' : ''} onchange="toggleSource('EU')">
                    <span class="slider round"></span>
                </label>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>OFAC SDN Listesi</strong>
                    <p style="font-size: 0.8rem; color: var(--text-light);">ABD Hazine Bakanlığı</p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                        Sistemde toplam ${sources.OFAC ? (sources.OFAC.count || 0).toLocaleString() : 0} kayıt bulunuyor.
                    </p>
                </div>
                <label class="switch">
                    <input type="checkbox" ${state.activeSources.OFAC ? 'checked' : ''} onchange="toggleSource('OFAC')">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>
    `;
}

function performManualScan() {
    const nameInput = document.getElementById('scan-input-name').value.trim();
    const tcknInput = document.getElementById('scan-input-tckn').value.trim();

    if (!nameInput && !tcknInput) {
        return alert('Lütfen İsim veya TCKN girin.');
    }

    let results = [];
    let matchType = 'NAME_SIMILAR'; // Default

    // Normalize query name
    const qNameNorm = SanctionsDB.normalizeString(nameInput.toLocaleLowerCase('tr-TR'));

    // 1. Search by TCKN if provided
    if (tcknInput) {
        const tcknResults = SanctionsDB.search(tcknInput);
        if (tcknResults.length > 0) {
            // TCKN Match Found
            results = tcknResults;
            const topMatch = results[0];
            const rNameNorm = SanctionsDB.normalizeString((topMatch.name || '').toLocaleLowerCase('tr-TR'));

            // Calculate Name Score
            let nameScore = 0;
            if (nameInput) {
                if (qNameNorm === rNameNorm) {
                    nameScore = 1.0;
                } else {
                    nameScore = SanctionsDB.calculateSimilarity(qNameNorm, rNameNorm);
                }
            }

            if (nameScore >= 0.95) {
                matchType = 'TCKN_NAME_EXACT';
            } else if (nameScore >= 0.60) {
                matchType = 'TCKN_NAME_SIMILAR';
            } else {
                matchType = 'TCKN';
            }

            // Force score to 1.0 for TCKN matches
            results.forEach(r => r.score = 1.0);
        }
    }

    // 2. Search by Name if no TCKN match found
    if (results.length === 0 && nameInput) {
        let nameResults = SanctionsDB.search(nameInput);

        // Strict TCKN Check
        if (tcknInput) {
            nameResults = nameResults.filter(r => {
                if (!r.tckn) return true;
                return String(r.tckn).trim() === String(tcknInput).trim();
            });
        }

        results = nameResults;

        if (results.length > 0) {
            const topMatch = results[0];
            const rNameNorm = SanctionsDB.normalizeString((topMatch.name || '').toLocaleLowerCase('tr-TR'));

            if (qNameNorm === rNameNorm) {
                matchType = 'NAME_EXACT';
                topMatch.score = 1.0;
            } else if (topMatch.score >= 0.95) {
                matchType = 'NAME_EXACT';
            } else {
                matchType = 'NAME_SIMILAR';
            }
        }
    }

    // Filter results based on active sources
    results = results.filter(r => {
        if (r.list.includes('UN') && !state.activeSources.UN) return false;
        if (r.list.includes('EU') && !state.activeSources.EU) return false;
        if (r.list.includes('OFAC') && !state.activeSources.OFAC) return false;
        if (r.list.includes('Resmi Gazete') && !state.activeSources.TR) return false;
        if (r.list.includes('MASAK') && !state.activeSources.MASAK) return false;
        return true;
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    const resultArea = document.getElementById('scan-result-area');
    resultArea.style.display = 'block';

    // Format results for display
    const queryDisplay = [nameInput, tcknInput].filter(Boolean).join(' / ');

    const formattedResults = results.map(r => {
        let details = r.sourceDetails || '-';
        // Add TCKN match info to details if applicable
        if (matchType.startsWith('TCKN')) {
            details = `✅ <strong>TCKN Eşleşmesi</strong><br>${details}`;
        }

        return {
            ...r, // COPY ALL FIELDS FROM ORIGINAL RECORD (including Excel columns)
            queryName: nameInput,
            queryTckn: tcknInput,
            matchName: r.name,
            matchTckn: r.tckn,
            matchList: r.list,
            score: r.score,
            sourceDetails: r.sourceDetails,
            details: details,
            decreeUrl: r.decreeUrl,
            matchType: matchType,
            // Legacy fields for compatibility
            query: queryDisplay,
            match: r.name,
            list: r.list,
            tckn: tcknInput
        };
    });

    // Store for modal
    state.currentBulkResults = formattedResults;
    state.currentManualResults = formattedResults;

    if (results.length > 0) {
        state.stats.matchesFound += results.length;
        state.stats.totalScanned += 1;
        state.stats.lastScanDate = new Date().toLocaleString('tr-TR');

        // MASAK Uyum Log - Eşleşme Bulundu
        const matchDetails = results.map(r => `${r.name} (${r.list}, %${Math.round(r.score * 100)})`).join('; ');
        addSystemLog('Yaptırım Tarama - EŞLEŞME',
            `Sorgu: "${queryDisplay}" | Eşleşme: ${results.length} kayıt | Sonuç: ${matchDetails}`,
            'scan');

        // Add to history
        results.forEach(r => {
            state.scanResults.unshift({
                date: new Date().toLocaleString('tr-TR'),
                query: queryDisplay,
                match: r.name,
                source: r.list,
                score: Math.round(r.score * 100),
                details: r.sourceDetails || '-',
                decreeUrl: r.decreeUrl
            });
        });

        // Store for download
        window.lastBulkResults = formattedResults;

        // Use the same renderer as bulk results to get the filter UI
        renderBulkResultsWithFilter(formattedResults);
    } else {
        state.stats.totalScanned += 1;
        state.stats.lastScanDate = new Date().toLocaleString('tr-TR');

        // MASAK Uyum Log - Temiz
        addSystemLog('Yaptırım Tarama - TEMİZ',
            `Sorgu: "${queryDisplay}" | Sonuç: Eşleşme bulunamadı`,
            'scan');

        const resultList = document.getElementById('manual-scan-results');
        resultList.innerHTML = `
            <div style="background-color: #dcfce7; color: #15803d; padding: 1rem; border-radius: 0.5rem;">
                <strong>✅ Temiz</strong>
                <p>Herhangi bir eşleşme bulunamadı.</p>
            </div>
        `;
    }

    lucide.createIcons();
}

async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const statusDiv = document.getElementById('upload-status');
    statusDiv.innerHTML = `<span style="color: var(--info);"><i data-lucide="loader" class="spin"></i> Dosya okunuyor: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...</span>`;
    lucide.createIcons();

    // 1. Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        statusDiv.innerHTML = `<span style="color: var(--danger);">Hata: Excel okuma kütüphanesi (SheetJS) yüklenemedi. Lütfen sayfayı yenileyin veya internet bağlantınızı kontrol edin.</span>`;
        return;
    }

    try {
        let data = [];
        const startTime = Date.now();

        if (file.name.endsWith('.pdf')) {
            data = await readPdfFile(file);
        } else {
            // Add timeout race
            const readPromise = readExcelFile(file);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Dosya okuma zaman aşımına uğradı (10 saniye). Dosya çok büyük veya bozuk olabilir.")), 10000)
            );

            data = await Promise.race([readPromise, timeoutPromise]);
        }

        // Dosya yükleme logu
        addSystemLog('Dosya yüklendi', `${file.name} (${(file.size / 1024).toFixed(1)} KB) - ${data.length} kayıt`, 'scan');

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        statusDiv.innerHTML = `
            <div style="margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.9rem; font-weight: 500;">Taranıyor...</span>
                    <span id="scan-progress-text" style="font-size: 0.9rem;">0%</span>
                </div>
                <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                    <div id="scan-progress-bar" style="width: 0%; height: 100%; background: var(--primary); transition: width 0.2s;"></div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">
                    ${data.length} kayıt taranıyor. Lütfen bekleyin.
                </div>
            </div>
        `;

        // Perform Bulk Scan (Async with Progress)
        const results = await performBulkScanAsync(data, (progress) => {
            const percent = Math.round(progress * 100);
            document.getElementById('scan-progress-bar').style.width = `${percent}%`;
            document.getElementById('scan-progress-text').textContent = `${percent}%`;
        });

        // Toplu tarama sonuç logu
        if (results.length > 0) {
            const matchNames = results.slice(0, 5).map(r => r.match).join(', ') + (results.length > 5 ? '...' : '');
            addSystemLog('Toplu Tarama - EŞLEŞME',
                `Dosya: ${file.name} | Taranan: ${data.length} | Eşleşme: ${results.length} | Sonuçlar: ${matchNames}`,
                'scan');
        } else {
            addSystemLog('Toplu Tarama - TEMİZ',
                `Dosya: ${file.name} | Taranan: ${data.length} | Sonuç: Eşleşme bulunamadı`,
                'scan');
        }

        statusDiv.innerHTML = `<span style="color: var(--success);">✅ Tamamlandı: ${results.length} eşleşme bulundu.</span>`;
        renderBulkResults(results);

    } catch (e) {
        console.error("Error:", e);
        addSystemLog('Dosya yükleme hatası', `${file.name} - ${e.message}`, 'error');
        statusDiv.innerHTML = `<span style="color: var(--danger);">Hata: ${e.message}</span>`;
    }
}

function performBulkScanAsync(inputs, onProgress) {
    return new Promise((resolve) => {
        const allResults = [];
        let matchCount = 0;
        const total = inputs.length;
        const chunkSize = 50; // Process 50 items at a time
        let index = 0;

        function processChunk() {
            const end = Math.min(index + chunkSize, total);

            for (let i = index; i < end; i++) {
                const input = inputs[i];
                const name = typeof input === 'object' ? input.name : input;
                const tckn = typeof input === 'object' ? input.tckn : null;

                let results = [];
                let matchType = 'NAME_SIMILAR'; // Default fallback

                // Normalize query name for comparison
                const qNameNorm = SanctionsDB.normalizeString(name.toLocaleLowerCase('tr-TR'));

                // A. Search by TCKN if available
                if (tckn) {
                    results = SanctionsDB.search(tckn);
                    if (results.length > 0) {
                        // TCKN Match Found. Now check Name similarity for better classification.
                        const topMatch = results[0];
                        const rNameNorm = SanctionsDB.normalizeString((topMatch.name || '').toLocaleLowerCase('tr-TR'));

                        // Calculate Name Score
                        let nameScore = 0;
                        if (qNameNorm === rNameNorm) {
                            nameScore = 1.0;
                        } else {
                            nameScore = SanctionsDB.calculateSimilarity(qNameNorm, rNameNorm);
                        }

                        if (nameScore >= 0.95) {
                            matchType = 'TCKN_NAME_EXACT';
                        } else if (nameScore >= 0.60) {
                            matchType = 'TCKN_NAME_SIMILAR';
                        } else {
                            matchType = 'TCKN';
                        }

                        // Force score to 1.0 because TCKN is unique identifier
                        results.forEach(r => r.score = 1.0);
                    }
                }

                // B. Search by Name if no TCKN match found
                if (results.length === 0) {
                    let nameResults = SanctionsDB.search(name);

                    // Strict TCKN Check
                    if (tckn) {
                        nameResults = nameResults.filter(r => {
                            if (!r.tckn) return true;
                            return String(r.tckn).trim() === String(tckn).trim();
                        });
                    }

                    results = nameResults;

                    if (results.length > 0) {
                        const topMatch = results[0];
                        const rNameNorm = SanctionsDB.normalizeString((topMatch.name || '').toLocaleLowerCase('tr-TR'));

                        // Check for Exact Match manually to be sure
                        if (qNameNorm === rNameNorm) {
                            matchType = 'NAME_EXACT';
                            topMatch.score = 1.0; // Ensure score is 1.0
                        } else if (topMatch.score >= 0.95) {
                            matchType = 'NAME_EXACT';
                        } else {
                            matchType = 'NAME_SIMILAR';
                        }
                    }
                }

                // Filter Sources
                results = results.filter(r => {
                    if (r.list.includes('UN') && !state.activeSources.UN) return false;
                    if (r.list.includes('EU') && !state.activeSources.EU) return false;
                    if (r.list.includes('OFAC') && !state.activeSources.OFAC) return false;
                    if (r.list.includes('Resmi Gazete') && !state.activeSources.TR) return false;
                    if (r.list.includes('MASAK') && !state.activeSources.MASAK) return false;
                    return true;
                });

                if (results.length > 0) {
                    matchCount++;
                    const topMatch = results[0];

                    let details = topMatch.sourceDetails || '-';

                    allResults.push({
                        ...topMatch, // COPY ALL FIELDS FROM ORIGINAL RECORD
                        queryName: name,
                        queryTckn: tckn,
                        matchName: topMatch.name,
                        matchTckn: topMatch.tckn,
                        matchList: topMatch.list,
                        score: topMatch.score,
                        matchType: matchType,
                        sourceDetails: topMatch.sourceDetails || '-',
                        details: details,
                        decreeUrl: topMatch.decreeUrl,
                        // Legacy fields
                        query: name,
                        tckn: tckn,
                        match: topMatch.name,
                        list: topMatch.list,
                        name: topMatch.name
                    });

                    // Add to history (only top 100 to avoid memory issues)
                    if (state.scanResults.length < 100) {
                        state.scanResults.unshift({
                            date: new Date().toLocaleString('tr-TR'),
                            query: name + (tckn ? ` (TCKN: ${tckn})` : ''),
                            match: topMatch.name,
                            source: topMatch.list,
                            score: Math.round(topMatch.score * 100),
                            details: details,
                            decreeUrl: topMatch.decreeUrl
                        });
                    }
                }
            }

            index = end;
            if (onProgress) onProgress(index / total);

            if (index < total) {
                // Schedule next chunk
                setTimeout(processChunk, 0);
            } else {
                // Done
                state.stats.totalScanned += total;
                state.stats.matchesFound += matchCount;
                state.stats.lastScanDate = new Date().toLocaleString('tr-TR');
                resolve(allResults);
            }
        }

        processChunk();
    });
}

function performBulkScan(inputs) {
    // Legacy sync wrapper - not recommended for large files
    return [];
}

async function handleMasakUpload(input) {
    const files = input.files;
    if (!files || files.length === 0) return;

    const statusDiv = document.getElementById('masak-upload-status');
    statusDiv.innerHTML = `<span style="color: var(--info);">Dosyalar okunuyor...</span>`;

    let allRecords = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const text = await readFileWithEncoding(file, 'windows-1254'); // Try Turkish encoding
            const records = parseMasakCsv(text, file.name);
            allRecords = allRecords.concat(records);
            processedCount++;
        } catch (e) {
            console.error(`Error reading ${file.name}:`, e);
        }
    }

    if (allRecords.length > 0) {
        try {
            localStorage.setItem('MASAK_LOCAL_DATA', JSON.stringify(allRecords));
            localStorage.setItem('MASAK_LAST_UPDATE', new Date().toLocaleString('tr-TR'));

            statusDiv.innerHTML = `<span style="color: var(--success);">✅ ${allRecords.length} kayıt başarıyla yüklendi ve kaydedildi. Sayfa yenileniyor...</span>`;

            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (e) {
            statusDiv.innerHTML = `<span style="color: var(--danger);">Hata: Veri çok büyük, kaydedilemedi. (${e.message})</span>`;
        }
    } else {
        statusDiv.innerHTML = `<span style="color: var(--warning);">Hiçbir kayıt okunamadı.</span>`;
    }
}

async function fetchFromCRM() {
    const statusDiv = document.getElementById('upload-status');
    statusDiv.innerHTML = `<span style="color: var(--info);"><i class="fas fa-spinner fa-spin"></i> CRM Sistemine Bağlanılıyor...</span>`;

    // Simulate API Call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        // Mock CRM Data (In production, this would be fetch('/api/crm/customers'))
        const mockCrmData = [
            { tckn: '11111111111', name: 'Ahmet Yılmaz', type: 'Bireysel' },
            { tckn: '22222222222', name: 'Ayşe Demir', type: 'Bireysel' },
            { tckn: '33333333333', name: 'Mega İnşaat A.Ş.', type: 'Kurumsal' }
        ];

        addSystemLog('CRM Entegrasyonu', `${mockCrmData.length} müşteri kaydı çekildi`, 'general');

        // Scan them
        const results = await performBulkScanAsync(mockCrmData);
        renderBulkResults(results);
        statusDiv.innerHTML = `<span style="color: var(--success);">CRM Taraması Tamamlandı: ${results.length} eşleşme.</span>`;

    } catch (e) {
        statusDiv.innerHTML = `<span style="color: var(--danger);">CRM Bağlantı Hatası</span>`;
    }
}

// Embedded Mode Check
document.addEventListener('DOMContentLoaded', () => {
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
});


// --- File Reading & Parsing ---

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                if (!worksheet['!ref']) {
                    throw new Error("Excel sayfası boş.");
                }

                // Convert to JSON with header detection
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

                if (json.length === 0) {
                    throw new Error("Dosya boş.");
                }

                // Find Header Row
                let headerRowIdx = -1;
                let colMap = { name: -1, tckn: -1 };

                // Look for headers in first 10 rows
                for (let i = 0; i < Math.min(json.length, 10); i++) {
                    const row = json[i];
                    if (!Array.isArray(row)) continue;

                    const rowStr = row.map(c => String(c).toUpperCase()).join(' ');

                    // Check for Name keywords
                    if (rowStr.includes('AD') || rowStr.includes('İSİM') || rowStr.includes('ISIM') || rowStr.includes('NAME') || rowStr.includes('UNVAN') || rowStr.includes('MÜŞTERİ')) {
                        headerRowIdx = i;

                        // Map columns
                        row.forEach((cell, idx) => {
                            const c = String(cell).toUpperCase().trim();
                            // Expanded Name Keywords
                            if (c.includes('AD') || c.includes('İSİM') || c.includes('ISIM') || c.includes('NAME') || c.includes('UNVAN') || c.includes('MÜŞTERİ') || c.includes('MUSTERI') || c.includes('ALICI') || c.includes('BORÇLU')) {
                                if (colMap.name === -1) colMap.name = idx;
                            }
                            // Expanded TCKN Keywords
                            if (c.includes('TCKN') || c.includes('VKN') || c.includes('KİMLİK') || c.includes('KIMLIK') || c.includes('VERGİ') || c.includes('VERGI') || c.includes('TC NO') || c.includes('PASAPORT') || c.includes('SİCİL') || c.includes('SICIL')) {
                                colMap.tckn = idx;
                            }
                        });
                        break;
                    }
                }

                const parsedData = [];

                if (headerRowIdx !== -1 && colMap.name !== -1) {
                    // Structured Data Found
                    for (let i = headerRowIdx + 1; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length === 0) continue;

                        const name = row[colMap.name] ? String(row[colMap.name]).trim() : '';

                        // Smart TCKN Extraction
                        let tcknRaw = colMap.tckn !== -1 && row[colMap.tckn] ? String(row[colMap.tckn]) : null;
                        let tckn = null;
                        if (tcknRaw) {
                            const match = tcknRaw.match(/\b\d{10,11}\b/);
                            if (match) tckn = match[0];
                        }

                        if (name.length > 1) {
                            parsedData.push({ name, tckn });
                        }
                    }
                } else {
                    // Fallback: Flatten all cells (Legacy Mode)
                    json.forEach(row => {
                        if (Array.isArray(row)) {
                            row.forEach(cell => {
                                if (typeof cell === 'string' || typeof cell === 'number') {
                                    const val = String(cell).trim();
                                    if (val.length > 2 && !/^\d+$/.test(val)) {
                                        parsedData.push({ name: val, tckn: null });
                                    }
                                }
                            });
                        }
                    });
                }
                resolve(parsedData);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function readPdfFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    const items = textContent.items.map(item => ({
                        str: item.str,
                        y: item.transform[5],
                        x: item.transform[4],
                        hasEOL: item.hasEOL
                    }));

                    // Simple text extraction (can be improved)
                    fullText += items.map(item => item.str).join(' ') + "\n";
                }

                const lines = fullText.split(/[\n\r]+/)
                    .map(l => l.trim())
                    .filter(l => l.length > 3)
                    .filter(l => !l.match(/^(sayfa|page)\s+\d+/i));

                let parsedData = [];

                lines.forEach(line => {
                    // TCKN Regex (11 digits)
                    const tcknMatch = line.match(/\b[1-9][0-9]{10}\b/);
                    let tckn = tcknMatch ? tcknMatch[0] : null;

                    // Clean name: Remove TCKN, Dates, Numbers
                    let name = line;
                    if (tckn) name = name.replace(tckn, '');

                    // Remove dates (DD.MM.YYYY or DD/MM/YYYY)
                    name = name.replace(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g, '');

                    // Remove sequence numbers at start (e.g. "1. Ahmet")
                    name = name.replace(/^\d+[.)]\s*/, '');

                    // Remove extra whitespace
                    name = name.replace(/\s+/g, ' ').trim();

                    if (name.length > 2) {
                        parsedData.push({
                            name: name,
                            tckn: tckn,
                            originalLine: line
                        });
                    }
                });

                resolve(parsedData);
            } catch (err) {
                reject(new Error("PDF okunamadı: " + err.message));
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function readFileWithEncoding(file, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, encoding);
    });
}

async function handleMasakUpload(input) {
    const files = input.files;
    if (!files || files.length === 0) return;

    const statusDiv = document.getElementById('masak-upload-status');
    statusDiv.innerHTML = '<span style="color: var(--primary);"><i data-lucide="loader-2" class="spin"></i> Dosyalar işleniyor...</span>';
    lucide.createIcons();

    let allData = [];
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            let data = [];
            if (file.name.endsWith('.csv')) {
                const text = await readFileWithEncoding(file, 'UTF-8');
                data = parseMasakCsv(text, file.name);
            } else if (file.name.match(/\.xlsx?$/)) {
                data = await readXlsxFile(file);
            }

            if (data && data.length > 0) {
                allData = allData.concat(data);
                processedCount++;
            }
        } catch (e) {
            console.error("Error processing file:", file.name, e);
            errorCount++;
        }
    }

    if (allData.length > 0) {
        try {
            // Merge with existing if needed, but user asked to clear usually. 
            // Here we overwrite for simplicity as per "Temizle" button logic implies single source of truth or manual management.
            // But if multiple files selected, we concat.

            localStorage.setItem('MASAK_LOCAL_DATA', JSON.stringify(allData));
            const now = new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR');
            localStorage.setItem('MASAK_LAST_UPDATE', now);

            statusDiv.innerHTML = `<span style="color: green;">✅ ${allData.length} kayıt başarıyla yüklendi! Sayfa yenileniyor...</span>`;
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            statusDiv.innerHTML = `<span style="color: red;">❌ Kayıt hatası: ${e.message} (Kota aşımı olabilir)</span>`;
        }
    } else {
        statusDiv.innerHTML = `<span style="color: red;">❌ Hiçbir dosyadan veri okunamadı.</span>`;
    }
}

function readXlsxFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (!jsonData || jsonData.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = jsonData[0].map(h => String(h).trim().toUpperCase());

                const colMap = {
                    name: headers.findIndex(h => h.includes('AD-SOYAD') || h.includes('GERÇEK/TÜZEL') || h.includes('ADI SOYADI') || h.includes('UNVANI') || h.includes('ISIM')),
                    tckn: headers.findIndex(h => h.includes('TCKN') || h.includes('VKN') || h.includes('PASAPORT') || h.includes('KIMLIK') || h.includes('SİCİL')),
                    nationality: headers.findIndex(h => h.includes('UYRU')),
                    dob: headers.findIndex(h => h.includes('DOĞUM TARİHİ') || h.includes('DOGUM TARIHI')),
                    pob: headers.findIndex(h => h.includes('DOĞUM YERİ') || h.includes('DOGUM YERI')),
                    mother: headers.findIndex(h => h.includes('ANNE ADI')),
                    father: headers.findIndex(h => h.includes('BABA ADI')),
                    org: headers.findIndex(h => h.includes('ÖRGÜT') || h.includes('ORGUT') || h.includes('BAĞLANTILI')),
                    listType: headers.findIndex(h => h.includes('YAPTIRIM TÜRÜ') || h.includes('YAPTIRIM TURU')),
                    decree: headers.findIndex(h => h.includes('KARAR SAYISI') || h.includes('RESMİ GAZETE') || h.includes('RESMI GAZETE'))
                };

                const records = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const name = colMap.name > -1 ? row[colMap.name] : '';
                    if (!name) continue;

                    const record = {
                        name: String(name).trim(),
                        list: 'TR MASAK (Yurtiçi)',
                        type: 'Individual',
                        score: 0,
                        sourceDetails: '',
                        tckn: '',
                        decreeUrl: ''
                    };

                    let details = [];
                    const getVal = (idx) => (idx > -1 && row[idx]) ? String(row[idx]).trim() : '';

                    const tcknVal = getVal(colMap.tckn);
                    if (tcknVal) {
                        record.tckn = tcknVal;
                        details.push(`TCKN/VKN: ${tcknVal}`);
                    }

                    // Add all columns to details
                    headers.forEach((h, idx) => {
                        const val = getVal(idx);
                        if (val) {
                            // Add to record object dynamically for full visibility
                            // Normalize header to key if possible, or just keep it in sourceDetails
                            details.push(`${h}: ${val}`);
                            // Also add to record for spread operator to pick up
                            record[h] = val;
                        }
                    });

                    record.sourceDetails = details.join(' | ');
                    records.push(record);
                }
                resolve(records);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseMasakCsv(text, filename) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = headerLine.split(';').map(h => h.trim().toUpperCase());

    const colMap = {
        name: headers.findIndex(h => h.includes('AD-SOYAD') || h.includes('GERÇEK/TÜZEL') || h.includes('ADI SOYADI') || h.includes('UNVANI')),
        tckn: headers.findIndex(h => h.includes('TCKN') || h.includes('VKN') || h.includes('PASAPORT')),
        nationality: headers.findIndex(h => h.includes('UYRU')),
        dob: headers.findIndex(h => h.includes('DOĞUM TARİHİ') || h.includes('DOGUM TARIHI')),
        pob: headers.findIndex(h => h.includes('DOĞUM YERİ') || h.includes('DOGUM YERI')),
        mother: headers.findIndex(h => h.includes('ANNE ADI')),
        father: headers.findIndex(h => h.includes('BABA ADI')),
        org: headers.findIndex(h => h.includes('ÖRGÜT') || h.includes('ORGUT') || h.includes('BAĞLANTILI')),
        listType: headers.findIndex(h => h.includes('YAPTIRIM TÜRÜ') || h.includes('YAPTIRIM TURU')),
        decree: headers.findIndex(h => h.includes('KARAR SAYISI') || h.includes('RESMİ GAZETE') || h.includes('RESMI GAZETE'))
    };

    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple split (assuming no semicolons in fields)
        const parts = line.split(';');
        if (parts.length < 2) continue;

        const name = colMap.name > -1 ? parts[colMap.name] : '';
        if (!name || name.length < 2) continue;

        const record = {
            name: name.replace(/"/g, '').trim(),
            list: 'TR MASAK (Yurtiçi)',
            type: 'Individual',
            score: 0,
            sourceDetails: '',
            tckn: '',
            decreeUrl: ''
        };

        // Determine List Name
        if (filename.includes('IC-DONDURMA')) {
            record.list = 'TR MASAK - İç Dondurma';
        } else if (filename.includes('BIRLESMIS-MILLETLER')) {
            record.list = 'TR MASAK - BMGK';
        } else if (filename.includes('YABANCI-ULKE')) {
            record.list = 'TR MASAK - Yabancı Ülke';
        }

        let details = [];

        const getVal = (idx) => (idx > -1 && parts[idx]) ? parts[idx].trim().replace(/"/g, '') : '';

        const tckn = getVal(colMap.tckn);
        if (tckn) {
            record.tckn = tckn;
            details.push(`TCKN/VKN: ${tckn}`);
        }

        const nat = getVal(colMap.nationality);
        if (nat) details.push(`Uyruk: ${nat}`);

        const dob = getVal(colMap.dob);
        if (dob) details.push(`Doğum Tarihi: ${dob}`);

        const pob = getVal(colMap.pob);
        if (pob) details.push(`Doğum Yeri: ${pob}`);

        const mother = getVal(colMap.mother);
        if (mother) details.push(`Anne Adı: ${mother}`);

        const father = getVal(colMap.father);
        if (father) details.push(`Baba Adı: ${father}`);

        const org = getVal(colMap.org);
        if (org) details.push(`Örgüt: ${org}`);

        const decree = getVal(colMap.decree);
        if (decree) details.push(`Karar: ${decree}`);

        record.sourceDetails = details.join('\n');
        records.push(record);
    }

    return records;
}

function downloadResults(results, filename = 'tarama_sonuclari') {
    if (!results || results.length === 0) return alert('İndirilecek sonuç yok.');

    const data = results.map(r => ({
        'Tarih': new Date().toLocaleString('tr-TR'),
        'Aranan İsim': r.query || r.name,
        'Eşleşen Kayıt': r.match || r.name,
        'Liste': r.list || r.source,
        'Detaylar': (r.details || r.sourceDetails || '').replace(/<[^>]*>/g, ''),
        'Benzerlik Oranı': '%' + Math.round(r.score * 100 || r.score)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sonuçlar");
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function renderBulkResults(results) {
    const resultArea = document.getElementById('scan-result-area');
    const resultList = document.getElementById('manual-scan-results');

    resultArea.style.display = 'block';

    // Store for modal and filtering
    state.currentBulkResults = results;
    state.pagination.currentPage = 1; // Reset pagination

    if (results.length === 0) {
        resultList.innerHTML = `
            <div style="background-color: #dcfce7; color: #15803d; padding: 1rem; border-radius: 0.5rem;">
                <strong>✅ Temiz</strong>
                <p>Yüklenen dosyada herhangi bir eşleşme bulunamadı.</p>
            </div>
        `;
        return;
    }

    // Store results globally
    window.lastBulkResults = results;

    // Initial Render with default threshold (e.g. 0 or whatever was found)
    // We will wrap the table in a container that includes the filter controls
    renderBulkResultsWithFilter(results);
}

function renderBulkResultsWithFilter(results) {
    const resultArea = document.getElementById('scan-result-area');
    const resultList = document.getElementById('manual-scan-results');

    // Ensure result area is visible
    if (resultArea) {
        resultArea.style.display = 'block';
    }

    // Store for modal and filtering (in case called directly without renderBulkResults)
    state.currentBulkResults = results;
    state.pagination.currentPage = 1;

    // Create Filter UI if not exists, otherwise just update table
    // But simplest is to re-render the whole block

    const minScore = 70; // Default filter value

    resultList.innerHTML = `
        <div style="background: #fff; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <!-- Score Filter -->
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong><i data-lucide="filter"></i> Benzerlik:</strong>
                        <input type="range" id="score-filter" min="50" max="100" value="${minScore}" oninput="updateResultsFilter()" style="width: 120px;">
                        <span id="score-filter-val" style="font-weight: bold; color: var(--primary);">%${minScore}</span>+
                    </div>

                    <!-- Match Type Filter -->
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong>Eşleşme Tipi:</strong>
                        <select id="type-filter" class="form-input" style="padding: 0.25rem 0.5rem; width: auto;" onchange="updateResultsFilter()">
                            <option value="ALL">Tümü</option>
                            <option value="TCKN_NAME_EXACT">✅ TCKN & İsim Eşleşti</option>
                            <option value="TCKN_NAME_SIMILAR">⚠️ TCKN Eşleşti (İsim Benzer)</option>
                            <option value="TCKN">🆔 Sadece TCKN Eşleşti</option>
                            <option value="NAME_EXACT">🎯 İsim Eşleşti</option>
                            <option value="NAME_SIMILAR">ℹ️ İsim Benzerliği</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="downloadResults(window.filteredBulkResults || window.lastBulkResults, 'toplu_tarama')" class="btn btn-primary" style="background-color: #b91c1c; border-color: #991b1b;">
                        <i data-lucide="download"></i> Excel İndir
                    </button>
                </div>
            </div>
            
            <div id="filtered-results-summary" style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-light);">
                <!-- Summary will be updated by JS -->
            </div>
        </div>

        <div id="bulk-results-table-container">
            <!-- Table will be rendered here -->
        </div>
    `;

    // Trigger initial filter
    updateResultsFilter();
    lucide.createIcons();
}

function updateResultsFilter() {
    const scoreVal = document.getElementById('score-filter').value;
    const typeVal = document.getElementById('type-filter').value;

    document.getElementById('score-filter-val').textContent = '%' + scoreVal;

    const threshold = parseInt(scoreVal) / 100;
    const allResults = state.currentBulkResults;

    // Filter results
    const filtered = allResults.filter(r => {
        // 1. Score Filter
        if (r.score < threshold) return false;

        // 2. Type Filter
        if (typeVal === 'ALL') return true;

        // Exact match on type
        if (r.matchType === typeVal) return true;

        // Grouping logic for simpler filters if needed (optional)
        if (typeVal === 'TCKN' && r.matchType.startsWith('TCKN')) return true; // Show all TCKN related if TCKN selected? No, let's be specific.

        return false;
    });

    // Update global filtered results for export
    window.filteredBulkResults = filtered;

    // Update Summary
    const summary = document.getElementById('filtered-results-summary');
    if (summary) {
        summary.innerHTML = `Toplam <strong>${allResults.length}</strong> eşleşmeden <strong>${filtered.length}</strong> tanesi gösteriliyor.`;
    }

    // Reset pagination for filtered results
    state.currentFilteredResults = filtered;
    state.pagination.currentPage = 1;

    renderBulkResultsTable(filtered, 1);
}

function renderBulkResultsTable(results, page) {
    const container = document.getElementById('bulk-results-table-container');

    if (results.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                <i data-lucide="filter-x" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                <p>Bu kriterlere uygun sonuç bulunamadı.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const itemsPerPage = state.pagination.itemsPerPage;
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = results.slice(startIndex, endIndex);

    container.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Aranan İsim</th>
                        <th>Aranan TCKN / VKN</th>
                        <th>Eşleşen İsim</th>
                        <th>Eşleşen TCKN / VKN</th>
                        <th>Eşleşme Durumu</th>
                        <th>Liste & Teyit</th>
                        <th>Benzerlik</th>
                        <th>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageResults.map((r, index) => {
        // Determine Source Link
        let sourceLink = '';
        if (r.list.includes('MASAK')) {
            sourceLink = 'https://masak.hmb.gov.tr/bkk-ile-malvarliklari-dondurulanlar';
        } else if (r.list === 'TR Resmi Gazete' && r.decreeUrl) {
            sourceLink = r.decreeUrl;
        } else if (r.list.includes('UN')) {
            sourceLink = 'https://scsanctions.un.org/search/';
        } else if (r.list.includes('EU')) {
            sourceLink = 'https://www.sanctionsmap.eu/#/main';
        } else if (r.list.includes('OFAC')) {
            sourceLink = 'https://sanctionssearch.ofac.treas.gov/';
        }

        // Match Status Logic
        let tcknStatus = '<span class="badge" style="background: #f1f5f9; color: #64748b;">Kontrol Edilmedi</span>';

        switch (r.matchType) {
            case 'TCKN_NAME_EXACT':
                tcknStatus = '<span class="badge" style="background: #dcfce7; color: #15803d;">✅ TCKN & İsim Eşleşti</span>';
                break;
            case 'TCKN_NAME_SIMILAR':
                tcknStatus = '<span class="badge" style="background: #dcfce7; color: #15803d;">⚠️ TCKN Eşleşti (İsim Benzer)</span>';
                break;
            case 'TCKN':
                tcknStatus = '<span class="badge" style="background: #dcfce7; color: #15803d;">🆔 Sadece TCKN Eşleşti</span>';
                break;
            case 'NAME_EXACT':
                tcknStatus = '<span class="badge" style="background: #dbeafe; color: #1e40af;">🎯 İsim Eşleşti</span>';
                break;
            case 'NAME_SIMILAR':
                tcknStatus = '<span class="badge" style="background: #fef9c3; color: #854d0e;">ℹ️ İsim Benzerliği</span>';
                break;
            default:
                // Fallback for old data or unexpected types
                if (r.matchType === 'TCKN') tcknStatus = '<span class="badge" style="background: #dcfce7; color: #15803d;">✅ TCKN Eşleşti</span>';
                else tcknStatus = '<span class="badge" style="background: #fef9c3; color: #854d0e;">⚠️ İsim Benzerliği</span>';
        }

        // Display Name Logic
        // If query looks like a TCKN (digits only), hide it from Name column
        let displayName = r.query;
        if (/^\d+$/.test(String(r.query).replace(/\s/g, ''))) {
            displayName = '-';
        }

        return `
                        <tr>
                            <td>${displayName}</td>
                            <td><span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${r.queryTckn || r.tckn || '-'}</span></td>
                            <td>${r.matchName || r.match}</td>
                            <td><span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${r.matchTckn || '-'}</span></td>
                            <td>${tcknStatus}</td>
                            <td>
                                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                                    <span class="badge badge-warning">${r.list}</span>
                                    <a href="${sourceLink}" target="_blank" class="btn btn-sm btn-outline-primary" style="font-size: 0.7rem; text-decoration: none; padding: 0.2rem 0.5rem;">
                                        <i data-lucide="external-link" style="width: 10px; height: 10px; vertical-align: middle; margin-right: 3px;"></i> Manuel Teyit Et
                                    </a>
                                </div>
                            </td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                                        <div style="width: ${Math.round(r.score * 100)}%; height: 100%; background: ${r.score > 0.9 ? '#16a34a' : '#ca8a04'};"></div>
                                    </div>
                                    <span style="font-weight: 600; color: ${r.score > 0.9 ? '#16a34a' : '#ca8a04'};">%${Math.round(r.score * 100)}</span>
                                </div>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="showDetailsModal(${startIndex + index}, 'bulk_filtered')" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                                    <i data-lucide="info" style="width: 12px; height: 12px; margin-right: 0.25rem;"></i> Detay
                                </button>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
        
        ${totalPages > 1 ? `
            <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">
                <button class="btn btn-secondary" onclick="changeBulkPage(${page - 1})" ${page === 1 ? 'disabled' : ''} style="padding: 0.5rem 1rem;">
                    <i data-lucide="chevron-left"></i> Önceki
                <span style="padding: 0.5rem 1rem; background: #f8fafc; border-radius: 0.5rem; font-weight: 600;">
                    Sayfa ${page} / ${totalPages}
                </span>
                <button class="btn btn-secondary" onclick="changeBulkPage(${page + 1})" ${page === totalPages ? 'disabled' : ''} style="padding: 0.5rem 1rem;">
                    Sonraki <i data-lucide="chevron-right"></i>
                </button>
            </div>
        ` : ''}
    `;
    lucide.createIcons();
}

function changeBulkPage(page) {
    const results = state.currentFilteredResults || state.currentBulkResults;
    const totalPages = Math.ceil(results.length / state.pagination.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    state.pagination.currentPage = page;
    renderBulkResultsTable(results, page);
}

// --- Helper Functions ---

function linkify(text) {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return `<a href="${url}" target="_blank" style="color: var(--primary); text-decoration: underline;">${url}</a>`;
    });
}

// --- Modal Functions ---

function addDetailsModal() {
    // Eğer modal zaten varsa (index.html'den) sadece event listener'ları ekle
    let existingModal = document.getElementById('details-modal');

    if (!existingModal) {
        const modalHTML = `
            <div id="details-modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center;">
                <div style="background-color: #fefefe; margin: 5% auto; padding: 2rem; border-radius: 0.75rem; width: 90%; max-width: 700px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); position: relative; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: var(--primary);">Kişi Detayları</h2>
                        <button id="close-modal-btn" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--text-light); line-height: 1;">&times;</button>
                    </div>
                    <div id="modal-content"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // modal-content veya details-content id'sini bul
    const modalContent = document.getElementById('modal-content') || document.getElementById('details-content');
    const closeBtn = document.getElementById('close-modal-btn');

    // Event listener'ları ekle (varsa)
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDetailsModal);
    }

    // Close on outside click
    const modal = document.getElementById('details-modal');
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeDetailsModal();
            }
        });
    }
}

function showDetailsModal(index, type) {
    let results;
    if (type === 'manual') {
        results = state.currentManualResults;
    } else if (type === 'bulk_filtered') {
        results = state.currentFilteredResults || state.currentBulkResults;
    } else {
        results = state.currentBulkResults;
    }

    const record = results[index];

    if (!record) return;

    // Sorgu logu ekle
    addSystemLog('Tarama detay görüntüleme', `${record.query || record.queryName || '-'} → ${record.match || record.matchName || '-'} (${record.list || record.matchList || '-'})`, 'scan');

    const modal = document.getElementById('details-modal');
    const content = document.getElementById('modal-content') || document.getElementById('details-content');

    // 1. Extract Standard Fields if they exist
    const standardFields = [
        { key: 'program', label: 'Yaptırım Programı', icon: 'shield-alert' },
        { key: 'nationality', label: 'Uyruk', icon: 'flag' },
        { key: 'dob', label: 'Doğum Tarihi', icon: 'calendar' },
        { key: 'pob', label: 'Doğum Yeri', icon: 'map-pin' },
        { key: 'passport', label: 'Pasaport / Kimlik No', icon: 'credit-card' },
        { key: 'address', label: 'Adres', icon: 'home' },
        { key: 'alias', label: 'Diğer İsimler / Kod Adları', icon: 'users' },
        { key: 'remarks', label: 'Notlar / Açıklama', icon: 'file-text' }
    ];

    // 2. Parse sourceDetails (for MASAK and others that use it)
    let details = parseDetails(record.sourceDetails || record.details || '');

    // Merge standard fields into details if they are not already there
    standardFields.forEach(field => {
        if (record[field.key] && !details.some(d => d.label === field.label)) {
            details.push({ label: field.label, value: record[field.key], icon: field.icon });
        }
    });

    // 3. Add ALL other properties (Catch-all)
    const knownKeys = new Set([...standardFields.map(f => f.key), 'score', 'matchType', 'queryName', 'queryTckn', 'matchName', 'matchTckn', 'matchList', 'query', 'match', 'list', 'tckn', 'sourceDetails', 'details', 'decreeUrl', 'name', 'type']);

    Object.keys(record).forEach(key => {
        if (knownKeys.has(key)) return;
        // Skip if already in details
        if (details.some(d => d.label === key)) return;

        const value = record[key];
        if (value && typeof value !== 'object') {
            details.push({ label: key, value: String(value), icon: 'info' });
        }
    });

    // 4. Deduplicate Details
    const uniqueDetails = [];
    const seenValues = new Set();

    details.forEach(d => {
        const key = `${d.label}:${d.value}`;
        if (!seenValues.has(key)) {
            seenValues.add(key);
            uniqueDetails.push(d);
        }
    });
    details = uniqueDetails;

    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Comparison Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <!-- Left: Query -->
                <div style="padding: 1rem; background: #f8fafc; border: 1px solid var(--border); border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Aranan (Sorgu)</div>
                    
                    <div style="margin-bottom: 0.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-light);">İsim / Ünvan</div>
                        <div style="font-weight: 600; color: var(--text-main);">${record.queryName || '-'}</div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-light);">TCKN / VKN</div>
                        <div style="font-family: monospace; font-weight: 600; color: var(--text-main);">${record.queryTckn || '-'}</div>
                    </div>
                </div>

                <!-- Right: Match -->
                <div style="padding: 1rem; background: ${record.score >= 0.9 ? '#f0fdf4' : '#fefce8'}; border: 1px solid ${record.score >= 0.9 ? '#bbf7d0' : '#fef08a'}; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Eşleşen Kayıt</div>
                    
                    <div style="margin-bottom: 0.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-light);">İsim / Ünvan</div>
                        <div style="font-weight: 700; color: var(--text-main);">${record.matchName || record.match}</div>
                    </div>

                    ${record.matchTckn ? `
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-light);">TCKN / VKN</div>
                        <div style="font-family: monospace; font-weight: 700; color: var(--text-main);">${record.matchTckn}</div>
                    </div>
                    ` : ''}

                    <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                         <span class="badge badge-warning">${record.matchList || record.list}</span>
                         <span style="font-weight: 700; color: ${record.score >= 0.9 ? 'green' : 'orange'};">%${Math.round(record.score * 100)}</span>
                    </div>
                </div>
            </div>

            <!-- Detailed Fields (from Source) -->
            <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                 <h4 style="font-size: 1rem; margin-bottom: 1rem;">Detaylı Bilgiler</h4>
                 <div style="display: grid; grid-template-columns: 1fr; gap: 0.75rem;">
                    ${details.map(detail => `
                        <div style="padding: 0.75rem; background: #fff; border: 1px solid var(--border); border-radius: 0.5rem;">
                            <div style="font-size: 0.8rem; color: var(--text-light); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                ${detail.icon ? `<i data-lucide="${detail.icon}" style="width: 14px; height: 14px;"></i>` : ''}
                                ${detail.label}
                            </div>
                            <div style="font-weight: 500; color: var(--text-main); word-break: break-word;">${detail.value}</div>
                        </div>
                    `).join('')}
                 </div>
            </div>
            
            <!-- Sorgu Geçmişi -->
            ${renderScanQueryHistory(record.queryName || record.query || record.matchName || record.match)}
        </div>
    `;

    modal.style.display = 'flex';
    lucide.createIcons();
}

function parseDetails(detailsString) {
    const details = [];
    if (!detailsString) return details;

    const lines = detailsString.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);

    lines.forEach(line => {
        // Common labels mapping to icons
        let icon = null;
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('doğum') || lowerLine.includes('dob')) icon = 'calendar';
        else if (lowerLine.includes('yer') || lowerLine.includes('pob') || lowerLine.includes('adres')) icon = 'map-pin';
        else if (lowerLine.includes('uyruk') || lowerLine.includes('nationality')) icon = 'flag';
        else if (lowerLine.includes('anne') || lowerLine.includes('baba')) icon = 'users';
        else if (lowerLine.includes('karar') || lowerLine.includes('decree')) icon = 'file-text';
        else if (lowerLine.includes('örgüt') || lowerLine.includes('org')) icon = 'shield-alert';

        // If line has a colon, split into label and value
        if (line.includes(':')) {
            const parts = line.split(':');
            const label = parts[0].trim();
            const value = parts.slice(1).join(':').trim();

            if (label && value) {
                details.push({ label: label, value: value, icon: icon });
            }
        } else if (line.length > 0 && line !== '-') {
            // If no colon, add as general info
            details.push({ label: 'Bilgi', value: line, icon: 'info' });
        }
    });

    return details;
}

function renderScanQueryHistory(queryName) {
    if (!queryName) return '';

    // Filter past results for this name
    const history = state.scanResults.filter(r =>
        (r.queryName && r.queryName.toLowerCase() === queryName.toLowerCase()) ||
        (r.query && r.query.toLowerCase() === queryName.toLowerCase())
    );

    if (history.length <= 1) return ''; // Don't show if this is the only one

    return `
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <h4 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-light);">Bu isimle yapılan önceki taramalar</h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${history.map(h => `
                    <div style="font-size: 0.85rem; display: flex; justify-content: space-between; color: var(--text-light);">
                        <span>${new Date(h.date).toLocaleDateString('tr-TR')}</span>
                        <span>%${Math.round(h.score * 100)} Eşleşme</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}
