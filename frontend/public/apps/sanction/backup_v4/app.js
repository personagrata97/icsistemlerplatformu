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
    // Active Data Sources (Persisted in LocalStorage)
    activeSources: JSON.parse(localStorage.getItem('ACTIVE_SOURCES')) || {
        UN: true,
        EU: true,
        OFAC: true,
        TR: true, // Resmi Gazete
        MASAK: true
    }
};

function toggleSource(source) {
    state.activeSources[source] = !state.activeSources[source];
    localStorage.setItem('ACTIVE_SOURCES', JSON.stringify(state.activeSources));
    console.log(`Source ${source} toggled: ${state.activeSources[source]}`);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    addDetailsModal();
    renderPage('dashboard');

    // Load Sanctions Data
    try {
        await SanctionsDB.loadData();
        console.log('Sanctions data loaded');
        if (state.currentPage === 'dashboard') {
            renderPage('dashboard');
        }
    } catch (e) {
        console.error('Failed to load sanctions data', e);
    }
});

// --- Navigation & Routing ---

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) {
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
        'dashboard': 'Dashboard',
        'scan': 'Tarama Yap',
        'results': 'Tarama Sonuçları',
        'settings': 'Ayarlar'
    };
    pageTitle.textContent = titles[page] || 'Sanction Scanner';

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
                <h3>Resmi Gazete - Son Kararlar (1 Yıl)</h3>
                <div style="margin-top: 1rem; max-height: 200px; overflow-y: auto;">
                    ${decrees.length > 0 ? `
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
                    ` : '<p style="color: var(--text-light);">Son 1 yılda ilgili karar bulunamadı.</p>'}
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

