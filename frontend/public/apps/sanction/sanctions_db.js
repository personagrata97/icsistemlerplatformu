// Sanctions Database Mock

const SanctionsDB = {
    data: [],

    loadData: async function () {
        this.data = [];

        // 1. Load Global Data (UN, EU, OFAC, TR Official Gazette)
        if (window.SANCTIONS_DATA) {
            this.data = this.data.concat(window.SANCTIONS_DATA);
            this.lastUpdated = window.SANCTIONS_META ? window.SANCTIONS_META.lastUpdated : 'Bilinmiyor';
            console.log("Loaded global data:", window.SANCTIONS_DATA.length);
        }

        // 1.5 Load MASAK Data (from auto-update script)
        if (window.MASAK_DATA) {
            this.data = this.data.concat(window.MASAK_DATA);
            console.log("Loaded MASAK data:", window.MASAK_DATA.length);
        }

        // 2. Load Local MASAK Data
        try {
            const localMasakData = localStorage.getItem('MASAK_LOCAL_DATA');
            if (localMasakData) {
                const parsedData = JSON.parse(localMasakData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    this.data = this.data.concat(parsedData);
                    console.log("Loaded local MASAK data:", parsedData.length);
                }
            }
        } catch (e) {
            console.error("Error loading local MASAK data:", e);
        }

        if (this.data.length === 0) {
            console.warn("No data found, using fallback");
            this.data = [
                { name: "Osama Bin Laden", list: "UN Consolidated (Mock)", type: "Individual" },
                { name: "Vladimir Putin", list: "OFAC SDN (Mock)", type: "Individual" }
            ];
            this.lastUpdated = 'Mock Data';
        }
    },

    // Improved Search Algorithm
    search: function (query) {
        const results = [];
        const threshold = 0.70; // Lowered to 0.70 to catch more potential matches

        // 0. Pre-process Query
        const rawQuery = query.trim();

        // 1. TCKN / VKN Search (Exact Match in any part)
        // Check if query is numeric and 10-11 digits
        if (/^\d{10,11}$/.test(rawQuery)) {
            this.data.forEach(item => {
                // Check for exact match in item.tckn (handling if tckn is a string or array/list)
                if (item.tckn) {
                    const itemTckn = String(item.tckn);
                    // Split by non-digit characters to handle cases like "12345678901 / 9876543210"
                    const tcknParts = itemTckn.split(/[^0-9]+/).filter(p => p.length >= 10); // Filter for valid lengths

                    if (tcknParts.includes(rawQuery)) {
                        results.push({ ...item, score: 1.0 });
                    }
                }
            });
            // If TCKN match found, return immediately (high confidence)
            if (results.length > 0) return results;
        }

        // 2. Name Search
        // Use Turkish locale for correct lowercasing (I -> ı, İ -> i)
        const q = this.normalizeString(query.toLocaleLowerCase('tr-TR'));
        const qTokens = q.split(/\s+/).filter(t => t.length > 0);

        if (qTokens.length === 0) return [];

        this.data.forEach(item => {
            const itemName = this.normalizeString((item.name || '').toLocaleLowerCase('tr-TR'));

            // A. Exact Match (100%)
            if (itemName === q) {
                results.push({ ...item, score: 1.0 });
                return;
            }

            const itemTokens = itemName.split(/\s+/).filter(t => t.length > 0);

            // B. Token-based Similarity (Weighted)
            let totalMatchScore = 0;
            const usedItemIndices = new Set();

            qTokens.forEach(qt => {
                let bestMatchIdx = -1;
                let bestScore = 0;

                itemTokens.forEach((it, idx) => {
                    if (usedItemIndices.has(idx)) return;

                    // Exact token match
                    if (qt === it) {
                        bestMatchIdx = idx;
                        bestScore = 1.0;
                        return;
                    }

                    // Fuzzy token match (Levenshtein)
                    if (Math.abs(qt.length - it.length) <= 2) {
                        const dist = this.editDistance(qt, it);
                        const allowed = qt.length > 6 ? 2 : (qt.length > 3 ? 1 : 0);

                        if (dist <= allowed) {
                            // Calculate score based on distance
                            // 1 distance -> 0.85
                            // 2 distance -> 0.70
                            const score = 1.0 - (dist * 0.15);
                            if (score > bestScore) {
                                bestMatchIdx = idx;
                                bestScore = score;
                            }
                        }
                    }

                    // Prefix match (e.g. "Ahme" matches "Ahmet")
                    if (it.startsWith(qt) && qt.length >= 4) {
                        const score = 0.80; // Prefix match score
                        if (score > bestScore) {
                            bestMatchIdx = idx;
                            bestScore = score;
                        }
                    }
                });

                if (bestMatchIdx !== -1) {
                    totalMatchScore += bestScore;
                    usedItemIndices.add(bestMatchIdx);
                }
            });

            // Calculate Final Score
            // Average of (Matched Score / Query Tokens) and (Matched Score / Item Tokens)
            // This penalizes both missing tokens in query and extra tokens in item
            let score = (2 * totalMatchScore) / (qTokens.length + itemTokens.length);

            // C. Boost logic
            // If all query tokens matched exactly (or very high), but item has extra tokens (e.g. middle name)
            // "Ahmet Yılmaz" vs "Ahmet Can Yılmaz" -> Should be high
            if (totalMatchScore >= qTokens.length * 0.9 && qTokens.length > 1) {
                // Boost but don't make it 1.0
                score = Math.max(score, 0.90);
            }

            // If exact token match but different order
            if (totalMatchScore === qTokens.length && qTokens.length === itemTokens.length) {
                score = 0.95;
            }

            if (score >= threshold) {
                results.push({
                    ...item,
                    score: score
                });
            }
        });

        return results.sort((a, b) => b.score - a.score).slice(0, 50);
    },

    // Helper: Calculate similarity between two strings (0 to 1)
    calculateSimilarity: function (s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;
        if (longerLength === 0) {
            return 1.0;
        }
        return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
    },

    editDistance: function (s1, s2) {
        const costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue),
                                costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    },

    // Helper: Normalize Turkish characters and remove punctuation
    normalizeString: function (str) {
        if (!str) return "";
        // Normalize Turkish characters to English equivalents for fuzzy matching
        // Note: Input is expected to be lowercased with tr-TR locale already (ı, i, ü, ö, ç, ş, ğ)
        let s = str
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c");

        // Remove non-alphanumeric characters (keep spaces)
        return s.replace(/[^a-z0-9\s]/g, "");
    },
};