function renderSettingsPage() {
    const masakData = localStorage.getItem('MASAK_LOCAL_DATA');
    const masakCount = masakData ? JSON.parse(masakData).length : 0;
    const masakLastUpdate = localStorage.getItem('MASAK_LAST_UPDATE') || '-';

    return `
        <div class="card">
            <h3>Veri Kaynakları ve Ayarlar</h3>
            <p style="color: var(--text-light); margin-bottom: 1.5rem;">Tarama yapılacak kaynakları buradan yönetebilirsiniz.</p>

            <!-- MASAK Upload Section (MOVED TO TOP) -->
            <div style="padding: 1rem; border: 1px solid var(--primary); background-color: #f0fdf4; border-radius: 0.5rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <strong style="color: var(--primary);">MASAK Veri Yükleme (Manuel)</strong>
                            <label class="switch" style="transform: scale(0.8);">
                                <input type="checkbox" ${state.activeSources.MASAK ? 'checked' : ''} onchange="toggleSource('MASAK')">
                                    <span class="slider round"></span>
                            </label>
                        </div>
                        <p style="font-size: 0.8rem; color: var(--text-light);">İndirdiğiniz CSV dosyalarını buradan yükleyerek veritabanına ekleyin.</p>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem;">
                            Durum: <strong>${masakCount > 0 ? '✅ Yüklü' : '❌ Yüklü Değil'}</strong>
                            (${masakCount} Kayıt) - Son Güncelleme: ${masakLastUpdate}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="localStorage.removeItem('MASAK_LOCAL_DATA'); localStorage.removeItem('MASAK_LAST_UPDATE'); window.location.reload();" style="border: 1px solid var(--danger); color: var(--danger);">
                        Verileri Temizle
                    </button>
                </div>

                <div class="file-upload-wrapper" style="height: 100px;">
                    <input type="file" id="masak-upload" class="file-upload-input" accept=".csv" multiple onchange="handleMasakUpload(this)">
                    <div class="file-upload-label" style="padding: 1rem;">
                        <i data-lucide="upload" class="file-upload-icon" style="width: 24px; height: 24px;"></i>
                        <span class="file-upload-text">MASAK CSV dosyalarını seçin (Çoklu seçim yapabilirsiniz)</span>
                    </div>
                </div>
                <div id="masak-upload-status" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>TR Resmi Gazete</strong>
                    <p style="font-size: 0.8rem; color: var(--text-light);">Malvarlığı Dondurma Kararları</p>
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

        statusDiv.innerHTML = `<span style="color: var(--success);">✅ Tamamlandı: ${results.length} eşleşme bulundu.</span>`;
        renderBulkResults(results);

    } catch (e) {
        console.error("Error:", e);
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
            "Ahmet Yılmaz",
            "Ayşe Demir",
            "ABC Lojistik A.Ş.",
            "Osama Bin Laden", // Test match
            "Vladimir Putin", // Test match
            "XYZ Tekstil Ltd. Şti."
        ];

        statusDiv.innerHTML = `<span style="color: var(--success);">CRM'den ${mockCrmData.length} müşteri çekildi. Tarama yapılıyor...</span>`;

        // Perform Scan
        const results = await performBulkScanAsync(mockCrmData, (progress) => {
            // Simple progress for CRM mock
        });
        renderBulkResults(results);

    } catch (e) {
        statusDiv.innerHTML = `<span style="color: var(--danger);">CRM Bağlantı Hatası: ${e.message}</span>`;
    }
}

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
                    if (rowStr.includes('AD') || rowStr.includes('İSİM') || rowStr.includes('NAME') || rowStr.includes('UNVAN')) {
                        headerRowIdx = i;

                        // Map columns
                        row.forEach((cell, idx) => {
                            const c = String(cell).toUpperCase().trim();
                            if (c.includes('AD') || c.includes('İSİM') || c.includes('NAME') || c.includes('UNVAN') || c.includes('MÜŞTERİ')) {
                                if (colMap.name === -1) colMap.name = idx;
                            }
                            if (c.includes('TCKN') || c.includes('VKN') || c.includes('KİMLİK') || c.includes('VERGİ') || c.includes('TC NO')) {
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
                        let tckn = colMap.tckn !== -1 && row[colMap.tckn] ? String(row[colMap.tckn]).replace(/\D/g, '') : null;

                        // Validate TCKN length
                        if (tckn && (tckn.length < 10 || tckn.length > 11)) tckn = null;

                        if (name.length > 1) {
                            parsedData.push({ name, tckn });
                        }
                    }
                } else {
                    // Fallback: Flatten all cells (Legacy Mode)
                    // But try to detect TCKN-like strings in cells
                    json.forEach(row => {
                        if (Array.isArray(row)) {
                            row.forEach(cell => {
                                if (typeof cell === 'string' || typeof cell === 'number') {
                                    const val = String(cell).trim();
                                    // If it looks like a name
                                    if (val.length > 2 && !/^\d+$/.test(val)) {
                                        parsedData.push({ name: val, tckn: null });
                                    }
                                    // Note: In flat mode, we can't easily associate TCKN with Name unless they are adjacent.
                                    // For now, just extracting names is safer than mixing up data.
                                }
                            });
                        }
                    });
                }

                if (parsedData.length === 0) {
                    throw new Error("Dosyada okunabilir veri bulunamadı.");
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
    const resultList = document.getElementById('manual-scan-results');

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
    const modalHTML = `
        <div id="details-modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
            <div style="background-color: #fefefe; margin: 5% auto; padding: 2rem; border-radius: 0.75rem; width: 90%; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: var(--primary);">Kişi Detayları</h2>
                    <button id="close-modal-btn" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--text-light); line-height: 1;">&times;</button>
                </div>
                <div id="modal-content"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add Event Listener
    document.getElementById('close-modal-btn').addEventListener('click', closeDetailsModal);

    // Close on outside click
    const modal = document.getElementById('details-modal');
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeDetailsModal();
        }
    });
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

    const modal = document.getElementById('details-modal');
    const content = document.getElementById('modal-content');

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
        </div>
    `;

    modal.style.display = 'block';
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

function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    addDetailsModal();

    // Load Data
    await SanctionsDB.loadData();

    // Initial Render
    renderPage('dashboard');
});
